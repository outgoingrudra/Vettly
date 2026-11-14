import React,{useEffect,useState} from 'react';
import {StreamVideoClient,StreamVideo,StreamCall,StreamTheme,SpeakerLayout,CallControls,hasAudio,hasVideo,useCallStateHooks} from '@stream-io/video-react-sdk';
import '@stream-io/video-react-sdk/dist/css/styles.css';
import './candidate.css';
import {request} from '../../api';
const JOIN_RESPONSE_TIMEOUT_MS = 15_000;

function connectionError(failure) {
  const message = failure?.message || '';
  if (/SFU WS connection failed|SfuTimeoutError|Signaling WS channel error|joinResponse.*timed out/i.test(message)) {
    return {
      title: 'Video server connection timed out',
      detail: 'Your browser could not reach Stream’s video server. Check your connection or try another network, then retry.',
      network: true,
    };
  }
  return { title: 'Could not join the video room', detail: message || 'Please try again.', network: false };
}

function CallCameraMonitor({ onChange }) {
  const { useCameraState } = useCallStateHooks();
  const { isMute } = useCameraState({ optimisticUpdates: false });
  useEffect(() => {
    onChange(isMute);
    return () => onChange(null);
  }, [isMute, onChange]);
  return null;
}

function RoomParticipants() {
  const dialog = React.useRef(null);
  const { useParticipants, useLocalParticipant } = useCallStateHooks();
  const participants = useParticipants();
  const localParticipant = useLocalParticipant();

  return (
    <>
      <button className="meeting-tool" type="button" aria-haspopup="dialog" onClick={() => dialog.current.showModal()}>People ({participants.length})</button>
      <dialog className="meeting-details room-participants" ref={dialog} aria-label="People in the room">
      <header><h2>People in the room</h2><button type="button" onClick={() => dialog.current.close()}>Close</button></header>
      <ul>
        {participants.map(person => (
          <li key={person.sessionId}>
            <span className="participant-initial" aria-hidden="true">
              {Array.from(person.name?.trim() || 'P')[0].toUpperCase()}
            </span>
            <strong>
              {person.name || 'Participant'}
              {person.sessionId === localParticipant?.sessionId && ' (you)'}
            </strong>
            <span className="participant-devices">{hasAudio(person) ? 'Mic on' : 'Mic off'} · {hasVideo(person) ? 'Camera on' : 'Camera off'}</span>
          </li>
        ))}
      </ul>
      </dialog>
    </>
  );
}

export default function VideoRoom({id, onEnded, onCameraChange, onLeaveRoom}) {
  const [ended,setEnded]=useState(false);
  const [left,setLeft]=useState(false);
  const [session,setSession]=useState(null),[error,setError]=useState(''),[retry,setRetry]=useState(0);
  useEffect(()=>{
    if(left || ended)return;
    let cancelled=false,client,call,cleanup;
    function disconnect() {
      if (!cleanup) {
        cleanup = (async () => {
          await call?.leave().catch(() => {});
          await client?.disconnectUser().catch(() => {});
        })();
      }
      return cleanup;
    }
    async function connect(){
      if (!window.isSecureContext || !navigator.mediaDevices) {
        throw new Error('Video needs a secure browser connection and camera access. Use HTTPS or localhost.');
      }
      const token=async()=>(await request('/stream/'+id+'/token',{})).data;
      const data=await token();
      if(cancelled)return;
      client=new StreamVideoClient({apiKey:data.apiKey,user:data.user,token:data.token,tokenProvider:async()=>(await token()).token});
      call=client.call('default',data.callId);
      call.on('call.ended', () => {
        if (cancelled) return;
        setEnded(true);
        onEnded?.(true);
      });
      // Start muted. Navigating away during device setup must also cancel the join.
      await call.camera.disable();
      if (cancelled) return;
      await call.microphone.disable();
      if (cancelled) return;
      await call.join({create: false, joinResponseTimeout: JOIN_RESPONSE_TIMEOUT_MS});
      if (!cancelled) setSession({client, call});
    }
    connect().catch(async failure=>{
      await disconnect();
      if(!cancelled)setError(connectionError(failure));
    });
    return ()=>{cancelled=true;void disconnect();};
  },[id,retry,left,ended,onEnded]);
  if(ended)return <div className="room-placeholder" role="status">The host ended the video meeting.</div>;
  if(left)return <div className="room-placeholder"><h2>You left the video room</h2><button className="action" onClick={()=>setLeft(false)}>Rejoin room</button></div>;
  if(error)return <div className="room-placeholder" role="alert">
    <h2>{error.title}</h2><p>{error.detail}</p>
    <div className="room-recovery">
      <button type="button" onClick={()=>{setError('');setRetry(x=>x+1)}}>Retry video</button>
      {error.network && <a href="https://getstream.io/video/demos/test" target="_blank" rel="noopener noreferrer">Test your connection ↗</a>}
    </div>
  </div>;
  if(!session)return <p className="room-placeholder" role="status">Connecting to the live room…</p>;
  return <section className="video-session">
    <StreamVideo client={session.client}>
      <StreamCall call={session.call}>
        {onCameraChange && <CallCameraMonitor onChange={onCameraChange}/>}
        <StreamTheme className="meeting-video">
          <div className="video-room">
            <SpeakerLayout/>
            <div className="meeting-controls">
              <RoomParticipants/>
                <CallControls onLeave={failure => {
                  if (failure) { setError(connectionError(failure)); return; }
                  setSession(null);
                  setLeft(true);
                  if (onLeaveRoom) onLeaveRoom();
                  else if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
                }}/>
              <button className="meeting-tool" type="button" onClick={() => {
                setSession(null);
                setRetry(value => value + 1);
              }}>Reconnect</button>
            </div>
          </div>
        </StreamTheme>
      </StreamCall>
    </StreamVideo>
  </section>;
}

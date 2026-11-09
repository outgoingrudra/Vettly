import React,{useEffect,useState} from 'react';
import {StreamVideoClient,StreamVideo,StreamCall,StreamTheme,SpeakerLayout,CallControls} from '@stream-io/video-react-sdk';
import '@stream-io/video-react-sdk/dist/css/styles.css';
import {request} from '../../api';

export default function VideoRoom({id}) {
  const [session,setSession]=useState(null),[error,setError]=useState(''),[retry,setRetry]=useState(0);
  useEffect(()=>{
    let cancelled=false,client,call;
    async function connect(){
      if (!window.isSecureContext || !navigator.mediaDevices) {
        throw new Error('Video needs a secure browser connection and camera access. Use HTTPS or localhost.');
      }
      const token=async()=>(await request('/stream/'+id+'/token',{})).data;
      const data=await token();
      if(cancelled)return;
      client=new StreamVideoClient({apiKey:data.apiKey,user:data.user,token:data.token,tokenProvider:async()=>(await token()).token});
      call=client.call('default',data.callId);
      await call.join({create:false});
      if(!cancelled)setSession({client,call});
    }
    const pending=connect().catch(failure=>{
      if(cancelled)return;
      setError(failure?.message || 'Could not connect to the video room.');
    });
    return ()=>{cancelled=true;pending.finally(async()=>{await call?.leave().catch(()=>{});await client?.disconnectUser().catch(()=>{});});};
  },[id,retry]);
  if(error)return <p role="alert">{error} <button onClick={()=>{setError('');setRetry(x=>x+1)}}>Retry video</button></p>;
  if(!session)return <p role="status">Connecting to the live room…</p>;
  return <StreamVideo client={session.client}><StreamCall call={session.call}><StreamTheme><div className="video-room"><SpeakerLayout/><CallControls/></div></StreamTheme></StreamCall></StreamVideo>;
}

// The same local camera stream feeds both landmark models. Only event types leave this module.
const wasm = 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.22-rc.20250304/wasm';
const models = 'https://storage.googleapis.com/mediapipe-models/';

export function needsCamera(settings) {
  return settings.faceDetectionEnabled || settings.multipleFaceDetectionEnabled ||
    settings.suspiciousGestureDetectionEnabled || settings.cameraDisconnectDetectionEnabled;
}

export async function prepareCamera(settings) {
  if (!needsCamera(settings)) return null;
  if (!navigator.mediaDevices?.getUserMedia) {
    throw new Error('Camera access requires HTTPS or localhost in a supported browser.');
  }
  let stream;
  try {
    stream = await navigator.mediaDevices.getUserMedia({video:{width:{ideal:640},height:{ideal:480}}, audio:false});
  } catch (error) {
    if (error.name === 'NotAllowedError' || error.name === 'SecurityError')
      throw new Error('Camera permission was blocked for this page. Check the browser site settings.');
    if (error.name === 'NotFoundError')
      throw new Error('No camera was found. Connect a camera and try again.');
    if (error.name === 'NotReadableError')
      throw new Error('The camera is busy or unavailable. Close other apps using it and try again.');
    throw new Error('The camera could not start: ' + (error.message || error.name));
  }
  const video = document.createElement('video');
  video.muted = true; video.playsInline = true; video.srcObject = stream;
  let face, hand;
  function close() {
    stream.getTracks().forEach(track => track.stop());
    video.pause(); video.srcObject = null;
    face?.close(); hand?.close();
  }
  try {
    try {
      await video.play();
    } catch {
      throw new Error('The camera opened but its preview could not start. Check browser media settings.');
    }
    if(settings.faceDetectionEnabled || settings.multipleFaceDetectionEnabled || settings.suspiciousGestureDetectionEnabled){
      try {
        const { FilesetResolver, FaceLandmarker, HandLandmarker } = await import('@mediapipe/tasks-vision');
        const files = await FilesetResolver.forVisionTasks(wasm);
        if(settings.faceDetectionEnabled || settings.multipleFaceDetectionEnabled) {
          face = await FaceLandmarker.createFromOptions(files,{baseOptions:{modelAssetPath:models+'face_landmarker/face_landmarker/float16/1/face_landmarker.task'},runningMode:'VIDEO',numFaces:2});
        }
        if(settings.suspiciousGestureDetectionEnabled) {
          hand = await HandLandmarker.createFromOptions(files,{baseOptions:{modelAssetPath:models+'hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task'},runningMode:'VIDEO',numHands:2});
        }
      } catch (error) {
        console.error('Camera detection model failed to load:', error);
        throw new Error('Camera opened, but detection models could not load. Check your connection or browser console and retry.');
      }
    }
    return {stream,video,face,hand,close};
  } catch(error) {close();throw error;}
}

export function monitorCamera(camera, settings, report, onError) {
  if(!camera) return ()=>{};
  const samples = new Map(), lastReport = new Map();
  function observe(type, detected, threshold, cooldown=15000) {
    const count = detected ? (samples.get(type)||0)+1 : 0;
    samples.set(type,count);
    if(count>=threshold && Date.now()-(lastReport.get(type)||0)>=cooldown){
      lastReport.set(type,Date.now()); report(type);
    }
  }
  let previousFrame=-1, previousWrist, nextHand=0, lastDirection='';
  let gestureSamples=0, clearSamples=0, waitingForClear=false;
  const track=camera.stream.getVideoTracks()[0];
  const timer=setInterval(()=>{
    if(settings.cameraDisconnectDetectionEnabled) observe('CAMERA_DISCONNECTED',track.readyState==='ended'||track.muted||!track.enabled,2);
    const {video,face,hand}=camera;
    if(document.hidden || video.readyState<2 || video.currentTime===previousFrame){for(const type of ['FACE_MISSING','MULTIPLE_FACES','LOOKING_AWAY','SUSPICIOUS_GESTURE'])samples.delete(type);return;}
    previousFrame=video.currentTime;
    const now=performance.now();
    try {
      if(face){
        const faces=face.detectForVideo(video,now).faceLandmarks;
        if(settings.faceDetectionEnabled) observe('FACE_MISSING',faces.length===0,9);
        if(settings.multipleFaceDetectionEnabled) observe('MULTIPLE_FACES',faces.length>1,5);
        if(settings.faceDetectionEnabled){
          let direction='';
          if(faces.length===1){
            const f=faces[0], eyes=(f[33].x+f[263].x)/2, height=Math.max(.001,f[152].y-f[10].y);
            const yaw=(f[1].x-eyes)/Math.max(.001,Math.abs(f[263].x-f[33].x));
            const pitch=(f[1].y-f[10].y)/height-.52;
            direction=yaw>.15?'right':yaw<-.15?'left':pitch>.14?'down':pitch<-.14?'up':'';
          }
          if(direction!==lastDirection)samples.delete('LOOKING_AWAY');
          lastDirection=direction;observe('LOOKING_AWAY',!!direction,8);
        }
      }
      if(hand && now>=nextHand){
        nextHand=now+700;
        const hands=hand.detectForVideo(video,now).landmarks,wrist=hands[0]?.[0];
        const movement=wrist && previousWrist && Math.hypot(wrist.x-previousWrist.x,wrist.y-previousWrist.y)>.12;
        const highInFrame=wrist && (wrist.y<.45 || hands[0][8].y<.35);
        if(highInFrame && movement){
          clearSamples=0;
          if(!waitingForClear)gestureSamples++;
        }else{
          gestureSamples=Math.max(0,gestureSamples-1);
          if(++clearSamples>=3)waitingForClear=false;
        }
        if(gestureSamples>=4 && !waitingForClear && Date.now()-(lastReport.get('SUSPICIOUS_GESTURE')||0)>=20000){
          report('SUSPICIOUS_GESTURE');
          lastReport.set('SUSPICIOUS_GESTURE',Date.now());
          waitingForClear=true;gestureSamples=0;
        }
        previousWrist=wrist;
      }
    } catch {clearInterval(timer);onError('Camera checks stopped. Reload and resume to reconnect.');}
  },400);
  return ()=>clearInterval(timer);
}

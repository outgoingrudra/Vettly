// The same local camera stream feeds both landmark models. Only event types leave this module.
// Vite emits these files from the installed SDK, keeping its loader and WASM in sync.
function visionRuntime(simd) {
  if (simd) return {
    wasmLoaderPath: new URL('../../../node_modules/@mediapipe/tasks-vision/wasm/vision_wasm_internal.js', import.meta.url).href,
    wasmBinaryPath: new URL('../../../node_modules/@mediapipe/tasks-vision/wasm/vision_wasm_internal.wasm', import.meta.url).href,
  };
  return {
    wasmLoaderPath: new URL('../../../node_modules/@mediapipe/tasks-vision/wasm/vision_wasm_nosimd_internal.js', import.meta.url).href,
    wasmBinaryPath: new URL('../../../node_modules/@mediapipe/tasks-vision/wasm/vision_wasm_nosimd_internal.wasm', import.meta.url).href,
  };
}
export const repeatWarningMs = 15000;
// Consecutive 400 ms samples before the first face warning.
const lookingAwaySamples = 5;
const missingFaceSamples = 4;
const models = import.meta.env.BASE_URL + 'models/';

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
  // Keep the inference video playing when the visible check-in preview unmounts.
  video.setAttribute('aria-hidden', 'true');
  video.style.cssText = 'position:fixed;left:0;bottom:0;width:1px;height:1px;opacity:0;pointer-events:none';
  document.body.appendChild(video);
  let face, hand;
  function close() {
    stream.getTracks().forEach(track => track.stop());
    video.pause(); video.srcObject = null; video.remove();
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
        const files = visionRuntime(await FilesetResolver.isSimdSupported());
        if(settings.faceDetectionEnabled || settings.multipleFaceDetectionEnabled) {
          face = await FaceLandmarker.createFromOptions(files,{baseOptions:{modelAssetPath:models+'face_landmarker.task'},runningMode:'VIDEO',numFaces:2});
        }
        if(settings.suspiciousGestureDetectionEnabled) {
          hand = await HandLandmarker.createFromOptions(files,{baseOptions:{modelAssetPath:models+'hand_landmarker.task'},runningMode:'VIDEO',numHands:2});
        }
        // A successful camera check includes running each enabled model on a real frame.
        const timestamp = performance.now();
        face?.detectForVideo(video, timestamp);
        hand?.detectForVideo(video, timestamp);
      } catch (error) {
        console.error('Camera detection model failed to load:', error);
        throw new Error('The camera opened, but detection could not start. Reload the page and retry the camera check.');
      }
    }
    return {stream,video,face,hand,close};
  } catch(error) {close();throw error;}
}

export function monitorCamera(camera, settings, report, onError, callCamera = {}) {
  if(!camera) return ()=>{};
  const samples = new Map(), lastReport = new Map();
  function observe(type, detected, threshold, cooldown=repeatWarningMs) {
    const count = detected ? (samples.get(type)||0)+1 : 0;
    samples.set(type,count);
    if(count>=threshold && Date.now()-(lastReport.get(type)||0)>=cooldown){
      lastReport.set(type,Date.now()); report(type);
    }
  }
  let previousFrame=-1, previousWrist, nextHand=0, lastDirection='';

  let nextCameraWarning = null;
  let retryInferenceAt = 0;
  const timer=setInterval(()=>{
    if (settings.cameraDisconnectDetectionEnabled) {
      const track = camera.stream.getVideoTracks()[0];
      const off = callCamera.isOff?.() || !track || track.readyState === 'ended' || track.muted || !track.enabled;
      const now = Date.now();
      if (!off) {
        if (nextCameraWarning !== null) callCamera.onNotice?.(false);
        nextCameraWarning = null;
      } else if (nextCameraWarning === null) {
        callCamera.onNotice?.(true);
        nextCameraWarning = now + 4000;
      } else if (now >= nextCameraWarning) {
        callCamera.onNotice?.(false);
        report('CAMERA_DISCONNECTED');
        nextCameraWarning = now + repeatWarningMs;
      }
    }
    const {video,face,hand}=camera;
    if(document.hidden || video.readyState<2){for(const type of ['FACE_MISSING','MULTIPLE_FACES','LOOKING_AWAY','SUSPICIOUS_GESTURE'])samples.delete(type);return;}
    // An unchanged frame is not evidence that the candidate returned to normal.
    if (video.currentTime === previousFrame) return;
    previousFrame=video.currentTime;
    const now=performance.now();
    if (now < retryInferenceAt) return;
    try {
      if(face){
        const faces=face.detectForVideo(video,now).faceLandmarks;
        if(settings.faceDetectionEnabled) observe('FACE_MISSING',faces.length===0,missingFaceSamples);
        if(settings.multipleFaceDetectionEnabled) observe('MULTIPLE_FACES',faces.length>1,5);
        if(settings.faceDetectionEnabled){
          let direction='';
          if(faces.length===1){
            const f=faces[0], eyes=(f[33].x+f[263].x)/2, height=Math.max(.001,f[152].y-f[10].y);
            const yaw=(f[1].x-eyes)/Math.max(.001,Math.abs(f[263].x-f[33].x));
            const pitch=(f[1].y-f[10].y)/height-.52;
            // Require both irises to be displaced to avoid counting a blink or one noisy landmark.
            const irisOffset = (iris, left, right) => (f[iris].x - (f[left].x + f[right].x)/2) /
              Math.max(.001, Math.abs(f[left].x - f[right].x));
            const eyeDirection = (iris, left, right, upper, lower) => {
              if (!f[iris]) return '';
              const width = Math.abs(f[right].x - f[left].x);
              const opening = f[lower].y - f[upper].y;
              if (width < .001 || opening < width * .12) return '';
              const x = irisOffset(iris, left, right);
              const y = (f[iris].y - f[upper].y) / opening;
              if (x > .18) return 'right';
              if (x < -.18) return 'left';
              if (y > .74) return 'down';
              if (y < .26) return 'up';
              return '';
            };
            const leftEye = eyeDirection(468,33,133,159,145);
            const rightEye = eyeDirection(473,362,263,386,374);
            if (yaw > .15 || yaw < -.15) direction = yaw > 0 ? 'right' : 'left';
            else if (pitch > .14 || pitch < -.14) direction = pitch > 0 ? 'down' : 'up';
            else if (leftEye === rightEye) direction = leftEye;
          }
          if(direction!==lastDirection)samples.delete('LOOKING_AWAY');
          lastDirection=direction;observe('LOOKING_AWAY',!!direction,lookingAwaySamples);
        }
      }
      if(hand && now>=nextHand){
        nextHand=now+700;
        const hands=hand.detectForVideo(video,now).landmarks,wrist=hands[0]?.[0];
        const movement=wrist && previousWrist && Math.hypot(wrist.x-previousWrist.x,wrist.y-previousWrist.y)>.12;
        const highInFrame=wrist && (wrist.y<.45 || hands[0][8].y<.35);
        observe('SUSPICIOUS_GESTURE', highInFrame && movement, 4);
        previousWrist=wrist;
      }
    } catch (error) {
      // A temporary inference failure must not disable camera-disconnect monitoring.
      if (!retryInferenceAt) {
        console.error('Camera frame analysis failed:', error);
        onError('Camera analysis was interrupted. Retrying automatically.');
      }
      samples.clear();
      retryInferenceAt = now + 2000;
      return;
    }
    if (retryInferenceAt) onError('');
    retryInferenceAt = 0;
  },400);
  return ()=>clearInterval(timer);
}

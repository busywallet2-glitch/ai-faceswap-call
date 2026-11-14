import { readFileSync, writeFileSync, unlinkSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { tmpdir } from "node:os";
import { join } from "node:path";
import assert from "node:assert/strict";
const html = readFileSync(new URL("../index.html", import.meta.url), "utf8");

assert.match(html, /let cameraStartToken = 0;/,
  "Camera startup must have a session token so late permission results can be discarded.");
const cameraStartupStart = html.indexOf("async function startCamera() {");
const cameraStartupEnd = html.indexOf("function getPixelPoints(", cameraStartupStart);
assert.ok(cameraStartupStart >= 0 && cameraStartupEnd > cameraStartupStart,
  "Camera startup must remain independently inspectable.");
const cameraSessionGuardSource = html.slice(cameraStartupStart, cameraStartupEnd);
assert.ok(cameraSessionGuardSource.includes("const startToken = ++cameraStartToken;"),
  "Every camera startup must receive a unique session token.");
assert.match(cameraSessionGuardSource, /if \(startToken !== cameraStartToken\) \{[\s\S]*?acquiredCameraStream\.getTracks\(\)\.forEach\(track => track\.stop\(\)\);[\s\S]*?return;/,
  "A camera stream granted after its session was cancelled must have every track stopped.");
assert.match(cameraSessionGuardSource, /startToken !== cameraStartToken \|\| cameraStream !== activeCameraStream/,
  "A stale camera startup must not continue after camera playback or tracker loading.");
const stopCameraStart = html.indexOf("function stopCamera() {");
assert.ok(stopCameraStart >= 0 && /cameraStartToken \+= 1;/.test(html.slice(stopCameraStart, stopCameraStart + 180)),
  "Stopping the camera must invalidate any pending permission request.");

const moduleScript = html.match(/<script type="module">([\s\S]*?)<\/script>/);
assert.ok(moduleScript, "The app must include its browser module script.");
const syntaxPath = join(tmpdir(), `busywallet-app-syntax-${process.pid}.mjs`);
writeFileSync(syntaxPath, moduleScript[1], "utf8");
const syntaxCheck = spawnSync(process.execPath, ["--check", syntaxPath], { encoding: "utf8" });
unlinkSync(syntaxPath);
assert.equal(
  syntaxCheck.status,
  0,
  `The browser module must parse as valid JavaScript.\\n${syntaxCheck.stderr || syntaxCheck.stdout}`
);

const poseSmoothingStart = html.indexOf("function smoothPoseLandmarks(current, previous) {");
const poseSmoothingEnd = html.indexOf("\n    function updateBodySegmentationMask", poseSmoothingStart);
assert.ok(
  poseSmoothingStart >= 0 && poseSmoothingEnd > poseSmoothingStart,
  "The pose smoothing helper must remain independently testable."
);
const poseSmoothingSource = html.slice(poseSmoothingStart, poseSmoothingEnd);
const poseSmoothingBody = poseSmoothingSource.slice(
  poseSmoothingSource.indexOf("{") + 1,
  poseSmoothingSource.lastIndexOf("}")
);
const smoothPoseLandmarks = new Function("current", "previous", poseSmoothingBody);
const firstPose = [
  { x: 0.2, y: 0.3, visibility: 0.9 },
  { x: 0.7, y: 0.6, visibility: 0.9 }
];
const seededPose = smoothPoseLandmarks(firstPose, null);
assert.notEqual(seededPose[0], firstPose[0], "Initial landmarks must be copied, not mutated.");
const movedPose = [
  { x: 0.8, y: 0.7, visibility: 0.9 },
  { x: 0.6, y: 0.5, visibility: 0.9 }
];
const filteredPose = smoothPoseLandmarks(movedPose, seededPose);
assert.ok(filteredPose[0].x > seededPose[0].x && filteredPose[0].x < movedPose[0].x,
  "Reliable joint movement must be smoothed instead of jumping directly.");
const weakPose = [
  { x: 0.99, y: 0.99, visibility: 0.05 },
  { x: 0.01, y: 0.01, visibility: 0.05 }
];
const heldPose = smoothPoseLandmarks(weakPose, filteredPose);
assert.equal(heldPose[0].x, filteredPose[0].x,
  "Low-confidence joint readings must not move a stable landmark.");



const liveMicrophoneMatch = html.match(
  /function getLiveMicrophoneTrack\(stream\) \{([\s\S]*?)\n    \}/
);
assert.ok(liveMicrophoneMatch, "Call setup must expose a testable live-microphone check.");
const getLiveMicrophoneTrack = new Function("stream", liveMicrophoneMatch[1]);
const liveMicrophone = { readyState: "live" };
assert.equal(
  getLiveMicrophoneTrack({ getAudioTracks: () => [{ readyState: "ended" }, liveMicrophone] }),
  liveMicrophone,
  "Call setup must select a live microphone track and ignore ended tracks."
);
assert.equal(
  getLiveMicrophoneTrack({ getAudioTracks: () => [{ readyState: "ended" }] }),
  null,
  "An ended microphone track must not qualify a call as audio-ready."
);
assert.equal(getLiveMicrophoneTrack(null), null, "A missing camera stream must not qualify as audio-ready.");

const callSetupSource = html.slice(
  html.indexOf("async function ensureProcessedStream()"),
  html.indexOf("function closeActiveCall()")
);
assert.ok(
  /if \(!getLiveMicrophoneTrack\(cameraStream\)\)[\s\S]*?return null;/.test(callSetupSource),
  "Calls must be blocked while microphone permission is pending or the microphone track has ended."
);
assert.ok(
  /Microphone access is pending or unavailable\. Allow microphone access before starting or answering a call\./.test(callSetupSource),
  "The call flow must explain how to restore microphone access."
);
assert.ok(
  /track\.addEventListener\("ended", \(\) => \{[\s\S]*?processedStream\?\.removeTrack\(audioTrack\)[\s\S]*?audioSender\.replaceTrack\(null\)/.test(html),
  "A disconnected microphone must be removed from the processed call stream and detached from the active sender."
);
const cameraReadyStatusIndex = html.lastIndexOf(
  'status.textContent = "Camera and face tracking are ready. Looking for a face...";'
);
const microphoneReadyGuardIndex = html.indexOf(
  "if (!getLiveMicrophoneTrack(cameraStream))",
  cameraReadyStatusIndex
);
assert.ok(
  cameraReadyStatusIndex >= 0 && microphoneReadyGuardIndex > cameraReadyStatusIndex,
  "The ready status must retain a pending/unavailable microphone warning instead of hiding it."
);
assert.ok(
  /No camera was found on this device\./.test(html),
  "Camera-only startup errors must not claim a microphone is missing."
);

const required = [
  'id="camera"',
  'id="cameraFacing"',
  'value="environment"',
  'id="captureFraming"',
  'value="portrait"',
  'value="landscape"',
  'aspectRatio: { ideal: 9 / 16 }',
  'aspectRatio: { ideal: 16 / 9 }',
  'const captureFraming = document.getElementById("captureFraming")',
  "facingMode: { ideal: cameraFacing.value }",
  'id="cameraPlaceholder"',
  "Camera is off. Tap",
  "function setCameraPlaceholder(message)",
  'id="overlay"',
  'id="startButton"',
  'id="stopButton"',
  'id="faceFile"',
  'id="faceAngleFiles"',
  'id="faceAngleStatus"',
  "neuralSwap.identityView({image})",
  "await neuralSwap.setIdentity({views})",
  "Choose no more than two extra angle photos.",
  'id="permission"',
  'id="showSwap"',
  'id="status"',
  "FaceLandmarker.createFromOptions",
  "function withTimeout(promise, milliseconds, message)",
  "import(\"https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14\")",
  "import(\"https://cdn.jsdelivr.net/npm/d3-delaunay@6.0.4/+esm\")",
  "The tracking libraries took too long to load",
  "The face model took too long to download",
  "detectForVideo",
  "Face detection skipped a frame after a processing error.",
  "Camera is live, but face tracking hit a temporary error. Retrying...",
  "Keep the camera preview running.",
  "getUserMedia",
  "pagehide",
  'id="clearFaceButton"',
  "function clearUploadedFace()",
  "10 * 1024 * 1024",
  "clearFaceButton.addEventListener",
  "let imageLoadToken = 0",
  "const currentLoadToken = ++imageLoadToken",
  "currentLoadToken !== imageLoadToken",
'id="voiceEffect"',
  'id="translationConsent"',
  'id="targetLanguage"',
  'id="startTranslationButton"',
  'id="stopTranslationButton"',
  'id="englishCaption"',
  'id="translatedCaption"',
  'id="callButton"',
  'id="answerButton"',
  'id="framingGuide"',
  'id="framingGuideButton"',
  'id="showBodyPose"',
  "PoseLandmarker.createFromOptions",
  "function updateBodySegmentationMask(mask)",
  "function drawBodySegmentationMask()",
  "function clearBodySegmentationMask()",
  "The person-silhouette mask and joint tracking are active.",
  "this browser did not return a silhouette mask.",
  "smoothedPoseLandmarks = null;\n              clearBodySegmentationMask();",
  "outputSegmentationMasks: true",
  "poseResults.segmentationMasks?.[0]",
  "else clearBodySegmentationMask();",
  "mask.getAsFloat32Array()",
  "segmentationMask.close()",
  "pixels.data[offset + 3] = Math.round(Math.min(0.34, confidence * 0.34) * 255)",
  "function drawBodyPose(landmarks)",
  "function smoothPoseLandmarks(current, previous)",
  "const movement = Math.hypot(point.x - old.x, point.y - old.y)",
  "const response = Math.min(0.84, Math.max(0.38, 0.38 + movement * 8))",
  "let lastPoseDetectedAt = 0",
  "smoothedPoseLandmarks = smoothPoseLandmarks(detectedPose, smoothedPoseLandmarks)",
  "frameTime - lastPoseDetectedAt > 300",
  "lastPoseDetectedAt = 0",
  "smoothedPoseLandmarks = null",
  'id="bodyFrameStatus"',
  "function updateBodyFrameStatus(landmarks)",
  "const required = [0,11,12,23,24,27,28,31,32]",
  "const minimumConfidence = index >= 27 ? 0.25 : 0.4",
  'bodyFrameStatus.textContent = "Enable body tracking to check whether your full body is in frame."',
  "Full body detected.",
  "Move farther back and show your head, shoulders, hips, and both feet.",
  "function smoothFaceLandmarks(current, previous)",
  "const averageMovement = measuredPoints ? totalMovement / measuredPoints : 0",
  "const adaptiveResponse = Math.min(0.88, Math.max(0.30,",
  "0.30 + averageMovement * 14",

  "smoothedFaceLandmarks = smoothFaceLandmarks(",
  "let lastFaceDetectedAt = 0",
  "let faceCurrentlyDetected = false",
  "if (frameTime - lastFaceDetectedAt > 250) smoothedFaceLandmarks = null",
  "if (faceCurrentlyDetected && smoothedFaceLandmarks &&",
  "faceCurrentlyDetected = false",
  "warpFace(smoothedFaceLandmarks)",
  "poseLandmarker.detectForVideo(video, frameTime)",
  "Keep your full body inside this outline",
  'Keep your full body inside this outline',
  'Face replacement currently tracks the face only; full-body identity replacement is still under development.',
  "id=\"cameraStage\"",
  "cameraStage.classList.toggle(\"landscape\"",
  "background: linear-gradient(145deg, rgba(25,33,54,.94), rgba(14,20,35,.96))",
  "imageSmoothingQuality = \"high\"",
  "saturate(0.94) contrast(0.98)",
  "const overlap = dst.map(point =>",
  "function applyVoiceEffect()",
  '"female-soft"',
  '"male-deep"',
  "function translateEnglishCaption(text)",
  "api.mymemory.translated.net",
  "function startEnglishCaptions()",
  "Please agree before sending recognized speech text for translation.",
  "function connectCallService()",
  "https://esm.sh/peerjs@1.5.4",
  "function closeActiveCall()",
  "recognition.lang = \"en-US\"",
  "translationRequestToken",
  "Neural Face Swap Engine",
  "id=\"aiConsent\"",
  "id=\"startAIButton\"",
  "id=\"stopAIButton\"",
  "browser-inswapper@0.1.0",
  "const caps = await probe()",
  "KNOWN_SHA256.swapperFp16",
  "facefusion-assets/releases/download/models/inswapper_128_fp16.onnx",
  "neuralSwap.findFaces(uploadedFace)",
  "function waitForNeuralVideoFrame(timeoutMs = 15000)",
  "await waitForNeuralVideoFrame()",
  "neuralOutputVideo.readyState < 2",
  "Processed video frame received.",
  "The neural engine started but produced no visible video frame within 15 seconds.",
  "await withTimeout(neuralOutputVideo.play(), 15000",
  "neuralSwap.process(cameraStream.getVideoTracks()[0]",
  "sender.replaceTrack(track)",
  "aiConsent.checked = false",
  "id=\"engineConsole\"",
  "id=\"swapModel\"",
  "id=\"swapPixelBoost\"",
  "id=\"landmarkerModel\"",
  "id=\"selectorMode\"",
  "id=\"executionProvider\"",
  "id=\"benchmarkMode\"",
  "function buildEngineIni()",
  "function engineLaunchCommand(benchmark=false)",
  "id=\"selectorAgeStart\"",
  "id=\"selectorAgeEnd\"",
  "id=\"turnServerUrl\"",
  "id=\"turnServerUsername\"",
  "id=\"turnServerCredential\"",
  "id=\"networkStatus\"",
  "new PeerClass(undefined, { config })",
  "connection.addEventListener(\"connectionstatechange\", reportConnectionState)",
  "Using the PeerJS default ICE server configuration.",
  "face_selector_age_start",
  "face_selector_age_end",
  "selectedOptions).map(option => option.value).join(\" \")",
  "const neuralOutputVideo = document.createElement(\"video\")",
  "lastFaceDetectionTime = 0",
  "performance.now() - lastFaceDetectionTime >= 33",
  "Refresh the outgoing canvas independently of CPU landmark inference.",
  "warpFace(smoothedFaceLandmarks)",
  "function getProcessedCanvasSource()",
  "neuralOutputVideo.srcObject = new MediaStream([neuralSwapTrack])",
  "canvas.captureStream(30)",
  "Keep the processed canvas stream alive.",
  "Local preview hidden. The processed video and microphone remain active for your call.",
  "if (peer.disconnected)",
  "peer.reconnect();",
  "Reconnecting to the call service...",

];

for (const item of required) {
  assert.ok(html.includes(item), `Missing required app feature: ${item}`);
}

assert.ok(
  /!permission\.checked/.test(html),
  "Face alignment must be blocked until permission is confirmed."
);
assert.ok(
  /track\.stop\(\)/.test(html),
  "The stop-camera flow must stop media tracks."
);
assert.ok(
  /getUserMedia\(\{\s*video:/.test(html),
  "The camera preview must request video independently of microphone availability."
);
assert.ok(
  /getUserMedia\(\{\s*audio:\s*\{\s*echoCancellation:\s*true/.test(html),
  "The app must request microphone audio separately with echo cancellation for calling."
);
assert.ok(
  /microphoneUnavailable/.test(html) &&
  /Microphone unavailable; preview and tracking work, but calls need microphone access\./.test(html),
  "The app must explain when camera preview works but microphone access is unavailable."
);

const cameraStartupSource = html.slice(
  html.indexOf("async function startCamera()"),
  html.indexOf("function stopCamera()")
);
assert.ok(
  cameraStartupSource.indexOf("renderCameraOnly();") <
    cameraStartupSource.indexOf("audio: { echoCancellation: true"),
  "The camera preview must become live before the app requests microphone permission."
);
assert.ok(
  /if \(cameraStream !== activeCameraStream\) \{\s*microphoneStream\.getTracks\(\)\.forEach\(track => track\.stop\(\)\);\s*return;\s*\}/.test(html),
  "A microphone granted after camera disconnect must be stopped immediately."
);
assert.ok(
  /if \(cameraStream !== activeCameraStream\) return;\s*microphoneUnavailable = true/.test(html),
  "A stale microphone permission result must not overwrite the camera-disconnected status."
);
assert.ok(
  /microphoneStream\.getAudioTracks\(\)\.forEach\(track => \{\s*activeCameraStream\.addTrack\(track\);/.test(html),
  "Microphone tracks must be attached only to the camera session that requested them."
);
assert.ok(
  /track\.addEventListener\("ended"/.test(html) &&
  /cameraStream !== activeCameraStream/.test(html) &&
  /Camera disconnected\. Your preview and call have stopped; reconnect the camera to continue\./.test(html),
  "An externally ended camera track must stop the active session and explain how to recover."
);
assert.ok(
  /Requesting camera permission\.\.\./.test(html) &&
  /Camera permission was denied\. Allow camera access in your browser settings and try again\./.test(html),
  "Camera permission messaging must not imply microphone permission is required to start preview."
);

assert.ok(
  /permission\.checked = false/.test(html),
  "Selecting or removing an image must reset the consent confirmation."
);
assert.ok(
  /URL\.revokeObjectURL\(photoUrl\)/.test(html),
  "Replacing or removing an uploaded image must release its object URL."
);

assert.ok(
  !/processedVideoMode !== expectedMode/.test(html),
  "Switching to the neural engine must not rebuild the outgoing WebRTC video stream."
);

console.log("Face Tracking Studio smoke tests passed.");

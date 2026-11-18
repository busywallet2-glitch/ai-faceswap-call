import { readFileSync, writeFileSync, unlinkSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { tmpdir } from "node:os";
import { join } from "node:path";
import assert from "node:assert/strict";
const html = readFileSync(new URL("../index.html", import.meta.url), "utf8");

const manifest = JSON.parse(readFileSync(new URL("../manifest.webmanifest", import.meta.url), "utf8"));
assert.equal(manifest.name, "Busywallet AI Face Swap Studio");
assert.equal(manifest.display, "standalone");
assert.equal(manifest.start_url, "./");
assert.ok(manifest.icons.some(icon => icon.src === "./icon.svg"));
const serviceWorker = readFileSync(new URL("../sw.js", import.meta.url), "utf8");
assert.ok(serviceWorker.includes('self.addEventListener("install"'));
assert.ok(serviceWorker.includes('self.addEventListener("activate"'));
assert.ok(serviceWorker.includes('request.mode === "navigate"'));
assert.ok(serviceWorker.includes('caches.match("./index.html")'));
assert.ok(html.includes('<link rel="manifest" href="./manifest.webmanifest">'));
assert.ok(html.includes('id="installAppButton"'));
assert.ok(html.includes('navigator.serviceWorker.register("./sw.js", { scope: "./" })'));
assert.ok(html.includes('window.addEventListener("beforeinstallprompt"'));


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

assert.match(html, /let trackerLoadPromise = null;/,
  "Overlapping camera starts must share one tracker model load.");
const trackerLoaderStart = html.indexOf("async function loadTrackers() {");
const trackerLoaderEnd = html.indexOf("function getProcessedCanvasSource()", trackerLoaderStart);
assert.ok(trackerLoaderStart >= 0 && trackerLoaderEnd > trackerLoaderStart,
  "The tracker loader must remain independently inspectable.");
const trackerLoaderSource = html.slice(trackerLoaderStart, trackerLoaderEnd);
assert.ok(trackerLoaderSource.includes("if (!trackerLoadPromise)"),
  "Tracker libraries and models must load only once while a load is in progress.");
assert.ok(trackerLoaderSource.includes("if (trackerLoadPromise === pendingLoad) trackerLoadPromise = null;"),
  "A failed tracker load must clear its own promise so the next camera start can retry.");

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
const previewFitSource = html.slice(
  html.indexOf("function fitCameraStageToActualVideo()"),
  html.indexOf("function getProcessedCanvasSource()")
);
assert.ok(
  previewFitSource.includes("cameraStage.style.aspectRatio = `${width} / ${height}`;") &&
    previewFitSource.includes('cameraStage.classList.toggle("landscape", width > height);'),
  "The preview must match the dimensions and orientation actually supplied by the camera."
);
const cameraStartupForFit = html.slice(
  html.indexOf("async function startCamera()"),
  html.indexOf("function getPixelPoints(")
);
assert.ok(
  cameraStartupForFit.includes("fitCameraStageToActualVideo();") &&
    cameraStartupForFit.includes("captureFraming.disabled = true;"),
  "The live preview must fit the actual stream and lock orientation controls until the camera stops."
);
assert.ok(
  /device supplied \${actualOrientation} video, so the preview has been resized/.test(html),
  "The app must disclose when the device returns a different orientation than requested."
);
assert.ok(
  /Legacy triangle-mesh preview — disabled because it distorts the face/.test(html) &&
    /showSwap\.disabled = true;/.test(html) &&
    /showBodyPose\.checked = false;/.test(html),
  "The distorted mesh and green body diagnostics must be disabled in the clean default preview."
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
  "neuralSwap.findFaces(sourceFace)",
  "function waitForNeuralVideoFrame(timeoutMs = 15000)",
  "await waitForNeuralVideoFrame()",
  "neuralSwapStartToken",
  "const sessionStream = cameraStream",
  "const sourceFace = uploadedFace",
  "const isCurrentStart = () => startToken === neuralSwapStartToken && cameraStream === sessionStream && uploadedFace === sourceFace",
  "if (!isCurrentStart()) return",
  "neuralSwapStartToken += 1",
  "aiProgress.hidden = true",
  "neuralOutputVideo.readyState < 2",
  "Processed video frame received.",
  "The neural engine started but produced no visible video frame within 15 seconds.",
  "await withTimeout(neuralOutputVideo.play(), 15000",
  "neuralSwap.process(sessionStream.getVideoTracks()[0]",
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


const alteredDisclosureMarkup =
  html.includes('id="alteredDisclosureBadge"') &&
  html.includes('id="outputDisclosureBadge"') &&
  html.includes('id="outputPreviewWrap"');
assert.ok(alteredDisclosureMarkup,
  "The camera and processed-output previews must expose a visible altered-video disclosure badge.");
assert.ok(
  /When live AI face replacement is active, the outgoing video includes a persistent AI-ALTERED VIDEO label\./.test(html) &&
    /Keep it visible and tell the other participant before connecting\./.test(html),
  "The call panel must tell the user that the recipient receives a visible alteration disclosure."
);

const disclosureHelpersStart = html.indexOf("function isNeuralOutputActive() {");
const disclosureHelpersEnd = html.indexOf("\n    function renderCameraOnly()", disclosureHelpersStart);
assert.ok(disclosureHelpersStart >= 0 && disclosureHelpersEnd > disclosureHelpersStart,
  "The outgoing altered-video disclosure helpers must remain independently testable.");
const disclosureHelpersSource = html.slice(disclosureHelpersStart, disclosureHelpersEnd);
assert.ok(
  disclosureHelpersSource.includes("alteredDisclosureBadge.hidden = !visible;") &&
    disclosureHelpersSource.includes("outputDisclosureBadge.hidden = !visible;") &&
    disclosureHelpersSource.includes('const label = "AI-ALTERED VIDEO";') &&
    disclosureHelpersSource.includes("ctx.fillText(label,"),
  "The local badges and outgoing canvas watermark must be enabled only for live neural output."
);

const disclosureDrawCalls = [];
const disclosureContext = {
  save() {},
  restore() {},
  setTransform() {},
  measureText: label => ({ width: label.length * 8 }),
  fillRect: (...args) => disclosureDrawCalls.push({ type: "rect", args }),
  fillText: (...args) => disclosureDrawCalls.push({ type: "text", text: args[0] })
};
const disclosureTrack = { readyState: "live" };
const disclosureVideo = { readyState: 2 };
const localDisclosureBadge = { hidden: true };
const outputDisclosureBadge = { hidden: true };
const drawAlteredDisclosure = new Function(
  "ctx", "canvas", "neuralSwapTrack", "neuralOutputVideo",
  "alteredDisclosureBadge", "outputDisclosureBadge",
  `${disclosureHelpersSource}
   return drawAlteredDisclosure;`
)(
  disclosureContext,
  { width: 640 },
  disclosureTrack,
  disclosureVideo,
  localDisclosureBadge,
  outputDisclosureBadge
);
drawAlteredDisclosure();
assert.equal(localDisclosureBadge.hidden, false,
  "The camera preview disclosure must appear while neural output is live.");
assert.equal(outputDisclosureBadge.hidden, false,
  "The processed preview disclosure must appear while neural output is live.");
assert.ok(disclosureDrawCalls.some(call =>
  call.type === "text" && call.text === "AI-ALTERED VIDEO"),
  "The actual canvas-captured outgoing video must contain the AI-ALTERED VIDEO watermark.");
disclosureDrawCalls.length = 0;
disclosureTrack.readyState = "ended";
drawAlteredDisclosure();
assert.equal(localDisclosureBadge.hidden, true,
  "The camera preview disclosure must clear when neural output stops.");
assert.equal(outputDisclosureBadge.hidden, true,
  "The processed preview disclosure must clear when neural output stops.");
assert.equal(disclosureDrawCalls.length, 0,
  "Raw camera fallback must not be mislabeled as AI-altered.");

assert.equal((html.match(/drawAlteredDisclosure\(\);/g) || []).length, 2,
  "Both camera-only and face-tracking canvas render loops must apply the outgoing disclosure watermark.");
const detectFaceDisclosureStart = html.indexOf("function detectFace() {");
const detectFaceDisclosureEnd = html.indexOf("\n    function ", detectFaceDisclosureStart + 1);
const detectFaceDisclosureSource = html.slice(detectFaceDisclosureStart, detectFaceDisclosureEnd);
assert.ok(
  detectFaceDisclosureSource.indexOf("drawBodyPose(lastPoseLandmarks);") <
    detectFaceDisclosureSource.lastIndexOf("drawAlteredDisclosure();"),
  "The outgoing disclosure watermark must render after body diagnostics so it remains visible."
);
const stopNeuralDisclosureStart = html.indexOf("function stopNeuralFaceEngine() {");
const stopNeuralDisclosureEnd = html.indexOf("function stopProcessedOutput()", stopNeuralDisclosureStart);
assert.ok(stopNeuralDisclosureStart >= 0 && stopNeuralDisclosureEnd > stopNeuralDisclosureStart &&
  html.slice(stopNeuralDisclosureStart, stopNeuralDisclosureEnd).includes("syncAlteredDisclosure();"),
  "Stopping neural replacement must immediately hide the altered-video disclosure.");
const stopCameraDisclosureStart = html.indexOf("function stopCamera() {");
const stopCameraDisclosureEnd = html.indexOf("function clearUploadedFace()", stopCameraDisclosureStart);
assert.ok(stopCameraDisclosureStart >= 0 && stopCameraDisclosureEnd > stopCameraDisclosureStart &&
  html.slice(stopCameraDisclosureStart, stopCameraDisclosureEnd).includes("syncAlteredDisclosure();"),
  "Stopping the camera must immediately hide the altered-video disclosure.");
const processedOutputStart = html.indexOf("async function startProcessedOutput() {");
const processedOutputEnd = html.indexOf("async function syncActiveCallTracks()", processedOutputStart);
assert.ok(processedOutputStart >= 0 && processedOutputEnd > processedOutputStart &&
  html.slice(processedOutputStart, processedOutputEnd).includes('outputPreviewWrap.style.display = "block";'),
  "The processed output disclosure badge must be shown with the outgoing preview.");
const stopOutputStart = html.indexOf("function stopProcessedOutput() {");
const stopOutputEnd = html.indexOf("async function startProcessedOutput()", stopOutputStart);
assert.ok(stopOutputStart >= 0 && stopOutputEnd > stopOutputStart &&
  html.slice(stopOutputStart, stopOutputEnd).includes('outputPreviewWrap.style.display = "none";'),
  "Stopping or hiding the local processed preview must also hide its local disclosure badge.");

console.log("Face Tracking Studio smoke tests passed.");

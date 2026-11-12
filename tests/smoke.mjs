import { readFileSync, writeFileSync, unlinkSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { tmpdir } from "node:os";
import { join } from "node:path";
import assert from "node:assert/strict";

const html = readFileSync(new URL("../index.html", import.meta.url), "utf8");

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
  "function drawBodyPose(landmarks)",
  'id="bodyFrameStatus"',
  "function updateBodyFrameStatus(landmarks)",
  "const required = [0,11,12,23,24,27,28,31,32]",
  "const minimumConfidence = index >= 27 ? 0.25 : 0.4",
  'bodyFrameStatus.textContent = "Enable body tracking to check whether your full body is in frame."',
  "Full-body landmarks detected.",
  "Move farther back and show your head, shoulders, hips, and both feet.",
  "function smoothFaceLandmarks(current, previous, response = 0.72)",
  "smoothedFaceLandmarks = smoothFaceLandmarks(",
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
  "face_selector_age_start",
  "face_selector_age_end",
  "selectedOptions).map(option => option.value).join(\" \")",
  "const neuralOutputVideo = document.createElement(\"video\")",
  "function getProcessedCanvasSource()",
  "neuralOutputVideo.srcObject = new MediaStream([neuralSwapTrack])",
  "canvas.captureStream(30)",
  "Keep the processed canvas stream alive.",
  "Local preview hidden. The processed video and microphone remain active for your call.",
  "processedVideoMode !== expectedMode"

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
  /audio:\s*\{\s*echoCancellation:\s*true/.test(html),
  "The camera capture must request the microphone with echo cancellation for calling."
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

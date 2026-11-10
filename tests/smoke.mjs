import { readFileSync } from "node:fs";
import assert from "node:assert/strict";

const html = readFileSync(new URL("../index.html", import.meta.url), "utf8");

const required = [
  'id="camera"',
  'id="overlay"',
  'id="startButton"',
  'id="stopButton"',
  'id="faceFile"',
  'id="permission"',
  'id="showSwap"',
  'id="status"',
  "FaceLandmarker.createFromOptions",
  "detectForVideo",
  "getUserMedia",
  "pagehide",
  'id="clearFaceButton"',
  "function clearUploadedFace()",
  "10 * 1024 * 1024",
  "clearFaceButton.addEventListener"
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
  /audio:\s*false/.test(html),
  "The camera capture must not request microphone audio."
);

assert.ok(
  /permission\.checked = false/.test(html),
  "Selecting or removing an image must reset the consent confirmation."
);
assert.ok(
  /URL\.revokeObjectURL\(photoUrl\)/.test(html),
  "Replacing or removing an uploaded image must release its object URL."
);

console.log("Face Tracking Studio smoke tests passed.");

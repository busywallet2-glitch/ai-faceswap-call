

## Face Swapper Control Center



The FaceFusion documentation currently shows an inconsistent CLI flag for face-swapper weight (the argument label and example differ). The profile builder therefore stores the weight in the INI file and omits that ambiguous flag from the generated command. Verify the exact option supported by your installed release before using a CLI override.

### Starter profiles

- [Balanced profile](profiles/busywallet-balanced.ini) — conservative 128×128 pixel boost and the supplied default swap weight.
- [Quality-first profile](profiles/busywallet-quality.ini) — 512×512 pixel boost and a stronger blend; use only after checking GPU memory and benchmark results.

These are starter configurations, not universal optimal settings. Model availability and exact configuration keys depend on the installed FaceFusion release.


The browser studio now includes a local-engine profile builder for the FaceFusion-compatible options supplied for this project. It can export a `facefusion.ini`, copy a local launch command, and prepare a benchmark command. Settings include the face-swapper model, pixel boost, swap weight, face landmarker and confidence, face selector and reference tracking, execution provider/device IDs/thread count, video-memory strategy, benchmark mode/resolution/cycles, log level, and halt-on-error.

**Important:** the profile builder does not run FaceFusion inside GitHub Pages. Install and run the Python engine on a compatible local computer or GPU host. The CLI and configuration schema vary by FaceFusion release; verify generated flags against the exact installed version before use. Webcam UDP/V4L2 output and OBS integration require the local engine and operating-system support; the static website cannot create a system virtual camera. See [ENGINE_SETUP.md](ENGINE_SETUP.md).
# Busywallet AI Face Swap & Live Call Prototype

**Live demo:** https://busywallet2-glitch.github.io/ai-faceswap-call/  
**Source code:** https://github.com/busywallet2-glitch/ai-faceswap-call

A mobile-first, consent-first browser studio with a premium interface, experimental GPU neural face replacement, camera processing, browser-to-browser calling, basic microphone effects, and English speech captions with translated text.

## Current features

- Camera access begins only after the user chooses to start it.
- MediaPipe Face Landmarker tracks a face in the camera stream.
- An experimental neural face-replacement engine uses `browser-inswapper`, ONNX Runtime Web, an InsightFace identity model, and MediaPipe segmentation for face alignment and foreground-aware blending.
- The neural engine checks GPU capabilities, verifies downloaded model files against SHA-256 fingerprints, reports model download progress and live inference performance, and checks the uploaded portrait for quality issues.

- The outgoing call video now uses one persistent canvas-capture track. The neural engine's decoded output is composited into that canvas, so turning face replacement on/off does not replace the WebRTC sender track or require reconnecting the call. If neural inference ends, the canvas falls back to the live camera instead of freezing the call.
- A user can upload a face image, confirm they have permission to use it, and preview experimental landmark/triangle alignment.
- A full-body framing guide helps position the phone to keep the subject head-to-toe in view.
- The camera can be switched between front and rear lenses before starting, making it easier to set up a tripod or full-body shot.
- Portrait and landscape capture modes request different aspect ratios; portrait mode is the default for head-to-toe framing. The preview stage adapts to the selected orientation and the app reports actual camera resolution when the device exposes it.
- The interface uses a responsive dark studio layout, high-contrast controls, clearer camera staging, and mobile-friendly panels.
- The face mesh preview now uses high-quality image resampling, a subtle color/contrast adjustment, and slight triangle overlap to reduce visible mesh gaps. This is a cosmetic improvement to the experimental warp, not realistic neural face replacement.
- Optional MediaPipe Pose Landmarker tracking draws a smoothed live skeleton over visible shoulders, arms, hips, and legs; when the model returns a segmentation mask, a translucent person-silhouette overlay is added for framing diagnostics. Mask buffers are copied to the preview canvas and closed after each inference to limit memory use.
- A framing check uses head, shoulder, hip, and ankle landmarks to tell the user when to step back or adjust the camera so the full body is visible.
- The uploaded face can be removed, and camera tracks are stopped when the camera is stopped or the page is closed.
- The processed canvas can be shared as a video track in a browser-to-browser PeerJS/WebRTC call.
- Incoming/outgoing call controls, call IDs, remote video, camera pause, and microphone mute controls are included.
- Microphone audio can pass through Web Audio EQ, compression, gain, and a simple robot/radio effect chain.
- Female- and male-labelled EQ presets are available, along with special effects and local English voice previews using voices installed on the device.
- Optional English speech recognition can show captions and request translated text in Spanish, French, German, Portuguese, Italian, Dutch, Arabic, Hindi, Simplified Chinese, or Japanese.
- Translation requires a separate consent checkbox because recognized speech text is sent to the MyMemory translation service.

## Important limitations — read before use

This is an **experimental prototype, not a finished or production-ready face-swap or calling product**.

- The legacy landmark/triangle warp remains available as an optional experimental overlay; it is not the neural replacement and should not be mistaken for realistic identity transfer.
- The neural replacement is experimental and not guaranteed photorealistic. It depends on source-photo quality, pose, lighting, browser support, and GPU performance. The first run downloads several hundred MB of model files. CPU/WASM fallback is not suitable for live performance on most devices.
- The neural model has not been end-to-end verified on the user's Android phone or across supported desktop GPUs. GitHub source checks do not prove live inference works in a particular browser.
- Face replacement still affects the face only. The pose and segmentation overlays track/visualize the visible person but do not replace the whole body, clothing, or identity; the framing guide is only a positioning aid.
- The voice presets are EQ/texture effects. They do **not** perform true pitch/formant conversion, gender conversion, or identity cloning. Local speech previews are not the caller's live microphone voice.
- Do not clone or imitate a real person's identifiable voice without that person's explicit permission. Celebrity names are not provided as cloned voice presets.
- Speech recognition depends on browser support and may use browser-managed online services. Translation sends recognized text to MyMemory. Avoid confidential conversations and review third-party privacy terms.
- Translation currently produces **text captions only**. It does not synthesize translated speech, route translated audio to the other caller, translate the remote participant's speech, or provide full-duplex simultaneous interpretation.
- PeerJS uses its default signaling and ICE configuration. The call panel also accepts an optional TURN URL, username, and credential for networks that need a relay; these values stay in page memory and are not saved. Call reliability still needs testing across mobile, Wi-Fi, NAT, and firewall conditions.
- A browser page cannot register a system-wide virtual camera or replace the camera feed inside WhatsApp or Signal. The current page is not integrated with WhatsApp or Signal.
- GitHub Pages hosts the static page; it does not run a private processing server.
- The project has not been verified end-to-end on the user's Android device or with two real call participants. Automated smoke tests check source structure only.

## How to try the browser prototype

1. Open the live demo in a current Chrome or Edge browser on a device with supported WebGPU or WebNN.
2. Allow camera access when prompted and press **Start Camera**.
3. Upload one clear, front-facing portrait of a person who has explicitly agreed to this use.
4. Tick both the face permission and neural-engine consent checkboxes.
5. Press **Load Neural Face Engine** and wait for the model downloads and integrity checks to finish. Review the GPU and FPS readout before relying on the output.
6. Enable **Processed Camera Output** or start a browser call. The neural output is composited into a persistent canvas track, so switching the engine on/off does not intentionally replace the WebRTC sender track. The old landmark overlay is separate and remains off by default.
4. To test calling, create a call ID on one device, share it with a consenting person, and use that ID from the second browser. Both sides must allow camera/microphone permissions.
5. To test translated captions, select a target language, tick the translation consent checkbox, and start English captions.
6. Stop the camera, call, captions, and microphone when finished.

Browser support varies. Speech recognition is not available in every browser. A stable internet connection is required for external libraries, PeerJS signaling, browser speech recognition where online, and translation.

## Privacy, consent, and safe use

- Use only your own face or images whose subjects have given informed, specific permission.
- Tell every call participant clearly when a camera feed or voice is altered.
- Do not use the app to impersonate someone, deceive viewers, evade identity checks, or create non-consensual content.
- Translation is optional. When enabled, recognized speech text is transmitted to the external MyMemory service.
- Camera and microphone permissions are controlled by the browser. Stop the camera and call when finished.
- The app uses third-party CDN libraries and services. Review their privacy terms before using the prototype for sensitive material.

## Development and quality checks

The repository includes a GitHub Actions smoke test that runs with Node.js 20:

```sh
node tests/smoke.mjs
```

The smoke test parses the browser module for JavaScript syntax, checks key controls and safety/cleanup paths, and behavior-tests the pure body-landmark smoothing helper (including low-confidence joint handling). It also checks that neural output waits for a live decoded frame and times out instead of reporting success prematurely. It does not run a browser, load the MediaPipe models, validate segmentation-mask rendering, test audio/video quality, or prove that calls work on a particular device.

## Remaining engineering work

1. Test the stable-canvas neural output path end-to-end on supported Android and desktop GPU devices; tune temporal stabilization, face edges, expressions, lighting and performance using real captures.
2. Add actual voice conversion only through a suitable model/service with explicit voice-owner consent, latency controls, and clear disclosure.
3. Build a true speech-to-speech translation pipeline: both participants' speech recognition, translation, speech synthesis, echo prevention, language selection, and routed call audio.
4. Improve WebRTC reliability with a properly configured TURN service and test network handoff/reconnection.
5. Build a desktop companion and supported virtual-camera output, then verify WhatsApp Desktop and Signal Desktop independently.
6. Consider Android-native integration only as a separate project with real-device feasibility and security testing.
7. Complete performance, privacy, accessibility, abuse-prevention, and end-to-end release testing.

## Desktop integration direction

Desktop integration is the practical next platform step. See [DESKTOP_INTEGRATION.md](DESKTOP_INTEGRATION.md) for the OBS Virtual Camera proof-of-concept route and its limitations. That plan is not evidence that the current webpage already works as an OBS source or virtual camera.

## Project status

**Prototype stage — premium interface plus an experimental GPU neural face-swap integration. The source code is committed, but successful live inference has not yet been verified on the user's device. Browser calling and text translation remain experimental. Not ready for production or WhatsApp/Signal camera integration.**

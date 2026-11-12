# Busywallet AI Face Swap & Live Call Prototype

**Live demo:** https://busywallet2-glitch.github.io/ai-faceswap-call/  
**Source code:** https://github.com/busywallet2-glitch/ai-faceswap-call

A browser-based, consent-first prototype combining face landmark alignment, experimental camera processing, browser-to-browser calling, basic microphone effects, and English speech captions with translated text.

## Current features

- Camera access begins only after the user chooses to start it.
- MediaPipe Face Landmarker tracks a face in the camera stream.
- A user can upload a face image, confirm they have permission to use it, and preview experimental landmark/triangle alignment.
- A full-body framing guide helps position the phone to keep the subject head-to-toe in view.
- The camera can be switched between front and rear lenses before starting, making it easier to set up a tripod or full-body shot.
- Optional MediaPipe Pose Landmarker tracking draws a live skeleton over visible shoulders, arms, hips, and legs; pose tracking runs at a reduced rate to limit processing load.
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

- Face landmarks are temporally smoothed to reduce frame-to-frame jitter, but the face effect is still a basic landmark/triangle warp, not a neural identity-transfer model. It can distort and does not reliably handle large head turns, expressions, lighting, hair, glasses, or occlusion.
- Face replacement still affects the face only. The pose overlay tracks body landmarks but does not replace the whole body, clothing, or identity; the framing guide is only a positioning aid.
- The voice presets are EQ/texture effects. They do **not** perform true pitch/formant conversion, gender conversion, or identity cloning. Local speech previews are not the caller's live microphone voice.
- Do not clone or imitate a real person's identifiable voice without that person's explicit permission. Celebrity names are not provided as cloned voice presets.
- Speech recognition depends on browser support and may use browser-managed online services. Translation sends recognized text to MyMemory. Avoid confidential conversations and review third-party privacy terms.
- Translation currently produces **text captions only**. It does not synthesize translated speech, route translated audio to the other caller, translate the remote participant's speech, or provide full-duplex simultaneous interpretation.
- PeerJS uses a public signaling service by default. Network restrictions, firewalls, or NAT may prevent a direct call; no guaranteed TURN relay is configured.
- A browser page cannot register a system-wide virtual camera or replace the camera feed inside WhatsApp or Signal. The current page is not integrated with WhatsApp or Signal.
- GitHub Pages hosts the static page; it does not run a private processing server.
- The project has not been verified end-to-end on the user's Android device or with two real call participants. Automated smoke tests check source structure only.

## How to try the browser prototype

1. Open the live demo in a modern browser on an HTTPS connection.
2. Allow camera access when prompted and press **Start Camera**.
3. If testing face alignment, upload a clear front-facing image of a person who has explicitly agreed to this use, tick the permission confirmation, and enable the face effect.
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

The smoke test parses the browser module for JavaScript syntax and checks that key controls, permission gates, cleanup, full-body tracking/framing, voice-effect, caption/translation, and calling code remain present. It does not run a browser, load the MediaPipe models, test audio/video quality, or prove that calls work on a particular device.

## Remaining engineering work

1. Replace the triangle warp with a robust, consent-based face replacement/segmentation pipeline and temporal stabilization.
2. Add actual voice conversion only through a suitable model/service with explicit voice-owner consent, latency controls, and clear disclosure.
3. Build a true speech-to-speech translation pipeline: both participants' speech recognition, translation, speech synthesis, echo prevention, language selection, and routed call audio.
4. Improve WebRTC reliability with a properly configured TURN service and test network handoff/reconnection.
5. Build a desktop companion and supported virtual-camera output, then verify WhatsApp Desktop and Signal Desktop independently.
6. Consider Android-native integration only as a separate project with real-device feasibility and security testing.
7. Complete performance, privacy, accessibility, abuse-prevention, and end-to-end release testing.

## Desktop integration direction

Desktop integration is the practical next platform step. See [DESKTOP_INTEGRATION.md](DESKTOP_INTEGRATION.md) for the OBS Virtual Camera proof-of-concept route and its limitations. That plan is not evidence that the current webpage already works as an OBS source or virtual camera.

## Project status

**Prototype stage — experimental browser calling and text translation only. Not ready for production, reliable impersonation-safe identity replacement, or WhatsApp/Signal camera integration.**

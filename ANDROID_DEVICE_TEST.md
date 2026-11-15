# Android Device Verification — Samsung Galaxy S10+

Target device recorded for this project: Samsung Galaxy S10+, Android 12. The exact regional hardware variant must be confirmed on the phone because S10+ variants use different chipsets and GPUs.

This checklist verifies the existing browser prototype. It does not claim that neural face replacement, full-body replacement, or video-call integration already works on this device.

## 1. Record the device and browser

On the phone, open Settings → About phone → Software information and record:

- Model number (for example, SM-G975F or SM-G9750)
- Android version and security patch
- Chrome version (open Chrome → Settings → About Chrome)
- Available storage before downloading models
- Whether the phone is cool or already thermally throttled

Do not infer the chipset from the marketing name alone. Record the exact model number before comparing performance.

## 2. Open the hosted prototype

Use the current Chrome browser and open:

https://busywallet2-glitch.github.io/ai-faceswap-call/

Use HTTPS. Keep the phone plugged in for long model downloads and testing. Do not test while the device is overheating.

## 3. Camera and tracking checks

- Load the page and confirm the camera remains off until Start Camera is pressed.
- Press Start Camera and grant camera permission.
- Confirm the preview appears without requiring microphone permission.
- Switch between front and rear cameras before starting capture.
- Test portrait and landscape framing.
- Confirm face tracking finds a face and the status remains responsive.
- Stop the camera and confirm the camera indicator turns off.
- Repeat after denying camera permission, then restore permission in Android site settings and retry.

Record: camera startup time, selected lens, actual preview resolution, tracking status, and any browser console error.

## 4. Neural engine checks

Only use a face image whose subject has explicitly consented. Tick the on-screen permission and neural-engine consent controls.

- Check the engine's GPU capability report before loading models.
- If WebGPU is unavailable, record that result; do not assume the CPU fallback can provide real-time performance.
- Start the neural engine and wait for model downloads and integrity checks.
- Record model-load duration, selected execution provider, reported FPS, and whether a processed video frame is actually received.
- Observe output for at least 60 seconds. Note freezes, blank frames, overheating, and app/browser restarts.
- Turn neural processing off and confirm the camera preview and any active call video continue.

A successful model download is not proof of successful inference. A successful inference frame is not proof of stable real-time performance.

## 5. Browser call checks

Use a second consenting device and a private test call.

- Confirm both participants are told when video is altered.
- Create a call ID on one device and join from the other.
- Verify two-way video and audio.
- Toggle neural processing while connected; verify the outgoing video track does not freeze or require a reconnect.
- Mute and unmute the microphone.
- End the call on each device and confirm camera and microphone indicators turn off.

Repeat once on Wi-Fi and once on a mobile network if available. Do not publish call IDs or TURN credentials.

## 6. Results template

| Check | Result | Notes |
|---|---|---|
| Exact model number / chipset | Not tested | |
| Android and Chrome versions | Not tested | |
| Camera preview and lens switching | Not tested | |
| MediaPipe face tracking | Not tested | |
| WebGPU capability | Not tested | |
| Neural model download and integrity | Not tested | |
| First processed frame | Not tested | |
| Stable inference for 60 seconds | Not tested | |
| Two-device call audio/video | Not tested | |
| Neural toggle during active call | Not tested | |
| Cleanup after stopping | Not tested | |

## Release gate

Do not describe the Android build as verified until the camera, tracking, neural inference, sustained performance, call media, and cleanup checks have been completed on the exact device variant. Keep full-body identity replacement and system-wide WhatsApp/Signal camera integration marked as not implemented until separate native/desktop implementations are built and tested.

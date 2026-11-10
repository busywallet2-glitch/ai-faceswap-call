# Face Tracking Studio

A browser-based prototype for consent-based face landmark tracking and experimental face-image alignment.

**Live demo:** https://busywallet2-glitch.github.io/ai-faceswap-call/

## Current features

- Requests camera access only after the user presses **Start Camera**.
- Tracks one face with MediaPipe Face Landmarker.
- Accepts a local image upload and detects its facial landmarks.
- Includes an explicit permission confirmation before the uploaded face is drawn over the camera preview.
- Provides a stop-camera control and stops the camera when the page is closed.
- Runs image analysis in the browser; uploaded images are not sent to an app-owned server.

## Important limitations

This is **not yet a realistic, production-ready face-swap system**. The current overlay is a basic landmark/triangle warp. It can look distorted, especially with head turns, different lighting, facial expressions, hair, glasses, or occlusions. It does not guarantee a natural blend.

The project is **not connected to any calling service**. GitHub Pages hosts static files; it does not provide the processing service or camera-device integration needed for dependable video calls.

## Target integration order

1. **WhatsApp Desktop first.** Build and test a desktop companion that exposes an explicitly selected processed camera feed as a camera device.
2. **Signal Desktop second.** Reuse the same companion camera output where Signal Desktop and the operating system enumerate it as an available camera.
3. **Android apps later, only if technically supported.** A normal mobile webpage cannot replace the camera feed inside other Android apps. This requires a separate Android-native approach and real-device testing.

The desktop route is the practical first target. It requires a Windows or macOS computer for development and end-to-end testing; the current GitHub Pages page alone cannot create a system-wide virtual camera.

See [DESKTOP_INTEGRATION.md](DESKTOP_INTEGRATION.md) for the OBS Virtual Camera proof-of-concept plan and release gates.

## How to try the current prototype

1. Open the live demo in a modern browser.
2. Allow camera access when prompted.
3. Upload a clear, front-facing image of a person who has explicitly agreed to this use.
4. Tick the permission confirmation.
5. Press **Start Camera**.
6. Press **Stop Camera** when finished.

A secure HTTPS page is required for camera access. A stable internet connection is needed to load the MediaPipe model and supporting libraries.

## Privacy and responsible use

- Use only your own face or an image whose subject has given informed permission.
- Do not use this prototype to impersonate someone, mislead viewers, or bypass identity checks.
- Clearly tell other people when a live video feed has been altered.
- The browser preview is local, but camera and uploaded-photo data may still be handled by the browser and the third-party CDN/model services used to load the application. Review those providers' privacy terms before sensitive use.
- Stop the camera when you are done.

## Quality checks

A GitHub Actions workflow runs a Node.js smoke test on pushes and pull requests. The test checks that core camera, tracking, permission-gating, and camera-stop features remain present. It is a structural smoke test, not a substitute for visual or end-to-end device testing.

## Remaining work before a real video-call release

- Improve face segmentation, color matching, edge blending, and temporal stabilization.
- Test performance and reliability on target devices.
- Build a desktop companion and supported virtual-camera output for WhatsApp Desktop.
- Verify Signal Desktop compatibility with the same camera output.
- Complete privacy, security, consent, disclosure, and abuse-prevention reviews.
- Test end-to-end with consenting participants before describing the app as ready for calls.

## Project status

**Prototype stage — not ready for real calls or production use.** The live page is a tracking/alignment experiment only.
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

The project is **not connected to Zoom, Google Meet, WhatsApp, Teams, or any other calling service**. GitHub Pages hosts static files; it does not provide the inference server or WebRTC signaling service needed for a dependable virtual camera/call integration.

## How to try it

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

## Remaining work before a real video-call release

- Improve face masking, color matching, edge blending, and temporal stabilization.
- Test performance and reliability on target Android devices and desktop browsers.
- Add automated checks and clear handling for unsupported devices, model-loading failures, and camera errors.
- Decide which calling platform(s) to support first.
- Build and secure a separate WebRTC/signaling and processing service, or a supported virtual-camera integration; static GitHub Pages alone cannot provide this.
- Complete privacy, security, consent, disclosure, and abuse-prevention reviews.
- Test end-to-end with consenting participants before describing the app as ready for calls.

## Project status

**Prototype stage — not ready for real calls or production use.** The live page is a tracking/alignment experiment only.
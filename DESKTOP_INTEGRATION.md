# Desktop calling integration plan

## Target order

1. WhatsApp Desktop
2. Signal Desktop

## Why desktop first

The current app is a static HTTPS website. A webpage cannot register itself as a system-wide camera device, and a GitHub Pages deployment cannot install an operating-system camera driver. A desktop integration therefore needs a separate local companion and a supported virtual-camera provider.

## Practical prototype route: OBS Virtual Camera

For an initial desktop proof of concept, use OBS Studio's Virtual Camera feature as the camera-device bridge:

1. Install OBS Studio from its official website on a supported Windows or macOS computer.
2. Add a Browser Source in an OBS scene using the hosted Face Tracking Studio page, or a locally hosted companion page once one is built.
3. Grant camera permission to the browser source if the operating system and OBS build support it. Avoid capturing the same physical camera in multiple apps at once.
4. Start OBS Virtual Camera.
5. Open WhatsApp Desktop video-call settings and select OBS Virtual Camera if it appears as an available camera.
6. Make a test call with a consenting participant and clearly disclose that the image is altered.
7. Repeat with Signal Desktop and verify its camera selector independently.

This is a manual integration test plan, not a claim that the current website already works as an OBS source. Browser Source camera permissions and camera-device enumeration vary by OBS version and operating system and must be tested on the actual computer.

## Engineering work still required

- Build a local desktop companion that reliably obtains camera frames and provides a stable processed output.
- Choose a supported virtual-camera backend for each operating system; do not bundle unsigned camera drivers or bypass OS security.
- Improve face segmentation, blending, color matching, landmark smoothing, and head-pose handling.
- Add explicit device selection, camera lifecycle handling, and a clear unaltered-camera fallback.
- Test app compatibility with WhatsApp Desktop and Signal Desktop on real systems.
- Add privacy controls, local processing defaults, informed-consent prompts, and visible altered-video disclosure.

## Android limitation

A normal mobile webpage cannot replace the camera feed inside WhatsApp or Signal on Android. Do not promise Android in-call camera replacement unless a separate Android-native implementation has been built, reviewed, and demonstrated on supported devices.

## Release gate

Do not label this project ready for calls until a real end-to-end test proves that the selected virtual camera is visible and usable in the target calling app, remains stable during a call, and can be stopped cleanly.

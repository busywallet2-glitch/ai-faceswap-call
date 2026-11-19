# Android / Google Play Release Plan

## Current verified project state
The repository is a static browser application hosted on GitHub Pages. It has a PWA manifest and service worker. The README explicitly describes it as an experimental prototype, says Android device testing is not complete, and notes that WhatsApp/Signal integration and system virtual-camera support are not present.

**This repository does not currently contain a verified Android project or a signed Android App Bundle (.aab).** Do not upload the website ZIP or an APK generated from an untested web wrapper as if it were a finished native app.

## Recommended packaging path
Evaluate a Capacitor Android shell around the existing web application, then implement and test any required native integrations. A thin web wrapper may not provide enough functionality or quality for Play review. Confirm the final architecture and app behavior before committing to a permanent application ID.

Suggested working application ID (must be checked for uniqueness before first Play upload): `com.busywallet.studio`.

## Required engineering work
1. Create and configure a maintained Android project (Gradle, Android plugin, Capacitor version, SDK configuration and app signing).
2. Set the target SDK to Android 16 / API 36 for new app submissions from August 31, 2026, subject to any currently available Google extension.
3. Implement camera and microphone permission flows with clear just-in-time explanations. Request only permissions the final app needs.
4. Verify camera switching, WebGL/WebGPU/ONNX model loading, MediaPipe tracking, file selection, audio, WebRTC calling, orientation changes, lifecycle cleanup and low-memory behavior on physical Android devices.
5. Verify third-party SDK/library licenses and model redistribution terms. Do not bundle model weights until commercial redistribution rights are confirmed.
6. Audit all network requests and SDK data practices. Reconcile the privacy policy and Play Data safety form with observed behavior.
7. Add a visible in-app privacy policy link and consent disclosures for image processing, calling, speech recognition and translation.
8. Run automated tests and a physical-device test matrix. Fix crashes, freezes, thermal issues and unsupported-device paths.
9. Produce a signed release AAB, configure Play App Signing, and test an internal/closed track before production.

## Google Play account steps
- Register at https://play.google.com/console/signup using the developer's own Google Account.
- Select Personal only if publishing as an individual; select Organization only for a real organization that can meet Google's verification requirements.
- Complete identity and contact verification. Google may request government ID and payment-profile details.
- Pay Google's one-time US$25 registration fee for a full developer account. Fees and available payment methods are controlled by Google.
- New personal accounts may have additional closed-testing and Android-device verification requirements. Follow the exact tasks shown in the account dashboard.

## Listing and policy setup
- Create the app in Play Console with the final app name and permanent package name.
- Add the approved icon, feature graphic, genuine device screenshots, short and full descriptions.
- Add the public privacy-policy URL and a matching in-app link.
- Complete Data safety, Ads, App access, Target audience, Content rating, permissions and any other declarations truthfully.
- Configure paid-app pricing only after confirming the final commercial model. If the app is paid at $4.99, users pay before download; do not describe this as a subscription.
- Upload the signed AAB to internal testing, review Play's pre-launch report, fix all issues, complete required testing, then submit production review.

## Release gate — do not skip
- [ ] Android build installs and launches on supported physical devices.
- [ ] Camera/microphone permissions and denial paths work.
- [ ] No crashes on start, camera stop, call start/end, rotation, background/foreground.
- [ ] Neural engine behavior and supported-device requirements are clearly disclosed.
- [ ] Call video and audio work across separate networks, not only on one Wi-Fi.
- [ ] Privacy policy matches observed traffic and all SDK behavior.
- [ ] Data safety answers verified against final SDK inventory and network audit.
- [ ] All third-party model/code licenses permit intended commercial use.
- [ ] Signed AAB passes Play Console checks.
- [ ] Store screenshots are genuine captures of the tested release.
- [ ] Google testing and identity requirements completed.

## Official references
- Play Console registration: https://support.google.com/googleplay/android-developer/answer/6112435
- Prepare app for review: https://support.google.com/googleplay/android-developer/answer/9859455
- User Data / Data safety: https://support.google.com/googleplay/android-developer/answer/10144311
- Target API requirements: https://developer.android.com/google/play/requirements/target-sdk
- Create and set up app: https://support.google.com/googleplay/android-developer/answer/9859152

This plan is an engineering checklist, not confirmation that the app is approved, that the account is verified, or that an AAB has been built.

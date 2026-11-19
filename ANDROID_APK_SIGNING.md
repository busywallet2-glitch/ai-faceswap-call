# Android APK signing setup

This repository builds a signed Android release APK through GitHub Actions. The signing key is supplied only as GitHub Actions secrets; never commit the keystore or paste passwords into an issue, source file, or chat.

## One-time signing key setup

Create a dedicated release keystore on a trusted computer with Java 21 or newer:

```bash
keytool -genkeypair -v -keystore busywallet-release.jks -alias busywallet -keyalg RSA -keysize 4096 -validity 10000
```

Choose strong unique passwords and store the keystore and passwords in a secure offline backup. Losing this key can prevent updates to APKs distributed outside Play App Signing.

Convert the keystore to one Base64 line:

- macOS/Linux: `base64 -w 0 busywallet-release.jks` (on macOS use `base64 busywallet-release.jks | tr -d '\\n'`)
- Windows PowerShell: `[Convert]::ToBase64String([IO.File]::ReadAllBytes('busywallet-release.jks'))`

## Add GitHub repository secrets

Open the repository's **Settings → Secrets and variables → Actions → New repository secret** and add these four secrets:

- `ANDROID_KEYSTORE_BASE64`: the Base64 output of the keystore file
- `ANDROID_KEYSTORE_PASSWORD`: the keystore password
- `ANDROID_KEY_ALIAS`: `busywallet` (or the alias you chose)
- `ANDROID_KEY_PASSWORD`: the key password

Do not send these values to anyone.

## Run the build

Open **Actions → Build Android APK → Run workflow**. When the workflow succeeds, open that run and download the `Busywallet-AI-Face-Swap-APK` artifact.

## Important release limitations

- The app is currently a browser prototype wrapped in a Capacitor Android shell. A successful APK build does not prove that camera, microphone, neural inference, WebRTC calling, or all browser APIs work correctly on Android.
- Test the APK on real devices before public distribution. The prototype's neural model and browser dependencies may have Android WebView/GPU limitations.
- The application ID `com.busywallet.aifaceswap` is a proposed permanent identifier. Confirm ownership/availability before distributing a public release.
- Do not upload this APK to an app marketplace until the privacy disclosures, third-party model/library licences, app behavior, and marketplace requirements have been reviewed.

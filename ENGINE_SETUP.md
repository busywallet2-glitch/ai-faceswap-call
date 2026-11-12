# Busywallet Face Swapper — Local Engine Setup

This project is an independently branded studio and configuration layer. The browser page remains a static front end; neural processing and OS-level webcam output must run on a computer or GPU host that you control.

## What the Control Center does

- Builds a FaceFusion-compatible INI profile from the studio controls.
- Exports `facefusion.ini`.
- Copies a local launch command and a benchmark command.
- Exposes model, pixel-boost, weight, landmark, face-selection, execution, memory, benchmark, and logging settings.

It does **not** install Python, download model weights, run local shell commands, create a virtual camera, or start a GPU server from GitHub Pages.

## Local engine setup

Use the official FaceFusion installation guide and repository for the exact release and supported hardware. Follow its platform-specific dependency instructions. A typical source checkout is:

```bash
git clone https://github.com/facefusion/facefusion.git
cd facefusion
```

Place the exported `facefusion.ini` in the configuration location expected by the installed release. Confirm the keys and model identifiers against that release before running. Start with conservative settings and a short test clip before enabling webcam mode.

## Execution providers

- NVIDIA: CUDA or TensorRT, with compatible drivers/runtime and GPU.
- Apple: CoreML where supported.
- AMD: ROCm or DirectML depending on operating system and hardware.
- CPU: broad compatibility but usually much slower for live processing.

Do not select a provider merely because it appears in the dropdown. The installed runtime must actually include that provider and the device must support it.

## Webcam and OBS

The documented FaceFusion webcam workflow can expose an inline preview, UDP stream, or V4L2 device depending on OS and build. For the documented webcam command:

```bash
python facefusion.py run --ui-layouts webcam
```

For OBS, add the supported local stream/device as a source. UDP and V4L2 are different output paths; V4L2 is Linux-specific. A static web page alone cannot create either output. Confirm the current release's webcam options and port before configuring OBS.

## Docker options

The upstream Docker project provides separate CPU, CUDA, TensorRT, and ROCm compose files. Use only the container matching the host's GPU/runtime. A CPU container is useful for compatibility checks, not a promise of real-time performance. Refer to the upstream project's current compose instructions rather than assuming old image tags or port mappings remain valid.

## Benchmark workflow

1. Start with a modest resolution such as 240p or 360p.
2. Run cold and warm benchmark modes to distinguish model-loading overhead from steady-state inference.
3. Increase resolution gradually.
4. Monitor GPU memory and temperature.
5. Select a video-memory strategy that avoids exhausting the host.
6. Do not treat a benchmark result as proof that webcam streaming or video-call output is stable.

## Consent, safety, and licensing

Only process your own face or a person's face with their explicit permission. Disclose altered video to call participants. Do not use this system for impersonation, identity checks, or non-consensual intimate imagery.

FaceFusion code, individual model weights, and third-party components can have separate licenses and restrictions. Review each license before redistribution or commercial use. This project does not bundle third-party weights.

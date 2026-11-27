# Local LivePortrait setup (Windows)

This adds a reproducible local setup path for the official [KwaiVGI/LivePortrait](https://github.com/KwaiVGI/LivePortrait) project. It downloads upstream source and pretrained weights to your computer; it does not put model weights in GitHub Pages or commit large model files to this repository.

## Important capability distinction

LivePortrait is an **efficient portrait-animation / video-driven reenactment** project. Its upstream workflow uses a source portrait plus a driving video and produces an output video, with an optional Gradio interface. It is useful for evaluating portrait animation quality, but it is **not a drop-in real-time webcam face-swap server** and this setup does not connect it to our browser camera, WebRTC sender, WhatsApp, or Signal.

For the eventual live-call path, keep the local webcam engine (for example, a compatible FaceFusion webcam build) as a separate integration target. A desktop bridge and virtual-camera output will still need implementation and real-device testing.

## Requirements

Install these on the Windows computer first:

- Git for Windows, including Git LFS.
- Miniconda or Anaconda (the upstream README currently documents Python 3.9).
- FFmpeg with both ffmpeg and ffprobe available in PowerShell PATH.
- An NVIDIA GPU is recommended for practical inference speed. CPU mode may be very slow. CUDA/PyTorch compatibility depends on the installed driver and the exact upstream dependency versions.

Check the tools in PowerShell:

~~~powershell
git --version
git lfs version
conda --version
ffmpeg -version
ffprobe -version
~~~

## Run the setup script

From the root of this repository, open PowerShell and run:

~~~powershell
Set-ExecutionPolicy -Scope Process Bypass
.\scripts\setup-liveportrait.ps1
~~~

The script:

1. Clones the official source into vendor/LivePortrait if it is not already present.
2. Creates a Conda environment named LivePortrait with Python 3.9 if needed.
3. Installs the upstream requirements.txt.
4. Uses Git LFS to clone the official KwaiVGI/LivePortrait Hugging Face model repository into pretrained_weights.
5. Checks whether key model files are present and reports PyTorch/CUDA availability.

The script does not overwrite an existing weights folder. If a download is interrupted, inspect that folder and the Git LFS status before deciding whether to resume or remove it.

## Launch the upstream demo

~~~powershell
cd vendor/LivePortrait
conda activate LivePortrait
python app.py
~~~

For the upstream command-line inference path:

~~~powershell
python inference.py
~~~

Use python inference.py -h to inspect the exact options supported by the checked-out upstream revision.

## Next integration milestone

After confirming the upstream demo works on the target computer, benchmark it separately from the live camera pipeline. Only then should we design a local service/desktop bridge. Do not claim live-call support until the service can accept a consented camera stream, return processed frames at a stable frame rate, recover from dropped frames, and pass two-device WebRTC tests.

## Model, data, and consent

The script downloads third-party model weights from the upstream publisher. Review the upstream code and model terms before commercial use or redistribution. Keep source portraits and driving videos local unless you have explicitly chosen a trusted processing host. Use only your own face or a subject who has given informed permission, and disclose altered video to call participants.

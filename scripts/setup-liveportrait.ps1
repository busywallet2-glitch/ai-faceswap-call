$ErrorActionPreference = "Stop"

function Require-Command([string]$Name, [string]$InstallHint) {
    if (-not (Get-Command $Name -ErrorAction SilentlyContinue)) {
        throw "$Name is required but was not found. $InstallHint"
    }
}

Require-Command "git" "Install Git for Windows, then reopen PowerShell."
Require-Command "conda" "Install Miniconda or Anaconda, then reopen the Anaconda PowerShell prompt."
Require-Command "ffmpeg" "Install FFmpeg and add its bin folder to PATH."
Require-Command "ffprobe" "Install FFmpeg (including ffprobe) and add its bin folder to PATH."

$ProjectRoot = Split-Path -Parent $PSScriptRoot
$VendorRoot = Join-Path $ProjectRoot "vendor"
$LivePortraitDir = Join-Path $VendorRoot "LivePortrait"
$WeightsDir = Join-Path $LivePortraitDir "pretrained_weights"
$EnvironmentName = "LivePortrait"

New-Item -ItemType Directory -Force -Path $VendorRoot | Out-Null

if (-not (Test-Path (Join-Path $LivePortraitDir ".git"))) {
    if (Test-Path $LivePortraitDir) {
        throw "A folder already exists at $LivePortraitDir but is not a Git checkout. Move it aside, then run this script again."
    }
    Write-Host "Cloning the official KwaiVGI LivePortrait repository..."
    git clone https://github.com/KwaiVGI/LivePortrait.git $LivePortraitDir
} else {
    Write-Host "LivePortrait source checkout already exists."
}

$EnvironmentExists = conda env list | Select-String "^\s*$EnvironmentName\s"
if (-not $EnvironmentExists) {
    Write-Host "Creating the upstream-recommended Python 3.9 environment..."
    conda create -n $EnvironmentName python=3.9 -y
} else {
    Write-Host "Conda environment '$EnvironmentName' already exists."
}

Write-Host "Installing LivePortrait dependencies. This may take several minutes..."
conda run -n $EnvironmentName python -m pip install -r (Join-Path $LivePortraitDir "requirements.txt")

if (-not (Test-Path $WeightsDir)) {
    Write-Host "Preparing Git LFS and downloading official pretrained weights from Hugging Face..."
    git lfs install
    git clone https://huggingface.co/KwaiVGI/LivePortrait $WeightsDir
} else {
    Write-Host "A pretrained_weights folder already exists; leaving it untouched."
}

Write-Host "Checking the Python and PyTorch installation..."
conda run -n $EnvironmentName python -c "import sys, torch; print('Python:', sys.version.split()[0]); print('PyTorch:', torch.__version__); print('CUDA available:', torch.cuda.is_available()); print('GPU:', torch.cuda.get_device_name(0) if torch.cuda.is_available() else 'CPU mode')"

$RequiredWeights = @(
    "liveportrait\base_models\appearance_feature_extractor.pth",
    "liveportrait\base_models\motion_extractor.pth",
    "liveportrait\base_models\spade_generator.pth",
    "liveportrait\base_models\warping_module.pth",
    "insightface\models\buffalo_l\det_10g.onnx"
)
$MissingWeights = @($RequiredWeights | Where-Object { -not (Test-Path (Join-Path $WeightsDir $_)) })
if ($MissingWeights.Count -gt 0) {
    Write-Warning "Some expected model files are missing. Check Git LFS authentication/network and the upstream model repository:"
    $MissingWeights | ForEach-Object { Write-Warning " - $_" }
} else {
    Write-Host "Expected model files are present."
}

Write-Host "Setup stage finished."
Write-Host "To launch the upstream demo:"
Write-Host "  cd $LivePortraitDir"
Write-Host "  conda activate $EnvironmentName"
Write-Host "  python app.py"
Write-Host "Note: this upstream app animates portraits from driving video. It is not yet connected to this project's live camera or WebRTC call output."

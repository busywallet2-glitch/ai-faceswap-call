# Full-body live processing backend (foundation)

This folder is the backend foundation for the Face Tracking Studio project. It is **not yet a working full-body replacement engine**. The current service provides health and capability endpoints plus consent checks; it does not synthesize or replace a person's appearance.

## Why a backend is needed

The GitHub Pages site is static and runs in the browser. High-quality, low-latency full-body generation needs a separate GPU inference process. The browser should eventually send a camera stream to that process and receive a processed video track for WebRTC calling.

## Run the foundation locally

Requires Python 3.10+.

```bash
cd backend
python -m venv .venv
# Windows PowerShell:
.venv\Scripts\Activate.ps1
# macOS/Linux:
# source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --host 127.0.0.1 --port 8000
```

Check:
- `GET http://127.0.0.1:8000/health`
- `GET http://127.0.0.1:8000/api/capabilities`

The capability response intentionally reports `full_body_live: false` until an actual inference adapter is installed and tested.

## Planned live pipeline

1. Browser captures camera video and obtains explicit consent from the source person.
2. The likeness owner has authorized use of the reference identity.
3. A visible AI-altered-video indicator stays on during the call.
4. WebRTC sends the source stream to the GPU worker over an authenticated, encrypted connection.
5. The worker performs full-body appearance generation while preserving pose and motion.
6. The processed stream is returned as a video track and attached to the existing PeerJS/WebRTC call.
7. Camera frames are processed in memory and are not recorded by this API.

## Current limitations

- No model weights or inference code are included.
- No live video WebSocket/WebRTC processing endpoint exists yet.
- The `FULL_BODY_ENGINE_READY` setting must remain `false`; setting it to true does not install an engine.
- This starter API is for local development only. Before public deployment, add TLS, authentication, rate limits, session expiry, abuse controls, and origin restrictions.
- Do not deploy a public endpoint that accepts camera streams until those controls are implemented.

## Next implementation milestone

Choose and license a compatible open-source model, build a GPU worker adapter, benchmark end-to-end latency, then connect its output to the existing call track. The target is live full-body replacement; a UI toggle alone is not evidence that this capability works.

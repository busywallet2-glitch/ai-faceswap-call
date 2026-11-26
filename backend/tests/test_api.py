from pathlib import Path
import sys

from fastapi.testclient import TestClient

# Make the backend package importable when pytest runs from backend/.
sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from app import main


client = TestClient(main.app)


def valid_payload(**overrides):
    payload = {
        "source_person_consent": True,
        "likeness_owner_consent": True,
        "disclosure_enabled": True,
        "mode": "full_body_live",
    }
    payload.update(overrides)
    return payload


def test_health_reports_service_version():
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json()["status"] == "ok"
    assert response.json()["version"] == main.APP_VERSION


def test_capabilities_never_claim_engine_without_adapter(monkeypatch):
    monkeypatch.setattr(main, "ENGINE_READY", True)
    response = client.get("/api/capabilities")
    assert response.status_code == 200
    assert response.json()["full_body_live"] is False
    assert response.json()["engine_status"] == "configured_without_adapter"

    # Even with the configuration flag set, session creation must not claim
    # processed video until a real inference adapter is connected.
    session = client.post("/api/sessions", json=valid_payload())
    assert session.status_code == 200
    body = session.json()
    assert body["status"] == "engine_unavailable"
    assert body["processed_video_available"] is False


def test_session_rejects_missing_source_person_consent():
    response = client.post(
        "/api/sessions",
        json=valid_payload(source_person_consent=False),
    )
    assert response.status_code == 403


def test_session_rejects_missing_likeness_owner_consent():
    response = client.post(
        "/api/sessions",
        json=valid_payload(likeness_owner_consent=False),
    )
    assert response.status_code == 403


def test_session_rejects_missing_visible_disclosure():
    response = client.post(
        "/api/sessions",
        json=valid_payload(disclosure_enabled=False),
    )
    assert response.status_code == 403


def test_valid_consent_does_not_fake_engine_availability(monkeypatch):
    monkeypatch.setattr(main, "ENGINE_READY", False)
    response = client.post("/api/sessions", json=valid_payload())
    assert response.status_code == 200
    body = response.json()
    assert body["status"] == "engine_unavailable"
    assert body["processed_video_available"] is False
    assert body["session_token"]

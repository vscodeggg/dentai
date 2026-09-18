import sqlite3

from dental_ai.models import Finding
from dental_ai.services import DemoAI


def test_demo_ai_extracts_tooth_and_surface_terms():
    transcript = "tooth fourteen occlusal caries moderate"
    findings = DemoAI().parse_findings(transcript)
    assert findings
    first = findings[0]
    assert first.tooth_number == "14"
    assert first.surface.lower() == "occlusal"
    assert "caries" in first.finding_type.lower()


def test_database_can_persist_finding_records(tmp_path):
    from dental_ai.db import DentalDB

    db = DentalDB(db_path=str(tmp_path / "dental.db"))
    db.save_transcript_session("Marcus Vance", "tooth 14 occlusal caries moderate")
    db.save_finding(
        session_id=1,
        patient_name="Marcus Vance",
        tooth_number="14",
        surface="occlusal",
        finding_type="caries",
        value="moderate",
        unit=None,
        notes="Active decay",
    )

    row = db.conn.execute(
        "SELECT patient_name, tooth_number, surface, finding_type FROM findings WHERE session_id = 1"
    ).fetchone()
    assert row is not None
    assert row[0] == "Marcus Vance"
    assert row[1] == "14"
    assert row[2] == "occlusal"
    assert row[3] == "caries"

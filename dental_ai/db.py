import sqlite3
from pathlib import Path
from typing import Iterable, Sequence


class DentalDB:
    """Local SQLite store for patient sessions, transcripts, and chart findings."""

    def __init__(self, db_path: str | None = None):
        base_dir = Path(__file__).resolve().parent.parent
        self.db_path = Path(db_path) if db_path else base_dir / "dental_data.db"
        self.db_path.parent.mkdir(parents=True, exist_ok=True)
        self.conn = sqlite3.connect(self.db_path)
        self.conn.row_factory = sqlite3.Row
        self._init_db()

    def _init_db(self) -> None:
        self.conn.execute(
            """
            CREATE TABLE IF NOT EXISTS sessions (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                patient_name TEXT NOT NULL,
                transcript TEXT NOT NULL,
                source TEXT NOT NULL DEFAULT 'voice',
                created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
            )
            """
        )
        self.conn.execute(
            """
            CREATE TABLE IF NOT EXISTS findings (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                session_id INTEGER NOT NULL,
                patient_name TEXT NOT NULL,
                tooth_number TEXT NOT NULL,
                surface TEXT NOT NULL,
                finding_type TEXT NOT NULL,
                value TEXT,
                unit TEXT,
                notes TEXT,
                needs_review INTEGER NOT NULL DEFAULT 0,
                status TEXT NOT NULL DEFAULT 'active',
                created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY(session_id) REFERENCES sessions(id)
            )
            """
        )
        self.conn.execute(
            "CREATE INDEX IF NOT EXISTS idx_findings_patient ON findings(patient_name, created_at)"
        )
        self.conn.execute(
            "CREATE INDEX IF NOT EXISTS idx_findings_session ON findings(session_id)"
        )
        self.conn.commit()

    def save_transcript_session(self, patient_name: str, transcript: str, source: str = "voice") -> int:
        cursor = self.conn.execute(
            "INSERT INTO sessions (patient_name, transcript, source) VALUES (?, ?, ?)",
            (patient_name.strip() or "Active Patient", transcript.strip(), source),
        )
        self.conn.commit()
        return int(cursor.lastrowid)

    def save_finding(
        self,
        session_id: int,
        patient_name: str,
        tooth_number: str,
        surface: str,
        finding_type: str,
        value: str | None = None,
        unit: str | None = None,
        notes: str | None = None,
        needs_review: bool = False,
        status: str = "active",
    ) -> int:
        cursor = self.conn.execute(
            """
            INSERT INTO findings (
                session_id, patient_name, tooth_number, surface, finding_type, value, unit,
                notes, needs_review, status
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                session_id,
                patient_name.strip() or "Active Patient",
                str(tooth_number),
                str(surface or "unspecified"),
                str(finding_type or "clinical finding"),
                value,
                unit,
                notes,
                1 if needs_review else 0,
                status,
            ),
        )
        self.conn.commit()
        return int(cursor.lastrowid)

    def save_parsed_findings(
        self,
        patient_name: str,
        transcript: str,
        findings: Sequence[object],
        source: str = "voice",
    ) -> int:
        session_id = self.save_transcript_session(patient_name, transcript, source)
        if not findings:
            return session_id

        for finding in findings:
            if hasattr(finding, "as_dict"):
                payload = finding.as_dict()
            else:
                payload = dict(finding)

            self.save_finding(
                session_id=session_id,
                patient_name=patient_name,
                tooth_number=payload.get("tooth_number") or payload.get("toothId") or "",
                surface=payload.get("surface") or "unspecified",
                finding_type=payload.get("finding_type") or payload.get("condition") or "clinical finding",
                value=payload.get("value"),
                unit=payload.get("unit"),
                notes=payload.get("notes"),
                needs_review=bool(payload.get("needs_review", False)),
                status=payload.get("status", "active"),
            )
        return session_id

    def get_recent_sessions(self, limit: int = 20) -> list[dict]:
        rows = self.conn.execute(
            """
            SELECT id, patient_name, transcript, source, created_at
            FROM sessions
            ORDER BY created_at DESC
            LIMIT ?
            """,
            (limit,),
        ).fetchall()
        return [dict(row) for row in rows]

    def get_patient_findings(self, patient_name: str, limit: int = 50) -> list[dict]:
        rows = self.conn.execute(
            """
            SELECT id, patient_name, tooth_number, surface, finding_type, value, unit, notes,
                   needs_review, status, created_at
            FROM findings
            WHERE patient_name = ?
            ORDER BY created_at DESC
            LIMIT ?
            """,
            (patient_name, limit),
        ).fetchall()
        return [dict(row) for row in rows]

    def close(self) -> None:
        self.conn.close()

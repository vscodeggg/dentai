"""
AuraDent AI - Unified Python Backend & Web Server

Integrates the CLI dental voice engine (MicrophoneRecorder, DentalAI, Finding)
with the interactive 32-tooth web interface on port 3000.
"""

import json
import mimetypes
import os
import sys
import tempfile
import threading
import time
import webbrowser
from http import HTTPStatus
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import parse_qs, urlparse

from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Import dental_ai package components
from dental_ai.audio import MicrophoneRecorder
from dental_ai.db import DentalDB
from dental_ai.models import Finding
from dental_ai.services import DentalAI, DemoAI, send_email

BASE_DIR = Path(__file__).resolve().parent
WEB_DIR = BASE_DIR / "web"
MAMMOTTY_DIR = BASE_DIR.parent / "mammotty"

# Determine web static root
if WEB_DIR.exists() and (WEB_DIR / "index.html").exists():
    STATIC_DIR = WEB_DIR
elif MAMMOTTY_DIR.exists() and (MAMMOTTY_DIR / "index.html").exists():
    STATIC_DIR = MAMMOTTY_DIR
else:
    STATIC_DIR = BASE_DIR

# Global state and logs
SERVER_LOGS = []
MAX_LOGS = 100


def log_event(message: str, category: str = "info"):
    timestamp = time.strftime("%H:%M:%S")
    entry = {"time": timestamp, "message": message, "category": category}
    SERVER_LOGS.append(entry)
    if len(SERVER_LOGS) > MAX_LOGS:
        SERVER_LOGS.pop(0)
    print(f"[{timestamp}] [{category.upper()}] {message}")


# Initialize AI service
AI_SERVICE = None
try:
    AI_SERVICE = DentalAI()
    log_event(f"Initialized DentalAI with Whisper and {AI_SERVICE.chat_model}", "system")
except Exception as e:
    log_event(f"DentalAI init error ({e}); falling back to DemoAI", "warning")
    AI_SERVICE = DemoAI()

RECORDER = MicrophoneRecorder()
DB = DentalDB()


class DentalAppRequestHandler(SimpleHTTPRequestHandler):
    """Handles API requests and serves web interface assets."""

    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(STATIC_DIR), **kwargs)

    def _send_json(self, data: dict, status: int = 200):
        body = json.dumps(data).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Headers", "Content-Type, Authorization")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.end_headers()
        self.wfile.write(body)

    def do_OPTIONS(self):
        self.send_response(HTTPStatus.OK)
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Headers", "Content-Type, Authorization")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.end_headers()

    def do_GET(self):
        parsed = urlparse(self.path)
        path = parsed.path

        if path == "/api/status":
            self.handle_get_status()
        elif path == "/api/logs":
            self.handle_get_logs()
        elif path == "/api/sessions":
            self.handle_get_sessions()
        else:
            # Fallback to serving static files from STATIC_DIR
            super().do_GET()

    def do_POST(self):
        parsed = urlparse(self.path)
        path = parsed.path

        content_len = int(self.headers.get("Content-Length", 0))
        raw_body = self.rfile.read(content_len) if content_len > 0 else b"{}"

        try:
            payload = json.loads(raw_body.decode("utf-8")) if raw_body else {}
        except Exception:
            payload = {}

        if path == "/api/record-mic":
            self.handle_record_mic(payload)
        elif path == "/api/transcribe":
            self.handle_transcribe(raw_body)
        elif path == "/api/parse":
            self.handle_parse(payload)
        elif path == "/api/report":
            self.handle_report(payload)
        elif path == "/api/send-email":
            self.handle_send_email(payload)
        else:
            self._send_json({"error": f"Endpoint not found: {path}"}, status=404)

    # ------------------ API Handlers ------------------

    def handle_get_status(self):
        is_live = isinstance(AI_SERVICE, DentalAI)
        model_name = getattr(AI_SERVICE, "chat_model", "Local Regex Engine")
        whisper_model = getattr(AI_SERVICE, "whisper_model", "Local Demo")
        self._send_json({
            "status": "online",
            "backend": "Python DentalAI (Groq Whisper + LLM)",
            "live_mode": is_live,
            "whisper_model": whisper_model,
            "chat_model": model_name,
            "groq_key_configured": bool(os.getenv("GROQ_API_KEY")),
            "static_root": str(STATIC_DIR),
            "log_count": len(SERVER_LOGS)
        })

    def handle_get_logs(self):
        self._send_json({"logs": SERVER_LOGS})

    def handle_get_sessions(self):
        sessions = DB.get_recent_sessions(limit=20)
        self._send_json({"sessions": sessions})

    def handle_record_mic(self, payload):
        """Records 5 seconds of audio from the physical microphone and transcribes it."""
        seconds = int(payload.get("seconds", 5))
        patient_name = str(payload.get("patient_name") or "Active Patient")
        log_event(f"Microphone recording requested ({seconds}s)...", "mic")

        try:
            audio_path = RECORDER.record_chunk(seconds=seconds)
            log_event(f"Recorded chunk to {audio_path.name}. Transcribing with Whisper...", "mic")

            transcript = ""
            if isinstance(AI_SERVICE, DentalAI):
                try:
                    transcript = AI_SERVICE.transcribe(str(audio_path)).strip()
                except Exception as ex:
                    log_event(f"Transcription failed: {ex}", "error")
                    transcript = ""
            else:
                transcript = "Tooth 14 occlusal caries moderate"

            audio_path.unlink(missing_ok=True)

            findings = []
            findings_objs = []
            if transcript:
                log_event(f"Transcript: '{transcript}'. Extracting findings...", "ai")
                findings_objs = AI_SERVICE.parse_findings(transcript)
                findings = [f.as_dict() for f in findings_objs]
                DB.save_parsed_findings(patient_name, transcript, findings_objs, source="voice")
                log_event(f"Extracted {len(findings)} finding(s) and saved to SQLite", "ai")
            else:
                log_event("Silence or no audio transcribed", "warning")

            self._send_json({
                "success": True,
                "transcript": transcript,
                "findings": findings,
                "timestamp": time.strftime("%H:%M:%S")
            })
        except Exception as exc:
            log_event(f"Mic record error: {exc}", "error")
            self._send_json({"success": False, "error": str(exc)}, status=500)

    def handle_transcribe(self, raw_body):
        """Transcribes incoming audio file data."""
        try:
            with tempfile.NamedTemporaryFile(suffix=".wav", delete=False) as tmp:
                tmp.write(raw_body)
                tmp_path = tmp.name

            try:
                transcript = AI_SERVICE.transcribe(tmp_path).strip()
                log_event(f"Transcribed audio chunk: '{transcript}'", "ai")
                self._send_json({"success": True, "transcript": transcript})
            finally:
                if os.path.exists(tmp_path):
                    os.remove(tmp_path)
        except Exception as exc:
            log_event(f"Audio transcribe error: {exc}", "error")
            self._send_json({"success": False, "error": str(exc)}, status=500)

    def handle_parse(self, payload):
        """Parses transcript into structured Finding objects."""
        transcript = payload.get("transcript", "").strip()
        patient_name = str(payload.get("patient_name") or "Active Patient")
        recent_data = payload.get("recent", [])

        recent_findings = []
        for r in recent_data:
            try:
                recent_findings.append(Finding(
                    tooth_number=str(r.get("tooth_number", r.get("toothId", ""))),
                    surface=str(r.get("surface", "unspecified")),
                    finding_type=str(r.get("finding_type", r.get("condition", "clinical finding"))),
                    value=r.get("value"),
                    unit=r.get("unit"),
                    notes=r.get("notes"),
                    needs_review=bool(r.get("needs_review", False)),
                    status=str(r.get("status", "active"))
                ))
            except Exception:
                pass

        log_event(f"Parsing speech input: '{transcript}'", "ai")
        findings_objs = AI_SERVICE.parse_findings(transcript, recent=recent_findings)
        findings = [f.as_dict() for f in findings_objs]
        if transcript:
            DB.save_parsed_findings(patient_name, transcript, findings_objs, source="voice")
        log_event(f"Identified {len(findings)} finding(s) from speech and saved to SQLite", "ai")

        self._send_json({
            "success": True,
            "transcript": transcript,
            "findings": findings
        })

    def handle_report(self, payload):
        """Generates patient-friendly report from approved findings."""
        findings_data = payload.get("findings", [])
        findings_objs = []
        for f in findings_data:
            try:
                findings_objs.append(Finding(
                    tooth_number=str(f.get("tooth_number", f.get("toothId", ""))),
                    surface=str(f.get("surface", "unspecified")),
                    finding_type=str(f.get("finding_type", f.get("condition", "clinical finding"))),
                    value=f.get("value"),
                    unit=f.get("unit"),
                    notes=f.get("notes") or f.get("clinicalNote"),
                    needs_review=bool(f.get("needs_review", False)),
                    status=str(f.get("status", "active"))
                ))
            except Exception:
                pass

        log_event(f"Generating patient report for {len(findings_objs)} findings...", "ai")
        report = AI_SERVICE.generate_report(findings_objs)
        log_event("Patient report generated successfully", "ai")

        self._send_json({
            "success": True,
            "report": report
        })

    def handle_send_email(self, payload):
        """Sends patient report email via SMTP."""
        report = payload.get("report", "")
        recipient = payload.get("recipient") or os.getenv("PATIENT_EMAIL", "patient@example.com")
        subject = payload.get("subject", "Your Dental Visit Summary - AuraDent AI")

        log_event(f"Dispatching email report to {recipient}...", "email")
        try:
            send_email(report, recipient, subject)
            log_event(f"Email sent to {recipient}", "email")
            self._send_json({"success": True, "message": f"Email delivered to {recipient}"})
        except Exception as exc:
            log_event(f"Email send warning: {exc} (logging to file)", "warning")
            # Save local copy if SMTP credentials are demo
            out_file = BASE_DIR / "sent_report_preview.txt"
            out_file.write_text(f"To: {recipient}\nSubject: {subject}\n\n{report}", encoding="utf-8")
            self._send_json({
                "success": True,
                "warning": str(exc),
                "message": f"SMTP simulated (saved to {out_file.name})"
            })


def run_server(port: int = 3000, open_browser: bool = True):
    server_address = ("", port)
    httpd = ThreadingHTTPServer(server_address, DentalAppRequestHandler)
    url = f"http://localhost:{port}"

    print("=" * 65)
    print("🦷 AuraDent AI - Voice-First Dental Assistant")
    print("=" * 65)
    print(f"Web Interface: {url}")
    print(f"Serving From:  {STATIC_DIR}")
    print(f"Backend Engine: {'DentalAI (Groq Whisper + LLM)' if isinstance(AI_SERVICE, DentalAI) else 'DemoAI'}")
    print("API Endpoints: /api/status, /api/record-mic, /api/parse, /api/report, /api/logs")
    print("=" * 65)

    if open_browser:
        threading.Timer(0.8, lambda: webbrowser.open(url)).start()

    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\nStopping AuraDent AI server.")
        httpd.server_close()


if __name__ == "__main__":
    port = int(sys.argv[1]) if len(sys.argv) > 1 and sys.argv[1].isdigit() else 3000
    run_server(port=port, open_browser=False)

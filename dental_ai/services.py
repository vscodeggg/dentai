import json
import os
import re
import smtplib
from email.mime.text import MIMEText
from typing import Iterable, Optional

from .models import Finding

CORRECTION_PHRASES = ("actually", "make that", "scratch that", "correction")
NUMBER_WORDS = {
    "one": 1, "two": 2, "three": 3, "four": 4, "five": 5, "six": 6, "seven": 7,
    "eight": 8, "nine": 9, "ten": 10, "eleven": 11, "twelve": 12, "thirteen": 13,
    "fourteen": 14, "fifteen": 15, "sixteen": 16, "seventeen": 17, "eighteen": 18,
    "nineteen": 19, "twenty": 20, "twenty one": 21, "twenty-one": 21, "twenty two": 22,
    "twenty-two": 22, "twenty three": 23, "twenty-three": 23, "twenty four": 24,
    "twenty-four": 24, "twenty five": 25, "twenty-five": 25, "twenty six": 26,
    "twenty-six": 26, "twenty seven": 27, "twenty-seven": 27, "twenty eight": 28,
    "twenty-eight": 28, "twenty nine": 29, "twenty-nine": 29, "thirty": 30,
    "thirty one": 31, "thirty-one": 31, "thirty two": 32, "thirty-two": 32,
}

# Preferred models for Groq in order of capability and availability
PREFERRED_CHAT_MODELS = [
    "openai/gpt-oss-20b",
    "qwen/qwen3.8-27b",
    "openai/gpt-oss-120b",
    "llama-3.3-70b-versatile",
]


def normalize_surface(surface: str | None) -> str:
    if not surface:
        return "unspecified"
    value = surface.strip().lower()
    mapping = {
        "mesial": "mesial",
        "distal": "distal",
        "occlusal": "occlusal",
        "buccal": "buccal",
        "facial": "facial",
        "lingual": "lingual",
        "palatal": "lingual",
        "incisal": "incisal",
        "mod": "mod",
        "m o d": "mod",
        "mo": "mo",
        "do": "do",
    }
    return mapping.get(value, value)


def extract_tooth_number(transcript: str) -> str:
    phrase = transcript.lower().strip()

    for token, value in sorted(NUMBER_WORDS.items(), key=lambda item: len(item[0]), reverse=True):
        if re.search(rf"(?:tooth|number|#)?\s*\b{re.escape(token)}\b", phrase):
            return str(value)

    digit_match = re.search(r"(?:tooth|number|#)?\s*(\d{1,2})", phrase)
    if digit_match:
        tooth = str(int(digit_match.group(1)))
        return tooth if 1 <= int(tooth) <= 32 else ""

    return ""


def has_correction(transcript: str) -> bool:
    lowered = transcript.lower()
    return any(phrase in lowered for phrase in CORRECTION_PHRASES)


class DentalAI:
    """Groq-backed transcription, charting, and patient-report generation."""

    def __init__(self, api_key: Optional[str] = None, model: Optional[str] = None):
        key = api_key or os.getenv("GROQ_API_KEY")
        if not key:
            raise RuntimeError("GROQ_API_KEY is required for live mode.")
        from groq import Groq

        self.client = Groq(api_key=key.strip())
        self.whisper_model = "whisper-large-v3-turbo"
        self.chat_model = model or self._detect_best_chat_model()

    def _detect_best_chat_model(self) -> str:
        try:
            available = [m.id for m in self.client.models.list().data]
            for candidate in PREFERRED_CHAT_MODELS:
                if candidate in available:
                    return candidate
            return "openai/gpt-oss-20b"
        except Exception:
            return "openai/gpt-oss-20b"

    def transcribe(self, audio_path: str) -> str:
        with open(audio_path, "rb") as audio_file:
            result = self.client.audio.transcriptions.create(
                file=audio_file,
                model=self.whisper_model,
            )
        return result.text

    def parse_findings(self, transcript: str, recent: Iterable[Finding] = ()) -> list[Finding]:
        context = json.dumps([finding.as_dict() for finding in recent])
        prompt = f"""Convert the dentist transcript into a JSON array of findings.
Schema: tooth_number, surface, finding_type, value, unit, notes, needs_review.
Use strings for tooth_number, value, and unit. needs_review must be boolean.
If this is a correction, update the matching recent finding rather than adding a duplicate.
Recent findings: {context}
Transcript: {transcript}"""

        try:
            response = self.client.chat.completions.create(
                model=self.chat_model,
                temperature=0,
                response_format={"type": "json_object"},
                messages=[
                    {"role": "system", "content": "You are an expert dental charting assistant. Return {\"findings\": [{\"tooth_number\": \"14\", \"surface\": \"occlusal\", \"finding_type\": \"caries\", \"value\": \"moderate\", \"unit\": null, \"notes\": \"Active decay\", \"needs_review\": false}]} only."},
                    {"role": "user", "content": prompt},
                ],
            )
            content = response.choices[0].message.content
            payload = json.loads(content)
            items = payload.get("findings", [])
            findings = []
            for item in items:
                # Ensure correct keys and defaults
                findings.append(Finding(
                    tooth_number=str(item.get("tooth_number", "")),
                    surface=str(item.get("surface", "unspecified")),
                    finding_type=str(item.get("finding_type", "clinical finding")),
                    value=str(item["value"]) if item.get("value") is not None else None,
                    unit=str(item["unit"]) if item.get("unit") is not None else None,
                    notes=str(item["notes"]) if item.get("notes") is not None else None,
                    needs_review=bool(item.get("needs_review", False)),
                    status=str(item.get("status", "active"))
                ))
            return findings
        except Exception as exc:
            # Fallback to local DemoAI parser if LLM call encounters any error
            print(f"[DentalAI Warning] LLM parsing failed ({exc}), using rule-based parser fallback.")
            return DemoAI().parse_findings(transcript, recent)

    def generate_report(self, findings: Iterable[Finding]) -> str:
        payload = json.dumps([finding.as_dict() for finding in findings])
        try:
            response = self.client.chat.completions.create(
                model=self.chat_model,
                temperature=0.2,
                messages=[
                    {"role": "system", "content": "Write a warm, professional, plain-language dental visit summary. Explain each problem and recommend appropriate next steps in encouraging, understandable words. Do not invent diagnoses not present in findings."},
                    {"role": "user", "content": f"Approved chart findings: {payload}"},
                ],
            )
            return response.choices[0].message.content.strip()
        except Exception as exc:
            print(f"[DentalAI Warning] LLM report failed ({exc}), using template fallback.")
            return DemoAI().generate_report(findings)


class DemoAI:
    """Deterministic local adapter for rehearsals and tests without API credentials."""

    def transcribe(self, audio_path: str) -> str:
        raise RuntimeError("Demo mode uses scripted transcript chunks; no audio file is needed.")

    def parse_findings(self, transcript: str, recent: Iterable[Finding] = ()) -> list[Finding]:
        tooth = extract_tooth_number(transcript)
        if not tooth:
            return []

        text = transcript.lower()
        surface_match = re.search(
            r"(mesial|distal|occlusal|buccal|facial|lingual|palatal|incisal|mod|mo|do)",
            transcript,
            re.IGNORECASE,
        )
        surface = normalize_surface(surface_match.group(1) if surface_match else "unspecified")

        if re.search(r"pocket|probing|bleeding on probing|bop", text):
            depth_match = re.search(r"(?:pocket|probing)\s+(?:depth\s+)?(\d+)\s*(?:mm|millimeter|millimeters)?", transcript, re.IGNORECASE)
            value = depth_match.group(1) if depth_match else "present"
            finding_type = "pocket depth"
            unit = "mm"
        elif re.search(r"caries|decay|cavity|dental decay|tooth decay", text):
            severity = "moderate"
            if re.search(r"deep|severe|extensive|large", text):
                severity = "severe"
            elif re.search(r"early|incipient|small|mild", text):
                severity = "mild"
            finding_type = "caries"
            value = severity
            unit = None
        elif re.search(r"fracture|crack|chip|broken tooth", text):
            finding_type = "fracture"
            value = "present"
            unit = None
        elif re.search(r"crown|cap|full coverage", text):
            finding_type = "crown"
            value = "present"
            unit = None
        elif re.search(r"missing|extracted|absent", text):
            finding_type = "missing tooth"
            value = "present"
            unit = None
        elif re.search(r"composite|resin|filling|restoration|tooth colored filling", text):
            finding_type = "restoration"
            value = "present"
            unit = None
        elif re.search(r"wear|attrition|abrasion", text):
            finding_type = "tooth wear"
            value = "noted"
            unit = None
        else:
            finding_type = "clinical finding"
            value = transcript.strip()[:120]
            unit = None

        needs_review = bool(re.search(r"unclear|unsure|check|warning|conflict|maybe|possibly|likely", transcript, re.IGNORECASE))
        candidate = Finding(tooth, surface, finding_type, value, unit, needs_review=needs_review)

        if has_correction(transcript):
            for old in reversed(list(recent)):
                if old.tooth_number == tooth and old.status == "active":
                    old.status = "corrected"
                    candidate.notes = f"Correction to {old.finding_type} {old.display_value}"
                    break

        return [candidate]

    def generate_report(self, findings: Iterable[Finding]) -> str:
        active = [finding for finding in findings if finding.status == "active"]
        if not active:
            return "No clinical findings were recorded during this visit."
        lines = ["Dental Visit Summary", "", "Your dentist recorded the following findings:"]
        lines.extend(
            f"- Tooth #{finding.tooth_number}, {finding.surface}: {finding.finding_type} ({finding.display_value})."
            for finding in active
        )
        lines.extend(["", "Please contact your dental office with any questions about your care."])
        return "\n".join(lines)


def send_email(report: str, recipient: str, subject: str = "Your Dental Visit Summary") -> None:
    host = os.getenv("SMTP_HOST", "smtp.gmail.com")
    port = int(os.getenv("SMTP_PORT", "465"))
    username = os.getenv("SMTP_USERNAME")
    password = os.getenv("SMTP_PASSWORD")
    if not username or not password:
        raise RuntimeError("SMTP_USERNAME and SMTP_PASSWORD are required to send email.")
    message = MIMEText(report)
    message["Subject"] = subject
    message["From"] = username
    message["To"] = recipient
    with smtplib.SMTP_SSL(host, port) as server:
        server.login(username, password)
        server.send_message(message)

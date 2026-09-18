<<<<<<< HEAD
# mammotty
=======
<<<<<<< HEAD
# CLI_dental
# CLI Dentist — Voice-to-Text Prototype

A terminal-based first step toward a voice-first dental charting assistant.
Right now this repo contains **two working entry points that both do live
microphone-to-text transcription**, built at different points and kept
side by side:

- **`app.py`** — a single, dependency-light script. No project package,
  just functions in one file. This is the one to run first.
- **`main.py`** — a slightly more structured version that reuses the
  `dental_ai` package (`MicrophoneRecorder` + `DentalAI`) and renders the
  transcript in a live-updating `rich` panel instead of plain `print`.

The `dental_ai` package also contains groundwork for the *next* stages of
the project (parsing transcripts into structured findings and emailing a
patient report) that neither entry point wires up yet — see
[`dental_ai/services.py`](#dental_aiservicespy) below.

## File map

```
cli_dentist/
├── app.py                 # standalone voice-to-transcript CLI (run this)
├── main.py                # same idea, using the dental_ai package + rich UI
├── requirements.txt       # pinned minimum versions of every dependency
├── .env.example            # template for the .env file (copy, don't commit)
├── .gitignore              # keeps .env, caches, and .wav files out of git
├── .gitattributes          # normalizes line endings across OSes
└── dental_ai/
    ├── __init__.py         # empty package marker + docstring
    ├── audio.py            # MicrophoneRecorder: mic -> .wav file
    ├── models.py           # Finding: one structured chart entry
    └── services.py         # Groq-backed AI calls + demo mode + email sending
```

## Setup

```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
copy .env.example .env
# then edit .env and paste in your real GROQ_API_KEY
```

Run it:

```powershell
python app.py
```

Speak into your mic. Every ~5 seconds of audio gets transcribed and
printed with a timestamp. Press `Ctrl+C` to stop and see the full
stitched-together transcript.

---

## `app.py` line by line

```python
"""
Voice-to-transcript CLI tool.
...
"""
```
A module-level docstring used as inline documentation — describes what the
script does, how to install its dependencies, and how to run it. It has no
effect on execution; it's there for anyone opening the file cold.

```python
import os
import sys
import tempfile
import time
```
Standard library imports:
- `os` — reads the `GROQ_API_KEY` environment variable and deletes the
  temp `.wav` file after each chunk is transcribed.
- `sys` — used to exit the program (`sys.exit(1)`) if no API key is set.
- `tempfile` — creates a throwaway `.wav` file per audio chunk instead of
  managing filenames by hand.
- `time` — formats the `HH:MM:SS` timestamp printed next to each
  transcript line.

```python
import numpy as np
import sounddevice as sd
from dotenv import load_dotenv
from scipy.io.wavfile import write as write_wav
from groq import Groq
```
Third-party imports:
- `numpy as np` — the mic gives back audio as a NumPy array; used here
  just to check its average loudness (`np.abs(audio).mean()`).
- `sounddevice as sd` — talks to the OS microphone (`sd.rec`, `sd.wait`).
- `load_dotenv` — reads a `.env` file in the current directory and copies
  its `KEY=value` pairs into `os.environ`, so `os.environ.get(...)` below
  can see `GROQ_API_KEY` without you exporting it manually every session.
- `write_wav` — writes a NumPy array out as a valid `.wav` file (adds the
  WAV header, handles the sample format) so Groq's API can accept it.
- `Groq` — the API client used to call Whisper for transcription.

```python
load_dotenv()
```
Runs immediately at import time, before anything else — loads `.env`
into the process environment so every function below can rely on
`GROQ_API_KEY` already being set.

```python
# ---- Config ----
SAMPLE_RATE = 16000        # Whisper models expect 16kHz mono
CHUNK_SECONDS = 5          # how long each recording chunk is
MODEL = "whisper-large-v3-turbo"   # fast + accurate; use "whisper-large-v3" for max accuracy
```
Three constants controlling the whole script's behavior:
- `SAMPLE_RATE` — 16,000 samples/second, the rate Whisper-family models
  are trained on. Recording at a different rate would still "work" but
  can hurt transcription accuracy.
- `CHUNK_SECONDS` — how long the script listens before it stops and sends
  that chunk off for transcription. Shorter = more responsive but more
  API calls; longer = fewer calls but higher latency per update.
- `MODEL` — which Groq-hosted Whisper model to call. `-turbo` trades a
  little accuracy for a lot of speed.

```python
def get_client():
    api_key = os.environ.get("GROQ_API_KEY")
    if not api_key:
        print("Error: set GROQ_API_KEY as an environment variable first.")
        print('  export GROQ_API_KEY="your-key-here"')
        sys.exit(1)
    return Groq(api_key=api_key)
```
Builds the Groq client. Reads the key from the environment (populated by
`load_dotenv()` above, or by a real shell export). If it's missing,
prints instructions and calls `sys.exit(1)` — this stops the program
immediately with a non-zero exit code instead of crashing later with a
confusing authentication error from inside the `groq` library.

```python
def record_chunk(duration=CHUNK_SECONDS, sample_rate=SAMPLE_RATE):
    """Records `duration` seconds of audio from the default mic and
    returns it as a numpy array."""
    audio = sd.rec(
        int(duration * sample_rate),
        samplerate=sample_rate,
        channels=1,
        dtype="int16",
    )
    sd.wait()  # block until recording finishes
    return audio
```
Records one chunk of microphone audio:
- `sd.rec(frames, samplerate, channels, dtype)` starts recording
  asynchronously. `frames` is the total sample count (`duration *
  sample_rate` — e.g. 5 seconds × 16,000 = 80,000 samples).
  `channels=1` means mono. `dtype="int16"` is standard 16-bit PCM audio,
  the format both `.wav` files and Whisper expect.
- `sd.wait()` blocks the script until that recording finishes, so the
  function doesn't return a half-filled array.
- Returns the raw NumPy array of samples (not yet a file).

```python
def transcribe_chunk(client, audio, sample_rate=SAMPLE_RATE):
    """Writes the audio chunk to a temp wav file and sends it to Groq
    for transcription. Returns the transcript text."""
    with tempfile.NamedTemporaryFile(suffix=".wav", delete=False) as tmp:
        write_wav(tmp.name, sample_rate, audio)
        tmp_path = tmp.name

    try:
        with open(tmp_path, "rb") as f:
            result = client.audio.transcriptions.create(
                file=f,
                model=MODEL,
                language="en",
            )
        return result.text.strip()
    finally:
        os.remove(tmp_path)
```
Turns one recorded chunk into text:
- `tempfile.NamedTemporaryFile(suffix=".wav", delete=False)` creates an
  empty temp file and gives it a real path (`tmp.name`). `delete=False`
  is required on Windows — you can't reopen a file that a
  still-open `NamedTemporaryFile` has locked for deletion.
- `write_wav(tmp.name, sample_rate, audio)` writes the NumPy array to
  that path as a proper `.wav` file (header + PCM data).
- The file is then reopened in binary mode (`"rb"`) and streamed to
  `client.audio.transcriptions.create(...)` — Groq's Whisper endpoint —
  along with which `model` to use and that the spoken `language` is
  English (skips language auto-detection, which is faster and more
  reliable for a single-language demo).
- `result.text.strip()` returns just the transcribed text, with leading/
  trailing whitespace removed.
- The `finally: os.remove(tmp_path)` guarantees the temp `.wav` file is
  deleted after the API call, whether it succeeded or raised — so a
  failed request doesn't leave orphaned files behind.

```python
def is_silent(audio, threshold=200):
    """Rough silence check so we don't waste API calls transcribing dead air.
    Threshold is on a 16-bit int scale (0-32767); tune if it's too
    sensitive or not sensitive enough for your mic."""
    return np.abs(audio).mean() < threshold
```
A cheap loudness check done entirely locally, with no API call:
`np.abs(audio)` makes every sample positive, `.mean()` averages them into
one number representing how loud the chunk was overall, and that's
compared against `threshold`. If the average is below 200 (out of a
possible 0–32767 for 16-bit audio), the chunk is treated as silence.
This exists purely to save API calls (and money/latency) on dead air
between sentences.

```python
def main():
    client = get_client()
    print("Voice-to-transcript running. Speak naturally. Press Ctrl+C to stop.\n")

    full_transcript = []
```
Entry point. Builds the client (exits early if no key), prints a banner
so the user knows the mic loop is about to start, and initializes
`full_transcript` — a list that accumulates every non-empty chunk of text
for the final summary printed at the end.

```python
    try:
        while True:
            audio = record_chunk()

            if is_silent(audio):
                continue  # skip API call for silent chunks

            text = transcribe_chunk(client, audio)

            if text:
                timestamp = time.strftime("%H:%M:%S")
                print(f"[{timestamp}] {text}")
                full_transcript.append(text)
```
The main loop, wrapped in `try` so it can be interrupted cleanly:
- `while True` — runs forever, one `CHUNK_SECONDS`-long recording at a
  time, until the user stops it.
- `record_chunk()` blocks for ~5 seconds capturing audio.
- `is_silent(audio)` — if the chunk was silence, `continue` skips
  straight to the next loop iteration without ever calling the Groq API.
- Otherwise `transcribe_chunk(client, audio)` sends it off and gets text
  back.
- If Whisper returned actual text (not empty — e.g. a chunk that's
  mostly silence but not below the threshold can come back empty), it's
  timestamped, printed immediately, and appended to `full_transcript`.

```python
    except KeyboardInterrupt:
        print("\n\nStopped.\n")
        print("Full transcript:")
        print(" ".join(full_transcript))
```
Catches `Ctrl+C`. Without this, pressing Ctrl+C would print a Python
stack trace. Instead it prints a clean "Stopped" message and joins every
recorded chunk of text into one final transcript, space-separated.

```python
if __name__ == "__main__":
    main()
```
Standard Python idiom: only runs `main()` when this file is executed
directly (`python app.py`), not if it were ever imported by another
script.

---

## `main.py` line by line

This is a second implementation of the same idea, built around the
`dental_ai` package instead of standalone functions, with a `rich`
live-updating terminal panel instead of plain `print` lines.

```python
"""Live microphone-to-text loop: speak, watch the transcript build in the terminal."""
```
Module docstring — one-line summary of what the file does.

```python
import sys

from dotenv import load_dotenv
from rich.console import Console
from rich.live import Live
from rich.panel import Panel
from rich.text import Text

from dental_ai.audio import MicrophoneRecorder
from dental_ai.services import DentalAI
```
- `sys` — used for `sys.exit(1)` if the AI client can't start.
- `load_dotenv` — same role as in `app.py`: loads `.env` into the
  environment.
- `Console`, `Live`, `Panel`, `Text` — `rich` building blocks. `Console`
  is the thing you print through; `Live` lets a region of the terminal
  be redrawn in place instead of scrolling; `Panel` draws a bordered box
  with a title; `Text` is a styleable string.
- `MicrophoneRecorder` — the class from `dental_ai/audio.py` that
  records a chunk and returns a `.wav` file path (instead of a raw NumPy
  array, which is what `app.py` works with directly).
- `DentalAI` — the class from `dental_ai/services.py` that wraps the Groq
  client for transcription (and later, parsing/report generation).

```python
CHUNK_SECONDS = 6
```
Same idea as `app.py`'s `CHUNK_SECONDS`, just a different default length
(6 seconds here vs. 5 in `app.py` — these two files were tuned
independently).

```python
def render(lines: list[str]) -> Panel:
    body = Text("\n".join(f"- {line}" for line in lines) if lines else "Listening...")
    return Panel(body, title="Live Transcript", border_style="cyan")
```
Builds what the terminal should currently show: every transcript line
so far, each prefixed with `"- "` and joined with newlines, wrapped in a
cyan-bordered box titled "Live Transcript". If there are no lines yet, it
shows a placeholder ("Listening...") instead of an empty box. This
function is called every time the display needs to be redrawn — it
rebuilds the whole panel from the current list rather than mutating one.

```python
def main() -> None:
    load_dotenv()
    console = Console()

    try:
        ai = DentalAI()
    except RuntimeError as exc:
        console.print(f"[red]{exc}[/red]")
        sys.exit(1)
```
Loads `.env`, creates a `rich` console to print through, and constructs
`DentalAI()`. `DentalAI.__init__` (see `services.py` below) raises a
`RuntimeError` if `GROQ_API_KEY` isn't set — that's caught here, printed
in red, and the program exits with status 1, mirroring what `app.py`'s
`get_client()` does with plain `print`/`sys.exit`.

```python
    recorder = MicrophoneRecorder()
    transcript_lines: list[str] = []

    console.print("[bold green]Voice-to-text is live.[/bold green] Speak naturally. Press Ctrl+C to stop.\n")
```
Creates the recorder (default 16kHz mono, same as `app.py`), an empty
list to hold each transcribed chunk, and prints a green banner. The
`[bold green]...[/bold green]` syntax is `rich` markup — it styles just
that span of text, unlike `app.py`'s plain `print()`.

```python
    with Live(render(transcript_lines), console=console, refresh_per_second=4) as live:
```
Opens a `rich` "Live" region: `render(transcript_lines)` draws the
initial (empty) panel, and `refresh_per_second=4` caps how often the
terminal redraws so it doesn't flicker. Everything inside this `with`
block can call `live.update(...)` to redraw that same region in place
rather than printing new lines.

```python
        try:
            while True:
                audio_path = recorder.record_chunk(seconds=CHUNK_SECONDS)
                try:
                    text = ai.transcribe(str(audio_path)).strip()
                except Exception as exc:
                    console.print(f"\n[red]Transcription error: {exc}[/red]")
                    continue
                finally:
                    audio_path.unlink(missing_ok=True)

                if text:
                    transcript_lines.append(text)
                    live.update(render(transcript_lines))
        except KeyboardInterrupt:
            pass
```
The main loop:
- `recorder.record_chunk(seconds=CHUNK_SECONDS)` blocks for 6 seconds and
  returns a `Path` to a temp `.wav` file (see `audio.py`).
- `ai.transcribe(str(audio_path))` sends that file to Groq Whisper and
  returns the text (see `services.py`).
- If transcription raises *any* exception (network error, bad audio,
  etc.), it's caught broadly, printed in red, and the loop `continue`s to
  the next chunk instead of crashing the whole session.
- `finally: audio_path.unlink(missing_ok=True)` deletes the temp `.wav`
  file every time, whether transcription succeeded, failed, or raised —
  `missing_ok=True` means it won't itself raise if the file is somehow
  already gone.
- If there's actual text, it's appended to `transcript_lines` and
  `live.update(render(...))` redraws the panel with the new line
  included.
- `except KeyboardInterrupt: pass` — Ctrl+C exits the `while True` loop
  quietly (no stack trace), falling through to the code after the `with
  Live(...)` block.

```python
    console.print("\n[bold]Session ended.[/bold]")
    if transcript_lines:
        console.print("\n[bold]Full transcript:[/bold]")
        console.print(" ".join(transcript_lines))
```
After the `Live` region closes (so this prints normally below it), it
announces the session ended and — if anything was captured — prints the
full transcript as one joined string, same idea as `app.py`'s final
summary.

```python
if __name__ == "__main__":
    main()
```
Same direct-execution guard as `app.py`.

---

## `dental_ai/__init__.py`

```python
"""Voice-first dental charting CLI."""
```
The only line in the file. Its presence turns the `dental_ai/` folder
into an importable Python package (so `from dental_ai.audio import ...`
works); the docstring is the package-level description shown by tools
like `help(dental_ai)`.

---

## `dental_ai/audio.py`

```python
import tempfile
import wave
from pathlib import Path
from typing import Optional
```
- `tempfile` — generates a temp file path for the recording.
- `wave` — the standard-library module for reading/writing `.wav` files
  (used here instead of `scipy`, which `app.py` uses for the same job).
- `Path` — used as the return type and for handling the output file path
  in an OS-independent way.
- `Optional` — type hint meaning "this argument can be `None`".

```python
class MicrophoneRecorder:
    """Record short mono WAV chunks using sounddevice."""

    def __init__(self, sample_rate: int = 16_000, channels: int = 1):
        self.sample_rate = sample_rate
        self.channels = channels
```
A small class wrapping recording settings so callers don't have to pass
`sample_rate`/`channels` into every call. Defaults match Whisper's
expected 16kHz mono input.

```python
    def record_chunk(self, seconds: int = 6, output_path: Optional[Path] = None) -> Path:
        try:
            import sounddevice as sd
        except ImportError as exc:
            raise RuntimeError("Install sounddevice and numpy to record from a microphone.") from exc
```
Starts the method by importing `sounddevice` *inside the function* (a
deliberate choice, not an accident): it means the rest of the package
can be imported even on a machine without `sounddevice`/`numpy`
installed (or without audio hardware) — the `ImportError` only happens,
and gets turned into a clearer `RuntimeError`, at the moment someone
actually tries to record.

```python
        output = output_path or Path(tempfile.mkstemp(suffix=".wav")[1])
```
If the caller didn't supply a specific path, create one:
`tempfile.mkstemp(suffix=".wav")` returns a `(file_descriptor, path)`
tuple; `[1]` takes just the path string, and `Path(...)` wraps it.

```python
        frames = sd.rec(
            int(seconds * self.sample_rate),
            samplerate=self.sample_rate,
            channels=self.channels,
            dtype="int16",
        )
        sd.wait()
```
Same recording call as `app.py`'s `record_chunk`: total sample count is
`seconds * sample_rate`, mono, 16-bit PCM. `sd.wait()` blocks until the
recording is done.

```python
        with wave.open(str(output), "wb") as wav_file:
            wav_file.setnchannels(self.channels)
            wav_file.setsampwidth(2)
            wav_file.setframerate(self.sample_rate)
            wav_file.writeframes(frames.tobytes())
        return output
```
Manually writes the `.wav` header and data using the standard library
`wave` module (instead of `scipy.io.wavfile.write`, which does the same
thing in one call): open the file for binary writing, declare the number
of channels, set the sample width to `2` bytes (16 bits — matches
`dtype="int16"` above), set the frame rate, then write the raw audio
bytes (`frames.tobytes()` converts the NumPy array into a flat byte
string). Returns the `Path` so the caller knows where the file landed.

---

## `dental_ai/models.py`

```python
from dataclasses import asdict, dataclass
from typing import Optional
```
`dataclass` auto-generates `__init__`, `__repr__`, and `__eq__` for a
class from its type-annotated fields. `asdict` converts a dataclass
instance into a plain `dict` (used for JSON-serializing it later).
`Optional` marks fields that can be `None`.

```python
@dataclass
class Finding:
    tooth_number: str
    surface: str
    finding_type: str
    value: Optional[str] = None
    unit: Optional[str] = None
    notes: Optional[str] = None
    needs_review: bool = False
    status: str = "active"
```
Represents one entry in a dental chart:
- `tooth_number`, `surface`, `finding_type` — required (no default):
  e.g. tooth `"14"`, surface `"distal"`, finding `"pocket depth"`.
- `value`/`unit` — optional measurement, e.g. `"5"` / `"mm"`.
- `notes` — free-text, e.g. explaining what a correction replaced.
- `needs_review` — flags a finding the AI parser wasn't confident about,
  so a human should double check it before it's charted.
- `status` — one of `"active"`, `"corrected"`, or `"deleted"`; this is
  how the not-yet-wired-up correction/edit flow marks a finding as
  superseded without physically removing it from the list (so there's
  still a record of what changed).

```python
    def as_dict(self) -> dict:
        return asdict(self)
```
Thin wrapper around the `asdict()` import — turns this `Finding` into a
plain dictionary so it can be dropped into `json.dumps(...)` when sending
findings to the Groq LLM as context, or serializing a whole chart.

```python
    @property
    def display_value(self) -> str:
        if self.value and self.unit:
            return f"{self.value} {self.unit}"
        return self.value or "-"
```
A computed, read-only attribute (`finding.display_value`, no
parentheses) for showing a finding in a table or report: combines value
and unit ("5 mm") when both exist, falls back to just the value if
there's no unit, or a dash `"-"` if there's no value at all.

---

## `dental_ai/services.py`

```python
import json
import os
import re
import smtplib
from email.mime.text import MIMEText
from typing import Iterable, Optional

from .models import Finding
```
- `json` — encodes findings as JSON for the LLM prompt and decodes the
  LLM's JSON response.
- `os` — reads `GROQ_API_KEY` and the `SMTP_*` environment variables.
- `re` — regular expressions used by `DemoAI` to parse plain sentences
  and by `has_correction` to spot correction phrases.
- `smtplib`, `MIMEText` — standard-library email sending over SMTP.
- `Iterable`, `Optional` — type hints.
- `from .models import Finding` — the relative import pulls in the
  `Finding` dataclass from the sibling `models.py` file in the same
  package.

```python
CORRECTION_PHRASES = ("actually", "make that", "scratch that", "correction")
```
A tuple of phrases that signal the dentist is correcting something they
just said, rather than stating a brand-new finding.

```python
class DentalAI:
    """Groq-backed transcription, charting, and patient-report generation."""

    def __init__(self, api_key: Optional[str] = None):
        key = api_key or os.getenv("GROQ_API_KEY")
        if not key:
            raise RuntimeError("GROQ_API_KEY is required for live mode.")
        from groq import Groq

        self.client = Groq(api_key=key)
```
The "real" AI backend, used by `main.py`. Accepts an explicit
`api_key` (useful for tests) or falls back to the `GROQ_API_KEY`
environment variable. Raises `RuntimeError` immediately if neither is
present — this is the exception `main.py` catches to print a friendly
error instead of a stack trace. `groq` is imported inside `__init__`
(not at the top of the file) for the same reason `sounddevice` is
imported inside `record_chunk` in `audio.py`: it lets the module be
imported without the dependency installed, only failing when the class
is actually constructed.

```python
    def transcribe(self, audio_path: str) -> str:
        with open(audio_path, "rb") as audio_file:
            result = self.client.audio.transcriptions.create(
                file=audio_file,
                model="whisper-large-v3-turbo",
            )
        return result.text
```
Opens the given `.wav` file in binary mode and sends it to Groq's
Whisper endpoint, same model `app.py` uses. This is the method `main.py`
calls once per recorded chunk.

```python
    def parse_findings(self, transcript: str, recent: Iterable[Finding] = ()) -> list[Finding]:
        context = json.dumps([finding.as_dict() for finding in recent])
        prompt = f"""Convert the dentist transcript into a JSON array of findings.
Schema: tooth_number, surface, finding_type, value, unit, notes, needs_review.
Use strings for tooth_number, value, and unit. needs_review must be boolean.
If this is a correction, update the matching recent finding rather than adding a duplicate.
Recent findings: {context}
Transcript: {transcript}"""
        response = self.client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            temperature=0,
            response_format={"type": "json_object"},
            messages=[
                {"role": "system", "content": "You are a dental charting assistant. Return {\"findings\": [...]} only."},
                {"role": "user", "content": prompt},
            ],
        )
        payload = json.loads(response.choices[0].message.content)
        return [Finding(**item) for item in payload.get("findings", [])]
```
**Not called by either `app.py` or `main.py` yet** — this is the next
building block: turning a raw transcript into structured `Finding`
objects.
- `context` serializes the last few active findings (passed in by the
  caller as `recent`) so the model can tell "make that 4 millimeters"
  refers to an existing finding instead of inventing a new one.
- The prompt spells out the exact JSON schema expected and includes both
  the recent-findings context and the new transcript.
- `temperature=0` asks for the most deterministic/consistent output
  possible (less creative variation between runs).
- `response_format={"type": "json_object"}` is a Groq/OpenAI-style
  feature that constrains the model to return valid JSON instead of
  freeform text.
- `response.choices[0].message.content` is the model's raw JSON string
  reply; `json.loads(...)` parses it into a Python dict.
- `payload.get("findings", [])` reads the `"findings"` key (defaulting to
  an empty list if missing), and each item dict is unpacked with `**item`
  into a `Finding(...)` — this only works if the model's JSON keys
  exactly match `Finding`'s field names.

```python
    def generate_report(self, findings: Iterable[Finding]) -> str:
        payload = json.dumps([finding.as_dict() for finding in findings])
        response = self.client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            temperature=0.2,
            messages=[
                {"role": "system", "content": "Write a warm, plain-language dental visit summary. Do not diagnose or invent treatment."},
                {"role": "user", "content": f"Approved chart findings: {payload}"},
            ],
        )
        return response.choices[0].message.content.strip()
```
Also not called yet. Would take the dentist-approved findings, serialize
them to JSON, and ask the LLM to turn clinical shorthand ("pocket depth
5mm") into a plain-language summary a patient could read — with an
explicit system instruction not to diagnose conditions or invent
treatment that wasn't actually charted. `temperature=0.2` allows slightly
more natural phrasing than the fully deterministic `parse_findings` call,
while still staying close to the source facts.

```python
class DemoAI:
    """Deterministic local adapter for rehearsals and tests without API credentials."""

    def transcribe(self, audio_path: str) -> str:
        raise RuntimeError("Demo mode uses scripted transcript chunks; no audio file is needed.")
```
A stand-in for `DentalAI` that needs no API key and no network — useful
for testing or demoing the rest of the pipeline. `transcribe` is
deliberately unimplemented here because demo mode is meant to skip
real audio entirely and feed in pre-written transcript strings instead
(calling this method by mistake fails loudly rather than silently
returning nonsense).

```python
    def parse_findings(self, transcript: str, recent: Iterable[Finding] = ()) -> list[Finding]:
        tooth_match = re.search(r"tooth\s+(\d+)", transcript, re.IGNORECASE)
        if not tooth_match:
            return []
        tooth = tooth_match.group(1)
```
A regex-based (no API call) stand-in for the LLM parser: looks for the
word "tooth" followed by digits, case-insensitively. If there's no tooth
number mentioned at all, there's nothing to chart, so it returns an empty
list immediately.

```python
        surface_match = re.search(r"(mesial|distal|occlusal|buccal|lingual|facial)", transcript, re.IGNORECASE)
        surface = surface_match.group(1).lower() if surface_match else "unspecified"
```
Looks for any of the standard dental surface names; if found, uses it
(lowercased for consistency); otherwise defaults to `"unspecified"`.

```python
        pocket_match = re.search(r"pocket(?: depth)?\s+(\d+)\s*(mm)?", transcript, re.IGNORECASE)
        if pocket_match:
            finding_type, value, unit = "pocket depth", pocket_match.group(1), "mm"
        elif "wear" in transcript.lower():
            finding_type, value, unit = "tooth wear", "noted", None
        elif "caries" in transcript.lower() or "cavity" in transcript.lower():
            finding_type, value, unit = "caries", "present", None
        else:
            finding_type, value, unit = "clinical finding", transcript.strip(), None
```
A simple decision tree classifying the transcript into one of four
finding types by keyword matching, in priority order: an explicit pocket
depth measurement first, then tooth wear, then caries/cavity, and
finally a generic catch-all that just stores the raw transcript text as
the "value" so nothing is silently dropped.

```python
        needs_review = bool(re.search(r"unclear|unsure|check", transcript, re.IGNORECASE))
        candidate = Finding(tooth, surface, finding_type, value, unit, needs_review=needs_review)
```
Flags the finding for human review if the dentist's own words suggest
uncertainty ("check this", "unclear", etc.), then builds the `Finding`
object from everything extracted so far.

```python
        if has_correction(transcript):
            for old in reversed(list(recent)):
                if old.tooth_number == tooth and old.status == "active":
                    old.status = "corrected"
                    candidate.notes = f"Correction to {old.finding_type} {old.display_value}"
                    break
        return [candidate]
```
If the transcript contains a correction phrase (see `has_correction`
below), search backwards through the recently-passed-in findings
(`reversed(...)` checks the most recent ones first) for one on the same
tooth that's still `"active"`. If found, mark that old one as
`"corrected"` (not deleted — it stays in the list for history) and note
on the new candidate what it replaced. `break` stops after the first
match so only one prior finding gets superseded. Either way, the new
`candidate` is returned as a one-item list.

```python
    def generate_report(self, findings: Iterable[Finding]) -> str:
        active = [finding for finding in findings if finding.status == "active"]
        if not active:
            return "No clinical findings were recorded during this visit."
        lines = ["Dental Visit Summary", "", "Your dentist recorded the following findings:"]
        lines.extend(
            f"- Tooth {finding.tooth_number}, {finding.surface}: {finding.finding_type} ({finding.display_value})."
            for finding in active
        )
        lines.extend(["", "Please contact your dental office with any questions about your care."])
        return "\n".join(lines)
```
A template-based (no API call) stand-in for `DentalAI.generate_report`.
Filters out anything not `"active"` (so corrected/deleted findings never
reach the patient), bails out early with a plain message if there's
nothing left, otherwise builds a fixed-format report line by line — a
title, an intro sentence, one bullet per finding (using the
`display_value` property from `models.py`), and a closing line — then
joins it all with newlines into one string.

```python
def has_correction(transcript: str) -> bool:
    lowered = transcript.lower()
    return any(phrase in lowered for phrase in CORRECTION_PHRASES)
```
A module-level helper (not tied to either AI class) used by both
`DemoAI.parse_findings` above and by callers that want to detect
corrections before deciding how to prompt the real LLM. Lowercases the
transcript once, then checks if any of `CORRECTION_PHRASES` appears
anywhere in it.

```python
def send_email(report: str, recipient: str, subject: str = "Your Dental Visit Summary") -> None:
    host = os.getenv("SMTP_HOST", "smtp.gmail.com")
    port = int(os.getenv("SMTP_PORT", "465"))
    username = os.getenv("SMTP_USERNAME")
    password = os.getenv("SMTP_PASSWORD")
    if not username or not password:
        raise RuntimeError("SMTP_USERNAME and SMTP_PASSWORD are required to send email.")
```
Also not wired up to either entry point yet. Reads SMTP connection
details from the environment, defaulting to Gmail's host/port (465 is
Gmail's SSL port) if not overridden. Fails fast with a clear error if
credentials are missing, rather than letting `smtplib` raise a more
cryptic authentication error later.

```python
    message = MIMEText(report)
    message["Subject"] = subject
    message["From"] = username
    message["To"] = recipient
    with smtplib.SMTP_SSL(host, port) as server:
        server.login(username, password)
        server.send_message(message)
```
Builds a plain-text email (`MIMEText` — no HTML) with the report as its
body, sets the standard `Subject`/`From`/`To` headers, opens an
SSL-encrypted connection to the SMTP server, logs in, and sends it. The
`with` block ensures the connection is closed automatically afterward,
even if sending fails partway through.

---

## Config files

### `requirements.txt`
Pinned minimum versions for every third-party import used across the
project: `groq` (API client), `rich` (terminal UI, used by `main.py`),
`sounddevice`/`numpy` (mic capture), `scipy` (`.wav` writing in `app.py`
specifically), and `python-dotenv` (`.env` loading in both entry
points).

### `.env.example`
A template showing every environment variable the project can use —
`GROQ_API_KEY` (required by both entry points) plus `SMTP_HOST`,
`SMTP_PORT`, `SMTP_USERNAME`, `SMTP_PASSWORD`, and `PATIENT_EMAIL` (only
needed once `send_email` in `services.py` gets wired up to an entry
point). Copy it to `.env` and fill in real values — `.env` itself is
git-ignored so secrets never get committed.

### `.gitignore`
Keeps machine- and secret-specific files out of version control:
compiled Python bytecode (`__pycache__/`, `*.py[cod]`), virtual
environments (`.venv/`, `venv/`), the real `.env` file, recorded `*.wav`
chunks, and `pytest`'s cache directory.

### `.gitattributes`
One rule (`* text=auto`) that tells Git to normalize line endings
automatically for text files, so the same file doesn't show as
all-changed just because it was edited on Windows vs. macOS/Linux.
=======
# dentai
>>>>>>> 94c555bc501390cbff6559f36e542a9e4cfad75a
>>>>>>> e335c86cdd3a4200428b71d90a20daa575a39b9d

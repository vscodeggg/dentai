"""
Voice-to-transcript CLI tool.

Records audio from the microphone in rolling chunks and transcribes each
chunk live using Groq's Whisper API. This is the first building block of
the dental AI assistant, get this working and reliable before building
anything on top of it.

Setup:
    pip install groq sounddevice numpy scipy --break-system-packages

    export GROQ_API_KEY="your-key-here"

Run:
    python voice_to_transcript.py

    Speak into your mic. Each chunk gets transcribed and printed as it
    comes in. Press Ctrl+C to stop.
"""

import os
import sys
import tempfile
import time

import numpy as np
import sounddevice as sd
from dotenv import load_dotenv
from scipy.io.wavfile import write as write_wav
from groq import Groq

load_dotenv()

# ---- Config ----
SAMPLE_RATE = 16000        # Whisper models expect 16kHz mono
CHUNK_SECONDS = 5          # how long each recording chunk is
MODEL = "whisper-large-v3-turbo"   # fast + accurate; use "whisper-large-v3" for max accuracy

def get_client():
    api_key = os.environ.get("GROQ_API_KEY")
    if not api_key:
        print("Error: set GROQ_API_KEY as an environment variable first.")
        print('  export GROQ_API_KEY="your-key-here"')
        sys.exit(1)
    return Groq(api_key=api_key)


def record_chunk(duration=CHUNK_SECONDS, sample_rate=SAMPLE_RATE):
    """Records duration seconds of audio from the default mic and
    returns it as a numpy array."""
    audio = sd.rec(
        int(duration * sample_rate),
        samplerate=sample_rate,
        channels=1,
        dtype="int16",
    )
    sd.wait()  # block until recording finishes
    return audio


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


def is_silent(audio, threshold=200):
    """Rough silence check so we don't waste API calls transcribing dead air.
    Threshold is on a 16-bit int scale (0-32767); tune if it's too
    sensitive or not sensitive enough for your mic."""
    return np.abs(audio).mean() < threshold


def main():
    if "--web" in sys.argv or "--interface" in sys.argv:
        from server import run_server
        run_server(port=3000, open_browser=True)
        return

    client = get_client()
    print("Voice-to-transcript running. Speak naturally. Press Ctrl+C to stop.")
    print("Tip: Run 'python server.py' or 'python app.py --web' to run with the interactive 32-tooth web interface.\n")

    full_transcript = []

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

    except KeyboardInterrupt:
        print("\n\nStopped.\n")
        print("Full transcript:")
        print(" ".join(full_transcript))


if __name__ == "__main__":
    main()
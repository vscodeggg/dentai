import tempfile
import wave
from pathlib import Path
from typing import Optional


class MicrophoneRecorder:
    """Record short mono WAV chunks using sounddevice."""

    def __init__(self, sample_rate: int = 16_000, channels: int = 1):
        self.sample_rate = sample_rate
        self.channels = channels

    def record_chunk(self, seconds: int = 6, output_path: Optional[Path] = None) -> Path:
        try:
            import sounddevice as sd
        except ImportError as exc:
            raise RuntimeError("Install sounddevice and numpy to record from a microphone.") from exc

        output = output_path or Path(tempfile.mkstemp(suffix=".wav")[1])
        frames = sd.rec(
            int(seconds * self.sample_rate),
            samplerate=self.sample_rate,
            channels=self.channels,
            dtype="int16",
        )
        sd.wait()

        with wave.open(str(output), "wb") as wav_file:
            wav_file.setnchannels(self.channels)
            wav_file.setsampwidth(2)
            wav_file.setframerate(self.sample_rate)
            wav_file.writeframes(frames.tobytes())
        return output

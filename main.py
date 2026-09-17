"""Live microphone-to-text loop: speak, watch the transcript build in the terminal."""

import sys

from dotenv import load_dotenv
from rich.console import Console
from rich.live import Live
from rich.panel import Panel
from rich.text import Text

from dental_ai.audio import MicrophoneRecorder
from dental_ai.services import DentalAI

CHUNK_SECONDS = 6


def render(lines: list[str]) -> Panel:
    body = Text("\n".join(f"- {line}" for line in lines) if lines else "Listening...")
    return Panel(body, title="Live Transcript", border_style="cyan")


def main() -> None:
    load_dotenv()
    console = Console()

    try:
        ai = DentalAI()
    except RuntimeError as exc:
        console.print(f"[red]{exc}[/red]")
        sys.exit(1)

    recorder = MicrophoneRecorder()
    transcript_lines: list[str] = []

    console.print("[bold green]Voice-to-text is live.[/bold green] Speak naturally. Press Ctrl+C to stop.\n")

    with Live(render(transcript_lines), console=console, refresh_per_second=4) as live:
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

    console.print("\n[bold]Session ended.[/bold]")
    if transcript_lines:
        console.print("\n[bold]Full transcript:[/bold]")
        console.print(" ".join(transcript_lines))


if __name__ == "__main__":
    main()
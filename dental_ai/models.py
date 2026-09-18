from dataclasses import asdict, dataclass
from typing import Optional


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

    def as_dict(self) -> dict:
        return asdict(self)

    @property
    def display_value(self) -> str:
        if self.value and self.unit:
            return f"{self.value} {self.unit}"
        return self.value or "-"

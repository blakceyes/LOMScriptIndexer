from __future__ import annotations

ROUNDS_PER_MONTH = 3
ROUNDS_PER_YEAR = 36


def rounds_of(year: int, month: int, stage: int) -> int | None:
    if not (1 <= year <= 9 and 1 <= month <= 12 and 1 <= stage <= ROUNDS_PER_MONTH):
        return None
    return (year - 1) * ROUNDS_PER_YEAR + (month - 1) * ROUNDS_PER_MONTH + stage


def date_of(rounds: float) -> tuple[int, int, int]:
    index = max(0, int(round(rounds)) - 1)
    year = index // ROUNDS_PER_YEAR + 1
    rest = index % ROUNDS_PER_YEAR
    return year, rest // ROUNDS_PER_MONTH + 1, rest % ROUNDS_PER_MONTH + 1

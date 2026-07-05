"""
helpers.py — Common utility functions

Shared helper functions used across multiple modules.
"""

import re


def extract_day_from_timestamp(timestamp: str, fallback: int = 1) -> int:
    """Extract the day number from a timestamp string like 'Day 3'."""
    match = re.search(r"Day\s*(\d+)", timestamp, re.IGNORECASE)
    return int(match.group(1)) if match else fallback


def clamp(value: int, min_val: int = -100, max_val: int = 100) -> int:
    """Clamp an integer value between min_val and max_val."""
    return max(min_val, min(max_val, value))


def clean_memory_text(raw_text: str) -> str:
    """Strip metadata prefixes from a raw memory string, returning only the
    human-readable content after [Memory]."""
    match = re.search(r"\[Memory\]\s*(.*)$", raw_text)
    if match:
        clean = match.group(1).strip()
        clean = re.sub(r"^(Rumor:|Gossip:|Memory:)\s*", "", clean, flags=re.IGNORECASE)
        return clean
    return raw_text.strip()

"""
Sliding window limit for failed sign-ins.

Kept in memory, which is correct for the single process deployment. Running
several workers or instances needs a shared store instead.
"""
from __future__ import annotations

import time
from collections import deque

MAX_TRACKED_KEYS = 10_000


class SlidingWindowLimiter:
    def __init__(self, limit: int, window_seconds: int, clock=time.monotonic) -> None:
        self.limit = limit
        self.window = window_seconds
        self._clock = clock
        self._events: dict[str, deque[float]] = {}

    def _recent(self, key: str) -> deque[float] | None:
        events = self._events.get(key)
        if events is None:
            return None
        cutoff = self._clock() - self.window
        while events and events[0] <= cutoff:
            events.popleft()
        if not events:
            del self._events[key]
            return None
        return events

    def retry_after(self, key: str) -> int:
        """Seconds to wait, or 0 if the key is allowed to try."""
        events = self._recent(key)
        if events is None or len(events) < self.limit:
            return 0
        return max(1, int(events[0] + self.window - self._clock()) + 1)

    def record(self, key: str) -> None:
        if key not in self._events and len(self._events) >= MAX_TRACKED_KEYS:
            for stale in list(self._events):
                self._recent(stale)
            if len(self._events) >= MAX_TRACKED_KEYS:
                del self._events[next(iter(self._events))]
        self._events.setdefault(key, deque(maxlen=self.limit)).append(self._clock())

    def reset(self, key: str) -> None:
        self._events.pop(key, None)

    def clear(self) -> None:
        self._events.clear()

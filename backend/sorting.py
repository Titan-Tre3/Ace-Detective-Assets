from __future__ import annotations

from dataclasses import dataclass, field
from time import perf_counter
from typing import Callable, Dict, List, Optional


@dataclass
class TraceStep:
    array: List[int]
    highlights: Dict[str, List[int]] = field(default_factory=dict)


@dataclass
class Metrics:
    comparisons: int = 0
    swaps: int = 0
    time_ms: float = 0.0


@dataclass
class RunResult:
    trace: List[TraceStep]
    metrics: Metrics
    sorted_array: List[int]


class Instrumentor:
    def __init__(self, arr: List[int], capture_trace: bool = False, steps_limit: int = 4000):
        self.arr = arr
        self.metrics = Metrics()
        self.capture_trace = capture_trace
        self.steps_limit = steps_limit
        self.trace: List[TraceStep] = []
        self._add_step({})

    def _add_step(self, highlights: Dict[str, List[int]]) -> None:
        if self.capture_trace and len(self.trace) < self.steps_limit:
            self.trace.append(TraceStep(array=self.arr.copy(), highlights=highlights))

    def compare(self, i: int, j: int) -> int:
        self.metrics.comparisons += 1
        self._add_step({"compare": [i, j]})
        return (self.arr[i] > self.arr[j]) - (self.arr[i] < self.arr[j])

    def compare_values(self, a: int, b: int, idxs: Optional[List[int]] = None) -> int:
        self.metrics.comparisons += 1
        self._add_step({"compare": idxs or []})
        return (a > b) - (a < b)

    def swap(self, i: int, j: int) -> None:
        if i == j:
            return
        self.arr[i], self.arr[j] = self.arr[j], self.arr[i]
        self.metrics.swaps += 1
        self._add_step({"swap": [i, j]})

    def write(self, i: int, value: int, source: Optional[int] = None) -> None:
        if self.arr[i] != value:
            self.arr[i] = value
            self.metrics.swaps += 1
            payload = [i] if source is None else [source, i]
            self._add_step({"write": payload})


SortFn = Callable[[Instrumentor], None]


def selection_sort(ins: Instrumentor) -> None:
    n = len(ins.arr)
    for i in range(n):
        min_idx = i
        for j in range(i + 1, n):
            if ins.compare(j, min_idx) < 0:
                min_idx = j
        ins.swap(i, min_idx)


def bubble_sort(ins: Instrumentor) -> None:
    n = len(ins.arr)
    for i in range(n):
        swapped = False
        for j in range(0, n - i - 1):
            if ins.compare(j, j + 1) > 0:
                ins.swap(j, j + 1)
                swapped = True
        if not swapped:
            break


def insertion_sort(ins: Instrumentor) -> None:
    arr = ins.arr
    for i in range(1, len(arr)):
        key = arr[i]
        j = i - 1
        while j >= 0 and ins.compare_values(arr[j], key, [j, i]) > 0:
            ins.write(j + 1, arr[j], j)
            j -= 1
        ins.write(j + 1, key, i)


def merge_sort(ins: Instrumentor) -> None:
    arr = ins.arr

    def merge(left: int, mid: int, right: int) -> None:
        left_part = arr[left : mid + 1]
        right_part = arr[mid + 1 : right + 1]
        i = j = 0
        k = left
        while i < len(left_part) and j < len(right_part):
            if ins.compare_values(left_part[i], right_part[j], [left + i, mid + 1 + j]) <= 0:
                ins.write(k, left_part[i], left + i)
                i += 1
            else:
                ins.write(k, right_part[j], mid + 1 + j)
                j += 1
            k += 1
        while i < len(left_part):
            ins.write(k, left_part[i], left + i)
            i += 1
            k += 1
        while j < len(right_part):
            ins.write(k, right_part[j], mid + 1 + j)
            j += 1
            k += 1

    def sort(left: int, right: int) -> None:
        if left >= right:
            return
        mid = (left + right) // 2
        sort(left, mid)
        sort(mid + 1, right)
        merge(left, mid, right)

    sort(0, len(arr) - 1)


def quick_sort(ins: Instrumentor) -> None:
    arr = ins.arr

    def partition(low: int, high: int) -> int:
        pivot = arr[high]
        i = low - 1
        for j in range(low, high):
            if ins.compare_values(arr[j], pivot, [j, high]) <= 0:
                i += 1
                ins.swap(i, j)
        ins.swap(i + 1, high)
        return i + 1

    def qsort(low: int, high: int) -> None:
        if low < high:
            pi = partition(low, high)
            qsort(low, pi - 1)
            qsort(pi + 1, high)

    qsort(0, len(arr) - 1)


def heap_sort(ins: Instrumentor) -> None:
    n = len(ins.arr)

    def heapify(size: int, root: int) -> None:
        largest = root
        left = 2 * root + 1
        right = 2 * root + 2

        if left < size and ins.compare(left, largest) > 0:
            largest = left
        if right < size and ins.compare(right, largest) > 0:
            largest = right
        if largest != root:
            ins.swap(root, largest)
            heapify(size, largest)

    for i in range(n // 2 - 1, -1, -1):
        heapify(n, i)

    for i in range(n - 1, 0, -1):
        ins.swap(0, i)
        heapify(i, 0)


def cycle_sort(ins: Instrumentor) -> None:
    arr = ins.arr
    n = len(arr)
    for cycle_start in range(0, n - 1):
        item = arr[cycle_start]
        pos = cycle_start
        for i in range(cycle_start + 1, n):
            if ins.compare_values(arr[i], item, [i, cycle_start]) < 0:
                pos += 1

        if pos == cycle_start:
            continue

        while pos < n and item == arr[pos]:
            pos += 1
            if pos >= n:
                break

        if pos < n:
            arr[pos], item = item, arr[pos]
            ins.metrics.swaps += 1
            ins._add_step({"swap": [cycle_start, pos]})

        while pos != cycle_start:
            pos = cycle_start
            for i in range(cycle_start + 1, n):
                if ins.compare_values(arr[i], item, [i, cycle_start]) < 0:
                    pos += 1
            while pos < n and item == arr[pos]:
                pos += 1
                if pos >= n:
                    break
            if pos < n:
                arr[pos], item = item, arr[pos]
                ins.metrics.swaps += 1
                ins._add_step({"swap": [cycle_start, pos]})


ALGORITHMS: Dict[str, SortFn] = {
    "selection_sort": selection_sort,
    "merge_sort": merge_sort,
    "bubble_sort": bubble_sort,
    "insertion_sort": insertion_sort,
    "quick_sort": quick_sort,
    "heap_sort": heap_sort,
    "cycle_sort": cycle_sort,
}


def run_algorithm(
    algorithm: str,
    array: List[int],
    capture_trace: bool = False,
    steps_limit: int = 4000,
) -> RunResult:
    if algorithm not in ALGORITHMS:
        raise ValueError(f"Unsupported algorithm: {algorithm}")

    working = array.copy()
    instrumentor = Instrumentor(working, capture_trace=capture_trace, steps_limit=steps_limit)
    start = perf_counter()
    ALGORITHMS[algorithm](instrumentor)
    instrumentor.metrics.time_ms = (perf_counter() - start) * 1000
    instrumentor._add_step({"done": []})

    return RunResult(
        trace=instrumentor.trace,
        metrics=instrumentor.metrics,
        sorted_array=working,
    )

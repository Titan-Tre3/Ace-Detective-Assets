import random

from backend.sorting import ALGORITHMS, run_algorithm


def test_all_algorithms_sort_correctly():
    sample = [9, 1, 4, 7, 2, 2, 8]
    for algorithm in ALGORITHMS:
        result = run_algorithm(algorithm, sample, capture_trace=True)
        assert result.sorted_array == sorted(sample)
        assert result.metrics.comparisons >= 0
        assert result.metrics.swaps >= 0
        assert result.metrics.time_ms >= 0
        assert len(result.trace) >= 1


def test_randomized_consistency():
    for _ in range(5):
        arr = [random.randint(1, 200) for _ in range(20)]
        for algorithm in ALGORITHMS:
            result = run_algorithm(algorithm, arr)
            assert result.sorted_array == sorted(arr)

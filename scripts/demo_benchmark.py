"""Run automated benchmark sweeps and print a compact table."""

from backend.sorting import ALGORITHMS, run_algorithm


def main() -> None:
    sizes = [10, 20, 40, 80]
    trials = 3
    print("algorithm,size,avg_time_ms,avg_comparisons,avg_swaps")
    for algorithm in ALGORITHMS:
        for size in sizes:
            times = []
            comparisons = []
            swaps = []
            for t in range(trials):
                arr = [((t + 5) * (i * 31 + 7)) % 300 + 1 for i in range(size)]
                result = run_algorithm(algorithm, arr)
                times.append(result.metrics.time_ms)
                comparisons.append(result.metrics.comparisons)
                swaps.append(result.metrics.swaps)
            print(
                f"{algorithm},{size},{sum(times)/trials:.4f},{sum(comparisons)//trials},{sum(swaps)//trials}"
            )


if __name__ == "__main__":
    main()

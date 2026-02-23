from __future__ import annotations

from statistics import mean
from typing import Dict, List, Literal

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, Field

from backend.sorting import ALGORITHMS, run_algorithm


class RunRequest(BaseModel):
    algorithm: str
    array: List[int] = Field(default_factory=list)
    mode: Literal["trace", "benchmark"] = "trace"
    steps_limit: int = Field(default=4000, ge=10, le=20000)


class BenchmarkRequest(BaseModel):
    algorithm: str
    sizes: List[int] = Field(default_factory=list)
    trials: int = Field(default=3, ge=1, le=20)
    value_range: int = Field(default=200, ge=2, le=10000)


app = FastAPI(title="Sorting Visualizer API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
def health() -> Dict[str, str]:
    return {"status": "ok"}


@app.get("/algorithms")
def list_algorithms() -> Dict[str, List[str]]:
    return {"algorithms": list(ALGORITHMS.keys())}


@app.post("/run")
def run(payload: RunRequest) -> Dict[str, object]:
    if payload.algorithm not in ALGORITHMS:
        raise HTTPException(status_code=400, detail="Unsupported algorithm")

    result = run_algorithm(
        payload.algorithm,
        payload.array,
        capture_trace=payload.mode == "trace",
        steps_limit=payload.steps_limit,
    )

    return {
        "trace": [
            {"array": step.array, "highlights": step.highlights} for step in result.trace
        ],
        "metrics": {
            "time_ms": round(result.metrics.time_ms, 4),
            "comparisons": result.metrics.comparisons,
            "swaps": result.metrics.swaps,
        },
        "sorted_array": result.sorted_array,
    }


@app.post("/benchmark")
def benchmark(payload: BenchmarkRequest) -> Dict[str, object]:
    if payload.algorithm not in ALGORITHMS:
        raise HTTPException(status_code=400, detail="Unsupported algorithm")

    if not payload.sizes:
        raise HTTPException(status_code=400, detail="sizes cannot be empty")

    summary = []
    for size in payload.sizes:
        runs = []
        for trial in range(payload.trials):
            base = [((trial + 3) * (i * 17 + 13)) % payload.value_range + 1 for i in range(size)]
            result = run_algorithm(payload.algorithm, base, capture_trace=False)
            runs.append(result.metrics)

        summary.append(
            {
                "size": size,
                "avg_time_ms": round(mean(r.time_ms for r in runs), 4),
                "avg_comparisons": int(mean(r.comparisons for r in runs)),
                "avg_swaps": int(mean(r.swaps for r in runs)),
            }
        )

    return {"algorithm": payload.algorithm, "results": summary}


app.mount("/", StaticFiles(directory="frontend", html=True), name="frontend")

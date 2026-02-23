import pytest

fastapi = pytest.importorskip("fastapi")

from fastapi.testclient import TestClient

from backend.main import app


client = TestClient(app)


def test_run_endpoint():
    response = client.post(
        "/run",
        json={
            "algorithm": "quick_sort",
            "array": [5, 2, 7, 1],
            "mode": "trace",
            "steps_limit": 100,
        },
    )
    assert response.status_code == 200
    payload = response.json()
    assert payload["sorted_array"] == [1, 2, 5, 7]
    assert "metrics" in payload
    assert isinstance(payload["trace"], list)


def test_benchmark_endpoint():
    response = client.post(
        "/benchmark", json={"algorithm": "merge_sort", "sizes": [5, 10], "trials": 2}
    )
    assert response.status_code == 200
    payload = response.json()
    assert payload["algorithm"] == "merge_sort"
    assert len(payload["results"]) == 2

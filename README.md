# Sorting Algorithms Visualizer + Benchmark Suite

A full-stack web application that animates and benchmarks seven sorting algorithms:

- Selection Sort
- Merge Sort
- Bubble Sort
- Insertion Sort
- Quick Sort
- Heap Sort
- Cycle Sort

The backend is Python/FastAPI and provides trace + benchmark APIs. The frontend is HTML/CSS/vanilla JavaScript with card-style visual panels, side-by-side compare mode, syntax-highlighted code snippets, live metrics, and a summary chart.

## Repository layout

- `backend/main.py` - FastAPI app and endpoints (`/run`, `/benchmark`, `/algorithms`, `/health`)
- `backend/sorting.py` - instrumented sorting algorithms and trace/metrics engine
- `frontend/index.html` - semantic UI structure
- `frontend/styles.css` - visual styling and responsive layout
- `frontend/app.js` - controls, animation loop, compare mode, charting, and API integration
- `tests/` - unit/API tests
- `scripts/demo_benchmark.py` - CLI benchmark sweep script

## Setup

```bash
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

## Run the app

```bash
uvicorn backend.main:app --reload --port 8000
```

Open: `http://127.0.0.1:8000`

## API

### POST `/run`
Payload:

```json
{ "algorithm": "quick_sort", "array": [5, 3, 1], "mode": "trace", "steps_limit": 4000 }
```

Returns:

```json
{
  "trace": [{ "array": [5,3,1], "highlights": {"compare": [0,1]} }],
  "metrics": { "time_ms": 0.16, "comparisons": 3, "swaps": 1 },
  "sorted_array": [1,3,5]
}
```

### POST `/benchmark`
Payload:

```json
{ "algorithm": "merge_sort", "sizes": [10, 50, 100], "trials": 3 }
```

Returns aggregated metrics per size for plotting.

## Testing

```bash
pytest -q
```

## Demo benchmark script

```bash
python scripts/demo_benchmark.py
```

This prints CSV-like output suitable for piping into a file.

## Demo GIF / reproduction

To reproduce a demo run (compare mode with at least 3 algorithms):

1. Start backend (`uvicorn backend.main:app --reload`).
2. In the UI, multi-select `Quick Sort`, `Merge Sort`, and `Heap Sort` in **Compare Mode Algorithms**.
3. Click **Randomize**, then **Run**.
4. Observe synchronized panels, live metrics, summary table, and chart.
5. Capture as GIF via your OS recorder (e.g., Peek/LICEcap) targeting the panel area.

## Developer guide (theme/layout customization)

Edit `frontend/styles.css`:

- **Colors**: `:root` variables (`--bg`, `--card-bg`, `--accent`, `--compare`, etc.)
- **Typography**: update `font-family`, heading sizes (`h1`, `.visual-card h3`), and `pre` font settings
- **Card geometry**: adjust `.card` border-radius, padding, and shadow
- **Chart look**: change `.chart` height/border and `.bar` colors/radius
- **Spacing**: tune `.layout`, `.control-grid`, `.panel-grid`, `.metrics`

Edit `frontend/index.html` for structural layout changes (moving code block to right column, adding sections).

Edit `frontend/app.js`:

- `ALGO_INFO` for algorithm descriptions and complexity badge text
- animation behavior (`animate`, `stepFrame`, `drawBars`)
- benchmark sizes (`runBenchmarksForChart`)

## Third-party libraries

- [FastAPI](https://fastapi.tiangolo.com/) for backend API
- [Uvicorn](https://www.uvicorn.org/) ASGI server
- [highlight.js](https://highlightjs.org/) for code syntax highlighting
- [pytest](https://docs.pytest.org/) for tests

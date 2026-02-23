const ALGO_INFO = {
  selection_sort: {
    label: 'Selection Sort',
    desc: 'Finds the minimum element in each pass and places it in sorted position.',
    complexity: { time: 'O(n²)', space: 'O(1)' },
    code: `def selection_sort(arr):\n    n = len(arr)\n    for i in range(n):\n        min_idx = i\n        for j in range(i + 1, n):\n            if arr[j] < arr[min_idx]:\n                min_idx = j\n        arr[i], arr[min_idx] = arr[min_idx], arr[i]`
  },
  merge_sort: {
    label: 'Merge Sort', desc: 'Divide and conquer sort that merges sorted sub-arrays.',
    complexity: { time: 'O(n log n)', space: 'O(n)' },
    code: `def merge_sort(arr):\n    if len(arr) <= 1: return arr\n    mid = len(arr)//2\n    left = merge_sort(arr[:mid])\n    right = merge_sort(arr[mid:])\n    return merge(left, right)`
  },
  bubble_sort: {
    label: 'Bubble Sort', desc: 'Repeatedly swaps adjacent out-of-order elements.',
    complexity: { time: 'O(n²)', space: 'O(1)' },
    code: `def bubble_sort(arr):\n    n = len(arr)\n    for i in range(n):\n        for j in range(0, n-i-1):\n            if arr[j] > arr[j+1]:\n                arr[j], arr[j+1] = arr[j+1], arr[j]`
  },
  insertion_sort: {
    label: 'Insertion Sort', desc: 'Builds a sorted prefix by inserting each new value.',
    complexity: { time: 'O(n²)', space: 'O(1)' },
    code: `def insertion_sort(arr):\n    for i in range(1, len(arr)):\n        key = arr[i]\n        j = i - 1\n        while j >= 0 and arr[j] > key:\n            arr[j + 1] = arr[j]\n            j -= 1\n        arr[j + 1] = key`
  },
  quick_sort: {
    label: 'Quick Sort', desc: 'Partitions around pivots and recursively sorts partitions.',
    complexity: { time: 'O(n log n) avg', space: 'O(log n)' },
    code: `def quick_sort(arr, low, high):\n    if low < high:\n        p = partition(arr, low, high)\n        quick_sort(arr, low, p-1)\n        quick_sort(arr, p+1, high)`
  },
  heap_sort: {
    label: 'Heap Sort', desc: 'Builds a max heap and repeatedly extracts the largest element.',
    complexity: { time: 'O(n log n)', space: 'O(1)' },
    code: `def heap_sort(arr):\n    build_max_heap(arr)\n    for end in range(len(arr)-1, 0, -1):\n        arr[0], arr[end] = arr[end], arr[0]\n        heapify(arr, 0, end)`
  },
  cycle_sort: {
    label: 'Cycle Sort', desc: 'Places elements directly into their final positions minimizing writes.',
    complexity: { time: 'O(n²)', space: 'O(1)' },
    code: `def cycle_sort(arr):\n    for cycle_start in range(len(arr)-1):\n        item = arr[cycle_start]\n        pos = cycle_start\n        ... # find final position and rotate cycle`
  }
};

const state = {
  array: [],
  traces: new Map(),
  frameIndex: 0,
  playing: true,
  speedMs: 140,
  algorithms: ['selection_sort']
};

const els = {
  algorithmSelect: document.getElementById('algorithmSelect'),
  compareSelect: document.getElementById('compareSelect'),
  arraySize: document.getElementById('arraySize'),
  arraySizeLabel: document.getElementById('arraySizeLabel'),
  valueRange: document.getElementById('valueRange'),
  valueRangeLabel: document.getElementById('valueRangeLabel'),
  speedRange: document.getElementById('speedRange'),
  speedLabel: document.getElementById('speedLabel'),
  randomizeBtn: document.getElementById('randomizeBtn'),
  applyCustomBtn: document.getElementById('applyCustomBtn'),
  customArray: document.getElementById('customArray'),
  runBtn: document.getElementById('runBtn'),
  playPauseBtn: document.getElementById('playPauseBtn'),
  stepBtn: document.getElementById('stepBtn'),
  resetBtn: document.getElementById('resetBtn'),
  panels: document.getElementById('panels'),
  summaryBody: document.querySelector('#summaryTable tbody'),
  benchmarkChart: document.getElementById('benchmarkChart')
};

function initSelectors() {
  Object.entries(ALGO_INFO).forEach(([key, info]) => {
    const opt = new Option(info.label, key);
    els.algorithmSelect.add(opt);
    els.compareSelect.add(new Option(info.label, key));
  });
  els.compareSelect.options[0].selected = true;
}

function randomArray(size, max) {
  return Array.from({ length: size }, () => 1 + Math.floor(Math.random() * max));
}

function syncLabels() {
  els.arraySizeLabel.textContent = els.arraySize.value;
  els.valueRangeLabel.textContent = els.valueRange.value;
  els.speedLabel.textContent = els.speedRange.value;
}

function getSelectedAlgorithms() {
  const selected = [...els.compareSelect.selectedOptions].map(o => o.value);
  return selected.length ? selected : [els.algorithmSelect.value];
}

function renderPanels() {
  els.panels.innerHTML = '';
  state.algorithms.forEach((algo) => {
    const info = ALGO_INFO[algo];
    const panel = document.createElement('article');
    panel.className = 'card visual-card';
    panel.dataset.algorithm = algo;
    panel.innerHTML = `
      <header>
        <h3>${info.label}</h3>
        <p>${info.desc}</p>
        <div class="badges">
          <span class="badge">Time ${info.complexity.time}</span>
          <span class="badge">Space ${info.complexity.space}</span>
        </div>
      </header>
      <div class="chart" id="chart-${algo}"></div>
      <div class="metrics">
        <span class="metric-chip">Time: <strong id="time-${algo}">0</strong> ms</span>
        <span class="metric-chip">Comparisons: <strong id="comparisons-${algo}">0</strong></span>
        <span class="metric-chip">Swaps: <strong id="swaps-${algo}">0</strong></span>
      </div>
      <pre><code class="language-python">${info.code}</code></pre>
    `;
    els.panels.append(panel);
  });
  hljs.highlightAll();
}

function drawBars(algo, frame) {
  const chart = document.getElementById(`chart-${algo}`);
  if (!chart || !frame) return;
  chart.innerHTML = '';
  const max = Math.max(...frame.array, 1);
  const compareSet = new Set(frame.highlights.compare || []);
  const swapSet = new Set(frame.highlights.swap || frame.highlights.write || []);

  frame.array.forEach((value, idx) => {
    const bar = document.createElement('div');
    bar.className = 'bar';
    if (compareSet.has(idx)) bar.classList.add('compare');
    if (swapSet.has(idx)) bar.classList.add(frame.highlights.write ? 'write' : 'swap');
    bar.style.height = `${Math.max(4, (value / max) * 100)}%`;
    chart.append(bar);
  });
}

function updateMetrics(algo, metrics) {
  document.getElementById(`time-${algo}`).textContent = Number(metrics.time_ms || 0).toFixed(2);
  document.getElementById(`comparisons-${algo}`).textContent = metrics.comparisons || 0;
  document.getElementById(`swaps-${algo}`).textContent = metrics.swaps || 0;
}

async function runAlgorithms() {
  state.algorithms = getSelectedAlgorithms();
  renderPanels();
  state.frameIndex = 0;
  state.traces.clear();
  els.summaryBody.innerHTML = '';

  const requests = state.algorithms.map(async (algo) => {
    const response = await fetch('/run', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ algorithm: algo, array: state.array, mode: 'trace', steps_limit: 4000 })
    });
    const data = await response.json();
    state.traces.set(algo, data);

    const row = document.createElement('tr');
    row.innerHTML = `<td>${ALGO_INFO[algo].label}</td><td>${data.metrics.time_ms.toFixed(3)}</td><td>${data.metrics.comparisons}</td><td>${data.metrics.swaps}</td>`;
    els.summaryBody.append(row);

    updateMetrics(algo, data.metrics);
    drawBars(algo, data.trace[0] || { array: state.array, highlights: {} });
  });

  await Promise.all(requests);
  animate();
  runBenchmarksForChart();
}

function animate() {
  if (!state.playing) return;
  let hasMore = false;
  state.algorithms.forEach((algo) => {
    const payload = state.traces.get(algo);
    if (!payload) return;
    const frame = payload.trace[state.frameIndex] || payload.trace[payload.trace.length - 1];
    if (state.frameIndex < payload.trace.length - 1) hasMore = true;
    drawBars(algo, frame);
  });

  if (hasMore) {
    state.frameIndex += 1;
    setTimeout(() => requestAnimationFrame(animate), state.speedMs);
  }
}

function stepFrame() {
  state.playing = false;
  state.frameIndex += 1;
  state.algorithms.forEach((algo) => {
    const payload = state.traces.get(algo);
    if (!payload) return;
    const idx = Math.min(state.frameIndex, payload.trace.length - 1);
    drawBars(algo, payload.trace[idx]);
  });
}

function drawBenchmarkChart(resultsByAlgo) {
  const ctx = els.benchmarkChart.getContext('2d');
  if (!resultsByAlgo.length) {
    ctx.clearRect(0, 0, els.benchmarkChart.width, els.benchmarkChart.height);
    return;
  }
  const { width, height } = els.benchmarkChart;
  ctx.clearRect(0, 0, width, height);
  ctx.fillStyle = '#f8fafc';
  ctx.fillRect(0, 0, width, height);

  const colors = ['#0f766e', '#2563eb', '#f59e0b', '#8b5cf6'];
  const maxY = Math.max(...resultsByAlgo.flatMap(r => r.results.map(p => p.avg_time_ms)), 1);
  const maxX = Math.max(...resultsByAlgo[0].results.map(r => r.size), 1);

  resultsByAlgo.forEach((series, seriesIdx) => {
    ctx.strokeStyle = colors[seriesIdx % colors.length];
    ctx.lineWidth = 2;
    ctx.beginPath();
    series.results.forEach((point, idx) => {
      const x = (point.size / maxX) * (width - 60) + 30;
      const y = height - (point.avg_time_ms / maxY) * (height - 50) - 20;
      if (idx === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.stroke();
  });
}

async function runBenchmarksForChart() {
  const sizes = [10, 20, 35, 50, 70];
  const results = [];
  for (const algo of state.algorithms.slice(0, 4)) {
    const res = await fetch('/benchmark', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ algorithm: algo, sizes, trials: 3 })
    });
    results.push(await res.json());
  }
  if (results.length) drawBenchmarkChart(results);
}

function parseCustomArray() {
  return els.customArray.value
    .split(',')
    .map(v => Number(v.trim()))
    .filter(v => Number.isFinite(v));
}

function resetState() {
  state.frameIndex = 0;
  state.playing = true;
  state.traces.clear();
  state.algorithms = getSelectedAlgorithms();
  renderPanels();
  state.algorithms.forEach(a => drawBars(a, { array: state.array, highlights: {} }));
}

function attachEvents() {
  els.arraySize.addEventListener('input', () => {
    syncLabels();
    state.array = randomArray(Number(els.arraySize.value), Number(els.valueRange.value));
    resetState();
  });

  els.valueRange.addEventListener('input', () => {
    syncLabels();
    state.array = randomArray(Number(els.arraySize.value), Number(els.valueRange.value));
    resetState();
  });

  els.speedRange.addEventListener('input', () => {
    syncLabels();
    state.speedMs = Number(els.speedRange.value);
  });

  els.algorithmSelect.addEventListener('change', () => {
    els.compareSelect.value = els.algorithmSelect.value;
    state.algorithms = [els.algorithmSelect.value];
    resetState();
  });

  els.compareSelect.addEventListener('change', () => {
    state.algorithms = getSelectedAlgorithms();
    resetState();
  });

  els.randomizeBtn.addEventListener('click', () => {
    state.array = randomArray(Number(els.arraySize.value), Number(els.valueRange.value));
    resetState();
  });

  els.applyCustomBtn.addEventListener('click', () => {
    const parsed = parseCustomArray();
    if (!parsed.length) return;
    state.array = parsed;
    els.arraySize.value = Math.min(parsed.length, Number(els.arraySize.max));
    syncLabels();
    resetState();
  });

  els.runBtn.addEventListener('click', () => {
    state.playing = true;
    runAlgorithms();
  });

  els.playPauseBtn.addEventListener('click', () => {
    state.playing = !state.playing;
    els.playPauseBtn.textContent = state.playing ? 'Pause' : 'Play';
    if (state.playing) animate();
  });

  els.stepBtn.addEventListener('click', stepFrame);

  els.resetBtn.addEventListener('click', () => {
    resetState();
    drawBenchmarkChart([]);
  });
}

function init() {
  initSelectors();
  syncLabels();
  state.array = randomArray(Number(els.arraySize.value), Number(els.valueRange.value));
  resetState();
  attachEvents();
}

init();

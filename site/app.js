const statusEl = document.getElementById('model-status');
const scoreEl = document.getElementById('score');
const scoreFillEl = document.getElementById('score-fill');
const scoreLabelEl = document.getElementById('score-label');
const scoreCopyEl = document.getElementById('score-copy');
const rowCountEl = document.getElementById('row-count');
const form = document.getElementById('sleep-form');

const FEATURE_COUNT = 5;
const RIDGE_ALPHA = 6;
let browserModel = null;

function parseDurationToSeconds(value) {
  if (!value) return null;
  const parts = String(value).trim().split(':');
  if (parts.length !== 2) return null;
  const hours = Number(parts[0]);
  const minutes = Number(parts[1]);
  if (!Number.isFinite(hours) || !Number.isFinite(minutes)) return null;
  return hours * 3600 + minutes * 60;
}

function median(values) {
  const clean = values.filter(Number.isFinite).sort((a, b) => a - b);
  if (!clean.length) return 0;
  const middle = Math.floor(clean.length / 2);
  return clean.length % 2 ? clean[middle] : (clean[middle - 1] + clean[middle]) / 2;
}

function mean(values) {
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function standardDeviation(values, average) {
  const variance = values.reduce((sum, value) => sum + (value - average) ** 2, 0) / values.length;
  return Math.sqrt(variance) || 1;
}

function solveLinearSystem(matrix, vector) {
  const n = vector.length;
  const augmented = matrix.map((row, i) => [...row, vector[i]]);

  for (let col = 0; col < n; col += 1) {
    let pivot = col;
    for (let row = col + 1; row < n; row += 1) {
      if (Math.abs(augmented[row][col]) > Math.abs(augmented[pivot][col])) pivot = row;
    }

    if (Math.abs(augmented[pivot][col]) < 1e-12) throw new Error('Model matrix is singular.');
    [augmented[col], augmented[pivot]] = [augmented[pivot], augmented[col]];

    const divisor = augmented[col][col];
    for (let j = col; j <= n; j += 1) augmented[col][j] /= divisor;

    for (let row = 0; row < n; row += 1) {
      if (row === col) continue;
      const factor = augmented[row][col];
      for (let j = col; j <= n; j += 1) augmented[row][j] -= factor * augmented[col][j];
    }
  }

  return augmented.map(row => row[n]);
}

function fitRidge(features, targets) {
  const medians = Array.from({ length: FEATURE_COUNT }, (_, column) =>
    median(features.map(row => row[column]))
  );

  const imputed = features.map(row => row.map((value, column) =>
    Number.isFinite(value) ? value : medians[column]
  ));

  const means = Array.from({ length: FEATURE_COUNT }, (_, column) =>
    mean(imputed.map(row => row[column]))
  );
  const stds = Array.from({ length: FEATURE_COUNT }, (_, column) =>
    standardDeviation(imputed.map(row => row[column]), means[column])
  );

  const standardized = imputed.map(row => row.map((value, column) =>
    (value - means[column]) / stds[column]
  ));

  const design = standardized.map(row => [1, ...row]);
  const p = FEATURE_COUNT + 1;
  const xtx = Array.from({ length: p }, () => Array(p).fill(0));
  const xty = Array(p).fill(0);

  for (let i = 0; i < design.length; i += 1) {
    for (let a = 0; a < p; a += 1) {
      xty[a] += design[i][a] * targets[i];
      for (let b = 0; b < p; b += 1) xtx[a][b] += design[i][a] * design[i][b];
    }
  }

  for (let i = 1; i < p; i += 1) xtx[i][i] += RIDGE_ALPHA;
  const coefficients = solveLinearSystem(xtx, xty);

  return { coefficients, medians, means, stds, rows: targets.length };
}

function predict(model, row) {
  const clean = row.map((value, column) => Number.isFinite(value) ? value : model.medians[column]);
  const standardized = clean.map((value, column) => (value - model.means[column]) / model.stds[column]);
  let output = model.coefficients[0];
  standardized.forEach((value, index) => { output += value * model.coefficients[index + 1]; });
  return Math.max(0, Math.min(100, output));
}

function scoreNarrative(score) {
  if (score >= 90) return ['Very high', 'For these inputs, the browser model estimates sleep quality in the very high range.'];
  if (score >= 80) return ['High', 'For these inputs, the browser model estimates sleep quality in the high range.'];
  if (score >= 70) return ['Moderate to high', 'The model places these inputs in a generally positive sleep-quality range.'];
  if (score >= 60) return ['Moderate', 'The model estimates a middle-range sleep-quality score for these signals.'];
  return ['Lower', 'The model estimates a lower sleep-quality score for these signals. This is an exploratory model, not a health assessment.'];
}

async function loadAndTrain() {
  try {
    const response = await fetch('./sleepdata1.csv', { cache: 'no-store' });
    if (!response.ok) throw new Error(`Could not load dataset (${response.status}).`);
    const text = await response.text();
    const lines = text.split(/[\r\n]+/).map(line => line.trim()).filter(Boolean);
    const headers = lines[0].split(';');
    const index = Object.fromEntries(headers.map((header, i) => [header.trim(), i]));

    const X = [];
    const y = [];

    for (const line of lines.slice(1)) {
      const cells = line.split(';');
      if (cells.length < headers.length) continue;

      const target = Number(String(cells[index['Sleep quality']] || '').replace('%', '').trim());
      if (!Number.isFinite(target)) continue;

      const notes = String(cells[index['Sleep Notes']] || '');
      const heartRateRaw = Number(cells[index['Heart rate']]);
      const stepsRaw = Number(cells[index['Activity (steps)']]);
      const timeSeconds = parseDurationToSeconds(cells[index['Time in bed']]);

      X.push([
        Number.isFinite(heartRateRaw) && cells[index['Heart rate']].trim() !== '' ? heartRateRaw : null,
        /drank coffee/i.test(notes) ? 1 : 0,
        /worked out/i.test(notes) ? 1 : 0,
        Number.isFinite(stepsRaw) && stepsRaw !== 0 ? stepsRaw : null,
        timeSeconds,
      ]);
      y.push(target);
    }

    if (X.length < 10) throw new Error('Not enough usable records to train the browser model.');
    browserModel = fitRidge(X, y);
    statusEl.textContent = `Browser model ready · ${browserModel.rows} historical records · inputs stay on this device`;
    rowCountEl.textContent = `${browserModel.rows} records`;
  } catch (error) {
    console.error(error);
    statusEl.textContent = 'The browser model could not load. Refresh the page or view the repository for the Python version.';
    statusEl.classList.add('error');
  }
}

form.addEventListener('submit', event => {
  event.preventDefault();
  if (!browserModel) {
    statusEl.textContent = 'The model is still loading. Try again in a moment.';
    return;
  }

  const heartRate = Number(document.getElementById('heart-rate').value);
  const steps = Number(document.getElementById('steps').value);
  const hours = Number(document.getElementById('hours').value);
  const coffee = document.getElementById('coffee').checked ? 1 : 0;
  const workout = document.getElementById('workout').checked ? 1 : 0;

  const result = predict(browserModel, [heartRate, coffee, workout, steps, hours * 3600]);
  const rounded = Math.round(result);
  const [label, copy] = scoreNarrative(rounded);

  scoreEl.textContent = String(rounded);
  scoreFillEl.style.width = `${rounded}%`;
  scoreLabelEl.textContent = label;
  scoreCopyEl.textContent = copy;
});

loadAndTrain();

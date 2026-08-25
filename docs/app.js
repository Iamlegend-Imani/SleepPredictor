const STORAGE = {
  scenario: 'sleep-intelligence:scenario:v2',
  history: 'sleep-intelligence:history:v2',
  experiments: 'sleep-intelligence:experiments:v2',
  theme: 'sleep-intelligence:theme:v1'
};

const DEFAULT_SCENARIO = Object.freeze({
  duration: 7.75,
  heartRate: 58,
  steps: 8500,
  coffee: 2,
  workout: true,
  stress: 'moderate',
  tea: 1,
  lateEating: true,
  consistency: 'good'
});

const ICONS = {
  duration: '▰',
  stress: '◌',
  heartRate: '♥',
  lateEating: '⌇',
  coffee: '☕',
  workout: '◆',
  steps: '⌁',
  consistency: '◫',
  tea: '♨'
};

const EXPERIMENT_LIBRARY = [
  {
    id: 'late-meals',
    title: 'No late meals for 7 days',
    description: 'Finish eating at least 3 hours before bed.',
    impact: '+6 to +11',
    icon: '⌇'
  },
  {
    id: 'consistent-bedtime',
    title: 'Consistent bedtime',
    description: 'Keep the same bedtime window each night.',
    impact: '+4 to +8',
    icon: '◫'
  },
  {
    id: 'reduce-coffee',
    title: 'Reduce coffee',
    description: 'Try one cup, earlier in the day, for 7 days.',
    impact: '+3 to +8',
    icon: '☕'
  }
];

const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => Array.from(document.querySelectorAll(selector));
const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

let scenario = loadScenario();
let currentResult = null;
let driverFilter = 'all';
let rangeFilter = '7';
let toastTimer = null;

const els = {
  form: $('#sleep-form'),
  duration: $('#duration'),
  heartRate: $('#heart-rate'),
  steps: $('#steps'),
  workout: $('#workout'),
  lateEating: $('#late-eating'),
  durationValue: $('#duration-value'),
  hrValue: $('#hr-value'),
  stepsValue: $('#steps-value'),
  coffeeValue: $('#coffee-value'),
  stressValue: $('#stress-value'),
  workoutValue: $('#workout-value'),
  teaValue: $('#tea-value'),
  lateValue: $('#late-value'),
  consistencyValue: $('#consistency-value'),
  score: $('#score'),
  footerScore: $('#footer-score'),
  scoreRing: $('#score-ring'),
  scoreLabel: $('#score-label'),
  scoreCopy: $('#score-copy'),
  updatedTime: $('#updated-time'),
  signalBadges: $('#signal-badges'),
  driverList: $('#driver-list'),
  recommendationGrid: $('#recommendation-grid'),
  experimentGrid: $('#experiment-grid'),
  trendChart: $('#trend-chart'),
  chartLabels: $('#chart-labels'),
  averageScore: $('#average-score'),
  bestScore: $('#best-score'),
  bestDay: $('#best-day'),
  commonDisruptor: $('#common-disruptor'),
  disruptorCount: $('#disruptor-count'),
  toast: $('#toast')
};

function safeParse(value, fallback) {
  try {
    const parsed = JSON.parse(value);
    return parsed ?? fallback;
  } catch {
    return fallback;
  }
}

function loadScenario() {
  const stored = safeParse(localStorage.getItem(STORAGE.scenario), null);
  return stored ? { ...DEFAULT_SCENARIO, ...stored } : { ...DEFAULT_SCENARIO };
}

function saveScenario() {
  localStorage.setItem(STORAGE.scenario, JSON.stringify(scenario));
}

function dateKey(date = new Date()) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function seedHistory() {
  const scores = [72, 68, 75, 81, 79, 83];
  const disruptors = ['Coffee', 'Late eating', 'Stress', 'None', 'Late eating', 'Stress'];
  return scores.map((score, index) => {
    const date = new Date();
    date.setDate(date.getDate() - (scores.length - index));
    return { date: dateKey(date), score, disruptor: disruptors[index] };
  });
}

function loadHistory() {
  const stored = safeParse(localStorage.getItem(STORAGE.history), null);
  if (Array.isArray(stored) && stored.length) return stored;
  const seeded = seedHistory();
  localStorage.setItem(STORAGE.history, JSON.stringify(seeded));
  return seeded;
}

function saveHistory(history) {
  localStorage.setItem(STORAGE.history, JSON.stringify(history));
}

function loadExperiments() {
  const stored = safeParse(localStorage.getItem(STORAGE.experiments), []);
  return Array.isArray(stored) ? stored : [];
}

function saveExperiments(experiments) {
  localStorage.setItem(STORAGE.experiments, JSON.stringify(experiments));
}

function formatDuration(hours) {
  const whole = Math.floor(hours);
  const minutes = Math.round((hours - whole) * 60);
  return `${whole}h ${String(minutes).padStart(2, '0')}m`;
}

function formatShortDate(value) {
  const date = new Date(`${value}T12:00:00`);
  return new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric' }).format(date);
}

function timeAgoLabel() {
  return 'just now';
}

function getImpacts(s) {
  let durationImpact;
  if (s.duration >= 7 && s.duration <= 9) {
    durationImpact = Math.round(18 - Math.abs(s.duration - 8) * 8);
  } else if (s.duration < 7) {
    durationImpact = Math.round(2 - (7 - s.duration) * 8);
  } else {
    durationImpact = Math.round(6 - (s.duration - 9) * 7);
  }
  durationImpact = clamp(durationImpact, -18, 18);

  let hrImpact = 0;
  if (s.heartRate <= 55) hrImpact = 11;
  else if (s.heartRate <= 60) hrImpact = 9;
  else if (s.heartRate <= 65) hrImpact = 6;
  else if (s.heartRate <= 72) hrImpact = 2;
  else if (s.heartRate <= 80) hrImpact = -4;
  else hrImpact = -9;

  let stepsImpact = 0;
  if (s.steps >= 12000) stepsImpact = 7;
  else if (s.steps >= 8000) stepsImpact = 5;
  else if (s.steps >= 5000) stepsImpact = 2;
  else if (s.steps < 2500) stepsImpact = -4;

  const coffeeImpact = s.coffee === 0 ? 4 : s.coffee === 1 ? 1 : s.coffee === 2 ? -5 : -10;
  const stressImpact = s.stress === 'low' ? 5 : s.stress === 'moderate' ? -6 : -15;
  const workoutImpact = s.workout ? 6 : 0;
  const teaImpact = s.tea === 0 ? 0 : s.tea === 1 ? -1 : -3;
  const lateImpact = s.lateEating ? -8 : 3;
  const consistencyImpact = s.consistency === 'variable' ? -5 : s.consistency === 'good' ? 4 : 7;

  return [
    { key: 'duration', label: 'Time in Bed', impact: durationImpact, detail: formatDuration(s.duration) },
    { key: 'stress', label: 'Stress', impact: stressImpact, detail: capitalize(s.stress) },
    { key: 'heartRate', label: 'Resting Heart Rate', impact: hrImpact, detail: `${s.heartRate} bpm` },
    { key: 'lateEating', label: 'Late Eating', impact: lateImpact, detail: s.lateEating ? 'within 3h of bed' : '3h+ before bed' },
    { key: 'coffee', label: 'Coffee', impact: coffeeImpact, detail: `${s.coffee}${s.coffee >= 3 ? '+' : ''} cup${s.coffee === 1 ? '' : 's'}` },
    { key: 'workout', label: 'Workout', impact: workoutImpact, detail: s.workout ? 'completed today' : 'none today' },
    { key: 'steps', label: 'Activity (Steps)', impact: stepsImpact, detail: `${s.steps.toLocaleString()} steps` },
    { key: 'consistency', label: 'Consistency', impact: consistencyImpact, detail: capitalize(s.consistency) },
    { key: 'tea', label: 'Tea', impact: teaImpact, detail: `${s.tea}${s.tea >= 2 ? '+' : ''} cup${s.tea === 1 ? '' : 's'}` }
  ];
}

function estimate(s) {
  const drivers = getImpacts(s);
  const raw = 64 + drivers.reduce((sum, driver) => sum + driver.impact, 0);
  const score = Math.round(clamp(raw, 35, 98));
  const sorted = [...drivers].sort((a, b) => Math.abs(b.impact) - Math.abs(a.impact));
  const positive = sorted.filter((driver) => driver.impact > 0);
  const negative = sorted.filter((driver) => driver.impact < 0);
  return { score, drivers, positive, negative };
}

function capitalize(value) {
  return String(value).charAt(0).toUpperCase() + String(value).slice(1);
}

function scoreLanguage(score) {
  if (score >= 88) {
    return {
      label: 'Strong conditions for restorative sleep',
      copy: 'Most of your current signals are aligned. Protect the routine and watch the few remaining disruptors.'
    };
  }
  if (score >= 78) {
    return {
      label: 'Likely restorative sleep tonight',
      copy: "You're set up well for quality sleep. A few small tweaks could improve things even more."
    };
  }
  if (score >= 66) {
    return {
      label: 'Mixed but workable conditions',
      copy: 'Several signals are helping, but one or two disruptors are pulling the estimate down.'
    };
  }
  return {
    label: 'Several signals may be working against you',
    copy: 'Use the driver view to find the largest negative signal and test one change rather than changing everything at once.'
  };
}

function driverTone(impact) {
  if (impact >= 3) return 'good';
  if (impact <= -7) return 'bad';
  if (impact < 0) return 'watch';
  return 'good';
}

function renderScenarioControls() {
  els.duration.value = scenario.duration;
  els.heartRate.value = scenario.heartRate;
  els.steps.value = scenario.steps;
  els.workout.checked = scenario.workout;
  els.lateEating.checked = scenario.lateEating;

  els.durationValue.textContent = formatDuration(scenario.duration);
  els.hrValue.textContent = `${scenario.heartRate} bpm`;
  els.stepsValue.textContent = scenario.steps.toLocaleString();
  els.coffeeValue.textContent = `${scenario.coffee}${scenario.coffee >= 3 ? '+' : ''} cup${scenario.coffee === 1 ? '' : 's'}`;
  els.stressValue.textContent = capitalize(scenario.stress);
  els.workoutValue.textContent = scenario.workout ? '4+ hours before bed' : 'Not today';
  els.teaValue.textContent = `${scenario.tea}${scenario.tea >= 2 ? '+' : ''} cup${scenario.tea === 1 ? '' : 's'}`;
  els.lateValue.textContent = scenario.lateEating ? '2.5h before bed' : '3h+ before bed';
  els.consistencyValue.textContent = capitalize(scenario.consistency);

  $$('.control-segment').forEach((segment) => {
    const key = segment.dataset.control;
    segment.querySelectorAll('button').forEach((button) => {
      const expected = ['coffee', 'tea'].includes(key) ? Number(button.dataset.value) : button.dataset.value;
      button.classList.toggle('selected', scenario[key] === expected);
    });
  });
}

function renderEstimate(result) {
  currentResult = result;
  const { score, negative } = result;
  const language = scoreLanguage(score);
  els.score.textContent = score;
  els.footerScore.textContent = score;
  els.scoreLabel.textContent = language.label;
  els.scoreCopy.textContent = language.copy;
  els.updatedTime.textContent = timeAgoLabel();

  const degrees = Math.round(score * 3.6);
  els.scoreRing.style.background = `conic-gradient(from 220deg, #5ce1a7 0deg, #5ba6ff ${Math.round(degrees * .62)}deg, #9a5eff ${degrees}deg, rgba(255,255,255,.08) ${degrees}deg 360deg)`;

  const badgeDrivers = [
    result.drivers.find((d) => d.key === 'coffee'),
    result.drivers.find((d) => d.key === 'stress'),
    result.drivers.find((d) => d.key === 'lateEating'),
    result.drivers.find((d) => d.key === 'steps'),
    result.drivers.find((d) => d.key === 'consistency')
  ];

  els.signalBadges.innerHTML = badgeDrivers.map((driver) => {
    const tone = driverTone(driver.impact);
    const status = driver.impact >= 4 ? 'Good' : driver.impact <= -7 ? 'High' : driver.impact < 0 ? 'Watch' : 'Neutral';
    return `<div class="signal-badge ${tone}"><strong>${ICONS[driver.key] || '•'} ${driver.label.replace('Activity (Steps)', 'Movement')}</strong><span>${status}</span></div>`;
  }).join('');

  const biggest = negative[0];
  if (biggest && score < 88) {
    els.scoreCopy.textContent = `${language.copy} Biggest watch right now: ${biggest.label.toLowerCase()}.`;
  }
}

function renderDrivers(result) {
  const filtered = result.drivers.filter((driver) => {
    if (driverFilter === 'positive') return driver.impact > 0;
    if (driverFilter === 'negative') return driver.impact < 0;
    return true;
  });

  els.driverList.innerHTML = filtered.map((driver) => {
    const positive = driver.impact >= 0;
    const width = clamp(Math.abs(driver.impact) / 20 * 50, 1.5, 50);
    const sign = driver.impact > 0 ? '+' : '';
    return `
      <div class="driver-row">
        <div class="driver-name">${ICONS[driver.key] || '•'} &nbsp;${driver.label}</div>
        <div class="driver-track"><span class="driver-bar ${positive ? 'positive' : 'negative'}" style="width:${width}%"></span></div>
        <div class="driver-value"><strong class="${positive ? 'positive' : 'negative'}">${sign}${driver.impact}</strong><small>${driver.detail}</small></div>
      </div>`;
  }).join('');
}

function buildRecommendations(result) {
  const recs = [];
  const byKey = Object.fromEntries(result.drivers.map((driver) => [driver.key, driver]));

  if (byKey.coffee.impact < 0) recs.push({ id: 'coffee', icon: '☕', title: 'Reduce caffeine', text: 'Try one cup and move it earlier in the day.', tone: Math.abs(byKey.coffee.impact) >= 7 ? 'high' : 'medium', impact: 'High leverage' });
  if (byKey.lateEating.impact < 0) recs.push({ id: 'late', icon: '⌇', title: 'Move dinner earlier', text: 'Finish eating at least 3 hours before bed.', tone: 'high', impact: 'High leverage' });
  if (byKey.stress.impact < 0) recs.push({ id: 'stress', icon: '◌', title: 'Add a wind-down', text: 'Use 20–30 minutes to reduce stimulation before sleep.', tone: byKey.stress.impact <= -10 ? 'high' : 'medium', impact: 'Medium–high' });
  if (byKey.duration.impact < 10) recs.push({ id: 'duration', icon: '▰', title: 'Adjust time in bed', text: scenario.duration < 7.5 ? 'Give yourself 30–60 more minutes in bed.' : 'Bring your sleep window closer to your personal sweet spot.', tone: 'medium', impact: 'Medium' });
  if (byKey.steps.impact <= 0) recs.push({ id: 'steps', icon: '⌁', title: 'Add daytime movement', text: 'A modest walk can improve the activity signal without overhauling your day.', tone: 'medium', impact: 'Medium' });
  if (byKey.consistency.impact < 4) recs.push({ id: 'consistency', icon: '◫', title: 'Stabilize bedtime', text: 'Keep your bedtime inside the same 30–60 minute window.', tone: 'medium', impact: 'Medium' });
  if (!scenario.workout) recs.push({ id: 'workout', icon: '◆', title: 'Move earlier', text: 'Add comfortable daytime movement if it fits your recovery needs.', tone: 'medium', impact: 'Medium' });

  const positiveFallback = [
    { id: 'protect', icon: '◇', title: 'Protect the routine', text: 'Your current inputs are already strong. Change one variable at a time.', tone: 'medium', impact: 'Protect gains' },
    { id: 'journal', icon: '✦', title: 'Note how you feel', text: 'Pair the estimate with how you actually feel tomorrow morning.', tone: 'medium', impact: 'Build context' }
  ];

  return [...recs, ...positiveFallback].slice(0, 4);
}

function renderRecommendations(result) {
  const recs = buildRecommendations(result);
  els.recommendationGrid.innerHTML = recs.map((rec) => `
    <article class="recommendation-card" data-tone="${rec.tone}">
      <div class="rec-icon">${rec.icon}</div>
      <h3>${rec.title}</h3>
      <p>${rec.text}</p>
      <footer><span class="impact-tag ${rec.tone}">${rec.impact}</span><button class="rec-arrow" type="button" data-rec="${rec.id}" aria-label="Apply ${rec.title}">→</button></footer>
    </article>`).join('');

  els.recommendationGrid.querySelectorAll('[data-rec]').forEach((button) => {
    button.addEventListener('click', () => applyRecommendation(button.dataset.rec));
  });
}

function applyRecommendation(id) {
  if (id === 'coffee') scenario.coffee = Math.min(scenario.coffee, 1);
  if (id === 'late') scenario.lateEating = false;
  if (id === 'stress') scenario.stress = 'low';
  if (id === 'duration') scenario.duration = 8;
  if (id === 'steps') scenario.steps = Math.max(scenario.steps, 8000);
  if (id === 'consistency') scenario.consistency = 'strong';
  if (id === 'workout') scenario.workout = true;
  if (id === 'protect' || id === 'journal') {
    showToast('No scenario change applied — use this as a reflection prompt.');
    return;
  }
  saveScenario();
  renderAll();
  showToast('Scenario updated.');
}

function experimentStatus(id) {
  return loadExperiments().find((experiment) => experiment.id === id) || null;
}

function renderExperiments() {
  const stored = loadExperiments();
  els.experimentGrid.innerHTML = EXPERIMENT_LIBRARY.map((experiment, index) => {
    const saved = stored.find((item) => item.id === experiment.id);
    let buttonText = 'Start 7-day test';
    let buttonClass = '';
    if (saved?.status === 'running') {
      const start = new Date(`${saved.startedAt}T12:00:00`);
      const now = new Date();
      const elapsed = Math.max(1, Math.floor((now - start) / 86400000) + 1);
      buttonText = elapsed >= 7 ? 'Mark complete' : `Day ${Math.min(elapsed, 7)} of 7`;
      buttonClass = 'running';
    }
    if (saved?.status === 'complete') {
      buttonText = 'Completed';
      buttonClass = 'complete';
    }

    return `
      <article class="experiment-card">
        <span class="exp-number">${index + 1}</span>
        <div class="exp-icon">${experiment.icon}</div>
        <h3>${experiment.title}</h3>
        <p>${experiment.description}</p>
        <footer>
          <span class="expected">Expected impact <strong>${experiment.impact}</strong></span>
          <button class="experiment-button ${buttonClass}" type="button" data-experiment="${experiment.id}">${buttonText}</button>
        </footer>
      </article>`;
  }).join('');

  els.experimentGrid.querySelectorAll('[data-experiment]').forEach((button) => {
    button.addEventListener('click', () => cycleExperiment(button.dataset.experiment));
  });
}

function cycleExperiment(id) {
  const experiments = loadExperiments();
  const existing = experiments.find((experiment) => experiment.id === id);
  if (!existing) {
    experiments.push({ id, status: 'running', startedAt: dateKey() });
    showToast('7-day experiment started.');
  } else if (existing.status === 'running') {
    existing.status = 'complete';
    existing.completedAt = dateKey();
    showToast('Experiment marked complete.');
  } else {
    existing.status = 'running';
    existing.startedAt = dateKey();
    delete existing.completedAt;
    showToast('Experiment restarted.');
  }
  saveExperiments(experiments);
  renderExperiments();
}

function historyForRange(history, range) {
  if (range === 'all') return history;
  const days = Number(range);
  const cutoff = new Date();
  cutoff.setHours(0, 0, 0, 0);
  cutoff.setDate(cutoff.getDate() - (days - 1));
  return history.filter((item) => new Date(`${item.date}T12:00:00`) >= cutoff);
}

function renderHistory() {
  const allHistory = loadHistory().sort((a, b) => a.date.localeCompare(b.date));
  const history = historyForRange(allHistory, rangeFilter);
  const display = history.slice(-24);

  if (!display.length) {
    els.trendChart.innerHTML = '';
    els.chartLabels.innerHTML = '<span>No saved estimates yet</span>';
    els.averageScore.textContent = '—';
    els.bestScore.textContent = '—';
    els.bestDay.textContent = '—';
    els.commonDisruptor.textContent = '—';
    els.disruptorCount.textContent = '—';
    return;
  }

  const width = 760;
  const height = 230;
  const top = 24;
  const bottom = 200;
  const left = 18;
  const right = 742;
  const minScore = 40;
  const maxScore = 100;
  const stepX = display.length === 1 ? 0 : (right - left) / (display.length - 1);
  const points = display.map((item, index) => {
    const x = display.length === 1 ? width / 2 : left + index * stepX;
    const y = bottom - ((item.score - minScore) / (maxScore - minScore)) * (bottom - top);
    return { ...item, x, y };
  });

  const pointString = points.map((point) => `${point.x},${point.y}`).join(' ');
  const areaPath = `M ${points[0].x} ${bottom} L ${points.map((p) => `${p.x} ${p.y}`).join(' L ')} L ${points[points.length - 1].x} ${bottom} Z`;
  const gridYs = [100, 80, 60, 40].map((score) => {
    const y = bottom - ((score - minScore) / (maxScore - minScore)) * (bottom - top);
    return `<line class="chart-grid-line" x1="0" y1="${y}" x2="760" y2="${y}"></line>`;
  }).join('');

  els.trendChart.innerHTML = `
    <defs><linearGradient id="chartGradient" x1="0" x2="0" y1="0" y2="1"><stop offset="0%" stop-color="#4d82ff" stop-opacity=".55"/><stop offset="100%" stop-color="#4d82ff" stop-opacity="0"/></linearGradient></defs>
    ${gridYs}
    <path class="chart-area" d="${areaPath}"></path>
    <polyline class="chart-line" points="${pointString}"></polyline>
    ${points.map((point, index) => `<circle class="chart-dot ${index === points.length - 1 ? 'today' : ''}" cx="${point.x}" cy="${point.y}" r="4.5"></circle><text class="chart-value" x="${point.x}" y="${point.y - 10}" text-anchor="middle">${point.score}</text>`).join('')}`;

  els.chartLabels.style.gridTemplateColumns = `repeat(${display.length}, minmax(0,1fr))`;
  els.chartLabels.innerHTML = display.map((item, index) => `<span>${index === display.length - 1 && item.date === dateKey() ? 'Today' : formatShortDate(item.date)}</span>`).join('');

  const average = Math.round(history.reduce((sum, item) => sum + item.score, 0) / history.length);
  const best = history.reduce((a, b) => b.score > a.score ? b : a, history[0]);
  els.averageScore.textContent = `${average}/100`;
  els.bestScore.textContent = best.score;
  els.bestDay.textContent = formatShortDate(best.date);

  const counts = history.reduce((acc, item) => {
    if (item.disruptor && item.disruptor !== 'None') acc[item.disruptor] = (acc[item.disruptor] || 0) + 1;
    return acc;
  }, {});
  const disruptor = Object.entries(counts).sort((a, b) => b[1] - a[1])[0];
  els.commonDisruptor.textContent = disruptor ? disruptor[0] : 'No clear pattern';
  els.disruptorCount.textContent = disruptor ? `${disruptor[1]} of ${history.length} saved days` : 'Keep saving nights';
}

function strongestDisruptor(result) {
  const negative = result.negative[0];
  return negative ? negative.label : 'None';
}

function saveTonight() {
  if (!currentResult) return;
  const history = loadHistory();
  const key = dateKey();
  const record = {
    date: key,
    score: currentResult.score,
    disruptor: strongestDisruptor(currentResult)
  };
  const existingIndex = history.findIndex((item) => item.date === key);
  if (existingIndex >= 0) history[existingIndex] = record;
  else history.push(record);
  saveHistory(history);
  renderHistory();
  showToast(existingIndex >= 0 ? "Today's estimate updated." : "Tonight's estimate saved.");
}

function syncFromForm() {
  scenario.duration = Number(els.duration.value);
  scenario.heartRate = Number(els.heartRate.value);
  scenario.steps = Number(els.steps.value);
  scenario.workout = els.workout.checked;
  scenario.lateEating = els.lateEating.checked;
  saveScenario();
}

function renderAll() {
  renderScenarioControls();
  const result = estimate(scenario);
  renderEstimate(result);
  renderDrivers(result);
  renderRecommendations(result);
  renderExperiments();
  renderHistory();
}

function showToast(message) {
  clearTimeout(toastTimer);
  els.toast.textContent = message;
  els.toast.classList.add('show');
  toastTimer = setTimeout(() => els.toast.classList.remove('show'), 2400);
}

function setTheme(theme) {
  document.body.classList.toggle('light', theme === 'light');
  $('#theme-toggle').textContent = theme === 'light' ? '☀' : '☾';
  localStorage.setItem(STORAGE.theme, theme);
}

function resetEverything() {
  Object.values(STORAGE).forEach((key) => localStorage.removeItem(key));
  scenario = { ...DEFAULT_SCENARIO };
  setTheme('dark');
  loadHistory();
  renderAll();
  showToast('Local Sleep Intelligence data reset.');
}

els.duration.addEventListener('input', () => {
  syncFromForm();
  renderAll();
});
els.heartRate.addEventListener('input', () => {
  syncFromForm();
  renderAll();
});
els.steps.addEventListener('input', () => {
  syncFromForm();
  renderAll();
});
els.workout.addEventListener('change', () => {
  syncFromForm();
  renderAll();
});
els.lateEating.addEventListener('change', () => {
  syncFromForm();
  renderAll();
});

$$('.control-segment').forEach((segment) => {
  segment.addEventListener('click', (event) => {
    const button = event.target.closest('button');
    if (!button) return;
    const key = segment.dataset.control;
    const value = button.dataset.value;
    scenario[key] = ['coffee', 'tea'].includes(key) ? Number(value) : value;
    saveScenario();
    renderAll();
  });
});

$('#driver-filter').addEventListener('click', (event) => {
  const button = event.target.closest('button');
  if (!button) return;
  driverFilter = button.dataset.filter;
  $$('#driver-filter button').forEach((item) => item.classList.toggle('selected', item === button));
  renderDrivers(currentResult || estimate(scenario));
});

$('#range-filter').addEventListener('click', (event) => {
  const button = event.target.closest('button');
  if (!button) return;
  rangeFilter = button.dataset.range;
  $$('#range-filter button').forEach((item) => item.classList.toggle('selected', item === button));
  renderHistory();
});

$('#jump-to-builder').addEventListener('click', () => $('#builder').scrollIntoView({ behavior: 'smooth', block: 'center' }));
$('#recalculate').addEventListener('click', () => {
  syncFromForm();
  renderAll();
  showToast('Estimate recalculated.');
});
$('#save-tonight').addEventListener('click', saveTonight);
$('#reset-scenario').addEventListener('click', () => {
  scenario = { ...DEFAULT_SCENARIO };
  saveScenario();
  renderAll();
  showToast('Scenario reset to baseline.');
});
$('#reset-data').addEventListener('click', resetEverything);
$('#clear-experiments').addEventListener('click', () => {
  const running = loadExperiments().filter((experiment) => experiment.status !== 'complete');
  saveExperiments(running);
  renderExperiments();
  showToast('Completed experiments cleared.');
});
$('#theme-toggle').addEventListener('click', () => {
  const next = document.body.classList.contains('light') ? 'dark' : 'light';
  setTheme(next);
});

window.addEventListener('hashchange', () => {
  const hash = window.location.hash || '#dashboard';
  $$('.nav-tabs a').forEach((link) => link.classList.toggle('active', link.getAttribute('href') === hash));
});

setTheme(localStorage.getItem(STORAGE.theme) || 'dark');
renderAll();

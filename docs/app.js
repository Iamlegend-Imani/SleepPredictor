const els = {
  duration: document.getElementById('duration'),
  heartRate: document.getElementById('heart-rate'),
  steps: document.getElementById('steps'),
  coffee: document.getElementById('coffee'),
  workout: document.getElementById('workout'),
  stress: document.getElementById('stress'),
  late: document.getElementById('late'),
  wake: document.getElementById('wake-state'),
  durationValue: document.getElementById('duration-value'),
  hrValue: document.getElementById('hr-value'),
  stepsValue: document.getElementById('steps-value'),
  score: document.getElementById('score'),
  scoreRing: document.getElementById('score-ring'),
  scoreLabel: document.getElementById('score-label'),
  scoreCopy: document.getElementById('score-copy'),
  drivers: document.getElementById('drivers')
};

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function estimate() {
  const duration = Number(els.duration.value);
  const heartRate = Number(els.heartRate.value);
  const steps = Number(els.steps.value);
  const coffee = els.coffee.checked;
  const workout = els.workout.checked;
  const stress = els.stress.checked;
  const late = els.late.checked;
  const wake = els.wake.value;

  // Transparent browser-only heuristic for directional exploration.
  // It is intentionally separate from the trained Python model.
  let score = 76;
  const drivers = [];

  const durationDelta = -5 * Math.abs(duration - 8) + 5;
  score += durationDelta;
  drivers.push({ label: `${duration.toFixed(1)}h in bed`, tone: duration >= 7 && duration <= 9 ? 'good' : 'watch' });

  if (heartRate <= 65) {
    score += 2;
    drivers.push({ label: `${heartRate} bpm`, tone: 'good' });
  } else if (heartRate >= 80) {
    score -= 4;
    drivers.push({ label: `${heartRate} bpm`, tone: 'watch' });
  }

  if (steps >= 8000) {
    score += 3;
    drivers.push({ label: `${steps.toLocaleString()} steps`, tone: 'good' });
  } else if (steps < 3000) {
    score -= 2;
    drivers.push({ label: `${steps.toLocaleString()} steps`, tone: 'watch' });
  }

  if (workout) {
    score += 2;
    drivers.push({ label: 'worked out', tone: 'good' });
  }
  if (coffee) {
    score -= 1;
    drivers.push({ label: 'coffee', tone: 'watch' });
  }
  if (stress) {
    score -= 6;
    drivers.push({ label: 'stressful day', tone: 'watch' });
  }
  if (late) {
    score -= 3;
    drivers.push({ label: 'ate late', tone: 'watch' });
  }

  if (wake === 'happy') score += 3;
  if (wake === 'unknown') score -= 1;

  score = Math.round(clamp(score, 35, 98));

  els.durationValue.textContent = `${duration.toFixed(1)} h`;
  els.hrValue.textContent = `${heartRate} bpm`;
  els.stepsValue.textContent = `${steps.toLocaleString()} steps`;
  els.score.textContent = score;

  const deg = Math.round((score / 100) * 360);
  els.scoreRing.style.background = `conic-gradient(var(--accent) 0deg, var(--accent) ${deg}deg, rgba(255,255,255,.08) ${deg}deg)`;

  if (score >= 85) {
    els.scoreLabel.textContent = 'Strong sleep conditions';
  } else if (score >= 70) {
    els.scoreLabel.textContent = 'Mixed but workable conditions';
  } else {
    els.scoreLabel.textContent = 'Several signals may be working against you';
  }

  const positives = drivers.filter(d => d.tone === 'good').map(d => d.label);
  const watches = drivers.filter(d => d.tone === 'watch').map(d => d.label);

  if (positives.length && watches.length) {
    els.scoreCopy.textContent = `Support is coming from ${positives.slice(0, 2).join(' and ')}. Watch ${watches.slice(0, 2).join(' and ')}.`;
  } else if (positives.length) {
    els.scoreCopy.textContent = `This scenario is being supported most by ${positives.slice(0, 2).join(' and ')}.`;
  } else if (watches.length) {
    els.scoreCopy.textContent = `The biggest watch signals here are ${watches.slice(0, 2).join(' and ')}.`;
  } else {
    els.scoreCopy.textContent = 'Change one input at a time to see how the directional estimate responds.';
  }

  els.drivers.innerHTML = drivers
    .map(d => `<span class="driver ${d.tone}">${d.label}</span>`)
    .join('');
}

Object.values(els).forEach(el => {
  if (el && ['INPUT', 'SELECT'].includes(el.tagName)) {
    el.addEventListener('input', estimate);
    el.addEventListener('change', estimate);
  }
});

estimate();

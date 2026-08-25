(() => {
  const P_STORAGE = {
    plans: 'sleep-intelligence:plans:v1',
    reviews: 'sleep-intelligence:reviews:v1',
    practicalMigration: 'sleep-intelligence:practical-migration:v1'
  };

  const pParse = (value, fallback) => {
    try {
      const parsed = JSON.parse(value);
      return parsed ?? fallback;
    } catch {
      return fallback;
    }
  };

  const pClamp = (value, min, max) => Math.min(Math.max(value, min), max);
  const pDateKey = (date = new Date()) => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  };
  const pFormatDate = (value) => new Intl.DateTimeFormat(undefined, { weekday: 'short', month: 'short', day: 'numeric' }).format(new Date(`${value}T12:00:00`));
  const getPlans = () => pParse(localStorage.getItem(P_STORAGE.plans), []);
  const savePlans = (plans) => localStorage.setItem(P_STORAGE.plans, JSON.stringify(plans));
  const getReviews = () => pParse(localStorage.getItem(P_STORAGE.reviews), []);
  const saveReviews = (reviews) => localStorage.setItem(P_STORAGE.reviews, JSON.stringify(reviews));

  function addStyles() {
    const style = document.createElement('style');
    style.textContent = `
      .daily-loop-panel{grid-column:1/-1;padding:0;overflow:hidden;position:relative}
      .daily-loop-panel::before{content:"";position:absolute;inset:0 0 auto 0;height:1px;background:linear-gradient(90deg,transparent,rgba(92,225,167,.6),rgba(91,166,255,.55),transparent)}
      .daily-loop-head{display:flex;align-items:flex-end;justify-content:space-between;gap:24px;padding:28px 30px 18px;border-bottom:1px solid var(--line,rgba(255,255,255,.08))}
      .daily-loop-head h2{font-size:clamp(24px,3vw,36px);margin:7px 0 5px;letter-spacing:-.035em}.daily-loop-head p{margin:0;color:var(--muted,#93a0b7);max-width:650px}
      .daily-tabs{display:flex;gap:6px;padding:8px;background:rgba(255,255,255,.035);border:1px solid var(--line,rgba(255,255,255,.08));border-radius:14px;flex-wrap:wrap}
      .daily-tabs button{border:0;background:transparent;color:var(--muted,#93a0b7);padding:10px 13px;border-radius:9px;font:inherit;font-size:13px;cursor:pointer}.daily-tabs button.active{background:rgba(91,166,255,.14);color:var(--text,#f7f9ff)}
      .daily-view{padding:26px 30px 30px}.daily-view[hidden]{display:none}
      .practical-grid{display:grid;grid-template-columns:minmax(0,1.1fr) minmax(280px,.9fr);gap:18px}.practical-card{border:1px solid var(--line,rgba(255,255,255,.08));border-radius:18px;padding:20px;background:rgba(255,255,255,.025)}
      .practical-card h3{margin:0 0 7px;font-size:16px}.practical-card>p{margin:0 0 18px;color:var(--muted,#93a0b7);font-size:13px;line-height:1.6}
      .tonight-score{display:flex;align-items:center;gap:18px;padding:18px;border-radius:16px;background:linear-gradient(135deg,rgba(91,166,255,.12),rgba(154,94,255,.07));border:1px solid rgba(91,166,255,.18);margin-bottom:18px}.tonight-score strong{font-size:38px;line-height:1}.tonight-score small,.calibration small{display:block;color:var(--muted,#93a0b7);margin-top:4px}.personal-score{margin-left:auto;text-align:right}.personal-score strong{font-size:22px}
      .plan-actions{display:grid;gap:9px}.plan-action{display:flex;gap:11px;align-items:flex-start;padding:12px 13px;border-radius:13px;background:rgba(255,255,255,.035);border:1px solid var(--line,rgba(255,255,255,.07))}.plan-action b{font-size:13px}.plan-action span{font-size:12px;color:var(--muted,#93a0b7);display:block;margin-top:3px}.plan-action .num{display:grid;place-items:center;width:24px;height:24px;border-radius:8px;background:rgba(92,225,167,.12);color:#65e5af;font:600 11px 'DM Mono',monospace;flex:0 0 auto}
      .time-grid,.review-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px}.field{display:grid;gap:7px}.field.full{grid-column:1/-1}.field label{font-size:11px;letter-spacing:.08em;text-transform:uppercase;color:var(--muted,#93a0b7);font-weight:700}.field input,.field textarea,.field select{width:100%;box-sizing:border-box;border:1px solid var(--line,rgba(255,255,255,.1));border-radius:11px;padding:11px 12px;background:rgba(2,7,18,.38);color:var(--text,#f7f9ff);font:inherit}.light .field input,.light .field textarea,.light .field select{background:rgba(255,255,255,.6)}.field textarea{resize:vertical;min-height:78px}.field input[type=range]{padding:0;border:0;background:transparent}.range-readout{font:600 20px 'DM Mono',monospace;color:var(--text,#f7f9ff)}
      .window-summary{display:flex;justify-content:space-between;align-items:center;gap:12px;margin:14px 0;padding:12px 13px;border-radius:12px;background:rgba(255,255,255,.03);font-size:12px;color:var(--muted,#93a0b7)}.window-summary strong{color:var(--text,#f7f9ff);font-family:'DM Mono',monospace}
      .practical-actions{display:flex;gap:9px;align-items:center;flex-wrap:wrap;margin-top:16px}.practical-primary,.practical-secondary{border-radius:11px;padding:11px 14px;font:600 13px inherit;cursor:pointer}.practical-primary{border:1px solid rgba(92,225,167,.28);background:linear-gradient(135deg,rgba(92,225,167,.2),rgba(91,166,255,.16));color:var(--text,#f7f9ff)}.practical-secondary{border:1px solid var(--line,rgba(255,255,255,.1));background:rgba(255,255,255,.035);color:var(--text,#f7f9ff)}
      .saved-plan{padding:11px 13px;border-radius:11px;background:rgba(92,225,167,.08);border:1px solid rgba(92,225,167,.16);font-size:12px;color:#72e9b8;margin-bottom:14px}.review-empty{padding:28px 18px;text-align:center;border:1px dashed var(--line,rgba(255,255,255,.1));border-radius:14px;color:var(--muted,#93a0b7)}
      .comparison{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin-bottom:18px}.comparison>div,.weekly-metric{padding:14px;border:1px solid var(--line,rgba(255,255,255,.08));border-radius:13px;background:rgba(255,255,255,.025)}.comparison span,.weekly-metric span{display:block;color:var(--muted,#93a0b7);font-size:11px;margin-bottom:6px}.comparison strong,.weekly-metric strong{font:600 22px 'DM Mono',monospace}.gap-positive{color:#64e5ae}.gap-negative{color:#ff8a9b}
      .weekly-grid{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:10px;margin:15px 0 20px}.weekly-metric strong{font-size:20px}.weekly-summary{padding:16px;border-radius:14px;background:rgba(91,166,255,.07);border:1px solid rgba(91,166,255,.14);line-height:1.65;color:var(--muted,#93a0b7);font-size:13px}.weekly-summary b{color:var(--text,#f7f9ff)}
      .calibration{padding:14px;border-radius:13px;background:rgba(154,94,255,.07);border:1px solid rgba(154,94,255,.15);margin-top:12px}.calibration strong{font:600 20px 'DM Mono',monospace}.data-note{font-size:11px;color:var(--muted,#93a0b7);margin-top:10px;line-height:1.5}
      @media(max-width:900px){.daily-loop-head{align-items:flex-start;flex-direction:column}.practical-grid{grid-template-columns:1fr}.weekly-grid{grid-template-columns:repeat(2,1fr)}}
      @media(max-width:600px){.daily-loop-head,.daily-view{padding-left:18px;padding-right:18px}.time-grid,.review-grid{grid-template-columns:1fr}.field.full{grid-column:auto}.comparison{grid-template-columns:1fr 1fr}.weekly-grid{grid-template-columns:1fr 1fr}.personal-score{margin-left:0}.tonight-score{flex-wrap:wrap}}
    `;
    document.head.appendChild(style);
  }

  function migrateFakeHistory() {
    if (localStorage.getItem(P_STORAGE.practicalMigration)) return;
    const historyKey = (typeof STORAGE !== 'undefined' && STORAGE.history) ? STORAGE.history : 'sleep-intelligence:history:v2';
    const history = pParse(localStorage.getItem(historyKey), []);
    const seededScores = [72, 68, 75, 81, 79, 83];
    const seededDisruptors = ['Coffee', 'Late eating', 'Stress', 'None', 'Late eating', 'Stress'];
    const today = new Date();
    const seedMap = new Map();
    seededScores.forEach((score, index) => {
      const d = new Date(today);
      d.setDate(d.getDate() - (seededScores.length - index));
      seedMap.set(pDateKey(d), { score, disruptor: seededDisruptors[index] });
    });
    const cleaned = Array.isArray(history) ? history.filter((item) => {
      const match = seedMap.get(item.date);
      return !(match && item.score === match.score && item.disruptor === match.disruptor && !item.actualScore && !item.source);
    }) : [];
    localStorage.setItem(historyKey, JSON.stringify(cleaned));
    localStorage.setItem(P_STORAGE.practicalMigration, '1');
  }

  function timeWindowHours(start, end) {
    if (!start || !end) return null;
    const [sh, sm] = start.split(':').map(Number);
    const [eh, em] = end.split(':').map(Number);
    let minutes = (eh * 60 + em) - (sh * 60 + sm);
    if (minutes <= 0) minutes += 1440;
    return minutes / 60;
  }

  function formatHours(hours) {
    if (!Number.isFinite(hours)) return '—';
    const whole = Math.floor(hours);
    const mins = Math.round((hours - whole) * 60);
    return `${whole}h ${mins ? `${mins}m` : ''}`.trim();
  }

  function currentActions() {
    const result = (typeof currentResult !== 'undefined' && currentResult) ? currentResult : (typeof estimate === 'function' ? estimate(scenario) : null);
    if (!result) return [];
    if (typeof buildRecommendations === 'function') {
      return buildRecommendations(result).filter((r) => !['protect', 'journal'].includes(r.id)).slice(0, 3);
    }
    return [];
  }

  function calibration() {
    const reviews = getReviews().filter((r) => Number.isFinite(r.actualScore) && Number.isFinite(r.predictedScore));
    const recent = reviews.slice(-14);
    if (recent.length < 3) return { ready: false, count: recent.length, adjustment: 0, mae: null };
    const gaps = recent.map((r) => r.actualScore - r.predictedScore);
    const adjustment = Math.round(pClamp(gaps.reduce((a, b) => a + b, 0) / gaps.length, -15, 15));
    const mae = Math.round(recent.reduce((sum, r) => sum + Math.abs(r.actualScore - r.predictedScore), 0) / recent.length);
    return { ready: true, count: recent.length, adjustment, mae };
  }

  function latestPlanForReview() {
    const plans = [...getPlans()].sort((a, b) => b.date.localeCompare(a.date));
    const reviews = getReviews();
    const reviewed = new Set(reviews.map((r) => r.date));
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayKey = pDateKey(yesterday);
    return plans.find((p) => p.date === yesterdayKey && !reviewed.has(p.date)) || plans.find((p) => !reviewed.has(p.date)) || plans[0] || null;
  }

  function savePlan() {
    const result = (typeof currentResult !== 'undefined' && currentResult) ? currentResult : estimate(scenario);
    const bedtime = document.querySelector('#plan-bedtime')?.value || '23:00';
    const wake = document.querySelector('#plan-wake')?.value || '07:00';
    const windowHours = timeWindowHours(bedtime, wake);
    const actions = currentActions();
    const cal = calibration();
    const plan = {
      date: pDateKey(),
      createdAt: new Date().toISOString(),
      predictedScore: result.score,
      personalizedScore: cal.ready ? Math.round(pClamp(result.score + cal.adjustment, 35, 98)) : null,
      bedtime,
      wake,
      windowHours,
      actions: actions.map((a) => ({ id: a.id, title: a.title, text: a.text })),
      disruptor: result.negative?.[0]?.label || 'None',
      scenario: typeof scenario !== 'undefined' ? { ...scenario } : null
    };
    const plans = getPlans();
    const index = plans.findIndex((p) => p.date === plan.date);
    if (index >= 0) plans[index] = plan; else plans.push(plan);
    savePlans(plans);

    const historyKey = (typeof STORAGE !== 'undefined' && STORAGE.history) ? STORAGE.history : 'sleep-intelligence:history:v2';
    const history = pParse(localStorage.getItem(historyKey), []);
    const record = { date: plan.date, score: plan.predictedScore, predictedScore: plan.predictedScore, disruptor: plan.disruptor, source: 'plan', provisional: true };
    const hIndex = history.findIndex((h) => h.date === plan.date);
    if (hIndex >= 0) history[hIndex] = { ...history[hIndex], ...record }; else history.push(record);
    localStorage.setItem(historyKey, JSON.stringify(history));
    if (typeof renderHistory === 'function') renderHistory();
    if (typeof showToast === 'function') showToast("Tonight's plan saved. Come back tomorrow morning to review it.");
    renderPractical();
  }

  function saveReview(event) {
    event.preventDefault();
    const plan = latestPlanForReview();
    if (!plan) return;
    const form = event.currentTarget;
    const actualScore = Number(form.querySelector('#actual-score').value);
    const sleepHours = Number(form.querySelector('#actual-sleep-hours').value);
    const energy = Number(form.querySelector('#morning-energy').value);
    const awakenings = Number(form.querySelector('#awakenings').value);
    const actualBedtime = form.querySelector('#actual-bedtime').value;
    const actualWake = form.querySelector('#actual-wake').value;
    const notes = form.querySelector('#morning-notes').value.trim();
    const review = {
      date: plan.date,
      reviewedAt: new Date().toISOString(),
      predictedScore: plan.predictedScore,
      actualScore,
      gap: actualScore - plan.predictedScore,
      sleepHours,
      energy,
      awakenings,
      actualBedtime,
      actualWake,
      notes,
      disruptor: plan.disruptor
    };
    const reviews = getReviews();
    const index = reviews.findIndex((r) => r.date === review.date);
    if (index >= 0) reviews[index] = review; else reviews.push(review);
    reviews.sort((a, b) => a.date.localeCompare(b.date));
    saveReviews(reviews);

    const historyKey = (typeof STORAGE !== 'undefined' && STORAGE.history) ? STORAGE.history : 'sleep-intelligence:history:v2';
    const history = pParse(localStorage.getItem(historyKey), []);
    const hIndex = history.findIndex((h) => h.date === review.date);
    const outcome = {
      date: review.date,
      score: review.actualScore,
      predictedScore: review.predictedScore,
      actualScore: review.actualScore,
      disruptor: review.disruptor,
      source: 'review',
      provisional: false
    };
    if (hIndex >= 0) history[hIndex] = { ...history[hIndex], ...outcome }; else history.push(outcome);
    localStorage.setItem(historyKey, JSON.stringify(history));
    if (typeof renderHistory === 'function') renderHistory();
    if (typeof showToast === 'function') showToast('Morning review saved. Your personal calibration has been updated.');
    renderPractical();
    activateView('weekly');
  }

  function exportCSV() {
    const plans = getPlans();
    const reviews = getReviews();
    const reviewByDate = new Map(reviews.map((r) => [r.date, r]));
    const rows = [['date','predicted_score','actual_score','gap','sleep_hours','energy_1_5','awakenings','target_bedtime','target_wake','actual_bedtime','actual_wake','top_disruptor','notes']];
    plans.forEach((plan) => {
      const review = reviewByDate.get(plan.date) || {};
      rows.push([
        plan.date, plan.predictedScore ?? '', review.actualScore ?? '', review.gap ?? '', review.sleepHours ?? '', review.energy ?? '', review.awakenings ?? '',
        plan.bedtime ?? '', plan.wake ?? '', review.actualBedtime ?? '', review.actualWake ?? '', plan.disruptor ?? '', (review.notes || '').replace(/\r?\n/g, ' ')
      ]);
    });
    const csv = rows.map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sleep-intelligence-${pDateKey()}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    if (typeof showToast === 'function') showToast('Sleep data exported as CSV.');
  }

  function weeklyStats() {
    const reviews = getReviews().slice(-7);
    if (!reviews.length) return null;
    const avg = (key) => reviews.reduce((sum, r) => sum + Number(r[key] || 0), 0) / reviews.length;
    const avgActual = Math.round(avg('actualScore'));
    const avgPredicted = Math.round(avg('predictedScore'));
    const avgSleep = avg('sleepHours');
    const avgEnergy = avg('energy');
    const avgGap = Math.round(reviews.reduce((sum, r) => sum + (r.actualScore - r.predictedScore), 0) / reviews.length);
    const biggestMiss = [...reviews].sort((a,b) => Math.abs((b.actualScore-b.predictedScore)) - Math.abs((a.actualScore-a.predictedScore)))[0];
    return { reviews, avgActual, avgPredicted, avgSleep, avgEnergy, avgGap, biggestMiss };
  }

  function renderPlanView() {
    const result = (typeof currentResult !== 'undefined' && currentResult) ? currentResult : estimate(scenario);
    const actions = currentActions();
    const cal = calibration();
    const personalized = cal.ready ? Math.round(pClamp(result.score + cal.adjustment, 35, 98)) : null;
    const existing = getPlans().find((p) => p.date === pDateKey());
    const bedtime = existing?.bedtime || '23:00';
    const wake = existing?.wake || '07:00';
    const window = timeWindowHours(bedtime, wake);
    return `
      <div class="practical-grid">
        <article class="practical-card">
          ${existing ? `<div class="saved-plan">✓ Tonight's plan is saved. You can update it any time before bed.</div>` : ''}
          <h3>Tonight, make it concrete</h3>
          <p>The estimate is only useful if it turns into a plan you can actually follow.</p>
          <div class="tonight-score">
            <div><strong>${result.score}</strong><small>base estimate</small></div>
            <div class="personal-score">${personalized !== null ? `<strong>${personalized}/100</strong><small>personalized estimate (${cal.adjustment >= 0 ? '+' : ''}${cal.adjustment})</small>` : `<strong>${cal.count}/3</strong><small>morning reviews until calibration</small>`}</div>
          </div>
          <div class="plan-actions">
            ${(actions.length ? actions : [{title:'Protect the routine',text:'Your current inputs are strong. Keep tonight simple.'}]).map((a,i) => `<div class="plan-action"><span class="num">0${i+1}</span><div><b>${a.title}</b><span>${a.text}</span></div></div>`).join('')}
          </div>
          <div class="calibration">${cal.ready ? `<strong>${cal.mae} pts</strong><small>average prediction error across your last ${cal.count} reviewed nights</small>` : `<strong>${3-cal.count} more</strong><small>reviewed night${3-cal.count===1?'':'s'} needed before the app shows a personal adjustment</small>`}</div>
        </article>
        <article class="practical-card">
          <h3>Set your sleep window</h3>
          <p>Give tonight a start and an end. This is a target window, not a promise that you will be asleep the whole time.</p>
          <div class="time-grid">
            <div class="field"><label for="plan-bedtime">Target bedtime</label><input id="plan-bedtime" type="time" value="${bedtime}"></div>
            <div class="field"><label for="plan-wake">Target wake time</label><input id="plan-wake" type="time" value="${wake}"></div>
          </div>
          <div class="window-summary"><span>Planned time in bed</span><strong id="planned-window">${formatHours(window)}</strong></div>
          <div class="practical-actions">
            <button class="practical-secondary" type="button" id="use-window">Use this in estimate</button>
            <button class="practical-primary" type="button" id="save-plan">${existing ? 'Update tonight’s plan' : 'Save tonight’s plan'}</button>
          </div>
          <div class="data-note">Your plan stays in this browser. Tomorrow, the morning review will compare your self-reported outcome with tonight's estimate.</div>
        </article>
      </div>`;
  }

  function renderReviewView() {
    const plan = latestPlanForReview();
    if (!plan) return `<div class="review-empty"><strong>No saved night to review yet.</strong><br><br>Save tonight's plan first. Tomorrow morning, this becomes your check-in.</div>`;
    const existing = getReviews().find((r) => r.date === plan.date);
    const score = existing?.actualScore ?? 75;
    return `
      <div class="practical-grid">
        <article class="practical-card">
          <h3>Morning review · ${pFormatDate(plan.date)}</h3>
          <p>Compare what the app expected with what actually happened. The app uses these reviews only to calculate a simple personal calibration gap.</p>
          <div class="comparison">
            <div><span>Predicted</span><strong>${plan.predictedScore}</strong></div>
            <div><span>Actual</span><strong id="actual-score-display">${score}</strong></div>
            <div><span>Gap</span><strong id="gap-display" class="${score-plan.predictedScore >= 0 ? 'gap-positive':'gap-negative'}">${score-plan.predictedScore >= 0 ? '+' : ''}${score-plan.predictedScore}</strong></div>
          </div>
          <form id="morning-review-form" class="review-grid">
            <div class="field full"><label for="actual-score">How was your sleep? 0–100</label><div class="range-readout"><span id="actual-score-readout">${score}</span>/100</div><input id="actual-score" type="range" min="0" max="100" step="1" value="${score}"></div>
            <div class="field"><label for="actual-sleep-hours">Estimated actual sleep</label><input id="actual-sleep-hours" type="number" min="0" max="14" step="0.25" value="${existing?.sleepHours ?? Math.min(plan.windowHours || 8,8)}"></div>
            <div class="field"><label for="morning-energy">Morning energy · 1–5</label><select id="morning-energy"><option value="1">1 · depleted</option><option value="2">2 · low</option><option value="3" ${!existing || existing.energy===3?'selected':''}>3 · okay</option><option value="4" ${existing?.energy===4?'selected':''}>4 · good</option><option value="5" ${existing?.energy===5?'selected':''}>5 · strong</option></select></div>
            <div class="field"><label for="actual-bedtime">Actual bedtime</label><input id="actual-bedtime" type="time" value="${existing?.actualBedtime || plan.bedtime || '23:00'}"></div>
            <div class="field"><label for="actual-wake">Actual wake time</label><input id="actual-wake" type="time" value="${existing?.actualWake || plan.wake || '07:00'}"></div>
            <div class="field"><label for="awakenings">Remembered awakenings</label><input id="awakenings" type="number" min="0" max="20" step="1" value="${existing?.awakenings ?? 0}"></div>
            <div class="field full"><label for="morning-notes">Anything unusual?</label><textarea id="morning-notes" placeholder="Travel, alcohol, illness, noise, temperature, dreams, late screen time…">${existing?.notes || ''}</textarea></div>
            <div class="field full"><div class="practical-actions"><button class="practical-primary" type="submit">${existing ? 'Update morning review' : 'Save morning review'}</button></div></div>
          </form>
        </article>
        <article class="practical-card">
          <h3>What are we learning?</h3>
          <p>Prediction error is useful information. If your real outcomes repeatedly run above or below the estimate, the app can show that bias instead of pretending the generic score is perfectly personal.</p>
          <div class="plan-actions">
            <div class="plan-action"><span class="num">01</span><div><b>Prediction</b><span>${plan.predictedScore}/100 based on the inputs you saved that night.</span></div></div>
            <div class="plan-action"><span class="num">02</span><div><b>Outcome</b><span>Your own morning rating. Subjective, but directly about your experience.</span></div></div>
            <div class="plan-action"><span class="num">03</span><div><b>Calibration</b><span>After 3+ reviewed nights, the average gap becomes a personal adjustment—not a medical claim.</span></div></div>
          </div>
        </article>
      </div>`;
  }

  function renderWeeklyView() {
    const stats = weeklyStats();
    const cal = calibration();
    if (!stats) return `<div class="review-empty"><strong>Your weekly view will build itself.</strong><br><br>Complete a few morning reviews and this section will summarize your real pattern.</div>`;
    const gapClass = stats.avgGap >= 0 ? 'gap-positive' : 'gap-negative';
    const gapText = `${stats.avgGap >= 0 ? '+' : ''}${stats.avgGap}`;
    const direction = stats.avgGap > 3 ? 'your outcomes have been better than the generic estimate' : stats.avgGap < -3 ? 'your outcomes have been lower than the generic estimate' : 'the generic estimate has been fairly close to your own ratings';
    return `
      <div class="practical-card">
        <div class="section-label-row split"><div><h3>Last ${stats.reviews.length} reviewed night${stats.reviews.length===1?'':'s'}</h3><p>Your summary uses only nights you actually reviewed.</p></div><button class="practical-secondary" id="export-sleep" type="button">Export CSV</button></div>
        <div class="weekly-grid">
          <div class="weekly-metric"><span>Actual sleep quality</span><strong>${stats.avgActual}</strong></div>
          <div class="weekly-metric"><span>Predicted</span><strong>${stats.avgPredicted}</strong></div>
          <div class="weekly-metric"><span>Average gap</span><strong class="${gapClass}">${gapText}</strong></div>
          <div class="weekly-metric"><span>Actual sleep</span><strong>${stats.avgSleep.toFixed(1)}h</strong></div>
          <div class="weekly-metric"><span>Morning energy</span><strong>${stats.avgEnergy.toFixed(1)}/5</strong></div>
        </div>
        <div class="weekly-summary"><b>What this means:</b> ${direction}. ${cal.ready ? `The current personal adjustment is <b>${cal.adjustment >= 0 ? '+' : ''}${cal.adjustment} points</b>, with an average absolute error of <b>${cal.mae} points</b>.` : `You need <b>${Math.max(0,3-cal.count)} more reviewed night${3-cal.count===1?'':'s'}</b> before calibration is shown.`} Your biggest recent prediction miss was ${pFormatDate(stats.biggestMiss.date)} (${stats.biggestMiss.predictedScore} predicted vs ${stats.biggestMiss.actualScore} actual).</div>
        <div class="data-note">Self-reported sleep quality and energy are subjective tracking signals. This summary is for reflection and experimentation, not diagnosis.</div>
      </div>`;
  }

  function renderPractical() {
    const root = document.querySelector('#daily-loop');
    if (!root) return;
    const plan = root.querySelector('#daily-plan-view');
    const review = root.querySelector('#daily-review-view');
    const weekly = root.querySelector('#daily-weekly-view');
    if (plan) plan.innerHTML = renderPlanView();
    if (review) review.innerHTML = renderReviewView();
    if (weekly) weekly.innerHTML = renderWeeklyView();
    bindPracticalEvents();
  }

  function activateView(view) {
    document.querySelectorAll('#daily-loop [data-daily-tab]').forEach((button) => button.classList.toggle('active', button.dataset.dailyTab === view));
    ['plan','review','weekly'].forEach((name) => {
      const el = document.querySelector(`#daily-${name}-view`);
      if (el) el.hidden = name !== view;
    });
  }

  function bindPracticalEvents() {
    const bedtime = document.querySelector('#plan-bedtime');
    const wake = document.querySelector('#plan-wake');
    const updateWindow = () => {
      const hours = timeWindowHours(bedtime?.value, wake?.value);
      const output = document.querySelector('#planned-window');
      if (output) output.textContent = formatHours(hours);
    };
    bedtime?.addEventListener('input', updateWindow);
    wake?.addEventListener('input', updateWindow);
    document.querySelector('#save-plan')?.addEventListener('click', savePlan);
    document.querySelector('#use-window')?.addEventListener('click', () => {
      const hours = timeWindowHours(bedtime?.value, wake?.value);
      if (!hours || typeof scenario === 'undefined') return;
      scenario.duration = Math.round(pClamp(hours, 4.5, 10) * 4) / 4;
      if (typeof saveScenario === 'function') saveScenario();
      if (typeof renderAll === 'function') renderAll();
      if (typeof showToast === 'function') showToast(`Time in bed updated to ${formatHours(scenario.duration)}.`);
      renderPractical();
    });
    const reviewForm = document.querySelector('#morning-review-form');
    reviewForm?.addEventListener('submit', saveReview);
    const scoreInput = document.querySelector('#actual-score');
    scoreInput?.addEventListener('input', () => {
      const plan = latestPlanForReview();
      if (!plan) return;
      const value = Number(scoreInput.value);
      const gap = value - plan.predictedScore;
      const readout = document.querySelector('#actual-score-readout');
      const display = document.querySelector('#actual-score-display');
      const gapDisplay = document.querySelector('#gap-display');
      if (readout) readout.textContent = value;
      if (display) display.textContent = value;
      if (gapDisplay) {
        gapDisplay.textContent = `${gap >= 0 ? '+' : ''}${gap}`;
        gapDisplay.classList.toggle('gap-positive', gap >= 0);
        gapDisplay.classList.toggle('gap-negative', gap < 0);
      }
    });
    document.querySelector('#export-sleep')?.addEventListener('click', exportCSV);
  }

  function injectDailyLoop() {
    if (document.querySelector('#daily-loop')) return;
    const estimatePanel = document.querySelector('.estimate-panel');
    if (!estimatePanel) return;
    estimatePanel.insertAdjacentHTML('afterend', `
      <section id="daily-loop" class="daily-loop-panel panel">
        <div class="daily-loop-head">
          <div><span class="panel-title">YOUR DAILY LOOP</span><h2>Plan tonight. Learn tomorrow.</h2><p>Turn the estimate into a concrete sleep plan, compare it with what actually happened, and build a personal pattern.</p></div>
          <div class="daily-tabs" role="tablist"><button class="active" data-daily-tab="plan" type="button">Tonight</button><button data-daily-tab="review" type="button">Morning review</button><button data-daily-tab="weekly" type="button">Weekly</button></div>
        </div>
        <div id="daily-plan-view" class="daily-view"></div>
        <div id="daily-review-view" class="daily-view" hidden></div>
        <div id="daily-weekly-view" class="daily-view" hidden></div>
      </section>`);
    document.querySelector('#daily-loop .daily-tabs')?.addEventListener('click', (event) => {
      const button = event.target.closest('[data-daily-tab]');
      if (!button) return;
      activateView(button.dataset.dailyTab);
    });
    renderPractical();
  }

  function listenForEstimateChanges() {
    ['duration','heart-rate','steps','workout','late-eating','recalculate','reset-scenario'].forEach((id) => {
      document.getElementById(id)?.addEventListener('change', () => setTimeout(renderPractical, 0));
      document.getElementById(id)?.addEventListener('click', () => setTimeout(renderPractical, 0));
      document.getElementById(id)?.addEventListener('input', () => setTimeout(renderPractical, 0));
    });
    document.querySelectorAll('.control-segment').forEach((segment) => segment.addEventListener('click', () => setTimeout(renderPractical, 0)));
    document.querySelector('.recommendation-grid')?.addEventListener('click', () => setTimeout(renderPractical, 0));
  }

  function extendReset() {
    document.querySelector('#reset-data')?.addEventListener('click', () => {
      Object.values(P_STORAGE).forEach((key) => localStorage.removeItem(key));
      setTimeout(() => {
        migrateFakeHistory();
        renderPractical();
      }, 0);
    });
  }

  addStyles();
  migrateFakeHistory();
  if (typeof renderHistory === 'function') renderHistory();
  injectDailyLoop();
  listenForEstimateChanges();
  extendReset();
})();
(() => {
  const PREFIX = 'sleep-intelligence:';
  const EXPERIENCE = {
    current: `${PREFIX}persona:current:v1`,
    list: `${PREFIX}persona:list:v1`,
    dataPrefix: `${PREFIX}persona-data:`,
    theme: `${PREFIX}experience:theme:v1`,
    brightness: `${PREFIX}experience:brightness:v1`,
    mood: `${PREFIX}experience:mood:v1`,
    motion: `${PREFIX}experience:motion:v1`
  };

  const DEFAULT_PERSONAS = ['Sanaya', 'Trinity', 'Neo', 'Eo', 'Morpheus', 'The Oracle'];
  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => Array.from(root.querySelectorAll(selector));

  function safeParse(value, fallback) {
    try { return JSON.parse(value) ?? fallback; } catch { return fallback; }
  }

  function slugify(value) {
    return String(value).trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'profile';
  }

  function getPersonaList() {
    const stored = safeParse(localStorage.getItem(EXPERIENCE.list), []);
    const merged = [...DEFAULT_PERSONAS, ...(Array.isArray(stored) ? stored : [])];
    return [...new Set(merged.map((name) => String(name).trim()).filter(Boolean))];
  }

  function savePersonaList(list) {
    localStorage.setItem(EXPERIENCE.list, JSON.stringify([...new Set(list)]));
  }

  function activePersona() {
    return localStorage.getItem(EXPERIENCE.current) || 'Sanaya';
  }

  function isExperienceKey(key) {
    return key === EXPERIENCE.current || key === EXPERIENCE.list || key.startsWith(EXPERIENCE.dataPrefix) || key.startsWith(`${PREFIX}experience:`);
  }

  function appDataKeys() {
    return Object.keys(localStorage).filter((key) => key.startsWith(PREFIX) && !isExperienceKey(key));
  }

  function snapshotPersona(name) {
    if (!name) return;
    const snapshot = {};
    appDataKeys().forEach((key) => { snapshot[key] = localStorage.getItem(key); });
    localStorage.setItem(`${EXPERIENCE.dataPrefix}${slugify(name)}:v1`, JSON.stringify(snapshot));
  }

  function restorePersona(name) {
    appDataKeys().forEach((key) => localStorage.removeItem(key));
    const snapshot = safeParse(localStorage.getItem(`${EXPERIENCE.dataPrefix}${slugify(name)}:v1`), {});
    Object.entries(snapshot).forEach(([key, value]) => {
      if (key.startsWith(PREFIX) && !isExperienceKey(key) && value !== null) localStorage.setItem(key, value);
    });
  }

  function switchPersona(name) {
    const next = String(name || '').trim();
    if (!next || next === activePersona()) return;
    const current = activePersona();
    snapshotPersona(current);
    const list = getPersonaList();
    if (!list.includes(next)) {
      list.push(next);
      savePersonaList(list);
    }
    localStorage.setItem(EXPERIENCE.current, next);
    restorePersona(next);
    location.reload();
  }

  function greeting() {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  }

  function injectStyles() {
    const style = document.createElement('style');
    style.id = 'experience-styles';
    style.textContent = `
      :root{--experience-accent:#6f7cff;--experience-accent-2:#9d5cff;--experience-speed:18s}
      body[data-mood="calm"]{--experience-accent:#668cff;--experience-accent-2:#9f65ff;--experience-speed:22s}
      body[data-mood="focus"]{--experience-accent:#43a8ff;--experience-accent-2:#5ce1a7;--experience-speed:15s}
      body[data-mood="deep-rest"]{--experience-accent:#725cff;--experience-accent-2:#b36aff;--experience-speed:34s}
      body[data-mood="energize"]{--experience-accent:#42d7c5;--experience-accent-2:#7b73ff;--experience-speed:11s}
      .experience-hero{grid-column:1/-1!important;min-height:210px!important;padding:24px 28px!important;display:grid!important;grid-template-columns:minmax(0,1.15fr) minmax(360px,.85fr)!important;gap:28px!important;align-items:center!important;isolation:isolate}
      .experience-hero::after{display:none!important}
      .experience-copy{position:relative;z-index:4;max-width:760px}.experience-copy .eyebrow{display:block;margin-bottom:10px}.experience-copy h1{font-size:clamp(31px,3.2vw,52px)!important;margin:0 0 8px!important;line-height:1.02!important}.experience-copy h1 .persona-name{background:linear-gradient(90deg,#74a8ff,var(--experience-accent-2));-webkit-background-clip:text;background-clip:text;color:transparent}.experience-copy .lead{font-size:15px!important;margin:0 0 13px!important;max-width:700px!important;color:var(--muted)}
      .start-cue{display:flex;align-items:center;gap:10px;flex-wrap:wrap}.start-cue button{border:1px solid rgba(111,124,255,.35);background:rgba(111,124,255,.12);color:var(--text);padding:10px 14px;border-radius:999px;cursor:pointer;font-weight:650}.start-cue span{font-size:11px;color:var(--muted)}
      .hero-field{position:relative;min-height:165px;display:grid;place-items:center;overflow:hidden}.sacred-field{position:absolute;inset:-25%;opacity:.52;animation:fieldRotate var(--experience-speed) linear infinite}.sacred-field svg{width:100%;height:100%;overflow:visible}.sacred-ring{fill:none;stroke:color-mix(in srgb,var(--experience-accent) 58%,transparent);stroke-width:1}.sacred-ring.soft{stroke:color-mix(in srgb,var(--experience-accent-2) 34%,transparent)}.sacred-polygon{fill:none;stroke:color-mix(in srgb,var(--experience-accent-2) 46%,transparent);stroke-width:.8}
      .pulse-line{position:absolute;left:0;right:0;top:50%;height:58px;transform:translateY(-50%);opacity:.72}.pulse-line path{fill:none;stroke:url(#pulseGradient);stroke-width:2;stroke-linecap:round;stroke-dasharray:8 7;animation:pulseDash 2.8s linear infinite}
      .living-clock{position:relative;width:126px;height:126px;border-radius:50%;border:1px solid rgba(127,158,255,.5);background:radial-gradient(circle,rgba(18,30,54,.92),rgba(5,10,20,.7) 67%,transparent 69%);box-shadow:0 0 0 8px rgba(84,106,255,.035),0 0 42px color-mix(in srgb,var(--experience-accent) 30%,transparent);z-index:3}.living-clock::before,.living-clock::after{content:"";position:absolute;left:50%;bottom:50%;transform-origin:50% 100%;border-radius:10px;background:linear-gradient(180deg,#fff,var(--experience-accent))}.living-clock::before{width:2px;height:38px;animation:clockMinute 10s linear infinite}.living-clock::after{width:3px;height:27px;animation:clockHour 42s linear infinite}.clock-core{position:absolute;inset:50% auto auto 50%;width:9px;height:9px;transform:translate(-50%,-50%);border-radius:50%;background:#fff;box-shadow:0 0 16px var(--experience-accent)}.clock-ticks{position:absolute;inset:8px;border:1px dashed rgba(255,255,255,.17);border-radius:50%;animation:fieldRotate 28s linear infinite reverse}
      .experience-controls{position:absolute;right:0;bottom:0;display:flex;gap:8px;align-items:center;z-index:5;flex-wrap:wrap;justify-content:flex-end}.experience-control{display:flex;align-items:center;gap:7px;padding:7px 9px;border:1px solid var(--line);border-radius:11px;background:rgba(8,14,27,.72);backdrop-filter:blur(12px)}body.light .experience-control{background:rgba(255,255,255,.72)}.experience-control label{font-size:9px;text-transform:uppercase;letter-spacing:.08em;color:var(--muted)}.experience-control button{border:0;background:transparent;color:var(--muted);padding:5px 7px;border-radius:7px;cursor:pointer;font-size:10px}.experience-control button.active{background:color-mix(in srgb,var(--experience-accent) 20%,transparent);color:var(--text)}.experience-control input[type="range"]{width:84px;accent-color:var(--experience-accent)}
      .workflow-guide{grid-column:1/-1;display:grid;grid-template-columns:repeat(5,1fr);gap:1px;padding:0!important;overflow:hidden}.workflow-step{position:relative;padding:14px 15px;min-height:78px;background:rgba(255,255,255,.018);display:grid;grid-template-columns:30px 1fr;gap:10px;align-items:start}.workflow-step:not(:last-child)::after{content:"→";position:absolute;right:-6px;top:28px;color:var(--muted);z-index:3}.workflow-num{width:30px;height:30px;border-radius:50%;display:grid;place-items:center;background:color-mix(in srgb,var(--experience-accent) 15%,transparent);border:1px solid color-mix(in srgb,var(--experience-accent) 35%,transparent);color:#b9c9ff;font:600 11px DM Mono,monospace}.workflow-step b{display:block;font-size:12px;margin-bottom:3px}.workflow-step span{font-size:10px;line-height:1.42;color:var(--muted)}
      .persona-wrap{position:relative}.persona-button{display:flex;align-items:center;gap:8px;border:1px solid var(--line);background:var(--panel);border-radius:999px;padding:8px 11px;cursor:pointer;font-size:12px}.persona-dot{width:21px;height:21px;border-radius:50%;display:grid;place-items:center;background:linear-gradient(135deg,var(--experience-accent),var(--experience-accent-2));color:#fff;font-size:9px;font-weight:800}.persona-menu{position:absolute;right:0;top:44px;width:250px;padding:10px;border:1px solid var(--line-strong);border-radius:15px;background:rgba(8,15,29,.98);box-shadow:var(--shadow);z-index:80;display:none}.light .persona-menu{background:rgba(247,250,255,.98)}.persona-menu.open{display:block}.persona-menu small{display:block;padding:4px 6px 8px;color:var(--muted)}.persona-option{width:100%;display:flex;align-items:center;gap:9px;border:0;background:transparent;color:var(--text);padding:8px;border-radius:9px;cursor:pointer;text-align:left}.persona-option:hover,.persona-option.active{background:rgba(111,124,255,.12)}.persona-option .persona-dot{flex:0 0 auto}.persona-add{border-top:1px solid var(--line);margin-top:7px;padding:10px 5px 3px;display:grid;grid-template-columns:1fr auto;gap:7px}.persona-add input{min-width:0;border:1px solid var(--line);background:rgba(255,255,255,.035);color:var(--text);padding:8px 9px;border-radius:8px}.persona-add button{border:0;border-radius:8px;background:rgba(111,124,255,.18);color:var(--text);padding:8px 10px;cursor:pointer}
      .dashboard-shell>.hero-panel{order:0}.dashboard-shell>.workflow-guide{order:1}.dashboard-shell>.estimate-panel{order:2;grid-column:1/2}.dashboard-shell>.drivers-panel{order:2;grid-column:2/-1}.dashboard-shell>.daily-loop-panel{order:3;grid-column:1/-1}.dashboard-shell>.change-panel,.dashboard-shell>.test-panel{order:4}.dashboard-shell>.pattern-panel{order:5}.dashboard-shell>.builder-panel{order:6}.dashboard-shell>.about-strip{order:7}
      body.motion-paused .sacred-field,body.motion-paused .pulse-line path,body.motion-paused .living-clock::before,body.motion-paused .living-clock::after,body.motion-paused .clock-ticks{animation-play-state:paused!important}
      .brightness-overlay{position:fixed;inset:0;pointer-events:none;z-index:9999;opacity:0;transition:opacity .2s ease;background:#000}
      @keyframes fieldRotate{to{transform:rotate(360deg)}}@keyframes pulseDash{to{stroke-dashoffset:-90}}@keyframes clockMinute{to{transform:rotate(360deg)}}@keyframes clockHour{to{transform:rotate(360deg)}}
      @media(prefers-reduced-motion:reduce){.sacred-field,.pulse-line path,.living-clock::before,.living-clock::after,.clock-ticks{animation:none!important}}
      @media(max-width:980px){.experience-hero{grid-template-columns:1fr!important}.hero-field{min-height:145px}.experience-controls{position:relative;margin-top:110px;justify-content:flex-start}.workflow-guide{grid-template-columns:repeat(5,minmax(150px,1fr));overflow-x:auto}.dashboard-shell>.estimate-panel,.dashboard-shell>.drivers-panel{grid-column:1/-1}}
      @media(max-width:620px){.experience-hero{padding:20px!important}.experience-copy h1{font-size:32px!important}.hero-field{min-height:125px}.living-clock{width:105px;height:105px}.experience-controls{margin-top:94px;gap:6px}.experience-control{padding:6px}.workflow-guide{margin-bottom:2px}.top-actions .ghost-button{display:none}.persona-button .persona-current{max-width:72px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}}
    `;
    document.head.appendChild(style);
  }

  function sacredMarkup() {
    return `
      <div class="hero-field" aria-hidden="true">
        <div class="sacred-field">
          <svg viewBox="0 0 500 300">
            <circle class="sacred-ring" cx="250" cy="150" r="112"/><circle class="sacred-ring soft" cx="250" cy="150" r="82"/><circle class="sacred-ring soft" cx="250" cy="70" r="42"/><circle class="sacred-ring soft" cx="319" cy="110" r="42"/><circle class="sacred-ring soft" cx="319" cy="190" r="42"/><circle class="sacred-ring soft" cx="250" cy="230" r="42"/><circle class="sacred-ring soft" cx="181" cy="190" r="42"/><circle class="sacred-ring soft" cx="181" cy="110" r="42"/><polygon class="sacred-polygon" points="250,36 349,93 349,207 250,264 151,207 151,93"/><polygon class="sacred-polygon" points="250,58 328,195 172,195"/>
          </svg>
        </div>
        <svg class="pulse-line" viewBox="0 0 600 80" preserveAspectRatio="none"><defs><linearGradient id="pulseGradient"><stop offset="0" stop-color="#58d8be"/><stop offset=".5" stop-color="#6f7cff"/><stop offset="1" stop-color="#b563ff"/></linearGradient></defs><path d="M0 42 L85 42 L110 39 L126 43 L144 40 L160 42 L181 42 L195 22 L206 63 L219 10 L234 54 L246 42 L270 42 L292 39 L315 43 L342 42 L368 42 L383 30 L397 51 L411 35 L428 44 L446 42 L600 42"/></svg>
        <div class="living-clock"><div class="clock-ticks"></div><span class="clock-core"></span></div>
        <div class="experience-controls" aria-label="Experience controls">
          <div class="experience-control"><label>Mode</label><button type="button" data-mode="dark">Night</button><button type="button" data-mode="light">Day</button></div>
          <div class="experience-control"><label>Brightness</label><input id="experience-brightness" type="range" min="55" max="125" value="100" aria-label="Brightness"></div>
          <div class="experience-control"><label>Mood</label><button type="button" data-mood="calm">Calm</button><button type="button" data-mood="focus">Focus</button><button type="button" data-mood="deep-rest">Deep Rest</button><button type="button" data-mood="energize">Energize</button></div>
          <div class="experience-control"><label>Motion</label><button type="button" id="motion-toggle">On</button></div>
        </div>
      </div>`;
  }

  function rebuildHero() {
    const hero = $('.hero-panel');
    if (!hero) return;
    const name = activePersona();
    hero.classList.add('experience-hero');
    hero.innerHTML = `
      <div class="experience-copy">
        <span class="eyebrow">SLEEP INTELLIGENCE · PERSONAL SLEEP LAB</span>
        <h1>${greeting()}, <span class="persona-name">${escapeHTML(name)}</span>.</h1>
        <p class="lead">Plan tonight. Review tomorrow. Learn the conditions under which you sleep best.</p>
        <div class="start-cue"><button type="button" id="experience-start">Start with tonight’s estimate →</button><span>Your data stays separate for each profile on this browser.</span></div>
      </div>
      ${sacredMarkup()}`;
    $('#experience-start')?.addEventListener('click', () => $('.estimate-panel')?.scrollIntoView({ behavior: 'smooth', block: 'start' }));
  }

  function escapeHTML(value) {
    const div = document.createElement('div');
    div.textContent = String(value);
    return div.innerHTML;
  }

  function injectWorkflow() {
    if ($('.workflow-guide')) return;
    const hero = $('.hero-panel');
    if (!hero) return;
    hero.insertAdjacentHTML('afterend', `
      <section class="workflow-guide panel" aria-label="How Sleep Intelligence works">
        <div class="workflow-step"><span class="workflow-num">1</span><div><b>Tonight’s estimate</b><span>See your current sleep readiness and biggest drivers.</span></div></div>
        <div class="workflow-step"><span class="workflow-num">2</span><div><b>Plan tonight</b><span>Set a real sleep window and choose what to change.</span></div></div>
        <div class="workflow-step"><span class="workflow-num">3</span><div><b>Morning review</b><span>Record what actually happened and how you feel.</span></div></div>
        <div class="workflow-step"><span class="workflow-num">4</span><div><b>Test one thing</b><span>Run small experiments instead of changing everything.</span></div></div>
        <div class="workflow-step"><span class="workflow-num">5</span><div><b>Pattern over time</b><span>Compare predictions with outcomes and learn your pattern.</span></div></div>
      </section>`);
  }

  function personaInitial(name) {
    return String(name).trim().charAt(0).toUpperCase() || '•';
  }

  function renderPersonaMenu() {
    const menu = $('.persona-menu');
    if (!menu) return;
    const current = activePersona();
    const list = getPersonaList();
    const options = list.map((name) => `<button class="persona-option ${name === current ? 'active' : ''}" type="button" data-persona="${escapeHTML(name)}"><span class="persona-dot">${escapeHTML(personaInitial(name))}</span><span>${escapeHTML(name)}</span></button>`).join('');
    menu.innerHTML = `<small>Profiles keep separate local sleep data.</small>${options}<div class="persona-add"><input id="persona-name-input" type="text" maxlength="32" placeholder="Enter a name" aria-label="New profile name"><button id="persona-add-button" type="button">Add</button></div>`;
    $$('.persona-option', menu).forEach((button) => button.addEventListener('click', () => switchPersona(button.dataset.persona)));
    const add = () => {
      const input = $('#persona-name-input', menu);
      const name = input?.value.trim();
      if (!name) return;
      switchPersona(name);
    };
    $('#persona-add-button', menu)?.addEventListener('click', add);
    $('#persona-name-input', menu)?.addEventListener('keydown', (event) => { if (event.key === 'Enter') { event.preventDefault(); add(); } });
  }

  function injectPersonaControl() {
    const actions = $('.top-actions');
    if (!actions || $('.persona-wrap')) return;
    const name = activePersona();
    actions.insertAdjacentHTML('afterbegin', `<div class="persona-wrap"><button class="persona-button" id="persona-button" type="button" aria-haspopup="true" aria-expanded="false"><span class="persona-dot">${escapeHTML(personaInitial(name))}</span><span class="persona-current">${escapeHTML(name)}</span><span>⌄</span></button><div class="persona-menu" id="persona-menu"></div></div>`);
    renderPersonaMenu();
    const button = $('#persona-button');
    const menu = $('#persona-menu');
    button?.addEventListener('click', (event) => {
      event.stopPropagation();
      const open = !menu.classList.contains('open');
      menu.classList.toggle('open', open);
      button.setAttribute('aria-expanded', String(open));
    });
    document.addEventListener('click', (event) => {
      if (!event.target.closest('.persona-wrap')) {
        menu?.classList.remove('open');
        button?.setAttribute('aria-expanded', 'false');
      }
    });
  }

  function ensureBrightnessOverlay() {
    if ($('.brightness-overlay')) return;
    document.body.insertAdjacentHTML('beforeend', '<div class="brightness-overlay" aria-hidden="true"></div>');
  }

  function applyBrightness(value) {
    const numeric = Math.max(55, Math.min(125, Number(value) || 100));
    const overlay = $('.brightness-overlay');
    if (!overlay) return;
    if (numeric < 100) {
      overlay.style.background = '#000';
      overlay.style.opacity = String((100 - numeric) / 120);
    } else {
      overlay.style.background = '#fff';
      overlay.style.mixBlendMode = 'soft-light';
      overlay.style.opacity = String((numeric - 100) / 180);
    }
    localStorage.setItem(EXPERIENCE.brightness, String(numeric));
    const slider = $('#experience-brightness');
    if (slider && Number(slider.value) !== numeric) slider.value = numeric;
  }

  function applyTheme(theme) {
    const next = theme === 'light' ? 'light' : 'dark';
    if (typeof setTheme === 'function') setTheme(next);
    else document.body.classList.toggle('light', next === 'light');
    localStorage.setItem(EXPERIENCE.theme, next);
    $$('[data-mode]').forEach((button) => button.classList.toggle('active', button.dataset.mode === next));
  }

  function applyMood(mood) {
    const allowed = ['calm', 'focus', 'deep-rest', 'energize'];
    const next = allowed.includes(mood) ? mood : 'calm';
    document.body.dataset.mood = next;
    localStorage.setItem(EXPERIENCE.mood, next);
    $$('[data-mood]').forEach((button) => button.classList.toggle('active', button.dataset.mood === next));
  }

  function applyMotion(enabled) {
    const on = enabled !== false;
    document.body.classList.toggle('motion-paused', !on);
    localStorage.setItem(EXPERIENCE.motion, on ? 'on' : 'off');
    const button = $('#motion-toggle');
    if (button) { button.textContent = on ? 'On' : 'Paused'; button.classList.toggle('active', on); }
  }

  function bindExperienceControls() {
    $$('[data-mode]').forEach((button) => button.addEventListener('click', () => applyTheme(button.dataset.mode)));
    $$('[data-mood]').forEach((button) => button.addEventListener('click', () => applyMood(button.dataset.mood)));
    $('#experience-brightness')?.addEventListener('input', (event) => applyBrightness(event.target.value));
    $('#motion-toggle')?.addEventListener('click', () => applyMotion(document.body.classList.contains('motion-paused')));
  }

  function makeResetPersonaAware() {
    $('#reset-data')?.addEventListener('click', () => {
      setTimeout(() => snapshotPersona(activePersona()), 30);
    });
    window.addEventListener('beforeunload', () => snapshotPersona(activePersona()));
  }

  function init() {
    if (!localStorage.getItem(EXPERIENCE.current)) localStorage.setItem(EXPERIENCE.current, 'Sanaya');
    savePersonaList(getPersonaList());
    injectStyles();
    ensureBrightnessOverlay();
    rebuildHero();
    injectWorkflow();
    injectPersonaControl();
    bindExperienceControls();
    makeResetPersonaAware();

    const theme = localStorage.getItem(EXPERIENCE.theme) || (document.body.classList.contains('light') ? 'light' : 'dark');
    const brightness = Number(localStorage.getItem(EXPERIENCE.brightness) || 100);
    const mood = localStorage.getItem(EXPERIENCE.mood) || 'calm';
    const motion = localStorage.getItem(EXPERIENCE.motion) !== 'off';
    applyTheme(theme);
    applyBrightness(brightness);
    applyMood(mood);
    applyMotion(motion);
  }

  init();
})();
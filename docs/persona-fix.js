(() => {
  const protectProfiles = () => {
    document.querySelectorAll('.persona-option').forEach((button) => {
      const name = String(button.dataset.persona || '').trim();
      if (name === 'Eo') {
        button.remove();
        return;
      }
      if (name === 'Neo') {
        button.classList.remove('persona-option');
        button.classList.add('persona-option-safe');
      }
    });
  };

  const syncDurationRange = () => {
    const duration = document.querySelector('#duration');
    if (!duration) return;
    duration.min = '3';
    duration.max = '12';
    const labels = duration.closest('.control-card')?.querySelectorAll('.range-labels span');
    if (labels?.[0]) labels[0].textContent = '3h';
    if (labels?.[1]) labels[1].textContent = '12h';
  };

  const style = document.createElement('style');
  style.textContent = `
    .persona-option-safe{width:100%;display:flex;align-items:center;gap:9px;border:0;background:transparent;color:var(--text);padding:8px;border-radius:9px;cursor:pointer;text-align:left}
    .persona-option-safe:hover,.persona-option-safe.active{background:rgba(111,124,255,.12)}
    .persona-option-safe .persona-dot{flex:0 0 auto}
  `;
  document.head.appendChild(style);

  protectProfiles();
  syncDurationRange();
  document.addEventListener('DOMContentLoaded', () => {
    protectProfiles();
    syncDurationRange();
  }, { once: true });
})();

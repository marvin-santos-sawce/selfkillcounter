(function () {
  const KEY_RESET = 'accident-counter:reset-epoch';
  const KEY_RECORD = 'accident-counter:record-ms';
  const KEY_RESET_COUNT = 'accident-counter:reset-count';
  const TZ = 'America/Sao_Paulo';

  const elDays = document.getElementById('val-days');
  const elHours = document.getElementById('val-hours');
  const elMinutes = document.getElementById('val-minutes');
  const elSeconds = document.getElementById('val-seconds');
  const elSince = document.getElementById('reset-since');
  const elRecord = document.getElementById('record-value');
  const elResetCount = document.getElementById('reset-count');
  const btn = document.getElementById('reset-btn');
  const btnLabel = document.getElementById('reset-label');
  const hint = document.getElementById('reset-hint');

  let resetEpoch = null;
  let recordMs = 0;
  let resetCount = 0;
  let confirming = false;
  let confirmTimeout = null;

  function pad(n) {
    return String(n).padStart(2, '0');
  }

  function formatBrasiliaDate(epochMs) {
    return new Date(epochMs).toLocaleString('pt-BR', {
      timeZone: TZ,
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  function formatDays(ms) {
    const d = Math.floor(ms / 86400000);
    return d + (d === 1 ? ' dia' : ' dias');
  }

  function loadState() {
    resetEpoch = parseInt(localStorage.getItem(KEY_RESET), 10);
    if (!resetEpoch || Number.isNaN(resetEpoch)) {
      resetEpoch = Date.now();
      localStorage.setItem(KEY_RESET, String(resetEpoch));
    }

    recordMs = parseInt(localStorage.getItem(KEY_RECORD), 10);
    if (Number.isNaN(recordMs)) recordMs = 0;

    resetCount = parseInt(localStorage.getItem(KEY_RESET_COUNT), 10);
    if (Number.isNaN(resetCount)) resetCount = 0;

    elSince.textContent = formatBrasiliaDate(resetEpoch);
    elResetCount.textContent = resetCount;
    tick();
  }

  function tick() {
    const now = Date.now();
    const diff = Math.max(0, now - resetEpoch);

    const days = Math.floor(diff / 86400000);
    const hours = Math.floor((diff % 86400000) / 3600000);
    const minutes = Math.floor((diff % 3600000) / 60000);
    const seconds = Math.floor((diff % 60000) / 1000);

    elDays.textContent = days;
    elHours.textContent = pad(hours);
    elMinutes.textContent = pad(minutes);
    elSeconds.textContent = pad(seconds);

    const currentRecord = Math.max(recordMs, diff);
    elRecord.textContent = formatDays(currentRecord);
  }

  function persistRecordIfNeeded() {
    const diff = Date.now() - resetEpoch;
    if (diff > recordMs) {
      recordMs = diff;
      localStorage.setItem(KEY_RECORD, String(recordMs));
    }
  }

  function resetConfirmUI() {
    confirming = false;
    btn.classList.remove('confirm');
    btnLabel.textContent = 'Reiniciar contagem';
    hint.textContent = 'Toque para confirmar';
  }

  btn.addEventListener('click', function () {
    if (!confirming) {
      confirming = true;
      btn.classList.add('confirm');
      btnLabel.textContent = 'Confirmar reinício';
      hint.textContent = 'Toque de novo — isso não pode ser desfeito';
      clearTimeout(confirmTimeout);
      confirmTimeout = setTimeout(resetConfirmUI, 4000);
      return;
    }

    clearTimeout(confirmTimeout);
    persistRecordIfNeeded();

    resetEpoch = Date.now();
    localStorage.setItem(KEY_RESET, String(resetEpoch));

    resetCount += 1;
    localStorage.setItem(KEY_RESET_COUNT, String(resetCount));
    elResetCount.textContent = resetCount;

    elSince.textContent = formatBrasiliaDate(resetEpoch);
    resetConfirmUI();
    tick();
  });

  loadState();
  setInterval(function () {
    tick();
    persistRecordIfNeeded();
  }, 1000);
})();

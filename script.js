import { firebaseConfig } from './firebase-config.js';

import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.13.0/firebase-app.js';
import {
  getDatabase,
  ref,
  onValue,
  get,
  set,
  update,
  push,
  serverTimestamp,
} from 'https://www.gstatic.com/firebasejs/10.13.0/firebase-database.js';

const TZ = 'America/Sao_Paulo';

// ---------------------------------------------------------------
// Firebase: um único documento compartilhado por todos os visitantes
// ---------------------------------------------------------------
const app = initializeApp(firebaseConfig);
const db = getDatabase(app);
const counterRef = ref(db, 'accidentCounter');
const historyRef = ref(db, 'accidentCounter/history');
const chatMessagesRef = ref(db, 'chatMessages');

// ---------------------------------------------------------------
// Compensar diferença de relógio local vs servidor Firebase (clock skew)
// ---------------------------------------------------------------
let serverTimeOffset = 0;
const offsetRef = ref(db, '.info/serverTimeOffset');
onValue(offsetRef, (snapshot) => {
  serverTimeOffset = snapshot.val() || 0;
});

// ---------------------------------------------------------------
// Elementos da página
// ---------------------------------------------------------------
const elDays = document.getElementById('val-days');
const elHours = document.getElementById('val-hours');
const elMinutes = document.getElementById('val-minutes');
const elSeconds = document.getElementById('val-seconds');
const elSince = document.getElementById('reset-since');
const elRecord = document.getElementById('record-value');
const elResetCount = document.getElementById('reset-count');
const elSyncDot = document.getElementById('sync-dot');
const elSyncLabel = document.getElementById('sync-label');
const btn = document.getElementById('reset-btn');
const btnLabel = document.getElementById('reset-label');
const hint = document.getElementById('reset-hint');
const historyToggle = document.getElementById('history-toggle');
const historyList = document.getElementById('history-list');
const chatNameInput = document.getElementById('chat-name');
const chatMessagesContainer = document.getElementById('chat-messages');
const chatForm = document.getElementById('chat-form');
const chatInput = document.getElementById('chat-input');

// ---------------------------------------------------------------
// Estado local (espelha o que está no Firebase)
// ---------------------------------------------------------------
let resetEpoch = null;
let recordMs = 0;
let resetCount = 0;
let confirming = false;
let confirmTimeout = null;
let resetting = false;

function pad(n) {
  return String(n).padStart(2, '0');
}

function formatBrasiliaExact(epochMs) {
  return new Date(epochMs).toLocaleString('pt-BR', {
    timeZone: TZ,
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

function formatDays(ms) {
  const d = Math.floor(ms / 86400000);
  if (d > 0) return d + (d === 1 ? ' dia' : ' dias');
  
  const h = Math.floor((ms % 86400000) / 3600000);
  if (h > 0) return h + (h === 1 ? ' hora' : ' horas');
  
  const m = Math.floor((ms % 3600000) / 60000);
  return m + (m === 1 ? ' min' : ' mins');
}

function tick() {
  if (!resetEpoch) return;
  const now = Date.now() + serverTimeOffset;
  const diff = Math.max(0, now - resetEpoch);

  const days = Math.floor(diff / 86400000);
  const hours = Math.floor((diff % 86400000) / 3600000);
  const minutes = Math.floor((diff % 3600000) / 60000);
  const seconds = Math.floor((diff % 60000) / 1000);

  elDays.textContent = days;
  elHours.textContent = pad(hours);
  elMinutes.textContent = pad(minutes);
  elSeconds.textContent = pad(seconds);

  elRecord.textContent = formatDays(Math.max(recordMs, diff));
}

function setSyncState(ok) {
  elSyncDot.classList.toggle('sync-dot--ok', ok);
  elSyncLabel.textContent = ok ? 'CENTRALIDADE' : 'Sincronizando…';
}

function resetConfirmUI() {
  confirming = false;
  btn.classList.remove('confirm');
  btnLabel.textContent = 'Reiniciar contagem';
  hint.textContent = 'Toque para confirmar';
}

function renderHistory(historyObj) {
  const entries = Object.values(historyObj || {})
    .filter((e) => e && e.epoch)
    .sort((a, b) => b.epoch - a.epoch)
    .slice(0, 20);

  historyList.innerHTML = '';
  if (entries.length === 0) {
    const li = document.createElement('li');
    li.textContent = 'Nenhum reinício registrado ainda.';
    li.className = 'history-empty';
    historyList.appendChild(li);
    return;
  }

  entries.forEach((entry) => {
    const li = document.createElement('li');
    li.textContent = formatBrasiliaExact(entry.epoch);
    historyList.appendChild(li);
  });
}

// ---------------------------------------------------------------
// Escuta em tempo real: qualquer reinício em qualquer computador
// atualiza a tela de todo mundo automaticamente.
// ---------------------------------------------------------------
onValue(counterRef, async (snapshot) => {
  const data = snapshot.val();

  if (!data || !data.resetEpoch) {
    // Primeira vez que o contador é usado: inicializa no banco usando update pra não sobrescrever nada
    await update(counterRef, {
      resetEpoch: serverTimestamp(),
      recordMs: 0,
      resetCount: 0,
    });
    return; // o próprio set vai disparar este listener de novo
  }

  resetEpoch = data.resetEpoch;
  recordMs = data.recordMs || 0;
  resetCount = data.resetCount || 0;

  elSince.textContent = formatBrasiliaExact(resetEpoch);
  elResetCount.textContent = resetCount;

  setSyncState(true);
  tick();
});

onValue(historyRef, (snapshot) => {
  renderHistory(snapshot.val());
});

// ---------------------------------------------------------------
// Botão de reiniciar (confirmação dupla antes de gravar)
// ---------------------------------------------------------------
btn.addEventListener('click', async () => {
  if (!confirming) {
    confirming = true;
    btn.classList.add('confirm');
    btnLabel.textContent = 'Confirmar reinício';
    hint.textContent = 'Toque de novo — isso não pode ser desfeito';
    clearTimeout(confirmTimeout);
    confirmTimeout = setTimeout(resetConfirmUI, 4000);
    return;
  }

  if (resetting) return;
  resetting = true;
  clearTimeout(confirmTimeout);

  try {
    const snap = await get(counterRef);
    const data = snap.val() || {};
    const now = Date.now() + serverTimeOffset;
    const prevEpoch = data.resetEpoch || now;
    const diff = now - prevEpoch;
    const newRecord = Math.max(data.recordMs || 0, diff);
    const newCount = (data.resetCount || 0) + 1;

    await update(counterRef, {
      resetEpoch: serverTimestamp(),
      recordMs: newRecord,
      resetCount: newCount,
    });

    await push(historyRef, { epoch: serverTimestamp() });
  } catch (err) {
    console.error('Falha ao sincronizar reinício:', err);
    hint.textContent = 'Falha ao sincronizar — tente novamente';
  } finally {
    resetting = false;
    resetConfirmUI();
  }
});

historyToggle.addEventListener('click', () => {
  const hidden = historyList.hasAttribute('hidden');
  if (hidden) {
    historyList.removeAttribute('hidden');
    historyToggle.textContent = 'Ocultar histórico de reinícios';
  } else {
    historyList.setAttribute('hidden', '');
    historyToggle.textContent = 'Ver histórico de reinícios';
  }
});

// ---------------------------------------------------------------
// Live Chat Universal
// ---------------------------------------------------------------
const savedName = localStorage.getItem('chatName');
if (savedName) {
  chatNameInput.value = savedName;
}

chatNameInput.addEventListener('input', (e) => {
  localStorage.setItem('chatName', e.target.value);
});

onValue(chatMessagesRef, (snapshot) => {
  chatMessagesContainer.innerHTML = '';
  const messagesObj = snapshot.val() || {};
  
  // Converter para array e ordenar por data
  const messages = Object.values(messagesObj).sort((a, b) => a.epoch - b.epoch);
  
  messages.forEach(msg => {
    // Definimos como "minha mensagem" se o nome for igual ao salvo,
    // mas se o nome estiver vazio ignoramos
    const myName = chatNameInput.value.trim();
    const isMine = myName !== '' && msg.name === myName;
    
    const div = document.createElement('div');
    div.className = `chat-msg ${isMine ? 'mine' : ''}`;
    
    const timeStr = msg.epoch ? new Date(msg.epoch).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : '';
    
    div.innerHTML = `
      <div class="chat-msg-header">
        <span class="chat-msg-author">${msg.name || 'Anônimo'}</span>
        <span class="chat-msg-time">${timeStr}</span>
      </div>
      <div class="chat-msg-text"></div>
    `;
    
    // Setando textContent para prevenir XSS
    div.querySelector('.chat-msg-text').textContent = msg.text;
    
    chatMessagesContainer.appendChild(div);
  });
  
  // Auto-scroll para o final
  chatMessagesContainer.scrollTop = chatMessagesContainer.scrollHeight;
});

chatForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const text = chatInput.value.trim();
  const name = chatNameInput.value.trim() || 'Anônimo';
  
  if (!text) return;
  
  try {
    await push(chatMessagesRef, {
      name,
      text,
      // Se não tivermos o servidor syncado ainda, usamos Date.now() + offset, 
      // mas serverTimestamp() é o padrão do firebase.
      epoch: serverTimestamp()
    });
    chatInput.value = '';
  } catch (err) {
    console.error('Falha ao enviar mensagem', err);
  }
});

setInterval(tick, 1000);

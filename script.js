// ==========================================
// JOGO DA VELHA ONLINE - SCRIPT PRINCIPAL
// ==========================================

const WINNING_COMBINATIONS = [
  [0, 1, 2], [3, 4, 5], [6, 7, 8], // Linhas
  [0, 3, 6], [1, 4, 7], [2, 5, 8], // Colunas
  [0, 4, 8], [2, 4, 6]             // Diagonais
];

// Estado do Jogo
let boardState = Array(9).fill('');
let currentPlayer = 'X';
let isGameActive = true;
let currentMode = 'online'; // 'online' | 'ai' | 'local'
let scores = { x: 0, ties: 0, o: 0 };
let soundEnabled = true;
let audioCtx = null;

// Variáveis do Modo Online (PeerJS)
let peer = null;
let conn = null;
let myOnlineSymbol = null; // 'X' para host, 'O' para convidado
let isHost = false;

// Elementos da Interface (DOM)
const cells = document.querySelectorAll('.cell');
const turnBanner = document.getElementById('turn-banner');
const turnText = document.getElementById('turn-text');
const scoreXEl = document.getElementById('score-x');
const scoreTiesEl = document.getElementById('score-ties');
const scoreOEl = document.getElementById('score-o');
const cardX = document.getElementById('card-x');
const cardO = document.getElementById('card-o');
const labelX = document.getElementById('label-x');
const labelO = document.getElementById('label-o');

const modeButtons = document.querySelectorAll('.mode-btn');
const onlinePanel = document.getElementById('online-panel');
const aiPanel = document.getElementById('ai-panel');
const aiDifficultySelect = document.getElementById('ai-difficulty');

const btnCreateRoom = document.getElementById('btn-create-room');
const btnJoinRoom = document.getElementById('btn-join-room');
const joinRoomInput = document.getElementById('join-room-id');
const roomInfo = document.getElementById('room-info');
const roomStatusText = document.getElementById('room-status-text');
const roomShareInput = document.getElementById('room-share-input');
const btnCopyLink = document.getElementById('btn-copy-link');
const copyFeedback = document.getElementById('copy-feedback');
const mySymbolBadge = document.getElementById('my-symbol-badge');
const playerIdentity = document.getElementById('player-identity');

const btnRestart = document.getElementById('btn-restart');
const btnResetScore = document.getElementById('btn-reset-score');
const soundBtn = document.getElementById('sound-btn');
const soundIcon = document.getElementById('sound-icon');

// ==========================================
// EFEITOS SONOROS (Web Audio API - Sem arquivos externos)
// ==========================================
function getAudioContext() {
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

function playSound(type) {
  if (!soundEnabled) return;
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);

    if (type === 'move-x') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(480, now);
      osc.frequency.exponentialRampToValueAtTime(720, now + 0.08);
      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
      osc.start(now);
      osc.stop(now + 0.08);
    } else if (type === 'move-o') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(600, now);
      osc.frequency.exponentialRampToValueAtTime(380, now + 0.08);
      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
      osc.start(now);
      osc.stop(now + 0.08);
    } else if (type === 'win') {
      const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
      notes.forEach((freq, idx) => {
        const o = ctx.createOscillator();
        const g = ctx.createGain();
        o.connect(g);
        g.connect(ctx.destination);
        o.type = 'triangle';
        o.frequency.value = freq;
        const noteStart = now + idx * 0.09;
        g.gain.setValueAtTime(0.2, noteStart);
        g.gain.exponentialRampToValueAtTime(0.001, noteStart + 0.25);
        o.start(noteStart);
        o.stop(noteStart + 0.25);
      });
    } else if (type === 'tie') {
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(300, now);
      osc.frequency.linearRampToValueAtTime(200, now + 0.25);
      gain.gain.setValueAtTime(0.15, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
      osc.start(now);
      osc.stop(now + 0.25);
    } else if (type === 'connect') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(523.25, now);
      osc.frequency.setValueAtTime(659.25, now + 0.1);
      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
      osc.start(now);
      osc.stop(now + 0.25);
    }
  } catch (e) {
    console.warn('Erro ao reproduzir áudio:', e);
  }
}

// ==========================================
// LÓGICA DO JOGO (MOVIMENTOS E VERIFICAÇÃO)
// ==========================================

function handleCellClick(e) {
  const cell = e.target;
  const index = parseInt(cell.getAttribute('data-index'), 10);

  if (boardState[index] !== '' || !isGameActive) return;

  // No modo online, o jogador só pode jogar na sua vez e com seu símbolo
  if (currentMode === 'online') {
    if (!conn || !conn.open) {
      alert('Conecte-se com um amigo para jogar online ou crie uma sala!');
      return;
    }
    if (currentPlayer !== myOnlineSymbol) {
      return; // Não é o turno deste jogador
    }
    // Envia o movimento para o oponente
    conn.send({ type: 'move', index });
  }

  executeMove(index, currentPlayer);

  // No modo contra IA
  if (currentMode === 'ai' && isGameActive && currentPlayer === 'O') {
    setTimeout(makeAiMove, 350);
  }
}

function executeMove(index, player) {
  boardState[index] = player;
  const cell = cells[index];
  cell.textContent = player;
  cell.classList.add(player.toLowerCase());
  cell.disabled = true;

  playSound(player === 'X' ? 'move-x' : 'move-o');

  const winnerData = checkWin();
  if (winnerData) {
    handleWin(winnerData);
  } else if (checkTie()) {
    handleTie();
  } else {
    currentPlayer = currentPlayer === 'X' ? 'O' : 'X';
    updateTurnDisplay();
  }
}

function checkWin() {
  for (const combo of WINNING_COMBINATIONS) {
    const [a, b, c] = combo;
    if (boardState[a] && boardState[a] === boardState[b] && boardState[a] === boardState[c]) {
      return { winner: boardState[a], combo };
    }
  }
  return null;
}

function checkTie() {
  return boardState.every(cell => cell !== '');
}

function handleWin({ winner, combo }) {
  isGameActive = false;
  combo.forEach(idx => cells[idx].classList.add('winner'));
  scores[winner.toLowerCase()]++;
  updateScoreboard();

  turnBanner.className = 'turn-banner win-banner';
  if (currentMode === 'online') {
    if (winner === myOnlineSymbol) {
      turnText.innerHTML = `🎉 <strong>Você venceu!</strong> Parabéns!`;
    } else {
      turnText.innerHTML = `😔 <strong>Oponente venceu!</strong> Bom jogo!`;
    }
  } else if (currentMode === 'ai') {
    if (winner === 'X') {
      turnText.innerHTML = `🎉 <strong>Você venceu a Máquina!</strong>`;
    } else {
      turnText.innerHTML = `🤖 <strong>A Máquina venceu!</strong>`;
    }
  } else {
    turnText.innerHTML = `🎉 Jogador <strong>${winner}</strong> venceu!`;
  }

  playSound('win');
}

function handleTie() {
  isGameActive = false;
  scores.ties++;
  updateScoreboard();

  turnBanner.className = 'turn-banner tie-banner';
  turnText.innerHTML = `🤝 <strong>Deu Velha!</strong> Empate.`;
  playSound('tie');
}

function updateTurnDisplay() {
  turnBanner.className = `turn-banner ${currentPlayer.toLowerCase()}-turn`;

  cardX.classList.toggle('active-turn', currentPlayer === 'X');
  cardO.classList.toggle('active-turn', currentPlayer === 'O');

  if (currentMode === 'online') {
    if (currentPlayer === myOnlineSymbol) {
      turnText.innerHTML = `👉 <strong>Sua vez</strong> (${myOnlineSymbol})`;
    } else {
      const oppSymbol = myOnlineSymbol === 'X' ? 'O' : 'X';
      turnText.innerHTML = `⏳ Vez do adversário (${oppSymbol})...`;
    }
  } else if (currentMode === 'ai') {
    if (currentPlayer === 'X') {
      turnText.innerHTML = `👉 <strong>Sua vez</strong> (X)`;
    } else {
      turnText.innerHTML = `🤖 <strong>Máquina pensando...</strong>`;
    }
  } else {
    turnText.innerHTML = `Vez do Jogador <strong>${currentPlayer}</strong>`;
  }
}

function updateScoreboard() {
  scoreXEl.textContent = scores.x;
  scoreTiesEl.textContent = scores.ties;
  scoreOEl.textContent = scores.o;
}

function resetBoard(notifyPeer = true) {
  boardState.fill('');
  isGameActive = true;
  currentPlayer = 'X';

  cells.forEach(cell => {
    cell.textContent = '';
    cell.className = 'cell';
    cell.disabled = false;
  });

  updateTurnDisplay();

  if (notifyPeer && currentMode === 'online' && conn && conn.open) {
    conn.send({ type: 'restart' });
  }
}

function resetScores(notifyPeer = true) {
  scores = { x: 0, ties: 0, o: 0 };
  updateScoreboard();
  resetBoard(false);

  if (notifyPeer && currentMode === 'online' && conn && conn.open) {
    conn.send({ type: 'reset_scores' });
  }
}

// ==========================================
// INTELIGÊNCIA ARTIFICIAL (FÁCIL E MINIMAX)
// ==========================================

function makeAiMove() {
  if (!isGameActive) return;

  const difficulty = aiDifficultySelect.value;
  let chosenIndex;

  if (difficulty === 'easy') {
    // Modo Fácil: 60% chance de jogada aleatória, 40% tentativa de bloquear/ganhar
    if (Math.random() < 0.6) {
      chosenIndex = getRandomAvailableMove();
    } else {
      chosenIndex = findWinningOrBlockingMove('O') ?? findWinningOrBlockingMove('X') ?? getRandomAvailableMove();
    }
  } else {
    // Modo Imbatível: Algoritmo Minimax completo
    chosenIndex = getBestMoveMinimax();
  }

  if (chosenIndex !== undefined && chosenIndex !== null && chosenIndex !== -1) {
    executeMove(chosenIndex, 'O');
  }
}

function getRandomAvailableMove() {
  const emptyIndices = boardState
    .map((val, idx) => (val === '' ? idx : null))
    .filter(val => val !== null);
  if (emptyIndices.length === 0) return null;
  return emptyIndices[Math.floor(Math.random() * emptyIndices.length)];
}

function findWinningOrBlockingMove(symbol) {
  for (const combo of WINNING_COMBINATIONS) {
    const [a, b, c] = combo;
    const values = [boardState[a], boardState[b], boardState[c]];
    const countSymbol = values.filter(v => v === symbol).length;
    const countEmpty = values.filter(v => v === '').length;

    if (countSymbol === 2 && countEmpty === 1) {
      if (boardState[a] === '') return a;
      if (boardState[b] === '') return b;
      if (boardState[c] === '') return c;
    }
  }
  return null;
}

function getBestMoveMinimax() {
  let bestScore = -Infinity;
  let move = -1;

  for (let i = 0; i < 9; i++) {
    if (boardState[i] === '') {
      boardState[i] = 'O';
      let score = minimax(boardState, 0, false);
      boardState[i] = '';
      if (score > bestScore) {
        bestScore = score;
        move = i;
      }
    }
  }
  return move;
}

function minimax(board, depth, isMaximizing) {
  const win = checkWin();
  if (win) {
    return win.winner === 'O' ? 10 - depth : depth - 10;
  }
  if (board.every(cell => cell !== '')) {
    return 0; // Empate
  }

  if (isMaximizing) {
    let maxEval = -Infinity;
    for (let i = 0; i < 9; i++) {
      if (board[i] === '') {
        board[i] = 'O';
        let evaluation = minimax(board, depth + 1, false);
        board[i] = '';
        maxEval = Math.max(maxEval, evaluation);
      }
    }
    return maxEval;
  } else {
    let minEval = Infinity;
    for (let i = 0; i < 9; i++) {
      if (board[i] === '') {
        board[i] = 'X';
        let evaluation = minimax(board, depth + 1, true);
        board[i] = '';
        minEval = Math.min(minEval, evaluation);
      }
    }
    return minEval;
  }
}

// ==========================================
// MODO MULTIPLAYER ONLINE VIA PEERJS (P2P)
// ==========================================

function generateRoomId() {
  const chars = 'abcdefghjkmnpqrstuvwxyz23456789';
  let result = 'velha-';
  for (let i = 0; i < 4; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

function initPeer(customId = null, onReady = null) {
  if (peer && !peer.destroyed) {
    peer.destroy();
  }

  try {
    peer = customId ? new Peer(customId) : new Peer();

    peer.on('open', (id) => {
      console.log('Peer conectado com ID:', id);
      if (onReady) onReady(id);
    });

    peer.on('connection', (c) => {
      // Como host, recebe conexão do convidado
      setupConnection(c);
    });

    peer.on('error', (err) => {
      console.error('Erro no PeerJS:', err);
      if (err.type === 'unavailable-id') {
        // Tenta gerar outro se o ID colidir
        initPeer(generateRoomId(), onReady);
      } else {
        alert('Erro de conexão online: ' + err.message);
      }
    });
  } catch (err) {
    console.error('Falha ao inicializar PeerJS:', err);
    alert('Não foi possível carregar a conexão online. Verifique sua conexão com a internet.');
  }
}

function createRoom() {
  const roomId = generateRoomId();
  isHost = true;
  myOnlineSymbol = 'X';

  initPeer(roomId, (id) => {
    roomInfo.classList.remove('hidden');
    document.getElementById('online-setup').classList.add('hidden');

    const shareUrl = `${window.location.origin}${window.location.pathname}?sala=${id}`;
    roomShareInput.value = shareUrl;
    roomStatusText.textContent = 'Aguardando adversário conectar...';
    mySymbolBadge.textContent = 'X (Host - Você começa)';
    mySymbolBadge.style.color = 'var(--color-x)';

    labelX.textContent = 'Você (X)';
    labelO.textContent = 'Oponente (O)';
    updateTurnDisplay();
  });
}

function joinRoom(targetId) {
  if (!targetId || targetId.trim() === '') {
    alert('Por favor, informe o código da sala!');
    return;
  }

  isHost = false;
  myOnlineSymbol = 'O';

  initPeer(null, () => {
    roomStatusText.textContent = 'Conectando à sala...';
    roomInfo.classList.remove('hidden');
    document.getElementById('online-setup').classList.add('hidden');

    const connection = peer.connect(targetId.trim());
    setupConnection(connection);

    labelX.textContent = 'Oponente (X)';
    labelO.textContent = 'Você (O)';
    mySymbolBadge.textContent = 'O (Você é o 2º)';
    mySymbolBadge.style.color = 'var(--color-o)';
    roomShareInput.value = `${window.location.origin}${window.location.pathname}?sala=${targetId.trim()}`;
  });
}

function setupConnection(c) {
  conn = c;

  conn.on('open', () => {
    playSound('connect');
    roomStatusText.innerHTML = '🟢 <strong>Conectado com o oponente!</strong>';
    document.getElementById('room-status-badge').querySelector('.dot').style.backgroundColor = '#10b981';
    resetBoard(false);
  });

  conn.on('data', (data) => {
    if (data.type === 'move') {
      executeMove(data.index, currentPlayer);
    } else if (data.type === 'restart') {
      resetBoard(false);
    } else if (data.type === 'reset_scores') {
      resetScores(false);
    }
  });

  conn.on('close', () => {
    roomStatusText.innerHTML = '🔴 <strong>Oponente desconectou.</strong>';
    document.getElementById('room-status-badge').querySelector('.dot').style.backgroundColor = '#f43f5e';
    alert('O seu oponente saiu da partida.');
  });

  conn.on('error', (err) => {
    console.error('Erro na conexão P2P:', err);
    alert('Houve um erro na conexão com o jogador.');
  });
}

function copyShareLink() {
  const text = roomShareInput.value;
  if (!text) return;

  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(text).then(showCopyFeedback);
  } else {
    roomShareInput.select();
    document.execCommand('copy');
    showCopyFeedback();
  }
}

function showCopyFeedback() {
  copyFeedback.classList.remove('hidden');
  setTimeout(() => {
    copyFeedback.classList.add('hidden');
  }, 2500);
}

// ==========================================
// TROCA DE MODOS E CONFIGURAÇÕES
// ==========================================

function setGameMode(newMode) {
  currentMode = newMode;
  modeButtons.forEach(btn => {
    btn.classList.toggle('active', btn.getAttribute('data-mode') === newMode);
  });

  if (newMode === 'online') {
    onlinePanel.classList.remove('hidden');
    aiPanel.classList.add('hidden');
    labelX.textContent = myOnlineSymbol === 'O' ? 'Oponente (X)' : 'Você (X)';
    labelO.textContent = myOnlineSymbol === 'O' ? 'Você (O)' : 'Oponente (O)';
  } else if (newMode === 'ai') {
    onlinePanel.classList.add('hidden');
    aiPanel.classList.remove('hidden');
    labelX.textContent = 'Você (X)';
    labelO.textContent = 'Máquina (O)';
  } else {
    // Local
    onlinePanel.classList.add('hidden');
    aiPanel.classList.add('hidden');
    labelX.textContent = 'Jogador X';
    labelO.textContent = 'Jogador O';
  }

  resetScores(false);
}

// ==========================================
// INICIALIZAÇÃO E EVENT LISTENERS
// ==========================================

function init() {
  // Células do tabuleiro
  cells.forEach(cell => cell.addEventListener('click', handleCellClick));

  // Botões de modo
  modeButtons.forEach(btn => {
    btn.addEventListener('click', () => setGameMode(btn.getAttribute('data-mode')));
  });

  // Botões Online
  btnCreateRoom.addEventListener('click', createRoom);
  btnJoinRoom.addEventListener('click', () => joinRoom(joinRoomInput.value));
  btnCopyLink.addEventListener('click', copyShareLink);

  // Botões de ação
  btnRestart.addEventListener('click', () => resetBoard(true));
  btnResetScore.addEventListener('click', () => resetScores(true));

  // Botão de som
  soundBtn.addEventListener('click', () => {
    soundEnabled = !soundEnabled;
    soundIcon.textContent = soundEnabled ? '🔊' : '🔇';
    soundBtn.title = soundEnabled ? 'Desativar som' : 'Ativar som';
    if (soundEnabled) getAudioContext();
  });

  // Dificuldade IA
  aiDifficultySelect.addEventListener('change', () => {
    resetScores(false);
  });

  // Suporte a URL com parâmetro ?sala=XYZ (Entrada automática via convite)
  const urlParams = new URLSearchParams(window.location.search);
  const roomParam = urlParams.get('sala');
  if (roomParam) {
    setGameMode('online');
    joinRoomInput.value = roomParam;
    // Pequeno timeout para permitir o carregamento da biblioteca PeerJS
    setTimeout(() => {
      joinRoom(roomParam);
    }, 300);
  } else {
    updateTurnDisplay();
  }
}

// Inicializar quando o DOM estiver pronto
document.addEventListener('DOMContentLoaded', init);

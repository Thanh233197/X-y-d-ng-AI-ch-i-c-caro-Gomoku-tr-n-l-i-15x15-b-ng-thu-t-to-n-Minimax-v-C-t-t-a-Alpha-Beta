const canvas = document.getElementById('game-board');
const ctx = canvas.getContext('2d');
const cellSize = 600 / window.SIZE;

let board = [];
let isPlayerTurn = true;
let gameActive = true;

const difficultyInput = document.getElementById('difficulty');
const depthLabel = document.getElementById('depth-label');
const turnIndicator = document.getElementById('turn-indicator');
const statusMessage = document.getElementById('status-message');
const firstPlayerSelect = document.getElementById('first-player');

function initGame() {
    // Khởi tạo bảng rỗng 15x15
    board = Array.from({ length: window.SIZE }, () => Array(window.SIZE).fill(window.EMPTY));
    gameActive = true;
    statusMessage.textContent = "";

    isPlayerTurn = firstPlayerSelect.value === 'player';
    
    updateIndicator();
    drawBoard();

    // Nếu AI đi trước
    if (!isPlayerTurn) {
        setTimeout(aiMove, 100);
    }
}

// Vẽ bàn cờ ô vuông ngã tư
function drawBoard() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    ctx.fillStyle = "transparent";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    ctx.strokeStyle = "#a0d2eb"; // Giấy kẻ ô
    ctx.lineWidth = 1.5;

    for (let i = 0; i <= window.SIZE; i++) {
        // Kẻ ngang
        ctx.beginPath();
        ctx.moveTo(0, i * cellSize);
        ctx.lineTo(canvas.width, i * cellSize);
        ctx.stroke();

        // Kẻ dọc
        ctx.beginPath();
        ctx.moveTo(i * cellSize, 0);
        ctx.lineTo(i * cellSize, canvas.height);
        ctx.stroke();
    }

    // Vẽ lại các quân cờ
    for (let r = 0; r < window.SIZE; r++) {
        for (let c = 0; c < window.SIZE; c++) {
            if (board[r][c] !== window.EMPTY) {
                drawPiece(r, c, board[r][c]);
            }
        }
    }
}

// Vẽ quân cờ (X và O)
function drawPiece(r, c, player) {
    const x = c * cellSize + cellSize / 2;
    const y = r * cellSize + cellSize / 2;

    ctx.font = `bold ${cellSize * 0.7}px 'Inter', sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    
    if (player === window.HUMAN) {
        ctx.fillStyle = "#ff4757"; // Màu đỏ cho X
        ctx.fillText("X", x, y);
    } else {
        ctx.fillStyle = "#1e90ff"; // Màu xanh cho O
        ctx.fillText("O", x, y);
    }
}

// Xử lý khi nhấn click trên canvas
function handleCanvasClick(e) {
    if (!gameActive || !isPlayerTurn) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const c = Math.floor(x / cellSize);
    const r = Math.floor(y / cellSize);

    // Kiểm tra tính hợp lệ của nước đi
    if (r >= 0 && r < window.SIZE && c >= 0 && c < window.SIZE && board[r][c] === window.EMPTY) {
        makeMove(r, c, window.HUMAN);
    }
}

// Thực hiện nước đi và cập nhật UI, kiểm tra win
function makeMove(r, c, player) {
    board[r][c] = player;
    drawPiece(r, c, player);

    // Kiểm tra có người thắng không
    if (window.checkWin(board, r, c, player)) {
        gameActive = false;
        let color = player === window.HUMAN ? "Bạn (X)" : "AI (O)";
        statusMessage.textContent = `${color} đã chiến thắng! 🎉`;
        statusMessage.style.color = player === window.HUMAN ? "#ff4757" : "#1e90ff";
        updateIndicator();
        return;
    }

    // Kiểm tra hòa
    let isDraw = true;
    for(let i = 0; i < window.SIZE; i++) {
        for(let j = 0; j < window.SIZE; j++) {
            if(board[i][j] === window.EMPTY) isDraw = false;
        }
    }
    if (isDraw) {
        gameActive = false;
        statusMessage.textContent = "Trận đấu hòa!";
        statusMessage.style.color = "#8b949e";
        return;
    }

    isPlayerTurn = player === window.AI;
    updateIndicator();

    // Call AI move nếu đến lượt AI
    if (!isPlayerTurn) {
        requestAnimationFrame(() => {
            setTimeout(aiMove, 50); // Cho UI cập nhật sau đó AI bắt đầu suy nghĩ
        });
    }
}

// Xử lý lượt đi cho AI
function aiMove() {
    if (!gameActive) return;
    statusMessage.textContent = "AI đang suy nghĩ...";
    statusMessage.style.color = "#1e90ff";
    
    requestAnimationFrame(() => {
        setTimeout(() => {
            const depth = parseInt(difficultyInput.value);
            const move = window.findBestMove(board, depth);
        
        statusMessage.textContent = "";
        
        if (move) {
            makeMove(move.r, move.c, window.AI);
        } else {
            statusMessage.textContent = "Bàn cờ đã đầy!";
            gameActive = false;
        }
        }, 50);
    });
}

function updateIndicator() {
    if (!gameActive) {
        turnIndicator.textContent = "Trò chơi kết thúc";
        turnIndicator.className = "indicator";
        turnIndicator.style.background = "#21262d";
        turnIndicator.style.color = "#8b949e";
        return;
    }

    if (isPlayerTurn) {
        turnIndicator.textContent = "Bạn (X)";
        turnIndicator.className = "indicator player";
        turnIndicator.style.color = "#ff4757";
    } else {
        turnIndicator.textContent = "AI (O)";
        turnIndicator.className = "indicator ai";
        turnIndicator.style.color = "#1e90ff";
    }
}

// Bắt sự kiện
canvas.addEventListener('click', handleCanvasClick);
document.getElementById('restart-btn').addEventListener('click', initGame);

difficultyInput.addEventListener('input', (e) => {
    depthLabel.textContent = e.target.value;
});

// Khởi chạy App
initGame();

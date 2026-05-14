const SIZE = 15;
const EMPTY = 0;
const HUMAN = 1;
const AI = 2;

let TOTAL_NODES = 0;

// Hàm nội suy (Heuristic Evaluation) để tính điểm bàn cờ
function evaluateBoard(board) {
    let aiScore = 0;
    let humanScore = 0;

    for (let r = 0; r < SIZE; r++) {
        for (let c = 0; c < SIZE; c++) {
            let player = board[r][c];
            if (player === EMPTY) continue;

            // Kiểm tra 4 hướng: Ngang, dọc, chéo chính, chéo phụ
            const dirs = [[0, 1], [1, 0], [1, 1], [1, -1]];
            for (let d of dirs) {
                let dr = d[0];
                let dc = d[1];

                // Tránh tình trạng đếm trùng lặp chuỗi
                let pr = r - dr;
                let pc = c - dc;
                if (pr >= 0 && pr < SIZE && pc >= 0 && pc < SIZE && board[pr][pc] === player) {
                    continue; 
                }

                let score = evaluateSequence(board, r, c, dr, dc, player);
                if (player === AI) aiScore += score;
                else humanScore += score;
            }
        }
    }

    // AI sẽ cố gắng phòng thủ khi đối phương có điểm cao
    return aiScore - humanScore * 1.5; 
}

// Đánh giá hệ chuỗi nước cờ hiện tại
function evaluateSequence(board, r, c, dr, dc, player) {
    let consec = 0;
    let blocks = 2;

    let pr = r - dr;
    let pc = c - dc;
    if (pr >= 0 && pr < SIZE && pc >= 0 && pc < SIZE && board[pr][pc] === EMPTY) {
        blocks--;
    }

    let br = r;
    let bc = c;
    while (br >= 0 && br < SIZE && bc >= 0 && bc < SIZE && board[br][bc] === player) {
        consec++;
        br += dr;
        bc += dc;
    }

    if (br >= 0 && br < SIZE && bc >= 0 && bc < SIZE && board[br][bc] === EMPTY) {
        blocks--;
    }

    if (consec >= 5) return 10000000;
    
    if (blocks === 0) { // Chuỗi mớ cả 2 đầu
        switch(consec) {
            case 4: return 100000; // Open 4 (Chắc chắn win)
            case 3: return 10000;
            case 2: return 100;
            case 1: return 10;
        }
    } else if (blocks === 1) { // Bị chặn 1 đầu
        switch(consec) {
            case 4: return 10000; // Blocked 4
            case 3: return 100;
            case 2: return 10;
            case 1: return 1;
        }
    }
    return 0; // Bị chặn cả 2 đầu
}

// Tối ưu hóa: Chỉ lấy các ô trống lân cận với ô đã đánh trong khoảng cách 2 ô
function getCandidates(board) {
    let candidates = [];
    let hasPiece = false;
    let tempCandidates = new Set();

    for (let r = 0; r < SIZE; r++) {
        for (let c = 0; c < SIZE; c++) {
            if (board[r][c] !== EMPTY) {
                hasPiece = true;
                for (let i = -2; i <= 2; i++) {
                    for (let j = -2; j <= 2; j++) {
                        let nr = r + i, nc = c + j;
                        if (nr >= 0 && nr < SIZE && nc >= 0 && nc < SIZE && board[nr][nc] === EMPTY) {
                            tempCandidates.add(`${nr},${nc}`);
                        }
                    }
                }
            }
        }
    }

    // Nếu bàn cờ trống, đánh vào giữa
    if (!hasPiece) {
        return [{r: Math.floor(SIZE/2), c: Math.floor(SIZE/2)}];
    }

    tempCandidates.forEach(pos => {
        let [r, c] = pos.split(',').map(Number);
        candidates.push({r, c});
    });

    return candidates;
}

// Hàm hỗ trợ để sắp xếp nhanh candidate list (Move Ordering heuristic)
// Tính toán "giá trị" nếu đặt một quân cờ tại vị trí r, c
function quickEval(board, r, c) {
    let score = 0;
    
    // 1. Thử đánh quân AI vào vị trí này để xem giá trị tấn công
    board[r][c] = AI;
    score += evaluatePoint(board, r, c, AI);
    
    // 2. Thử đánh quân Người vào vị trí này để xem giá trị phòng thủ
    board[r][c] = HUMAN;
    score += evaluatePoint(board, r, c, HUMAN) * 1.2; // Ưu tiên chặn địch hơn một chút để AI an toàn
    
    board[r][c] = EMPTY;
    return score;
}

// Hàm tính nhanh điểm nếu đặt quân tại 1 tọa độ nhất định
function evaluatePoint(board, r, c, player) {
    let getScore = 0;
    const dirs = [[0, 1], [1, 0], [1, 1], [1, -1]];
    
    for (let d of dirs) {
        let dr = d[0]; let dc = d[1];
        
        let startR = r; let startC = c;
        // Đi ngược về điểm đầu tiên của chuỗi
        while (startR - dr >= 0 && startR - dr < SIZE && startC - dc >= 0 && startC - dc < SIZE && board[startR - dr][startC - dc] === player) {
            startR -= dr;
            startC -= dc;
        }
        
        getScore += evaluateSequence(board, startR, startC, dr, dc, player);
    }
    return getScore;
}

function sortCandidates(board, candidates) {
    for (let cand of candidates) {
        cand.score = quickEval(board, cand.r, cand.c);
    }
    candidates.sort((a, b) => b.score - a.score);
}

// Hàm kiểm tra win điều kiện
function checkWin(board, r, c, player) {
    const dirs = [[0, 1], [1, 0], [1, 1], [1, -1]];
    for (let d of dirs) {
        let count = 1;
        
        let nr = r + d[0]; let nc = c + d[1];
        while (nr >= 0 && nr < SIZE && nc >= 0 && nc < SIZE && board[nr][nc] === player) {
            count++;
            nr += d[0]; nc += d[1];
        }
        
        nr = r - d[0]; nc = c - d[1];
        while (nr >= 0 && nr < SIZE && nc >= 0 && nc < SIZE && board[nr][nc] === player) {
            count++;
            nr -= d[0]; nc -= d[1];
        }

        if (count >= 5) return true;
    }
    return false;
}

// Thuật toán Minimax kết hợp Alpha-Beta Pruning
function minimax(board, depth, alpha, beta, isMaximizing, lastMove) {
    TOTAL_NODES++;

    if (lastMove) {
        if (checkWin(board, lastMove.r, lastMove.c, isMaximizing ? HUMAN : AI)) {
            return isMaximizing ? -10000000 + (10 - depth) : 10000000 - (10 - depth);
        }
    }

    if (depth === 0) {
        return evaluateBoard(board);
    }

    let candidates = getCandidates(board);
    if (candidates.length === 0) return 0; // Hết cờ, kết quả hòa

    sortCandidates(board, candidates);
    
    // Tỉa số nhánh để trình duyệt web không bị đơ
    let maxCandidates = 20;
    if (depth >= 3) maxCandidates = 12;
    if (candidates.length > maxCandidates) {
        candidates = candidates.slice(0, maxCandidates); 
    }

    if (isMaximizing) {
        let maxEval = -Infinity;
        for (let move of candidates) {
            board[move.r][move.c] = AI;
            let ev = minimax(board, depth - 1, alpha, beta, false, move);
            board[move.r][move.c] = EMPTY;
            
            maxEval = Math.max(maxEval, ev);
            alpha = Math.max(alpha, ev);
            if (beta <= alpha) break; // Cắt tỉa Beta
        }
        return maxEval;
    } else {
        let minEval = Infinity;
        for (let move of candidates) {
            board[move.r][move.c] = HUMAN;
            let ev = minimax(board, depth - 1, alpha, beta, true, move);
            board[move.r][move.c] = EMPTY;

            minEval = Math.min(minEval, ev);
            beta = Math.min(beta, ev);
            if (beta <= alpha) break; // Cắt tỉa Alpha
        }
        return minEval;
    }
}

// Api chính được gọi từ the UI (main.js)
window.findBestMove = function(board, depth) {
    let candidates = getCandidates(board);
    if (!candidates || candidates.length === 0) return null;

    sortCandidates(board, candidates);
    
    let maxCandidates = 25;
    if (candidates.length > maxCandidates) candidates = candidates.slice(0, maxCandidates);

    let bestMove = candidates[0]; // Đề phòng bất trắc
    let bestVal = -Infinity;
    let alpha = -Infinity;
    let beta = Infinity;
    
    TOTAL_NODES = 0;
    const start = performance.now();

    for (let move of candidates) {
        board[move.r][move.c] = AI;
        let moveVal = minimax(board, depth - 1, alpha, beta, false, move);
        board[move.r][move.c] = EMPTY;

        if (moveVal > bestVal) {
            bestVal = moveVal;
            bestMove = move;
        }
        alpha = Math.max(alpha, bestVal); // Cập nhật Alpha
    }
    
    const end = performance.now();
    console.log(`Evaluated: ${TOTAL_NODES} states in Tree. Time Eval: ${Math.round(end-start)}ms`);
    return bestMove;
}

window.checkWin = checkWin;
window.SIZE = SIZE;
window.EMPTY = EMPTY;
window.HUMAN = HUMAN;
window.AI = AI;

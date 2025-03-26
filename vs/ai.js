// ai.js - Bản tối ưu hóa để bot luôn di chuyển
const AI_DEPTH = 2; // Độ sâu tìm kiếm

// Giá trị các quân cờ
const pieceValues = {
    "rK": 10000, "bK": 10000, // Tướng
    "rA": 200, "bA": 300,    // Sĩ
    "rE": 200, "bE": 400,    // Tượng
    "rH": 600, "bH": 800,    // Mã
    "rR": 1000, "bR": 1000,  // Xe
    "rC": 500, "bC": 800,    // Pháo
    "rP": 100, "bP": 200     // Tốt
};

// Hàm đánh giá bàn cờ (giữ nguyên)
function evaluateBoard(pieces) {
    let score = 0;
    pieces.forEach(piece => {
        const color = piece.dataset.name[0];
        const value = pieceValues[piece.dataset.name];
        score += (color === "r" ? value : -value);
        score += (color === "r" ? 1 : -1) * evaluateStrategicPosition(piece);
    });

    const redKing = pieces.find(p => p.dataset.name === "rK");
    const blackKing = pieces.find(p => p.dataset.name === "bK");
    
    if (redKing && isUnderAttack(redKing, pieces, "b")) score -= 1500;
    if (blackKing && isUnderAttack(blackKing, pieces, "r")) score += 1000;

    return score;
}

// Các hàm phụ trợ
function isUnderAttack(piece, pieces, attackerColor) {
    return pieces.some(p => 
        p.dataset.name[0] === attackerColor && 
        isValidMove(p, parseInt(piece.dataset.x), parseInt(piece.dataset.y))
    );
}

function evaluateStrategicPosition(piece) {
    const x = parseInt(piece.dataset.x);
    const y = parseInt(piece.dataset.y);
    let positionScore = 0;
    const type = piece.dataset.name[1];
    const color = piece.dataset.name[0];
    
    switch(type) {
        case "R":
            positionScore += (10 - Math.abs(x - 4)) * 5;
            positionScore += (color === "r" ? y : 9 - y) * 2;
            break;
        case "C":
            positionScore += (10 - Math.abs(x - 4)) * 4;
            if ((color === "r" && y >= 2) || (color === "b" && y <= 7)) positionScore += 30;
            break;
        case "H":
            positionScore += (7 - Math.abs(x - 4)) * 6;
            break;
        case "P":
            if ((color === "r" && y >= 5) || (color === "b" && y <= 4)) positionScore += 40;
            break;
        case "K":
            const guards = pieces.filter(p => 
                p.dataset.name[0] === color && 
                ["A", "E"].includes(p.dataset.name[1]) &&
                Math.abs(parseInt(p.dataset.x) - x) <= 2 &&
                Math.abs(parseInt(p.dataset.y) - y) <= 2
            ).length;
            positionScore += guards * 50;
            break;
    }
    
    return positionScore;
}

function minimax(pieces, depth, isMaximizing, alpha, beta) {
    if (depth === 0) return evaluateBoard(pieces);

    let allPieces = [...pieces];
    if (isMaximizing) {
        let maxEval = -Infinity;
        const redPieces = allPieces.filter(p => p.dataset.name[0] === "r");
        
        for (const piece of redPieces) {
            const moves = getValidMoves(piece);
            for (const move of moves) {
                const { x, y } = move;
                const originalX = parseInt(piece.dataset.x);
                const originalY = parseInt(piece.dataset.y);
                const targetPiece = allPieces.find(p => parseInt(p.dataset.x) === x && parseInt(p.dataset.y) === y);

                piece.dataset.x = x;
                piece.dataset.y = y;
                if (targetPiece) allPieces = allPieces.filter(p => p !== targetPiece);

                if (!checkFaceToFaceAfterMove(piece, x, y)) {
                    const eval = minimax(allPieces, depth - 1, false, alpha, beta);
                    maxEval = Math.max(maxEval, eval);
                    alpha = Math.max(alpha, eval);
                }

                piece.dataset.x = originalX;
                piece.dataset.y = originalY;
                if (targetPiece) allPieces.push(targetPiece);

                if (beta <= alpha) break;
            }
        }
        return maxEval;
    } else {
        let minEval = Infinity;
        const blackPieces = allPieces.filter(p => p.dataset.name[0] === "b");
        
        for (const piece of blackPieces) {
            const moves = getValidMoves(piece);
            for (const move of moves) {
                const { x, y } = move;
                const originalX = parseInt(piece.dataset.x);
                const originalY = parseInt(piece.dataset.y);
                const targetPiece = allPieces.find(p => parseInt(p.dataset.x) === x && parseInt(p.dataset.y) === y);

                piece.dataset.x = x;
                piece.dataset.y = y;
                if (targetPiece) allPieces = allPieces.filter(p => p !== targetPiece);

                if (!checkFaceToFaceAfterMove(piece, x, y)) {
                    const eval = minimax(allPieces, depth - 1, true, alpha, beta);
                    minEval = Math.min(minEval, eval);
                    beta = Math.min(beta, eval);
                }

                piece.dataset.x = originalX;
                piece.dataset.y = originalY;
                if (targetPiece) allPieces.push(targetPiece);

                if (beta <= alpha) break;
            }
        }
        return minEval;
    }
}

// Hàm chọn nước đi tốt nhất (tối ưu hóa để luôn có nước đi)
function findBestMove(pieces, lastOpponentMove = null) {
    let bestMove = null;
    let bestValue = -Infinity;
    const redPieces = pieces.filter(p => p.dataset.name[0] === "r");

    // 1. Kiểm tra và chặn đường chiếu tướng
    const blockMove = detectCheckAndBlock(pieces);
    if (blockMove) {
        console.log("Phát hiện chiếu tướng, ưu tiên chặn!");
        return blockMove;
    }

    // 2. Tìm nước đi tốt nhất
    for (const piece of redPieces) {
        const moves = getValidMoves(piece);
        for (const move of moves) {
            const { x, y } = move;
            const originalX = parseInt(piece.dataset.x);
            const originalY = parseInt(piece.dataset.y);
            const targetPiece = pieces.find(p => parseInt(p.dataset.x) === x && parseInt(p.dataset.y) === y);

            piece.dataset.x = x;
            piece.dataset.y = y;
            if (targetPiece) pieces = pieces.filter(p => p !== targetPiece);

            if (!checkFaceToFaceAfterMove(piece, x, y)) {
                const moveValue = minimax(pieces, AI_DEPTH - 1, false, -Infinity, Infinity);
                const tacticalBonus = evaluateTacticalAdvantage(piece, x, y, pieces);
                const totalValue = moveValue + tacticalBonus;

                if (totalValue > bestValue) {
                    bestValue = totalValue;
                    bestMove = { piece, toX: x, toY: y, targetPiece };
                }
            }

            piece.dataset.x = originalX;
            piece.dataset.y = originalY;
            if (targetPiece) pieces.push(targetPiece);
        }
    }

    return bestMove;
}

function isDangerousPosition(piece, toX, toY, pieces, color) {
    const opponentColor = color === "r" ? "b" : "r";
    return pieces.some(p => 
        p.dataset.name[0] === opponentColor && 
        isValidMove(p, toX, toY)
    ); // Đơn giản hóa: chỉ kiểm tra có bị tấn công không
}

function detectCheckAndBlock(pieces) {
    const redKing = pieces.find(p => p.dataset.name === "rK");
    if (!redKing) return null;

    const blackPieces = pieces.filter(p => p.dataset.name[0] === "b");
    let checkMove = null;

    for (const blackPiece of blackPieces) {
        if (isValidMove(blackPiece, parseInt(redKing.dataset.x), parseInt(redKing.dataset.y))) {
            checkMove = { piece: blackPiece, toX: parseInt(redKing.dataset.x), toY: parseInt(redKing.dataset.y) };
            break;
        }
    }

    if (!checkMove) return null;

    const redPieces = pieces.filter(p => p.dataset.name[0] === "r");
    for (const redPiece of redPieces) {
        const moves = getValidMoves(redPiece);
        for (const move of moves) {
            const originalX = parseInt(redPiece.dataset.x);
            const originalY = parseInt(redPiece.dataset.y);
            redPiece.dataset.x = move.x;
            redPiece.dataset.y = move.y;

            const stillUnderCheck = blackPieces.some(p => 
                isValidMove(p, parseInt(redKing.dataset.x), parseInt(redKing.dataset.y))
            );

            redPiece.dataset.x = originalX;
            redPiece.dataset.y = originalY;

            if (!stillUnderCheck && !checkFaceToFaceAfterMove(redPiece, move.x, move.y)) {
                return { piece: redPiece, toX: move.x, toY: move.y, targetPiece: null };
            }
        }
    }

    const kingMoves = getValidMoves(redKing);
    for (const move of kingMoves) {
        return { piece: redKing, toX: move.x, toY: move.y, targetPiece: null }; // Luôn cho Tướng di chuyển nếu bị chiếu
    }

    return null;
}

function evaluateTacticalAdvantage(piece, toX, toY, pieces) {
    let tacticalScore = 0;
    const color = piece.dataset.name[0];
    const targetPiece = pieces.find(p => parseInt(p.dataset.x) === toX && parseInt(p.dataset.y) === toY);

    // Đơn giản hóa: chỉ cộng điểm khi ăn quân
    if (targetPiece && targetPiece.dataset.name[0] !== color) {
        tacticalScore += pieceValues[targetPiece.dataset.name];
    }

    // Trừ điểm nhẹ nếu vào vùng nguy hiểm
    if (isDangerousPosition(piece, toX, toY, pieces, color)) {
        tacticalScore -= pieceValues[piece.dataset.name] * 0.5; // Giảm hệ số phạt
    }

    return tacticalScore;
}

function isStalemateForAI(pieces) {
    const redPieces = pieces.filter(p => p.dataset.name[0] === "r");
    for (const piece of redPieces) {
        const moves = getValidMoves(piece);
        for (const move of moves) {
            if (!checkFaceToFaceAfterMove(piece, move.x, move.y)) return false;
        }
    }
    return true;
}

function makeAIMove(lastOpponentMove = null) {
    console.log("Bot AI đang tính toán nước đi...");
    if (turn !== "red") return;

    if (isStalemateForAI(pieces)) {
        stopTimer();
        const modal = document.createElement("div");
        modal.className = "modal";
        modal.innerHTML = `
            <div class="modal-content">
                <p>Tôi Đã Bí Rồi Hihi.. Bạn Đi Tiếp Và Kết Thúc Ván Cờ Nhé ...</p>
                <button id="okBtn">Ok</button>
            </div>
        `;
        document.body.appendChild(modal);
        document.getElementById("okBtn").addEventListener("click", () => {
            modal.remove();
            turn = "black";
            startTimer();
        });
        return;
    }

    const bestMove = findBestMove(pieces, lastOpponentMove);
    if (bestMove) {
        const { piece, toX, toY, targetPiece } = bestMove;
        console.log(`Bot đi: ${piece.dataset.name} từ (${piece.dataset.x}, ${piece.dataset.y}) đến (${toX}, ${toY})`);
        movePiece(piece, toX, toY, targetPiece);
        stopTimer();
        startTimer();
    } else {
        console.log("Bot không tìm thấy nước đi tối ưu, chọn ngẫu nhiên...");
        const redPieces = pieces.filter(p => p.dataset.name[0] === "r");
        const validMoves = [];
        for (const piece of redPieces) {
            const moves = getValidMoves(piece);
            moves.forEach(move => {
                if (!checkFaceToFaceAfterMove(piece, move.x, move.y)) {
                    validMoves.push({ piece, toX: move.x, toY: move.y });
                }
            });
        }
        if (validMoves.length > 0) {
            const randomMove = validMoves[Math.floor(Math.random() * validMoves.length)];
            const targetPiece = pieces.find(p => parseInt(p.dataset.x) === randomMove.toX && parseInt(p.dataset.y) === randomMove.toY);
            console.log(`Bot đi ngẫu nhiên: ${randomMove.piece.dataset.name} từ (${randomMove.piece.dataset.x}, ${randomMove.piece.dataset.y}) đến (${randomMove.toX}, ${randomMove.toY})`);
            movePiece(randomMove.piece, randomMove.toX, randomMove.toY, targetPiece);
            stopTimer();
            startTimer();
        } else {
            console.log("Bot hoàn toàn không có nước đi hợp lệ!");
        }
    }
}
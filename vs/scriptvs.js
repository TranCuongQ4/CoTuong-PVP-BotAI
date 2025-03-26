// scriptvs.js
// Khởi tạo bàn cờ và quân cờ
const boardWidth = 540;
const boardHeight = 630;
const pieceSize = 54;
const cols = 9;
const rows = 10;
const cellWidth = boardWidth / cols; // 60px
const cellHeight = boardHeight / rows; // 63px

let pieces = [];
let selectedPiece = null;
let turn = "black"; // Lượt đi: đen trước, đỏ sau
let moveHistory = [];
let validMoves = []; // Lưu danh sách nước đi hợp lệ
let redCheckCount = 0; // Số lần Đỏ chiếu tướng liên tiếp
let blackCheckCount = 0; // Số lần Đen chiếu tướng liên tiếp
let lastMoveWasCheck = false; // Theo dõi nước đi trước có phải chiếu tướng không
let redTime = 60; // Thời gian khởi đầu cho mỗi lượt của Đỏ (60 giây)
let blackTime = 60; // Thời gian khởi đầu cho mỗi lượt của Đen (60 giây)
let timer = null; // Biến quản lý đồng hồ

const initialPositions = [
    // Quân đỏ
    { name: "rK", src: "../rK.png", x: 4, y: 0 }, // Tướng đỏ
    { name: "rA", src: "../rA.png", x: 3, y: 0 }, { name: "rA", src: "../rA.png", x: 5, y: 0 }, // Sĩ đỏ
    { name: "rE", src: "../rE.png", x: 2, y: 0 }, { name: "rE", src: "../rE.png", x: 6, y: 0 }, // Tượng đỏ
    { name: "rH", src: "../rH.png", x: 1, y: 0 }, { name: "rH", src: "../rH.png", x: 7, y: 0 }, // Mã đỏ
    { name: "rR", src: "../rR.png", x: 0, y: 0 }, { name: "rR", src: "../rR.png", x: 8, y: 0 }, // Xe đỏ
    { name: "rC", src: "../rC.png", x: 1, y: 2 }, { name: "rC", src: "../rC.png", x: 7, y: 2 }, // Pháo đỏ
    { name: "rP", src: "../rP.png", x: 0, y: 3 }, { name: "rP", src: "../rP.png", x: 2, y: 3 }, 
    { name: "rP", src: "../rP.png", x: 4, y: 3 }, { name: "rP", src: "../rP.png", x: 6, y: 3 }, 
    { name: "rP", src: "../rP.png", x: 8, y: 3 }, // Tốt đỏ
    // Quân đen
    { name: "bK", src: "../bK.png", x: 4, y: 9 }, // Tướng đen
    { name: "bA", src: "../bA.png", x: 3, y: 9 }, { name: "bA", src: "../bA.png", x: 5, y: 9 }, // Sĩ đen
    { name: "bE", src: "../bE.png", x: 2, y: 9 }, { name: "bE", src: "../bE.png", x: 6, y: 9 }, // Tượng đen
    { name: "bH", src: "../bH.png", x: 1, y: 9 }, { name: "bH", src: "../bH.png", x: 7, y: 9 }, // Mã đen
    { name: "bR", src: "../bR.png", x: 0, y: 9 }, { name: "bR", src: "../bR.png", x: 8, y: 9 }, // Xe đen
    { name: "bC", src: "../bC.png", x: 1, y: 7 }, { name: "bC", src: "../bC.png", x: 7, y: 7 }, // Pháo đen
    { name: "bP", src: "../bP.png", x: 0, y: 6 }, { name: "bP", src: "../bP.png", x: 2, y: 6 }, 
    { name: "bP", src: "../bP.png", x: 4, y: 6 }, { name: "bP", src: "../bP.png", x: 6, y: 6 }, 
    { name: "bP", src: "../bP.png", x: 8, y: 6 }  // Tốt đen
];

// Ánh xạ tên quân cờ sang tiếng Việt
const pieceNames = {
    "rK": "Tướng Đỏ", "rA": "Sĩ Đỏ", "rE": "Tượng Đỏ", "rH": "Mã Đỏ", "rR": "Xe Đỏ", "rC": "Pháo Đỏ", "rP": "Tốt Đỏ",
    "bK": "Tướng Đen", "bA": "Sĩ Đen", "bE": "Tượng Đen", "bH": "Mã Đen", "bR": "Xe Đen", "bC": "Pháo Đen", "bP": "Tốt Đen"
};

// Khởi tạo bàn cờ
function initBoard() {
    pieces = [];
    const piecesContainer = document.getElementById("pieces");
    piecesContainer.innerHTML = "";
    initialPositions.forEach(pos => {
        const piece = document.createElement("img");
        piece.src = pos.src;
        piece.className = "piece";
        piece.dataset.name = pos.name;
        piece.dataset.x = pos.x;
        piece.dataset.y = pos.y;
        piece.style.left = `${pos.x * cellWidth}px`;
        piece.style.top = `${pos.y * cellHeight}px`;
        if (pos.name[0] === "b") {
            piece.addEventListener("click", handlePieceClick);
        }
        piecesContainer.appendChild(piece);
        pieces.push(piece);
    });
    redCheckCount = 0;
    blackCheckCount = 0;
    lastMoveWasCheck = false;
    redTime = 60; // Reset về 60 giây khi khởi tạo
    blackTime = 60; // Reset về 60 giây khi khởi tạo
    if (timer) clearInterval(timer);
    updateClockDisplay();
    turn = "black"; // Đen đi trước
}

// Cập nhật giao diện bàn cờ
function renderBoard() {
    pieces.forEach(piece => {
        piece.style.left = `${parseInt(piece.dataset.x) * cellWidth}px`;
        piece.style.top = `${parseInt(piece.dataset.y) * cellHeight}px`;
    });
}

// Xử lý sự kiện khi click vào quân cờ
function handlePieceClick(e) {
    const piece = e.target;
    const color = piece.dataset.name[0] === "r" ? "red" : "black";

    if (turn !== color) return;

    if (selectedPiece === piece) {
        clearSelection();
    } else {
        clearSelection();
        selectedPiece = piece;
        piece.classList.add("selected");
        showValidMoves(piece);
    }
}

// Xử lý click vào bàn cờ (di chuyển đến ô trống hoặc ăn quân)
document.getElementById("chessBoard").addEventListener("click", (e) => {
    if (!selectedPiece) return;

    const rect = e.target.getBoundingClientRect();
    const offsetX = e.clientX - rect.left;
    const offsetY = e.clientY - rect.top;
    const toX = Math.floor(offsetX / cellWidth);
    const toY = Math.floor(offsetY / cellHeight);

    const targetPiece = pieces.find(p => parseInt(p.dataset.x) === toX && parseInt(p.dataset.y) === toY);
    movePiece(selectedPiece, toX, toY, targetPiece || null);
});

// Di chuyển quân cờ
function movePiece(fromPiece, toX, toY, toPiece) {
    const fromX = parseInt(fromPiece.dataset.x);
    const fromY = parseInt(fromPiece.dataset.y);

    if (isValidMove(fromPiece, toX, toY)) {
        if (checkFaceToFaceAfterMove(fromPiece, toX, toY)) {
            alert("Tướng Đối Mặt Sao Đi Vào Được Bạn Ơi!...kkk...");
            return;
        }

        const isCheckAfterMove = willCauseCheck(fromPiece, toX, toY);
        if (isCheckAfterMove) {
            if (turn === "red") {
                if (redCheckCount >= 5) {
                    alert("Bot AI đã chiếu tướng đối phương 5 lần liên tiếp rồi phải thay đổi nước cờ mới thôi!...kkk...");
                    return;
                }
            } else {
                if (blackCheckCount >= 5) {
                    alert("Bạn đã chiếu tướng đối phương 5 lần liên tiếp rồi phải thay đổi nước cờ mới thôi!...kkk...");
                    return;
                }
            }
        }

        recordMove(fromPiece, fromX, fromY, toX, toY);
        fromPiece.dataset.x = toX;
        fromPiece.dataset.y = toY;

        if (toPiece) {
            toPiece.remove();
            pieces = pieces.filter(p => p !== toPiece);
            if (toPiece.dataset.name === "rK" || toPiece.dataset.name === "bK") {
                const winner = toPiece.dataset.name === "rK" ? "Đen" : "Đỏ";
                endGame(winner);
                return;
            }
        }

        renderBoard();
        clearSelection();

        if (isCheckAfterMove) {
            if (turn === "red") {
                redCheckCount++;
                blackCheckCount = 0;
            } else {
                blackCheckCount++;
                redCheckCount = 0;
            }
            lastMoveWasCheck = true;
        } else {
            if (turn === "red") {
                redCheckCount = 0;
            } else {
                blackCheckCount = 0;
            }
            lastMoveWasCheck = false;
        }

        // Chuyển lượt và reset thời gian cho lượt mới
        turn = turn === "red" ? "black" : "red";
        if (turn === "red") {
            redTime = 60; // Reset thời gian cho lượt của Đỏ
            blackTime = 60; // Đảm bảo thời gian của Đen không giảm khi không phải lượt của nó
        } else {
            blackTime = 60; // Reset thời gian cho lượt của Đen
            redTime = 60; // Đảm bảo thời gian của Đỏ không giảm khi không phải lượt của nó
        }
        stopTimer();
        startTimer(); // Khởi động timer cho lượt mới

        checkKingInCheck();

        console.log("Lượt hiện tại: " + turn);
        if (turn === "red") {
            setTimeout(makeAIMove, 1000); // Gọi Bot AI khi đến lượt Đỏ
        }
    }
}

// Kiểm tra nước đi hợp lệ
function isValidMove(piece, toX, toY) {
    const fromX = parseInt(piece.dataset.x);
    const fromY = parseInt(piece.dataset.y);
    const name = piece.dataset.name;

    if (toX < 0 || toX >= cols || toY < 0 || toY >= rows) return false;

    const targetPiece = pieces.find(p => parseInt(p.dataset.x) === toX && parseInt(p.dataset.y) === toY);
    if (targetPiece && targetPiece.dataset.name[0] === name[0]) return false;

    let isValid = false;
    switch (name[1]) {
        case "K": isValid = moveKing(fromX, fromY, toX, toY, name[0]); break;
        case "A": isValid = moveAdvisor(fromX, fromY, toX, toY, name[0]); break;
        case "E": isValid = moveElephant(fromX, fromY, toX, toY, name[0]); break;
        case "H": isValid = moveHorse(fromX, fromY, toX, toY); break;
        case "R": isValid = moveRook(fromX, fromY, toX, toY); break;
        case "C": isValid = moveCannon(fromX, fromY, toX, toY); break;
        case "P": isValid = movePawn(fromX, fromY, toX, toY, name[0]); break;
    }
    return isValid;
}

// Hàm di chuyển cho từng quân cờ
function moveKing(x, y, toX, toY, color) {
    const palace = color === "r" ? [[3, 0], [5, 2]] : [[3, 7], [5, 9]];
    if (toX < palace[0][0] || toX > palace[1][0] || toY < palace[0][1] || toY > palace[1][1]) return false;
    if (Math.abs(toX - x) + Math.abs(toY - y) !== 1) return false;
    return true;
}

function moveAdvisor(x, y, toX, toY, color) {
    const palace = color === "r" ? [[3, 0], [5, 2]] : [[3, 7], [5, 9]];
    if (toX < palace[0][0] || toX > palace[1][0] || toY < palace[0][1] || toY > palace[1][1]) return false;
    if (Math.abs(toX - x) !== 1 || Math.abs(toY - y) !== 1) return false;
    return true;
}

function moveElephant(x, y, toX, toY, color) {
    if (color === "r" && toY > 4) return false;
    if (color === "b" && toY < 5) return false;
    if (Math.abs(toX - x) !== 2 || Math.abs(toY - y) !== 2) return false;
    const midX = (x + toX) / 2;
    const midY = (y + toY) / 2;
    if (pieces.some(p => parseInt(p.dataset.x) === midX && parseInt(p.dataset.y) === midY)) return false;
    return true;
}

function moveHorse(x, y, toX, toY) {
    const dx = Math.abs(toX - x);
    const dy = Math.abs(toY - y);
    if (!((dx === 2 && dy === 1) || (dx === 1 && dy === 2))) return false;
    const blockX = dx === 2 ? (x + toX) / 2 : x;
    const blockY = dy === 2 ? (y + toY) / 2 : y;
    if (pieces.some(p => parseInt(p.dataset.x) === blockX && parseInt(p.dataset.y) === blockY)) return false;
    return true;
}

function moveRook(x, y, toX, toY) {
    if (x !== toX && y !== toY) return false;
    const step = x === toX ? (toY > y ? 1 : -1) : (toX > x ? 1 : -1);
    const range = x === toX ? Math.abs(toY - y) : Math.abs(toX - x);
    for (let i = 1; i < range; i++) {
        const checkX = x === toX ? x : x + i * step;
        const checkY = y === toY ? y : y + i * step;
        if (pieces.some(p => parseInt(p.dataset.x) === checkX && parseInt(p.dataset.y) === checkY)) return false;
    }
    return true;
}

function moveCannon(x, y, toX, toY) {
    if (x !== toX && y !== toY) return false;
    const step = x === toX ? (toY > y ? 1 : -1) : (toX > x ? 1 : -1);
    const range = x === toX ? Math.abs(toY - y) : Math.abs(toX - x);
    const target = pieces.find(p => parseInt(p.dataset.x) === toX && parseInt(p.dataset.y) === toY);
    const count = pieces.filter(p => {
        const px = parseInt(p.dataset.x);
        const py = parseInt(p.dataset.y);
        if (x === toX) return px === x && py > Math.min(y, toY) && py < Math.max(y, toY);
        return py === y && px > Math.min(x, toX) && px < Math.max(x, toX);
    }).length;
    if (target && count !== 1) return false;
    if (!target && count !== 0) return false;
    return true;
}

function movePawn(x, y, toX, toY, color) {
    const forward = color === "r" ? 1 : -1;
    const hasCrossedRiver = color === "r" ? y >= 5 : y <= 4;
    if (!hasCrossedRiver) {
        if (toX !== x || toY - y !== forward) return false;
    } else {
        if (!((toX === x && toY - y === forward) || (toY === y && Math.abs(toX - x) === 1))) return false;
    }
    return true;
}

// Kiểm tra hai tướng đối mặt sau khi di chuyển
function checkFaceToFaceAfterMove(piece, toX, toY) {
    const color = piece.dataset.name[0];
    const isKing = piece.dataset.name[1] === "K";
    const king = pieces.find(p => p.dataset.name === (color === "r" ? "rK" : "bK"));
    const opponentKing = pieces.find(p => p.dataset.name === (color === "r" ? "bK" : "rK"));
    if (!king || !opponentKing) return false;

    const kingX = isKing ? toX : parseInt(king.dataset.x);
    const kingY = isKing ? toY : parseInt(king.dataset.y);
    const oppX = parseInt(opponentKing.dataset.x);
    const oppY = parseInt(opponentKing.dataset.y);

    const targetPiece = pieces.find(p => parseInt(p.dataset.x) === toX && parseInt(p.dataset.y) === toY);
    if (targetPiece && (targetPiece.dataset.name === "rK" || targetPiece.dataset.name === "bK")) {
        return false; // Cho phép nước đi này, vì nó ăn Tướng đối phương
    }

    if (kingX !== oppX) return false;

    const originalX = parseInt(piece.dataset.x);
    const originalY = parseInt(piece.dataset.y);
    piece.dataset.x = toX;
    piece.dataset.y = toY;

    let isFacing = true;
    for (let y = Math.min(kingY, oppY) + 1; y < Math.max(kingY, oppY); y++) {
        if (pieces.some(p => parseInt(p.dataset.x) === kingX && parseInt(p.dataset.y) === y)) {
            isFacing = false;
            break;
        }
    }

    piece.dataset.x = originalX;
    piece.dataset.y = originalY;

    return isFacing;
}

// Kiểm tra xem nước đi có gây chiếu tướng không
function willCauseCheck(piece, toX, toY) {
    const originalX = parseInt(piece.dataset.x);
    const originalY = parseInt(piece.dataset.y);
    const targetPiece = pieces.find(p => parseInt(p.dataset.x) === toX && parseInt(p.dataset.y) === toY);

    piece.dataset.x = toX;
    piece.dataset.y = toY;
    if (targetPiece) {
        pieces = pieces.filter(p => p !== targetPiece);
    }

    const opponentKing = pieces.find(p => p.dataset.name === (turn === "red" ? "bK" : "rK"));
    const isCheck = opponentKing && pieces.some(p => p.dataset.name[0] !== opponentKing.dataset.name[0] && isValidMove(p, parseInt(opponentKing.dataset.x), parseInt(opponentKing.dataset.y)));

    piece.dataset.x = originalX;
    piece.dataset.y = originalY;
    if (targetPiece) {
        pieces.push(targetPiece);
    }

    return isCheck;
}

// Kiểm tra chiếu tướng hiện tại
function checkKingInCheck() {
    const king = pieces.find(p => p.dataset.name === (turn === "red" ? "rK" : "bK"));
    if (!king) return;

    const kingX = parseInt(king.dataset.x);
    const kingY = parseInt(king.dataset.y);

    for (const piece of pieces) {
        if (piece.dataset.name[0] !== turn[0] && isValidMove(piece, kingX, kingY)) {
            alert(`${turn === "red" ? "Đỏ" : "Đen"} đang bị chiếu tướng!`);
            break;
        }
    }
}

// Hiển thị nước đi hợp lệ
function showValidMoves(piece) {
    validMoves = getValidMoves(piece);
    validMoves.forEach(move => {
        const { x, y } = move;
        const marker = document.createElement("div");
        marker.className = "valid-move";
        marker.style.left = `${x * cellWidth + cellWidth / 2}px`; // Căn giữa ô theo trục x
        marker.style.top = `${y * cellHeight + cellHeight / 2}px`; // Căn giữa ô theo trục y
        marker.addEventListener("click", () => movePiece(piece, x, y, pieces.find(p => parseInt(p.dataset.x) === x && parseInt(p.dataset.y) === y)));
        document.getElementById("pieces").appendChild(marker);
    });
}

// Lấy danh sách nước đi hợp lệ
function getValidMoves(piece) {
    const moves = [];
    for (let x = 0; x < cols; x++) {
        for (let y = 0; y < rows; y++) {
            if (isValidMove(piece, x, y) && !checkFaceToFaceAfterMove(piece, x, y)) {
                moves.push({ x, y });
            }
        }
    }
    return moves;
}

// Xóa lựa chọn và nước đi hợp lệ
function clearSelection() {
    if (selectedPiece) {
        selectedPiece.classList.remove("selected");
        selectedPiece = null;
    }
    document.querySelectorAll(".valid-move").forEach(marker => marker.remove());
    validMoves = [];
}

// Ghi lại lịch sử nước đi với tên tiếng Việt
function recordMove(piece, fromX, fromY, toX, toY) {
    const pieceName = pieceNames[piece.dataset.name];
    const move = `${pieceName}: (${fromX}, ${fromY}) -> (${toX}, ${toY})`;
    moveHistory.push(move);
    const historyList = document.getElementById("moveHistory");
    const li = document.createElement("li");
    li.textContent = move;
    historyList.appendChild(li);
}

// Kết thúc ván cờ
function endGame(winner) {
    stopTimer();
    alert(`Trò chơi kết thúc! ${winner} thắng!`);
    initBoard();
    moveHistory = [];
    document.getElementById("moveHistory").innerHTML = "";
    turn = "black"; // Đen đi trước khi bắt đầu lại
    document.getElementById("welcomeModal").style.display = "flex";
}

// Cập nhật hiển thị đồng hồ
function updateClockDisplay() {
    const redMinutes = Math.floor(redTime / 60);
    const redSeconds = Math.floor(redTime % 60);
    const blackMinutes = Math.floor(blackTime / 60);
    const blackSeconds = Math.floor(blackTime % 60);
    document.getElementById("redClock").textContent = `${redMinutes}:${redSeconds < 10 ? "0" + redSeconds : redSeconds}`;
    document.getElementById("blackClock").textContent = `${blackMinutes}:${blackSeconds < 10 ? "0" + blackSeconds : blackSeconds}`;
}

// Bắt đầu đồng hồ cho lượt hiện tại
function startTimer() {
    if (timer) clearInterval(timer);
    timer = setInterval(() => {
        if (turn === "red") {
            redTime--;
            if (redTime <= 0) {
                stopTimer();
                alert("Bot hết thời gian trong lượt này, bạn thắng!");
                endGame("Đen");
            }
        } else {
            blackTime--;
            if (blackTime <= 0) {
                stopTimer();
                alert("Bạn hết thời gian trong lượt này, Bot thắng!");
                endGame("Đỏ");
            }
        }
        updateClockDisplay();
    }, 1000);
}

// Dừng đồng hồ
function stopTimer() {
    if (timer) clearInterval(timer);
}

// Kết thúc ván cờ
function endGame(winner) {
    stopTimer();
    alert(`Trò chơi kết thúc! ${winner} thắng!`);
    initBoard();
    moveHistory = [];
    document.getElementById("moveHistory").innerHTML = "";
    turn = "black"; // Đen đi trước khi bắt đầu lại
    document.getElementById("welcomeModal").style.display = "flex";
}

// Sự kiện nút "Bắt Đầu"
document.getElementById("startBtn").addEventListener("click", () => {
    document.getElementById("welcomeModal").style.display = "none";
    turn = "black"; // Đen đi trước
    blackTime = 60; // Reset thời gian cho lượt đầu của Đen
    redTime = 60; // Reset thời gian cho Đỏ
    startTimer();
    console.log("Trò chơi bắt đầu, lượt của Đen");
});

// Sự kiện nút "Đồng Ý" trong modal xác nhận
document.getElementById("confirmYesBtn").addEventListener("click", () => {
    initBoard();
    moveHistory = [];
    document.getElementById("moveHistory").innerHTML = "";
    turn = "black"; // Đen đi trước khi chơi lại
    blackTime = 60; // Reset thời gian khi chơi lại
    redTime = 60; // Reset thời gian khi chơi lại
    clearSelection();
    document.getElementById("confirmModal").style.display = "none";
    document.getElementById("welcomeModal").style.display = "flex";
});

// Sự kiện reload với modal xác nhận
document.getElementById("reloadBtn").addEventListener("click", () => {
    document.getElementById("confirmModal").style.display = "flex";
});

// Sự kiện nút "Không" trong modal xác nhận
document.getElementById("confirmNoBtn").addEventListener("click", () => {
    document.getElementById("confirmModal").style.display = "none";
});

// Sự kiện nút "Đồng Ý" trong modal xác nhận
document.getElementById("confirmYesBtn").addEventListener("click", () => {
    initBoard();
    moveHistory = [];
    document.getElementById("moveHistory").innerHTML = "";
    turn = "black"; // Đen đi trước khi chơi lại
    clearSelection();
    document.getElementById("confirmModal").style.display = "none";
    document.getElementById("welcomeModal").style.display = "flex";
});

// Sự kiện nút "Luật Cờ Tướng"
document.getElementById("rulesBtn").addEventListener("click", () => {
    document.getElementById("rulesModal").style.display = "flex";
});

// Sự kiện nút "Đóng" trong modal luật chơi
document.getElementById("closeRulesBtn").addEventListener("click", () => {
    document.getElementById("rulesModal").style.display = "none";
});

// Sự kiện nút "Bắt Đầu"
document.getElementById("startBtn").addEventListener("click", () => {
    document.getElementById("welcomeModal").style.display = "none";
    turn = "black"; // Đen đi trước
    startTimer();
    console.log("Trò chơi bắt đầu, lượt của Đen");
});

// Sự kiện nút "Vô Hai Người Đấu Nhau"
document.getElementById("twoPlayerBtn").addEventListener("click", () => {
    document.getElementById("twoPlayerModal").style.display = "flex";
});

// Sự kiện nút "Không" trong modal chế độ 2 người
document.getElementById("twoPlayerNoBtn").addEventListener("click", () => {
    document.getElementById("twoPlayerModal").style.display = "none";
});

// Sự kiện nút "Ok" trong modal chế độ 2 người
document.getElementById("twoPlayerOkBtn").addEventListener("click", () => {
    window.location.href = "../index.html"; // Chuyển về trang index.html ở thư mục gốc
});

// Khởi chạy trò chơi
initBoard();
document.getElementById("welcomeModal").style.display = "flex";
// 獲取畫布元素及其上下文
const canvas = document.getElementById('game'); // 繪製遊戲的畫布
const ctx = canvas.getContext('2d'); // 獲取 2D 繪圖上下文
// 監聽鍵盤事件
document.body.addEventListener("keydown", keyDown); // 監聽鍵盤按鍵用於控制蛇的方向
// 定義貪吃蛇的身體部分
class SnakePart {
    constructor(x, y) {
        this.x = x; // X 坐標
        this.y = y; // Y 坐標
    }
}

// 初始化音效
let backgroundMusic = new Audio('assets/sounds/background-music.mp3');
backgroundMusic.loop = true; // 背景音樂循環播放
backgroundMusic.volume = 0.5; // 設定預設音量

let eatAppleSound = new Audio('assets/sounds/eat-apple.mp3'); // 吃蘋果音效
let gameOverSound = new Audio('assets/sounds/game-over.mp3'); // 遊戲結束音效

// 音量控制滑桿
const bgmVolumeSlider = document.getElementById('bgm-volume');
const sfxVolumeSlider = document.getElementById('sfx-volume');
const bgmToggleButton = document.getElementById('bgm-toggle'); 

// 同步背景音樂音量滑桿
bgmVolumeSlider.addEventListener('input', (event) => {
    backgroundMusic.volume = event.target.value; // 根據滑桿更新背景音樂音量
});

// 同步音效音量滑桿
sfxVolumeSlider.addEventListener('input', (event) => {
    const newVolume = event.target.value; // 根據滑桿獲取新音量
    eatAppleSound.volume = newVolume; // 設定吃蘋果音效音量
    gameOverSound.volume = newVolume;  // 設定遊戲結束音效音量
});

// 背景音樂播放/暫停按鈕
bgmToggleButton.addEventListener('click', () => {
    if (backgroundMusic.paused) { // 如果音樂暫停
        backgroundMusic.play(); // 播放背景音樂
        bgmToggleButton.innerText = '背景音樂：播放'; // 更新按鈕文字
    } else {
        backgroundMusic.pause(); // 暫停背景音樂
        bgmToggleButton.innerText = '背景音樂：暫停'; // 更新按鈕文字
    }
});
// 初始化遊戲參數
let speed = 4; // 初始速度較慢
let timeLimit = 30; // 倒數計時的秒數
let timer = timeLimit; // 初始化計時器
let tileCount = 20; // 畫布分割數
let tileSize = canvas.width / tileCount - 2; // 單格大小
let headX = 10; // 蛇頭初始 X 坐標
let headY = 10; // 蛇頭初始 Y 坐標
const snakePart = [];  // 蛇的身體部分
let tailLen = 0; // 初始尾巴長度
let highScores = []; // 用於存儲分數記錄
let mode = "normal"; // 預設為正常模式

let appleX = 5; // 蘋果初始 X 坐標
let appleY = 5; // 蘋果初始 Y 坐標

let xV = 1; // 蛇的水平速度
let yV = 0; // 蛇的垂直速度

let score = 0;  // 初始分數

// 初始化遊戲
function initializeGame() {
    selectMode(); // 顯示模式選擇按鈕
}

// 創建主題選擇按鈕
function selectMode() {
    // 創建按鈕容器
    const buttonContainer = document.createElement("div");
    buttonContainer.style = `
        position: fixed; /* 固定位置以適應螢幕 */
        top: 50%; /* 垂直居中 */
        left: 50%; /* 水平居中 */
        transform: translate(-50%, -50%); /* 平移使容器居中 */
        display: flex;
        flex-direction: column; /* 內容垂直排列 */
        align-items: center; /* 子元素水平居中 */
        gap: 20px; /* 按鈕之間的距離 */
        background: rgba(0, 0, 0, 0.8); /* 背景顏色和透明度 */
        padding: 30px; /* 增大內邊距 */
        border-radius: 15px; /* 圓角邊框 */
        box-shadow: 0 0 10px rgba(255, 255, 255, 0.5); /* 添加陰影 */
    `;

    const title = document.createElement("h1");
    title.innerText = "選擇遊戲模式";
    title.style = `
        color: white;
        font-size: 36px; /* 增大字體大小 */
        font-weight: bold; /* 加粗字體 */
        margin-bottom: 20px;
        text-align: center; /* 居中對齊 */
    `;
    buttonContainer.appendChild(title);

    const modes = [
        { name: "正常模式", value: "normal" }, // 正常模式
        { name: "計時模式", value: "timer" }, // 計時模式
    ];

    modes.forEach((modeOption) => { 
        const button = document.createElement("button"); // 創建模式按鈕
        button.innerText = modeOption.name; // 按鈕文字
        button.style = `
            padding: 15px 30px;
            font-size: 20px;
            font-weight: bold;
            background-color: #ffb600;
            color: white;
            border: none;
            cursor: pointer;
            border-radius: 10px;
            transition: transform 0.2s ease, background-color 0.3s ease;
        `;
        button.addEventListener("mouseover", () => {
            button.style.transform = "scale(1.1)";
        });
        button.addEventListener("mouseout", () => {
            button.style.transform = "scale(1)";
        });
        button.addEventListener("click", () => {
            mode = modeOption.value; // 設定選擇的模式
            document.body.removeChild(buttonContainer); // 移除按鈕界面
        
            if (mode === "timer") {
                startTimer(); // 如果是計時模式，啟動計時器
            }
        
            startGame(); // 開始遊戲
        });
        buttonContainer.appendChild(button); // 添加按鈕到容器
    });

    document.body.appendChild(buttonContainer); // 添加容器到頁面 
}

// 應用主題樣式
function applyTheme(theme) {
    const themes = {
        grass: "linear-gradient(to bottom,rgb(182, 206, 182),rgb(28, 81, 51))",
        night: "linear-gradient(to bottom,rgba(198, 204, 212, 0.93),rgb(66, 66, 72))",
        ocean: "linear-gradient(to bottom,rgb(194, 234, 249),rgb(66, 92, 118))"
    };
    document.body.style.background = themes[theme] || "black"; // 根據主題設置背景
}

function updateStats() {
    const scoreElement = document.getElementById("score-display");
    const timerElement = document.getElementById("timer-display");

    // 更新分數
    if (scoreElement) {
        scoreElement.innerText = `分數: ${score}`;
    }

    // 更新計時器（僅計時模式下顯示）
    if (timerElement) {
        timerElement.innerText = mode === "timer" ? `時間剩餘: ${timer} 秒` : "";
    }
}

// 遊戲主邏輯
// 啟動背景音樂
function startGame() {
    if (backgroundMusic.paused) {
        backgroundMusic.play(); // 播放背景音樂
    }

    if (mode === "timer" && timer <= 0) {
        return; // 計時結束停止遊戲
    }

    snakePosition(); // 更新蛇的位置
    if (isOver()) {
        return; // 若遊戲結束則停止
    }

    clearScreen();  // 清理畫布
    checkColli(); // 檢查是否吃到蘋果
    drawApple(); // 繪製蘋果
    drawSnake(); // 繪製蛇
    updateStats(); // 更新分數與計時器

    let currentSpeed = speed;
    if (mode === "normal") {
        currentSpeed = Math.max(2, 10 - Math.floor(score / 5));
    } else if (mode === "timer" && score >= 3) {
        currentSpeed = Math.min(10, speed + Math.floor((score - 3) / 2));
    }

    setTimeout(startGame, 1000 / currentSpeed); // 根據速度調整遊戲更新頻率
}

let timerInterval; // 用於保存計時器的 ID

function startTimer() {
    if (mode === "timer") {
        timerInterval = setInterval(() => {
            if (timer <= 0) {
                clearInterval(timerInterval); // 停止計時
                gameOver(); // 顯示遊戲結束
                return;
            }
            timer--; // 每秒減少
            updateStats(); // 更新顯示
        }, 1000); // 每秒執行一次
    }
}


function drawTimer() {
    if (mode !== "timer") return; // 如果不是倒數計時模式，直接返回

    ctx.fillStyle = "white";
    ctx.font = "24px 'SetoFont', sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("時間剩餘: " + timer + " 秒", canvas.width / 2, 60); // 顯示時間在畫布頂部
}

function isOver() {
    if (headX < 0 || headX >= tileCount || headY < 0 || headY >= tileCount) {
        gameOver();
        return true;
    }
    for (let i = 0; i < snakePart.length; i++) {
        if (headX === snakePart[i].x && headY === snakePart[i].y) {
            gameOver();
            return true;
        }
    }
    return false;
}

function clearScreen() {
    ctx.fillStyle = 'black';
    ctx.fillRect(0, 0, 400, 400);
}

function drawSnake() {
    ctx.fillStyle = "green";
    for (let i = 0; i < snakePart.length; i++) {
        let part = snakePart[i];
        ctx.fillRect(part.x * tileCount, part.y * tileCount, tileSize, tileSize);
    }

    snakePart.push(new SnakePart(headX, headY));
    if (snakePart.length > tailLen) {
        snakePart.shift();
    }

    ctx.fillStyle = 'orange';
    ctx.fillRect(headX * tileCount, headY * tileCount, tileSize, tileSize);
}

function drawApple() {
    ctx.fillStyle = "red";
    ctx.fillRect(appleX * tileCount, appleY * tileCount, tileSize, tileSize);
}

function drawScore() {
    ctx.fillStyle = "white";
    ctx.font = "24px 'SetoFont', sans-serif"; // 增大字體大小
    ctx.textAlign = "center"; // 將文字對齊設為居中
    ctx.fillText("Score: " + score, canvas.width / 2, 30); // 放置於畫布頂部中間
}

function checkColli() {
    if (appleX === headX && appleY === headY) {
        appleX = Math.floor(Math.random() * tileCount);
        appleY = Math.floor(Math.random() * tileCount);
        tailLen++;
        score++;

        // 播放吃到蘋果音效
        eatAppleSound.volume = 0.8;
        eatAppleSound.play();

        if (mode === "timer" && score >= 3) {
            speed++; // 提升速度
        }
    }
}

function snakePosition() {
    headX += xV; // 根據水平速度更新 X 位置
    headY += yV; // 根據垂直速度更新 Y 位置
}

// 阻止箭頭鍵的默認滾動行為
window.addEventListener("keydown", function (event) {
    if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(event.key)) {
        event.preventDefault();
    }
});

// 監聽鍵盤事件，控制貪吃蛇移動
document.body.addEventListener("keydown", keyDown);

function keyDown(event) {
    // 向上移動
    if (event.key === "ArrowUp") {
        if (yV === 1) return; // 防止蛇反向移動
        yV = -1;
        xV = 0;
    }

    // 向下移動
    if (event.key === "ArrowDown") {
        if (yV === -1) return;
        yV = 1;
        xV = 0;
    }

    // 向左移動
    if (event.key === "ArrowLeft") {
        if (xV === 1) return;
        yV = 0;
        xV = -1;
    }

    // 向右移動
    if (event.key === "ArrowRight") {
        if (xV === -1) return;
        yV = 0;
        xV = 1;
    }
}

function playAgain(event) {
    if (event.keyCode === 32) {
        location.reload();
    }
}

function updateHighScores() {
    // 從 localStorage 中讀取現存的排行榜數據
    const storedScores = localStorage.getItem('highScores');
    if (storedScores) {
        highScores = JSON.parse(storedScores); // 解析已保存的排行榜數據
    }

    // 如果分數大於 0 且未在排行榜中，則添加
    if (score > 0 && !highScores.includes(score)) {
        highScores.push(score);
    }

    // 保留最多 5 條記錄
    highScores = highScores.slice(0, 5);

    // 保存更新後的排行榜數據到 localStorage
    localStorage.setItem('highScores', JSON.stringify(highScores));
}

function displayHighScores() { // 創建獨立的排行榜容器
    const highScoreContainer = document.createElement("div");
    highScoreContainer.style = `
    position: fixed;
    top: 10%; /* 顯示在畫面頂部 */
    right: 17%; /* 靠右顯示 */
    background: rgba(0, 0, 0, 0.8); /* 半透明背景 */
    color: white;
    padding: 20px;
    border-radius: 10px;
    box-shadow: 0 0 10px rgba(255, 255, 255, 0.5);
    font-family: 'SetoFont', sans-serif;
    font-size: 25px;
    max-width: 200px; /* 限制最大寬度 */
`;

// 標題
const title = document.createElement("h2");
title.innerText = "最高分紀錄";
title.style = `
    text-align: center;
    margin-bottom: 20px;
`;
highScoreContainer.appendChild(title);

// 從 localStorage 中讀取排行榜數據
const storedScores = localStorage.getItem('highScores');
if (storedScores) {
    highScores = JSON.parse(storedScores);
}

// 顯示分數列表
highScores.forEach((highScore, index) => {
    const scoreItem = document.createElement("div");
    scoreItem.innerText = `${index + 1}. 分數: ${highScore}`;
    highScoreContainer.appendChild(scoreItem);
});

 // 添加清除歷史紀錄按鈕
 const clearButton = document.createElement("button");
 clearButton.innerText = "清除歷史紀錄";
 clearButton.style = `
     margin-top: 10px;
     padding: 10px 15px;
     font-size: 14px;
     background-color:rgb(158, 63, 63);
     color: white;
     border: none;
     cursor: pointer;
     border-radius: 5px;
 `;
 clearButton.addEventListener("click", () => {
     localStorage.removeItem('highScores'); // 清除排行榜數據
     highScores = []; // 重置本地數據
     highScoreContainer.remove(); // 移除舊的排行榜
     displayHighScores(); // 刷新排行榜
 });

highScoreContainer.appendChild(clearButton);

// 添加分數紀錄到頁面
document.body.appendChild(highScoreContainer);
}

// 在 gameOver 中停止背景音樂
function gameOver(reason) {
    if (gameOver.called) return; // 防止多次執行
    gameOver.called = true;

    // 停止背景音樂
    backgroundMusic.pause();
    backgroundMusic.currentTime = 0; // 將音樂重置到開始位置

    // 播放遊戲結束音效
    gameOverSound.volume = 0.8;
    gameOverSound.play();

    if (timerInterval) {
        clearInterval(timerInterval);
    }

    updateHighScores(); // 更新分數記錄
    displayHighScores(); // 顯示排行榜

    const restartButton = document.createElement("button");
    restartButton.innerText = "重新開始";
    restartButton.style = `
        position: fixed;
        left: 50%;
        transform: translateX(-50%);
        padding: 10px 20px;
        font-size: 30px;
        background-color: #ffb600;
        color: white;
        border: none;
        cursor: pointer;
        border-radius: 5px;
        box-shadow: 0 0 10px rgba(255, 255, 255, 0.5);
    `;
    restartButton.addEventListener("click", () => {
        location.reload(); // 重新加載頁面
    });
    document.body.appendChild(restartButton);

    console.log(reason); // 顯示遊戲結束原因
}
gameOver.called = false; // 初始化防重入標記

// 初始化遊戲
initializeGame();
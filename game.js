// ==========================================
// 常量定义
// ==========================================
const GRID_SIZE = 20;           // 网格大小（20x20格）
const CELL_SIZE = 20;           // 每格像素大小（20px）
const INITIAL_SNAKE_LENGTH = 3; // 初始蛇长度

// 难度配置
const DIFFICULTY_SETTINGS = {
    easy: { speed: 200, name: '简单' },
    medium: { speed: 150, name: '中等' },
    hard: { speed: 100, name: '困难' }
};

// 方向常量
const DIRECTIONS = {
    UP: 'UP',
    DOWN: 'DOWN',
    LEFT: 'LEFT',
    RIGHT: 'RIGHT'
};

// ==========================================
// 全局变量
// ==========================================
let canvas, ctx;
let snake = [];
let food = null;
let direction = DIRECTIONS.RIGHT;
let nextDirection = DIRECTIONS.RIGHT;
let gameInterval = null;
let score = 0;
let highScore = 0;
let gameState = 'ready'; // 'ready', 'playing', 'paused', 'gameover'
let currentDifficulty = 'easy';

// ==========================================
// 初始化函数
// ==========================================
function init() {
    // 获取Canvas元素和上下文
    canvas = document.getElementById('gameCanvas');
    ctx = canvas.getContext('2d');
    
    // 加载最高分
    loadHighScore();
    
    // 初始化游戏
    resetGame();
    
    // 绑定事件监听器
    setupEventListeners();
    
    // 绘制初始画面
    draw();
}

// ==========================================
// 加载最高分
// ==========================================
function loadHighScore() {
    try {
        const saved = localStorage.getItem('snakeHighScore');
        highScore = saved ? parseInt(saved) : 0;
        document.getElementById('high-score').textContent = highScore;
    } catch (e) {
        console.warn('无法访问localStorage，最高分功能将不可用');
        highScore = 0;
    }
}

// ==========================================
// 保存最高分
// ==========================================
function saveHighScore() {
    try {
        localStorage.setItem('snakeHighScore', highScore.toString());
    } catch (e) {
        console.warn('无法保存最高分到localStorage');
    }
}

// ==========================================
// 重置游戏
// ==========================================
function resetGame() {
    // 清除游戏循环
    if (gameInterval) {
        clearInterval(gameInterval);
        gameInterval = null;
    }
    
    // 初始化蛇（从中心位置开始）
    snake = [];
    const startX = Math.floor(GRID_SIZE / 2);
    const startY = Math.floor(GRID_SIZE / 2);
    
    for (let i = 0; i < INITIAL_SNAKE_LENGTH; i++) {
        snake.push({ x: startX - i, y: startY });
    }
    
    // 初始化方向
    direction = DIRECTIONS.RIGHT;
    nextDirection = DIRECTIONS.RIGHT;
    
    // 初始化分数
    score = 0;
    document.getElementById('current-score').textContent = score;
    
    // 生成食物
    generateFood();
    
    // 设置游戏状态
    gameState = 'ready';
    updateOverlay();
    updateButtons();
}

// ==========================================
// 生成食物
// ==========================================
function generateFood() {
    let validPosition = false;
    let attempts = 0;
    const maxAttempts = 100;
    
    while (!validPosition && attempts < maxAttempts) {
        food = {
            x: Math.floor(Math.random() * GRID_SIZE),
            y: Math.floor(Math.random() * GRID_SIZE)
        };
        
        // 检查食物是否与蛇身重叠
        validPosition = !snake.some(segment => 
            segment.x === food.x && segment.y === food.y
        );
        
        attempts++;
    }
    
    // 如果无法找到有效位置（蛇占满整个画布），游戏胜利
    if (!validPosition) {
        gameWin();
    }
}

// ==========================================
// 游戏主循环
// ==========================================
function gameLoop() {
    if (gameState !== 'playing') return;
    
    // 更新方向（使用缓存的下一步方向）
    direction = nextDirection;
    
    // 计算蛇头新位置
    const head = { ...snake[0] };
    
    switch (direction) {
        case DIRECTIONS.UP:
            head.y--;
            break;
        case DIRECTIONS.DOWN:
            head.y++;
            break;
        case DIRECTIONS.LEFT:
            head.x--;
            break;
        case DIRECTIONS.RIGHT:
            head.x++;
            break;
    }
    
    // 检查碰撞
    if (checkCollision(head)) {
        gameOver();
        return;
    }
    
    // 添加新头部
    snake.unshift(head);
    
    // 检查是否吃到食物
    if (head.x === food.x && head.y === food.y) {
        // 增加分数
        score += 10;
        document.getElementById('current-score').textContent = score;
        
        // 生成新食物
        generateFood();
        
        // 不移除尾部，蛇变长
    } else {
        // 没吃到食物，移除尾部（保持长度）
        snake.pop();
    }
    
    // 绘制游戏画面
    draw();
}

// ==========================================
// 碰撞检测
// ==========================================
function checkCollision(head) {
    // 检查撞墙
    if (head.x < 0 || head.x >= GRID_SIZE || 
        head.y < 0 || head.y >= GRID_SIZE) {
        return true;
    }
    
    // 检查撞到自己（跳过头部，检查身体）
    for (let i = 0; i < snake.length; i++) {
        if (snake[i].x === head.x && snake[i].y === head.y) {
            return true;
        }
    }
    
    return false;
}

// ==========================================
// 绘制函数
// ==========================================
function draw() {
    // 清空画布
    ctx.fillStyle = '#1a1a2e';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // 绘制网格
    drawGrid();
    
    // 绘制食物
    if (food) {
        ctx.fillStyle = '#ff0055';
        ctx.shadowBlur = 10;
        ctx.shadowColor = '#ff0055';
        ctx.fillRect(
            food.x * CELL_SIZE + 1,
            food.y * CELL_SIZE + 1,
            CELL_SIZE - 2,
            CELL_SIZE - 2
        );
        ctx.shadowBlur = 0;
    }
    
    // 绘制蛇
    snake.forEach((segment, index) => {
        if (index === 0) {
            // 蛇头 - 深绿色
            ctx.fillStyle = '#00cc33';
            ctx.shadowBlur = 15;
            ctx.shadowColor = '#00ff41';
        } else {
            // 蛇身 - 亮绿色
            ctx.fillStyle = '#00ff41';
            ctx.shadowBlur = 5;
            ctx.shadowColor = '#00ff41';
        }
        
        ctx.fillRect(
            segment.x * CELL_SIZE + 1,
            segment.y * CELL_SIZE + 1,
            CELL_SIZE - 2,
            CELL_SIZE - 2
        );
    });
    
    ctx.shadowBlur = 0;
}

// ==========================================
// 绘制网格
// ==========================================
function drawGrid() {
    ctx.strokeStyle = '#2a2a3e';
    ctx.lineWidth = 0.5;
    
    // 绘制垂直线
    for (let i = 0; i <= GRID_SIZE; i++) {
        ctx.beginPath();
        ctx.moveTo(i * CELL_SIZE, 0);
        ctx.lineTo(i * CELL_SIZE, canvas.height);
        ctx.stroke();
    }
    
    // 绘制水平线
    for (let i = 0; i <= GRID_SIZE; i++) {
        ctx.beginPath();
        ctx.moveTo(0, i * CELL_SIZE);
        ctx.lineTo(canvas.width, i * CELL_SIZE);
        ctx.stroke();
    }
}

// ==========================================
// 事件监听器设置
// ==========================================
function setupEventListeners() {
    // 键盘控制
    document.addEventListener('keydown', handleKeyPress);
    
    // 难度按钮
    document.querySelectorAll('.difficulty-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            if (gameState === 'ready' || gameState === 'gameover') {
                setDifficulty(this.dataset.difficulty);
            }
        });
    });
    
    // 控制按钮
    document.getElementById('start-btn').addEventListener('click', startGame);
    document.getElementById('pause-btn').addEventListener('click', togglePause);
    document.getElementById('restart-btn').addEventListener('click', restartGame);
}

// ==========================================
// 按键处理
// ==========================================
function handleKeyPress(e) {
    // 空格键 - 开始/暂停/继续
    if (e.code === 'Space' || e.key === ' ') {
        e.preventDefault();
        
        if (gameState === 'ready') {
            startGame();
        } else if (gameState === 'playing') {
            togglePause();
        } else if (gameState === 'paused') {
            togglePause();
        }
        return;
    }
    
    // 只在游戏进行中才处理方向键
    if (gameState !== 'playing') return;
    
    // 方向键控制（防止180度转向）
    switch (e.key) {
        case 'ArrowUp':
        case 'w':
        case 'W':
            if (direction !== DIRECTIONS.DOWN) {
                nextDirection = DIRECTIONS.UP;
            }
            e.preventDefault();
            break;
            
        case 'ArrowDown':
        case 's':
        case 'S':
            if (direction !== DIRECTIONS.UP) {
                nextDirection = DIRECTIONS.DOWN;
            }
            e.preventDefault();
            break;
            
        case 'ArrowLeft':
        case 'a':
        case 'A':
            if (direction !== DIRECTIONS.RIGHT) {
                nextDirection = DIRECTIONS.LEFT;
            }
            e.preventDefault();
            break;
            
        case 'ArrowRight':
        case 'd':
        case 'D':
            if (direction !== DIRECTIONS.LEFT) {
                nextDirection = DIRECTIONS.RIGHT;
            }
            e.preventDefault();
            break;
    }
}

// ==========================================
// 开始游戏
// ==========================================
function startGame() {
    if (gameState === 'ready' || gameState === 'gameover') {
        if (gameState === 'gameover') {
            resetGame();
        }
        
        gameState = 'playing';
        updateOverlay();
        updateButtons();
        
        // 启动游戏循环
        const speed = DIFFICULTY_SETTINGS[currentDifficulty].speed;
        gameInterval = setInterval(gameLoop, speed);
    }
}

// ==========================================
// 暂停/继续游戏
// ==========================================
function togglePause() {
    if (gameState === 'playing') {
        // 暂停游戏
        gameState = 'paused';
        clearInterval(gameInterval);
        gameInterval = null;
        updateOverlay();
        updateButtons();
    } else if (gameState === 'paused') {
        // 继续游戏
        gameState = 'playing';
        updateOverlay();
        updateButtons();
        
        const speed = DIFFICULTY_SETTINGS[currentDifficulty].speed;
        gameInterval = setInterval(gameLoop, speed);
    }
}

// ==========================================
// 重新开始游戏
// ==========================================
function restartGame() {
    resetGame();
    draw();
}

// ==========================================
// 游戏结束
// ==========================================
function gameOver() {
    // 停止游戏循环
    clearInterval(gameInterval);
    gameInterval = null;
    gameState = 'gameover';
    
    // 更新最高分
    if (score > highScore) {
        highScore = score;
        document.getElementById('high-score').textContent = highScore;
        saveHighScore();
    }
    
    // 更新UI
    updateOverlay();
    updateButtons();
}

// ==========================================
// 游戏胜利（占满整个画布）
// ==========================================
function gameWin() {
    clearInterval(gameInterval);
    gameInterval = null;
    gameState = 'gameover';
    
    // 更新最高分
    if (score > highScore) {
        highScore = score;
        document.getElementById('high-score').textContent = highScore;
        saveHighScore();
    }
    
    // 显示胜利信息
    document.getElementById('overlay-title').textContent = '🎉 恭喜获胜！';
    document.getElementById('overlay-message').textContent = `你填满了整个画布！得分: ${score}`;
    document.getElementById('game-overlay').classList.remove('hidden');
    updateButtons();
}

// ==========================================
// 设置难度
// ==========================================
function setDifficulty(difficulty) {
    if (gameState === 'playing' || gameState === 'paused') {
        return; // 游戏进行中不允许切换难度
    }
    
    currentDifficulty = difficulty;
    
    // 更新按钮样式
    document.querySelectorAll('.difficulty-btn').forEach(btn => {
        btn.classList.remove('active');
        if (btn.dataset.difficulty === difficulty) {
            btn.classList.add('active');
        }
    });
}

// ==========================================
// 更新覆盖层显示
// ==========================================
function updateOverlay() {
    const overlay = document.getElementById('game-overlay');
    const title = document.getElementById('overlay-title');
    const message = document.getElementById('overlay-message');
    
    switch (gameState) {
        case 'ready':
            overlay.classList.remove('hidden');
            title.textContent = '准备开始';
            message.textContent = '按空格键或点击开始按钮';
            break;
            
        case 'playing':
            overlay.classList.add('hidden');
            break;
            
        case 'paused':
            overlay.classList.remove('hidden');
            title.textContent = '⏸️ 游戏暂停';
            message.textContent = '按空格键或点击继续按钮';
            break;
            
        case 'gameover':
            overlay.classList.remove('hidden');
            title.textContent = '💀 游戏结束';
            message.textContent = `得分: ${score} | 最高分: ${highScore}`;
            break;
    }
}

// ==========================================
// 更新按钮状态
// ==========================================
function updateButtons() {
    const startBtn = document.getElementById('start-btn');
    const pauseBtn = document.getElementById('pause-btn');
    
    switch (gameState) {
        case 'ready':
        case 'gameover':
            startBtn.disabled = false;
            pauseBtn.disabled = true;
            pauseBtn.textContent = '暂停';
            break;
            
        case 'playing':
            startBtn.disabled = true;
            pauseBtn.disabled = false;
            pauseBtn.textContent = '暂停';
            break;
            
        case 'paused':
            startBtn.disabled = true;
            pauseBtn.disabled = false;
            pauseBtn.textContent = '继续';
            break;
    }
}

// ==========================================
// 页面加载完成后初始化
// ==========================================
window.addEventListener('DOMContentLoaded', init);

const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const scoreElement = document.getElementById("score");
const finalScoreElement = document.getElementById("finalScore");
const finalBestElement = document.getElementById("finalBest");

const startScreen = document.getElementById("startScreen");
const pauseScreen = document.getElementById("pauseScreen");
const gameOverScreen = document.getElementById("gameOverScreen");

const startButton = document.getElementById("startButton");
const restartButton = document.getElementById("restartButton");
const resumeButton = document.getElementById("resumeButton");

const pauseButton = document.getElementById("pauseButton");
const soundButton = document.getElementById("soundButton");

const newBestElement = document.getElementById("newBest");

const leftButton = document.getElementById("leftButton");
const rightButton = document.getElementById("rightButton");

const lifeElements = [
    document.getElementById("life1"),
    document.getElementById("life2"),
    document.getElementById("life3")
];


/* =========================================
   GAME STATE
========================================= */

let gameRunning = false;
let gamePaused = false;

let score = 0;
let lives = 3;

let bestScore =
    Number(localStorage.getItem("neonDodgeBest")) || 0;

let lastTime = 0;

let obstacleTimer = 0;
let coinTimer = 0;
let powerTimer = 0;

let animationId;

let screenShake = 0;

let soundEnabled = true;

let audioContext = null;

let particles = [];

let obstacles = [];
let coins = [];
let powerUps = [];


/* =========================================
   PLAYER
========================================= */

const player = {

    x: 0,
    y: 0,

    width: 34,
    height: 40,

    speed: 390,

    invincible: false,
    invincibleTimer: 0,

    targetX: null
};


/* =========================================
   INPUT
========================================= */

const keys = {
    left: false,
    right: false
};


/* =========================================
   CANVAS
========================================= */

function resizeCanvas() {

    const rect = canvas.getBoundingClientRect();

    const dpr =
        Math.min(window.devicePixelRatio || 1, 2);

    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;

    ctx.setTransform(
        dpr,
        0,
        0,
        dpr,
        0,
        0
    );

    if (!gameRunning) {

        player.x =
            rect.width / 2 -
            player.width / 2;

        player.y =
            rect.height - 90;
    }
}

window.addEventListener(
    "resize",
    resizeCanvas
);

resizeCanvas();


/* =========================================
   START GAME
========================================= */

function startGame() {

    initializeAudio();

    gameRunning = true;
    gamePaused = false;

    score = 0;
    lives = 3;

    obstacleTimer = 0;
    coinTimer = 0;
    powerTimer = 0;

    screenShake = 0;

    obstacles = [];
    coins = [];
    powerUps = [];
    particles = [];

    scoreElement.textContent = "0";

    updateLives();

    startScreen.classList.add("hidden");
    pauseScreen.classList.add("hidden");
    gameOverScreen.classList.add("hidden");

    const rect = canvas.getBoundingClientRect();

    player.x =
        rect.width / 2 -
        player.width / 2;

    player.y =
        rect.height - 90;

    player.invincible = false;
    player.invincibleTimer = 0;
    player.targetX = null;

    lastTime = performance.now();

    cancelAnimationFrame(animationId);

    animationId =
        requestAnimationFrame(gameLoop);
}


/* =========================================
   GAME LOOP
========================================= */

function gameLoop(currentTime) {

    if (!gameRunning) {
        return;
    }

    if (gamePaused) {

        animationId =
            requestAnimationFrame(gameLoop);

        return;
    }

    const deltaTime =
        Math.min(
            (currentTime - lastTime) / 1000,
            0.05
        );

    lastTime = currentTime;

    update(deltaTime);

    draw();

    animationId =
        requestAnimationFrame(gameLoop);
}


/* =========================================
   UPDATE
========================================= */

function update(deltaTime) {

    const rect =
        canvas.getBoundingClientRect();

    updatePlayer(deltaTime, rect.width);

    updateTimers(deltaTime);

    updateObstacles(deltaTime, rect.height);

    updateCoins(deltaTime, rect.height);

    updatePowerUps(deltaTime, rect.height);

    updateParticles(deltaTime);

    updateInvincibility(deltaTime);

    if (screenShake > 0) {
        screenShake -= deltaTime * 30;
    }

    spawnObjects(rect.width);
}


/* =========================================
   PLAYER
========================================= */

function updatePlayer(deltaTime, canvasWidth) {

    let direction = 0;

    if (keys.left) {
        direction -= 1;
    }

    if (keys.right) {
        direction += 1;
    }

    if (direction !== 0) {

        player.targetX = null;

        player.x +=
            direction *
            player.speed *
            deltaTime;
    }

    if (player.targetX !== null) {

        const difference =
            player.targetX -
            (player.x + player.width / 2);

        player.x +=
            difference *
            Math.min(1, deltaTime * 12);
    }

    player.x =
        Math.max(
            4,
            Math.min(
                canvasWidth -
                player.width -
                4,
                player.x
            )
        );
}


/* =========================================
   TIMERS
========================================= */

function updateTimers(deltaTime) {

    obstacleTimer += deltaTime;
    coinTimer += deltaTime;
    powerTimer += deltaTime;
}


/* =========================================
   SPAWN OBJECTS
========================================= */

function spawnObjects(width) {

    const difficulty =
        Math.min(score / 80, 1);

    const obstacleRate =
        Math.max(
            0.28,
            0.72 - difficulty * 0.28
        );

    if (obstacleTimer >= obstacleRate) {

        obstacleTimer = 0;

        createObstacle(width);
    }

    if (coinTimer >= 1.25) {

        coinTimer = 0;

        createCoin(width);
    }

    if (
        powerTimer >= 9 &&
        Math.random() < 0.55
    ) {

        powerTimer = 0;

        createPowerUp(width);
    }
}


/* =========================================
   OBSTACLES
========================================= */

function createObstacle(width) {

    const size =
        24 + Math.random() * 24;

    const speed =
        180 +
        Math.random() * 90 +
        Math.min(score * 2.5, 150);

    obstacles.push({

        x:
            Math.random() *
            (width - size),

        y:
            -size - 10,

        width: size,
        height: size,

        speed,

        rotation:
            Math.random() * Math.PI,

        rotationSpeed:
            (Math.random() - 0.5) * 3
    });
}


function updateObstacles(deltaTime, height) {

    for (
        let i = obstacles.length - 1;
        i >= 0;
        i--
    ) {

        const obstacle =
            obstacles[i];

        obstacle.y +=
            obstacle.speed *
            deltaTime;

        obstacle.rotation +=
            obstacle.rotationSpeed *
            deltaTime;

        if (
            !player.invincible &&
            checkCollision(
                player,
                obstacle
            )
        ) {

            damagePlayer(obstacle);

            obstacles.splice(i, 1);

            continue;
        }

        if (
            obstacle.y >
            height + 60
        ) {

            obstacles.splice(i, 1);
        }
    }
}


/* =========================================
   COINS
========================================= */

function createCoin(width) {

    coins.push({

        x:
            15 +
            Math.random() *
            (width - 30),

        y: -20,

        radius: 8,

        speed:
            150 +
            Math.random() * 50,

        rotation:
            Math.random() * Math.PI * 2
    });
}


function updateCoins(deltaTime, height) {

    for (
        let i = coins.length - 1;
        i >= 0;
        i--
    ) {

        const coin =
            coins[i];

        coin.y +=
            coin.speed *
            deltaTime;

        coin.rotation +=
            deltaTime * 4;

        if (
            circleRectangleCollision(
                coin,
                player
            )
        ) {

            collectCoin(coin);

            coins.splice(i, 1);

            continue;
        }

        if (
            coin.y >
            height + 30
        ) {

            coins.splice(i, 1);
        }
    }
}


function collectCoin(coin) {

    score += 5;

    scoreElement.textContent = score;

    createParticles(
        coin.x,
        coin.y,
        12,
        "coin"
    );

    playSound(
        700,
        0.08,
        "sine"
    );
}


/* =========================================
   POWER UPS
========================================= */

function createPowerUp(width) {

    powerUps.push({

        x:
            20 +
            Math.random() *
            (width - 40),

        y: -25,

        radius: 13,

        speed: 130,

        pulse: 0
    });
}


function updatePowerUps(deltaTime, height) {

    for (
        let i = powerUps.length - 1;
        i >= 0;
        i--
    ) {

        const power =
            powerUps[i];

        power.y +=
            power.speed *
            deltaTime;

        power.pulse +=
            deltaTime * 5;

        if (
            circleRectangleCollision(
                power,
                player
            )
        ) {

            activateShield(power);

            powerUps.splice(i, 1);

            continue;
        }

        if (
            power.y >
            height + 40
        ) {

            powerUps.splice(i, 1);
        }
    }
}


function activateShield(power) {

    player.invincible = true;

    player.invincibleTimer = 5;

    createParticles(
        power.x,
        power.y,
        30,
        "shield"
    );

    playSound(
        950,
        0.18,
        "sine"
    );
}


/* =========================================
   INVINCIBILITY
========================================= */

function updateInvincibility(deltaTime) {

    if (!player.invincible) {
        return;
    }

    player.invincibleTimer -=
        deltaTime;

    if (
        player.invincibleTimer <= 0
    ) {

        player.invincible = false;
    }
}


/* =========================================
   DAMAGE
========================================= */

function damagePlayer(obstacle) {

    lives--;

    updateLives();

    screenShake = 8;

    createParticles(
        player.x + player.width / 2,
        player.y + player.height / 2,
        28,
        "hit"
    );

    playSound(
        120,
        0.18,
        "sawtooth"
    );

    player.invincible = true;

    player.invincibleTimer = 1.2;

    if (lives <= 0) {

        endGame();

        return;
    }
}


/* =========================================
   LIVES
========================================= */

function updateLives() {

    lifeElements.forEach(
        (element, index) => {

            element.classList.toggle(
                "dead",
                index >= lives
            );
        }
    );
}


/* =========================================
   COLLISION
========================================= */

function checkCollision(a, b) {

    const padding = 5;

    return (

        a.x + padding <
        b.x + b.width &&

        a.x + a.width - padding >
        b.x &&

        a.y + padding <
        b.y + b.height &&

        a.y + a.height - padding >
        b.y
    );
}


function circleRectangleCollision(
    circle,
    rectangle
) {

    const closestX =
        Math.max(
            rectangle.x,
            Math.min(
                circle.x,
                rectangle.x +
                rectangle.width
            )
        );

    const closestY =
        Math.max(
            rectangle.y,
            Math.min(
                circle.y,
                rectangle.y +
                rectangle.height
            )
        );

    const dx =
        circle.x - closestX;

    const dy =
        circle.y - closestY;

    return (
        dx * dx +
        dy * dy <
        circle.radius *
        circle.radius
    );
}


/* =========================================
   PARTICLES
========================================= */

function createParticles(
    x,
    y,
    amount,
    type
) {

    for (
        let i = 0;
        i < amount;
        i++
    ) {

        const angle =
            Math.random() *
            Math.PI *
            2;

        const speed =
            40 +
            Math.random() * 160;

        particles.push({

            x,
            y,

            vx:
                Math.cos(angle) *
                speed,

            vy:
                Math.sin(angle) *
                speed,

            life:
                0.35 +
                Math.random() * 0.5,

            maxLife: 0.8,

            size:
                2 +
                Math.random() * 3,

            type
        });
    }
}


function updateParticles(deltaTime) {

    for (
        let i = particles.length - 1;
        i >= 0;
        i--
    ) {

        const particle =
            particles[i];

        particle.x +=
            particle.vx *
            deltaTime;

        particle.y +=
            particle.vy *
            deltaTime;

        particle.vy +=
            70 *
            deltaTime;

        particle.life -=
            deltaTime;

        if (
            particle.life <= 0
        ) {

            particles.splice(i, 1);
        }
    }
}


/* =========================================
   DRAW
========================================= */

function draw() {

    const rect =
        canvas.getBoundingClientRect();

    const width = rect.width;
    const height = rect.height;

    ctx.clearRect(
        0,
        0,
        width,
        height
    );

    ctx.save();

    if (screenShake > 0) {

        ctx.translate(
            (Math.random() - 0.5) *
            screenShake,

            (Math.random() - 0.5) *
            screenShake
        );
    }

    drawBackground(
        width,
        height
    );

    drawCoins();

    drawPowerUps();

    drawObstacles();

    drawPlayer();

    drawParticles();

    ctx.restore();
}


/* =========================================
   BACKGROUND
========================================= */

function drawBackground(
    width,
    height
) {

    const gradient =
        ctx.createLinearGradient(
            0,
            0,
            0,
            height
        );

    gradient.addColorStop(
        0,
        "#101624"
    );

    gradient.addColorStop(
        0.5,
        "#090d16"
    );

    gradient.addColorStop(
        1,
        "#05070b"
    );

    ctx.fillStyle = gradient;

    ctx.fillRect(
        0,
        0,
        width,
        height
    );


    /* GRID */

    ctx.strokeStyle =
        "rgba(255,255,255,0.035)";

    ctx.lineWidth = 1;

    const grid = 40;

    for (
        let x = 0;
        x < width;
        x += grid
    ) {

        ctx.beginPath();

        ctx.moveTo(x, 0);

        ctx.lineTo(
            x,
            height
        );

        ctx.stroke();
    }

    for (
        let y = 0;
        y < height;
        y += grid
    ) {

        ctx.beginPath();

        ctx.moveTo(
            0,
            y
        );

        ctx.lineTo(
            width,
            y
        );

        ctx.stroke();
    }


    /* CENTER GLOW */

    const glow =
        ctx.createRadialGradient(
            width / 2,
            height * 0.72,
            0,
            width / 2,
            height * 0.72,
            width * 0.65
        );

    glow.addColorStop(
        0,
        "rgba(70,240,205,0.06)"
    );

    glow.addColorStop(
        1,
        "rgba(0,0,0,0)"
    );

    ctx.fillStyle = glow;

    ctx.fillRect(
        0,
        0,
        width,
        height
    );
}


/* =========================================
   PLAYER DRAW
========================================= */

function drawPlayer() {

    const centerX =
        player.x +
        player.width / 2;

    const bottom =
        player.y +
        player.height;

    ctx.save();


    /* INVINCIBILITY FLASH */

    if (
        player.invincible &&
        Math.floor(
            player.invincibleTimer * 10
        ) % 2 === 0
    ) {

        ctx.globalAlpha = 0.35;
    }


    /* SHIELD */

    if (player.invincible) {

        ctx.beginPath();

        ctx.arc(
            centerX,
            player.y +
            player.height / 2,
            27,
            0,
            Math.PI * 2
        );

        ctx.strokeStyle =
            "rgba(99,245,208,0.7)";

        ctx.lineWidth = 2;

        ctx.shadowBlur = 18;

        ctx.shadowColor =
            "rgba(99,245,208,0.7)";

        ctx.stroke();
    }


    /* GLOW */

    ctx.shadowBlur = 20;

    ctx.shadowColor =
        "rgba(99,245,208,0.65)";


    /* BODY */

    ctx.fillStyle =
        "#63f5d0";

    ctx.beginPath();

    ctx.moveTo(
        centerX,
        player.y
    );

    ctx.lineTo(
        player.x +
        player.width,
        bottom
    );

    ctx.lineTo(
        centerX,
        bottom - 10
    );

    ctx.lineTo(
        player.x,
        bottom
    );

    ctx.closePath();

    ctx.fill();


    /* INNER CORE */

    ctx.shadowBlur = 0;

    ctx.fillStyle =
        "#ffffff";

    ctx.beginPath();

    ctx.arc(
        centerX,
        player.y + 22,
        4,
        0,
        Math.PI * 2
    );

    ctx.fill();


    /* ENGINE */

    ctx.fillStyle =
        "rgba(99,245,208,0.7)";

    ctx.beginPath();

    ctx.moveTo(
        centerX - 5,
        bottom - 2
    );

    ctx.lineTo(
        centerX,
        bottom + 10 +
        Math.random() * 4
    );

    ctx.lineTo(
        centerX + 5,
        bottom - 2
    );

    ctx.closePath();

    ctx.fill();

    ctx.restore();
}


/* =========================================
   OBSTACLE DRAW
========================================= */

function drawObstacles() {

    for (
        const obstacle of obstacles
    ) {

        const centerX =
            obstacle.x +
            obstacle.width / 2;

        const centerY =
            obstacle.y +
            obstacle.height / 2;

        ctx.save();

        ctx.translate(
            centerX,
            centerY
        );

        ctx.rotate(
            obstacle.rotation
        );

        ctx.shadowBlur = 18;

        ctx.shadowColor =
            "rgba(255,83,100,0.55)";

        ctx.fillStyle =
            "#ff5364";

        ctx.fillRect(
            -obstacle.width / 2,
            -obstacle.height / 2,
            obstacle.width,
            obstacle.height
        );

        ctx.fillStyle =
            "rgba(255,255,255,0.22)";

        ctx.fillRect(
            -obstacle.width / 2 + 5,
            -obstacle.height / 2 + 5,
            4,
            4
        );

        ctx.restore();
    }
}


/* =========================================
   COIN DRAW
========================================= */

function drawCoins() {

    for (
        const coin of coins
    ) {

        ctx.save();

        ctx.translate(
            coin.x,
            coin.y
        );

        const scale =
            Math.abs(
                Math.cos(
                    coin.rotation
                )
            );

        ctx.scale(
            Math.max(scale, 0.18),
            1
        );

        ctx.shadowBlur = 16;

        ctx.shadowColor =
            "rgba(255,212,92,0.7)";

        ctx.fillStyle =
            "#ffd45c";

        ctx.beginPath();

        ctx.arc(
            0,
            0,
            coin.radius,
            0,
            Math.PI * 2
        );

        ctx.fill();

        ctx.fillStyle =
            "rgba(255,255,255,0.5)";

        ctx.beginPath();

        ctx.arc(
            -2,
            -2,
            2,
            0,
            Math.PI * 2
        );

        ctx.fill();

        ctx.restore();
    }
}


/* =========================================
   POWER UP DRAW
========================================= */

function drawPowerUps() {

    for (
        const power of powerUps
    ) {

        const pulse =
            Math.sin(power.pulse) *
            3;

        ctx.save();

        ctx.shadowBlur = 25;

        ctx.shadowColor =
            "rgba(99,245,208,0.7)";

        ctx.strokeStyle =
            "#63f5d0";

        ctx.lineWidth = 2;

        ctx.beginPath();

        ctx.arc(
            power.x,
            power.y,
            power.radius + pulse,
            0,
            Math.PI * 2
        );

        ctx.stroke();

        ctx.fillStyle =
            "rgba(99,245,208,0.12)";

        ctx.fill();

        ctx.fillStyle =
            "#ffffff";

        ctx.font =
            "bold 12px Arial";

        ctx.textAlign = "center";

        ctx.textBaseline = "middle";

        ctx.fillText(
            "✦",
            power.x,
            power.y
        );

        ctx.restore();
    }
}


/* =========================================
   PARTICLES DRAW
========================================= */

function drawParticles() {

    for (
        const particle of particles
    ) {

        const alpha =
            Math.max(
                0,
                particle.life /
                particle.maxLife
            );

        ctx.save();

        ctx.globalAlpha =
            alpha;

        ctx.fillStyle =
            particle.type === "coin"
                ? "#ffd45c"
                : particle.type === "shield"
                    ? "#63f5d0"
                    : "#ff5364";

        ctx.beginPath();

        ctx.arc(
            particle.x,
            particle.y,
            particle.size,
            0,
            Math.PI * 2
        );

        ctx.fill();

        ctx.restore();
    }
}


/* =========================================
   GAME OVER
========================================= */

function endGame() {

    gameRunning = false;

    cancelAnimationFrame(
        animationId
    );

    const isNewBest =
        score > bestScore;

    if (isNewBest) {

        bestScore = score;

        localStorage.setItem(
            "neonDodgeBest",
            bestScore
        );
    }

    finalScoreElement.textContent =
        score;

    finalBestElement.textContent =
        bestScore;

    newBestElement.classList.toggle(
        "hidden",
        !isNewBest
    );

    gameOverScreen.classList.remove(
        "hidden"
    );

    playSound(
        90,
        0.25,
        "sawtooth"
    );
}


/* =========================================
   PAUSE
========================================= */

function togglePause() {

    if (!gameRunning) {
        return;
    }

    gamePaused =
        !gamePaused;

    pauseScreen.classList.toggle(
        "hidden",
        !gamePaused
    );

    pauseButton.textContent =
        gamePaused
            ? "▶"
            : "❚❚";

    if (!gamePaused) {

        lastTime =
            performance.now();
    }
}


pauseButton.addEventListener(
    "click",
    togglePause
);

resumeButton.addEventListener(
    "click",
    togglePause
);


/* =========================================
   KEYBOARD
========================================= */

window.addEventListener(
    "keydown",
    (event) => {

        if (
            event.key === "ArrowLeft" ||
            event.key.toLowerCase() === "a"
        ) {

            keys.left = true;

            event.preventDefault();
        }

        if (
            event.key === "ArrowRight" ||
            event.key.toLowerCase() === "d"
        ) {

            keys.right = true;

            event.preventDefault();
        }

        if (
            event.key === " " ||
            event.key.toLowerCase() === "p"
        ) {

            togglePause();
        }
    }
);


window.addEventListener(
    "keyup",
    (event) => {

        if (
            event.key === "ArrowLeft" ||
            event.key.toLowerCase() === "a"
        ) {

            keys.left = false;
        }

        if (
            event.key === "ArrowRight" ||
            event.key.toLowerCase() === "d"
        ) {

            keys.right = false;
        }
    }
);


/* =========================================
   MOBILE BUTTONS
========================================= */

function holdButton(
    button,
    direction
) {

    button.addEventListener(
        "pointerdown",
        (event) => {

            event.preventDefault();

            keys[direction] = true;
        }
    );

    button.addEventListener(
        "pointerup",
        () => {

            keys[direction] = false;
        }
    );

    button.addEventListener(
        "pointercancel",
        () => {

            keys[direction] = false;
        }
    );

    button.addEventListener(
        "pointerleave",
        () => {

            keys[direction] = false;
        }
    );
}

holdButton(
    leftButton,
    "left"
);

holdButton(
    rightButton,
    "right"
);


/* =========================================
   TOUCH / DRAG
========================================= */

canvas.addEventListener(
    "pointerdown",
    (event) => {

        if (!gameRunning || gamePaused) {
            return;
        }

        if (
            event.pointerType === "mouse"
        ) {
            return;
        }

        canvas.setPointerCapture(
            event.pointerId
        );

        movePlayerToPointer(event);
    }
);


canvas.addEventListener(
    "pointermove",
    (event) => {

        if (!gameRunning || gamePaused) {
            return;
        }

        if (
            event.pointerType === "mouse"
        ) {
            return;
        }

        movePlayerToPointer(event);
    }
);


function movePlayerToPointer(event) {

    const rect =
        canvas.getBoundingClientRect();

    player.targetX =
        event.clientX -
        rect.left;
}


/* =========================================
   SOUND
========================================= */

function initializeAudio() {

    if (!audioContext) {

        audioContext =
            new (
                window.AudioContext ||
                window.webkitAudioContext
            )();
    }

    if (
        audioContext.state ===
        "suspended"
    ) {

        audioContext.resume();
    }
}


function playSound(
    frequency,
    duration,
    type
) {

    if (!soundEnabled) {
        return;
    }

    initializeAudio();

    const oscillator =
        audioContext.createOscillator();

    const gain =
        audioContext.createGain();

    oscillator.type = type;

    oscillator.frequency.value =
        frequency;

    gain.gain.setValueAtTime(
        0.05,
        audioContext.currentTime
    );

    gain.gain.exponentialRampToValueAtTime(
        0.001,
        audioContext.currentTime +
        duration
    );

    oscillator.connect(gain);

    gain.connect(
        audioContext.destination
    );

    oscillator.start();

    oscillator.stop(
        audioContext.currentTime +
        duration
    );
}


soundButton.addEventListener(
    "click",
    () => {

        soundEnabled =
            !soundEnabled;

        soundButton.textContent =
            soundEnabled
                ? "🔊"
                : "🔇";

        if (soundEnabled) {

            playSound(
                600,
                0.08,
                "sine"
            );
        }
    }
);


/* =========================================
   START / RESTART
========================================= */

startButton.addEventListener(
    "click",
    startGame
);

restartButton.addEventListener(
    "click",
    startGame
);


/* =========================================
   INITIAL DRAW
========================================= */

function initialDraw() {

    const rect =
        canvas.getBoundingClientRect();

    drawBackground(
        rect.width,
        rect.height
    );

    drawPlayer();
}

initialDraw();
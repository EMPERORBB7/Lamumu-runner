const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

const baseWidth = 480;
const baseHeight = 320;

const startScreen = document.getElementById("start-screen");
const gameOverScreen = document.getElementById("game-over-screen");
const finalScoreEl = document.getElementById("final-score");
const restartBtn = document.getElementById("restart-btn");

let gameRunning = false;
let score = 0;
let lives = 3;
let gravity = 0.55;

const cow = {
  x: 50,
  y: 0,
  width: 70,
  height: 70,
  dy: 0,
  onGround: false,
  jumpPower: -17,
};

let obstacles = [];
const obstacleWidth = 60;
const obstacleHeight = 60;

const fenceYOffset = 8;
const groundLevel = baseHeight - obstacleHeight - 20 - fenceYOffset;

let obstacleSpeed = 3;
const earlyMaxSpeed = 5;
const lateMaxSpeed = 7;
const earlySpeedIncreaseRate = 0.0003;
const lateSpeedIncreaseRate = 0.001;

let obstacleInterval = 1500;
let lastObstacleTime = 0;
let lastTime = 0;

// GMOO message variables
let showGMoo = false;
let gMooTimer = 0;
const gMooDuration = 2000; // ms

const cowImg = new Image();
cowImg.src = "images/cow.png";

const fenceImg = new Image();
fenceImg.src = "images/fence.png";

const backgroundImg = new Image();
backgroundImg.src = "images/background.png";

function resizeCanvas() {
  const container = document.getElementById("game-wrapper");
  const containerWidth = container.clientWidth;
  const scale = containerWidth / baseWidth;

  canvas.width = baseWidth;
  canvas.height = baseHeight;

  canvas.style.width = containerWidth + "px";
  canvas.style.height = baseHeight * scale + "px";

  ctx.setTransform(1, 0, 0, 1, 0, 0);
}

window.addEventListener("resize", resizeCanvas);
resizeCanvas();

function jump() {
  if (cow.onGround) {
    cow.dy = cow.jumpPower;
    cow.onGround = false;
  }
}

function createObstacle(time) {
  if (time - lastObstacleTime > obstacleInterval) {
    obstacles.push({
      x: canvas.width,
      y: groundLevel,
      width: obstacleWidth,
      height: obstacleHeight,
    });
    lastObstacleTime = time;
  }
}

function checkCollision(rect1, rect2) {
  return !(
    rect1.x > rect2.x + rect2.width ||
    rect1.x + rect1.width < rect2.x ||
    rect1.y > rect2.y + rect2.height ||
    rect1.y + rect1.height < rect2.y
  );
}

function resetCowAndObstacles() {
  cow.y = baseHeight - cow.height - 20;
  cow.dy = 0;
  cow.onGround = true;
  obstacles = [];
  obstacleSpeed = 3;
  lastObstacleTime = 0;
}

function resetGame() {
  score = 0;
  lives = 3;
  resetCowAndObstacles();
  gameRunning = true;
  startScreen.style.display = "none";
  gameOverScreen.classList.add("hidden");
  lastTime = 0;
  showGMoo = false;
  gMooTimer = 0;
  requestAnimationFrame(gameLoop);
}

function gameLoop(timestamp) {
  if (!lastTime) lastTime = timestamp;
  const deltaTime = timestamp - lastTime;
  lastTime = timestamp;

  // Gradually increase speed
  if (score < 20) {
    if (obstacleSpeed < earlyMaxSpeed) {
      obstacleSpeed += earlySpeedIncreaseRate * deltaTime;
      if (obstacleSpeed > earlyMaxSpeed) obstacleSpeed = earlyMaxSpeed;
    }
  } else {
    if (obstacleSpeed < lateMaxSpeed) {
      obstacleSpeed += lateSpeedIncreaseRate * deltaTime;
      if (obstacleSpeed > lateMaxSpeed) obstacleSpeed = lateMaxSpeed;
    }
  }

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Draw background
  if (backgroundImg.complete) {
    ctx.drawImage(backgroundImg, 0, 0, canvas.width, canvas.height);
  } else {
    ctx.fillStyle = "#4caf50";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }

  // Cow physics
  cow.dy += gravity;
  cow.y += cow.dy;

  const groundY = baseHeight - cow.height - 20;
  if (cow.y > groundY) {
    cow.y = groundY;
    cow.dy = 0;
    cow.onGround = true;
  }

  // Draw cow
  if (cowImg.complete) {
    ctx.drawImage(cowImg, cow.x, cow.y, cow.width, cow.height);
  } else {
    ctx.fillStyle = "#fffde7";
    ctx.fillRect(cow.x, cow.y, cow.width, cow.height);
  }

  // Create obstacles
  createObstacle(timestamp);

  // Update obstacles
  obstacles.forEach((obstacle, index) => {
    obstacle.x -= obstacleSpeed;

    // Draw fence
    if (fenceImg.complete) {
      ctx.drawImage(
        fenceImg,
        obstacle.x,
        obstacle.y,
        obstacle.width,
        obstacle.height
      );
    } else {
      ctx.fillStyle = "#6d4c41";
      ctx.fillRect(obstacle.x, obstacle.y, obstacle.width, obstacle.height);
    }

    // Collision detection
    if (checkCollision(cow, obstacle)) {
      if (lives > 1) {
        lives--;
        resetCowAndObstacles();
      } else {
        gameOver();
      }
    }

    // Remove off-screen obstacles and increase score
    if (obstacle.x + obstacle.width < 0) {
      obstacles.splice(index, 1);
      score++;

      // Trigger GMOO message if score multiple of 20
      if (score > 0 && score % 20 === 0) {
        showGMoo = true;
        gMooTimer = 0;
      }
    }
  });

  // Draw score and lives
  ctx.fillStyle = "#5a3e1b";
  ctx.font = "20px Arial";
  ctx.textAlign = "left";
  ctx.fillText(`Score: ${score}`, 10, 30);
  ctx.fillText(`Lives: ${lives}`, 10, 60);

  // GMOO message display
  if (showGMoo) {
    gMooTimer += deltaTime;
    ctx.fillStyle = "#3e6a2f";
    ctx.font = "bold 48px Arial";
    ctx.textAlign = "center";
    ctx.fillText("GMOO!", canvas.width / 2, canvas.height / 2);

    if (gMooTimer > gMooDuration) {
      showGMoo = false;
    }
  }

  if (gameRunning) {
    requestAnimationFrame(gameLoop);
  }
}

function gameOver() {
  gameRunning = false;
  finalScoreEl.textContent = score;
  gameOverScreen.classList.remove("hidden");
  startScreen.style.display = "flex";
}

window.addEventListener("keydown", (e) => {
  if (e.code === "Space") {
    if (!gameRunning) {
      resetGame();
    } else {
      jump();
    }
  }
});

window.addEventListener(
  "touchstart",
  (e) => {
    e.preventDefault();
    if (!gameRunning) {
      resetGame();
    } else {
      jump();
    }
  },
  { passive: false }
);

startScreen.addEventListener("click", () => {
  if (!gameRunning) {
    resetGame();
  }
});

restartBtn.addEventListener("click", resetGame);

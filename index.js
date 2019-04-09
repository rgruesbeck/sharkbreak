// Shark Break
var config = require('./config.json');

import { requestAnimationFrame, cancelAnimationFrame } from './helpers/animationframe.js';
import { loadImage, loadSound, loadFont } from './helpers/loaders.js';

var canvas = document.getElementById("game");
var ctx = canvas.getContext("2d");

// set canvas width and height
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

var button = null;
var images = {};
var sounds = {};
var ballRadius = 20;
var ballSpin = 0.2;
var x = canvas.width / 2;
var y = canvas.height - 30;
var r = 0;
var dx = 0.005 * canvas.width;
var dy = -0.005 * canvas.height;
var speed = 3;
var paddleHeight = 60;
var paddleWidth = 80;
var paddleX = (canvas.width - paddleWidth) / 2;
var paddleDx = 0.018 * canvas.width;
var rightPressed = false;
var leftPressed = false;
var brickWidth = 120;
var brickHeight = 50;
var brickPadding = 10;
var brickOffsetTop = 30;
var brickOffsetLeft = 30;
var brickRowCount = Math.floor(canvas.width / (brickWidth + brickPadding + brickOffsetLeft));
var brickColumnCount = 3;
var frameId = 0;
var gameState = 'waiting';
var score = 0;
var lives = config.general.lives;

var font = 'Arial'; // fallback font

var bricks = [];
for (var c = 0; c < brickColumnCount; c++) {
  bricks[c] = [];
  for (var r = 0; r < brickRowCount; r++) {
    bricks[c][r] = { x: 0, y: 0, status: 1 };
  }
}

document.addEventListener("keydown", keyDownHandler, false);
document.addEventListener("keyup", keyUpHandler, false);
document.addEventListener("mousemove", mouseMoveHandler, false);
document.addEventListener("touchmove", touchMoveHandler, false);
window.addEventListener("message", injectHandler, false);

function load() {
  // load assets
  Promise.all([
    loadImage('backgroundImage', config.images.backgroundImage),
    loadImage('ballImage', config.images.ballImage),
    loadImage('paddleImage', config.images.paddleImage),
    loadImage('brickImage', config.images.brickImage),
    loadSound('backgroundMusic', config.sounds.backgroundMusic),
    loadSound('winSound', config.sounds.winSound),
    loadSound('gameoverSound', config.sounds.gameoverSound),
    loadSound('scoreSound', config.sounds.scoreSound),
    loadSound('dieSound', config.sounds.dieSound),
    loadFont(config.style.fontFamily)
  ]).then((assets) => {
    assets.forEach(({ type, key, value}) => {
      // set images
      if (type === 'image') {
        images[key] = value;
      }

      // set sounds
      if (type === 'sound') {
        sounds[key] = value;
      }

      // set font
      if (type === 'font') {
        font = value;
      }
    });

    wait();
  });
}

function reset() {
  document.location.reload();
}


function wait() {
  if (frameId > 0) {
      cancelAnimationFrame(frameId);
  }

  sounds.backgroundMusic.loop = true;
  sounds.backgroundMusic.play();

  x = canvas.width / 2;
  y = canvas.height - paddleHeight - ballRadius - 30;

  ctx.clearRect(0, 0, canvas.width, canvas.height); //clear screen
  drawBackground();
  drawBricks();
  drawPaddle();

  drawButton(config.general.buttonText, () => {
    draw();
  });
}

function restart() {
  x = paddleX;
  y = canvas.height - paddleHeight - ballRadius - 30;
  dx = -dx
  dy = -dy;
}


function keyDownHandler(e) {
  if (e.key == "Right" || e.key == "ArrowRight") {
    rightPressed = true;
  }
  else if (e.key == "Left" || e.key == "ArrowLeft") {
    leftPressed = true;
  }
}

function keyUpHandler(e) {
  if (e.key == "Right" || e.key == "ArrowRight") {
    rightPressed = false;
  }
  else if (e.key == "Left" || e.key == "ArrowLeft") {
    leftPressed = false;
  }
}

function mouseMoveHandler(e) {
  var relativeX = e.clientX - canvas.offsetLeft;
  if (relativeX > 0 && relativeX < canvas.width) {
    paddleX = relativeX - paddleWidth / 2;
  }
}

function touchMoveHandler(e) {
  var relativeX = e.touches[0].clientX - canvas.offsetLeft;
  if (relativeX > 0 && relativeX < canvas.width) {
    paddleX = relativeX - paddleWidth / 2;
  }
}

function checkWallCollisions() {
  let cx = x + ballRadius;
  let cy = y + ballRadius;

  if (cx + dx >= canvas.width - ballRadius || cx + dx <= ballRadius) {
    dx = -dx;
  }
  if (cy + dy <= ballRadius) {
    dy = -dy;
  }
}

function checkPaddleCollisions() {
  let cx = x + ballRadius;
  let cy = y + ballRadius;

  // check for paddle
  if (cy + dy >= canvas.height - paddleHeight) {
    if (cx > paddleX && cx < paddleX + paddleWidth) {
      dy = -dy;
    }
  }

  // check for splash
  if (cy + dy >= canvas.height + ballRadius) {
      lives--;
      sounds.dieSound.play();
      if (!lives) {
        gameState = 'over';
      }
      else {
        restart();
      }
  }
}

function checkBrickCollisions() {
  var cx = x + ballRadius;
  var cy = y + ballRadius;

  for (var c = 0; c < brickColumnCount; c++) {
    for (var r = 0; r < brickRowCount; r++) {
      var b = bricks[c][r];
      if (b.status == 1) {
        if (cx > b.x && cx < b.x + brickWidth && cy > b.y && cy < b.y + brickHeight) {
          dy = -dy;
          b.status = 0;
          speed += 0.005;
          score++;
          sounds.scoreSound.play();
          if (score == brickRowCount * brickColumnCount) {
            gameState = 'win';
          }
        }
      }
    }
  }
}

function drawBackground() {

  ctx.drawImage(images.backgroundImage, 0, 0, canvas.width, canvas.height);
}

function drawBall() {
  ctx.drawImage(images.ballImage, x, y, ballRadius * 2, ballRadius * 2);
}

function drawPaddle() {

  ctx.drawImage(images.paddleImage, paddleX, canvas.height - paddleHeight, paddleWidth, paddleHeight);
}

function drawBricks() {
  var rowWidth = brickRowCount * (brickWidth + brickOffsetLeft);
  var rowOffset = (canvas.width - rowWidth) / 2;
  for (var c = 0; c < brickColumnCount; c++) {
    for (var r = 0; r < brickRowCount; r++) {
      if (bricks[c][r].status == 1) {
        var brickX = (r * (brickWidth + brickPadding)) + brickOffsetLeft + rowOffset;
        var brickY = (c * (brickHeight + brickPadding)) + brickOffsetTop;
        bricks[c][r].x = brickX;
        bricks[c][r].y = brickY;
        ctx.drawImage(images.brickImage, brickX, brickY, brickWidth, brickHeight);
      }
    }
  }
}
function drawScore() {
  var message = "Score: " + score;

  ctx.font = "24px " + font;
  ctx.fillStyle = config.style.textColor;
  ctx.fillText(message, 20, 40);
}
function drawLives() {
  var message = "Lives: " + lives;
  var text = ctx.measureText(message);

  ctx.font = "24px " + font;
  ctx.fillStyle = config.style.textColor;
  ctx.fillText(message, canvas.width - text.width - 20, 40);
}

function drawMessage(message) {
  ctx.font = "46px " + font;
  ctx.fillStyle = config.style.textColor;

  var text = ctx.measureText(message);
  ctx.fillText(message, (canvas.width / 2) - (text.width / 2), 150);
}

function drawButton(message, action) {

  if (button) {
    redrawButton(message);
  }

  // create
  button = document.createElement("span");
  var message = document.createTextNode(message);

  // add message and set id
  button.appendChild(message);
  button.setAttribute("id", "button");

  // style button
  var buttonStyle = `
    font-size: 26px;
    font-weight: bold;
    font-family: ${font};
    cursor: pointer;
    display: block;
    float: right;
    z-index: 3;
    position: absolute;
    left: ${(canvas.width - 180) / 2}px;
    top: 50vh;
    padding: 15px;
    width: 150px;
    text-align: center;
    color: ${config.style.textColor};
    border-radius: 100px;
    background-color: ${config.style.primaryColor};
    box-shadow: 0 1em 2em -1em;
  `;
  button.setAttribute('style', buttonStyle);

  // attach event listener for action
  button.addEventListener("click", () => {
    button.remove(); // remove button
    action(); // do action
  }, false);

  // add button to screen
  document.body.appendChild(button);
}

function redrawButton(message) {
  button.innerHTML = message;
};

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  checkPaddleCollisions();
  checkBrickCollisions();
  checkWallCollisions();

  // move paddle
  if (rightPressed && paddleX < canvas.width - paddleWidth) {
    paddleX += paddleDx;
  }
  else if (leftPressed && paddleX > 0) {
    paddleX -= paddleDx;
  }

  x += dx * speed;
  y += dy * speed;
  r += ballSpin;

  drawBackground();
  drawBricks();
  drawBall();
  drawPaddle();
  drawScore();
  drawLives();

  if (gameState === 'over' || gameState === 'win') {
    if (gameState === 'over') {
      drawMessage("Game Over");
      sounds.gameoverSound.play();
    }

    if (gameState === 'win') {
      drawMessage("You Win!");
      sounds.winSound.play();
    }

    cancelAnimationFrame(frameId);
    sounds.backgroundMusic.pause();

    setTimeout(() => {
      reset();
      load();
    }, 5000);
  } else {

    // get new animation frame from browser
    frameId = requestAnimationFrame(draw);
  }

}

// load game and wait to start
load();


// koji injection handler
function injectHandler({ data }) {
  if (data.action === 'injectGlobal') {
    let { scope, key, value } = data.payload;
    if (!updates.hasOwnProperty(scope)) { updates[scope] = {}; }
    updates[scope][key] = value;
    load();
  }
}

// parcel hot module
if (module.hot) {
  module.hot.dispose(function() {
    // module is about to be replaced
  });

  module.hot.accept(function() {
    // module or one of its dependencies was just updated
    reset();
    load();
  });
}

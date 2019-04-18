// Brick Breaker
var config = require('./config.json');

import { requestAnimationFrame, cancelAnimationFrame } from './helpers/animationframe.js';
import { loadImage, loadSound, loadFont } from './helpers/loaders.js';
import Overlay from './helpers/overlay.js';

var canvas = document.getElementById("game");
var ctx = canvas.getContext("2d");

var overlayNode = document.getElementById("overlay");
var overlay = new Overlay(overlayNode);

// set canvas width and height
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;
//canvas.height = (typeof window.orientation !== "undefined") ? window.innerHeight - 44 : window.innerHeight; // mobile top bar hack for now

var gameScale = ((canvas.width + canvas.height) / 270);

var images = {};
var sounds = {};
var fonts = {};
var muted = true;

var ballRadius = 3 * gameScale;
var ballSpin = 0.2;
var x = canvas.width / 2;
var y = canvas.height - 30;
var r = 0;
var dx = 0.005 * canvas.width;
var dy = -0.005 * canvas.height;
var speed = parseInt(config.general.ballSpeed);
var paddleHeight = 10 * gameScale;
var paddleWidth = 30 * gameScale;
var paddleX = (canvas.width - paddleWidth) / 2;
var paddleXprev = 0;
var paddleDx = 0.018 * canvas.width;
var rightPressed = false;
var leftPressed = false;
var brickWidth = 12 * gameScale;
var brickHeight = 5 * gameScale;
var brickPadding = 4 * gameScale;
var brickOffsetTop = 15 * gameScale;
var brickOffsetLeft = 2 * gameScale;
var brickRowCount = Math.floor(canvas.width / (brickWidth + brickPadding + brickOffsetLeft));
var brickColumnCount = config.general.rows;
var frameId = 0;
var gameState = 'waiting';
var score = 0;
var lives = config.general.lives;

var bricks = [];
for (var c = 0; c < brickColumnCount; c++) {
  bricks[c] = [];
  for (var r = 0; r < brickRowCount; r++) {
    bricks[c][r] = { x: 0, y: 0, status: 1 };
  }
}

document.addEventListener("click", clickHandler, false);
document.addEventListener("keydown", keyDownHandler, false);
document.addEventListener("keyup", keyUpHandler, false);
document.addEventListener("mousemove", mouseMoveHandler, false);
document.addEventListener("touchmove", touchMoveHandler, false);
window.addEventListener("resize", resizeHandler, false);
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
        fonts[key] = value;
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
  playSound(sounds.backgroundMusic);

  x = canvas.width / 2;
  y = canvas.height - paddleHeight - ballRadius - 30;

  ctx.clearRect(0, 0, canvas.width, canvas.height); //clear screen
  drawBackground();
  drawBricks();
  drawPaddle();

  overlay.setStyles({
    textColor: config.style.textColor,
    primaryColor: config.style.primaryColor,
    fontFamily: config.style.fontFamily
  });

  overlay.setMute(muted);
  overlay.showBanner('Brick Breaker');
  overlay.showButton('Start');
  overlay.setScore(score);
  overlay.setLives(lives);
  overlay.showStats();
}

function restart() {
  x = paddleX;
  y = canvas.height - paddleHeight - ballRadius - 30;
  dx = 0.005 * canvas.width;
  dy = -0.005 * canvas.height;
}

function clickHandler(e) {
  const { target } = e;

  if (target.id === 'button') {
    gameState = 'play';

    // double mute gets around ios mobile sound restrictions
    mute(); mute();

    draw();
  }

  if (target.id === 'mute') {
    mute();
  }
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
    paddleXprev = paddleX;
    paddleX = relativeX - paddleWidth / 2;
  }
}

function touchMoveHandler(e) {
  var relativeX = e.touches[0].clientX - canvas.offsetLeft;
  if (relativeX > 0 && relativeX < canvas.width) {
    paddleXprev = paddleX;
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
  let pv = (paddleX - paddleXprev)/10;

  // check for paddle
  if (cy + dy >= canvas.height - paddleHeight) {
    if (cx > paddleX && cx < paddleX + paddleWidth) {
      dx = dx + pv;
      dy = -dy;
    }
  }

  // check for splash
  if (cy + dy >= canvas.height + ballRadius) {
      lives--;
      playSound(sounds.dieSound);
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
          score++;
          playSound(sounds.scoreSound);
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
  var rowOffset = ((canvas.width - rowWidth) / 3);
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

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  checkPaddleCollisions();
  checkBrickCollisions();
  checkWallCollisions();

  // move paddle
  if (rightPressed && paddleX < canvas.width - paddleWidth) {
    paddleXprev = paddleX;
    paddleX += paddleDx;
  }
  else if (leftPressed && paddleX > 0) {
    paddleXprev = paddleX;
    paddleX -= paddleDx;
  }

  x += dx * speed;
  y += dy * speed;
  r += ballSpin;

  drawBackground();
  drawBricks();
  drawBall();
  drawPaddle();

  overlay.setScore(score);
  overlay.setLives(lives);

  if (gameState === 'play') {
    overlay.hideBanner();
    overlay.hideButton();
  }

  if (gameState === 'over' || gameState === 'win') {
    if (gameState === 'over') {
      overlay.showBanner("Game Over");
      playSound(sounds.gameoverSound);
    }

    if (gameState === 'win') {
      overlay.showBanner("You Win!");
      playSound(sounds.winSound);
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

function mute() {
  muted = !muted; // toggle muted
  overlay.setMute(muted); // update mute display

  if (muted) {
      // mute all game sounds
      Object.keys(sounds).forEach((key) => {
          sounds[key].muted = true;
          sounds[key].pause();
      });
  } else {
      // unmute all game sounds
      // and play background music
      Object.keys(sounds).forEach((key) => {
          sounds[key].muted = false;
          sounds.backgroundMusic.play();
      });
  }
}

function playSound(sound) {
  if (!sound) { return; }

  sound.currentTime = 0;
  if (!muted) { 
    sound.play();
  } else {
    sound.pause();
  }
}

// reload game on resize events
function resizeHandler() {
    document.location.reload();
    resize();
}


// koji injection handler
function injectHandler({ data }) {
  if (data.action === 'injectGlobal') {
    let { scope, key, value } = data.payload;
    if (key === 'ballSpeed') { value = parseInt(value); }

    config[scope][key] = value;

    mute();
    load();
  }
}

// load game and wait to start
load();
// Brick Breaker
import Koji from 'koji-tools';
Koji.pageLoad();
const config = Koji.config;

import {
  hashCode
} from './helpers/utils.js';
import {
  requestAnimationFrame,
  cancelAnimationFrame
} from './helpers/animationframe.js';
import {
  loadList,
  loadImage,
  loadSound,
  loadFont
} from 'game-asset-loader';
import Overlay from './helpers/overlay.js';

var canvas = document.getElementById("game");
var ctx = canvas.getContext("2d");

import audioContext from 'audio-context';
import audioPlayback from 'audio-play';
import unlockAudioContext from 'unlock-audio-context';

// get new width and height
var maxWidth = parseInt(config.settings.maxWidth);
var newWidth = window.innerWidth < maxWidth ? window.innerWidth : maxWidth;
var newHeight = window.innerHeight;

// set new canvas width and height
canvas.width = newWidth;
canvas.height = newHeight;

// center the canvas and set new width on overlay
canvas.style.marginLeft = `${(window.innerWidth - newWidth)/2}px`;

var audioCtx = audioContext(); // create new audio context
unlockAudioContext(audioCtx);
var playlist = [];

// setup overlay
var overlayNode = document.getElementById("overlay");
var overlay = new Overlay(overlayNode, {
  ...config.colors,
  ...config.settings
});
overlay.container.style.maxWidth = `${newWidth}px`;

var prefix = hashCode(config.settings.name); // set prefix for local-storage keys

// setup input and screen
var input = {
  right: false,
  left: false
};
var gameScale = ((canvas.width + canvas.height) / 270);
var screen = {
  top: 0,
  right: canvas.width,
  bottom: canvas.height,
  left: 0,
};

// setup frame
var frame = {
  count: 0
}

// game state
var state = {
  current: 'loading',
  prev: '',
  muted: localStorage.getItem(prefix.concat('muted')) === 'true',
  score: 0,
  lives: parseInt(config.settings.lives),
  ballSpeed: parseInt(config.settings.ballSpeed)
};

function setState(newState) {
  state = {
    ...state,
    ...{
      prev: state.current
    },
    ...newState
  };
}


var images = {};
var sounds = {};
var fonts = {};

var ballRadius = 3 * gameScale;
var x = screen / 2;
var y = canvas.height - 30;
var dx = 0.005 * canvas.width;
var dy = -0.005 * canvas.height;
var speed = parseInt(config.settings.ballSpeed);
var paddleHeight = 7 * gameScale;
var paddleWidth = 30 * gameScale;
var paddleX = (canvas.width - paddleWidth) / 2;
var paddleXprev = 0;
var paddleDx = 0.1 * canvas.width;
var brickWidth = 12 * gameScale;
var brickHeight = 5 * gameScale;
var brickPadding = 4 * gameScale;
var brickOffsetTop = 15 * gameScale;
var brickOffsetLeft = 2 * gameScale;
var brickRowCount = Math.floor(canvas.width / (brickWidth + brickPadding + brickOffsetLeft));
var brickColumnCount = parseInt(config.settings.rows);
var bricks = [];

function start() {
  // reset from config
  setState({
    lives: parseInt(config.settings.lives),
    ballSpeed: parseInt(config.settings.ballSpeed)
  });

  // build bricks
  brickColumnCount = parseInt(config.settings.rows);

  for (var c = 0; c < brickColumnCount; c++) {
    bricks[c] = [];
    for (var r = 0; r < brickRowCount; r++) {
      bricks[c][r] = {
        x: 0,
        y: 0,
        status: 1
      };
    }
  }

  // register event handlers
  document.addEventListener("click", ({
    target
  }) => clickHandler(target));
  document.addEventListener('keydown', ({
    code
  }) => handleKeys('keydown', code));
  document.addEventListener('keyup', ({
    code
  }) => handleKeys('keyup', code));

  document.addEventListener("mousemove", mouseMoveHandler);
  document.addEventListener("touchmove", touchMoveHandler);

  // reset game on resize and orientation change
  window.addEventListener("resize", reset);
  window.addEventListener("orientationchange", reset);

  // handle koji config changes
  Koji.on('change', (scope, key, value) => {
    console.log('updating configs...', scope, key, value);
    config[scope][key] = value;
    cancelAnimationFrame(frame.count - 1);
    start();
  });


  // load game
  load();
}

function load() {
  setState({
    current: 'loading'
  });

  // load assets
  loadList([
      loadImage('backgroundImage', config.images.backgroundImage),
      loadImage('ballImage', config.images.ballImage),
      loadImage('paddleImage', config.images.paddleImage),
      loadImage('brickImage', config.images.brickImage),
      loadSound('backgroundMusic', config.sounds.backgroundMusic),
      loadSound('winSound', config.sounds.winSound),
      loadSound('gameoverSound', config.sounds.gameoverSound),
      loadSound('scoreSound', config.sounds.scoreSound),
      loadSound('dieSound', config.sounds.dieSound),
      loadFont('gameFont', config.settings.fontFamily)
    ], (progress) => {
      document.getElementById('loading-progress').textContent = `${progress.percent}%`;
    })
    .then((assets) => {

      images = assets.image;
      sounds = assets.sound;
      fonts = assets.font;

      overlay.hideLoading();
      canvas.style.opacity = 1;


      setState({
        current: 'ready'
      });
      play();
    })
    .catch(err => console.error(err));

}

function play() {
  // clear screen
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  overlay.setScore(state.score);
  overlay.setLives(state.lives);

  drawBackground();
  drawBricks();
  drawPaddle();

  if (state.current === 'ready' && state.prev === 'loading') {
    playBackgroundMusic();

    x = canvas.width / 2;
    y = canvas.height - paddleHeight - ballRadius - 30;

    overlay.setMute(state.muted);
    overlay.setBanner(config.settings.name);
    overlay.setButton(config.settings.startText);
    overlay.setInstructions({
      desktop: config.settings.instructionsDesktop,
      mobile: config.settings.instructionsMobile
    });

    overlay.showStats();

    setState({ current: 'ready' })
  }

  if (state.current === 'play') {
    if (state.prev === 'ready') {
      overlay.hideBanner();
      overlay.hideButton();
      overlay.hideInstructions();
    }

    drawBall();

    checkPaddleCollisions();
    checkBrickCollisions();
    checkWallCollisions();

    // move paddle
    if (input.right && paddleX < canvas.width - paddleWidth) {
      paddleXprev = paddleX;
      paddleX += paddleDx / (canvas.width * 0.003);
    } else if (input.left && paddleX > 0) {
      paddleXprev = paddleX;
      paddleX -= paddleDx / (canvas.width * 0.003);
    }

    x += dx * state.ballSpeed;
    y += dy * state.ballSpeed;

  }

  // game win
  if (state.current === 'win') {
    overlay.setBanner(config.settings.winText);
    playSound('winSound', sounds.winSound);

    cancelAnimationFrame(frame.count - 1);
  }

  // game over
  if (state.current === 'over') {
    overlay.setBanner(config.settings.gameoverText);
    playSound('gameoverSound', sounds.gameoverSound);

    cancelAnimationFrame(frame.count - 1);
  }

  if (['play', 'ready'].includes(state.current)) {

    // get new animation frame from browser
    frame.count = requestAnimationFrame(play);
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

function restart() {
  x = paddleX;
  y = canvas.height - paddleHeight - ballRadius - 30;
  dx = 0.005 * canvas.width;
  dy = -0.005 * canvas.height;
}

function clickHandler(target) {
  if (target.id === 'button') {

    setState({
      current: 'play'
    });
  }

  if (target.id === 'mute') {
    mute();
  }

  if (['win', 'over'].includes(state.current)) {
    reset();
  }

}

function checkWallCollisions() {
  let cx = x + ballRadius;
  let cy = y + ballRadius;

  if (cx + dx >= canvas.width - ballRadius || cx + dx <= ballRadius) {
    dx = -dx;
  }

  if (cy + dy < ballRadius) {
    dy = -dy;
  }
}

function checkPaddleCollisions() {
  let cx = x + ballRadius;
  let cy = y + ballRadius;
  let pv = (paddleX - paddleXprev) / 10;
  console.log(cy, ballRadius);

  // check for paddle
  if (cy + dy > canvas.height - paddleHeight - ballRadius) {
    if (cx > paddleX && cx < paddleX + paddleWidth) {
      dx = dx + pv;
      dy = Math.abs(dy) * -1;
    }
  }

  // check for splash
  if (cy + dy >= canvas.height + ballRadius) {
    setState({
      lives: state.lives - 1
    });

    playSound('dieSound', sounds.dieSound);
    if (!state.lives) {
      setState({
        current: 'over'
      });
    } else {
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
          setState({
            score: state.score + 1
          });
          playSound('scoreSound', sounds.scoreSound);
          if (state.score == brickRowCount * brickColumnCount) {
            setState({
              current: 'win'
            });
          }
        }
      }
    }
  }
}

function mute() {
  let key = prefix.concat('muted');
  localStorage.setItem(
    key,
    localStorage.getItem(key) === 'true' ? 'false' : 'true'
  );

  state.muted = localStorage.getItem(key) === 'true';

  overlay.setMute(state.muted);

  if (state.muted) {
    audioCtx.suspend();
  } else {
    audioCtx.resume();
    playBackgroundMusic();
  }
}

function handleKeys(type, code) {

  if (type === 'keydown') {

    if (code === 'ArrowRight') {
      input.right = true;
    }

    if (code === 'ArrowLeft') {
      input.left = true;
    }
  }

  if (type === 'keyup') {

    if (code === 'ArrowRight') {
      input.right = false;
    }

    if (code === 'ArrowLeft') {
      input.left = false;
    }

    if (state.current === 'ready') {
      setState({
        current: 'play'
      });
    }
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

function playSound(key, audioBuffer, options = {}) {
  if (state.muted) {
    return;
  }
  let id = Math.random().toString(16).slice(2);
  playlist.push({
    id: id,
    key: key,
    playback: audioPlayback(audioBuffer, {
      ...{
        start: 0,
        end: audioBuffer.duration,
        context: audioCtx
      },
      ...options
    }, () => {
      // remove played sound from playlist
      playlist = playlist
        .filter(s => s.id != id);
    })
  });
}

function playBackgroundMusic() {
  if (!state.muted && !state.backgroundMusic) {
    let sound = sounds.backgroundMusic;
    state.backgroundMusic = audioPlayback(sound, {
      start: 0,
      end: sound.duration,
      loop: true,
      context: audioCtx
    });
  }
}

function reset() {
  document.location.reload();
}

// set background color
document.body.style.backgroundColor = config.colors.backgroundColor;

// start game
start();
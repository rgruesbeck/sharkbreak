var config = require('./config.json');

var canvas = document.getElementById("game");
var ctx = canvas.getContext("2d");

var images = {};
var ballRadius = 20;
var x = canvas.width/2;
var y = canvas.height-30;
var dx = 2;
var dy = -2;
var speed = 3;
var paddleHeight = 60;
var paddleWidth = 80;
var paddleX = (canvas.width-paddleWidth)/2;
var rightPressed = false;
var leftPressed = false;
var brickRowCount = 5;
var brickColumnCount = 3;
var brickWidth = 120;
var brickHeight = 50;
var brickPadding = 10;
var brickOffsetTop = 30;
var brickOffsetLeft = 30;
var frameId = 0;
var gameState = 'active';
var score = 0;
var lives = 3;

var font = 'Arial';
var textColor = 'red';
// background color
// font color
// font face
// ball image
// bricks image
// background image

// edit general
// edit audio
// edit audio


var bricks = [];
for(var c=0; c<brickColumnCount; c++) {
  bricks[c] = [];
  for(var r=0; r<brickRowCount; r++) {
    bricks[c][r] = { x: 0, y: 0, status: 1 };
  }
}

document.addEventListener("keydown", keyDownHandler, false);
document.addEventListener("keyup", keyUpHandler, false);
document.addEventListener("mousemove", mouseMoveHandler, false);
document.addEventListener("message", injectHandler, false);

function load() {

  // load images
  loadImage('backgroundImage', config.general.backgroundImage);
  loadImage('ballImage', config.general.ballImage);
  loadImage('paddleImage', config.general.paddleImage);
  loadImage('brickImage', config.general.brickImage);

  // load font
  loadFont(config.general.fontFamily);
}

function start() {
  // set canvas width and height
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;

  x = canvas.width/2;
  y = canvas.height-paddleHeight-ballRadius-30;

  if (gameState === 'active') {
    draw();
  }
}

function restart() {
  x = paddleX;
  y = canvas.height-paddleHeight-ballRadius-30;
  dx = -dx
  dy = -3;
}

function injectHandler(e) {
  // New stuff from koji
  var data = e.data;
  if (data.action === 'injectGlobal')  {
    // todo on koji
    console.log(data.action);
    config[key] = value;
  }
}

function loadImage(key, url) {
  var image = new Image;
  image.src = url;
  images[key] = image;
}

function loadFont(fontSrc) {
  if (!fontSrc.includes('http')) {
    font = fontSrc;
    return;
  }

  var link = document.createElement('link');
  link.rel = 'stylesheet';
  link.type = 'text/css';
  link.href = fontSrc;
  document.getElementsByTagName('head')[0].appendChild(link);

  // Trick from https://stackoverflow.com/questions/2635814/
  var image = new Image;
  image.src = link.href;
  image.onerror = function() {
    var match = fontSrc.match(/family=(.*?)$/)[1];
    var fontName = `"${match.replace('+', ' ')}"`;
    font = fontName;
  };
}

function keyDownHandler(e) {
    if(e.key == "Right" || e.key == "ArrowRight") {
        rightPressed = true;
    }
    else if(e.key == "Left" || e.key == "ArrowLeft") {
        leftPressed = true;
    }
}

function keyUpHandler(e) {
    if(e.key == "Right" || e.key == "ArrowRight") {
        rightPressed = false;
    }
    else if(e.key == "Left" || e.key == "ArrowLeft") {
        leftPressed = false;
    }
}

function mouseMoveHandler(e) {
  var relativeX = e.clientX - canvas.offsetLeft;
  if(relativeX > 0 && relativeX < canvas.width) {
    paddleX = relativeX - paddleWidth/2;
  }
}

function checkWallCollisions() {
  let cx = x + ballRadius;
  let cy = y + ballRadius;

  if(cx + dx > canvas.width-ballRadius || cx + dx < ballRadius) {
    dx = -dx;
  }
  if(cy + dy < ballRadius) {
    dy = -dy;
  }
}

function checkPaddleCollisions() {
  let cx = x + ballRadius;
  let cy = y + ballRadius;

  if(cy + dy > canvas.height-ballRadius-paddleHeight) {
    if(cx > paddleX && cx < paddleX + paddleWidth) {
      dy = -dy;
    }
    else {
      lives--;
      if(!lives) {
        gameState = 'over';
        drawGameState();
      }
      else {
        restart();
        /*
        x = canvas.width/2;
        y = canvas.height-30;
        dx = 3;
        dy = -3;
        paddleX = (canvas.width-paddleWidth)/2;
        */
      }
    }
  }
}

function checkBrickCollisions() {
  var cx = x + ballRadius;
  var cy = y + ballRadius;

  for(var c=0; c<brickColumnCount; c++) {
    for(var r=0; r<brickRowCount; r++) {
      var b = bricks[c][r];
      if(b.status == 1) {
        if(cx > b.x && cx < b.x+brickWidth && cy > b.y && cy < b.y+brickHeight) {
          dy = -dy;
          b.status = 0;
          speed += 0.15;
          score++;
          if(score == brickRowCount*brickColumnCount) {
            gameState = 'win';
            drawGameState();
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

  ctx.drawImage(images.ballImage, x, y, ballRadius*2, ballRadius*2);
}

function drawPaddle() {

  ctx.drawImage(images.paddleImage, paddleX, canvas.height-paddleHeight, paddleWidth, paddleHeight);
}
function drawBricks() {
  for(var c=0; c<brickColumnCount; c++) {
    for(var r=0; r<brickRowCount; r++) {
      if(bricks[c][r].status == 1) {
        var brickX = (r*(brickWidth+brickPadding))+brickOffsetLeft;
        var brickY = (c*(brickHeight+brickPadding))+brickOffsetTop;
        bricks[c][r].x = brickX;
        bricks[c][r].y = brickY;
        ctx.drawImage(images.brickImage, brickX, brickY, brickWidth, brickHeight);
      }
    }
  }
}
function drawScore() {
  ctx.font = "24px " + font;
  ctx.fillStyle = config.general.textColor;
  ctx.fillText("Score: "+score, 8, 20);
}
function drawLives() {
  var message = "Lives: " + lives;
  var text = ctx.measureText(message);

  ctx.font = "24px " + font;
  ctx.fillStyle = config.general.textColor;
  ctx.fillText(message, canvas.width-text.width, 20);
}

function drawMessage(message) {
  ctx.font = "46px " + font; 
  ctx.fillStyle = config.general.textColor;

  var text = ctx.measureText(message);
  ctx.fillText(message, (canvas.width/2)-(text.width/2), canvas.height/2);
}

function drawGameState() {
  // win
  if (gameState === 'win') {
    drawMessage("You Win!");
  }

  // over
  if (gameState === 'over') {
    drawMessage("Game Over");
  }
}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  drawBackground();
  drawBricks();
  drawBall();
  drawPaddle();
  drawScore();
  drawLives();

  checkPaddleCollisions();
  checkBrickCollisions();
  checkWallCollisions();

  // ball

  if(rightPressed && paddleX < canvas.width-paddleWidth) {
    paddleX += 7;
  }
  else if(leftPressed && paddleX > 0) {
    paddleX -= 7;
  }

  x += dx * speed;
  y += dy * speed;

  if (gameState === 'over' || gameState === 'win') {
    console.log(gameState);
    cancelAnimationFrame(frameId);
  } else {
    frameId = requestAnimationFrame(draw);
  }

}

// load game
load();

// game starts
start();

angular.module('myApp', ['ngTouch','ui.bootstrap'])
  .run(['$translate', '$log', 'realTimeService', 'randomService',
      function ($translate, $log, realTimeService, randomService) {
'use strict';

var canvasWidth = 300;
var canvasHeight = 300;
var multiplier;
var par;


function createCanvasController(canvas) {
  $log.info("createCanvasController for canvas.id=" + canvas.id);
  var isGameOngoing = false;
  var isSinglePlayer = false;
  var playersInfo = null;
  var yourPlayerIndex = null;
  var matchController = null;
  var startMatchTime; // For displaying a countdown.

  var allScores = [];

// RequestAnimFrame: a browser API for getting smooth animations
window.requestAnimFrame = (function(){
	return  window.requestAnimationFrame       || 
		window.webkitRequestAnimationFrame || 
		window.mozRequestAnimationFrame    || 
		window.oRequestAnimationFrame      || 
		window.msRequestAnimationFrame     ||  
		function( callback ){
			return window.setTimeout(callback, 1000 / 60);
		};
})();

window.cancelRequestAnimFrame = ( function() {
	return window.cancelAnimationFrame          ||
		window.webkitCancelRequestAnimationFrame    ||
		window.mozCancelRequestAnimationFrame       ||
		window.oCancelRequestAnimationFrame     ||
		window.msCancelRequestAnimationFrame        ||
		clearTimeout;
} )();

  function gotStartMatch(params) {
    yourPlayerIndex = params.yourPlayerIndex;
    playersInfo = params.playersInfo;
    matchController = params.matchController;
    isGameOngoing = true;
    isSinglePlayer = playersInfo.length === 1;

    startMatchTime = new Date().getTime();
    startScreen();

  }

  function gotMessage(params) {
  }

    function gotEndMatch(endMatchScores) {
    // Note that endMatchScores can be null if the game was cancelled (e.g., someone disconnected).
    allScores = endMatchScores;
    isGameOngoing = false;
    
  }

// Initialize canvas and required variables
		var ctx = canvas.getContext("2d"), // Create canvas context
		W = 300, // Window's width
		H = 300, // Window's height
		particles = [], // Array containing particles
		ball = {}, // Ball object
		paddles = [2], // Array containing two paddles
		mouse = {}, // Mouse object to store it's current position
		points = 0, // Varialbe to store points
		fps = 60, // Max FPS (frames per second)
		particlesCount = 20, // Number of sparks when ball strikes the paddle
		flag = 0, // Flag variable which is changed on collision
		particlePos = {}, // Object to contain the position of collision 
		multipler = 1, // Varialbe to control the direction of sparks
		startBtn = {}, // Start button object
		restartBtn = {}, // Restart button object
		over = 0, // flag varialbe, cahnged when the game is over
		inita, // variable to initialize animation
		paddleHit;
		

// Add mousemove and mousedown events to the canvas
canvas.addEventListener("mousemove", trackPosition, true);
canvas.addEventListener("mousedown", btnClick, true);

// Initialise the collision sound
var collision = document.getElementById("collide");

// Set the canvas's height and width to full screen
canvas.width = W;
canvas.height = H;

// Function to paint canvas
function paintCanvas() {
	ctx.fillStyle = "black";
	ctx.fillRect(0, 0, W, H);
}

// Function for creating paddles
function Paddle(pos) {
	// Height and width
	this.h = 5;
	this.w = 80;
	
	// Paddle's position
	this.x = W/2 - this.w/2;
	this.y = (pos === "top") ? 0 : H - this.h;
	
}

// Push two new paddles into the paddles[] array
paddles.push(new Paddle("bottom"));
paddles.push(new Paddle("top"));

// Ball object
ball = {
	x: 50,
	y: 50, 
	r: 5,
	c: "white",
	vx: 4,
	vy: 8,
	
	// Function for drawing ball on canvas
	draw: function() {
		ctx.beginPath();
		ctx.fillStyle = this.c;
		ctx.arc(this.x, this.y, this.r, 0, Math.PI*2, false);
		ctx.fill();
	}
};


// Start Button object
startBtn = {
	w: 100,
	h: 50,
	x: W/2 - 50,
	y: H/2 - 25,
	
	draw: function() {
		ctx.strokeStyle = "white";
		ctx.lineWidth = "2";
		ctx.strokeRect(this.x, this.y, this.w, this.h);
		
		ctx.font = "18px Arial, sans-serif";
		ctx.textAlign = "center";
		ctx.textBaseline = "middle";
		ctx.fillStlye = "white";
		ctx.fillText("Start", W/2, H/2 );
	}
};

// Restart Button object
restartBtn = {
	w: 100,
	h: 50,
	x: W/2 - 50,
	y: H/2 - 50,
	
	draw: function() {
		ctx.strokeStyle = "white";
		ctx.lineWidth = "2";
		ctx.strokeRect(this.x, this.y, this.w, this.h);
		
		ctx.font = "18px Arial, sans-serif";
		ctx.textAlign = "center";
		ctx.textBaseline = "middle";
		ctx.fillStlye = "white";
		ctx.fillText("Restart", W/2, H/2 - 25 );
	}
};

// Function for creating particles object
function createParticles(x, y, m) {
    this.x = x || 0;
	this.y = y || 0;
	
	this.radius = 1.2;
	
	this.vx = -1.5 +  randomService.random(100) *3;
	this.vy = m * randomService.random(100) * 1.5;
}

// Draw everything on canvas
function draw() {
	paintCanvas();
	for(var i = 0; i < paddles.length; i++) {
		var p = paddles[i];
		
		if(i == 1) {
			ctx.fillStyle = "#66FFFF";
		}
		else{
			ctx.fillStyle = "yellow";
		}
		ctx.fillRect(p.x, p.y, p.w, p.h);
	}
	
	ball.draw();
	update();
}

// Function to increase speed after every 5 points
function increaseSpd() {
	if(points % 4 == 0) {
		if(Math.abs(ball.vx) < 15) {
			ball.vx += (ball.vx < 0) ? -1 : 1;
			ball.vy += (ball.vy < 0) ? -2 : 2;
		}
	}
}

// Track the position of mouse cursor
var lastX = null, lastY = null;

function processTouch(e) {
    //e.preventDefault(); // prevent scrolling and dispatching mouse events.
    var touchobj = e.targetTouches[0]; // targetTouches includes only touch points in this canvas.
    if (!touchobj) {
      return;
    }
    if (lastX === null) {
      lastX = touchobj.pageX;
      lastY = touchobj.pageY;
      return;
    }
  }

  canvas.addEventListener('touchstart', function(e) {
    lastX = null;
    lastY = null;
    processTouch(e);
  }, false);
  canvas.addEventListener('touchmove', function(e) {
  	lastX = null;
    lastY = null;
    processTouch(e);
  }, false);
  canvas.addEventListener('touchend', function(e) {
    processTouch(e);
  }, false);

function trackPosition(e) {
	lastX = e.pageX;
	lastY = e.pageY;
}


// Function to update positions, score and everything.
// Basically, the main game logic is defined here
function update() {
	
	var secondsFromStart =
    Math.floor((new Date().getTime() - startMatchTime) / 1000);
    if (secondsFromStart < 3) {
      // Countdown to really start
      // Draw countdown
      var secondsToReallyStart = 3 - secondsFromStart;


      ctx.fillStyle = "white";
      ctx.font = '80px sans-serif';
      ctx.fillText("" + secondsToReallyStart, W / 2, H / 2);

      secondsFromStart =
      Math.floor((new Date().getTime() - startMatchTime) / 1000);

      return;

    }
	// Update scores
	updateScore(); 
	
	// Move the paddles on mouse move
	if(lastX && lastY) {
		for(var i = 1; i < paddles.length; i++) {
			var p = paddles[i];
			p.x = lastX -  (window.innerWidth-W)/2 - p.w/2;
		}		
	}
	
	// Move the ball
	ball.x += ball.vx;
	ball.y += ball.vy;
	
	// Collision with paddles
	var p1 = paddles[1];
	var p2 = paddles[2];
	
	// If the ball strikes with paddles,
	// invert the y-velocity vector of ball,
	// increment the points, play the collision sound,
	// save collision's position so that sparks can be
	// emitted from that position, set the flag variable,
	// and change the multiplier
	if(collides(ball, p1)) {
		collideAction(ball, p1);
	}
	
	
	else if(collides(ball, p2)) {
		collideAction(ball, p2);
	} 
	
	else {
		// Collide with walls, If the ball hits the top/bottom,
		// walls, run gameOver() function
		if(ball.y + ball.r > H) {
			ball.y = H - ball.r;
			gameOver();
		} 
		
		else if(ball.y < 0) {
			ball.y = ball.r;
			gameOver();
		}
		
		// If ball strikes the vertical walls, invert the 
		// x-velocity vector of ball
		if(ball.x + ball.r > W) {
			ball.vx = -ball.vx;
			ball.x = W - ball.r;
		}
		
		else if(ball.x -ball.r < 0) {
			ball.vx = -ball.vx;
			ball.x = ball.r;
		}
	}
	
	
	
	// If flag is set, push the particles
	if(flag == 1) { 
		for(var k = 0; k < particlesCount; k++) {
			particles.push(new createParticles(particlePos.x, particlePos.y, multiplier));
		}
	}	
	
	// Emit particles/sparks
	emitParticles();
	
	// reset flag
	flag = 0;
}

//Function to check collision between ball and one of
//the paddles
function collides(b, p) {
	if(b.x + ball.r >= p.x && b.x - ball.r <=p.x + p.w) {
		if(b.y >= (p.y - p.h) && p.y > 0){
			paddleHit = 1;
			return true;
		}
		
		else if(b.y <= p.h && p.y == 0) {
			paddleHit = 2;
			return true;
		}
		
		else return false;
	}
}

//Do this when collides == true
function collideAction(ball, p) {
	ball.vy = -ball.vy;
	
	if(paddleHit == 1) {
		ball.y = p.y - p.h;
		particlePos.y = ball.y + ball.r;
		multiplier = -1;	
	}
	
	else if(paddleHit == 2) {
		ball.y = p.h + ball.r;
		particlePos.y = ball.y - ball.r;
		multiplier = 1;	
	}
	
	points++;
	increaseSpd();
	
	if(collision) {
		if(points > 0) 
			collision.pause();
		
		collision.currentTime = 0;
		collision.play();
	}
	
	particlePos.x = ball.x;
	flag = 1;
}

// Function for emitting particles
function emitParticles() { 
	for(var j = 0; j < particles.length; j++) {
		par = particles[j];
		
		ctx.beginPath(); 
		ctx.fillStyle = "white";
		if (par.radius > 0) {
			ctx.arc(par.x, par.y, par.radius, 0, Math.PI*2, false);
		}
		ctx.fill();	 
		
		par.x += par.vx; 
		par.y += par.vy; 
		
		// Reduce radius so that the particles die after a few seconds
		par.radius = Math.max(par.radius - 0.05, 0.0); 
		
	} 
}

// Function for updating score
function updateScore() {
	ctx.fillStlye = "white";
	ctx.font = "16px Arial, sans-serif";
	ctx.textAlign = "left";
	ctx.textBaseline = "top";
	ctx.fillText("Score: " + points, 20, 20 );
}

// Function to run when the game overs
function gameOver() {
	if (!isGameOngoing) {
      return;
    }
    // Stop the Animation
	cancelRequestAnimFrame(inita);
    isGameOngoing = false;
    allScores[yourPlayerIndex] = points;
    matchController.endMatch(allScores);

    // Set the over flag
	over = 1;
	
	
	/*
	ctx.fillStlye = "white";
	ctx.font = "20px Arial, sans-serif";
	ctx.textAlign = "center";
	ctx.textBaseline = "middle";
	ctx.fillText("Game Over - You scored "+points+" points!", W/2, H/2 + 25 );
	
	// Stop the Animation
	cancelRequestAnimFrame(init);
	
	
	// Show the restart button
	restartBtn.draw();
	*/
}

// Function for running the whole animation
function animloop() {
	inita = requestAnimFrame(animloop);
	draw();
}

// Function to execute at startup
function startScreen() {
	draw();

	if(over == 1) {

			ball.x = 20;
			ball.y = 20;
			points = 0;
			ball.vx = 4;
			ball.vy = 8;

			for(var i = 1; i < paddles.length; i++) {
			var p = paddles[i];
			p.x = W/2 - 40;
			}		

			points = 0;
			
			over = 0;

	}
	animloop();
}

// On button click (Restart and start)
function btnClick(e) {
	
	// Variables for storing mouse position on click
	var mx = e.pageX,
			my = e.pageY;
	
	// Click start button
	if(mx >= startBtn.x && mx <= startBtn.x + startBtn.w) {
		animloop();
		
		// Delete the start button after clicking it
		startBtn = {};
	}
	
	// If the game is over, and the restart button is clicked
	if(over == 1) {
		if(mx >= restartBtn.x && mx <= restartBtn.x + restartBtn.w) {
			ball.x = 20;
			ball.y = 20;
			points = 0;
			ball.vx = 4;
			ball.vy = 8;
			animloop();
			
			over = 0;
		}
	}
}

  return {
    gotStartMatch: gotStartMatch,
    gotMessage: gotMessage,
    gotEndMatch: gotEndMatch
  };
} // end of createCanvasController


realTimeService.init({
  createCanvasController: createCanvasController,
  canvasWidth: canvasWidth,
  canvasHeight: canvasHeight
});

// Show the start screen

}]);
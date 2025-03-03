document.addEventListener('DOMContentLoaded', () => {
    const canvas = document.getElementById('game-canvas');
    const ctx = canvas.getContext('2d');
    const scoreElement = document.getElementById('score');
    const gameMessage = document.querySelector('.game-message');

    // Set canvas dimensions
    canvas.width = 360;
    canvas.height = 640;

    // Game variables
    let game = {
        isRunning: false,
        speed: 1.5, // Starting with slower speed
        gravity: 0.3, // Normal gravity (positive value)
        score: 0,
        frameCount: 0,
        pipeGap: 200, // Starting with a larger gap between pipes (easier)
        pipeFrequency: 120 // Starting with less frequent pipes (easier)
    };

    // Bird object
    const bird = {
        x: 50,
        y: canvas.height / 2,
        width: 34,
        height: 24,
        velocity: 0,
        jumpStrength: 7, // Starting with less jump strength (easier to control)
        
        // Draw the bird
        draw: function() {
            ctx.fillStyle = '#f4ce14';
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.height / 2, 0, Math.PI * 2);
            ctx.fill();
            
            // Draw eye
            ctx.fillStyle = 'black';
            ctx.beginPath();
            ctx.arc(this.x + 8, this.y - 5, 4, 0, Math.PI * 2);
            ctx.fill();
            
            // Draw beak
            ctx.fillStyle = '#ff8800';
            ctx.beginPath();
            ctx.moveTo(this.x + 12, this.y);
            ctx.lineTo(this.x + 20, this.y);
            ctx.lineTo(this.x + 12, this.y + 5);
            ctx.fill();
            
            // Draw wing
            ctx.fillStyle = '#e6b800';
            ctx.beginPath();
            ctx.ellipse(this.x - 5, this.y + 5, 10, 6, 0, 0, Math.PI * 2);
            ctx.fill();
        },
        
        // Update bird position
        update: function() {
            this.velocity += game.gravity;
            this.y += this.velocity;
            
            // Prevent bird from going off the top of the screen
            if (this.y < this.height / 2) {
                this.y = this.height / 2;
                this.velocity = 0;
            }
            
            // Check if bird hits the ground
            if (this.y > canvas.height - this.height / 2) {
                this.y = canvas.height - this.height / 2;
                gameOver();
            }
        },
        
        // Make the bird jump (moves upward with normal gravity)
        jump: function() {
            this.velocity = -this.jumpStrength; // Negative to move upward with normal gravity
        },
        
        // Check collision with pipes
        checkCollision: function(pipe) {
            // Calculate bird's bounding box
            const birdLeft = this.x - this.width / 2;
            const birdRight = this.x + this.width / 2;
            const birdTop = this.y - this.height / 2;
            const birdBottom = this.y + this.height / 2;
            
            // Calculate pipe's bounding boxes (top and bottom)
            const pipeTopLeft = pipe.x;
            const pipeTopRight = pipe.x + pipe.width;
            const pipeTopTop = 0;
            const pipeTopBottom = pipe.topHeight;
            
            const pipeBottomLeft = pipe.x;
            const pipeBottomRight = pipe.x + pipe.width;
            const pipeBottomTop = canvas.height - pipe.bottomHeight;
            const pipeBottomBottom = canvas.height;
            
            // Check collision with top pipe
            if (
                birdRight > pipeTopLeft &&
                birdLeft < pipeTopRight &&
                birdTop < pipeTopBottom
            ) {
                return true;
            }
            
            // Check collision with bottom pipe
            if (
                birdRight > pipeBottomLeft &&
                birdLeft < pipeBottomRight &&
                birdBottom > pipeBottomTop
            ) {
                return true;
            }
            
            return false;
        }
    };

    // Pipes array
    let pipes = [];
    
    // Pipe constructor
    class Pipe {
        constructor() {
            this.x = canvas.width;
            this.width = 60;
            this.gap = game.pipeGap; // Use the dynamic pipe gap from game settings
            this.scored = false;
            
            // Randomize the gap position
            const minHeight = 50;
            const maxHeight = canvas.height - this.gap - minHeight;
            this.topHeight = Math.floor(Math.random() * (maxHeight - minHeight + 1)) + minHeight;
            this.bottomHeight = canvas.height - this.topHeight - this.gap;
        }
        
        // Draw the pipe
        draw() {
            // Draw top pipe
            ctx.fillStyle = '#74c365';
            ctx.fillRect(this.x, 0, this.width, this.topHeight);
            
            // Draw pipe cap
            ctx.fillStyle = '#2e8b57';
            ctx.fillRect(this.x - 5, this.topHeight - 20, this.width + 10, 20);
            
            // Draw bottom pipe
            ctx.fillStyle = '#74c365';
            ctx.fillRect(this.x, canvas.height - this.bottomHeight, this.width, this.bottomHeight);
            
            // Draw pipe cap
            ctx.fillStyle = '#2e8b57';
            ctx.fillRect(this.x - 5, canvas.height - this.bottomHeight, this.width + 10, 20);
        }
        
        // Update pipe position
        update() {
            this.x -= game.speed;
            
            // Check if the bird has passed the pipe
            if (!this.scored && this.x + this.width < bird.x) {
                game.score++;
                scoreElement.textContent = game.score;
                this.scored = true;
                
                // Increase difficulty as score increases
                updateDifficulty();
            }
            
            // Check collision with bird
            if (bird.checkCollision(this)) {
                gameOver();
            }
        }
    }
    
    // Draw background
    function drawBackground() {
        // Sky
        ctx.fillStyle = '#70c5ce';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Ground
        ctx.fillStyle = '#dec387';
        ctx.fillRect(0, canvas.height - 20, canvas.width, 20);
        
        // Grass
        ctx.fillStyle = '#5d8700';
        ctx.fillRect(0, canvas.height - 20, canvas.width, 5);
    }
    
    // Game loop
    function gameLoop() {
        if (!game.isRunning) return;
        
        // Clear canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // Draw background
        drawBackground();
        
        // Update and draw bird
        bird.update();
        bird.draw();
        
        // Add new pipe based on dynamic pipe frequency
        game.frameCount++;
        if (game.frameCount % game.pipeFrequency === 0) {
            pipes.push(new Pipe());
        }
        
        // Update and draw pipes
        for (let i = pipes.length - 1; i >= 0; i--) {
            pipes[i].update();
            pipes[i].draw();
            
            // Remove pipes that are off screen
            if (pipes[i].x + pipes[i].width < 0) {
                pipes.splice(i, 1);
            }
        }
        
        requestAnimationFrame(gameLoop);
    }
    
    // Function to update difficulty based on score
    function updateDifficulty() {
        // Gradually increase game speed (max 3)
        game.speed = Math.min(3, 1.5 + (game.score * 0.05));
        
        // Gradually increase gravity strength (max 0.6)
        game.gravity = Math.min(0.6, 0.3 + (game.score * 0.02));
        
        // Gradually increase jump strength (max 12)
        bird.jumpStrength = Math.min(12, 7 + (game.score * 0.2));
        
        // Gradually decrease pipe gap (min 120)
        game.pipeGap = Math.max(120, 200 - (game.score * 5));
        
        // Gradually decrease pipe frequency (min 70)
        game.pipeFrequency = Math.max(70, 120 - (game.score * 3));
    }
    
    // Start game
    function startGame() {
        if (game.isRunning) return;
        
        // Reset game variables
        game.isRunning = true;
        game.score = 0;
        game.frameCount = 0;
        scoreElement.textContent = game.score;
        
        // Reset difficulty settings
        game.speed = 1.5;
        game.gravity = 0.3;
        bird.jumpStrength = 7;
        game.pipeGap = 200;
        game.pipeFrequency = 120;
        
        // Reset bird position
        bird.y = canvas.height / 2;
        bird.velocity = 0;
        
        // Clear pipes
        pipes = [];
        
        // Hide game message
        gameMessage.innerHTML = '';
        
        // Start game loop
        gameLoop();
    }
    
    // Game over
    function gameOver() {
        game.isRunning = false;
        gameMessage.innerHTML = '<p>Game Over</p><p>Press Space or Tap to Restart</p><p>Final Score: ' + game.score + '</p>';
    }
    
    // Function to handle jump action (used by both keyboard and touch)
    function handleJumpAction(e) {
        e.preventDefault(); // Prevent default actions
        if (!game.isRunning) {
            startGame();
        } else {
            bird.jump();
        }
    }
    
    // Event listeners for keyboard
    document.addEventListener('keydown', (e) => {
        if (e.code === 'Space') {
            handleJumpAction(e);
        }
    });
    
    // Event listeners for touch devices
    canvas.addEventListener('touchstart', handleJumpAction, { passive: false });
    gameMessage.addEventListener('touchstart', handleJumpAction, { passive: false });
    
    // Prevent scrolling when touching the game area
    document.querySelector('.game-container').addEventListener('touchmove', (e) => {
        e.preventDefault();
    }, { passive: false });
    
    // Initial draw
    drawBackground();
    bird.draw();
});

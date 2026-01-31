class Game {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.score = 0;
        this.lives = 3;
        this.gameOver = false;
        
        // Player
        this.player = {
            x: this.canvas.width / 2 - 25,
            y: this.canvas.height - 60,
            width: 50,
            height: 30,
            speed: 5
        };
        
        // Bullets
        this.bullets = [];
        this.enemyBullets = [];
        
        // Aliens
        this.aliens = [];
        this.alienSpeed = 1;
        this.alienDirection = 1;
        this.alienDropSpeed = 20;
        
        // Input
        this.keys = {};
        this.lastShot = 0;
        
        this.init();
    }
    
    init() {
        this.createAliens();
        this.setupEventListeners();
        this.gameLoop();
    }
    
    createAliens() {
        this.aliens = [];
        for (let row = 0; row < 5; row++) {
            for (let col = 0; col < 10; col++) {
                this.aliens.push({
                    x: col * 60 + 50,
                    y: row * 50 + 50,
                    width: 40,
                    height: 30,
                    alive: true
                });
            }
        }
    }
    
    setupEventListeners() {
        document.addEventListener('keydown', (e) => {
            this.keys[e.code] = true;
        });
        
        document.addEventListener('keyup', (e) => {
            this.keys[e.code] = false;
        });
        
        document.getElementById('restartBtn').addEventListener('click', () => {
            this.restart();
        });
    }
    
    update() {
        if (this.gameOver) return;
        
        this.updatePlayer();
        this.updateBullets();
        this.updateAliens();
        this.checkCollisions();
        this.checkGameState();
    }
    
    updatePlayer() {
        // Move left
        if (this.keys['ArrowLeft'] && this.player.x > 0) {
            this.player.x -= this.player.speed;
        }
        
        // Move right
        if (this.keys['ArrowRight'] && this.player.x < this.canvas.width - this.player.width) {
            this.player.x += this.player.speed;
        }
        
        // Shoot
        if (this.keys['Space'] && Date.now() - this.lastShot > 250) {
            this.bullets.push({
                x: this.player.x + this.player.width / 2 - 2,
                y: this.player.y,
                width: 4,
                height: 10,
                speed: 7
            });
            this.lastShot = Date.now();
        }
    }
    
    updateBullets() {
        // Update player bullets
        this.bullets = this.bullets.filter(bullet => {
            bullet.y -= bullet.speed;
            return bullet.y > 0;
        });
        
        // Update enemy bullets
        this.enemyBullets = this.enemyBullets.filter(bullet => {
            bullet.y += bullet.speed;
            return bullet.y < this.canvas.height;
        });
        
        // Random alien shooting
        if (Math.random() < 0.02) {
            const aliveAliens = this.aliens.filter(alien => alien.alive);
            if (aliveAliens.length > 0) {
                const shooter = aliveAliens[Math.floor(Math.random() * aliveAliens.length)];
                this.enemyBullets.push({
                    x: shooter.x + shooter.width / 2 - 2,
                    y: shooter.y + shooter.height,
                    width: 4,
                    height: 10,
                    speed: 3
                });
            }
        }
    }
    
    updateAliens() {
        let shouldDrop = false;
        
        // Check if aliens hit edge
        for (let alien of this.aliens) {
            if (!alien.alive) continue;
            
            if ((alien.x <= 0 && this.alienDirection === -1) || 
                (alien.x >= this.canvas.width - alien.width && this.alienDirection === 1)) {
                shouldDrop = true;
                break;
            }
        }
        
        if (shouldDrop) {
            this.alienDirection *= -1;
            for (let alien of this.aliens) {
                if (alien.alive) {
                    alien.y += this.alienDropSpeed;
                }
            }
        } else {
            // Move aliens horizontally
            for (let alien of this.aliens) {
                if (alien.alive) {
                    alien.x += this.alienSpeed * this.alienDirection;
                }
            }
        }
    }
    
    checkCollisions() {
        // Player bullets vs aliens
        for (let i = this.bullets.length - 1; i >= 0; i--) {
            const bullet = this.bullets[i];
            
            for (let alien of this.aliens) {
                if (alien.alive && this.isColliding(bullet, alien)) {
                    alien.alive = false;
                    this.bullets.splice(i, 1);
                    this.score += 10;
                    this.updateScore();
                    break;
                }
            }
        }
        
        // Enemy bullets vs player
        for (let i = this.enemyBullets.length - 1; i >= 0; i--) {
            const bullet = this.enemyBullets[i];
            
            if (this.isColliding(bullet, this.player)) {
                this.enemyBullets.splice(i, 1);
                this.lives--;
                this.updateLives();
                
                if (this.lives <= 0) {
                    this.gameOver = true;
                }
                break;
            }
        }
        
        // Aliens vs player
        for (let alien of this.aliens) {
            if (alien.alive && alien.y + alien.height >= this.player.y) {
                this.gameOver = true;
                break;
            }
        }
    }
    
    isColliding(rect1, rect2) {
        return rect1.x < rect2.x + rect2.width &&
               rect1.x + rect1.width > rect2.x &&
               rect1.y < rect2.y + rect2.height &&
               rect1.y + rect1.height > rect2.y;
    }
    
    checkGameState() {
        const aliveAliens = this.aliens.filter(alien => alien.alive);
        if (aliveAliens.length === 0) {
            // Wave complete, create new aliens
            this.createAliens();
            this.alienSpeed += 0.5;
        }
    }
    
    render() {
        // Clear canvas
        this.ctx.fillStyle = '#000';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        if (this.gameOver) {
            this.renderGameOver();
            return;
        }
        
        // Draw player
        this.ctx.fillStyle = '#0f0';
        this.ctx.fillRect(this.player.x, this.player.y, this.player.width, this.player.height);
        
        // Draw aliens
        this.ctx.fillStyle = '#f00';
        for (let alien of this.aliens) {
            if (alien.alive) {
                this.ctx.fillRect(alien.x, alien.y, alien.width, alien.height);
            }
        }
        
        // Draw bullets
        this.ctx.fillStyle = '#ff0';
        for (let bullet of this.bullets) {
            this.ctx.fillRect(bullet.x, bullet.y, bullet.width, bullet.height);
        }
        
        this.ctx.fillStyle = '#f0f';
        for (let bullet of this.enemyBullets) {
            this.ctx.fillRect(bullet.x, bullet.y, bullet.width, bullet.height);
        }
    }
    
    renderGameOver() {
        this.ctx.fillStyle = '#f00';
        this.ctx.font = '48px Courier New';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('GAME OVER', this.canvas.width / 2, this.canvas.height / 2);
        
        this.ctx.fillStyle = '#fff';
        this.ctx.font = '24px Courier New';
        this.ctx.fillText(`Final Score: ${this.score}`, this.canvas.width / 2, this.canvas.height / 2 + 50);
        
        document.getElementById('restartBtn').style.display = 'block';
    }
    
    updateScore() {
        document.getElementById('score').textContent = this.score;
    }
    
    updateLives() {
        document.getElementById('lives').textContent = this.lives;
    }
    
    restart() {
        this.score = 0;
        this.lives = 3;
        this.gameOver = false;
        this.alienSpeed = 1;
        this.bullets = [];
        this.enemyBullets = [];
        this.player.x = this.canvas.width / 2 - 25;
        
        this.createAliens();
        this.updateScore();
        this.updateLives();
        
        document.getElementById('restartBtn').style.display = 'none';
    }
    
    gameLoop() {
        this.update();
        this.render();
        requestAnimationFrame(() => this.gameLoop());
    }
}

// Start game when page loads
window.addEventListener('load', () => {
    new Game();
});
// Get canvas and context
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Load images
const bgImage = document.getElementById('bgImage');
const playerImage = document.getElementById('playerImage');
const enemyImage = document.getElementById('enemyImage');
const bossImage = document.getElementById('bossImage');  // New boss image
const potionImage = document.getElementById('potionImage');  // New potion image

// Game variables
let player = { x: 375, y: 500, width: 50, height: 50, speed: 5, health: 100 };  // Added health
let bullets = [];
let enemies = [];
let bosses = [];  // New array for bosses
let lasers = [];  // New array for boss lasers
let potions = [];  // New array for dropped potions
let score = 0;
let gameOver = false;
let bgY = 0;
let keys = {};

// Event listeners for keyboard input
document.addEventListener('keydown', (e) => {
    keys[e.code] = true;
    if (e.code === 'Space') {
        shootBullet();
        e.preventDefault();
    }
});
document.addEventListener('keyup', (e) => {
    keys[e.code] = false;
});

// Function to shoot bullets
function shootBullet() {
    bullets.push({ x: player.x + player.width / 2 - 2, y: player.y, width: 4, height: 10, speed: 7 });
    playSound(440, 0.1);
}

// Function to spawn enemies
function spawnEnemy() {
    enemies.push({ x: Math.random() * (canvas.width - 50), y: -50, width: 50, height: 50, speed: 2 });
}

// Function to spawn boss (after score 500)
function spawnBoss() {
    if (score >= 500 && bosses.length === 0) {  // Only one boss at a time
        bosses.push({ x: canvas.width / 2 - 75, y: -100, width: 150, height: 100, speed: 1, health: 5 });  // Larger, tougher
    }
}

// Function to shoot lasers from boss
function shootLaser(boss) {
    lasers.push({ x: boss.x + boss.width / 2 - 5, y: boss.y + boss.height, width: 10, height: 20, speed: 4 });
    playSound(220, 0.2);  // Deeper sound for lasers
}

// Simple sound function
function playSound(frequency, duration) {
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    oscillator.frequency.value = frequency;
    oscillator.type = 'square';
    gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
    oscillator.start();
    oscillator.stop(audioContext.currentTime + duration);
}

// Update game state
function update() {
    if (gameOver) return;

    // Move player
    if (keys['ArrowLeft'] && player.x > 0) player.x -= player.speed;
    if (keys['ArrowRight'] && player.x < canvas.width - player.width) player.x += player.speed;
    if (keys['ArrowUp'] && player.y > 0) player.y -= player.speed;
    if (keys['ArrowDown'] && player.y < canvas.height - player.height) player.y += player.speed;

    // Move bullets
    bullets.forEach((bullet, index) => {
        bullet.y -= bullet.speed;
        if (bullet.y < 0) bullets.splice(index, 1);
    });

    // Move enemies
    enemies.forEach((enemy, index) => {
        enemy.y += enemy.speed;
        if (enemy.y > canvas.height) {
            enemies.splice(index, 1);
            score -= 10;
        }
    });

    // Move bosses
    bosses.forEach((boss, index) => {
        boss.y += boss.speed;
        if (boss.y > canvas.height) {
            bosses.splice(index, 1);
        }
        // Boss shoots lasers occasionally
        if (Math.random() < 0.01) shootLaser(boss);
    });

    // Move lasers
    lasers.forEach((laser, index) => {
        laser.y += laser.speed;
        if (laser.y > canvas.height) lasers.splice(index, 1);
    });

    // Move potions
    potions.forEach((potion, index) => {
        potion.y += 1;  // Slow fall
        if (potion.y > canvas.height) potions.splice(index, 1);
    });

    // Spawn enemies and bosses
    if (Math.random() < 0.02) spawnEnemy();
    spawnBoss();

    // Check bullet-enemy collisions
    bullets.forEach((bullet, bIndex) => {
        enemies.forEach((enemy, eIndex) => {
            if (bullet.x < enemy.x + enemy.width &&
                bullet.x + bullet.width > enemy.x &&
                bullet.y < enemy.y + enemy.height &&
                bullet.y + bullet.height > enemy.y) {
                bullets.splice(bIndex, 1);
                enemies.splice(eIndex, 1);
                score += 100;
                playSound(880, 0.2);
                // Chance to drop potion
                if (Math.random() < 0.3) {
                    potions.push({ x: enemy.x, y: enemy.y, width: 30, height: 30 });
                }
            }
        });
    });

    // Check bullet-boss collisions
    bullets.forEach((bullet, bIndex) => {
        bosses.forEach((boss, bIndex2) => {
            if (bullet.x < boss.x + boss.width &&
                bullet.x + bullet.width > boss.x &&
                bullet.y < boss.y + boss.height &&
                bullet.y + bullet.height > boss.y) {
                bullets.splice(bIndex, 1);
                boss.health -= 1;
                if (boss.health <= 0) {
                    bosses.splice(bIndex2, 1);
                    score += 500;  // Big reward
                    playSound(1320, 0.3);
                }
            }
        });
    });

    // Check player-enemy/boss/laser collisions
    enemies.forEach((enemy) => {
        if (player.x < enemy.x + enemy.width &&
            player.x + player.width > enemy.x &&
            player.y < enemy.y + enemy.height &&
            player.y + player.height > enemy.y) {
            player.health -= 20;
            enemies.splice(enemies.indexOf(enemy), 1);
        }
    });
    bosses.forEach((boss) => {
        if (player.x < boss.x + boss.width &&
            player.x + player.width > boss.x &&
            player.y < boss.y + boss.height &&
            player.y + player.height > boss.y) {
            player.health -= 50;  // Boss hurts more
            bosses.splice(bosses.indexOf(boss), 1);
        }
    });
    lasers.forEach((laser, index) => {
        if (player.x < laser.x + laser.width &&
            player.x + player.width > laser.x &&
            player.y < laser.y + laser.height &&
            player.y + player.height > laser.y) {
            player.health -= 30;
            lasers.splice(index, 1);
        }
    });

    // Check player-potion collisions
    potions.forEach((potion, index) => {
        if (player.x < potion.x + potion.width &&
            player.x + player.width > potion.x &&
            player.y < potion.y + potion.height &&
            player.y + player.height > potion.y) {
            player.health = Math.min(player.health + 20, 100);  // Restore health, cap at 100
            potions.splice(index, 1);
            playSound(660, 0.2);  // Collect sound
        }
    });

    // Game over if health <= 0
    if (player.health <= 0) gameOver = true;

    // Scroll background
    bgY += 1;
    if (bgY >= canvas.height) bgY = 0;
}

// Draw everything
function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw scrolling background
    ctx.drawImage(bgImage, 0, bgY, canvas.width, canvas.height);
    ctx.drawImage(bgImage, 0, bgY - canvas.height, canvas.width, canvas.height);

    // Draw player
    ctx.drawImage(playerImage, player.x, player.y, player.width, player.height);

    // Draw bullets
    ctx.fillStyle = 'yellow';
    bullets.forEach(bullet => ctx.fillRect(bullet.x, bullet.y, bullet.width, bullet.height));

    // Draw enemies
    enemies.forEach(enemy => ctx.drawImage(enemyImage, enemy.x, enemy.y, enemy.width, enemy.height));

    // Draw bosses
    bosses.forEach(boss => ctx.drawImage(bossImage, boss.x, boss.y, boss.width, boss.height));

    // Draw lasers
    ctx.fillStyle = 'red';
    lasers.forEach(laser => ctx.fillRect(laser.x, laser.y, laser.width, laser.height));

    // Draw potions
    potions.forEach(potion => ctx.drawImage(potionImage, potion.x, potion.y, potion.width, potion.height));

    // Draw score and health
    ctx.fillStyle = 'white';
    ctx.font = '20px Arial';
    ctx.fillText(`Score: ${score}`, 10, 30);
    ctx.fillText(`Health: ${player.health}`, 10, 60);

    // Game over screen
    if (gameOver) {
        ctx.fillStyle = 'red';
        ctx.font = '40px Arial';
        ctx.fillText('GAME OVER', canvas.width / 2 - 100, canvas.height / 2);
        ctx.font = '20px Arial';
        ctx.fillText('Press R to Restart', canvas.width / 2 - 80, canvas.height / 2 + 40);
    }
}

// Game loop
function gameLoop() {
    update();
    draw();
    requestAnimationFrame(gameLoop);
}

// Restart on 'R' key
document.addEventListener('keydown', (e) => {
    if (e.code === 'KeyR' && gameOver) {
        player.x = 375;
        player.y = 500;
        player.health = 100;
        bullets = [];
        enemies = [];
        bosses = [];
        lasers = [];
        potions = [];
        score = 0;
        gameOver = false;
    }
});

// Start the game
gameLoop();
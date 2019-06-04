window.addEventListener('load', function load() {
    window.removeEventListener('load', load, false);

    const palatte = {
        background : '#ffef21',
        table      : '#000',
        divider    : '#fff',
        paddle     : '#fff',
        ball       : '#fff',
        bullet     : '#fff'
    };

    const audio = {
        ballHit   : 'wav/4359__noisecollector__pongblipf4.wav',
        shoot    : 'wav/344310__musiclegends__laser-shoot.wav',
        hit       : 'wav/462189__tolerabledruid6__8-bit-atari-boom.wav',
        explosion : 'wav/425335__soundholder__8bit-explosion-4.wav',
        point     : 'wav/275896__n-audioman__coin02.wav',
        gameover  : 'wav/443189__resofactor__c2-atari-kick.wav'
    };

    var score = {
        current       : 0,
        highscore     : getHighscore(),
        pointTimer    : 0,
        pointVal      : 0,
        killCount     : 0,
        gameoverTimer : 0,
    };

    var gameObjs = {
        pBullets : [],
        cBullets : []
    };

    var flag = {
        hasBoosted : false,
        hasFired   : false
    };

    var canvas = document.createElement('canvas'),
        ctx = canvas.getContext('2d');

    canvas.width = 1230;
    canvas.height = 920;

    document.body.appendChild(canvas);
    window.addEventListener('resize', resize);
    resize();

    var player    = new Player(),
        computer  = new Computer(),
        ball      = new Ball(canvas.width / 2, 398),
        keysDown  = {};

    var update = function() {
        player.update();
        computer.update(ball);
        ball.update(player.paddle, computer.paddle);
        gameObjs.cBullets.forEach(function(bullet, index, obj) {
            // Remove non-active bullet
            if (!bullet.active) {
                gameObjs.cBullets.splice(index, 1);
            }
            bullet.update();
        });
        gameObjs.pBullets.forEach(function(bullet, index, obj) {
            // Remove non-active bullet
            if (!bullet.active) {
                gameObjs.pBullets.splice(index, 1);
            }
            bullet.update();
        });
        if (score.pointTimer) score.pointTimer--;
        if (score.gameoverTimer) score.gameoverTimer--;
    };

    var render = function() {
        ctx.fillStyle = palatte.table;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        // Draw divider
        ctx.fillStyle = palatte.divider;
        for (var i = 0; i < 31; i++) {
            ctx.fillRect(canvas.width / 2 - 2, i * 30, 8, 16);
        }
        // Draw score
        ctx.font = '20px PressStart2P';
        ctx.textAlign = 'left';
        ctx.fillText('SCORE', 20, 30);
        ctx.textAlign = 'right';
        ctx.fillText(score.current, 120, 60);
        ctx.textAlign = 'left';
        // Draw recent point
        if (score.pointTimer) {
            ctx.fillText(score.pointVal, 140, 60);
        }
        // Draw gameover animation
        if (score.gameoverTimer) {
            if (score.gameoverTimer > 45) {
                ctx.fillText('G', 518, 200);
            } else if (score.gameoverTimer > 41) {
                ctx.fillText('GA', 518, 200);
            } else if (score.gameoverTimer > 37) {
                ctx.fillText('GAM', 518, 200);
            } else if (score.gameoverTimer > 33) {
                ctx.fillText('GAME', 518, 200);
            } else if (score.gameoverTimer > 29) {
                ctx.fillText('GAME  O', 518, 200);
            } else if (score.gameoverTimer > 25) {
                ctx.fillText('GAME  OV', 518, 200);
            } else if (score.gameoverTimer > 21) {
                ctx.fillText('GAME  OVE', 518, 200);
            } else {
                ctx.fillText('GAME  OVER', 518, 200);
            }
        }
        // Draw prompts
        if (!flag.hasBoosted) {
            ctx.fillText('PRESS SHIFT TO BOOST', 20, canvas.height - 10);
        }
        ctx.textAlign = 'right';
        if (!flag.hasFired) {
            ctx.fillText('PRESS SPACEBAR TO FIRE', canvas.width - 20, canvas.height - 10);
        }
        // Draw highscore
        ctx.fillText('HI-SCORE', canvas.width - 20, 30);
        ctx.fillText(score.highscore, canvas.width - 20, 60);
        // Draw player
        player.render();
        // Draw computer
        computer.render();
        // Draw ball
        ball.render();
        // Draw bullets
        gameObjs.cBullets.forEach(function(bullet) {
            bullet.draw();
        });
        gameObjs.pBullets.forEach(function(bullet) {
            bullet.draw();
        });
    };

    function resize() {
        // TODO
    }

    function Paddle(x, y, width, height) {
        this.width        = width;
        this.height       = height;
        this.y_speed      = 0;
        this.x            = x;
        this.y            = y;
        this.hitTimer     = 0;
        this.respawnTimer = 0;
    }

    Paddle.prototype.render = function() {
        if (!this.respawnTimer && !(this.hitTimer % 2)) {
            ctx.fillStyle = palatte.paddle;
            ctx.fillRect(this.x, this.y, this.width, this.height);
        }
    };

    Paddle.prototype.move = function(x, y) {
        this.y += y;
        this.y_speed = y;
        if (this.y < 0) {
            this.y = 0;
            this.y_speed = 0;
        } else if (this.y + this.height > canvas.height) {
            this.y = canvas.height - this.height;
            this.y_speed = 0;
        }
    };

    Paddle.prototype.respawn = function(x) {
        this.respawnTimer = x;
        this.height = 60;
        // TODO: explosion
    };

    function Computer() {
        this.paddle = new Paddle(1056, 430, 16, 60);
    }

    Computer.prototype.render = function() {
        if (!this.paddle.respawnTimer) {
            this.paddle.render();
        }
    };

    Computer.prototype.update = function(ball) {
        if (!this.paddle.hitTimer) {
            var y_pos = ball.y,
                diff = -((this.paddle.y + (this.paddle.height / 2)) - y_pos);
            if (diff < 0 && diff < -9) {
                diff = -10;
            } else if (diff > 0 && diff > 9) {
                diff = 10;
            }
            this.paddle.move(0, diff);
            if (this.paddle.y < 0) {
                this.paddle.y = 0;
            } else if (this.paddle.y + this.paddle.height > canvas.height) {
                this.paddle.y = canvas.height - this.paddle.height;
            }
            if (!this.paddle.respawnTimer) {
                if (diff == 0 || Math.floor(Math.random() * 50) == 7) {
                    this.shoot();
                }
            }
        }
        if (this.paddle.hitTimer) this.paddle.hitTimer--;
        if (this.paddle.respawnTimer) this.paddle.respawnTimer--;
    };

    Computer.prototype.shoot = function() {
        if (gameObjs.cBullets.length === 0) {
            gameObjs.cBullets.push(new Bullet({
                vel : -18,
                x   : this.paddle.x,
                y   : this.paddle.y + this.paddle.height / 2
            }));
            playSound('shoot');
        }
    }

    function Player() {
        this.paddle = new Paddle(158, 430, 16, 60);
    }

    Player.prototype.render = function() {
        this.paddle.render();
    };

    Player.prototype.update = function() {
        if (!this.paddle.hitTimer) {
            var playerSpeed;
            // Speed boost
            if (keysDown[16]) {              // Control
                playerSpeed = 20;
                flag.hasBoosted = true;
            } else {
                playerSpeed = 10;
            }
            // Fire
            if (keysDown[32]) {             // Spacebar
                this.shoot();
            }
            // Up and down controls
            for (var key in keysDown) {
                var value = Number(key);
                if (value == 38) {          // Up arrow
                    this.paddle.move(0, -playerSpeed);
                } else if (value == 40) {   // Down arrow
                    this.paddle.move(0, playerSpeed);
                } else {
                    this.paddle.move(0, 0);
                }
            }
        }
        if (this.paddle.hitTimer) this.paddle.hitTimer--;
        if (this.paddle.respawnTimer) this.paddle.respawnTimer--;
    };

    Player.prototype.shoot = function() {
        if (gameObjs.pBullets.length === 0) {
            gameObjs.pBullets.push(new Bullet({
                vel : 18,
                x   : this.paddle.x,
                y   : this.paddle.y + this.paddle.height / 2
            }));
            flag.hasFired = true;
            playSound('shoot');
        }
    }

    function Ball(x, y) {
        this.x_speed = -5;
        this.y_speed = 0;
        this.x       = x;
        this.y       = y;
    }

    Ball.prototype.render = function() {
        ctx.beginPath();
        ctx.arc(this.x, this.y, 8, 2 * Math.PI, false);
        ctx.fillStyle = palatte.ball;
        ctx.fill();
    };

    Ball.prototype.update = function(paddle1, paddle2) {
        this.x += this.x_speed;
        this.y += this.y_speed;
        var left_x  = this.x - 8,
            left_y  = this.y - 8,
            right_x = this.x + 8,
            right_y = this.y + 8;
        if (this.y - 8 < 0) {
            this.y = 8;
            this.y_speed = -this.y_speed;
            playSound('ballHit');
        } else if (this.y + 8 > canvas.height) {
            this.y = canvas.height - 8;
            this.y_speed = -this.y_speed;
            playSound('ballHit');
        }
        if (this.x < 0 || this.x > canvas.width) {
            if (this.x < 0) {
                gameover();
            } else if (this.x > canvas.width) {
                updateScore(10);
                playSound('point');
            }
            this.x_speed = -5;
            this.y_speed = Math.floor(Math.random() * 5);
            if (Math.floor(Math.random() * 2)) {
                this.y_speed = -this.y_speed;
            }
            this.x = canvas.width / 2;
            this.y = Math.floor(Math.random() * 15) * 30 + 248;
        }
        // collision detection
        if (left_x < canvas.width / 2) {
            if (!player.paddle.respawnTimer &&
                left_y < (paddle1.y + paddle1.height) && right_y > paddle1.y &&
                left_x < (paddle1.x + paddle1.width) && right_x > paddle1.x) {
                this.x_speed = 5;
                this.y_speed += (paddle1.y_speed / 2);
                this.x += this.x_speed;
                playSound('ballHit');
            }
        } else {
            if (!computer.paddle.respawnTimer &&
                left_y < (paddle2.y + paddle2.height) && right_y > paddle2.y &&
                left_x < (paddle2.x + paddle2.width) && right_x > paddle2.x) {
                this.x_speed = -5;
                this.y_speed += (paddle2.y_speed / 2);
                this.x += this.x_speed;
                playSound('ballHit');
            }
        }
    };

    function Bullet(bullet) {
        this.active = true;
        this.color  = palatte.bullet;
        this.xVel   = bullet.vel;
        this.width  = 8;
        this.height = 4;
        this.x      = bullet.x;
        this.y      = bullet.y;
    }

    Bullet.prototype.inBounds = function() {
        return this.x >= 0 && this.x <= canvas.width &&
               this.y >= 0 && this.y <= canvas.height;
    };

    Bullet.prototype.draw = function() {
        ctx.fillStyle = this.color;
        ctx.fillRect(this.x, this.y, this.width, this.height);
    };

    Bullet.prototype.update = function() {
        this.x += this.xVel;
        if (this.xVel > 0 &&        // Player bullet collision detection
            !computer.paddle.respawnTimer && !computer.paddle.hitTimer &&
            this.x + this.width >= computer.paddle.x &&
            this.x + this.width <= computer.paddle.x + computer.paddle.width &&
            this.y + (this.height / 2) >= computer.paddle.y &&
            this.y + (this.height / 2) <= computer.paddle.y + computer.paddle.height) {
            if (computer.paddle.height > 30) {
                computer.paddle.hitTimer = 30;
                computer.paddle.height -= 20;
                computer.paddle.y += 10;
                updateScore(1);
                playSound('hit');
            } else {
                computer.paddle.respawn(300);
                score.killCount++;
                updateScore(5 * score.killCount);
                playSound('explosion');
            }
            player.paddle.height += 20;
            player.paddle.y -= 10;
            this.active = false;
        } else if (this.xVel < 0 && // Computer bullet collision detection
            this.x >= player.paddle.x &&
            this.x <= player.paddle.x + player.paddle.width &&
            this.y + (this.height / 2) >= player.paddle.y &&
            this.y + (this.height / 2) <= player.paddle.y + player.paddle.height) {
            if (player.paddle.height > 30) {
                player.paddle.hitTimer = 30;
                player.paddle.height -= 20;
                player.paddle.y += 10;
                computer.paddle.height += 20;
                computer.paddle.y -= 10;
                updateScore(-1);
                playSound('hit');
            } else {
                player.paddle.respawn(100);
                gameover();
                playSound('explosion');
            }
            this.active = false;
        }
        this.active = this.inBounds() && this.active;
    };

    function updateScore(x) {
        score.current += x;
        score.pointVal = (x > 0) ? '+' + x : x;
        score.pointTimer = 100;
        if (score.current > score.highscore) {
            setHighscore();
        }
    }

    function getHighscore() {
        var decodedCookie = decodeURIComponent(document.cookie);
        var ca = decodedCookie.split(';');
        for (var i = 0; i < ca.length; i++) {
            var c = ca[i];
            while (c.charAt(0) == ' ') {
                c = c.substring(1);
            }
            if (c.indexOf('highscore=') == 0) {
                return c.substring('highscore='.length, c.length);
            }
        }
        return 0;
    }

    function setHighscore() {
        score.highscore = score.current;
        var d = new Date();
        d.setTime(d.getTime() + (360*24*60*60*1000)); // Set cookie for a year
        var expires = "expires=" + d.toUTCString(),
            path    = window.location.pathname;
        document.cookie = "highscore=" + score.highscore + ";" + expires + ";path=" + path;
    }

    function gameover() {
        playSound('gameover');
        gameObjs.cBullets = [];
        gameObjs.pBullets = [];
        score.current = 0;
        score.pointTimer = 0;
        score.killCount = 0;
        score.gameoverTimer = 50;
        computer.paddle.respawnTimer = 0;
        computer.paddle.hitTimer = 0;
        computer.paddle.y += (computer.paddle.height - 60) / 2;
        computer.paddle.height = 60;
        player.paddle.hitTimer = 0;
        player.paddle.y += (player.paddle.height - 60) / 2;
        player.paddle.height = 60;
    }

    function playSound(type) {
        (new Audio(audio[type])).play();
    }

    (function step() {
        requestAnimationFrame(step);
        update();
        render();
    })();

    window.addEventListener('keydown', function(e) {
        keysDown[e.keyCode] = true;
    });

    window.addEventListener('keyup', function(e) {
        delete keysDown[e.keyCode];
    });

}, true);

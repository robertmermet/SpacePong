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
        shoot     : 'wav/344310__musiclegends__laser-shoot.wav',
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

    var table = new Table();

    var canvas = document.createElement('canvas'),
        ctx = canvas.getContext('2d');

    document.body.appendChild(canvas);
    window.addEventListener('resize', resize);
    resize();

    var player    = new Player(),
        computer  = new Computer(),
        ball      = new Ball(table.width / 2, 398),
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
        table.render();
        table.renderTxt();
        player.render();
        computer.render();
        ball.render();
        gameObjs.cBullets.forEach(function(bullet) {
            bullet.render();
        });
        gameObjs.pBullets.forEach(function(bullet) {
            bullet.render();
        });
    };

    function resize() {
        canvas.width  = window.innerWidth;
        canvas.height = window.innerHeight;
        if (canvas.width * .75 < canvas.height) {
            table.pixelSize  = canvas.width / table.width;
            table.offsetLeft = 0;
            table.offsetTop  = (canvas.height - (table.height * table.pixelSize)) / 2;
        } else {
            table.pixelSize  = canvas.height / table.height;
            table.offsetLeft = (canvas.width - (table.width * table.pixelSize)) / 2;
            table.offsetTop  = 0;
        }
    }

    function Table() {
        this.width      = 1240;
        this.height     = 930;
        this.offsetLeft = 0;
        this.offsetTop  = 0;
        this.pixelSize  = 1;
    }

    Table.prototype.render = function() {
        // Fill background
        ctx.fillStyle = palatte.background;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        // Draw table
        ctx.fillStyle = palatte.table;
        ctx.fillRect(table.offsetLeft,
                     table.offsetTop,
                     table.width * table.pixelSize,
                     table.height * table.pixelSize);
        // Draw divider
        ctx.fillStyle = palatte.divider;
        for (var i = 0; i < 31; i++) {
            ctx.fillRect(canvas.width / 2 - 4 * table.pixelSize,
                         (i * 30 + 7) * table.pixelSize + table.offsetTop,
                         8 * table.pixelSize,
                         16 * table.pixelSize);
        }
    };

    Table.prototype.renderTxt = function() {
        // Draw score
        ctx.font = 20 * table.pixelSize + 'px PressStart2P';
        ctx.textAlign = 'left';
        ctx.fillText('SCORE',
                     20 * table.pixelSize + table.offsetLeft,
                     30 * table.pixelSize + table.offsetTop);
        ctx.textAlign = 'right';
        ctx.fillText(score.current,
                     120 * table.pixelSize + table.offsetLeft,
                     60 * table.pixelSize + table.offsetTop);
        ctx.textAlign = 'left';
        // Draw recent pointraw prompts
        if (score.pointTimer) {
            ctx.fillText(score.pointVal,
                         140 * table.pixelSize + table.offsetLeft,
                         60 * table.pixelSize + table.offsetTop);
        }
        // Draw gameover animation
        if (score.gameoverTimer) {
            var gameoverTxt;
            if (score.gameoverTimer > 45) {
                gameoverTxt = 'G';
            } else if (score.gameoverTimer > 41) {
                gameoverTxt = 'GA';
            } else if (score.gameoverTimer > 37) {
                gameoverTxt = 'GAM';
            } else if (score.gameoverTimer > 33) {
                gameoverTxt = 'GAME';
            } else if (score.gameoverTimer > 29) {
                gameoverTxt = 'GAME  O';
            } else if (score.gameoverTimer > 25) {
                gameoverTxt = 'GAME  OV';
            } else if (score.gameoverTimer > 21) {
                gameoverTxt = 'GAME  OVE';
            } else {
                gameoverTxt = 'GAME  OVER';
            }
            ctx.fillText(gameoverTxt,
                         524 * table.pixelSize + table.offsetLeft,
                         230 * table.pixelSize + table.offsetTop);
        }
        // Draw prompts
        if (!flag.hasBoosted) {
            ctx.fillText('HOLD SHIFT TO BOOST',
                         20 * table.pixelSize + table.offsetLeft,
                         (table.height - 10) * table.pixelSize + table.offsetTop);
        }
        ctx.textAlign = 'right';
        if (!flag.hasFired) {
            ctx.fillText('PRESS SPACEBAR TO FIRE',
                         (table.width - 20) * table.pixelSize + table.offsetLeft,
                         (table.height - 10) * table.pixelSize + table.offsetTop);
        }
        // Draw highscore
        ctx.fillText('HI-SCORE',
                     (table.width - 20) * table.pixelSize + table.offsetLeft,
                     30 * table.pixelSize + table.offsetTop);
        ctx.fillText(score.highscore,
                     (table.width - 20) * table.pixelSize + table.offsetLeft,
                     60 * table.pixelSize + table.offsetTop);
    };

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
            ctx.fillRect(this.x * table.pixelSize + table.offsetLeft,
                         this.y * table.pixelSize + table.offsetTop,
                         this.width * table.pixelSize,
                         this.height * table.pixelSize);
        }
    };

    Paddle.prototype.move = function(x, y) {
        this.y += y;
        this.y_speed = y;
        if (this.y < 0) {
            this.y = 0;
            this.y_speed = 0;
        } else if (this.y + this.height > table.height) {
            this.y = table.height - this.height;
            this.y_speed = 0;
        }
    };

    Paddle.prototype.respawn = function(x) {
        this.respawnTimer = x;
        this.height = 60;
        // TODO: explosion
    };

    function Computer() {
        this.paddle = new Paddle(1064, 435, 16, 60);
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
            } else if (this.paddle.y + this.paddle.height > table.height) {
                this.paddle.y = table.height - this.paddle.height;
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
        this.paddle = new Paddle(160, 435, 16, 60);
    }

    Player.prototype.render = function() {
        this.paddle.render();
    };

    Player.prototype.update = function() {
        if (!this.paddle.hitTimer && !this.paddle.respawnTimer) {
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
        ctx.arc(this.x * table.pixelSize + table.offsetLeft,
                this.y * table.pixelSize + table.offsetTop,
                8 * table.pixelSize, 2 * Math.PI, false);
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
        } else if (this.y + 8 > table.height) {
            this.y = table.height - 8;
            this.y_speed = -this.y_speed;
            playSound('ballHit');
        }
        if (this.x < 0 || this.x > table.width) {
            if (this.x < 0) {
                gameover();
            } else if (this.x > table.width) {
                updateScore(10);
                playSound('point');
            }
            this.x_speed = -5;
            this.y_speed = Math.floor(Math.random() * 5);
            if (Math.floor(Math.random() * 2)) {
                this.y_speed = -this.y_speed;
            }
            this.x = table.width / 2;
            this.y = Math.floor(Math.random() * 15) * 30 + 248;
        }
        // collision detection
        if (left_x < table.width / 2) {
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
        return this.x >= 0 && this.x <= table.width &&
               this.y >= 0 && this.y <= table.height;
    };

    Bullet.prototype.render = function() {
        ctx.fillStyle = this.color;
        ctx.fillRect(this.x * table.pixelSize + table.offsetLeft,
                     this.y * table.pixelSize + table.offsetTop,
                     this.width * table.pixelSize,
                     this.height * table.pixelSize);
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

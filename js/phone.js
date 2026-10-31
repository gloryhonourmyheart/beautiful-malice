/* =========================================================
   上课偷吃 · 手机贪吃蛇
   一块小小的 LCD，一条不听话的蛇
   ========================================================= */
(function (global) {
  'use strict';

  function PhoneGame(canvas, opts) {
    opts = opts || {};
    const ctx = canvas.getContext('2d');
    const COLS = 11, ROWS = 15, CELL = 20;
    canvas.width = COLS * CELL;
    canvas.height = ROWS * CELL;

    let snake, dir, nextDir, food, score, acc, alive, deadT, running, blink;
    score = 0; blink = 0;

    function reset() {
      snake = [{ x: 2, y: 9 }, { x: 1, y: 9 }, { x: 0, y: 9 }];
      dir = { x: 1, y: 0 };
      nextDir = { x: 1, y: 0 };
      score = 0;
      acc = -1.2; // 开始时给一点准备时间
      alive = true;
      deadT = 0;
      placeFood();
      draw();
    }

    function placeFood() {
      let tries = 0;
      do {
        food = { x: (Math.random() * COLS) | 0, y: 3 + ((Math.random() * (ROWS - 4)) | 0) };
        tries++;
      } while (snake.some(s => s.x === food.x && s.y === food.y) && tries < 200);
    }

    function turn(dx, dy) {
      if (!alive) return;
      if (dx === -dir.x && dy === -dir.y) return;
      if (dir.x === 0 && dx !== 0) nextDir = { x: dx, y: dy };
      else if (dir.y === 0 && dy !== 0) nextDir = { x: dx, y: dy };
    }

    function step() {
      dir = nextDir;
      const head = { x: snake[0].x + dir.x, y: snake[0].y + dir.y };
      if (head.x < 0 || head.x >= COLS || head.y < 2 || head.y >= ROWS) return die();
      if (snake.some((s, i) => i < snake.length - 1 && s.x === head.x && s.y === head.y)) return die();

      snake.unshift(head);
      if (head.x === food.x && head.y === food.y) {
        score += 10;
        if (opts.onEat) opts.onEat(1);
        placeFood();
      } else {
        snake.pop();
      }
      draw();
    }

    function die() {
      alive = false;
      deadT = 1.4;
      if (opts.onDie) opts.onDie();
    }

    /* ---------- 绘制 ---------- */
    function px(x, y, w, h, color) {
      ctx.fillStyle = color;
      ctx.fillRect(x * CELL, y * CELL, w * CELL, h * CELL);
    }

    function draw() {
      const w = COLS * CELL, h = ROWS * CELL;
      // LCD 底
      ctx.fillStyle = '#a7c78c';
      ctx.fillRect(0, 0, w, h);

      // 顶栏
      ctx.fillStyle = '#22351f';
      ctx.fillRect(0, 0, w, 26);
      ctx.fillStyle = '#c8e2ac';
      ctx.font = 'bold 13px monospace';
      ctx.textAlign = 'left';
      ctx.fillText('贪吃蛇', 6, 17);
      ctx.textAlign = 'right';
      ctx.fillText('分数 ' + score, w - 6, 17);

      // 网格淡线
      ctx.strokeStyle = 'rgba(40,70,35,0.12)';
      ctx.lineWidth = 1;
      for (let i = 1; i < COLS; i++) {
        ctx.beginPath(); ctx.moveTo(i * CELL, 26); ctx.lineTo(i * CELL, h); ctx.stroke();
      }
      for (let j = 2; j < ROWS; j++) {
        ctx.beginPath(); ctx.moveTo(0, j * CELL); ctx.lineTo(w, j * CELL); ctx.stroke();
      }

      // 食物
      if (food) {
        ctx.save();
        ctx.translate(food.x * CELL + CELL / 2, food.y * CELL + CELL / 2);
        ctx.fillStyle = '#22351f';
        ctx.beginPath();
        ctx.arc(0, 0, 5.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#7fa85f';
        ctx.beginPath(); ctx.arc(-2, -2, 1.6, 0, 7); ctx.fill();
        ctx.restore();
      }

      // 蛇（带像素边框）
      for (let i = snake.length - 1; i >= 0; i--) {
        const s = snake[i];
        const x = s.x * CELL, y = s.y * CELL + (s.y === 0 ? 26 : 0);
        ctx.fillStyle = '#2b4527';
        ctx.fillRect(x + 1, y + 1, CELL - 2, CELL - 2);
        ctx.fillStyle = i === 0 ? '#3f6636' : '#4e7a41';
        ctx.fillRect(x + 3, y + 3, CELL - 6, CELL - 6);
        if (i === 0) {
          ctx.fillStyle = '#d3e8b8';
          ctx.fillRect(x + 6, y + 6, 3, 3);
          ctx.fillRect(x + 12, y + 6, 3, 3);
          ctx.fillStyle = '#22351f';
          ctx.fillRect(x + 7, y + 12, 6, 2);
        }
      }

      // 结束提示
      if (!alive) {
        ctx.fillStyle = 'rgba(34,53,31,0.72)';
        ctx.fillRect(0, 60, w, 52);
        ctx.fillStyle = '#d8edc0';
        ctx.textAlign = 'center';
        ctx.font = 'bold 16px "PingFang SC",sans-serif';
        ctx.fillText('游戏结束', w / 2, 82);
        ctx.font = '12px "PingFang SC",sans-serif';
        ctx.fillText('按 ↑ 重新开始（或继续摸鱼）', w / 2, 101);
      }

      // 准备提示
      if (alive && acc < -0.55) {
        ctx.fillStyle = 'rgba(34,53,31,0.55)';
        ctx.fillRect(0, 96, w, 34);
        ctx.fillStyle = '#d8edc0';
        ctx.textAlign = 'center';
        ctx.font = 'bold 14px "PingFang SC",sans-serif';
        ctx.fillText('按 ↑↓←→ 控制 · 准备…', w / 2, 118);
      }

      // 扫描线
      ctx.fillStyle = 'rgba(0,0,0,0.045)';
      for (let y = 26; y < h; y += 3) ctx.fillRect(0, y, w, 1);
      // 反光
      const gl = ctx.createLinearGradient(0, 0, w, h);
      gl.addColorStop(0, 'rgba(255,255,255,0.14)');
      gl.addColorStop(0.45, 'rgba(255,255,255,0.02)');
      gl.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.fillStyle = gl;
      ctx.fillRect(0, 0, w, h);
    }

    /* ---------- 对外的更新 ---------- */
    function update(dt) {
      blink += dt;
      if (!alive) {
        deadT -= dt;
        if (deadT <= 0) {
          // 自动开新局
          reset();
        }
        draw();
        return;
      }
      acc += dt;
      const speed = 0.135;
      let guard = 0;
      while (acc >= speed && guard < 4) {
        acc -= speed;
        step();
        guard++;
      }
      draw();
    }

    const api = {
      start: function () {
        running = true;
        if (!snake || !alive) reset();
        draw();
      },
      stop: function () { running = false; },
      isRunning: function () { return running; },
      update: function (dt) { if (running) update(dt); },
      turn: turn,
      restart: function () { reset(); },
      getScore: function () { return score; },
      draw: draw
    };
    reset();
    return api;
  }

  global.PhoneGame = PhoneGame;
})(window);

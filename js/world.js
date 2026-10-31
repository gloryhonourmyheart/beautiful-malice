/* =========================================================
   上课偷吃 · 3D 场景
   教室 / 老师 / 同学 / 课桌零食 / 摄像机 / 动画
   ========================================================= */
(function (global) {
  'use strict';

  const T = global.THREE;

  /* ---------- 零食数据 ---------- */
  const SNACKS = {
    spicy: {
      type: 'spicy', name: '辣条', emoji: '🌶️', color: '#c0392b',
      risk: 3, eatTime: 4.4, noise: 1.5, score: 120, bites: 5,
      desc: '又香又辣，撕包装的声音能传两排'
    },
    chips: {
      type: 'chips', name: '薯片', emoji: '🥔', color: '#2f7cc0',
      risk: 3, eatTime: 3.8, noise: 1.7, score: 110, bites: 5,
      desc: '咔嚓一声，全班回头'
    },
    noodle: {
      type: 'noodle', name: '干脆面', emoji: '🍜', color: '#d79b25',
      risk: 2, eatTime: 4.2, noise: 1.3, score: 115, bites: 5,
      desc: '越嚼越香，越香越危险'
    },
    milktea: {
      type: 'milktea', name: '奶茶', emoji: '🧋', color: '#b07a4c',
      risk: 1, eatTime: 6.4, noise: 0.35, score: 90, bites: 4,
      desc: '安安静静，就是吸管会咕噜'
    },
    banana: {
      type: 'banana', name: '香蕉', emoji: '🍌', color: '#e8c13a',
      risk: 1, eatTime: 5.0, noise: 0.6, score: 95, bites: 4,
      desc: '几乎没有声音，但香蕉皮……'
    },
    chicken: {
      type: 'chicken', name: '鸡腿', emoji: '🍗', color: '#8e4a2d',
      risk: 3, eatTime: 5.6, noise: 1.2, score: 160, bites: 5,
      desc: '香到老师都能闻到'
    }
  };

  const LESSONS = {
    1: {
      id: 1, subject: '数学课', teacherName: '王老师', teacherShort: '王',
      time: '上午 第二节',
      chalkTitle: '第三章 · 函数与方程',
      chalkLines: [
        '例1  已知 f(x) = x² − 4x + 3',
        '求：对称轴、顶点、最小值',
        '解：x = −b/2a = 2',
        '    f(2) = 4 − 8 + 3 = −1',
        '∴ 顶点 (2, −1)，最小值 −1',
        '练习：f(x) = 2x² + 4x − 1 ?',
        '（第三排靠窗的同学上来做）'
      ],
      style: { coat: '#35547a', hair: '#2b2320', hairStyle: 'bun', glasses: true, skirt: '#2c3e55' }
    },
    2: {
      id: 2, subject: '英语课', teacherName: '李老师', teacherShort: '李',
      time: '上午 第三节',
      chalkTitle: 'Unit 5 · If I were you',
      chalkLines: [
        '1. If I were you, I would study harder.',
        '2. 虚拟语气：与现在事实相反',
        '   If + 过去式 , would + 动词原形',
        '3. 造句：If I were a bird, I would fly.',
        '4. Homework: workbook P54-56',
        '   （明天听写，不及格请家长）'
      ],
      style: { coat: '#7b2f3e', hair: '#3b2a22', hairStyle: 'ponytail', glasses: false, skirt: '#3a242c' }
    },
    3: {
      id: 3, subject: '班主任的课', teacherName: '张主任', teacherShort: '张',
      time: '下午 第一节',
      chalkTitle: '班 会 · 通 知',
      chalkLines: [
        '一、本周五家长会，请勿迟到',
        '二、最近有人上课偷吃零食',
        '    我已掌握部分同学名单',
        '三、手机一律交到讲台',
        '四、下课后第三排留一下',
        '（别以为我不知道是谁）'
      ],
      style: { coat: '#2f3338', hair: '#1c1a1a', hairStyle: 'short', glasses: true, skirt: '#23262a' }
    },
    4: {
      id: 4, subject: '停电晚自习', teacherName: '值班老师', teacherShort: '王',
      time: '晚上 第一节',
      chalkTitle: '晚 自 习 · 停 电 了',
      chalkLines: [
        '啪——',
        '整栋楼都黑了。',
        '别出声。她还在教室里。',
        '她手里的电筒……在找什么。',
        '（谁在嚼东西？）',
        '（我听见了。）'
      ],
      style: { coat: '#25242d', hair: '#171319', hairStyle: 'bun', glasses: true, skirt: '#1b1a21', night: true }
    }
  };

  let uid = 0;

  /* ---------- 小工具 ---------- */
  function mat(color, opts) {
    const m = new T.MeshToonMaterial(Object.assign({ color: color }, opts || {}));
    return m;
  }
  function box(w, h, d, color, x, y, z, opts) {
    const m = new T.Mesh(new T.BoxGeometry(w, h, d), mat(color, opts));
    m.position.set(x || 0, y || 0, z || 0);
    m.castShadow = true; m.receiveShadow = true;
    return m;
  }
  function cyl(rt, rb, h, color, x, y, z, seg, opts) {
    const m = new T.Mesh(new T.CylinderGeometry(rt, rb, h, seg || 12), mat(color, opts));
    m.position.set(x || 0, y || 0, z || 0);
    m.castShadow = true; m.receiveShadow = true;
    return m;
  }
  function sph(r, color, x, y, z, opts, seg) {
    const m = new T.Mesh(new T.SphereGeometry(r, seg || 16, (seg || 16) / 2), mat(color, opts));
    m.position.set(x || 0, y || 0, z || 0);
    m.castShadow = true; m.receiveShadow = true;
    return m;
  }
  function plane(w, h, color, opts) {
    const m = new T.Mesh(new T.PlaneGeometry(w, h), opts && opts.map ? new T.MeshBasicMaterial(opts) : mat(color, opts));
    m.receiveShadow = true;
    return m;
  }
  function canvasTex(w, h, draw) {
    const c = document.createElement('canvas');
    c.width = w; c.height = h;
    const g = c.getContext('2d');
    draw(g, w, h);
    const t = new T.CanvasTexture(c);
    t.encoding = T.sRGBEncoding;
    t.anisotropy = 4;
    return t;
  }
  function rnd(a, b) { return a + Math.random() * (b - a); }
  function pick(arr) { return arr[(Math.random() * arr.length) | 0]; }
  function damp(cur, target, lambda, dt) { return cur + (target - cur) * (1 - Math.exp(-lambda * dt)); }
  function dampAngle(cur, target, lambda, dt) {
    let d = target - cur;
    while (d > Math.PI) d -= Math.PI * 2;
    while (d < -Math.PI) d += Math.PI * 2;
    return cur + d * (1 - Math.exp(-lambda * dt));
  }

  /* =========================================================
     World 构造
     ========================================================= */
  function World(container) {
    const self = {};
    const scene = new T.Scene();
    scene.background = new T.Color(0xbfd8ef);
    scene.fog = new T.Fog(0xcfd9e2, 26, 46);

    const camera = new T.PerspectiveCamera(62, 1, 0.04, 80);
    camera.rotation.order = 'YXZ';

    let renderer;
    try {
      renderer = new T.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    } catch (e) {
      return null;
    }
    renderer.setPixelRatio(Math.min(global.devicePixelRatio || 1, 2));
    renderer.outputEncoding = T.sRGBEncoding;
    renderer.toneMapping = T.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 0.9;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = T.PCFSoftShadowMap;
    renderer.setSize(1, 1, false);
    renderer.domElement.style.width = '100%';
    renderer.domElement.style.height = '100%';
    container.appendChild(renderer.domElement);
    renderer.domElement.className = 'gl';

    /* ---------- 灯光 ---------- */
    const hemi = new T.HemisphereLight(0xd6e9ff, 0x9c7a56, 0.42);
    scene.add(hemi);

    const sun = new T.DirectionalLight(0xffe6b8, 0.6);
    sun.position.set(9, 7.5, 4.5);
    sun.castShadow = true;
    sun.shadow.mapSize.set(2048, 2048);
    sun.shadow.camera.left = -11;
    sun.shadow.camera.right = 11;
    sun.shadow.camera.top = 9;
    sun.shadow.camera.bottom = -7;
    sun.shadow.camera.near = 0.5;
    sun.shadow.camera.far = 30;
    sun.shadow.bias = -0.0006;
    sun.shadow.normalBias = 0.02;
    scene.add(sun);
    scene.add(sun.target);
    sun.target.position.set(0, 0, -1);

    const fill = new T.DirectionalLight(0xbfd6ff, 0.16);
    fill.position.set(-6, 4, 3);
    scene.add(fill);

    const warm = new T.PointLight(0xffe6c2, 0.32, 20, 2);
    warm.position.set(0, 3.5, -0.5);
    scene.add(warm);

    /* ---------- 房间几何 ---------- */
    const room = new T.Group();
    scene.add(room);
    let curtains = [];

    const W = 14, D = 13.2, H = 4.15;
    const frontZ = -6.6, backZ = 6.6;

    // 木地板纹理
    const floorTex = canvasTex(512, 512, (g, w, h) => {
      g.fillStyle = '#bd9468'; g.fillRect(0, 0, w, h);
      for (let y = 0; y < h; y += 64) {
        g.fillStyle = ['#c39a6c', '#b98f62', '#c69d70', '#b78b5e'][(y / 64) % 4 | 0];
        g.fillRect(0, y, w, 62);
        g.strokeStyle = 'rgba(90,60,35,0.35)'; g.lineWidth = 2;
        g.beginPath(); g.moveTo(0, y); g.lineTo(w, y); g.stroke();
        for (let i = 0; i < 22; i++) {
          g.strokeStyle = 'rgba(110,75,45,' + rnd(0.05, 0.16) + ')';
          g.lineWidth = rnd(1, 3);
          const yy = y + rnd(6, 56);
          g.beginPath(); g.moveTo(rnd(0, w), yy);
          g.bezierCurveTo(rnd(0, w), yy + rnd(-3, 3), rnd(0, w), yy + rnd(-4, 4), w, yy + rnd(-2, 2));
          g.stroke();
        }
        g.strokeStyle = 'rgba(70,45,25,0.25)';
        g.beginPath(); g.moveTo(rnd(0, w), y); g.lineTo(rnd(0, w), y + 62); g.stroke();
      }
    });
    floorTex.wrapS = floorTex.wrapT = T.RepeatWrapping;
    floorTex.repeat.set(4, 4);
    const floor = new T.Mesh(new T.PlaneGeometry(W, D), new T.MeshToonMaterial({ map: floorTex, color: 0xffffff }));
    floor.rotation.x = -Math.PI / 2;
    floor.position.set(0, 0, 0);
    floor.receiveShadow = true;
    room.add(floor);

    // 课桌木纹
    const deskTex = canvasTex(256, 256, (g, w, h) => {
      g.fillStyle = '#b07f4b'; g.fillRect(0, 0, w, h);
      for (let i = 0; i < 40; i++) {
        g.strokeStyle = 'rgba(90,55,25,' + rnd(0.05, 0.2) + ')';
        g.lineWidth = rnd(1, 3);
        const y = rnd(0, h);
        g.beginPath(); g.moveTo(0, y);
        g.bezierCurveTo(w * 0.3, y + rnd(-6, 6), w * 0.7, y + rnd(-6, 6), w, y + rnd(-4, 4));
        g.stroke();
      }
      g.strokeStyle = 'rgba(70,40,18,0.25)'; g.lineWidth = 2;
      g.strokeRect(0, 0, w, h);
    });
    deskTex.wrapS = deskTex.wrapT = T.RepeatWrapping;

    // 天花板
    const ceil = plane(W, D, 0xece5d6);
    ceil.rotation.x = Math.PI / 2;
    ceil.position.set(0, H, 0);
    room.add(ceil);

    // 墙
    const wallCol = 0xdccfb7;
    const frontWall = box(W, H, 0.18, wallCol, 0, H / 2, frontZ - 0.09);
    const backWall = box(W, H, 0.18, wallCol, 0, H / 2, backZ + 0.09);
    room.add(frontWall, backWall);

    // 左墙（门 + 板报）
    const leftWall = box(0.18, H, D, wallCol, -W / 2 - 0.09, H / 2, 0);
    room.add(leftWall);

    // 右墙：开三个窗
    const winZ = [-3.9, 0, 3.9];
    const winW = 2.5, winH = 1.85, sillY = 1.02, topY = sillY + winH;
    const rw = new T.Group();
    const xw = W / 2 + 0.02;
    function wallPiece(y0, y1, z0, z1) {
      const b = box(0.16, y1 - y0, z1 - z0, wallCol, xw, (y0 + y1) / 2, (z0 + z1) / 2);
      rw.add(b);
    }
    // 窗间柱 & 上下沿
    let zCursor = -D / 2;
    const edges = [];
    winZ.forEach(z => { edges.push(z - winW / 2, z + winW / 2); });
    // 下沿与上沿整条
    wallPiece(0, sillY, -D / 2, D / 2);
    wallPiece(topY, H, -D / 2, D / 2);
    // 竖段
    const zs = [-D / 2].concat(edges, [D / 2]).sort((a, b) => a - b);
    for (let i = 0; i < zs.length - 1; i += 2) {
      const z0 = zs[i], z1 = zs[i + 1];
      if (z1 - z0 > 0.02) wallPiece(sillY, topY, z0, z1);
    }
    room.add(rw);

    // 窗外天空
    const skyTex = canvasTex(512, 512, (g, w, h) => {
      const grad = g.createLinearGradient(0, 0, 0, h);
      grad.addColorStop(0, '#8fc4e8');
      grad.addColorStop(0.55, '#cfe6f4');
      grad.addColorStop(1, '#f4ecd4');
      g.fillStyle = grad; g.fillRect(0, 0, w, h);
      g.fillStyle = 'rgba(255,255,255,0.85)';
      [[110, 110, 55], [150, 95, 35], [330, 70, 45], [400, 95, 60]].forEach(c => {
        g.beginPath(); g.arc(c[0], c[1], c[2], 0, 7); g.fill();
      });
      g.fillStyle = 'rgba(255,255,255,0.5)';
      g.beginPath(); g.arc(210, 150, 60, 0, 7); g.fill();
      // 远处树
      g.fillStyle = '#7fa06a';
      for (let i = 0; i < 7; i++) {
        g.beginPath(); g.arc(i * 80 + rnd(-20, 20), 430 + rnd(-15, 15), rnd(30, 55), 0, 7); g.fill();
      }
      g.fillStyle = '#6d8d5b';
      g.fillRect(0, 450, w, h - 450);
      // 操场跑道
      g.strokeStyle = 'rgba(200,120,90,0.55)'; g.lineWidth = 8;
      g.beginPath(); g.ellipse(256, 500, 240, 70, 0, 0, Math.PI * 2); g.stroke();
    });
    const skyPanes = [];
    const nightTex = canvasTex(512, 512, (g, w, h) => {
      const grad = g.createLinearGradient(0, 0, 0, h);
      grad.addColorStop(0, '#050912');
      grad.addColorStop(0.6, '#0c1626');
      grad.addColorStop(1, '#1a2230');
      g.fillStyle = grad; g.fillRect(0, 0, w, h);
      // 星星
      for (let i = 0; i < 90; i++) {
        const a = Math.random() * 0.7 + 0.15;
        g.fillStyle = 'rgba(220,230,255,' + a.toFixed(2) + ')';
        g.fillRect(Math.random() * w, Math.random() * h * 0.7, 1.6, 1.6);
      }
      // 月亮
      g.fillStyle = 'rgba(230,235,255,0.92)';
      g.beginPath(); g.arc(400, 95, 38, 0, 7); g.fill();
      g.fillStyle = 'rgba(210,220,240,0.25)';
      g.beginPath(); g.arc(400, 95, 58, 0, 7); g.fill();
      // 远处树影
      g.fillStyle = '#04070a';
      for (let i = 0; i < 7; i++) {
        g.beginPath(); g.arc(i * 80 + rnd(-20, 20), 445 + rnd(-15, 15), rnd(35, 60), 0, 7); g.fill();
      }
      g.fillRect(0, 460, w, h - 460);
      // 闪电
      g.strokeStyle = 'rgba(220,235,255,0.35)'; g.lineWidth = 2;
      g.beginPath(); g.moveTo(120, 40); g.lineTo(105, 90); g.lineTo(125, 95); g.lineTo(100, 160); g.stroke();
    });
    winZ.forEach(z => {
      const pane = new T.Mesh(new T.PlaneGeometry(winW + 0.35, winH + 0.35), new T.MeshBasicMaterial({ map: skyTex }));
      pane.rotation.y = -Math.PI / 2;
      pane.position.set(W / 2 + 0.3, sillY + winH / 2, z);
      room.add(pane);
      skyPanes.push(pane);

      // 窗框
      const fw = 0.09;
      [z - winW / 2, z + winW / 2].forEach(zz => {
        room.add(box(0.1, winH, fw, 0xf7f4ec, W / 2 - 0.02, sillY + winH / 2, zz));
      });
      [sillY, topY].forEach(yy => {
        room.add(box(0.1, fw, winW, 0xf7f4ec, W / 2 - 0.02, yy, z));
      });
      room.add(box(0.1, winH, 0.05, 0xf7f4ec, W / 2 - 0.02, sillY + winH / 2, z));
      room.add(box(0.1, 0.05, winW, 0xf7f4ec, W / 2 - 0.02, sillY + winH / 2, z));
      room.add(box(0.24, 0.06, winW + 0.35, 0xf2ede2, W / 2 - 0.08, sillY - 0.03, z));
      // 窗帘
      const curtainMat = mat(0xd8e6d2, { transparent: true, opacity: 0.92, side: T.DoubleSide });
      [-1, 1].forEach(s => {
        const c = new T.Mesh(new T.PlaneGeometry(0.5, 2.35, 4, 8), curtainMat);
        c.position.set(W / 2 - 0.25, sillY + 0.95, z + s * (winW / 2 - 0.05));
        c.castShadow = true;
        const pos = c.geometry.attributes.position;
        for (let i = 0; i < pos.count; i++) {
          pos.setZ(i, Math.sin(pos.getX(i) * 9 + pos.getY(i) * 3) * 0.05);
        }
        pos.needsUpdate = true;
        room.add(c);
        curtains.push(c);
      });
    });

    // 墙裙
    const skirtMat = 0x9fc0a8;
    room.add(box(W, 0.12, 0.06, skirtMat, 0, 0.55, frontZ + 0.02));
    room.add(box(0.06, 0.12, D, skirtMat, -W / 2 + 0.02, 0.55, 0));
    room.add(box(W, 0.12, 0.06, skirtMat, 0, 0.55, backZ - 0.02));
    // 踢脚
    room.add(box(W, 0.1, 0.06, 0x6d4f36, 0, 0.05, frontZ + 0.03));
    room.add(box(W, 0.1, 0.06, 0x6d4f36, 0, 0.05, backZ - 0.03));
    room.add(box(0.06, 0.1, D, 0x6d4f36, -W / 2 + 0.03, 0.05, 0));
    room.add(box(0.06, 0.1, D, 0x6d4f36, W / 2 - 0.03, 0.05, 0));

    /* ---------- 黑板 ---------- */
    const boardGroup = new T.Group();
    boardGroup.position.set(0, 0, frontZ + 0.06);
    room.add(boardGroup);

    const boardW = 7.8, boardH = 1.9, boardY = 1.12 + boardH / 2;
    boardGroup.add(box(boardW + 0.28, boardH + 0.28, 0.1, 0x7b5230, 0, boardY, 0.02));
    boardGroup.add(box(boardW + 0.16, boardH + 0.16, 0.1, 0xb58a5e, 0, boardY, 0.05));

    const chalkCanvas = document.createElement('canvas');
    chalkCanvas.width = 1536; chalkCanvas.height = 470;
    const chalkCtx = chalkCanvas.getContext('2d');
    const chalkTexture = new T.CanvasTexture(chalkCanvas);
    chalkTexture.encoding = T.sRGBEncoding;
    const boardMesh = new T.Mesh(new T.PlaneGeometry(boardW, boardH), new T.MeshBasicMaterial({ map: chalkTexture }));
    boardMesh.position.set(0, boardY, 0.11);
    boardGroup.add(boardMesh);

    // 粉笔槽
    boardGroup.add(box(boardW + 0.1, 0.07, 0.16, 0x8b633a, 0, boardY - boardH / 2 - 0.1, 0.16));
    for (let i = 0; i < 6; i++) {
      const c = cyl(0.014, 0.014, 0.085, i % 3 === 0 ? 0xf2e6c8 : 0xfdfbf5, -1.3 + i * 0.32, boardY - boardH / 2 - 0.045, 0.17, 6);
      c.rotation.z = Math.PI / 2;
      boardGroup.add(c);
    }
    const eraser = box(0.24, 0.07, 0.11, 0x3b4a52, 2.9, boardY - boardH / 2 - 0.035, 0.16);
    boardGroup.add(eraser);

    // 标语
    const sloganTex = canvasTex(1400, 220, (g, w, h) => {
      g.fillStyle = '#f7edd6'; g.fillRect(0, 0, w, h);
      g.strokeStyle = '#c9a45f'; g.lineWidth = 10; g.strokeRect(5, 5, w - 10, h - 10);
      g.fillStyle = '#b83227';
      g.font = 'bold 92px "STKaiti","KaiTi","PingFang SC",serif';
      g.textAlign = 'center'; g.textBaseline = 'middle';
      g.fillText('好 好 学 习    天 天 向 上', w / 2, h / 2 + 4);
    });
    const slogan = new T.Mesh(new T.PlaneGeometry(5.2, 0.82), new T.MeshBasicMaterial({ map: sloganTex }));
    slogan.position.set(0, 3.52, frontZ + 0.12);
    room.add(slogan);
    room.add(box(5.4, 1.0, 0.05, 0x7b5230, 0, 3.52, frontZ + 0.08));

    // 挂在板边的课程表
    const scheduleTex = canvasTex(360, 460, (g, w, h) => {
      g.fillStyle = '#fdfbf3'; g.fillRect(0, 0, w, h);
      g.strokeStyle = '#8fa6c0'; g.lineWidth = 4;
      for (let i = 0; i <= 6; i++) { g.beginPath(); g.moveTo(14, 30 + i * 68); g.lineTo(w - 14, 30 + i * 68); g.stroke(); }
      g.fillStyle = '#4b6b8f'; g.font = 'bold 34px "PingFang SC",sans-serif'; g.textAlign = 'center';
      g.fillText('课 程 表', w / 2, 28);
      g.font = '24px "PingFang SC",sans-serif'; g.textAlign = 'left';
      ['数学', '英语', '物理', '化学', '体育(占)', '班会'].forEach((s, i) => {
        g.fillStyle = i === 4 ? '#c0392b' : '#3c4a58';
        g.fillText(s, 40, 30 + i * 68 + 45);
      });
    });
    const schedMesh = new T.Mesh(new T.PlaneGeometry(1.15, 1.47), new T.MeshBasicMaterial({ map: scheduleTex }));
    schedMesh.position.set(4.35, 2.25, frontZ + 0.12);
    room.add(schedMesh);

    // 时钟
    const clockGroup = new T.Group();
    clockGroup.position.set(-4.5, 3.02, frontZ + 0.13);
    room.add(clockGroup);
    clockGroup.add(cyl(0.36, 0.36, 0.06, 0xfdfbf4, 0, 0, 0, 28).rotateX(Math.PI / 2));
    clockGroup.add(cyl(0.39, 0.39, 0.05, 0x45525c, 0, 0, -0.01, 28).rotateX(Math.PI / 2));
    const tickGroup = new T.Group(); tickGroup.position.z = 0.035; clockGroup.add(tickGroup);
    for (let i = 0; i < 12; i++) {
      const m = box(0.015, i % 3 === 0 ? 0.08 : 0.045, 0.006, 0x3a444a, 0, 0.27, 0);
      m.rotation.z = i * Math.PI / 6;
      tickGroup.add(m);
    }
    const hourPivot = new T.Group(); hourPivot.position.z = 0.045;
    const hourHand = box(0.02, 0.17, 0.008, 0x2d353b, 0, 0.075, 0);
    hourPivot.add(hourHand); clockGroup.add(hourPivot);
    const minPivot = new T.Group(); minPivot.position.z = 0.055;
    const minHand = box(0.016, 0.25, 0.008, 0x2d353b, 0, 0.11, 0);
    minPivot.add(minHand); clockGroup.add(minPivot);
    clockGroup.add(sph(0.025, 0xc0392b, 0, 0, 0.06, null, 8));

    /* ---------- 门 & 后墙板报 ---------- */
    const doorTex = canvasTex(220, 460, (g, w, h) => {
      g.fillStyle = '#a9784c'; g.fillRect(0, 0, w, h);
      g.strokeStyle = '#8a5c33'; g.lineWidth = 5;
      g.strokeRect(12, 12, w - 24, h - 24);
      g.strokeRect(34, 40, w - 68, 170);
      g.strokeRect(34, 250, w - 68, 170);
      g.fillStyle = '#d9d2c4'; g.fillRect(0, 0, w, 14);
    });
    const door = new T.Mesh(new T.PlaneGeometry(1.1, 2.3), new T.MeshBasicMaterial({ map: doorTex }));
    door.rotation.y = Math.PI / 2;
    door.position.set(-W / 2 + 0.11, 1.15, 4.1);
    room.add(door);
    room.add(box(0.08, 0.05, 0.18, 0xd4b46a, -W / 2 + 0.16, 1.08, 3.8));
    // 班牌
    const classTex = canvasTex(420, 150, (g, w, h) => {
      g.fillStyle = '#27435e'; g.fillRect(0, 0, w, h);
      g.strokeStyle = '#e8cf91'; g.lineWidth = 7; g.strokeRect(6, 6, w - 12, h - 12);
      g.fillStyle = '#f3e6c4'; g.textAlign = 'center'; g.textBaseline = 'middle';
      g.font = 'bold 66px "PingFang SC",sans-serif';
      g.fillText('高 三 (2) 班', w / 2, h / 2 + 2);
    });
    const classSign = new T.Mesh(new T.PlaneGeometry(1.3, 0.46), new T.MeshBasicMaterial({ map: classTex }));
    classSign.rotation.y = Math.PI / 2;
    classSign.position.set(-W / 2 + 0.12, 2.72, 4.1);
    room.add(classSign);

    // 后墙板报
    const boardTex2 = canvasTex(1000, 560, (g, w, h) => {
      g.fillStyle = '#2c4a3f'; g.fillRect(0, 0, w, h);
      g.fillStyle = '#e9e3cf'; g.font = 'bold 64px "STKaiti","KaiTi",serif'; g.textAlign = 'center';
      g.fillText('学 习 园 地', w / 2, 90);
      g.fillStyle = '#f0c95c'; g.font = 'bold 34px "PingFang SC",sans-serif';
      g.fillText('本月主题：珍惜时间 · 拒绝零食', w / 2, 160);
      // 贴纸
      const notes = [['倒计时', '273 天'], ['卫生', '本周第一'], ['警告', '禁止偷吃'], ['目标', '本科以上']];
      notes.forEach((n, i) => {
        const x = 70 + (i % 4) * 230, y = 220;
        g.fillStyle = ['#f6e7b8', '#f3c6c0', '#cfe3f5', '#d8edc9'][i];
        g.fillRect(x, y, 190, 230);
        g.fillStyle = '#3b3b3b'; g.font = 'bold 30px "PingFang SC",sans-serif';
        g.fillText(n[0], x + 95, y + 50);
        g.font = 'bold 40px "PingFang SC",sans-serif';
        g.fillText(n[1], x + 95, y + 120);
      });
      g.fillStyle = 'rgba(240,240,220,0.75)'; g.font = '28px "STKaiti","KaiTi",serif';
      g.fillText('—— 高三(2)班 班委会', w / 2, h - 45);
    });
    const backBoard = new T.Mesh(new T.PlaneGeometry(3.4, 1.9), new T.MeshBasicMaterial({ map: boardTex2 }));
    backBoard.rotation.y = Math.PI;
    backBoard.position.set(1.6, 2.25, backZ - 0.12);
    room.add(backBoard);
    room.add(box(3.55, 2.05, 0.05, 0x7b5230, 1.6, 2.25, backZ - 0.14));

    // 后墙倒计时
    const countTex = canvasTex(600, 260, (g, w, h) => {
      g.fillStyle = '#b83227'; g.fillRect(0, 0, w, h);
      g.fillStyle = '#fff7e0'; g.textAlign = 'center';
      g.font = 'bold 52px "PingFang SC",sans-serif';
      g.fillText('距离高考还有', w / 2, 85);
      g.font = 'bold 118px "DIN Alternate","PingFang SC",sans-serif';
      g.fillText('273', w / 2, 200);
      g.font = 'bold 40px "PingFang SC",sans-serif';
      g.fillText('天', w - 100, 195);
    });
    const countdown = new T.Mesh(new T.PlaneGeometry(2.1, 0.92), new T.MeshBasicMaterial({ map: countTex }));
    countdown.rotation.y = Math.PI;
    countdown.position.set(-3.6, 2.55, backZ - 0.12);
    room.add(countdown);

    // 扫把
    const broom = new T.Group();
    broom.position.set(-5.9, 0, 5.4);
    broom.add(cyl(0.022, 0.022, 1.25, 0xb98b52, 0, 0.63, 0, 6));
    const brush = new T.Mesh(new T.ConeGeometry(0.17, 0.42, 8), mat(0xc9a25e));
    brush.position.y = 0.15; broom.add(brush);
    broom.rotation.z = 0.12;
    room.add(broom);

    // 天花板灯
    const lampGlows = [];
    const lampBoxes = [];
    for (let i = 0; i < 3; i++) {
      for (let j = 0; j < 2; j++) {
        const x = -3.6 + i * 3.6, z = -3.6 + j * 5.2;
        const lampBox = box(1.5, 0.07, 0.34, 0xf8f5e8, x, H - 0.18, z);
        room.add(lampBox);
        lampBoxes.push(lampBox);
        const glow = new T.Mesh(new T.PlaneGeometry(1.35, 0.26), new T.MeshBasicMaterial({ color: 0xfff6dc }));
        glow.rotation.x = Math.PI / 2;
        glow.position.set(x, H - 0.22, z);
        room.add(glow);
        lampGlows.push(glow);
        // 灯管只做发光材质，实际照明用一盏大范围点光源，省性能
      }
    }

    // 安全出口灯（停电时才亮）
    const exitTex = canvasTex(300, 120, (g, w, h) => {
      g.fillStyle = '#0a0d0a'; g.fillRect(0, 0, w, h);
      g.fillStyle = '#6bff8a'; g.fillRect(8, 8, w - 16, h - 16);
      g.fillStyle = '#04240d';
      g.font = 'bold 54px "PingFang SC","Hiragino Sans GB",sans-serif';
      g.textAlign = 'center'; g.textBaseline = 'middle';
      g.fillText('安全出口', w / 2, h / 2 + 2);
    });
    const exitSign = new T.Mesh(new T.PlaneGeometry(0.8, 0.32), new T.MeshBasicMaterial({ map: exitTex }));
    exitSign.rotation.y = Math.PI / 2;
    exitSign.position.set(-W / 2 + 0.12, 2.85, 4.1);
    exitSign.visible = false;
    room.add(exitSign);
    const exitSignFront = new T.Mesh(new T.PlaneGeometry(0.7, 0.28), new T.MeshBasicMaterial({ map: exitTex }));
    exitSignFront.position.set(-5.2, 3.35, frontZ + 0.12);
    exitSignFront.visible = false;
    room.add(exitSignFront);

    // 广播喇叭
    const speaker = box(0.42, 0.28, 0.18, 0xcfcabd, -5.6, 3.45, frontZ + 0.2);
    room.add(speaker);

    /* ---------- 课桌 ---------- */
    const rowsZ = [-3.45, -1.72, 0, 1.75];
    const colsX = [-4.6, -2.3, 0, 2.3, 4.6];
    const PLAYER = { row: 3, col: 3, x: colsX[3], z: rowsZ[3] };
    const desks = [];
    const npcSlots = [];

    function makeDesk(withChair) {
      const g = new T.Group();
      const topY = 0.74;
      const top = new T.Mesh(new T.BoxGeometry(1.14, 0.045, 0.64), new T.MeshToonMaterial({ map: deskTex, color: 0xe2d5c0 }));
      top.position.set(0, topY, 0);
      top.castShadow = true; top.receiveShadow = true;
      g.add(top);
      // 桌沿 & 桌斗
      g.add(box(1.14, 0.09, 0.035, 0xc79b66, 0, topY - 0.05, -0.32));
      g.add(box(1.06, 0.12, 0.5, 0xc9a06c, 0, topY - 0.13, 0));
      const legMat = 0x7f8a90;
      [[-0.48, -0.24], [0.48, -0.24], [-0.48, 0.24], [0.48, 0.24]].forEach(p => {
        g.add(cyl(0.022, 0.022, 0.7, legMat, p[0], 0.35, p[1], 6));
      });
      if (withChair) {
        const chair = new T.Group();
        chair.position.set(0, 0, 0.52);
        chair.add(new T.Mesh(new T.BoxGeometry(0.5, 0.045, 0.44), new T.MeshToonMaterial({ map: deskTex, color: 0xdedede })).translateY(0.45));
        chair.add(new T.Mesh(new T.BoxGeometry(0.5, 0.42, 0.045), new T.MeshToonMaterial({ map: deskTex, color: 0xdedede })).translateY(0.68).translateZ(0.2));
        [[-0.21, -0.16], [0.21, -0.16], [-0.21, 0.18], [0.21, 0.18]].forEach(p => {
          chair.add(cyl(0.018, 0.018, 0.45, 0x8d979d, p[0], 0.225, p[1], 6));
        });
        // 椅背横档
        chair.add(box(0.46, 0.04, 0.035, 0xc79b66, 0, 0.58, 0.205));
        g.add(chair);
      }
      return g;
    }

    // 桌面小物：书 / 笔袋 / 水杯
    function deskClutter(g, seed) {
      const r = seed * 9301 % 233;
      g.add(box(0.32, 0.022, 0.23, pick([0xf4efe1, 0xe8eff7, 0xf0e2dd]), -0.28, 0.772, -0.1));
      if (r % 3 === 0) {
        g.add(box(0.22, 0.014, 0.3, pick([0xd7e5f5, 0xf7f2e3]), -0.27, 0.79, -0.1));
      }
      if (r % 2 === 0) {
        const cup = cyl(0.035, 0.032, 0.13, pick([0x88b7d6, 0xf0a5a5, 0xf6f2e8]), 0.3, 0.83, -0.15, 10);
        g.add(cup);
        g.add(cyl(0.036, 0.036, 0.02, 0xdfe5ea, 0.3, 0.9, -0.15, 10));
      }
      if (r % 5 === 0) {
        const pencil = cyl(0.008, 0.008, 0.17, 0xe8b64c, 0.24, 0.777, 0.1, 5);
        pencil.rotation.z = Math.PI / 2; pencil.rotation.y = 0.4;
        g.add(pencil);
      }
    }

    rowsZ.forEach((z, ri) => {
      colsX.forEach((x, ci) => {
        const d = makeDesk(true);
        d.position.set(x, 0, z);
        room.add(d);
        desks.push(d);
        if (ri !== PLAYER.row || ci !== PLAYER.col) {
          deskClutter(d, ri * 7 + ci);
          const blocked = (ci === PLAYER.col && ri < PLAYER.row);
          if (!blocked) npcSlots.push({ x: x, z: z, row: ri, col: ci });
        }
      });
    });

    // 讲台
    const podium = new T.Group();
    podium.position.set(-4.3, 0, -5.85);
    podium.add(box(1.7, 0.12, 0.75, 0xc79b66, 0, 0.9, 0));
    podium.add(box(1.5, 0.82, 0.62, 0xb08a5e, 0, 0.42, 0));
    podium.add(box(1.5, 0.06, 0.62, 0xa0754a, 0, 0.84, 0));
    // 讲台书堆
    const bookColors = [0x3f6d9e, 0xc0524a, 0xe0c06a, 0x59895e];
    for (let i = 0; i < 4; i++) {
      podium.add(box(0.36, 0.045, 0.26, bookColors[i], -0.3, 0.985 + i * 0.045, 0.02));
    }
    podium.add(cyl(0.055, 0.05, 0.16, 0xe8e4d8, 0.4, 1.04, 0, 10));
    podium.add(cyl(0.05, 0.05, 0.02, 0x5f7d62, 0.4, 1.12, 0, 10));
    room.add(podium);

    // 粉笔盒在讲台
    const chalkBox = box(0.24, 0.09, 0.13, 0xf0eee3, 0.05, 0.96, 0.15);
    room.add(chalkBox);

    /* ---------- 学生 NPC ---------- */
    const skinTones = [0xe6b489, 0xdcab7d, 0xf0c49c, 0xd19b6d, 0xeec0a1];
    const hairColors = [0x2a201b, 0x1d1a19, 0x3b2b22, 0x4a3526, 0x241e1d];
    const uniformColors = [0x274563, 0x274563, 0x2c4a5c, 0x243b56, 0x2f4a68];
    const shirtColors = [0xe7ebec, 0xdfe5e8, 0xebe8df];
    const npcs = [];
    let npcIndex = 0;

    function makeStudent(seed) {
      const g = new T.Group();
      const skin = pick(skinTones);
      const uni = pick(uniformColors);
      const shirt = pick(shirtColors);
      const hair = pick(hairColors);
      const r = (seed * 7919) % 100;

      // 下半身（坐姿）
      const legs = new T.Group();
      legs.add(box(0.36, 0.12, 0.3, 0x2c3a4e, 0, 0.47, 0.06));
      const thighL = box(0.12, 0.14, 0.34, 0x2c3a4e, -0.1, 0.45, -0.1);
      const thighR = box(0.12, 0.14, 0.34, 0x2c3a4e, 0.1, 0.45, -0.1);
      legs.add(thighL, thighR);
      g.add(legs);

      // 身体
      const torso = new T.Group();
      torso.position.y = 0.62;
      const jacket = new T.Mesh(new T.CylinderGeometry(0.165, 0.2, 0.42, 12), mat(uni));
      jacket.position.y = 0.21; jacket.castShadow = true;
      torso.add(jacket);
      // 衬衫领口
      const collar = new T.Mesh(new T.CylinderGeometry(0.12, 0.15, 0.1, 12), mat(shirt));
      collar.position.y = 0.42; torso.add(collar);
      // 拉链
      const zip = box(0.02, 0.4, 0.012, 0x9fb3c6, 0, 0.22, 0.186);
      torso.add(zip);
      g.add(torso);

      // 头
      const headGroup = new T.Group();
      headGroup.position.y = 1.1;
      const head = sph(0.115, skin, 0, 0, 0, null, 18);
      head.scale.set(1, 1.06, 0.98);
      headGroup.add(head);
      const neck = cyl(0.045, 0.05, 0.09, skin, 0, -0.1, 0, 8);
      headGroup.add(neck);
      // 头发
      const hairGroup = new T.Group();
      const hairMat = mat(hair);
      const cap = new T.Mesh(new T.SphereGeometry(0.124, 18, 12, Math.PI * 0.72, Math.PI * 1.56, 0, Math.PI * 0.62), hairMat);
      cap.position.y = 0.008;
      hairGroup.add(cap);
      // 额前刘海
      const fringe = new T.Mesh(new T.SphereGeometry(0.1, 12, 8), hairMat);
      fringe.scale.set(1.05, 0.42, 0.5);
      fringe.position.set(0, 0.063, 0.075);
      fringe.rotation.x = -0.15;
      hairGroup.add(fringe);
      if (r % 4 === 0) {
        // 短发刺
        for (let i = 0; i < 5; i++) {
          const sp = new T.Mesh(new T.ConeGeometry(0.035, 0.08, 5), hairMat);
          sp.position.set(-0.06 + i * 0.03, 0.1, -0.02 + (i % 2) * 0.05);
          sp.rotation.z = rnd(-0.4, 0.4);
          hairGroup.add(sp);
        }
      } else if (r % 4 === 1) {
        // 马尾
        const tail = new T.Mesh(new T.CapsuleGeometry(0.045, 0.13, 4, 8), hairMat);
        tail.position.set(0, 0.0, -0.13);
        tail.rotation.x = 0.7;
        hairGroup.add(tail);
      } else if (r % 4 === 2) {
        // 齐刘海
        const bang = box(0.18, 0.05, 0.06, hair, 0, 0.06, 0.087);
        hairGroup.add(bang);
      }
      // 后脑勺头发（从背后看不要秃）
      const backHair = new T.Mesh(new T.SphereGeometry(0.112, 16, 12), hairMat);
      backHair.scale.set(1.02, 1.16, 0.82);
      backHair.position.set(0, -0.006, -0.042);
      hairGroup.add(backHair);
      headGroup.add(hairGroup);

      // 眼睛
      const eyeMat = new T.MeshBasicMaterial({ color: 0x2b2320 });
      const eyeL = new T.Mesh(new T.SphereGeometry(0.014, 6, 6), eyeMat);
      const eyeR = eyeL.clone();
      eyeL.position.set(-0.042, 0.012, 0.104);
      eyeR.position.set(0.042, 0.012, 0.104);
      headGroup.add(eyeL, eyeR);
      // 嘴
      const mouth = box(0.035, 0.008, 0.006, 0x9b5b4d, 0, -0.045, 0.108);
      headGroup.add(mouth);
      if (r % 5 === 0) {
        // 眼镜
        const gmat = new T.MeshBasicMaterial({ color: 0x384048 });
        [-0.042, 0.042].forEach(x => {
          const ring = new T.Mesh(new T.TorusGeometry(0.03, 0.005, 5, 10), gmat);
          ring.position.set(x, 0.014, 0.112); headGroup.add(ring);
        });
        const bridge = box(0.028, 0.006, 0.005, 0x384048, 0, 0.015, 0.113);
        headGroup.add(bridge);
      }
      g.add(headGroup);

      // 手臂
      function arm(side) {
        const pivot = new T.Group();
        pivot.position.set(side * 0.19, 0.93, 0.02);
        const upper = new T.Mesh(new T.CapsuleGeometry(0.045, 0.17, 4, 8), mat(uni));
        upper.position.y = -0.1; upper.castShadow = true;
        pivot.add(upper);
        const low = new T.Group();
        low.position.y = -0.21;
        const fore = new T.Mesh(new T.CapsuleGeometry(0.038, 0.15, 4, 8), mat(shirt));
        fore.position.y = -0.08; low.add(fore);
        const hand = sph(0.042, skin, 0, -0.18, 0, null, 8);
        low.add(hand);
        pivot.add(low);
        return { pivot: pivot, low: low, hand: hand };
      }
      const armL = arm(-1), armR = arm(1);
      g.add(armL.pivot, armR.pivot);

      // 默认坐在桌前，手放桌面
      armL.pivot.rotation.x = -0.95; armL.low.rotation.x = 0.65;
      armR.pivot.rotation.x = -0.95; armR.low.rotation.x = 0.65;
      armL.pivot.rotation.z = 0.12; armR.pivot.rotation.z = -0.12;

      g.userData = {
        headGroup, head, hairGroup, torso, armL, armR, legs,
        seed: seed, baseY: 0, bobT: rnd(0, 9), sleeping: r % 9 === 0,
        nibbleT: rnd(3, 12), nibble: 0, caughtT: 0, hat: null, snitching: false
      };
      if (g.userData.sleeping) {
        headGroup.position.y = 0.98;
        headGroup.position.z = 0.16;
        headGroup.rotation.x = 1.2;
        torso.rotation.x = 0.16;
        armL.pivot.rotation.x = -1.35; armR.pivot.rotation.x = -1.35;
        armL.low.rotation.x = 1.5; armR.low.rotation.x = 1.5;
      }
      return g;
    }

    npcSlots.forEach((slot, i) => {
      const s = makeStudent(i * 31 + 7);
      s.position.set(slot.x + rnd(-0.03, 0.03), 0, slot.z + 0.28 + rnd(-0.02, 0.03));
      s.rotation.y = Math.PI;
      room.add(s);
      s.userData.slot = slot;
      npcs.push(s);
      npcIndex++;
    });

    // 红牌（罚站/被抓用，默认隐藏）
    function makeRedCard() {
      const g = new T.Group();
      const tex = canvasTex(160, 220, (gg, w, h) => {
        gg.fillStyle = '#c62828'; gg.fillRect(0, 0, w, h);
        gg.strokeStyle = '#fff3e0'; gg.lineWidth = 8; gg.strokeRect(8, 8, w - 16, h - 16);
        gg.fillStyle = '#fff3e0'; gg.textAlign = 'center';
        gg.font = 'bold 46px "PingFang SC",sans-serif';
        gg.fillText('违纪', w / 2, 70);
        gg.font = 'bold 30px "PingFang SC",sans-serif';
        gg.fillText('上课偷吃', w / 2, 130);
        gg.font = '28px "PingFang SC",sans-serif';
        gg.fillText('罚 站', w / 2, 180);
      });
      const p = new T.Mesh(new T.PlaneGeometry(0.36, 0.5), new T.MeshBasicMaterial({ map: tex, side: T.DoubleSide }));
      g.add(p);
      g.visible = false;
      room.add(g);
      return g;
    }
    const redCard = makeRedCard();

    /* ---------- 老师 ---------- */
    function makeTeacher(style) {
      const g = new T.Group();
      const skin = 0xe9b889;
      const coat = style.coat, skirtCol = style.skirt, hairCol = style.hair;

      // 腿
      const legL = new T.Group(); legL.position.set(-0.1, 0.78, 0);
      const legR = new T.Group(); legR.position.set(0.1, 0.78, 0);
      [[legL, skin], [legR, skin]].forEach(pair => {
        const thigh = new T.Mesh(new T.CapsuleGeometry(0.048, 0.55, 4, 8), mat(pair[1] === skin ? 0xe8c3a2 : 0xe8c3a2));
        thigh.position.y = -0.38; thigh.castShadow = true;
        pair[0].add(thigh);
        const shoe = box(0.1, 0.07, 0.2, 0x2b2622, 0, -0.74, 0.04);
        pair[0].add(shoe);
      });
      g.add(legL, legR);

      // 裙子
      const skirt = new T.Mesh(new T.CylinderGeometry(0.195, 0.265, 0.42, 14), mat(skirtCol));
      skirt.position.y = 0.88; skirt.castShadow = true;
      g.add(skirt);

      // 上身
      const torso = new T.Group();
      torso.position.y = 1.28;
      const body = new T.Mesh(new T.CylinderGeometry(0.195, 0.185, 0.5, 14), mat(coat));
      body.position.y = 0.06; body.castShadow = true;
      torso.add(body);
      // 白衬衫领
      const collar = new T.Mesh(new T.CylinderGeometry(0.085, 0.13, 0.06, 12), mat(0xf7f4ec));
      collar.position.y = 0.25; torso.add(collar);
      // 衣领 V（在胸口，不要挡住脸）
      const v = new T.Mesh(new T.PlaneGeometry(0.13, 0.12), new T.MeshBasicMaterial({ color: 0xf7f4ec }));
      v.position.set(0, 0.14, 0.194); v.scale.set(0.85, 0.75, 1); torso.add(v);
      // 左胸口袋 & 红笔
      const pen = cyl(0.012, 0.012, 0.1, 0xc0392b, 0.1, 0.18, 0.2, 6);
      torso.add(pen);
      g.add(torso);

      // 脖子
      const neck = cyl(0.052, 0.06, 0.12, skin, 0, 1.56, 0, 10);
      g.add(neck);

      // 头
      const headGroup = new T.Group();
      headGroup.position.y = 1.66;
      const head = sph(0.138, skin, 0, 0, 0, null, 20);
      head.scale.set(1, 1.08, 0.97);
      headGroup.add(head);
      g.add(headGroup);

      // 头发
      const hairGroup = new T.Group();
      const hairMat = mat(hairCol);
      const cap = new T.Mesh(new T.SphereGeometry(0.144, 20, 12, Math.PI * 0.72, Math.PI * 1.56, 0, Math.PI * 0.62), hairMat);
      cap.position.y = 0.01;
      hairGroup.add(cap);
      const fringe = new T.Mesh(new T.SphereGeometry(0.115, 14, 8), hairMat);
      fringe.scale.set(1.08, 0.38, 0.55);
      fringe.position.set(-0.012, 0.074, 0.083);
      fringe.rotation.z = 0.1;
      fringe.rotation.x = -0.12;
      hairGroup.add(fringe);
      if (style.hairStyle === 'bun') {
        const bun = sph(0.075, hairCol, 0, 0.12, -0.1, null, 12);
        hairGroup.add(bun);
        const pin = box(0.12, 0.012, 0.012, 0xd9c27a, 0, 0.15, -0.09);
        pin.rotation.z = 0.2; hairGroup.add(pin);
      } else if (style.hairStyle === 'ponytail') {
        const tail = new T.Mesh(new T.CapsuleGeometry(0.05, 0.22, 4, 8), hairMat);
        tail.position.set(0, 0.01, -0.15); tail.rotation.x = 0.5;
        hairGroup.add(tail);
      } else {
        // 短发，露额头
        cap.scale.set(1, 0.92, 1);
        const side1 = sph(0.05, hairCol, -0.12, -0.03, 0.02, null, 8);
        const side2 = sph(0.05, hairCol, 0.12, -0.03, 0.02, null, 8);
        hairGroup.add(side1, side2);
      }
      // 后脑勺
      const backHair = new T.Mesh(new T.SphereGeometry(0.13, 16, 12), hairMat);
      backHair.scale.set(1.03, 1.12, 0.8);
      backHair.position.set(0, -0.004, -0.05);
      hairGroup.add(backHair);
      headGroup.add(hairGroup);

      // 脸
      const eyeMat = new T.MeshBasicMaterial({ color: 0x2a2320 });
      [-0.05, 0.05].forEach(x => {
        const e = new T.Mesh(new T.SphereGeometry(0.015, 6, 6), eyeMat);
        e.position.set(x, 0.012, 0.126);
        headGroup.add(e);
      });
      // 眉毛
      const browL = box(0.05, 0.012, 0.008, 0x2a2320, -0.05, 0.055, 0.126);
      const browR = box(0.05, 0.012, 0.008, 0x2a2320, 0.05, 0.055, 0.126);
      browL.rotation.z = -0.16; browR.rotation.z = 0.16;
      headGroup.add(browL, browR);
      // 嘴（正常状态）
      const mouth = box(0.05, 0.01, 0.008, 0x9b4b48, 0, -0.055, 0.128);
      headGroup.add(mouth);

      // 夜里会发光的眼睛
      const glowMat = new T.MeshBasicMaterial({ color: 0xff3322 });
      const eyeGlowL = new T.Mesh(new T.SphereGeometry(0.019, 8, 8), glowMat);
      const eyeGlowR = new T.Mesh(new T.SphereGeometry(0.019, 8, 8), glowMat);
      eyeGlowL.position.set(-0.05, 0.012, 0.138);
      eyeGlowR.position.set(0.05, 0.012, 0.138);
      eyeGlowL.visible = eyeGlowR.visible = false;
      headGroup.add(eyeGlowL, eyeGlowR);
      const faceGlow = new T.PointLight(0xff2a1a, 0, 1.5, 2);
      faceGlow.position.set(0, 0.02, 0.22);
      headGroup.add(faceGlow);

      // 张开的血盆大口（只在被吃 / 夜里的特写出现）
      const maw = new T.Group();
      maw.position.set(0, -0.05, 0.114);
      const cavity = new T.Mesh(new T.SphereGeometry(0.062, 16, 12), new T.MeshBasicMaterial({ color: 0x0d0205 }));
      cavity.scale.set(1.15, 0.92, 0.5);
      maw.add(cavity);
      const tongue = new T.Mesh(new T.SphereGeometry(0.04, 12, 8), new T.MeshBasicMaterial({ color: 0x65111c }));
      tongue.scale.set(0.85, 0.22, 0.55);
      tongue.position.set(0, -0.032, 0.02);
      maw.add(tongue);
      const toothMat = new T.MeshBasicMaterial({ color: 0xf1ead2 });
      for (let i = 0; i < 7; i++) {
        const tx = -0.042 + i * 0.014;
        const top = new T.Mesh(new T.ConeGeometry(0.0075, 0.03, 5), toothMat);
        top.position.set(tx, 0.036, 0.028);
        top.rotation.x = Math.PI;
        const bot = new T.Mesh(new T.ConeGeometry(0.0068, 0.024, 5), toothMat);
        bot.position.set(tx, -0.038, 0.028);
        maw.add(top, bot);
      }
      maw.visible = false;
      headGroup.add(maw);
      // 眼镜
      if (style.glasses) {
        const gmat = new T.MeshBasicMaterial({ color: 0x3a3f45 });
        [-0.055, 0.055].forEach(x => {
          const ring = new T.Mesh(new T.TorusGeometry(0.036, 0.006, 5, 10), gmat);
          ring.position.set(x, 0.012, 0.132); headGroup.add(ring);
        });
        const bridge = box(0.04, 0.006, 0.006, 0x3a3f45, 0, 0.014, 0.134);
        headGroup.add(bridge);
        const temple1 = box(0.11, 0.006, 0.006, 0x3a3f45, -0.12, 0.02, 0.06);
        const temple2 = box(0.11, 0.006, 0.006, 0x3a3f45, 0.12, 0.02, 0.06);
        temple1.rotation.y = 0.5; temple2.rotation.y = -0.5;
        headGroup.add(temple1, temple2);
      }
      // 耳环
      [-0.135, 0.135].forEach(x => {
        const ear = sph(0.012, 0xd8b45a, x, -0.01, 0.02, null, 6);
        headGroup.add(ear);
      });

      // 手臂
      function arm(side) {
        const pivot = new T.Group();
        pivot.position.set(side * 0.215, 1.44, 0);
        const upper = new T.Mesh(new T.CapsuleGeometry(0.055, 0.2, 4, 8), mat(coat));
        upper.position.y = -0.12; upper.castShadow = true;
        pivot.add(upper);
        const elbow = new T.Group();
        elbow.position.y = -0.26;
        const fore = new T.Mesh(new T.CapsuleGeometry(0.045, 0.19, 4, 8), mat(coat));
        fore.position.y = -0.1;
        elbow.add(fore);
        const cuff = cyl(0.05, 0.05, 0.035, 0xf7f4ec, 0, -0.22, 0, 8);
        elbow.add(cuff);
        const hand = sph(0.048, skin, 0, -0.255, 0, null, 10);
        elbow.add(hand);
        pivot.add(elbow);
        return { pivot, elbow, hand };
      }
      const armL = arm(-1), armR = arm(1);
      g.add(armL.pivot, armR.pivot);

      // 粉笔
      const chalk = cyl(0.014, 0.014, 0.09, 0xfdfbf3, 0, 0, 0, 6);
      chalk.rotation.x = Math.PI / 2;
      chalk.position.set(0, -0.27, 0.05);
      armR.elbow.add(chalk);

      // 红色教鞭/点名册
      const book = box(0.22, 0.03, 0.3, 0xb73b32, 0, -0.22, 0.08);
      book.visible = false;
      armL.elbow.add(book);

      // 停电时的手电筒
      const torchPivot = new T.Group();
      torchPivot.position.set(0.2, 1.33, 0.2);
      const torchBody = new T.Mesh(new T.CylinderGeometry(0.034, 0.04, 0.16, 10), new T.MeshBasicMaterial({ color: 0x1c1e23 }));
      torchBody.rotation.x = Math.PI / 2;
      torchPivot.add(torchBody);
      const torchLens = new T.Mesh(new T.CircleGeometry(0.038, 14), new T.MeshBasicMaterial({ color: 0xfff4c8 }));
      torchLens.position.z = 0.085;
      torchPivot.add(torchLens);
      const torchSpot = new T.SpotLight(0xfff0c8, 0, 22, 0.4, 0.5, 1.1);
      const torchTarget = new T.Object3D();
      torchTarget.position.set(0, 0, 9);
      torchPivot.add(torchTarget);
      torchSpot.target = torchTarget;
      torchPivot.add(torchSpot);
      const torchBeam = new T.Mesh(
        new T.ConeGeometry(2.1, 9, 18, 1, true),
        new T.MeshBasicMaterial({ color: 0xfff3cf, transparent: true, opacity: 0.04, depthWrite: false, blending: T.AdditiveBlending, side: T.DoubleSide })
      );
      torchBeam.rotation.x = -Math.PI / 2;
      torchBeam.position.z = 4.5;
      torchPivot.add(torchBeam);
      torchPivot.visible = false;
      g.add(torchPivot);

      g.userData = { headGroup, torso, armL, armR, legL, legR, chalk, book, style, walkPhase: 0, headTurn: 0,
        eyeGlowL, eyeGlowR, faceGlow, maw, normalMouth: mouth, torchPivot, torchLens, torchSpot, torchBeam };
      g.traverse(o => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
      return g;
    }

    let teacher = makeTeacher(LESSONS[1].style);
    teacher.position.set(0.2, 0, -6.0);
    teacher.rotation.y = Math.PI; // 面向黑板
    scene.add(teacher);

    // 老师状态
    let tState = {
      mode: 'write', yaw: Math.PI, moving: false, headTurn: 0, writeT: 0,
      walkPhase: 0, blinkT: 0
    };

    /* ---------- 停电 / 吃人状态 ---------- */
    let nightMode = false;
    let eatActive = false;
    let stabActive = false;
    let stabT = 0;
    let stabSaved = null;
    let sneakActive = false;
    let sneakProgress = 0;
    let sneakT = 0;
    let eatT = 0;
    let eatSaved = null;
    const eatLight = new T.PointLight(0xff2a18, 0, 4.5, 2);
    eatLight.position.set(0.25, 1.7, -4.15);
    scene.add(eatLight);

    function applyNightToTeacher() {
      const u = teacher && teacher.userData;
      if (!u || !u.torchPivot) return;
      u.eyeGlowL.visible = nightMode;
      u.eyeGlowR.visible = nightMode;
      u.faceGlow.intensity = nightMode ? 0.22 : 0;
      u.torchPivot.visible = nightMode;
      u.torchSpot.intensity = nightMode ? 4.6 : 0;
      u.torchBeam.visible = nightMode;
      if (!eatActive) {
        u.maw.visible = false;
        u.normalMouth.visible = true;
        u.maw.scale.setScalar(1);
      }
    }

    /* ---------- 玩家自己的手 & 零食 ---------- */
    const handGroup = new T.Group();
    camera.add(handGroup);

    // 零食标签
    const LABELS = {};
    function snackLabel(type) {
      if (LABELS[type]) return LABELS[type];
      const name = SNACKS[type] ? SNACKS[type].name : type;
      const tex = canvasTex(256, 128, (g, w, h) => {
        g.clearRect(0, 0, w, h);
        g.fillStyle = '#fff4d8';
        g.strokeStyle = '#8c2a1d';
        g.lineWidth = 6;
        if (g.roundRect) {
          g.beginPath(); g.roundRect(14, 14, w - 28, h - 28, 16);
        } else {
          g.beginPath(); g.rect(14, 14, w - 28, h - 28);
        }
        g.fill(); g.stroke();
        g.fillStyle = '#8c2a1d';
        g.font = 'bold 58px "PingFang SC","Hiragino Sans GB",sans-serif';
        g.textAlign = 'center'; g.textBaseline = 'middle';
        g.fillText(name, w / 2, h / 2 + 3);
      });
      LABELS[type] = tex;
      return tex;
    }

    // 课桌上的零食模型
    function snackMesh(type, scale) {
      const g = new T.Group();
      const s = scale || 1;
      if (type === 'spicy') {
        g.add(box(0.19 * s, 0.055 * s, 0.27 * s, 0xc0392b));
        g.add(box(0.12 * s, 0.004 * s, 0.18 * s, 0xf6e6cf, 0, 0.03 * s, 0));
        for (let i = 0; i < 5; i++) {
          g.add(box(0.032 * s, 0.008 * s, 0.02 * s, 0xd35445, -0.075 * s + i * 0.037 * s, 0.03 * s, 0.135 * s));
        }
      } else if (type === 'chips') {
        g.add(box(0.2 * s, 0.075 * s, 0.25 * s, 0x2f7cc0));
        g.add(box(0.14 * s, 0.005 * s, 0.17 * s, 0xffd45e, 0, 0.041 * s, 0));
        g.add(cyl(0.02 * s, 0.02 * s, 0.14 * s, 0x2f7cc0, -0.1 * s, 0.03 * s, 0, 6).rotateZ(Math.PI / 2));
      } else if (type === 'noodle') {
        g.add(box(0.18 * s, 0.07 * s, 0.2 * s, 0xd79b25));
        g.add(box(0.11 * s, 0.004 * s, 0.14 * s, 0xfbe6b5, 0, 0.038 * s, 0));
      } else if (type === 'milktea') {
        g.add(cyl(0.055 * s, 0.045 * s, 0.19 * s, 0xe9dcc8, 0, 0.095 * s, 0, 12));
        g.add(cyl(0.056 * s, 0.056 * s, 0.012 * s, 0x8d5b3a, 0, 0.195 * s, 0, 12));
        g.add(cyl(0.058 * s, 0.058 * s, 0.03 * s, 0xa8764f, 0, 0.11 * s, 0, 12));
        g.add(cyl(0.006 * s, 0.006 * s, 0.2 * s, 0xdfe6e9, 0.02 * s, 0.26 * s, 0, 6));
      } else if (type === 'banana') {
        const body = new T.Mesh(new T.TorusGeometry(0.09 * s, 0.032 * s, 6, 12, Math.PI * 0.95), mat(0xe8c13a));
        body.rotation.z = 0.4; body.position.y = 0.06 * s;
        g.add(body);
        g.add(sph(0.02 * s, 0x6b4a2a, -0.075 * s, 0.055 * s, 0, null, 6));
      } else if (type === 'chicken') {
        const meat = new T.Mesh(new T.SphereGeometry(0.095 * s, 10, 8), mat(0x8e4a2d));
        meat.scale.set(1, 1.15, 1.25); meat.position.y = 0.09 * s;
        g.add(meat);
        g.add(box(0.035 * s, 0.14 * s, 0.035 * s, 0xf2ead8, 0, 0.15 * s, -0.09 * s));
        g.add(sph(0.035 * s, 0x6b4a2a, 0, 0.19 * s, -0.12 * s, null, 6));
      }
      if (type === 'spicy' || type === 'chips' || type === 'noodle') {
        const topY = type === 'chips' ? 0.0378 : type === 'noodle' ? 0.0385 : 0.0285;
        const lab = new T.Mesh(new T.PlaneGeometry(0.15 * s, 0.1 * s),
          new T.MeshBasicMaterial({ map: snackLabel(type), transparent: true, depthWrite: false }));
        lab.rotation.x = -Math.PI / 2;
        lab.position.set(0, topY * s, 0);
        g.add(lab);
      }
      g.traverse(o => { if (o.isMesh) { o.castShadow = true; } });
      return g;
    }

    const deskGroup = new T.Group(); // 玩家桌面
    deskGroup.position.set(PLAYER.x, 0, PLAYER.z);
    room.add(deskGroup);
    // 桌面书和笔
    deskGroup.add(box(0.34, 0.03, 0.26, 0x3f6d9e, -0.26, 0.775, -0.02));
    deskGroup.add(box(0.29, 0.02, 0.22, 0xf1ead7, -0.25, 0.797, -0.01));
    deskGroup.add(cyl(0.009, 0.009, 0.16, 0x2f6f9e, 0.30, 0.78, 0.10, 5).rotateZ(Math.PI / 2));
    // 笔袋
    deskGroup.add(box(0.18, 0.045, 0.08, 0x5d7c94, 0.36, 0.79, 0.0));
    // 桌兜里的美工刀（反杀用）
    const bladeProp = new T.Group();
    bladeProp.add(box(0.13, 0.02, 0.032, 0x2b2b30, 0, 0, 0));
    bladeProp.add(box(0.075, 0.007, 0.017, 0xd8dbe0, 0.09, 0.002, 0));
    bladeProp.position.set(0.44, 0.79, 0.13);
    bladeProp.rotation.y = -0.5;
    deskGroup.add(bladeProp);

    const deskSnacks = {}; // type -> mesh
    let activeSnack = null;

    // 玩家手持食物
    const handFood = new T.Group();
    handGroup.add(handFood);

    // 小臂（镜头空间）：吃的时候从画面右下伸上来
    function makeForearm() {
      const g = new T.Group();
      const sleeve = new T.Mesh(new T.CapsuleGeometry(0.032, 0.24, 4, 8), mat(0x233b55));
      sleeve.castShadow = false;
      const cuff = new T.Mesh(new T.CylinderGeometry(0.035, 0.039, 0.024, 10), mat(0xe9ecdf));
      cuff.position.y = 0.098;
      const hand = new T.Mesh(new T.SphereGeometry(0.032, 12, 10), mat(0xf2c6a0));
      hand.scale.set(1.25, 0.85, 1.05);
      hand.position.y = 0.13;
      hand.castShadow = false;
      g.add(sleeve, cuff, hand);
      return g;
    }
    const armRig = makeForearm();
    armRig.position.set(0.21, -0.39, -0.52);
    armRig.rotation.z = 0.6;
    const armRigL = new T.Group();
    handGroup.add(armRig, armRigL);

    // 手机
    const phoneMesh = new T.Group();
    phoneMesh.add(box(0.13, 0.24, 0.016, 0x1d2226));
    const phoneScreen = new T.Mesh(new T.PlaneGeometry(0.105, 0.19), new T.MeshBasicMaterial({ color: 0x8fe6c0 }));
    phoneScreen.position.set(0, 0, 0.01);
    phoneMesh.add(phoneScreen);
    phoneMesh.position.set(0.15, -0.24, -0.42);
    phoneMesh.rotation.set(-0.3, 0.16, 0.06);
    phoneMesh.scale.setScalar(0.86);
    phoneMesh.visible = false;
    handGroup.add(phoneMesh);

    // 反杀时伸出的手 + 美工刀（镜头空间）
    const stabHand = new T.Group();
    {
      const sleeve = new T.Mesh(new T.CapsuleGeometry(0.033, 0.22, 4, 8), mat(0x233b55));
      sleeve.rotation.z = 0.9;
      sleeve.position.set(0.14, -0.3, -0.4);
      const hand = sph(0.04, 0xf2c6a0, 0.03, -0.17, -0.42, null, 10);
      const handle = box(0.028, 0.085, 0.028, 0x2b2b30, 0.03, -0.09, -0.43);
      const blade = box(0.014, 0.16, 0.01, 0xdfe3e8, 0.03, 0.02, -0.43);
      stabHand.add(sleeve, hand, handle, blade);
    }
    stabHand.visible = false;
    camera.add(stabHand);

    // 玩家腿（坐姿，低头可见）
    const lapGroup = new T.Group();
    lapGroup.position.set(PLAYER.x, 0, PLAYER.z);
    [-0.14, 0.14].forEach(x => {
      const thigh = box(0.16, 0.14, 0.4, 0x2c3a4e, x, 0.47, 0.25);
      lapGroup.add(thigh);
      const knee = box(0.15, 0.15, 0.16, 0x2c3a4e, x, 0.42, 0.46);
      lapGroup.add(knee);
      const shin = box(0.13, 0.42, 0.14, 0x2c3a4e, x, 0.22, 0.52);
      lapGroup.add(shin);
    });
    // 自己的椅子靠背
    room.add(lapGroup);

    /* ---------- 相机构图 ---------- */
    const SEAT = new T.Vector3(PLAYER.x, 1.205, PLAYER.z + 0.40);
    const TITLE = { pos: new T.Vector3(0.5, 1.72, 5.0), yaw: 0.1, pitch: -0.05, fov: 60 };
    const PUNISH = { pos: new T.Vector3(6.15, 1.62, 5.6), yaw: 0.47, pitch: -0.02, fov: 55 };

    const cam = {
      mode: 'title', pos: TITLE.pos.clone(), yaw: TITLE.yaw, pitch: TITLE.pitch,
      targetPos: TITLE.pos.clone(), targetYaw: TITLE.yaw, targetPitch: TITLE.pitch,
      lockLook: true, fov: 60, targetFov: 60
    };
    let lookYaw = 0, lookPitch = 0;
    let bobT = 0, shake = 0, shakeDecay = 4.5;
    let flashWhite = 0;

    scene.add(camera);
    camera.position.copy(cam.pos);
    camera.fov = 60;
    camera.updateProjectionMatrix();

    /* ---------- 灰尘 ---------- */
    const dustGeo = new T.BufferGeometry();
    const dustCount = 140;
    const dustPos = new Float32Array(dustCount * 3);
    const dustSeed = [];
    for (let i = 0; i < dustCount; i++) {
      dustPos[i * 3] = rnd(-6, 6);
      dustPos[i * 3 + 1] = rnd(0.6, 3.6);
      dustPos[i * 3 + 2] = rnd(-6, 6);
      dustSeed.push(rnd(0.02, 0.12));
    }
    dustGeo.setAttribute('position', new T.BufferAttribute(dustPos, 3));
    const dustMat = new T.PointsMaterial({ color: 0xfff2cc, size: 0.035, transparent: true, opacity: 0.5, depthWrite: false, blending: T.AdditiveBlending });
    const dust = new T.Points(dustGeo, dustMat);
    scene.add(dust);

    /* ---------- 粉笔头 ---------- */
    const projectiles = [];

    /* ---------- 黑板绘制 ---------- */
    const chalk = {
      lesson: 1, items: [], count: 0, lines: LESSONS[1].chalkLines, title: LESSONS[1].chalkTitle
    };

    function chalkPaperBg(g, w, h) {
      g.fillStyle = '#2d4b40';
      g.fillRect(0, 0, w, h);
      // 底色不均
      for (let i = 0; i < 60; i++) {
        g.fillStyle = 'rgba(255,255,255,' + rnd(0.005, 0.02) + ')';
        g.beginPath();
        g.ellipse(rnd(0, w), rnd(0, h), rnd(30, 160), rnd(10, 60), rnd(0, 3), 0, 7);
        g.fill();
      }
      // 边框
      g.strokeStyle = 'rgba(235,235,220,0.35)';
      g.lineWidth = 3;
      g.strokeRect(26, 24, w - 52, h - 48);
    }

    function drawChalk() {
      const g = chalkCtx, w = chalkCanvas.width, h = chalkCanvas.height;
      chalkPaperBg(g, w, h);
      // 标题
      g.fillStyle = 'rgba(245,245,230,0.92)';
      g.font = 'bold 50px "STKaiti","KaiTi","PingFang SC",serif';
      g.textAlign = 'left';
      g.fillText(chalk.title, 64, 92);
      g.strokeStyle = 'rgba(245,245,230,0.55)';
      g.lineWidth = 2;
      g.beginPath(); g.moveTo(64, 108); g.lineTo(64 + g.measureText(chalk.title).width, 108); g.stroke();

      // 逐条显示
      const items = chalk.items;
      // 右侧随手涂鸦
      if (chalk.count > 3) {
        g.save();
        g.translate(1280, 300);
        g.strokeStyle = 'rgba(245,245,230,0.5)';
        g.lineWidth = 2.5;
        g.beginPath(); g.arc(0, 0, 38, 0, 7); g.stroke();
        g.beginPath(); g.arc(-13, -8, 3.5, 0, 7); g.stroke();
        g.beginPath(); g.arc(13, -8, 3.5, 0, 7); g.stroke();
        g.beginPath(); g.arc(0, 8, 16, 0.15, Math.PI - 0.15); g.stroke();
        g.font = '28px "STKaiti","KaiTi",serif';
        g.fillStyle = 'rgba(245,245,230,0.55)';
        g.textAlign = 'center';
        g.fillText('（这题我也不会）', 0, 68);
        g.restore();
      }
      for (let i = 0; i < items.length && i < chalk.count; i++) {
        const it = items[i];
        if (it.kind === 'line') {
          g.fillStyle = 'rgba(238,240,225,0.88)';
          g.font = (it.bold ? 'bold ' : '') + (it.size || 38) + 'px "STKaiti","KaiTi","PingFang SC",serif';
          g.fillText(it.text, it.x || 88, it.y);
        } else if (it.kind === 'graph') {
          g.strokeStyle = 'rgba(245,245,230,0.8)';
          g.lineWidth = 3;
          const ox = it.x, oy = it.y;
          g.beginPath(); g.moveTo(ox, oy - 70); g.lineTo(ox, oy + 70); g.stroke();
          g.beginPath(); g.moveTo(ox - 40, oy); g.lineTo(ox + 150, oy); g.stroke();
          g.beginPath();
          g.moveTo(ox - 25, oy - 35);
          g.quadraticCurveTo(ox + 55, oy + 80, ox + 135, oy - 45);
          g.stroke();
          g.fillStyle = 'rgba(245,245,230,0.7)';
          g.font = '26px "STKaiti","KaiTi",serif';
          g.fillText('y', ox + 6, oy - 62);
          g.fillText('x', ox + 128, oy + 24);
        } else if (it.kind === 'doodle') {
          g.strokeStyle = 'rgba(245,245,230,0.65)';
          g.lineWidth = 2.5;
          g.beginPath(); g.arc(it.x, it.y, 26, 0, 7); g.stroke();
          g.beginPath(); g.arc(it.x - 9, it.y - 6, 3, 0, 7); g.stroke();
          g.beginPath(); g.arc(it.x + 9, it.y - 6, 3, 0, 7); g.stroke();
          g.beginPath(); g.arc(it.x, it.y + 8, 10, 0.2, Math.PI - 0.2); g.stroke();
          g.font = '24px "STKaiti","KaiTi",serif';
          g.fillStyle = 'rgba(245,245,230,0.7)';
          g.fillText('王老师', it.x + 36, it.y + 4);
        }
      }
      chalkTexture.needsUpdate = true;
    }

    /* ---------- 动画更新 ---------- */
    const clock = { hour: 8, minute: 0, progress: 0 };
    let lessonActive = false;
    let npcFrozen = false;
    let t = 0;
    let seatBob = 0;
    let eatHold = 0, eating = false, phoneUp = false;
    let biteAnimT = 0;
    let currentSnackType = null;
    let crumbs = [];

    function makeCrumbs(n, color) {
      for (let i = 0; i < n; i++) {
        const c = new T.Mesh(new T.BoxGeometry(0.012, 0.012, 0.012), new T.MeshBasicMaterial({ color: color }));
        handFood.getWorldPosition(new T.Vector3());
        c.position.copy(camera.position);
        c.position.y -= 0.16;
        c.position.x += rnd(-0.03, 0.03);
        c.position.z -= 0.3;
        c.userData.v = new T.Vector3(rnd(-0.2, 0.2), rnd(-0.5, 0.1), rnd(-0.4, -0.1));
        c.userData.life = rnd(0.5, 0.9);
        scene.add(c);
        crumbs.push(c);
      }
    }

    function updateCrumbs(dt) {
      for (let i = crumbs.length - 1; i >= 0; i--) {
        const c = crumbs[i];
        c.userData.life -= dt;
        c.userData.v.y -= 3.2 * dt;
        c.position.addScaledVector(c.userData.v, dt);
        c.rotation.x += dt * 6;
        if (c.userData.life <= 0) {
          scene.remove(c);
          c.geometry.dispose();
          c.material.dispose();
          crumbs.splice(i, 1);
        }
      }
    }

    /* ---------- NPC 动画 ---------- */
    function updateNPCs(dt) {
      for (let i = 0; i < npcs.length; i++) {
        const s = npcs[i], u = s.userData;
        u.bobT += dt * (0.9 + (i % 5) * 0.07);
        const br = Math.sin(u.bobT) * 0.006;
        s.position.y = u.baseY + br;

        // 要举手举报
        if (u.snitching) {
          u.headGroup.rotation.y = damp(u.headGroup.rotation.y, -0.3, 6, dt);
          u.headGroup.rotation.x = damp(u.headGroup.rotation.x, 0.02, 6, dt);
          u.armR.pivot.rotation.x = damp(u.armR.pivot.rotation.x, -2.6, 10, dt);
          u.armR.pivot.rotation.z = damp(u.armR.pivot.rotation.z, 0.18, 10, dt);
          u.armR.low.rotation.x = damp(u.armR.low.rotation.x, 0.05, 10, dt);
          u.torso.rotation.z = 0;
          continue;
        }
        if (u.sleeping) continue;

        if (u.caughtT > 0) {
          u.caughtT -= dt;
          u.headGroup.rotation.x = Math.min(0.65, u.headGroup.rotation.x + dt * 2);
          if (u.caughtT <= 0) {
            u.headGroup.rotation.x = 0;
            if (u.hat) { u.hat.visible = false; }
          }
          continue;
        }

        // 被老师盯住时全体僵住
        if (npcFrozen) {
          u.headGroup.rotation.y = damp(u.headGroup.rotation.y, 0, 8, dt);
          u.headGroup.rotation.x = damp(u.headGroup.rotation.x, 0, 8, dt);
          u.armL.pivot.rotation.x = damp(u.armL.pivot.rotation.x, -0.95, 8, dt);
          u.armR.pivot.rotation.x = damp(u.armR.pivot.rotation.x, -0.95, 8, dt);
          continue;
        }

        // 偶尔偷吃
        u.nibbleT -= dt;
        if (u.nibbleT <= 0 && u.nibble <= 0) {
          u.nibble = rnd(0.9, 1.5);
          u.nibbleT = rnd(4, 13);
        }
        if (u.nibble > 0) {
          u.nibble -= dt;
          const p = 1 - Math.max(0, u.nibble) / 1.5;
          const raise = Math.sin(Math.min(1, p * 1.6) * Math.PI);
          u.armR.pivot.rotation.x = -0.95 - raise * 0.9;
          u.armR.low.rotation.x = 0.65 + raise * 0.8;
          u.headGroup.rotation.x = raise * 0.12;
        } else {
          u.armR.pivot.rotation.x = damp(u.armR.pivot.rotation.x, -0.95, 5, dt);
          u.armR.low.rotation.x = damp(u.armR.low.rotation.x, 0.65, 5, dt);
          u.headGroup.rotation.x = damp(u.headGroup.rotation.x, 0, 4, dt);
        }

        // 左右看
        const look = Math.sin(u.bobT * 0.28 + i) * 0.35;
        u.headGroup.rotation.y = damp(u.headGroup.rotation.y, look * (npcFrozen ? 0 : 1), 2, dt);
        u.torso.rotation.z = Math.sin(u.bobT * 0.5) * 0.004;
      }
    }

    function setNpcCaught(i, dur) {
      const u = npcs[i] && npcs[i].userData;
      if (!u) return;
      u.caughtT = dur || 4;
      if (u.hat) u.hat.visible = true;
    }

    /* ---------- 老师动画 ---------- */
    function updateTeacher(dt) {
      const u = teacher.userData;
      const mode = tState.mode;
      const armR = u.armR, armL = u.armL;

      // 走路摆腿
      if (tState.moving) {
        tState.walkPhase += dt * 7.2;
        const sw = Math.sin(tState.walkPhase);
        u.legL.rotation.x = sw * 0.5;
        u.legR.rotation.x = -sw * 0.5;
        u.armL.pivot.rotation.x = damp(u.armL.pivot.rotation.x, -sw * 0.4, 12, dt);
        u.armR.pivot.rotation.x = damp(u.armR.pivot.rotation.x, sw * 0.4, 12, dt);
        u.armL.elbow.rotation.x = damp(u.armL.elbow.rotation.x, 0.15, 10, dt);
        u.armR.elbow.rotation.x = damp(u.armR.elbow.rotation.x, 0.15, 10, dt);
        u.torso.position.y = 1.28 + Math.abs(Math.sin(tState.walkPhase * 2)) * 0.012;
      } else {
        u.legL.rotation.x = damp(u.legL.rotation.x, 0, 8, dt);
        u.legR.rotation.x = damp(u.legR.rotation.x, 0, 8, dt);
        u.torso.position.y = damp(u.torso.position.y, 1.28, 5, dt);
      }

      // 头部
      u.headGroup.rotation.y = damp(u.headGroup.rotation.y, tState.headTurn, 7, dt);

      if (mode === 'write') {
        // 右臂抬到黑板
        u.armR.pivot.rotation.x = damp(u.armR.pivot.rotation.x, -2.05, 7, dt);
        u.armR.pivot.rotation.z = damp(u.armR.pivot.rotation.z, -0.15, 7, dt);
        u.armR.elbow.rotation.x = damp(u.armR.elbow.rotation.x, 0.42, 7, dt);
        u.armR.elbow.rotation.y = Math.sin(t * 3.1) * 0.06;
        u.armL.pivot.rotation.x = damp(u.armL.pivot.rotation.x, -0.15, 5, dt);
        u.armL.elbow.rotation.x = damp(u.armL.elbow.rotation.x, 0.1, 5, dt);
        u.headGroup.rotation.x = damp(u.headGroup.rotation.x, -0.12, 5, dt);
        u.torso.rotation.y = damp(u.torso.rotation.y, 0, 6, dt);
        tState.writeT += dt;
      } else if (mode === 'stare') {
        u.armR.pivot.rotation.x = damp(u.armR.pivot.rotation.x, -0.25, 7, dt);
        u.armR.pivot.rotation.z = damp(u.armR.pivot.rotation.z, -0.42, 7, dt);
        u.armR.elbow.rotation.x = damp(u.armR.elbow.rotation.x, 0.9, 7, dt);
        u.armL.pivot.rotation.x = damp(u.armL.pivot.rotation.x, -0.25, 7, dt);
        u.armL.pivot.rotation.z = damp(u.armL.pivot.rotation.z, 0.42, 7, dt);
        u.armL.elbow.rotation.x = damp(u.armL.elbow.rotation.x, 0.9, 7, dt);
        u.headGroup.rotation.x = damp(u.headGroup.rotation.x, 0.04, 6, dt);
        u.headGroup.rotation.y = Math.sin(t * 0.45) * 0.22 + tState.headTurn;
      } else if (mode === 'eat') {
        // 把学生拎起来：双臂高举，头往后仰，张开嘴
        u.armR.pivot.rotation.x = damp(u.armR.pivot.rotation.x, -2.9, 6, dt);
        u.armR.pivot.rotation.z = damp(u.armR.pivot.rotation.z, -0.18, 6, dt);
        u.armL.pivot.rotation.x = damp(u.armL.pivot.rotation.x, -2.9, 6, dt);
        u.armL.pivot.rotation.z = damp(u.armL.pivot.rotation.z, 0.18, 6, dt);
        u.armR.elbow.rotation.x = damp(u.armR.elbow.rotation.x, 0.18, 6, dt);
        u.armL.elbow.rotation.x = damp(u.armL.elbow.rotation.x, 0.18, 6, dt);
        u.headGroup.rotation.x = damp(u.headGroup.rotation.x, -0.28, 6, dt);
        u.headGroup.rotation.y = 0;
        u.torso.rotation.x = damp(u.torso.rotation.x, -0.06, 5, dt);
        u.maw.visible = true;
        u.normalMouth.visible = false;
      } else if (mode === 'stabbed') {
        u.armR.pivot.rotation.x = damp(u.armR.pivot.rotation.x, 0.15, 6, dt);
        u.armR.pivot.rotation.z = damp(u.armR.pivot.rotation.z, -0.1, 6, dt);
        u.armL.pivot.rotation.x = damp(u.armL.pivot.rotation.x, 0.15, 6, dt);
        u.armL.pivot.rotation.z = damp(u.armL.pivot.rotation.z, 0.1, 6, dt);
        u.armR.elbow.rotation.x = damp(u.armR.elbow.rotation.x, 0.2, 6, dt);
        u.armL.elbow.rotation.x = damp(u.armL.elbow.rotation.x, 0.2, 6, dt);
        u.headGroup.rotation.x = damp(u.headGroup.rotation.x, -0.3, 6, dt);
        u.headGroup.rotation.y = 0;
        u.torso.rotation.x = damp(u.torso.rotation.x, -0.08, 5, dt);
      } else if (mode === 'walk') {
        // 手背在身后
        u.armR.pivot.rotation.x = damp(u.armR.pivot.rotation.x, 0.42, 6, dt);
        u.armL.pivot.rotation.x = damp(u.armL.pivot.rotation.x, 0.42, 6, dt);
        u.armR.pivot.rotation.z = damp(u.armR.pivot.rotation.z, -0.12, 6, dt);
        u.armL.pivot.rotation.z = damp(u.armL.pivot.rotation.z, 0.12, 6, dt);
        u.armR.elbow.rotation.x = damp(u.armR.elbow.rotation.x, 0.55, 6, dt);
        u.armL.elbow.rotation.x = damp(u.armL.elbow.rotation.x, 0.55, 6, dt);
        u.headGroup.rotation.x = 0;
      } else {
        // idle
        u.armR.pivot.rotation.x = damp(u.armR.pivot.rotation.x, -0.1, 5, dt);
        u.armR.pivot.rotation.z = damp(u.armR.pivot.rotation.z, -0.12, 5, dt);
        u.armR.elbow.rotation.x = damp(u.armR.elbow.rotation.x, 0.18, 5, dt);
        u.armL.pivot.rotation.x = damp(u.armL.pivot.rotation.x, -0.1, 5, dt);
        u.armL.pivot.rotation.z = damp(u.armL.pivot.rotation.z, 0.12, 5, dt);
        u.armL.elbow.rotation.x = damp(u.armL.elbow.rotation.x, 0.18, 5, dt);
      }

      // 呼吸
      if (!tState.moving) {
        u.torso.rotation.z = Math.sin(t * 1.1) * 0.008;
        u.headGroup.position.y = 1.66 + Math.sin(t * 1.1) * 0.004;
      } else {
        u.torso.rotation.z = 0;
      }

      // 眼睛/表情固定
      teacher.rotation.y = tState.yaw;

      if (mode !== 'eat' && mode !== 'stabbed') {
        u.maw.visible = false;
        u.normalMouth.visible = true;
        u.torso.rotation.x = damp(u.torso.rotation.x, 0, 6, dt);
      }

      // 手中的粉笔
      u.book.visible = (mode === 'stare' || mode === 'walk');
    }

    /* ---------- 相机更新 ---------- */
    function updateCamera(dt) {
      const targetPos = cam.pos.clone();
      if (cam.mode === 'seat') {
        targetPos.copy(SEAT);
        if (eating || phoneUp) {
          targetPos.y += Math.sin(bobT * 2) * 0.006;
          bobT += dt * 5;
        }
        // 咀嚼时轻微点头
        if (eating) {
          seatBob = Math.sin(bobT * 6) * 0.004;
          targetPos.y += seatBob;
        }
      }
      cam.pos.lerp(targetPos, 1 - Math.exp(-7 * dt));

      let yaw, pitch;
      if (cam.mode === 'seat') {
        yaw = lookYaw; pitch = lookPitch;
        // 呼吸
        pitch += Math.sin(t * 1.4) * 0.004;
      } else {
        yaw = cam.targetYaw; pitch = cam.targetPitch;
      }
      cam.yaw = dampAngle(cam.yaw, yaw, 14, dt);
      cam.pitch = damp(cam.pitch, pitch, 14, dt);

      camera.position.copy(cam.pos);
      camera.rotation.set(cam.pitch, cam.yaw, 0);
      if (shake > 0.0005) {
        camera.position.x += rnd(-shake, shake);
        camera.position.y += rnd(-shake, shake);
        shake *= Math.exp(-shakeDecay * dt);
      }
      cam.fov = damp(cam.fov, cam.targetFov, 5, dt);
      if (Math.abs(camera.fov - cam.fov) > 0.01) {
        camera.fov = cam.fov;
        camera.updateProjectionMatrix();
      }

      // 玩家手只在座位视角显示
      handGroup.visible = cam.mode === 'seat';
      lapGroup.visible = false;

      // 手持食物动作
      if (cam.mode === 'seat') {
        const wantUp = eating && !!currentSnackType;
        const up = wantUp ? 1 : 0;
        handFood.visible = !!currentSnackType && (eating || handFood.position.y > -0.26);
        handFood.position.x = damp(handFood.position.x, up ? 0.14 : -0.2, 12, dt);
        handFood.position.y = damp(handFood.position.y, up ? -0.15 : -0.34, 12, dt);
        handFood.position.z = up ? -0.52 : -0.44;
        if (eating) {
          bobT += dt * 5;
          handFood.position.y += Math.sin(bobT * 6) * 0.007;
          handFood.scale.setScalar(1 + Math.sin(bobT * 12) * 0.02);
        } else {
          handFood.scale.setScalar(1);
        }
        armRig.visible = !!up;
        if (up) {
          armRig.position.x = 0.21;
          armRig.position.y = -0.39 + Math.sin(bobT * 6) * 0.004;
          armRig.rotation.z = 0.6;
        }
      }
      phoneMesh.visible = false;
    }

    /* ---------- 被老师吃掉：第一人称处刑镜头 ---------- */
    function updateEatSeq(dt) {
      eatT += dt;
      const k = eatT;
      const u = teacher.userData;
      let camY, camZ;
      if (k < 0.9) {
        const a = k / 0.9;
        camY = 2.95 - a * 0.2;
        camZ = -3.2 - a * 0.05;
      } else if (k < 3.3) {
        const a = (k - 0.9) / 2.4;
        const e = a * a * (3 - 2 * a);
        camY = 2.75 - e * 0.85;
        camZ = -3.25 - e * 0.35;
      } else {
        const a = Math.min(1, (k - 3.3) / 1.3);
        const e = a * a * (3 - 2 * a);
        camY = 1.9 - e * 0.24;
        camZ = -3.6 - e * 0.36;
      }
      const sh = Math.min(1, k / 2.5);
      camera.position.set(
        0.25 + Math.sin(k * 19) * 0.01 * sh,
        camY + Math.sin(k * 23) * 0.012 * sh,
        camZ
      );
      camera.lookAt(0.25, 1.66, -4.2);
      camera.rotation.z = Math.sin(k * 9) * 0.025 * Math.min(1, k / 2);
      camera.fov = 68 + Math.min(8, k * 2);
      camera.updateProjectionMatrix();

      if (u) {
        const ms = 0.7 + Math.max(0, k - 1.2) * 0.55;
        u.maw.visible = true;
        u.normalMouth.visible = false;
        u.maw.scale.setScalar(Math.min(3.2, ms));
        u.headGroup.rotation.x = -0.3 + Math.sin(k * 2.2) * 0.02;
        u.eyeGlowL.visible = u.eyeGlowR.visible = true;
        u.faceGlow.intensity = 0.45 + Math.sin(k * 7) * 0.2;
        u.torchPivot.visible = false;
        u.torchSpot.intensity = 0;
      }
      eatLight.intensity = 1.0 + Math.sin(k * 11) * 0.35;
      shake = 0.004 + Math.min(0.03, k * 0.006);
      camera.position.x += rnd(-shake, shake);
      camera.position.y += rnd(-shake, shake);
    }

    /* ---------- 停电摸黑上讲台 ---------- */
    function updateSneakCamera(dt) {
      sneakT += dt;
      const t = sneakProgress;
      const u = 1 - t;
      const p0x = PLAYER.x, p0z = PLAYER.z + 0.42;
      const p1x = 0.55, p1z = -1.1;
      const p2x = 0.25, p2z = -4.5;
      const x = u * u * p0x + 2 * u * t * p1x + t * t * p2x;
      const z = u * u * p0z + 2 * u * t * p1z + t * t * p2z;
      const y = 1.52 + Math.sin(t * Math.PI) * 0.03 + Math.sin(sneakT * 2.2) * 0.006;
      camera.position.set(x, y, z);
      camera.lookAt(0.25, 1.28, -6.0);
      camera.rotation.z = Math.sin(sneakT * 1.7) * 0.006;
    }

    /* ---------- 反杀：把刀送进她的脖子 ---------- */
    function updateStabSeq(dt) {
      stabT += dt;
      const k = stabT;
      const u = teacher.userData;
      const pull = Math.max(0, k - 0.9);
      const sh = Math.min(0.03, k * 0.02);
      camera.position.set(
        0.25 + Math.sin(k * 31) * sh,
        1.72 + Math.sin(k * 23) * sh * 0.6,
        -3.48 - Math.min(0.55, pull * 0.35)
      );
      camera.lookAt(0.25, 1.6 - Math.min(0.5, pull * 0.45), -4.15);
      camera.rotation.z = Math.sin(k * 25) * 0.02 + Math.min(0.14, pull * 0.25);
      camera.fov = 64 + Math.min(8, pull * 10);
      camera.updateProjectionMatrix();

      if (k < 1.0) {
        const s = Math.min(1, Math.max(0, (k - 0.25) / 0.4));
        stabHand.visible = true;
        stabHand.position.set(0.3 - s * 0.7, -0.35 + s * 0.32, -0.42);
        stabHand.rotation.z = -0.9 + s * 1.9;
        stabHand.rotation.x = -0.2 + s * 0.4;
      } else {
        stabHand.visible = false;
      }

      const a = Math.min(1, Math.max(0, (k - 0.85) / 1.15));
      teacher.rotation.x = -1.3 * a;
      teacher.position.y = -0.1 * a;
      teacher.position.z = -4.35 + a * 0.45;
      u.headGroup.rotation.x = -0.3 - a * 0.35;
      u.armR.pivot.rotation.x = damp(u.armR.pivot.rotation.x, 0.1, 6, dt);
      u.armL.pivot.rotation.x = damp(u.armL.pivot.rotation.x, 0.1, 6, dt);
      if (k > 0.9) {
        u.maw.visible = false;
        u.normalMouth.visible = true;
      }
      u.eyeGlowL.visible = u.eyeGlowR.visible = k < 1.2;
      u.faceGlow.intensity = k < 1.2 ? 0.5 : 0;
      eatLight.intensity = 1.4 * (1 - Math.min(1, pull));
    }

    /* ---------- 时钟 ---------- */
    function updateClock(dt) {
      if (!lessonActive) return;
      clock.minute += dt * (45 / 100); // 100 秒一节课
      if (clock.minute >= 60) { clock.minute -= 60; clock.hour++; }
      const m = clock.minute;
      minPivot.rotation.z = -(m / 60) * Math.PI * 2;
      hourPivot.rotation.z = -((clock.hour % 12) / 12 + m / 720) * Math.PI * 2;
    }

    /* ---------- 主更新 ---------- */
    function update(dt) {
      t += dt;
      updateTeacher(dt);
      updateNPCs(dt);
      if (eatActive) updateEatSeq(dt);
      else if (stabActive) updateStabSeq(dt);
      else if (sneakActive) updateSneakCamera(dt);
      else updateCamera(dt);
      updateClock(dt);
      updateCrumbs(dt);

      // 窗帘轻摆
      for (let i = 0; i < curtains.length; i++) {
        curtains[i].rotation.y = Math.sin(t * 0.7 + i) * 0.03;
      }
      // 尘埃
      const pos = dustGeo.attributes.position;
      for (let i = 0; i < dustCount; i++) {
        pos.array[i * 3 + 1] -= dustSeed[i] * dt;
        pos.array[i * 3] += Math.sin(t * 0.3 + i) * 0.0015;
        if (pos.array[i * 3 + 1] < 0.4) pos.array[i * 3 + 1] = 3.7;
      }
      pos.needsUpdate = true;

      // 粉笔头
      for (let i = projectiles.length - 1; i >= 0; i--) {
        const p = projectiles[i];
        p.t += dt;
        const k = Math.min(1, p.t / p.dur);
        p.mesh.position.lerpVectors(p.from, p.to, k);
        p.mesh.position.y += Math.sin(k * Math.PI) * 0.25;
        p.mesh.rotation.x += dt * 20;
        if (k >= 1) {
          scene.remove(p.mesh);
          projectiles.splice(i, 1);
          if (p.onHit) p.onHit();
        }
      }

      renderer.render(scene, camera);
    }

    /* =========================================================
       对外 API
       ========================================================= */
    self.renderer = renderer;
    self.scene = scene;
    self.camera = camera;
    self.SNACKS = SNACKS;
    self.LESSONS = LESSONS;
    self.PLAYER = PLAYER;
    self.npcs = npcs;
    self.teacher = teacher;
    self.update = update;
    self.SEAT = SEAT;

    self.resize = function (w, h) {
      camera.aspect = w / Math.max(1, h);
      camera.updateProjectionMatrix();
      renderer.setSize(w, h, false);
    };

    self.setView = function (mode) {
      cam.mode = mode;
      if (mode === 'title') {
        cam.targetPos.copy(TITLE.pos);
        cam.targetYaw = TITLE.yaw; cam.targetPitch = TITLE.pitch; cam.targetFov = TITLE.fov;
      } else if (mode === 'seat') {
        cam.targetPos.copy(SEAT);
        cam.targetYaw = 0.1; cam.targetPitch = -0.05; cam.targetFov = 66;
        lookYaw = 0.1; lookPitch = -0.05;
      } else if (mode === 'punish') {
        cam.targetPos.copy(PUNISH.pos);
        cam.targetYaw = PUNISH.yaw; cam.targetPitch = PUNISH.pitch; cam.targetFov = PUNISH.fov;
      }
      handGroup.visible = mode === 'seat';
      lapGroup.visible = mode === 'seat';
    };

    self.snapView = function (mode) {
      self.setView(mode);
      if (mode === 'title') cam.pos.copy(TITLE.pos);
      else if (mode === 'seat') cam.pos.copy(SEAT);
      else if (mode === 'punish') cam.pos.copy(PUNISH.pos);
      cam.yaw = cam.targetYaw; cam.pitch = cam.targetPitch;
    };

    self.setLook = function (yaw, pitch) {
      lookYaw = yaw;
      lookPitch = pitch;
    };
    self.getLook = function () { return { yaw: lookYaw, pitch: lookPitch }; };

    self.setTeacherYaw = function (y) { tState.yaw = y; };
    self.getTeacherYaw = function () { return tState.yaw; };
    self.setTeacherMode = function (m) { tState.mode = m; };
    self.setTeacherMoving = function (m) { tState.moving = !!m; };
    self.setTeacherHeadTurn = function (a) { tState.headTurn = a; };
    self.teacherPos = function () { return teacher.position; };

    self.throwChalk = function (to, onHit) {
      const from = new T.Vector3();
      teacher.userData.armR.hand.getWorldPosition(from);
      const m = cyl(0.016, 0.016, 0.075, 0xfffdf2, 0, 0, 0, 6);
      m.position.copy(from);
      scene.add(m);
      projectiles.push({ mesh: m, from: from.clone(), to: to.clone(), t: 0, dur: 0.36, onHit });
      SFX.chalkThrow();
    };

    self.shake = function (v) { shake = v; };
    self.flash = function (v) { flashWhite = v; };

    self.setDark = function (on) {
      nightMode = !!on;
      scene.background.setHex(nightMode ? 0x05070e : 0xbfd8ef);
      scene.fog.color.setHex(nightMode ? 0x05070e : 0xcfd9e2);
      scene.fog.near = nightMode ? 5 : 26;
      scene.fog.far = nightMode ? 30 : 46;
      sun.intensity = nightMode ? 0.1 : 0.6;
      sun.color.setHex(nightMode ? 0x8fa8e0 : 0xffe6b8);
      hemi.intensity = nightMode ? 0.055 : 0.42;
      fill.intensity = nightMode ? 0.02 : 0.16;
      warm.intensity = nightMode ? 0.0 : 0.32;
      renderer.toneMappingExposure = nightMode ? 0.74 : 0.9;
      for (let i = 0; i < skyPanes.length; i++) {
        skyPanes[i].material.map = nightMode ? nightTex : skyTex;
        skyPanes[i].material.needsUpdate = true;
      }
      for (let i = 0; i < lampGlows.length; i++) {
        lampGlows[i].material.color.setHex(nightMode ? 0x1c1b16 : 0xfff6dc);
      }
      for (let i = 0; i < lampBoxes.length; i++) {
        lampBoxes[i].material.color.setHex(nightMode ? 0x5a5a52 : 0xf8f5e8);
      }
      exitSign.visible = nightMode;
      exitSignFront.visible = nightMode;
      if (dust && dust.material) dust.material.opacity = nightMode ? 0.14 : 0.5;
      applyNightToTeacher();
    };
    self.isNight = function () { return nightMode; };
    self.setClock = function (h, m) { clock.hour = h; clock.minute = m; };
    self.setTorchSweep = function (offset) {
      const u = teacher && teacher.userData;
      if (u && u.torchPivot) u.torchPivot.rotation.y = offset;
    };

    self.startEatSequence = function () {
      if (eatActive) return;
      eatActive = true;
      eatT = 0;
      eatSaved = {
        bg: scene.background.getHex(),
        fog: scene.fog.color.getHex(),
        fogNear: scene.fog.near, fogFar: scene.fog.far,
        sun: sun.intensity, hemi: hemi.intensity, warm: warm.intensity,
        exposure: renderer.toneMappingExposure,
        dark: nightMode,
        camMode: cam.mode
      };
      self.setDark(true);
      scene.background.setHex(0x040203);
      scene.fog.color.setHex(0x040203);
      scene.fog.near = 2;
      scene.fog.far = 14;
      sun.intensity = 0.05;
      hemi.intensity = 0.12;
      warm.intensity = 0;
      renderer.toneMappingExposure = 0.95;
      teacher.position.set(0.25, 0, -4.35);
      tState.mode = 'eat';
      tState.yaw = 0;
      tState.moving = false;
      tState.headTurn = 0;
      teacher.rotation.y = 0;
      const u = teacher.userData;
      u.maw.visible = true;
      u.normalMouth.visible = false;
      u.maw.scale.setScalar(0.7);
      u.eyeGlowL.visible = u.eyeGlowR.visible = true;
      u.faceGlow.intensity = 0.5;
      u.torchPivot.visible = false;
      u.torchSpot.intensity = 0;
      u.headGroup.rotation.y = 0;
      cam.mode = 'eaten';
      camera.position.set(0.25, 2.95, -3.2);
      camera.lookAt(0.25, 1.66, -4.2);
      camera.fov = 68;
      camera.updateProjectionMatrix();
      handGroup.visible = false;
      lapGroup.visible = false;
      npcFrozen = true;
      eatLight.intensity = 1.8;
    };

    self.endEatSequence = function () {
      if (!eatActive) return;
      eatActive = false;
      eatT = 0;
      eatLight.intensity = 0;
      if (eatSaved) {
        scene.background.setHex(eatSaved.bg);
        scene.fog.color.setHex(eatSaved.fog);
        scene.fog.near = eatSaved.fogNear;
        scene.fog.far = eatSaved.fogFar;
        sun.intensity = eatSaved.sun;
        hemi.intensity = eatSaved.hemi;
        warm.intensity = eatSaved.warm;
        renderer.toneMappingExposure = eatSaved.exposure;
      }
      const u = teacher && teacher.userData;
      if (u) {
        u.maw.visible = false;
        u.normalMouth.visible = true;
        u.maw.scale.setScalar(1);
        u.eyeGlowL.visible = u.eyeGlowR.visible = nightMode;
        u.faceGlow.intensity = nightMode ? 0.22 : 0;
        u.torchPivot.visible = nightMode;
        u.torchSpot.intensity = nightMode ? 4.6 : 0;
        u.torchBeam.visible = nightMode;
      }
      cam.mode = 'seat';
      camera.fov = 66;
      camera.updateProjectionMatrix();
      tState.mode = 'write';
      npcFrozen = false;
      applyNightToTeacher();
    };
    self.getEatTime = function () { return eatT; };
    self.isEatSequence = function () { return eatActive; };
    self.debugSetEatTime = function (v) { eatT = v; };

    self.startStabSequence = function () {
      if (stabActive) return;
      stabActive = true;
      stabT = 0;
      stabSaved = { dark: nightMode };
      self.setDark(true);
      scene.background.setHex(0x040203);
      scene.fog.color.setHex(0x040203);
      scene.fog.near = 2;
      scene.fog.far = 12;
      sun.intensity = 0.04;
      hemi.intensity = 0.1;
      warm.intensity = 0;
      renderer.toneMappingExposure = 0.95;
      teacher.position.set(0.25, 0, -4.35);
      teacher.rotation.x = 0;
      tState.mode = 'stabbed';
      tState.yaw = 0;
      tState.moving = false;
      tState.headTurn = 0;
      teacher.rotation.y = 0;
      const u = teacher.userData;
      u.maw.visible = true;
      u.maw.scale.setScalar(0.5);
      u.normalMouth.visible = false;
      u.eyeGlowL.visible = u.eyeGlowR.visible = true;
      u.faceGlow.intensity = 0.55;
      u.torchPivot.visible = false;
      u.torchSpot.intensity = 0;
      cam.mode = 'stabbed';
      camera.position.set(0.25, 1.72, -3.48);
      camera.lookAt(0.25, 1.66, -4.2);
      camera.fov = 64;
      camera.updateProjectionMatrix();
      handGroup.visible = false;
      lapGroup.visible = false;
      stabHand.visible = true;
      npcFrozen = true;
      eatLight.intensity = 1.4;
    };

    self.endStabSequence = function () {
      if (!stabActive) return;
      stabActive = false;
      stabT = 0;
      eatLight.intensity = 0;
      stabHand.visible = false;
      self.setDark(stabSaved ? stabSaved.dark : false);
      const u = teacher && teacher.userData;
      if (u) {
        u.maw.visible = false;
        u.normalMouth.visible = true;
        u.maw.scale.setScalar(1);
      }
      if (teacher) {
        teacher.rotation.x = 0;
        teacher.position.set(0.25, 0, -6.0);
      }
      cam.mode = 'seat';
      camera.fov = 66;
      camera.updateProjectionMatrix();
      tState.mode = 'write';
      npcFrozen = false;
      applyNightToTeacher();
    };
    self.isStabSequence = function () { return stabActive; };
    self.debugSetStabTime = function (v) { stabT = v; };

    self.startSneakSequence = function () {
      if (sneakActive) return;
      sneakActive = true;
      sneakProgress = 0;
      sneakT = 0;
      cam.mode = 'sneak';
      camera.fov = 58;
      camera.updateProjectionMatrix();
      handGroup.visible = false;
      lapGroup.visible = false;
      stabHand.visible = false;
    };
    self.setSneakProgress = function (p) {
      sneakProgress = Math.max(0, Math.min(1, p));
    };
    self.endSneakSequence = function () {
      if (!sneakActive) return;
      sneakActive = false;
      sneakProgress = 0;
      cam.mode = 'seat';
      camera.fov = 66;
      camera.updateProjectionMatrix();
    };
    self.isSneakSequence = function () { return sneakActive; };

    /* ---- 黑板 ---- */
    self.setLesson = function (id) {
      const L = LESSONS[id] || LESSONS[1];
      chalk.lesson = id;
      chalk.title = L.chalkTitle;
      chalk.lines = L.chalkLines;
      chalk.count = 0;
      chalk.items = [];
      L.chalkLines.forEach((line, i) => {
        chalk.items.push({ kind: 'line', text: line, x: 88, y: 162 + i * 53, size: i === 0 ? 38 : 34, bold: i === 0 });
      });
      drawChalk();

      // 换老师造型
      scene.remove(teacher);
      teacher = makeTeacher(L.style);
      teacher.position.set(0.2, 0, -6.0);
      teacher.rotation.y = Math.PI;
      scene.add(teacher);
      tState.mode = 'write'; tState.yaw = Math.PI; tState.moving = false;
      self.teacher = teacher;
      clock.hour = 8; clock.minute = 0;
      lessonActive = true;
      applyNightToTeacher();
      if (teacher.userData.maw) { teacher.userData.maw.visible = false; teacher.userData.normalMouth.visible = true; }
    };

    self.chalkNext = function () {
      if (chalk.count < chalk.items.length) {
        chalk.count++;
        drawChalk();
        return chalk.count >= chalk.items.length;
      }
      return true;
    };
    self.chalkProgress = function () { return chalk.count; };
    self.resetChalk = function () { chalk.count = 0; drawChalk(); };

    /* ---- 零食 ---- */
    self.setSnacks = function (list) {
      Object.keys(deskSnacks).forEach(k => {
        deskGroup.remove(deskSnacks[k]);
        deskSnacks[k].traverse(o => { if (o.isMesh) { o.geometry.dispose(); } });
        delete deskSnacks[k];
      });
      list.forEach((type, i) => {
        const m = snackMesh(type, 0.7);
        const n = list.length;
        const span = Math.min(0.44, 0.23 * (n - 1));
        m.position.set(n === 1 ? -0.05 : -span + (i / (n - 1)) * span * 2, 0.775, -0.31);
        m.rotation.y = rnd(-0.25, 0.25);
        m.userData.type = type;
        deskGroup.add(m);
        deskSnacks[type] = m;
        // 小标签
      });
      activeSnack = null;
      handFood.visible = false;
      if (handFood.children.length) {
        handFood.children.slice().forEach(c => { handFood.remove(c); });
      }
    };

    self.removeSnack = function (type) {
      const m = deskSnacks[type];
      if (m) {
        deskGroup.remove(m);
        delete deskSnacks[type];
      }
      if (currentSnackType === type) {
        handFood.visible = false;
        currentSnackType = null;
      }
    };

    const HELD_ROT = {
      spicy: [1.2, 0.25, 0.15],
      chips: [1.25, 0.2, 0.08],
      noodle: [1.15, 0.3, 0.1],
      milktea: [0.15, 0.25, 0.12],
      banana: [0.2, 0.5, 0.9],
      chicken: [-0.2, 0.3, 0.15]
    };

    self.setActiveSnack = function (type) {
      if (currentSnackType === type) return;
      currentSnackType = type;
      handFood.children.slice().forEach(c => { handFood.remove(c); });
      if (!type) { handFood.visible = false; return; }
      const m = snackMesh(type, 0.46);
      m.position.set(0, 0, 0);
      handFood.add(m);
      const r = HELD_ROT[type] || [-1.1, 0.2, 0.1];
      handFood.rotation.set(r[0], r[1], r[2]);
      handFood.position.set(-0.2, -0.34, -0.44);
      handFood.visible = false;
    };

    self.setEating = function (v) {
      if (v && !eating) { bobT = 0; }
      eating = !!v;
      if (eating) handFood.visible = true;
    };

    self.bite = function () {
      if (!currentSnackType) return;
      const col = SNACKS[currentSnackType].color.replace('#', '0x');
      makeCrumbs(4, parseInt(col, 16));
      shake = 0.002;
    };

    self.setPhone = function (v) { phoneUp = !!v; };
    self.setPhoneScreenColor = function (c) {
      if (phoneScreen && phoneScreen.material) phoneScreen.material.color.set(c);
    };

    self.setNpcFrozen = function (v) { npcFrozen = !!v; };
    self.setNpcCaught = setNpcCaught;
    self.setNpcSnitch = function (i, on) {
      const n = npcs[i];
      if (!n) return;
      n.userData.snitching = !!on;
      if (!on) {
        n.userData.armR.pivot.rotation.x = -0.95;
        n.userData.armR.pivot.rotation.z = -0.12;
        n.userData.armR.low.rotation.x = 0.65;
      }
    };

    self.showRedCard = function (visible, x, y, z) {
      if (visible) {
        redCard.visible = true;
        if (x != null) redCard.position.set(x, y, z);
      } else {
        redCard.visible = false;
      }
    };

    self.setDustVisible = function (v) { dust.visible = v; };

    self.project = function (v3) {
      const p = v3.clone().project(camera);
      return {
        x: (p.x * 0.5 + 0.5) * renderer.domElement.clientWidth,
        y: (-p.y * 0.5 + 0.5) * renderer.domElement.clientHeight,
        z: p.z,
        visible: p.z < 1 && p.z > -1
      };
    };
    self.getNpcHead = function (i) {
      const s = npcs[i];
      if (!s) return null;
      const v = new T.Vector3();
      s.userData.headGroup.getWorldPosition(v);
      v.y += 0.22;
      return v;
    };
    self.getPlayerDeskWorld = function () {
      return new T.Vector3(PLAYER.x, 0.9, PLAYER.z);
    };
    self.getTeacherHead = function () {
      const v = new T.Vector3();
      teacher.userData.headGroup.getWorldPosition(v);
      v.y += 0.25;
      return v;
    };
    self.getTeacherHand = function () {
      const v = new T.Vector3();
      teacher.userData.armR.hand.getWorldPosition(v);
      return v;
    };
    self.getTeacherForward = function () {
      return new T.Vector3(Math.sin(tState.yaw), 0, Math.cos(tState.yaw));
    };

    self.snackMesh = snackMesh;
    self.setLapVisible = function (v) { lapGroup.visible = false; };

    self.resetTeacherTransform = function () {
      teacher.position.set(0.2, 0, -6.0);
      tState.yaw = Math.PI;
      tState.mode = 'write';
      tState.moving = false;
      tState.headTurn = 0;
      teacher.rotation.y = Math.PI;
    };

    self.stats = function () {
      return { render: renderer.info.render, memory: renderer.info.memory };
    };

    self.setLesson(1);
    drawChalk();
    return self;
  }

  global.World = World;
  global.SNACK_DATA = SNACKS;
  global.LESSON_DATA = LESSONS;
})(window);

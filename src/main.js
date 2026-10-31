import * as THREE from 'three';
import LINES from './story/lines.js';
import { buildClassroom, SEATS } from './world/classroom.js';
import { makePerson } from './world/character.js';
import { ThirdPersonControls } from './systems/controls.js';
import { HUD } from './ui/hud.js';
import { GameAudio } from './audio.js';

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const smooth = (t) => t * t * (3 - 2 * t);

/* ---------------- 基础场景 ---------------- */

const canvas = document.getElementById('scene');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.05;

const scene = new THREE.Scene();
scene.background = new THREE.Color('#1b1713');

const camera = new THREE.PerspectiveCamera(55, window.innerWidth / window.innerHeight, 0.1, 120);
camera.position.set(-4.2, 1.75, 4.2);

// 光：左侧窗进来的黄昏
const hemi = new THREE.HemisphereLight('#ffe6c2', '#3d352c', 0.75);
scene.add(hemi);

const sun = new THREE.DirectionalLight('#ffd39a', 2.1);
sun.position.set(-9, 6.5, 4.5);
scene.add(sun);

const fill = new THREE.DirectionalLight('#a9b8c9', 0.35);
fill.position.set(6, 3, 8);
scene.add(fill);

const roomLight = new THREE.PointLight('#ffe2b0', 12, 14, 2);
roomLight.position.set(-3.5, 3.4, 4.5);
scene.add(roomLight);

const classroom = buildClassroom(scene);
const colliders = [...classroom.colliders];

/* ---------------- 玩家（张知安） ---------------- */

const PLAYER_LOOK = {
  shirt: '#efece4',
  lower: '#252d3d',
  hair: '#15120e',
  skin: '#f2d6bf',
  accent: '#cfd6de',
  longHair: true,
  headphones: true,
  backpack: true
};

let player = makePerson(PLAYER_LOOK);
player.position.set(-4.4, 0, 1.15);
scene.add(player);

/* ---------------- 状态 ---------------- */

const state = {
  phase: 'boot',
  aura: 0,
  flags: { b1: false, b2: false, b3: false, sat: false },
  promptAction: null
};

const hud = new HUD();
const audio = new GameAudio();
const controls = new ThirdPersonControls({ camera, player, colliders, dom: canvas });

const INTRO_KEYS = [
  { t: 0.0, pos: [-4.3, 1.82, 4.35], look: [-5.25, 1.15, 3.35] },
  { t: 8.0, pos: [-3.6, 1.86, 5.30], look: [-0.2, 1.15, 4.60] },
  { t: 15.5, pos: [2.30, 1.62, 7.85], look: [4.70, 0.95, 9.00] },
  { t: 21.0, pos: [-3.55, 1.78, 1.05], look: [-0.6, 1.25, 4.30] },
  { t: 24.0, pos: [-3.55, 1.78, 1.05], look: [-0.6, 1.25, 4.30] }
];

let introT = 0;
const narrationFired = new Set();
const clock = new THREE.Clock();
let elapsed = 0;

/* ---------------- 小工具 ---------------- */

async function applyAura(delta) {
  state.aura += delta;
  hud.flashAura(delta);
}

function addBlocker(minX, maxX, minZ, maxZ, tag) {
  const c = { minX, maxX, minZ, maxZ, tag };
  colliders.push(c);
  return c;
}

function removeBlocker(c) {
  const i = colliders.indexOf(c);
  if (i >= 0) colliders.splice(i, 1);
}

function near(x, z, dist) {
  return Math.hypot(player.position.x - x, player.position.z - z) < dist;
}

async function shakeCamera(times = 5, amp = 0.05) {
  const base = camera.position.clone();
  for (let i = 0; i < times; i++) {
    camera.position.set(
      base.x + (Math.random() - 0.5) * amp * 2,
      base.y + (Math.random() - 0.5) * amp,
      base.z
    );
    await sleep(55);
  }
  camera.position.copy(base);
}

/* ---------------- 开场 ---------------- */

function startIntro() {
  state.phase = 'intro';
  introT = 0;
  narrationFired.clear();
  hud.fade(true);
  setTimeout(() => {
    hud.fade(false);
    hud.showSkip(true);
  }, 620);
}

function sampleIntro(t) {
  let a = INTRO_KEYS[0];
  let b = INTRO_KEYS[INTRO_KEYS.length - 1];
  for (let i = 0; i < INTRO_KEYS.length - 1; i++) {
    if (t >= INTRO_KEYS[i].t && t <= INTRO_KEYS[i + 1].t) {
      a = INTRO_KEYS[i];
      b = INTRO_KEYS[i + 1];
      break;
    }
  }
  const span = Math.max(0.001, b.t - a.t);
  const u = smooth(Math.min(1, Math.max(0, (t - a.t) / span)));
  const p = new THREE.Vector3(
    a.pos[0] + (b.pos[0] - a.pos[0]) * u,
    a.pos[1] + (b.pos[1] - a.pos[1]) * u,
    a.pos[2] + (b.pos[2] - a.pos[2]) * u
  );
  const l = new THREE.Vector3(
    a.look[0] + (b.look[0] - a.look[0]) * u,
    a.look[1] + (b.look[1] - a.look[1]) * u,
    a.look[2] + (b.look[2] - a.look[2]) * u
  );
  return { p, l };
}

function updateIntro(dt) {
  introT += dt;

  const { p, l } = sampleIntro(Math.min(introT, LINES.intro.duration));
  camera.position.copy(p);
  camera.lookAt(l);

  LINES.intro.narration.forEach((n, i) => {
    if (introT >= n.at && !narrationFired.has(i)) {
      narrationFired.add(i);
      hud.sayAndWait(n.text, '', 1400, 26);
    }
  });

  if (introT >= LINES.intro.duration) endIntro();
}

async function endIntro() {
  if (state.phase !== 'intro') return;
  state.phase = 'boot';
  hud.showSkip(false);
  hud.hideSubtitle();
  hud.fade(true);
  await sleep(700);
  controls.snapCamera();
  hud.fade(false);
  state.phase = 'play';
  hud.setTask(LINES.task.find);
}

document.getElementById('skip').addEventListener('click', () => {
  if (state.phase === 'intro') endIntro();
});

/* ---------------- 障碍 1 · 黑板擦闪避 ---------------- */

let block2 = null;
let eraserMesh = null;

function spawnEraser() {
  const m = new THREE.Mesh(
    new THREE.BoxGeometry(0.16, 0.06, 0.11),
    new THREE.MeshStandardMaterial({ color: '#e8e4da', roughness: 0.8, flatShading: true })
  );
  m.position.set(
    player.position.x - 1.15,
    player.position.y + 0.12,
    player.position.z - 1.75
  );
  scene.add(m);
  eraserMesh = m;
  return m;
}

async function obstacle1() {
  state.phase = 'qte';
  state.flags.b1 = true;
  hud.hidePrompt();

  const ok = await hud.runQTE(LINES.obstacle1.prompt, LINES.obstacle1.window, 'KeyA', 'A');
  const res = ok ? LINES.obstacle1.success : LINES.obstacle1.fail;

  // 黑板擦飞行：前 0.6 秒逼近，之后命中或擦过
  const e = spawnEraser();
  const start = e.position.clone();
  const target = player.position.clone().add(new THREE.Vector3(0, 1.35, 0));

  for (let i = 1; i <= 6; i++) {
    e.position.lerpVectors(start, target, (i / 6) * 0.62);
    await sleep(95);
  }

  if (ok) {
    // 擦着发丝飞过，砸向身后
    const past = target.clone().add(new THREE.Vector3(0.5, 0.02, 3.1));
    for (let i = 1; i <= 5; i++) {
      e.position.lerpVectors(target, past, i / 5);
      await sleep(65);
    }
    audio.thud();
    await applyAura(res.aura);
    await hud.say(res.reply, '', 30);
    await sleep(250);
    await kaiseonGlance();
  } else {
    audio.thud();
    e.visible = false;
    await applyAura(res.aura);
    await shakeCamera(5, 0.06);
    dropBook();
    audio.laugh();
    await hud.say(res.reply, '', 30);
    await sleep(400);
  }

  e.visible = false;
  hud.hideSubtitle();
  state.phase = 'play';
}

async function kaiseonGlance() {
  const prev = state.phase;
  state.phase = 'cutscene';
  const head = classroom.npcs.kaiseon?.userData?.head;
  camera.position.set(-3.05, 1.62, 3.62);
  camera.lookAt(-4.80, 1.52, 2.80);
  if (head) head.rotation.y = 0.6;
  audio.blip();
  await sleep(700);
  if (head) head.rotation.y = 0;
  controls.snapCamera();
  state.phase = prev;
}

let bookMesh = null;

function dropBook() {
  if (bookMesh) return;
  const mat = new THREE.MeshStandardMaterial({ color: '#3a4a63', roughness: 0.9, flatShading: true });
  bookMesh = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.05, 0.26), mat);
  bookMesh.position.set(player.position.x + 0.25, 0.04, player.position.z + 0.3);
  bookMesh.rotation.y = 0.6;
  scene.add(bookMesh);
}

/* ---------------- 障碍 2 · 纸团清理 ---------------- */

async function obstacle2() {
  state.phase = 'qte';
  state.flags.b2 = true;
  hud.hidePrompt();

  const ok = await hud.runQTE(LINES.obstacle2.prompt, LINES.obstacle2.window, 'KeyE', 'E');
  const res = ok ? LINES.obstacle2.success : LINES.obstacle2.fail;

  await applyAura(res.aura);
  if (ok) {
    audio.tsk();
    classroom.props.paperPile.visible = false;
  } else {
    audio.laugh();
  }

  await hud.say(res.reply, '', 30);
  await sleep(300);
  hud.hideSubtitle();

  if (block2) removeBlocker(block2);
  block2 = null;
  state.phase = 'play';
}

/* ---------------- 障碍 3 · 搭讪邀坐 ---------------- */

async function obstacle3() {
  state.phase = 'dialogue';
  state.flags.b3 = true;
  hud.hidePrompt();

  await hud.sayAndWait(LINES.obstacle3.line, LINES.obstacle3.speaker, 350, 28);
  const choice = await hud.choose(LINES.obstacle3.choices);
  audio.blip();
  await applyAura(choice.aura);

  if (choice.effect === 'b3_good') {
    audio.tsk();
    const head = classroom.npcs.obstacle3?.userData?.head;
    if (head) head.rotation.y = -0.4;
  } else {
    audio.laugh();
    await shakeCamera(4, 0.04);
  }

  await hud.say(choice.reply, '', 28);
  await sleep(320);
  hud.hideSubtitle();
  state.phase = 'play';
}

/* ---------------- 结局 ---------------- */

async function successEnding() {
  state.phase = 'ending';
  state.flags.sat = true;
  hud.hidePrompt();
  hud.hideSubtitle();

  hud.fade(true);
  await sleep(520);

  scene.remove(player);
  player = makePerson({ ...PLAYER_LOOK, pose: 'sit' });
  player.position.set(SEATS.target.x, 0, SEATS.target.z + 0.46);
  player.rotation.y = Math.PI;
  scene.add(player);

  camera.position.set(3.05, 1.72, 7.35);
  camera.lookAt(SEATS.target.x, 1.05, SEATS.target.z);
  hud.fade(false);
  await sleep(420);

  await hud.say(LINES.ending.success.os, '内心', 22);
  await sleep(900);

  // 切到窗边：权时宪第一次回头
  camera.position.set(-2.95, 1.66, 4.62);
  camera.lookAt(SEATS.kaiseon.x, 1.45, SEATS.kaiseon.z + 0.5);
  const head = classroom.npcs.kaiseon?.userData?.head;
  if (head) head.rotation.y = 0.45;
  audio.sting();
  await sleep(1600);

  hud.hideSubtitle();
  hud.showCard({
    kicker: LINES.ending.success.kicker,
    title: LINES.ending.success.title,
    sub: LINES.ending.success.sub
  });
  state.phase = 'done';
}

async function failEnding() {
  state.phase = 'ending';
  hud.hidePrompt();
  hud.hideSubtitle();

  audio.bell();
  await shakeCamera(4, 0.035);
  await sleep(500);

  await hud.say(LINES.ending.fail.os, '内心', 20);
  await sleep(900);
  hud.hideSubtitle();
  hud.showCard({
    kicker: LINES.ending.fail.kicker,
    title: LINES.ending.fail.title,
    sub: LINES.ending.fail.sub
  });
  state.phase = 'done';
}

/* ---------------- 交互 ---------------- */

window.addEventListener('keydown', (e) => {
  if (e.code === 'KeyR') location.reload();
  if (e.code === 'Backquote') hud.toggleDebug();

  if (e.code === 'KeyE' && state.phase === 'play') {
    if (state.promptAction === 'pickup' && bookMesh && near(bookMesh.position.x, bookMesh.position.z, 1.3)) {
      scene.remove(bookMesh);
      bookMesh = null;
      state.promptAction = null;
      hud.hidePrompt();
      audio.paper();
      hud.setTask(LINES.task.find);
    } else if (state.promptAction === 'sit' && near(SEATS.target.x, SEATS.target.z + 0.46, 1.5)) {
      successEnding();
    }
  }
});

document.getElementById('btn-start').addEventListener('click', () => {
  audio.start();
  hud.hideStart();
  startIntro();
});

document.getElementById('btn-restart').addEventListener('click', () => location.reload());

/* ---------------- 主循环 ---------------- */

// 纸团暂时堵住后排通路（障碍 2 解决后移除）
block2 = addBlocker(-1.05, 1.05, 7.56, 8.30, 'block2');

function updatePlay() {
  const p = player.position;

  // 障碍 1：第三排中段，黑板擦从盲区袭来
  if (!state.flags.b1 && p.z > 4.70 && p.z < 5.32 && Math.abs(p.x) < 1.15) {
    obstacle1();
    return;
  }

  // 障碍 2：后排过道，纸团堵路
  if (state.flags.b1 && !state.flags.b2 && p.z > 6.85 && p.z < 7.52 && Math.abs(p.x) < 1.05) {
    obstacle2();
    return;
  }

  // 障碍 3：抵达目标座位旁
  if (state.flags.b2 && !state.flags.b3 && p.x > 2.05 && p.z > 7.30) {
    obstacle3();
    return;
  }

  if (state.phase !== 'play') return;

  // 捡书
  if (bookMesh && near(bookMesh.position.x, bookMesh.position.z, 1.3)) {
    state.promptAction = 'pickup';
    hud.showPrompt(LINES.task.pickup);
    return;
  }

  // 坐下（只在气场值达标时开放）
  if (
    state.flags.b3 &&
    !state.flags.sat &&
    state.aura >= LINES.meta.threshold &&
    near(SEATS.target.x, SEATS.target.z + 0.46, 1.45)
  ) {
    state.promptAction = 'sit';
    hud.showPrompt(LINES.task.sit);
    return;
  }

  // 气场值不足且走完三关 → 失败结局
  if (state.flags.b3 && !state.flags.sat && state.aura < LINES.meta.threshold && p.x > 3.4 && p.z > 7.30) {
    failEnding();
    return;
  }

  if (state.promptAction) {
    state.promptAction = null;
    hud.hidePrompt();
  }
}

let debugTimer = 0;

function animate() {
  requestAnimationFrame(animate);
  const dt = Math.min(clock.getDelta(), 0.05);
  elapsed += dt;

  if (state.phase === 'intro') {
    updateIntro(dt);
  } else if (state.phase === 'play') {
    controls.update(dt);
    updatePlay();
  }

  roomLight.intensity = 11.5 + Math.sin(elapsed * 0.7) * 0.5;

  if (!hud.$debug.classList.contains('hidden')) {
    debugTimer += dt;
    if (debugTimer > 0.1) {
      debugTimer = 0;
      hud.debug(
        `phase: ${state.phase}\naura: ${state.aura} (need >= ${LINES.meta.threshold})\npos: ${player.position.x.toFixed(2)}, ${player.position.z.toFixed(2)}\nflags: ${JSON.stringify(state.flags)}`
      );
    }
  }

  renderer.render(scene, camera);
}

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

// 开发模式：?skipIntro 直接进游戏；?intro 自动播放开场（调镜头用）
const devParams = new URLSearchParams(location.search);
if (devParams.has('skipIntro')) {
  hud.hideStart();
  hud.fade(true);
  setTimeout(() => {
    controls.snapCamera();
    hud.fade(false);
    state.phase = 'play';
    hud.setTask(LINES.task.find);
  }, 300);
} else if (devParams.has('intro')) {
  hud.hideStart();
  startIntro();
}

animate();

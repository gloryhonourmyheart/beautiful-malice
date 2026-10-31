import * as THREE from 'three';
import { makePerson, makeDesk, makeChair } from './character.js';

export const ROOM = { minX: -6, maxX: 6, minZ: -2, maxZ: 10, height: 4.2 };

export const GRID = {
  cols: [-4.8, -3.0, -1.2, 1.2, 3.0, 4.8],
  rows: [2.3, 3.8, 5.3, 6.8, 8.75]
};

export const SEATS = {
  kaiseon: { x: -4.8, z: 2.3 },
  emptyLeather: { x: -5.35, z: 3.6 },
  obstacle1: { x: -1.2, z: 3.8 },
  obstacle2: { x: 1.2, z: 8.75 },
  obstacle3: { x: 3.0, z: 8.75 },
  target: { x: 4.8, z: 8.75 }
};

const flat = (color, opts = {}) =>
  new THREE.MeshStandardMaterial({ color, roughness: 0.95, metalness: 0.0, flatShading: true, ...opts });

function plane(w, h, color, rotX = 0) {
  const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), flat(color, { side: THREE.DoubleSide }));
  m.rotation.x = rotX;
  return m;
}

function boxMesh(w, h, d, color) {
  return new THREE.Mesh(new THREE.BoxGeometry(w, h, d), flat(color));
}

export function buildClassroom(scene) {
  const group = new THREE.Group();
  scene.add(group);

  const colliders = [];
  const addCollider = (minX, maxX, minZ, maxZ, tag = '') =>
    colliders.push({ minX, maxX, minZ, maxZ, tag });

  const W = ROOM.maxX - ROOM.minX;
  const D = ROOM.maxZ - ROOM.minZ;
  const cx = (ROOM.minX + ROOM.maxX) / 2;
  const cz = (ROOM.minZ + ROOM.maxZ) / 2;

  // 地面
  const floor = plane(W, D, '#7d6a55', -Math.PI / 2);
  floor.position.set(cx, 0, cz);
  group.add(floor);

  // 天花
  const ceil = plane(W, D, '#c9c2b4', Math.PI / 2);
  ceil.position.set(cx, ROOM.height, cz);
  group.add(ceil);

  // 墙
  const wallMat = '#ded6c4';
  const backWall = boxMesh(W, ROOM.height, 0.2, wallMat);
  backWall.position.set(cx, ROOM.height / 2, ROOM.maxZ);
  group.add(backWall);
  addCollider(ROOM.minX, ROOM.maxX, ROOM.maxZ - 0.3, ROOM.maxZ + 0.4, 'wall-back');

  const frontWall = boxMesh(W, ROOM.height, 0.2, wallMat);
  frontWall.position.set(cx, ROOM.height / 2, ROOM.minZ);
  group.add(frontWall);
  addCollider(ROOM.minX, ROOM.maxX, ROOM.minZ - 0.4, ROOM.minZ + 0.3, 'wall-front');

  // 左墙（窗）
  const leftWall = boxMesh(0.2, ROOM.height, D, wallMat);
  leftWall.position.set(ROOM.minX, ROOM.height / 2, cz);
  group.add(leftWall);
  addCollider(ROOM.minX - 0.4, ROOM.minX + 0.3, ROOM.minZ, ROOM.maxZ, 'wall-left');

  // 右墙
  const rightWall = boxMesh(0.2, ROOM.height, D, '#d6cebc');
  rightWall.position.set(ROOM.maxX, ROOM.height / 2, cz);
  group.add(rightWall);
  addCollider(ROOM.maxX - 0.3, ROOM.maxX + 0.4, ROOM.minZ, ROOM.maxZ, 'wall-right');

  // 窗：三块发光面 + 窗框
  const glowMat = new THREE.MeshBasicMaterial({ color: '#ffe4b8' });
  [-0.6, 3.0, 6.6].forEach((z) => {
    const pane = new THREE.Mesh(new THREE.PlaneGeometry(1.9, 1.7), glowMat);
    pane.rotation.y = Math.PI / 2;
    pane.position.set(ROOM.minX + 0.11, 2.35, z);
    group.add(pane);

    const frameMat = flat('#b9ae99');
    const top = boxMesh(0.12, 0.08, 2.0, frameMat);
    top.position.set(ROOM.minX + 0.16, 3.22, z);
    group.add(top);
    const bottom = top.clone();
    bottom.position.y = 1.48;
    group.add(bottom);
    const mid = boxMesh(0.12, 1.7, 0.06, frameMat);
    mid.position.set(ROOM.minX + 0.16, 2.35, z);
    group.add(mid);
  });

  // 黑板 + 讲台
  const board = boxMesh(7.2, 2.2, 0.08, '#2c3a33');
  board.position.set(0.5, 2.3, ROOM.minZ + 0.16);
  group.add(board);
  const boardFrame = boxMesh(7.5, 2.45, 0.05, '#6d5a41');
  boardFrame.position.set(0.5, 2.3, ROOM.minZ + 0.12);
  group.add(boardFrame);

  const podium = boxMesh(1.5, 1.0, 0.62, '#8a7358');
  podium.position.set(-2.6, 0.5, ROOM.minZ + 1.1);
  group.add(podium);
  addCollider(-3.4, -1.8, ROOM.minZ + 0.75, ROOM.minZ + 1.45, 'podium');

  // 课桌 + 椅子 + 同学
  const npcColors = [
    { shirt: '#d9d3c6', hair: '#1b1712' },
    { shirt: '#c9c3b4', hair: '#241c14' },
    { shirt: '#3a3f4a', hair: '#171410' },
    { shirt: '#e2ddd2', hair: '#2a1f16' },
    { shirt: '#4a4238', hair: '#100e0b' }
  ];

  const npcs = {};
  let colorIdx = 0;

  GRID.rows.forEach((z, rowIdx) => {
    GRID.cols.forEach((x, colIdx) => {
      const isTarget = Math.abs(x - SEATS.target.x) < 0.01 && Math.abs(z - SEATS.target.z) < 0.01;
      const desk = makeDesk({ graffiti: isTarget || rowIdx === 4 });
      desk.position.set(x, 0, z);
      group.add(desk);

      // 椅子（学生面向黑板 -Z）
      const chair = makeChair({ color: rowIdx === 0 && colIdx === 0 ? '#4a3527' : '#8d6a4a' });
      chair.position.set(x, 0, z + 0.46);
      group.add(chair);

      addCollider(x - 0.55, x + 0.55, z - 0.36, z + 0.66, 'desk');

      if (isTarget) return;

      // 特殊角色
      let pose = 'sit';
      const c = npcColors[colorIdx++ % npcColors.length];
      let person;

      if (Math.abs(x - SEATS.kaiseon.x) < 0.01 && Math.abs(z - SEATS.kaiseon.z) < 0.01) {
        person = makePerson({ shirt: '#1d2433', lower: '#171c27', hair: '#0f0d0b', pose: 'sit' });
        npcs.kaiseon = person;
      } else if (Math.abs(x - SEATS.obstacle1.x) < 0.01 && Math.abs(z - SEATS.obstacle1.z) < 0.01) {
        person = makePerson({ shirt: '#c9c3b4', lower: '#2f3340', hair: '#191512', pose: 'sit' });
        npcs.obstacle1 = person;
      } else if (Math.abs(x - SEATS.obstacle2.x) < 0.01 && Math.abs(z - SEATS.obstacle2.z) < 0.01) {
        person = makePerson({ shirt: '#4a4238', lower: '#23201b', hair: '#100e0b', pose: 'sit' });
        npcs.obstacle2 = person;
      } else if (Math.abs(x - SEATS.obstacle3.x) < 0.01 && Math.abs(z - SEATS.obstacle3.z) < 0.01) {
        person = makePerson({ shirt: '#2f3a33', lower: '#1d241f', hair: '#c8a45a', pose: 'sit' });
        npcs.obstacle3 = person;
      } else {
        person = makePerson({ shirt: c.shirt, hair: c.hair, lower: '#2c2f38', pose });
      }

      person.position.set(x, 0, z + 0.5);
      person.rotation.y = Math.PI;
      group.add(person);
    });
  });

  // 靠窗的空置皮椅（顶层专属位）+ 金属水杯
  const leather = boxMesh(0.62, 0.14, 0.58, '#3f2a1e');
  leather.position.set(SEATS.emptyLeather.x, 0.52, SEATS.emptyLeather.z);
  group.add(leather);
  const leatherBack = boxMesh(0.62, 0.62, 0.14, '#3f2a1e');
  leatherBack.position.set(SEATS.emptyLeather.x, 0.86, SEATS.emptyLeather.z - 0.26);
  group.add(leatherBack);
  const leatherBase = boxMesh(0.5, 0.44, 0.5, '#5b4636');
  leatherBase.position.set(SEATS.emptyLeather.x, 0.24, SEATS.emptyLeather.z);
  group.add(leatherBase);

  const sideTable = boxMesh(0.5, 0.04, 0.5, '#6d5a41');
  sideTable.position.set(SEATS.emptyLeather.x + 0.02, 0.66, SEATS.emptyLeather.z + 0.72);
  group.add(sideTable);
  const cup = new THREE.Mesh(
    new THREE.CylinderGeometry(0.055, 0.05, 0.13, 10),
    flat('#c9c3a4', { metalness: 0.6, roughness: 0.35 })
  );
  cup.position.set(SEATS.emptyLeather.x + 0.02, 0.75, SEATS.emptyLeather.z + 0.72);
  group.add(cup);
  addCollider(SEATS.emptyLeather.x - 0.35, SEATS.emptyLeather.x + 0.35,
    SEATS.emptyLeather.z - 0.35, SEATS.emptyLeather.z + 0.95, 'leather');

  // 障碍 1：横在过道上的腿
  const legBlock = new THREE.Group();
  const legMat = flat('#2f3340');
  const thigh = boxMesh(0.9, 0.13, 0.14, legMat);
  thigh.position.set(-0.6, 0.78, 0);
  legBlock.add(thigh);
  const shin = boxMesh(0.14, 0.13, 0.34, legMat);
  shin.position.set(-1.0, 0.78, 0.16);
  legBlock.add(shin);
  const shoe = boxMesh(0.16, 0.09, 0.24, flat('#15130f'));
  shoe.position.set(-1.0, 0.76, 0.30);
  legBlock.add(shoe);
  legBlock.position.set(0.35, 0, 3.82);
  group.add(legBlock);

  // 障碍 2：纸团 + 倒扣的练习册
  const paperPile = new THREE.Group();
  const paperMat = flat('#e6e0d2');
  [[0, 0.06, 0], [0.28, 0.05, 0.18], [-0.24, 0.05, 0.22], [0.1, 0.06, -0.22]].forEach(([x, y, z], i) => {
    const ball = new THREE.Mesh(new THREE.IcosahedronGeometry(0.075, 0), paperMat);
    ball.position.set(x, y, z);
    ball.rotation.set(i, i * 2, i * 3);
    paperPile.add(ball);
  });
  const book = boxMesh(0.36, 0.05, 0.26, flat('#3a4a63'));
  book.position.set(-0.1, 0.03, -0.02);
  book.rotation.y = 0.4;
  paperPile.add(book);
  paperPile.position.set(0, 0, 7.95);
  group.add(paperPile);

  // 垃圾桶
  const bin = new THREE.Mesh(
    new THREE.CylinderGeometry(0.20, 0.17, 0.42, 12),
    flat('#5d6b5f')
  );
  bin.position.set(0, 0.21, 9.55);
  group.add(bin);

  return {
    group,
    colliders,
    addCollider,
    npcs,
    props: { legBlock, paperPile, bin, leather, cup }
  };
}

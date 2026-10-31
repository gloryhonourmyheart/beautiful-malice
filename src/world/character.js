import * as THREE from 'three';

const mat = (color, flat = true) =>
  new THREE.MeshStandardMaterial({ color, roughness: 0.92, metalness: 0.02, flatShading: flat });

function box(w, h, d, material) {
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), material);
  return m;
}

/**
 * 程序化低多边形人物。朝向 +Z。
 * pose: 'stand' | 'sit'
 */
export function makePerson({
  shirt = '#e8e6e1',
  lower = '#2b3446',
  hair = '#16130f',
  skin = '#f0d3bd',
  accent = null,
  pose = 'stand',
  longHair = false,
  headphones = false,
  backpack = false
} = {}) {
  const g = new THREE.Group();
  const mShirt = mat(shirt);
  const mLower = mat(lower);
  const mHair = mat(hair);
  const mSkin = mat(skin);

  const hipY = pose === 'sit' ? 0.47 : 0.86;

  // 躯干
  const torso = box(0.40, 0.52, 0.22, mShirt);
  torso.position.y = hipY + 0.26;
  g.add(torso);

  // 肩
  const shoulder = box(0.44, 0.10, 0.24, mShirt);
  shoulder.position.y = hipY + 0.50;
  g.add(shoulder);

  // 脖子
  const neck = box(0.10, 0.06, 0.10, mSkin);
  neck.position.y = hipY + 0.57;
  g.add(neck);

  // 头
  const head = new THREE.Group();
  head.position.y = hipY + 0.68;
  const skull = box(0.22, 0.26, 0.22, mSkin);
  head.add(skull);
  const hairTop = box(0.235, 0.10, 0.235, mHair);
  hairTop.position.y = 0.075;
  head.add(hairTop);
  if (longHair) {
    const back = box(0.19, 0.30, 0.07, mHair);
    back.position.set(0, -0.10, -0.115);
    head.add(back);
  }
  g.add(head);

  if (accent) {
    const pin = box(0.05, 0.02, 0.02, mat(accent, false));
    pin.position.set(0.09, 0.04, 0.12);
    head.add(pin);
  }

  // 蓝牙耳机（双耳）
  if (headphones) {
    const hpMat = mat('#232830', false);
    const hpL = box(0.035, 0.075, 0.055, hpMat);
    hpL.position.set(-0.125, -0.02, 0);
    head.add(hpL);
    const hpR = box(0.035, 0.075, 0.055, hpMat);
    hpR.position.set(0.125, -0.02, 0);
    head.add(hpR);
  }

  // 书包（背在身后 -Z）
  if (backpack) {
    const bp = box(0.32, 0.40, 0.15, mat('#39404d'));
    bp.position.set(0, hipY + 0.24, -0.20);
    g.add(bp);
    const strap = box(0.30, 0.04, 0.16, mat('#2b303a'));
    strap.position.set(0, hipY + 0.46, -0.14);
    g.add(strap);
  }

  // 手臂
  const armL = box(0.10, 0.46, 0.11, mShirt);
  const armR = box(0.10, 0.46, 0.11, mShirt);
  const armY = hipY + 0.26;
  if (pose === 'sit') {
    armL.position.set(-0.245, armY - 0.06, 0.03);
    armR.position.set(0.245, armY - 0.06, 0.03);
    armL.rotation.x = -0.35;
    armR.rotation.x = -0.35;
  } else {
    armL.position.set(-0.245, armY, 0);
    armR.position.set(0.245, armY, 0);
  }
  g.add(armL, armR);

  if (pose === 'sit') {
    // 大腿向前，小腿向下
    const thighD = 0.40;
    const thighL = box(0.13, 0.13, thighD, mLower);
    const thighR = box(0.13, 0.13, thighD, mLower);
    thighL.position.set(-0.10, 0.46, 0.20);
    thighR.position.set(0.10, 0.46, 0.20);
    g.add(thighL, thighR);

    const shinL = box(0.12, 0.42, 0.12, mLower);
    const shinR = box(0.12, 0.42, 0.12, mLower);
    shinL.position.set(-0.10, 0.25, 0.38);
    shinR.position.set(0.10, 0.25, 0.38);
    g.add(shinL, shinR);
  } else {
    const legL = box(0.13, 0.84, 0.14, mLower);
    const legR = box(0.13, 0.84, 0.14, mLower);
    legL.position.set(-0.10, 0.42, 0);
    legR.position.set(0.10, 0.42, 0);
    g.add(legL, legR);
  }

  g.userData.head = head;
  g.userData.torso = torso;
  return g;
}

export function makeDesk({ topColor = '#a98a63', graffiti = false } = {}) {
  const g = new THREE.Group();
  const top = box(1.02, 0.05, 0.62, mat(topColor));
  top.position.y = 0.74;
  g.add(top);

  const legMat = mat('#7d7a72');
  const legGeo = [0.05, 0.72, 0.05];
  const offs = [
    [-0.44, -0.24], [0.44, -0.24], [-0.44, 0.24], [0.44, 0.24]
  ];
  offs.forEach(([x, z]) => {
    const l = box(legGeo[0], legGeo[1], legGeo[2], legMat);
    l.position.set(x, 0.36, z);
    g.add(l);
  });

  if (graffiti) {
    const gMat = mat('#3b3229');
    for (let i = 0; i < 5; i++) {
      const mark = box(0.02 + Math.random() * 0.16, 0.004, 0.012, gMat);
      mark.position.set(-0.35 + Math.random() * 0.7, 0.768, -0.2 + Math.random() * 0.4);
      mark.rotation.y = Math.random() * Math.PI;
      g.add(mark);
    }
  }
  return g;
}

export function makeChair({ color = '#8d6a4a' } = {}) {
  const g = new THREE.Group();
  const seat = box(0.46, 0.05, 0.44, mat(color));
  seat.position.y = 0.45;
  g.add(seat);
  const back = box(0.46, 0.44, 0.05, mat(color));
  back.position.set(0, 0.68, -0.20);
  g.add(back);
  const legMat = mat('#5b564e');
  [[-0.19, -0.17], [0.19, -0.17], [-0.19, 0.17], [0.19, 0.17]].forEach(([x, z]) => {
    const l = box(0.04, 0.44, 0.04, legMat);
    l.position.set(x, 0.22, z);
    g.add(l);
  });
  return g;
}

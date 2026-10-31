import * as THREE from 'three';

const SPEED = 1.62;        // 米/秒，教室要慢
const RADIUS = 0.30;       // 玩家碰撞半径
const CAM_DIST = 2.95;
const CAM_HEIGHT = 1.18;

export class ThirdPersonControls {
  constructor({ camera, player, colliders, dom }) {
    this.camera = camera;
    this.player = player;
    this.colliders = colliders;
    this.dom = dom;

    this.yaw = Math.PI;
    this.pitch = 0.14;
    this.keys = new Set();
    this.dragging = false;
    this.lastX = 0;
    this.lastY = 0;
    this.enabled = false;
    this.velocity = new THREE.Vector3();

    this._camPos = new THREE.Vector3();
    this._lookAt = new THREE.Vector3();

    this._bind();
    this.snapCamera();
  }

  _bind() {
    window.addEventListener('keydown', (e) => {
      this.keys.add(e.code);
    });
    window.addEventListener('keyup', (e) => {
      this.keys.delete(e.code);
    });
    window.addEventListener('blur', () => this.keys.clear());

    this.dom.addEventListener('pointerdown', (e) => {
      if (!this.enabled) return;
      this.dragging = true;
      this.lastX = e.clientX;
      this.lastY = e.clientY;
      this.dom.setPointerCapture(e.pointerId);
    });
    this.dom.addEventListener('pointerup', (e) => {
      this.dragging = false;
      try { this.dom.releasePointerCapture(e.pointerId); } catch (_) {}
    });
    this.dom.addEventListener('pointermove', (e) => {
      if (!this.dragging || !this.enabled) return;
      const dx = e.clientX - this.lastX;
      const dy = e.clientY - this.lastY;
      this.lastX = e.clientX;
      this.lastY = e.clientY;
      this.yaw -= dx * 0.0045;
      this.pitch = Math.max(-0.15, Math.min(0.72, this.pitch + dy * 0.0035));
    });
  }

  setColliders(list) {
    this.colliders = list;
  }

  snapCamera() {
    this._computeCamera(true);
  }

  _computeCamera(snap = false) {
    const p = this.player.position;
    const cosP = Math.cos(this.pitch);
    const ox = Math.sin(this.yaw) * cosP * CAM_DIST;
    const oz = Math.cos(this.yaw) * cosP * CAM_DIST;
    const oy = CAM_HEIGHT + Math.sin(this.pitch) * CAM_DIST;

    this._camPos.set(p.x + ox, oy, p.z + oz);
    this._lookAt.set(p.x, 1.15, p.z);

    if (snap) {
      this.camera.position.copy(this._camPos);
    } else {
      this.camera.position.lerp(this._camPos, 0.18);
    }
    this.camera.lookAt(this._lookAt);
  }

  _blocked(x, z, c) {
    return x + RADIUS > c.minX && x - RADIUS < c.maxX && z + RADIUS > c.minZ && z - RADIUS < c.maxZ;
  }

  update(dt) {
    if (this.enabled) {
      let inputX = 0;
      let inputZ = 0;
      if (this.keys.has('KeyW') || this.keys.has('ArrowUp')) inputZ += 1;
      if (this.keys.has('KeyS') || this.keys.has('ArrowDown')) inputZ -= 1;
      if (this.keys.has('KeyA') || this.keys.has('ArrowLeft')) inputX -= 1;
      if (this.keys.has('KeyD') || this.keys.has('ArrowRight')) inputX += 1;

      if (inputX || inputZ) {
        const len = Math.hypot(inputX, inputZ);
        inputX /= len;
        inputZ /= len;

        const fwdX = -Math.sin(this.yaw);
        const fwdZ = -Math.cos(this.yaw);
        const rightX = Math.cos(this.yaw);
        const rightZ = -Math.sin(this.yaw);

        const dirX = fwdX * inputZ + rightX * inputX;
        const dirZ = fwdZ * inputZ + rightZ * inputX;

        const step = SPEED * dt;
        const pos = this.player.position;

        let nx = pos.x + dirX * step;
        for (const c of this.colliders) {
          if (this._blocked(nx, pos.z, c)) { nx = pos.x; break; }
        }

        let nz = pos.z + dirZ * step;
        for (const c of this.colliders) {
          if (this._blocked(nx, nz, c)) { nz = pos.z; break; }
        }

        pos.x = nx;
        pos.z = nz;

        // 朝向移动方向
        this.player.rotation.y = Math.atan2(dirX, dirZ);

        this.walkPhase = (this.walkPhase || 0) + dt * 7.5;
        const bob = Math.sin(this.walkPhase) * 0.028;
        const torso = this.player.userData.torso;
        if (torso) torso.position.y = 1.12 + bob;
      } else {
        const torso = this.player.userData.torso;
        if (torso) torso.position.y += (1.12 - torso.position.y) * 0.12;
      }
    }

    this._computeCamera(false);
  }
}

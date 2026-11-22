/**
 * RepoLens — Code Shell 3D Composite Object
 * Wireframe + solid faceted icosahedron surrounded by dual orbital rings.
 * Features 3.1s pulse wave cycles and crown-to-chin burn dissolution.
 */

import * as THREE from 'three';
import { createDissolveMaterial } from './DissolveShader.js';
import { readTokenColor } from './tokens.js';

export class CodeShell {
  constructor({ isMobile = false } = {}) {
    this.isMobile = isMobile;
    this.group = new THREE.Group();
    this.materials = [];
    this.dissolveAmount = 0.0;

    this.init();
  }

  init() {
    const primaryColor = readTokenColor('--accent', 0x6b8a6e);
    const edgeColor = readTokenColor('--ivory-50', 0xf8f5ea);
    const innerColor = readTokenColor('--surface-dark', 0x2c3e31);

    // 1. Outer Wireframe Icosahedron
    const outerGeo = new THREE.IcosahedronGeometry(1.6, 1);
    let outerMat;
    if (this.isMobile) {
      outerMat = new THREE.MeshBasicMaterial({
        color: primaryColor,
        wireframe: true,
        transparent: true,
        opacity: 0.7
      });
    } else {
      outerMat = createDissolveMaterial({
        baseColor: primaryColor,
        edgeColor,
        wireframe: true
      });
      this.materials.push(outerMat);
    }
    this.outerMesh = new THREE.Mesh(outerGeo, outerMat);
    this.group.add(this.outerMesh);

    // 2. Inner Solid Faceted Icosahedron
    const innerGeo = new THREE.IcosahedronGeometry(1.1, 0);
    let innerMat;
    if (this.isMobile) {
      innerMat = new THREE.MeshBasicMaterial({
        color: innerColor,
        transparent: true,
        opacity: 0.6
      });
    } else {
      innerMat = createDissolveMaterial({
        baseColor: innerColor,
        edgeColor,
        wireframe: false
      });
      this.materials.push(innerMat);
    }
    this.innerMesh = new THREE.Mesh(innerGeo, innerMat);
    this.group.add(this.innerMesh);

    // 3. Dual Orbital Rings
    const ringGeo1 = new THREE.TorusGeometry(2.2, 0.02, 16, 64);
    const ringMat1 = new THREE.MeshBasicMaterial({
      color: edgeColor,
      transparent: true,
      opacity: 0.4
    });
    this.ring1 = new THREE.Mesh(ringGeo1, ringMat1);
    this.ring1.rotation.x = Math.PI * 0.35;
    this.group.add(this.ring1);

    const ringGeo2 = new THREE.TorusGeometry(2.5, 0.015, 16, 64);
    const ringMat2 = new THREE.MeshBasicMaterial({
      color: primaryColor,
      transparent: true,
      opacity: 0.3
    });
    this.ring2 = new THREE.Mesh(ringGeo2, ringMat2);
    this.ring2.rotation.y = Math.PI * 0.4;
    this.group.add(this.ring2);
  }

  setDissolve(progress) {
    this.dissolveAmount = Math.max(0, Math.min(1, progress));
    for (const mat of this.materials) {
      if (mat.uniforms?.uDissolve) {
        mat.uniforms.uDissolve.value = this.dissolveAmount;
      }
    }
  }

  update(time) {
    // Orbital rotation
    this.outerMesh.rotation.y = time * 0.15;
    this.outerMesh.rotation.x = Math.sin(time * 0.1) * 0.2;

    this.innerMesh.rotation.y = -time * 0.22;
    this.innerMesh.rotation.z = Math.cos(time * 0.15) * 0.15;

    this.ring1.rotation.z = time * 0.08;
    this.ring2.rotation.x = time * 0.06;

    // 3.1s pulse wave cycle
    const pulseCycle = (time % 3.1) / 3.1;
    for (const mat of this.materials) {
      if (mat.uniforms) {
        mat.uniforms.uTime.value = time;
        mat.uniforms.uPulseProgress.value = pulseCycle;
      }
    }
  }

  dispose() {
    this.group.traverse((obj) => {
      if (obj.isMesh) {
        obj.geometry?.dispose();
        if (Array.isArray(obj.material)) {
          obj.material.forEach(m => m.dispose());
        } else {
          obj.material?.dispose();
        }
      }
    });
    this.materials = [];
  }
}

export default CodeShell;

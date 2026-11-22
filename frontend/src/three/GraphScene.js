/**
 * RepoLens — 3D Graph Scene
 * WebGL visualization of the code graph with instanced geometries per node type,
 * colored relation edges, OrbitControls damping, raycasting, and camera focusing.
 */

import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { getDeviceTier } from './tier.js';
import { readToken, readTokenColor } from './tokens.js';
import ticker from '../lib/ticker.js';

export class GraphScene {
  constructor(container, options = {}) {
    this.container = container;
    this.tier = getDeviceTier();
    this.onNodeHover = options.onNodeHover || null;
    this.onNodeClick = options.onNodeClick || null;

    this.graphData = null;
    this.nodeMeshes = new Map(); // id -> Mesh
    this.edgeLines = null;
    this.hoveredNodeId = null;
    this.selectedNodeId = null;

    this.mouse = new THREE.Vector2();
    this.raycaster = new THREE.Raycaster();
    this.targetCameraPos = null;
    this.targetLookAt = new THREE.Vector3(0, 0, 0);

    this._onPointerMove = this._onPointerMove.bind(this);
    this._onPointerDown = this._onPointerDown.bind(this);
    this._onResize = this._onResize.bind(this);
    this._render = this._render.bind(this);

    this.init();
  }

  init() {
    if (!this.container) return;
    const width = this.container.clientWidth || window.innerWidth;
    const height = this.container.clientHeight || window.innerHeight;

    this.scene = new THREE.Scene();
    this.scene.background = readTokenColor('--surface-black', 0x1f2c23);

    this.camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 100);
    this.camera.position.set(0, 0, 7.5);

    this.renderer = new THREE.WebGLRenderer({
      antialias: this.tier.antialias,
      powerPreference: 'high-performance'
    });
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(this.tier.dpr);
    this.container.appendChild(this.renderer.domElement);

    // OrbitControls with smooth inertia damping
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.06;
    this.controls.rotateSpeed = 0.7;
    this.controls.maxDistance = 25;
    this.controls.minDistance = 1.5;

    // Ambient + Directional lighting
    const ambient = new THREE.AmbientLight(0xffffff, 0.85);
    this.scene.add(ambient);
    const dirLight = new THREE.DirectionalLight(0xffffff, 1.2);
    dirLight.position.set(5, 10, 7);
    this.scene.add(dirLight);

    // Event listeners
    this.renderer.domElement.addEventListener('pointermove', this._onPointerMove, { passive: true });
    this.renderer.domElement.addEventListener('pointerdown', this._onPointerDown, { passive: true });
    window.addEventListener('resize', this._onResize, { passive: true });

    this.unsubscribeTicker = ticker.add(this._render);
  }

  loadGraph(graphData) {
    this.graphData = graphData;
    this.clearGraph();

    if (!graphData || !graphData.nodes) return;

    // Node Type Geometries & Materials
    const geos = {
      File: new THREE.SphereGeometry(0.18, 16, 16),
      Class: new THREE.OctahedronGeometry(0.22, 0),
      Function: new THREE.SphereGeometry(0.12, 16, 16),
      Module: new THREE.TorusGeometry(0.24, 0.03, 8, 24),
      Import: new THREE.SphereGeometry(0.08, 12, 12)
    };

    const colors = {
      File: readTokenColor('--node-file', 0xf8f5ea),
      Class: readTokenColor('--node-class', 0x6b8a6e),
      Function: readTokenColor('--node-function', 0x3f5744),
      Module: readTokenColor('--node-module', 0xc3d1b5),
      Import: readTokenColor('--node-import', 0xa9bd9a)
    };

    const nodeGroup = new THREE.Group();

    // Map [0..1] x, y, z layout into 3D world space [-4..4]
    graphData.nodes.forEach(node => {
      const type = node.type || 'Function';
      const geo = geos[type] || geos.Function;
      const col = colors[type] || colors.Function;

      const mat = new THREE.MeshStandardMaterial({
        color: col,
        roughness: 0.35,
        metalness: 0.2,
        emissive: col,
        emissiveIntensity: 0.15
      });

      const mesh = new THREE.Mesh(geo, mat);
      const x = ((node.x ?? 0.5) - 0.5) * 8.0;
      const y = ((node.y ?? 0.5) - 0.5) * 6.0;
      const z = ((node.z ?? 0.5) - 0.5) * 6.0;
      mesh.position.set(x, y, z);
      mesh.userData = { ...node, originalScale: mesh.scale.clone(), originalColor: col.clone() };

      nodeGroup.add(mesh);
      this.nodeMeshes.set(node.id, mesh);
    });

    this.scene.add(nodeGroup);
    this.nodeGroup = nodeGroup;

    // Build Edges via LineSegments
    if (graphData.edges && graphData.edges.length > 0) {
      const edgePositions = [];
      const edgeColors = [];
      const edgeColorMap = {
        contains: readTokenColor('--edge-contains', 0x2c3e31),
        calls: readTokenColor('--edge-calls', 0x6b8a6e),
        imports: readTokenColor('--edge-imports', 0xa9bd9a),
        inherits: readTokenColor('--edge-inherits', 0x3f5744)
      };

      graphData.edges.forEach(edge => {
        const srcMesh = this.nodeMeshes.get(edge.source);
        const tgtMesh = this.nodeMeshes.get(edge.target);
        if (srcMesh && tgtMesh) {
          edgePositions.push(srcMesh.position.x, srcMesh.position.y, srcMesh.position.z);
          edgePositions.push(tgtMesh.position.x, tgtMesh.position.y, tgtMesh.position.z);

          const col = edgeColorMap[edge.relation] || edgeColorMap.calls;
          edgeColors.push(col.r, col.g, col.b);
          edgeColors.push(col.r, col.g, col.b);
        }
      });

      const lineGeo = new THREE.BufferGeometry();
      lineGeo.setAttribute('position', new THREE.Float32BufferAttribute(edgePositions, 3));
      lineGeo.setAttribute('color', new THREE.Float32BufferAttribute(edgeColors, 3));

      const lineMat = new THREE.LineBasicMaterial({
        vertexColors: true,
        transparent: true,
        opacity: 0.45,
        blending: THREE.AdditiveBlending
      });

      this.edgeLines = new THREE.LineSegments(lineGeo, lineMat);
      this.scene.add(this.edgeLines);
    }
  }

  _onPointerMove(e) {
    if (!this.container) return;
    const rect = this.renderer.domElement.getBoundingClientRect();
    this.mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    this.mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

    this.raycaster.setFromCamera(this.mouse, this.camera);
    const meshes = Array.from(this.nodeMeshes.values());
    const intersects = this.raycaster.intersectObjects(meshes);

    if (intersects.length > 0) {
      const hit = intersects[0].object;
      const hitId = hit.userData.id;
      if (this.hoveredNodeId !== hitId) {
        this.hoveredNodeId = hitId;
        this.renderer.domElement.style.cursor = 'pointer';
        if (this.onNodeHover) this.onNodeHover(hit.userData);
      }
    } else {
      if (this.hoveredNodeId !== null) {
        this.hoveredNodeId = null;
        this.renderer.domElement.style.cursor = 'default';
        if (this.onNodeHover) this.onNodeHover(null);
      }
    }
  }

  _onPointerDown() {
    if (this.hoveredNodeId) {
      this.selectedNodeId = this.hoveredNodeId;
      const mesh = this.nodeMeshes.get(this.selectedNodeId);
      if (mesh && this.onNodeClick) {
        this.onNodeClick(mesh.userData);
        this.focusOnNode(this.selectedNodeId);
      }
    }
  }

  focusOnNode(nodeId) {
    const mesh = this.nodeMeshes.get(nodeId);
    if (!mesh) return;

    this.targetLookAt = mesh.position.clone();
    this.targetCameraPos = mesh.position.clone().add(new THREE.Vector3(0, 0.4, 2.8));
  }

  setHighlightNodes(highlightIds = [], upstreamIds = [], downstreamIds = []) {
    const hlSet = new Set(highlightIds);
    const upSet = new Set(upstreamIds);
    const downSet = new Set(downstreamIds);
    const hasFilter = hlSet.size > 0 || upSet.size > 0 || downSet.size > 0;

    const upCol = readTokenColor('--impact-upstream', 0xffffff);
    const downCol = readTokenColor('--impact-downstream', 0xdbe4d0);

    this.nodeMeshes.forEach((mesh, id) => {
      if (!hasFilter) {
        mesh.material.opacity = 1.0;
        mesh.material.color.copy(mesh.userData.originalColor);
        mesh.material.emissiveIntensity = 0.15;
        mesh.scale.set(1, 1, 1);
      } else if (upSet.has(id)) {
        mesh.material.opacity = 1.0;
        mesh.material.color.copy(upCol);
        mesh.material.emissiveIntensity = 0.8;
        mesh.scale.set(1.4, 1.4, 1.4);
      } else if (downSet.has(id)) {
        mesh.material.opacity = 1.0;
        mesh.material.color.copy(downCol);
        mesh.material.emissiveIntensity = 0.6;
        mesh.scale.set(1.3, 1.3, 1.3);
      } else if (hlSet.has(id)) {
        mesh.material.opacity = 1.0;
        mesh.material.emissiveIntensity = 0.7;
        mesh.scale.set(1.35, 1.35, 1.35);
      } else {
        mesh.material.opacity = 0.15;
        mesh.material.emissiveIntensity = 0.05;
        mesh.scale.set(0.8, 0.8, 0.8);
      }
    });
  }

  _render() {
    if (!this.renderer || !this.scene || !this.camera) return;

    // Smooth camera lerp when focusing on a node
    if (this.targetCameraPos) {
      this.camera.position.lerp(this.targetCameraPos, 0.06);
      this.controls.target.lerp(this.targetLookAt, 0.06);
      if (this.camera.position.distanceTo(this.targetCameraPos) < 0.05) {
        this.targetCameraPos = null;
      }
    }

    this.controls.update();
    this.renderer.render(this.scene, this.camera);
  }

  _onResize() {
    if (!this.container || !this.renderer || !this.camera) return;
    const width = this.container.clientWidth || window.innerWidth;
    const height = this.container.clientHeight || window.innerHeight;

    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  }

  clearGraph() {
    if (this.nodeGroup) {
      this.nodeGroup.traverse(obj => {
        if (obj.isMesh) {
          obj.geometry?.dispose();
          obj.material?.dispose();
        }
      });
      this.scene?.remove(this.nodeGroup);
      this.nodeGroup = null;
    }
    if (this.edgeLines) {
      this.edgeLines.geometry?.dispose();
      this.edgeLines.material?.dispose();
      this.scene?.remove(this.edgeLines);
      this.edgeLines = null;
    }
    this.nodeMeshes.clear();
  }

  destroy() {
    if (this.unsubscribeTicker) {
      this.unsubscribeTicker();
      this.unsubscribeTicker = null;
    }
    if (this.renderer?.domElement) {
      this.renderer.domElement.removeEventListener('pointermove', this._onPointerMove);
      this.renderer.domElement.removeEventListener('pointerdown', this._onPointerDown);
    }
    window.removeEventListener('resize', this._onResize);

    this.clearGraph();
    this.controls?.dispose();
    this.renderer?.dispose();
    this.renderer?.domElement?.remove();
  }
}

export default GraphScene;

import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { APP_CONFIG } from '../config.js';

/**
 * BottleModel
 * Loads an external 3D water bottle GLB or builds a procedural realistic
 * transparent ribbed plastic water bottle with brand label and blue cap.
 */
export class BottleModel {
  constructor() {
    this.template = null;
  }

  /**
   * Loads custom bottle model directly from an ArrayBuffer
   */
  async loadFromArrayBuffer(arrayBuffer) {
    try {
      const loader = new GLTFLoader();
      const gltf = await loader.parseAsync(arrayBuffer, '');
      if (gltf && gltf.scene) {
        this.setupFromGLTF(gltf.scene);
        console.log('[BottleModel] Successfully loaded custom user Bottle GLB!');
        return true;
      }
    } catch (err) {
      console.error('[BottleModel] Failed to parse custom Bottle GLB:', err);
      return false;
    }
  }

  /**
   * Initializes user's plastic water bottle model from GLB
   * @returns {Promise<void>}
   */
  async init() {
    const glbPath = APP_CONFIG.PATHS?.BOTTLE_GLB || '/models/plastic_water_bottle.glb';

    try {
      const loader = new GLTFLoader();
      const gltf = await loader.loadAsync(glbPath);
      if (gltf && gltf.scene) {
        this.setupFromGLTF(gltf.scene);
        console.log('[BottleModel] Đã nạp thành công Model Chai Nước của bạn:', glbPath);
        return;
      }
    } catch (err) {
      console.warn('[BottleModel] Không tải được GLB chai nước, dùng procedural:', err);
    }

    this.buildProcedural();
  }

  /**
   * Normalizes loaded GLTF mesh dimensions to match standard bottle proportions.
   * @param {THREE.Group} gltfScene
   */
  setupFromGLTF(gltfScene) {
    const box = new THREE.Box3().setFromObject(gltfScene);
    const size = new THREE.Vector3();
    box.getSize(size);

    const targetHeight = APP_CONFIG.BOTTLE.HEIGHT || 0.36;
    const scaleFactor = targetHeight / (size.y || 1);
    gltfScene.scale.setScalar(scaleFactor);

    // Re-center around origin (0, 0, 0)
    box.setFromObject(gltfScene);
    const center = new THREE.Vector3();
    box.getCenter(center);
    gltfScene.position.sub(center);

    const wrapper = new THREE.Group();
    wrapper.name = 'PlasticBottle';
    wrapper.add(gltfScene);

    wrapper.traverse((child) => {
      if (child.isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;
        if (child.material) {
          child.material.side = THREE.DoubleSide;
        }
      }
    });

    this.template = wrapper;
  }

  /**
   * Builds a procedural plastic water bottle with realistic ribbed body,
   * waist brand label, and bright blue screw cap.
   */
  buildProcedural() {
    const radius = APP_CONFIG.BOTTLE.RADIUS || 0.12;
    const height = APP_CONFIG.BOTTLE.HEIGHT || 0.5;
    const halfH = height * 0.5; // 0.25

    const bottleGroup = new THREE.Group();
    bottleGroup.name = 'ProceduralPlasticBottle';

    // 1. Transparent Ribbed Plastic Material
    const bodyMaterial = new THREE.MeshPhysicalMaterial({
      color: 0xddeeff,
      transmission: 0.92,
      opacity: 0.85,
      roughness: 0.1,
      ior: 1.45,
      metalness: 0.02,
      transparent: true,
      depthWrite: false,
      specularIntensity: 1.0,
      specularColor: new THREE.Color(0xffffff),
      side: THREE.DoubleSide
    });

    // 2. Realistic Lathe Profile for Ribbed Water Bottle
    // Centered vertically from -halfH to +halfH
    const points = [
      // Bottom punt (concave base)
      new THREE.Vector2(0.001, -halfH + 0.015),
      new THREE.Vector2(radius * 0.35, -halfH + 0.015),
      new THREE.Vector2(radius * 0.7, -halfH + 0.005),
      new THREE.Vector2(radius * 0.92, -halfH),
      new THREE.Vector2(radius, -halfH + 0.01),

      // Lower ribs
      new THREE.Vector2(radius, -halfH * 0.8),
      new THREE.Vector2(radius * 0.94, -halfH * 0.7),
      new THREE.Vector2(radius, -halfH * 0.6),
      new THREE.Vector2(radius * 0.94, -halfH * 0.5),
      new THREE.Vector2(radius, -halfH * 0.4),
      new THREE.Vector2(radius * 0.94, -halfH * 0.3),

      // Waist section (label zone)
      new THREE.Vector2(radius * 0.93, -halfH * 0.2),
      new THREE.Vector2(radius * 0.92, 0),
      new THREE.Vector2(radius * 0.93, halfH * 0.2),

      // Upper ribs
      new THREE.Vector2(radius * 0.94, halfH * 0.3),
      new THREE.Vector2(radius, halfH * 0.4),
      new THREE.Vector2(radius * 0.94, halfH * 0.5),
      new THREE.Vector2(radius, halfH * 0.58),

      // Shoulder curve
      new THREE.Vector2(radius * 0.9, halfH * 0.68),
      new THREE.Vector2(radius * 0.72, halfH * 0.78),
      new THREE.Vector2(radius * 0.5, halfH * 0.86),
      new THREE.Vector2(radius * 0.38, halfH * 0.91),

      // Neck & lip opening
      new THREE.Vector2(radius * 0.36, halfH * 0.95),
      new THREE.Vector2(radius * 0.36, halfH * 0.98),
      new THREE.Vector2(radius * 0.32, halfH * 0.99)
    ];

    const latheGeo = new THREE.LatheGeometry(points, 32);
    const bodyMesh = new THREE.Mesh(latheGeo, bodyMaterial);
    bodyMesh.castShadow = true;
    bodyMesh.receiveShadow = true;
    bottleGroup.add(bodyMesh);

    // 3. Semi-transparent Brand Label around the Waist
    let labelTexture = null;
    if (typeof document !== 'undefined') {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = 512;
        canvas.height = 256;
        const ctx = canvas.getContext('2d');

        // Cyan / Deep Blue gradient
        const grad = ctx.createLinearGradient(0, 0, 512, 0);
        grad.addColorStop(0, '#0077b6');
        grad.addColorStop(0.3, '#00b4d8');
        grad.addColorStop(0.7, '#48cae4');
        grad.addColorStop(1, '#0077b6');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, 512, 256);

        // White brand typography
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 38px "JetBrains Mono", sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('AQUA PURE', 256, 105);

        ctx.font = '600 20px sans-serif';
        ctx.fillText('NATURAL MINERAL WATER • 500ml', 256, 140);

        ctx.font = '16px monospace';
        ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
        ctx.fillText('♻ 100% RECYCLABLE PET // IOT SMART TRASH', 256, 175);

        // Barcode decorative lines
        ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
        for (let i = 0; i < 28; i++) {
          const w = (i % 3 === 0) ? 4 : 2;
          ctx.fillRect(40 + i * 8, 195, w, 35);
        }

        labelTexture = new THREE.CanvasTexture(canvas);
        labelTexture.wrapS = THREE.RepeatWrapping;
      } catch (e) {
        labelTexture = null;
      }
    }

    const labelHeight = height * 0.22; // 0.11
    const labelRadius = radius * 0.935;
    const labelGeo = new THREE.CylinderGeometry(labelRadius, labelRadius, labelHeight, 32, 1, true);
    const labelMaterial = new THREE.MeshStandardMaterial({
      map: labelTexture,
      color: labelTexture ? 0xffffff : 0x00b4d8,
      roughness: 0.35,
      metalness: 0.05,
      transparent: true,
      opacity: 0.88,
      side: THREE.DoubleSide
    });
    const labelMesh = new THREE.Mesh(labelGeo, labelMaterial);
    labelMesh.position.set(0, 0, 0); // Centered at waist
    labelMesh.castShadow = true;
    labelMesh.receiveShadow = true;
    bottleGroup.add(labelMesh);

    // 4. Bottle Neck Collar & Bright Blue Screw Cap
    const capMaterial = new THREE.MeshStandardMaterial({
      color: 0x0077ff,
      roughness: 0.32,
      metalness: 0.15
    });

    // Safety tamper ring below cap
    const ringGeo = new THREE.CylinderGeometry(radius * 0.39, radius * 0.39, 0.012, 24);
    const ringMesh = new THREE.Mesh(ringGeo, capMaterial);
    ringMesh.position.set(0, halfH * 0.92, 0);
    ringMesh.castShadow = true;
    bottleGroup.add(ringMesh);

    // Main screw cap
    const capHeight = 0.038;
    const capGeo = new THREE.CylinderGeometry(radius * 0.40, radius * 0.40, capHeight, 24);
    const capMesh = new THREE.Mesh(capGeo, capMaterial);
    capMesh.position.set(0, halfH * 0.97, 0);
    capMesh.castShadow = true;
    capMesh.receiveShadow = true;
    bottleGroup.add(capMesh);

    this.template = bottleGroup;
  }

  /**
   * Creates and returns a clone of the bottle mesh with shadows enabled.
   * @returns {THREE.Group}
   */
  createInstance() {
    if (!this.template) {
      this.buildProcedural();
    }

    const clone = this.template.clone(true);
    clone.traverse((child) => {
      if (child.isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;
      }
    });

    return clone;
  }
}

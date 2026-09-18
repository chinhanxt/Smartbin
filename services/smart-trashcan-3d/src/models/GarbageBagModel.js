import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { APP_CONFIG } from '../config.js';

/**
 * GarbageBagModel - Loads user's a_bag_of_garbage.glb model
 */
export class GarbageBagModel {
  constructor() {
    this.template = null;
  }

  async init() {
    const glbPath = APP_CONFIG.PATHS?.GARBAGE_BAG_GLB || '/models/garbage_bag.glb';
    try {
      const loader = new GLTFLoader();
      const gltf = await loader.loadAsync(glbPath);
      if (gltf && gltf.scene) {
        this.setupFromGLTF(gltf.scene);
        console.log('[GarbageBagModel] Đã nạp thành công Model Túi Rác:', glbPath);
        return;
      }
    } catch (err) {
      console.warn('[GarbageBagModel] Lỗi nạp garbage bag GLB, sử dụng procedural fallback:', err);
    }

    this.buildProcedural();
  }

  setupFromGLTF(gltfScene) {
    const box = new THREE.Box3().setFromObject(gltfScene);
    const size = new THREE.Vector3();
    box.getSize(size);

    const targetHeight = APP_CONFIG.GARBAGE_BAG.HEIGHT || 0.32;
    const scaleFactor = targetHeight / (size.y || 1);
    gltfScene.scale.setScalar(scaleFactor);

    // Re-center around origin (0, 0, 0)
    box.setFromObject(gltfScene);
    const center = new THREE.Vector3();
    box.getCenter(center);
    gltfScene.position.sub(center);

    const wrapper = new THREE.Group();
    wrapper.name = 'GarbageBag';
    wrapper.add(gltfScene);

    wrapper.traverse((child) => {
      if (child.isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;
      }
    });

    this.template = wrapper;
  }

  buildProcedural() {
    const group = new THREE.Group();
    const radius = APP_CONFIG.GARBAGE_BAG.RADIUS || 0.22;
    const bagGeo = new THREE.DodecahedronGeometry(radius, 2);
    const bagMat = new THREE.MeshStandardMaterial({
      color: 0x22262b,
      roughness: 0.35,
      metalness: 0.1
    });
    const bagMesh = new THREE.Mesh(bagGeo, bagMat);
    bagMesh.scale.set(1, 1.25, 1);
    bagMesh.castShadow = true;
    bagMesh.receiveShadow = true;
    group.add(bagMesh);

    this.template = group;
  }

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

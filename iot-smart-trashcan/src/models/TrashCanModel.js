import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { APP_CONFIG } from '../config.js';

/**
 * TrashCanModel
 * Handles loading or procedural generation of the Sci-Fi IoT Smart Trash Can.
 * Features a pivotable motorized lid, ultrasonic sensor module, LED accent rings,
 * and dynamic status indicator lighting.
 */
export class TrashCanModel {
  constructor() {
    this.group = new THREE.Group();
    this.group.name = 'TrashCan';

    this.lidPivot = null;
    this.sensorOrigin = null;
    this.ledMaterials = [];
    this.pointLights = [];

    this.currentLidAngle = 0;
    this.targetLidAngle = 0;
    this.maxLidAngle = APP_CONFIG.BIN.LID_MAX_ANGLE || (Math.PI * 0.45);

    this.currentColor = new THREE.Color(0x0284c7); // Default clean tech blue
    this.scene = null;
  }

  /**
   * Loads model directly from an ArrayBuffer (e.g. from file input or drag-and-drop)
   */
  async loadFromArrayBuffer(arrayBuffer) {
    try {
      const loader = new GLTFLoader();
      const gltf = await loader.parseAsync(arrayBuffer, '');
      if (gltf && gltf.scene) {
        // Clear old children from group
        while (this.group.children.length > 0) {
          this.group.remove(this.group.children[0]);
        }
        this.ledMaterials = [];
        this.pointLights = [];
        this.setupFromGLTF(gltf.scene);
        console.log('[TrashCanModel] Successfully loaded custom user GLB model!');
        return true;
      }
    } catch (err) {
      console.error('[TrashCanModel] Failed to parse custom GLB:', err);
      return false;
    }
  }

  /**
   * Initializes the 3D model with user's sci_fi_trash_can.glb
   * @param {THREE.Scene} scene
   * @returns {Promise<void>}
   */
  async init(scene) {
    this.scene = scene;
    const glbPath = APP_CONFIG.PATHS?.TRASH_CAN_GLB || '/models/sci_fi_trash_can.glb';

    try {
      const loader = new GLTFLoader();
      const gltf = await loader.loadAsync(glbPath);
      if (gltf && gltf.scene) {
        this.setupFromGLTF(gltf.scene);
        console.log('[TrashCanModel] Đã nạp thành công Model Thùng rác của bạn:', glbPath);
        if (this.scene) {
          this.scene.add(this.group);
        }
        return;
      }
    } catch (err) {
      console.warn('[TrashCanModel] Không tải được GLB, dùng procedural:', err);
    }

    this.buildProcedural();
    if (this.scene) {
      this.scene.add(this.group);
    }
  }

  /**
   * Configures user's loaded GLTF scene hierarchy with exact centering and scale.
   * @param {THREE.Group} modelScene
   */
  setupFromGLTF(modelScene) {
    while (this.group.children.length > 0) {
      this.group.remove(this.group.children[0]);
    }
    this.ledMaterials = [];
    this.pointLights = [];

    const box = new THREE.Box3().setFromObject(modelScene);
    const size = new THREE.Vector3();
    box.getSize(size);
    const targetHeight = APP_CONFIG.BIN.HEIGHT || 2.2;
    const scaleFactor = targetHeight / (size.y || 1);
    modelScene.scale.setScalar(scaleFactor);

    // Re-center around base: x=0, z=0, y=0 (ground)
    box.setFromObject(modelScene);
    const center = new THREE.Vector3();
    box.getCenter(center);
    modelScene.position.x -= center.x;
    modelScene.position.y -= box.min.y;
    modelScene.position.z -= center.z;

    modelScene.traverse((child) => {
      if (child.isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;
        if (child.material) {
          const mats = Array.isArray(child.material) ? child.material : [child.material];
          mats.forEach(mat => {
            mat.side = THREE.DoubleSide;
            // Catch emissive lights on the model
            if (mat.emissive && (mat.emissive.r > 0 || mat.emissive.g > 0 || mat.emissive.b > 0)) {
              this.ledMaterials.push(mat);
            }
          });
        }
      }
    });

    this.group.add(modelScene);

    // Create custom indicator glow for the trash can
    const statusPointLight = new THREE.PointLight(this.currentColor, 1.8, 4);
    statusPointLight.position.set(0, targetHeight * 0.75, APP_CONFIG.BIN.RADIUS + 0.1);
    this.group.add(statusPointLight);
    this.pointLights.push(statusPointLight);

    // Top rim lid pivot
    this.lidPivot = new THREE.Group();
    this.lidPivot.position.set(0, targetHeight, -APP_CONFIG.BIN.RADIUS);
    this.group.add(this.lidPivot);

    // Sensor anchor
    this.sensorOrigin = new THREE.Object3D();
    this.sensorOrigin.position.set(0, targetHeight, 0);
    this.group.add(this.sensorOrigin);
  }

  /**
   * Constructs a high-fidelity procedural Sci-Fi trash can with white/light futuristic finish.
   */
  buildProcedural() {
    const radius = APP_CONFIG.BIN.RADIUS || 0.9;
    const height = APP_CONFIG.BIN.HEIGHT || 2.2;
    const halfHeight = height * 0.5;

    // 1. Shared Materials - Clean White Futuristic Look
    const whiteSciFiMaterial = new THREE.MeshStandardMaterial({
      color: 0xf8fafc,
      metalness: 0.25,
      roughness: 0.18,
      side: THREE.DoubleSide
    });

    const innerLinerMaterial = new THREE.MeshStandardMaterial({
      color: 0xe2e8f0,
      metalness: 0.4,
      roughness: 0.5,
      side: THREE.BackSide
    });

    const trimSilverMaterial = new THREE.MeshStandardMaterial({
      color: 0x94a3b8,
      metalness: 0.85,
      roughness: 0.25
    });

    const chromeMaterial = new THREE.MeshStandardMaterial({
      color: 0xe2e8f0,
      metalness: 0.98,
      roughness: 0.08
    });

    const ledMaterial = new THREE.MeshStandardMaterial({
      color: this.currentColor,
      emissive: this.currentColor,
      emissiveIntensity: 2.5,
      roughness: 0.1,
      metalness: 0.1,
      toneMapped: false
    });
    this.ledMaterials.push(ledMaterial);

    // 2. Main Cylindrical Body (Outer Shell)
    // Centered at halfHeight so the bottom sits flush on ground at y=0, top at y=height
    const outerBodyGeo = new THREE.CylinderGeometry(radius, radius, height, 48, 1, true);
    const outerBodyMesh = new THREE.Mesh(outerBodyGeo, whiteSciFiMaterial);
    outerBodyMesh.position.set(0, halfHeight, 0);
    outerBodyMesh.castShadow = true;
    outerBodyMesh.receiveShadow = true;
    this.group.add(outerBodyMesh);

    // Inner Shell (Interior Wall)
    const innerBodyGeo = new THREE.CylinderGeometry(radius - 0.03, radius - 0.03, height - 0.02, 48, 1, true);
    const innerBodyMesh = new THREE.Mesh(innerBodyGeo, innerLinerMaterial);
    innerBodyMesh.position.set(0, halfHeight + 0.01, 0);
    innerBodyMesh.receiveShadow = true;
    this.group.add(innerBodyMesh);

    // Bottom Interior & Exterior Base Plates
    const basePlateGeo = new THREE.CylinderGeometry(radius - 0.02, radius - 0.02, 0.04, 48);
    const basePlate = new THREE.Mesh(basePlateGeo, trimSilverMaterial);
    basePlate.position.set(0, 0.02, 0);
    basePlate.receiveShadow = true;
    this.group.add(basePlate);

    // Heavy Industrial Base Collar (Bottom Footing)
    const baseCollarGeo = new THREE.CylinderGeometry(radius + 0.05, radius + 0.07, 0.14, 48);
    const baseCollar = new THREE.Mesh(baseCollarGeo, trimSilverMaterial);
    baseCollar.position.set(0, 0.07, 0);
    baseCollar.castShadow = true;
    baseCollar.receiveShadow = true;
    this.group.add(baseCollar);

    // Top Rim Mouth Collar
    const topCollarGeo = new THREE.CylinderGeometry(radius + 0.04, radius + 0.02, 0.08, 48);
    const topCollar = new THREE.Mesh(topCollarGeo, trimSilverMaterial);
    topCollar.position.set(0, height - 0.04, 0);
    topCollar.castShadow = true;
    this.group.add(topCollar);

    // Smooth Torus Lip at Top Rim
    const topLipGeo = new THREE.TorusGeometry(radius, 0.022, 16, 48);
    const topLipMesh = new THREE.Mesh(topLipGeo, chromeMaterial);
    topLipMesh.rotation.x = Math.PI * 0.5;
    topLipMesh.position.set(0, height, 0);
    this.group.add(topLipMesh);

    // 3. Neon LED Circumferential Accent Rings
    const ringConfigs = [
      { y: height - 0.12, r: radius + 0.005, tube: 0.014 }, // Upper rim ring
      { y: height * 0.68, r: radius + 0.005, tube: 0.012 }, // Mid-upper ring
      { y: height * 0.32, r: radius + 0.005, tube: 0.012 }, // Mid-lower ring
      { y: 0.18, r: radius + 0.052, tube: 0.014 }           // Lower base collar ring
    ];

    ringConfigs.forEach((cfg) => {
      const ringGeo = new THREE.TorusGeometry(cfg.r, cfg.tube, 12, 48);
      const ringMesh = new THREE.Mesh(ringGeo, ledMaterial);
      ringMesh.rotation.x = Math.PI * 0.5;
      ringMesh.position.set(0, cfg.y, 0);
      this.group.add(ringMesh);
    });

    // 4. Vertical Sci-Fi Carbon Flank Battens & Side Channels
    for (let angle = 0; angle < Math.PI * 2; angle += Math.PI * 0.5) {
      const ribAngle = angle + Math.PI * 0.25;
      const ribX = Math.sin(ribAngle) * (radius + 0.015);
      const ribZ = Math.cos(ribAngle) * (radius + 0.015);

      const ribGeo = new THREE.BoxGeometry(0.04, height * 0.72, 0.03);
      const ribMesh = new THREE.Mesh(ribGeo, trimSilverMaterial);
      ribMesh.position.set(ribX, halfHeight, ribZ);
      ribMesh.rotation.y = -ribAngle;
      ribMesh.castShadow = true;
      this.group.add(ribMesh);
    }

    // 5. Front Status Indicator Panel
    const frontZ = radius + 0.01;
    const frontY = height * 0.85;

    const panelHousingGeo = new THREE.BoxGeometry(0.24, 0.14, 0.035);
    const panelHousing = new THREE.Mesh(panelHousingGeo, trimSilverMaterial);
    panelHousing.position.set(0, frontY, frontZ);
    panelHousing.castShadow = true;
    this.group.add(panelHousing);

    // Front Glowing Status Indicator Light Bar
    const indicatorGeo = new THREE.BoxGeometry(0.18, 0.045, 0.02);
    const indicatorMesh = new THREE.Mesh(indicatorGeo, ledMaterial);
    indicatorMesh.position.set(0, frontY, frontZ + 0.02);
    this.group.add(indicatorMesh);

    // Subtle localized status glow point light
    const statusPointLight = new THREE.PointLight(this.currentColor, 1.2, 1.8);
    statusPointLight.position.set(0, frontY, frontZ + 0.08);
    this.group.add(statusPointLight);
    this.pointLights.push(statusPointLight);

    // 6. Pivotable Lid Mechanism
    this.lidPivot = new THREE.Group();
    this.lidPivot.name = 'LidPivot';
    this.lidPivot.position.set(0, height, -radius);
    this.group.add(this.lidPivot);

    // Motorized Hinge Casing at the pivot point
    const hingeAxleGeo = new THREE.CylinderGeometry(0.045, 0.045, 0.42, 24);
    const hingeAxle = new THREE.Mesh(hingeAxleGeo, chromeMaterial);
    hingeAxle.rotation.z = Math.PI * 0.5;
    hingeAxle.position.set(0, 0, 0);
    hingeAxle.castShadow = true;
    this.lidPivot.add(hingeAxle);

    const hingeBracketGeo = new THREE.BoxGeometry(0.38, 0.07, 0.1);
    const hingeBracket = new THREE.Mesh(hingeBracketGeo, trimSilverMaterial);
    hingeBracket.position.set(0, 0, 0.03);
    hingeBracket.castShadow = true;
    this.lidPivot.add(hingeBracket);

    const lidCenterZ = radius;
    const lidCenterY = 0.025;

    // Circular Motorized Lid Main Mesh - White
    const lidDiscGeo = new THREE.CylinderGeometry(radius + 0.03, radius + 0.04, 0.05, 48);
    const lidDiscMesh = new THREE.Mesh(lidDiscGeo, whiteSciFiMaterial);
    lidDiscMesh.position.set(0, lidCenterY, lidCenterZ);
    lidDiscMesh.castShadow = true;
    lidDiscMesh.receiveShadow = true;
    this.lidPivot.add(lidDiscMesh);

    // Stepped Upper Lid Plate - Silver
    const lidTopPlateGeo = new THREE.CylinderGeometry(radius * 0.82, radius * 0.94, 0.035, 48);
    const lidTopPlate = new THREE.Mesh(lidTopPlateGeo, trimSilverMaterial);
    lidTopPlate.position.set(0, lidCenterY + 0.038, lidCenterZ);
    lidTopPlate.castShadow = true;
    this.lidPivot.add(lidTopPlate);

    // Center Cybernetic Hub Cap - Chrome
    const lidHubGeo = new THREE.CylinderGeometry(0.28, 0.32, 0.025, 32);
    const lidHubMesh = new THREE.Mesh(lidHubGeo, chromeMaterial);
    lidHubMesh.position.set(0, lidCenterY + 0.065, lidCenterZ);
    lidHubMesh.castShadow = true;
    this.lidPivot.add(lidHubMesh);

    // Neon LED Halo Ring on Lid
    const lidHaloGeo = new THREE.TorusGeometry(radius * 0.88, 0.012, 12, 48);
    const lidHaloMesh = new THREE.Mesh(lidHaloGeo, ledMaterial);
    lidHaloMesh.rotation.x = Math.PI * 0.5;
    lidHaloMesh.position.set(0, lidCenterY + 0.056, lidCenterZ);
    this.lidPivot.add(lidHaloMesh);

    // 7. Ultrasonic Sensor Module on Underside of Lid
    const sensorHousingGeo = new THREE.BoxGeometry(0.22, 0.04, 0.12);
    const sensorHousing = new THREE.Mesh(sensorHousingGeo, trimSilverMaterial);
    sensorHousing.position.set(0, -0.02, lidCenterZ);
    this.lidPivot.add(sensorHousing);

    // Ultrasonic Transducer Eyes (HC-SR04 Style Transmitter & Receiver)
    const eyeSpacing = 0.055;
    [-eyeSpacing, eyeSpacing].forEach((xOffset) => {
      // Transducer metallic housing
      const eyeGeo = new THREE.CylinderGeometry(0.028, 0.028, 0.02, 20);
      const eyeMesh = new THREE.Mesh(eyeGeo, chromeMaterial);
      eyeMesh.position.set(xOffset, -0.045, lidCenterZ);
      this.lidPivot.add(eyeMesh);

      // Acoustic mesh grill center
      const grillGeo = new THREE.CylinderGeometry(0.022, 0.022, 0.005, 20);
      const grillMesh = new THREE.Mesh(grillGeo, innerLinerMaterial);
      grillMesh.position.set(xOffset, -0.056, lidCenterZ);
      this.lidPivot.add(grillMesh);
    });

    // Sensor Indicator Mini-LED
    const sensorLedGeo = new THREE.SphereGeometry(0.008, 12, 12);
    const sensorLedMesh = new THREE.Mesh(sensorLedGeo, ledMaterial);
    sensorLedMesh.position.set(0, -0.045, lidCenterZ);
    this.lidPivot.add(sensorLedMesh);

    // Sensor raycasting origin / orientation anchor
    this.sensorOrigin = new THREE.Object3D();
    this.sensorOrigin.name = 'UltrasonicSensorOrigin';
    // Positioned at the face of the ultrasonic transducers
    this.sensorOrigin.position.set(0, -0.06, lidCenterZ);
    // Point downward into the bin when lid is closed
    this.lidPivot.add(this.sensorOrigin);
  }

  /**
   * Opens the trash can lid to the maximum angle.
   * @returns {boolean} true indicating lid opened
   */
  openLid() {
    this.targetLidAngle = this.maxLidAngle;
    return true;
  }

  /**
   * Closes the trash can lid.
   * @returns {boolean} false indicating lid closed
   */
  closeLid() {
    this.targetLidAngle = 0;
    return false;
  }

  /**
   * Smoothly updates lid angle via lerp/exponential damping.
   * @param {number} [delta=0.016] Delta time in seconds
   */
  update(delta = 0.016) {
    const smoothingSpeed = 6.5; // Responsive sci-fi motorized speed
    const factor = 1.0 - Math.exp(-smoothingSpeed * Math.min(delta, 0.1));

    this.currentLidAngle += (this.targetLidAngle - this.currentLidAngle) * factor;

    // Prevent floating-point drift near targets
    if (Math.abs(this.targetLidAngle - this.currentLidAngle) < 0.0005) {
      this.currentLidAngle = this.targetLidAngle;
    }

    if (this.lidPivot) {
      // Rotating backwards around local X lifts the front edge upward and back
      this.lidPivot.rotation.x = -this.currentLidAngle;
    }
  }

  /**
   * Updates all emissive LED accents and indicator lights.
   * @param {number|string|THREE.Color} hex e.g. 0x00ff88 (normal), 0xffaa00 (warning), 0xff0044 (critical)
   */
  setLedColor(hex) {
    if (hex instanceof THREE.Color) {
      this.currentColor.copy(hex);
    } else {
      this.currentColor.set(hex);
    }

    this.ledMaterials.forEach((material) => {
      material.color.copy(this.currentColor);
      if (material.emissive) {
        material.emissive.copy(this.currentColor);
      }
    });

    this.pointLights.forEach((light) => {
      light.color.copy(this.currentColor);
    });
  }

  /**
   * Returns true if the lid is physically open or opening.
   * @returns {boolean}
   */
  get isLidOpen() {
    return this.currentLidAngle > 0.08 || this.targetLidAngle > 0;
  }

  /**
   * Returns current world position of the ultrasonic sensor module.
   * @param {THREE.Vector3} [targetVec=new THREE.Vector3()]
   * @returns {THREE.Vector3}
   */
  getSensorWorldPosition(targetVec = new THREE.Vector3()) {
    if (this.sensorOrigin) {
      this.sensorOrigin.getWorldPosition(targetVec);
    } else {
      targetVec.set(0, APP_CONFIG.BIN.HEIGHT, 0);
    }
    return targetVec;
  }

  /**
   * Returns current world direction vector of the ultrasonic sensor module.
   * @param {THREE.Vector3} [targetVec=new THREE.Vector3()]
   * @returns {THREE.Vector3}
   */
  getSensorWorldDirection(targetVec = new THREE.Vector3()) {
    if (this.sensorOrigin) {
      // By default sensor points down along -Y in lidPivot frame when lid is closed
      const localDown = new THREE.Vector3(0, -1, 0);
      targetVec.copy(localDown).applyQuaternion(this.lidPivot.quaternion);
      targetVec.applyQuaternion(this.group.quaternion).normalize();
    } else {
      targetVec.set(0, -1, 0);
    }
    return targetVec;
  }
}

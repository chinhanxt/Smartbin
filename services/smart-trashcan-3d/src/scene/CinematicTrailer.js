import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { APP_CONFIG } from '../config.js';

/**
 * CinematicTrailer.js
 * High-end cinematic game trailer / project simulation workflow for Smartbin IoT.
 *
 * Sequence:
 * Act 1 (00:00 - 04:50): Urban drone establishing shot of street & sidewalk IoT smart bin.
 * Act 2 (04:50 - 09:00): Close-up ultrasonic sensor trigger, 100% full overflow event & critical LoRaWAN alarm.
 * Act 3 (09:00 - 15:00): Tri-County Sanitation rear loader truck drives down avenue with headlights and brakes beside bin.
 * Act 4 (15:00 - 20:00): Over-the-shoulder hopper angle, motorized lid opens, trash collection, fill drops to 0%, green reset.
 * Act 5 (20:00 - 25:00): High crane pull-back shot, truck departs into distance, clean smart city finale.
 */
export class CinematicTrailer {
  constructor(options = {}) {
    this.world = options.world;
    this.trashCan = options.trashCan;
    this.ultrasonicBeam = options.ultrasonicBeam;
    this.sensorManager = options.sensorManager;
    this.bottleSpawner = options.bottleSpawner;
    this.bottleModel = options.bottleModel || options.bottleSpawner?.bottleModel;
    this.garbageBagModel = options.garbageBagModel || options.bottleSpawner?.garbageBagModel;
    this.soundAlert = options.soundAlert;
    this.onExit = options.onExit || (() => {});

    this.scene = this.world.scene;
    this.camera = this.world.camera;

    // Models
    this.streetGroup = null;
    this.truckGroup = null;
    this.truckMesh = null;
    this.headlights = [];
    this.beaconLight = null;

    // Waste items simulation in trailer
    this.trailerWasteGroup = null;
    this.trailerWasteItems = [];
    this.lastSpawnSoundIndex = -1;

    // State
    this.isActive = false;
    this.isPlaying = false;
    this.currentTime = 0;
    this.duration = 25.0; // 25 seconds full sequence
    this.isLoading = false;
    this.isLoaded = false;

    // Positions in street coordinates
    // Bin placed at open sidewalk walkway completely clear of buildings & awnings
    this.BIN_STREET_POS = new THREE.Vector3(-1.60, 0.078, 0.10);
    this.TRUCK_ROAD_X = -4.00;
    this.TRUCK_ROAD_Y = 0.019;
    this.TRUCK_START_Z = -16.0;
    this.TRUCK_STOP_Z = 3.80;
    this.TRUCK_DEPART_Z = 16.0;

    // Overlay elements
    this.overlayContainer = null;
    this.progressBar = null;
    this.timeText = null;
    this.subtitleText = null;
    this.playBtn = null;
    this.loadingSpinner = null;

    // Original states to restore on exit
    this.originalCameraPos = new THREE.Vector3(0, 3.0, 5.2);
    this.originalControlsTarget = new THREE.Vector3(0, 1.1, 0);

    this.initUI();
  }

  /**
   * Builds the cinematic widescreen HUD overlay
   */
  initUI() {
    // Check if already injected
    if (document.getElementById('trailer-hud')) {
      this.overlayContainer = document.getElementById('trailer-hud');
      return;
    }

    const hud = document.createElement('div');
    hud.id = 'trailer-hud';
    hud.className = 'trailer-hud hidden';
    hud.innerHTML = `
      <!-- Top Letterbox Bar -->
      <div class="trailer-letterbox top">
        <div class="trailer-title-area">
          <span class="trailer-badge">CINEMATIC 4K</span>
          <span class="trailer-title">SMARTBIN CIVIC-TECH • QUY TRÌNH THU GOM ĐÔ THỊ TỰ ĐỘNG</span>
        </div>
        <div class="trailer-top-actions">
          <button id="btn-trailer-reset-cam" class="trailer-cam-btn" type="button" title="Đặt lại góc nhìn 3D mặc định">
            <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10"></circle>
              <circle cx="12" cy="12" r="3"></circle>
              <line x1="12" y1="2" x2="12" y2="5"></line>
              <line x1="12" y1="19" x2="12" y2="22"></line>
              <line x1="2" y1="12" x2="5" y2="12"></line>
              <line x1="19" y1="12" x2="22" y2="12"></line>
            </svg>
            <span>🎯 Góc Nhìn Mặc Định</span>
          </button>
          <button id="btn-trailer-exit" class="trailer-exit-btn" type="button" title="Thoát chế độ trailer">
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
            <span>Thoát Phim</span>
          </button>
        </div>
      </div>

      <!-- Center Dynamic Telemetry -->
      <div class="trailer-center-hud">
        <div id="trailer-alert-banner" class="trailer-alert-badge hidden">
          <span class="pulse-dot"></span>
          <span id="trailer-alert-text">CẢNH BÁO: QUÁ TẢI 100%</span>
        </div>
      </div>

      <!-- Bottom Letterbox Bar -->
      <div class="trailer-letterbox bottom">
        <div class="trailer-controls">
          <button id="btn-trailer-playpause" class="trailer-ctrl-btn" type="button" title="Phát / Tạm dừng">
            <svg id="trailer-play-icon" viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
              <polygon points="5 3 19 12 5 21 5 3"></polygon>
            </svg>
          </button>
          <span id="trailer-time-display" class="trailer-time">00:00 / 00:25</span>
          
          <!-- Chapter Nav Pills -->
          <div class="trailer-chapters">
            <button class="chap-btn" data-time="0">Khởi tạo</button>
            <button class="chap-btn" data-time="4.5">Quá tải</button>
            <button class="chap-btn" data-time="9.0">Xe đến</button>
            <button class="chap-btn" data-time="15.0">Thu gom</button>
            <button class="chap-btn" data-time="20.0">Rời đi</button>
          </div>
        </div>

        <div class="trailer-progress-wrapper" id="trailer-progress-container">
          <div class="trailer-progress-fill" id="trailer-progress-bar"></div>
        </div>
      </div>

      <!-- Loading Overlay -->
      <div id="trailer-loading" class="trailer-loading hidden">
        <div class="trailer-spinner"></div>
        <p id="trailer-loading-text" class="trailer-loading-title">Đang nạp bối cảnh phố & xe thu gom...</p>
        <p class="trailer-loading-desc">Mô hình đường phố 3D (street_2.glb) & Xe rác Tri-County (70MB)</p>
      </div>
    `;

    document.body.appendChild(hud);

    this.overlayContainer = hud;
    this.progressBar = document.getElementById('trailer-progress-bar');
    this.timeText = document.getElementById('trailer-time-display');
    this.playBtn = document.getElementById('btn-trailer-playpause');
    this.loadingSpinner = document.getElementById('trailer-loading');

    // Button event listeners
    document.getElementById('btn-trailer-exit').addEventListener('click', () => {
      this.stop();
    });

    const resetCamBtn = document.getElementById('btn-trailer-reset-cam');
    if (resetCamBtn) {
      resetCamBtn.addEventListener('click', () => {
        this.resetCameraView();
      });
    }

    this.playBtn.addEventListener('click', () => {
      if (this.isPlaying) {
        this.pause();
      } else {
        this.play();
      }
    });

    // Chapter jumping
    const chapBtns = hud.querySelectorAll('.chap-btn');
    chapBtns.forEach(btn => {
      btn.addEventListener('click', (e) => {
        const targetTime = parseFloat(e.currentTarget.dataset.time || '0');
        this.seek(targetTime);
      });
    });

    // Scrubber click
    const progContainer = document.getElementById('trailer-progress-container');
    progContainer.addEventListener('click', (e) => {
      const rect = progContainer.getBoundingClientRect();
      const pct = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
      this.seek(pct * this.duration);
    });

    if (window.smartBin) {
      window.smartBin.trailer = this;
    }
  }

  /**
   * Instantiates waste items (bottles and bags) attached to trash can group
   */
  initTrailerWaste() {
    if (this.trailerWasteGroup) {
      while (this.trailerWasteGroup.children.length > 0) {
        this.trailerWasteGroup.remove(this.trailerWasteGroup.children[0]);
      }
    } else {
      this.trailerWasteGroup = new THREE.Group();
      this.trailerWasteGroup.name = 'TrailerWasteGroup';
    }

    this.trailerWasteItems = [];
    if (!this.bottleModel || !this.garbageBagModel) return;

    // 16 waste items organized into 5 coordinated waves (1-2 bottles + 1-2 bags simultaneously per wave)
    // All start positions are placed IN FRONT OF and BELOW the tilted open lid (Y = 1.84 - 1.88, Z = 0.28 - 0.32) to prevent clipping
    const defs = [
      // Wave 0 (0.6s -> 1.25s): 2 bottles + 1 bag = 3 items (Bottom layer)
      { type: 'bottle', wave: 0, startTime: 0.60, duration: 0.65, landTime: 1.25,
        startPos: new THREE.Vector3(-0.10, 1.84, 0.30), rest: new THREE.Vector3(-0.08, 0.26,  0.03),
        rot: new THREE.Euler( 1.3,  0.4,  0.5), scale: 0.85 },
      { type: 'bottle', wave: 0, startTime: 0.60, duration: 0.65, landTime: 1.25,
        startPos: new THREE.Vector3( 0.10, 1.86, 0.28), rest: new THREE.Vector3( 0.08, 0.28, -0.04),
        rot: new THREE.Euler(-1.1,  0.6, -0.4), scale: 0.85 },
      { type: 'bag',    wave: 0, startTime: 0.60, duration: 0.65, landTime: 1.25,
        startPos: new THREE.Vector3( 0.00, 1.85, 0.32), rest: new THREE.Vector3( 0.01, 0.34,  0.01),
        rot: new THREE.Euler( 0.2, -0.4,  0.3), scale: 0.75 },

      // Wave 1 (1.35s -> 2.00s): 2 bottles + 1 bag = 3 items (Lower-mid layer)
      { type: 'bottle', wave: 1, startTime: 1.35, duration: 0.65, landTime: 2.00,
        startPos: new THREE.Vector3(-0.09, 1.85, 0.29), rest: new THREE.Vector3(-0.07, 0.55,  0.04),
        rot: new THREE.Euler( 0.5, -0.9,  1.1), scale: 0.85 },
      { type: 'bag',    wave: 1, startTime: 1.35, duration: 0.65, landTime: 2.00,
        startPos: new THREE.Vector3( 0.02, 1.86, 0.31), rest: new THREE.Vector3(-0.02, 0.62,  0.02),
        rot: new THREE.Euler( 0.3,  1.0, -0.4), scale: 0.75 },
      { type: 'bottle', wave: 1, startTime: 1.35, duration: 0.65, landTime: 2.00,
        startPos: new THREE.Vector3( 0.10, 1.84, 0.30), rest: new THREE.Vector3( 0.08, 0.58, -0.05),
        rot: new THREE.Euler(-0.7,  0.5, -0.6), scale: 0.85 },

      // Wave 2 (2.10s -> 2.75s): 2 bottles + 2 bags = 4 items (Mid layer)
      { type: 'bottle', wave: 2, startTime: 2.10, duration: 0.65, landTime: 2.75,
        startPos: new THREE.Vector3(-0.11, 1.86, 0.29), rest: new THREE.Vector3(-0.07, 0.85, -0.04),
        rot: new THREE.Euler(-0.9,  0.7,  1.2), scale: 0.85 },
      { type: 'bag',    wave: 2, startTime: 2.10, duration: 0.65, landTime: 2.75,
        startPos: new THREE.Vector3(-0.04, 1.84, 0.31), rest: new THREE.Vector3(-0.03, 0.92,  0.03),
        rot: new THREE.Euler(-0.3,  0.5,  0.6), scale: 0.75 },
      { type: 'bag',    wave: 2, startTime: 2.10, duration: 0.65, landTime: 2.75,
        startPos: new THREE.Vector3( 0.04, 1.85, 0.31), rest: new THREE.Vector3( 0.03, 0.95, -0.02),
        rot: new THREE.Euler( 0.4, -0.6,  0.5), scale: 0.75 },
      { type: 'bottle', wave: 2, startTime: 2.10, duration: 0.65, landTime: 2.75,
        startPos: new THREE.Vector3( 0.11, 1.86, 0.29), rest: new THREE.Vector3( 0.08, 0.88,  0.05),
        rot: new THREE.Euler( 1.1, -0.4,  0.7), scale: 0.85 },

      // Wave 3 (2.85s -> 3.50s): 2 bottles + 1 bag = 3 items (Upper layer)
      { type: 'bottle', wave: 3, startTime: 2.85, duration: 0.65, landTime: 3.50,
        startPos: new THREE.Vector3(-0.10, 1.85, 0.30), rest: new THREE.Vector3(-0.07, 1.15,  0.04),
        rot: new THREE.Euler( 0.6, -1.0,  0.4), scale: 0.85 },
      { type: 'bag',    wave: 3, startTime: 2.85, duration: 0.65, landTime: 3.50,
        startPos: new THREE.Vector3( 0.00, 1.87, 0.32), rest: new THREE.Vector3( 0.00, 1.22,  0.02),
        rot: new THREE.Euler( 0.2, -0.7,  0.8), scale: 0.75 },
      { type: 'bottle', wave: 3, startTime: 2.85, duration: 0.65, landTime: 3.50,
        startPos: new THREE.Vector3( 0.10, 1.85, 0.30), rest: new THREE.Vector3( 0.07, 1.18, -0.04),
        rot: new THREE.Euler(-1.2,  0.4, -0.7), scale: 0.85 },

      // Wave 4 (3.60s -> 4.25s): 2 bottles + 1 bag = 3 items (Top overflow layer)
      { type: 'bottle', wave: 4, startTime: 3.60, duration: 0.65, landTime: 4.25,
        startPos: new THREE.Vector3(-0.09, 1.86, 0.29), rest: new THREE.Vector3(-0.06, 1.42, -0.03),
        rot: new THREE.Euler(-0.7, -0.8,  1.1), scale: 0.85 },
      { type: 'bag',    wave: 4, startTime: 3.60, duration: 0.65, landTime: 4.25,
        startPos: new THREE.Vector3( 0.01, 1.88, 0.31), rest: new THREE.Vector3( 0.02, 1.50,  0.02),
        rot: new THREE.Euler(-0.3,  0.6,  0.4), scale: 0.75 },
      { type: 'bottle', wave: 4, startTime: 3.60, duration: 0.65, landTime: 4.25,
        startPos: new THREE.Vector3( 0.09, 1.86, 0.29), rest: new THREE.Vector3( 0.06, 1.45,  0.04),
        rot: new THREE.Euler( 1.3,  0.3, -0.5), scale: 0.85 }
    ];

    defs.forEach((def, idx) => {
      const mesh = def.type === 'bag'
        ? this.garbageBagModel.createInstance()
        : this.bottleModel.createInstance();
      mesh.scale.setScalar(def.scale);
      mesh.visible = false;
      this.trailerWasteGroup.add(mesh);
      this.trailerWasteItems.push({
        index: idx,
        type: def.type,
        wave: def.wave,
        startTime: def.startTime,
        duration: def.duration,
        landTime: def.landTime,
        startPos: def.startPos,
        restPos: def.rest,
        restRot: def.rot,
        scale: def.scale,
        mesh
      });
    });

    if (this.trashCan && this.trashCan.group) {
      this.trashCan.group.add(this.trailerWasteGroup);
    }
  }

  /**
   * Resets the interactive camera to an optimal free-view angle
   */
  resetCameraView() {
    if (!this.world || !this.world.controls) return;
    this.world.controls.target.set(-2.4, 0.9, 0.3);
    this.camera.position.set(-6.2, 2.5, -4.2);
    this.world.controls.update();
  }

  /**
   * Returns road surface elevation along Z so truck tires stay flush on asphalt
   */
  getRoadY(z) {
    return -0.055;
  }

  /**
   * Returns truck lane center in X along the road
   */
  getTruckX(z) {
    return -4.00;
  }

  /**
   * Returns truck heading angle to match road curvature
   */
  getTruckHeading() {
    return 0.0;
  }

  /**
   * Preloads street_2.glb and tri-county_sanitation_rear_loader.glb
   */
  async loadModels() {
    if (this.isLoaded) return true;
    this.isLoading = true;

    if (this.loadingSpinner) {
      this.loadingSpinner.classList.remove('hidden');
    }

    const loader = new GLTFLoader();
    const streetPath = APP_CONFIG.PATHS?.STREET_GLB || '/models/street_2.glb';
    const truckPath = APP_CONFIG.PATHS?.TRUCK_GLB || '/models/tri-county_sanitation_rear_loader.glb';

    try {
      console.log('[Trailer] Đang nạp bối cảnh phố và xe rác...');

      const [streetGltf, truckGltf] = await Promise.all([
        loader.loadAsync(streetPath),
        loader.loadAsync(truckPath)
      ]);

      // 1. Setup Street Model
      this.streetGroup = new THREE.Group();
      this.streetGroup.name = 'CinematicStreet';

      const streetScene = streetGltf.scene;
      // Scale from centimeters to meters: 0.01
      streetScene.scale.setScalar(0.01);
      // Center the road horizontally so road center aligns with X = 0
      streetScene.position.set(1.26, -0.03, 0);

      streetScene.traverse((child) => {
        if (child.isMesh) {
          const name = child.name || '';
          // Only road (Material2_1) and sidewalk (Material2_9, Material2_5) receive shadows
          const isGround = name === 'Material2_1' || name === 'Material2_9' || name === 'Material2_5';
          child.receiveShadow = isGround;
          child.castShadow = false;

          // Convert heavy PBR MeshStandardMaterial of background buildings to lightweight MeshLambertMaterial
          if (child.material) {
            const mats = Array.isArray(child.material) ? child.material : [child.material];
            const newMats = mats.map((oldMat) => {
              if (isGround) {
                if (oldMat.isMeshStandardMaterial) {
                  oldMat.roughness = Math.max(oldMat.roughness || 0.6, 0.45);
                }
                return oldMat;
              }
              // For all background building meshes, replace standard PBR with high-speed Lambert material
              if (oldMat.isMeshStandardMaterial) {
                const lambert = new THREE.MeshLambertMaterial({
                  map: oldMat.map || null,
                  color: oldMat.color || 0xffffff,
                  transparent: oldMat.transparent || false,
                  opacity: oldMat.opacity !== undefined ? oldMat.opacity : 1.0,
                  side: oldMat.side || THREE.FrontSide
                });
                return lambert;
              }
              return oldMat;
            });
            child.material = Array.isArray(child.material) ? newMats : newMats[0];
          }
        }
      });
      this.streetGroup.add(streetScene);
      this.streetGroup.visible = false;
      this.scene.add(this.streetGroup);

      // 2. Setup Sanitation Truck Model
      this.truckGroup = new THREE.Group();
      this.truckGroup.name = 'SanitationTruck';

      const truckScene = truckGltf.scene;
      // Compensate for GLTF model's internal 6.19-degree skew so truck runs 100% straight
      truckScene.rotation.y = -0.108;

      // Auto-center and ground the truck model accurately
      const rawBox = new THREE.Box3().setFromObject(truckScene);
      const rawCenter = new THREE.Vector3();
      rawBox.getCenter(rawCenter);
      truckScene.position.x = -rawCenter.x;
      truckScene.position.y = -rawBox.min.y;
      truckScene.position.z = -rawCenter.z;

      truckScene.traverse((child) => {
        if (child.isMesh) {
          child.castShadow = true;
          child.receiveShadow = true;
        }
      });

      // Wrap inside truckGroup with realistic truck scale (scale: 0.18)
      this.truckGroup.scale.setScalar(0.18);
      this.truckGroup.add(truckScene);

      // Add Headlights (Spotlights) in local unscaled coordinates (scale 0.18 applied to group)
      const headlightColor = 0xfffaed; // Warm automotive xenon light
      const leftLight = new THREE.SpotLight(headlightColor, 6.0, 30, Math.PI * 0.25, 0.4, 1.2);
      leftLight.position.set(-5.0, 6.0, 19.5);
      leftLight.target.position.set(-5.0, 0, 70.0);
      leftLight.castShadow = false;
      this.truckGroup.add(leftLight);
      this.truckGroup.add(leftLight.target);

      const rightLight = new THREE.SpotLight(headlightColor, 6.0, 30, Math.PI * 0.25, 0.4, 1.2);
      rightLight.position.set(5.0, 6.0, 19.5);
      rightLight.target.position.set(5.0, 0, 70.0);
      rightLight.castShadow = false;
      this.truckGroup.add(rightLight);
      this.truckGroup.add(rightLight.target);

      // Headlight glow spheres
      const glowGeo = new THREE.SphereGeometry(0.8, 12, 12);
      const glowMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
      const leftBulb = new THREE.Mesh(glowGeo, glowMat);
      leftBulb.position.set(-5.0, 6.0, 19.5);
      this.truckGroup.add(leftBulb);

      const rightBulb = new THREE.Mesh(glowGeo, glowMat);
      rightBulb.position.set(5.0, 6.0, 19.5);
      this.truckGroup.add(rightBulb);

      // Cab warning beacon light (amber flashing)
      this.beaconLight = new THREE.PointLight(0xf59e0b, 3.5, 15);
      this.beaconLight.position.set(0, 15.0, 10.0);
      this.beaconLight.castShadow = false;
      this.truckGroup.add(this.beaconLight);

      this.truckGroup.position.set(
        this.getTruckX(this.TRUCK_START_Z),
        this.getRoadY(this.TRUCK_START_Z),
        this.TRUCK_START_Z
      );
      this.truckGroup.rotation.y = this.getTruckHeading();
      this.truckGroup.visible = false;
      this.scene.add(this.truckGroup);

      this.isLoaded = true;
      this.isLoading = false;

      if (this.loadingSpinner) {
        this.loadingSpinner.classList.add('hidden');
      }

      console.log('[Trailer] Đã nạp hoàn tất toàn bộ mô hình Trailer!');
      return true;
    } catch (err) {
      console.error('[Trailer] Lỗi khi nạp mô hình đường phố hoặc xe rác:', err);
      this.isLoading = false;
      if (this.loadingSpinner) {
        this.loadingSpinner.classList.add('hidden');
      }
      return false;
    }
  }

  /**
   * Starts the cinematic trailer playback
   */
  async start() {
    if (this.isActive) return;

    // Ensure main app models (smart trash can) are completely loaded
    if (window.app && window.app.modelsLoadedPromise) {
      await window.app.modelsLoadedPromise;
    }

    // Load models if not yet ready
    if (!this.isLoaded) {
      const ok = await this.loadModels();
      if (!ok) {
        alert('Không tải được model đường phố hoặc xe rác. Vui lòng kiểm tra lại file trong thư mục models!');
        return;
      }
    }

    this.isActive = true;
    this.isPlaying = true;
    this.currentTime = 0;

    // Save camera & controls
    this.originalCameraPos.copy(this.camera.position);
    this.originalControlsTarget.copy(this.world.controls.target);

    // Keep OrbitControls enabled for free 360-degree interactive camera
    this.world.controls.enabled = true;
    this.resetCameraView();

    // Hide studio floor & elements
    this.world.hideStudioElements();

    // Show street and truck
    if (this.streetGroup) this.streetGroup.visible = true;
    if (this.truckGroup) this.truckGroup.visible = true;

    // Move Smart Trash Can to sidewalk and scale down exclusively for movie mode
    if (this.trashCan && this.trashCan.group) {
      this.trashCan.group.position.copy(this.BIN_STREET_POS);
      this.trashCan.group.rotation.set(0, -Math.PI * 0.5, 0); // Face the street
      this.trashCan.group.scale.setScalar(0.48); // Small waist-height scale exclusively in movie trailer!
    }

    // Attach ultrasonic beam directly to trash can group
    if (this.ultrasonicBeam && this.trashCan && this.trashCan.group) {
      this.ultrasonicBeam.attachTo(this.trashCan.group);
    }

    // Initialize trailer waste items (bottles and bags)
    this.initTrailerWaste();
    this.lastSpawnSoundIndex = -1;

    // Hide normal HUD overlays
    const standardHud = document.querySelector('.hud-wrapper');
    const alertPill = document.getElementById('critical-alert-banner');
    const testPanel = document.getElementById('test-panel');
    if (standardHud) standardHud.style.display = 'none';
    if (alertPill) alertPill.style.display = 'none';
    if (testPanel) testPanel.style.display = 'none';

    // Reveal Cinematic Trailer HUD
    if (this.overlayContainer) {
      this.overlayContainer.classList.remove('hidden');
    }

    this.updatePlayBtnUI();
    this.applyFrame(0);
  }

  /**
   * Pauses the trailer
   */
  pause() {
    this.isPlaying = false;
    this.updatePlayBtnUI();
  }

  /**
   * Resumes the trailer
   */
  play() {
    if (this.currentTime >= this.duration) {
      this.currentTime = 0;
    }
    this.isPlaying = true;
    this.updatePlayBtnUI();
  }

  /**
   * Seeks to a specific timestamp in seconds
   */
  seek(timeInSeconds) {
    this.currentTime = Math.max(0, Math.min(this.duration, timeInSeconds));
    this.applyFrame(this.currentTime);
  }

  /**
   * Stops the trailer and restores the interactive 3D studio mode
   */
  stop() {
    this.isActive = false;
    this.isPlaying = false;
    this.currentTime = 0;

    // Hide street and truck
    if (this.streetGroup) this.streetGroup.visible = false;
    if (this.truckGroup) this.truckGroup.visible = false;

    // Restore Trash Can position, rotation and full 1.0 scale to center for studio mode
    if (this.trashCan && this.trashCan.group) {
      this.trashCan.group.position.set(0, 0, 0);
      this.trashCan.group.rotation.set(0, 0, 0);
      this.trashCan.group.scale.set(1, 1, 1); // Full size restored for 3D studio mode!
      this.trashCan.closeLid();
      this.trashCan.setLedColor(0x10b981); // Green
    }

    // Restore ultrasonic beam
    if (this.ultrasonicBeam) {
      if (this.trashCan && this.trashCan.group) {
        this.ultrasonicBeam.attachTo(this.trashCan.group);
      }
      this.ultrasonicBeam.setColor(0x10b981);
      this.ultrasonicBeam.update(0, true, 0);
    }

    // Clear trailer waste items
    if (this.trailerWasteItems) {
      this.trailerWasteItems.forEach(item => {
        if (item.mesh) item.mesh.visible = false;
      });
    }
    if (this.trailerWasteGroup && this.trailerWasteGroup.parent) {
      this.trailerWasteGroup.parent.remove(this.trailerWasteGroup);
    }

    // Restore studio floor
    this.world.showStudioElements();

    // Restore camera and OrbitControls
    this.camera.position.copy(this.originalCameraPos);
    this.world.controls.target.copy(this.originalControlsTarget);
    this.world.controls.enabled = true;
    this.world.controls.update();

    // Restore normal HUD overlays
    const standardHud = document.querySelector('.hud-wrapper');
    const testPanel = document.getElementById('test-panel');
    if (standardHud) standardHud.style.display = 'flex';
    if (testPanel) testPanel.style.display = 'block';

    // Hide Cinematic Trailer HUD
    if (this.overlayContainer) {
      this.overlayContainer.classList.add('hidden');
    }

    if (this.soundAlert) {
      this.soundAlert.stopAlarm();
    }

    this.onExit();
  }

  updatePlayBtnUI() {
    if (!this.playBtn) return;
    if (this.isPlaying) {
      this.playBtn.innerHTML = `
        <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
          <rect x="6" y="4" width="4" height="16"></rect>
          <rect x="14" y="4" width="4" height="16"></rect>
        </svg>
      `;
    } else {
      this.playBtn.innerHTML = `
        <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
          <polygon points="5 3 19 12 5 21 5 3"></polygon>
        </svg>
      `;
    }
  }

  /**
   * Main per-frame update called by render loop
   */
  update(delta) {
    if (!this.isActive) return;

    if (this.isPlaying) {
      this.currentTime += delta;
      if (this.currentTime >= this.duration) {
        this.currentTime = this.duration;
        this.pause();
      }
      this.applyFrame(this.currentTime);
    }

    // Animate beacon light (pulsing amber)
    if (this.beaconLight) {
      const pulse = 0.5 + 0.5 * Math.sin(this.currentTime * 12);
      this.beaconLight.intensity = 2.0 + pulse * 4.0;
    }
  }

  /**
   * Applies the exact state of camera, truck, bin, and overlays for a given timestamp
   */
  applyFrame(t) {
    // Update progress bar
    const progress = Math.min(1, t / this.duration);
    if (this.progressBar) {
      this.progressBar.style.width = `${progress * 100}%`;
    }

    // Format time (00:xx / 00:25)
    if (this.timeText) {
      const sec = Math.floor(t);
      const totalSec = Math.floor(this.duration);
      this.timeText.textContent = `00:${sec < 10 ? '0' + sec : sec} / 00:${totalSec}`;
    }

    // Highlight active chapter button
    const chapBtns = this.overlayContainer?.querySelectorAll('.chap-btn');
    if (chapBtns) {
      chapBtns.forEach(btn => {
        const time = parseFloat(btn.dataset.time || '0');
        const nextTime = time === 0 ? 4.5 : time === 4.5 ? 9.0 : time === 9.0 ? 15.0 : time === 15.0 ? 20.0 : 25.0;
        if (t >= time && t < nextTime) {
          btn.classList.add('active');
        } else {
          btn.classList.remove('active');
        }
      });
    }

    const alertBanner = document.getElementById('trailer-alert-banner');

    // =========================================================================
    // ACT 1 (0.0s - 4.5s): Citizens Drop Waste - Bottles & Bags Fill The Bin
    // =========================================================================
    if (t < 4.5) {
      // Truck stationary at start line
      if (this.truckGroup) {
        this.truckGroup.position.set(
          this.getTruckX(this.TRUCK_START_Z),
          this.getRoadY(this.TRUCK_START_Z),
          this.TRUCK_START_Z
        );
        this.truckGroup.rotation.set(0, this.getTruckHeading(), 0);
      }

      if (alertBanner) alertBanner.classList.add('hidden');
      if (this.soundAlert && this.soundAlert.isAlarmActive) {
        this.soundAlert.stopAlarm();
      }

      // Animate 16 waste items dropping in 5 coordinated waves (1-2 bottles + 1-2 bags together per wave)
      // Items enter smoothly from below the open lid (front aperture) without clipping
      let lidShouldOpen = false;
      let landedCount = 0;
      let highestLandedWave = -1;

      // Keep motorized lid open smoothly during waste disposal sequence
      if (t >= 0.40 && t <= 4.35) {
        lidShouldOpen = true;
      }

      if (this.trailerWasteItems && this.trailerWasteItems.length > 0) {
        this.trailerWasteItems.forEach((item) => {
          if (t < item.startTime) {
            // Not yet dropped
            item.mesh.visible = false;
          } else if (t >= item.startTime && t < item.landTime) {
            // Currently dropping into the bin below the tilted lid
            item.mesh.visible = true;

            const prog = (t - item.startTime) / item.duration;
            // Smooth gravitational acceleration curve:
            const easeY = Math.pow(prog, 1.35);

            // Interpolate smoothly from startPos (below lid, in front) into resting position inside bin
            item.mesh.position.set(
              THREE.MathUtils.lerp(item.startPos.x, item.restPos.x, prog),
              THREE.MathUtils.lerp(item.startPos.y, item.restPos.y, easeY),
              THREE.MathUtils.lerp(item.startPos.z, item.restPos.z, prog)
            );

            // Gentle realistic tumbling as it falls
            const tumble = (1.0 - prog);
            item.mesh.rotation.set(
              item.restRot.x + tumble * 1.5,
              item.restRot.y + tumble * 1.0,
              item.restRot.z + tumble * 0.8
            );
          } else {
            // Item has landed inside the bin
            item.mesh.visible = true;
            item.mesh.position.copy(item.restPos);
            item.mesh.rotation.copy(item.restRot);
            landedCount++;
            if (item.wave > highestLandedWave) {
              highestLandedWave = item.wave;
            }
          }
        });

        // Trigger drop sound once per wave as each cluster lands
        if (this.isPlaying && highestLandedWave > this.lastSpawnSoundIndex) {
          this.lastSpawnSoundIndex = highestLandedWave;
          if (this.soundAlert) {
            this.soundAlert.playBottleDrop();
          }
        }
      }

      // Motorized lid reacts to dropping waste
      if (this.trashCan) {
        if (lidShouldOpen) {
          this.trashCan.openLid();
        } else {
          this.trashCan.closeLid();
        }
        this.trashCan.setLedColor(0x10b981);
      }

      // Calculate fill percentage based on landed items (0% -> 100%)
      const totalCount = this.trailerWasteItems?.length || 16;
      const fillPct = THREE.MathUtils.clamp((landedCount / totalCount) * 100, 0, 100);
      if (this.ultrasonicBeam) {
        this.ultrasonicBeam.setColor(0x10b981);
        this.ultrasonicBeam.update(fillPct, true, t);
      }
    }

    // =========================================================================
    // ACT 2 (4.5s - 9.0s): Critical Waste Overflow Event & Emergency Alarm
    // =========================================================================
    else if (t < 9.0) {
      const actProgress = (t - 4.5) / 4.5;

      // Truck waiting at start line
      if (this.truckGroup) {
        this.truckGroup.position.set(
          this.getTruckX(this.TRUCK_START_Z),
          this.getRoadY(this.TRUCK_START_Z),
          this.TRUCK_START_Z
        );
        this.truckGroup.rotation.set(0, this.getTruckHeading(), 0);
      }

      // All 6 items visible inside bin
      if (this.trailerWasteItems) {
        this.trailerWasteItems.forEach(item => {
          item.mesh.visible = true;
          item.mesh.position.copy(item.restPos);
          item.mesh.rotation.copy(item.restRot);
        });
      }

      // Flash bin LED red & trigger alarm sound
      const isBlink = Math.sin(t * 14) > 0;
      const redColor = isBlink ? 0xef4444 : 0x7f1d1d;

      if (this.trashCan) {
        this.trashCan.closeLid();
        this.trashCan.setLedColor(redColor);
      }

      if (this.ultrasonicBeam) {
        this.ultrasonicBeam.setColor(redColor);
        this.ultrasonicBeam.update(100, true, t);
      }

      // Play emergency alarm
      if (this.soundAlert && !this.soundAlert.isAlarmActive && actProgress > 0.15) {
        this.soundAlert.startAlarm();
      }

      if (alertBanner) {
        alertBanner.classList.remove('hidden');
      }
    }

    // =========================================================================
    // ACT 3 (9.0s - 15.0s): Sanitation Truck Arrival & Braking
    // =========================================================================
    else if (t < 15.0) {
      const actProgress = (t - 9.0) / 6.0;
      const easeDrive = this.easeOutCubic(actProgress);

      // Truck drives down avenue from START_Z to STOP_Z
      const currentZ = THREE.MathUtils.lerp(this.TRUCK_START_Z, this.TRUCK_STOP_Z, easeDrive);
      if (this.truckGroup) {
        this.truckGroup.position.set(
          this.getTruckX(currentZ),
          this.getRoadY(currentZ),
          currentZ
        );
        this.truckGroup.rotation.y = this.getTruckHeading();

        // Realistic braking suspension tilt: tilts forward slightly as it decelerates
        const brakeTilt = (actProgress > 0.6 && actProgress < 0.95) ? 0.018 * (1 - (actProgress - 0.6) / 0.35) : 0;
        this.truckGroup.rotation.x = brakeTilt;
      }

      if (this.soundAlert && this.soundAlert.isAlarmActive) {
        this.soundAlert.stopAlarm();
      }

      if (alertBanner) alertBanner.classList.add('hidden');

      // All items stay inside bin at 100% fill
      if (this.trailerWasteItems) {
        this.trailerWasteItems.forEach(item => {
          item.mesh.visible = true;
          item.mesh.position.copy(item.restPos);
          item.mesh.rotation.copy(item.restRot);
        });
      }

      if (this.trashCan) {
        this.trashCan.closeLid();
        this.trashCan.setLedColor(0xef4444);
      }

      if (this.ultrasonicBeam) {
        this.ultrasonicBeam.setColor(0xef4444);
        this.ultrasonicBeam.update(100, true, t);
      }
    }

    // =========================================================================
    // ACT 4 (15.0s - 20.0s): Automated Emptying & Clean Green Reset
    // =========================================================================
    else if (t < 20.0) {
      const actProgress = (t - 15.0) / 5.0;

      // Truck stationary at stop position
      if (this.truckGroup) {
        this.truckGroup.position.set(
          this.getTruckX(this.TRUCK_STOP_Z),
          this.getRoadY(this.TRUCK_STOP_Z),
          this.TRUCK_STOP_Z
        );
        this.truckGroup.rotation.set(0, this.getTruckHeading(), 0);
      }

      // Motorized lid opens wide during collection, then closes
      if (this.trashCan) {
        if (actProgress > 0.05 && actProgress < 0.72) {
          this.trashCan.openLid();
        } else {
          this.trashCan.closeLid();
        }
      }

      // Waste items lift vertically out through the top mouth opening (never clip walls),
      // then arc over the rim into the truck's rear hopper
      if (this.trailerWasteItems) {
        const MOUTH_Y = 2.18; // Well above the top rim so item clears the aperture
        const MOUTH_Z = 0.12; // In front half of mouth opening, clear of tilted lid
        const LIFT_SPLIT = 0.35; // 35% time lifting vertically, 65% time arcing to truck

        this.trailerWasteItems.forEach((item) => {
          // Empty top layer first down to bottom layer (reverse wave order)
          const reverseWave = 4 - (item.wave ?? 0);
          const itemOffset = (item.index % 3) * 0.018;
          const itemEmptyStart = 0.10 + reverseWave * 0.09 + itemOffset;
          const itemEmptyDuration = 0.18;

          if (actProgress < itemEmptyStart) {
            // Still in the bin
            item.mesh.visible = true;
            item.mesh.position.copy(item.restPos);
            item.mesh.rotation.copy(item.restRot);
          } else if (actProgress >= itemEmptyStart && actProgress < itemEmptyStart + itemEmptyDuration) {
            item.mesh.visible = true;
            const pourProg = (actProgress - itemEmptyStart) / itemEmptyDuration;

            if (pourProg < LIFT_SPLIT) {
              // PHASE 1: Lift straight up through the top mouth of the bin
              // Strictly stays inside the chute cylinder (Z <= 0.12, X -> 0.0) until passing Y = MOUTH_Y
              const liftProg = pourProg / LIFT_SPLIT;
              const easeLift = Math.pow(liftProg, 1.25);

              item.mesh.position.set(
                THREE.MathUtils.lerp(item.restPos.x, 0.0, easeLift),
                THREE.MathUtils.lerp(item.restPos.y, MOUTH_Y, easeLift),
                THREE.MathUtils.lerp(item.restPos.z, MOUTH_Z, easeLift)
              );
              item.mesh.rotation.set(
                THREE.MathUtils.lerp(item.restRot.x, 0.2, liftProg),
                THREE.MathUtils.lerp(item.restRot.y, 0.0, liftProg),
                THREE.MathUtils.lerp(item.restRot.z, 0.1, liftProg)
              );
            } else {
              // PHASE 2: Having exited through the top mouth, arc over the rim into the truck rear hopper
              const arcProg = (pourProg - LIFT_SPLIT) / (1.0 - LIFT_SPLIT);
              const arcY = Math.sin(arcProg * Math.PI) * 0.65;

              item.mesh.position.set(
                THREE.MathUtils.lerp(0.0, 0.05, arcProg),
                THREE.MathUtils.lerp(MOUTH_Y, 2.60, arcProg) + arcY,
                THREE.MathUtils.lerp(MOUTH_Z, 3.80, arcProg)
              );
              item.mesh.rotation.set(
                0.2 + arcProg * 4.5,
                arcProg * 3.0,
                0.1 + arcProg * 2.5
              );
            }
          } else {
            // Emptied into truck
            item.mesh.visible = false;
          }
        });
      }

      // Fill drains down from 100% to 0%
      const fillProgress = Math.max(0, Math.min(1, (actProgress - 0.10) / 0.55));
      const currentFill = Math.round(100 * (1 - fillProgress));

      // Status color transitions to emerald green
      const isGreen = actProgress > 0.65;
      const activeColor = isGreen ? 0x10b981 : 0xef4444;

      if (this.trashCan) {
        this.trashCan.setLedColor(activeColor);
      }

      if (this.ultrasonicBeam) {
        this.ultrasonicBeam.setColor(activeColor);
        this.ultrasonicBeam.update(currentFill, true, t);
      }

      if (alertBanner) alertBanner.classList.add('hidden');
    }

    // =========================================================================
    // ACT 5 (20.0s - 25.0s): Truck Departure & Clean Smart City Finale
    // =========================================================================
    else {
      const actProgress = (t - 20.0) / 5.0;
      const easeDepart = this.easeInCubic(actProgress);

      // Truck departs down avenue along +Z
      const currentZ = THREE.MathUtils.lerp(this.TRUCK_STOP_Z, this.TRUCK_DEPART_Z, easeDepart);
      if (this.truckGroup) {
        this.truckGroup.position.set(
          this.getTruckX(currentZ),
          this.getRoadY(currentZ),
          currentZ
        );
        this.truckGroup.rotation.y = this.getTruckHeading();
        this.truckGroup.rotation.x = -0.012 * (1 - easeDepart);
      }

      // All waste items hidden
      if (this.trailerWasteItems) {
        this.trailerWasteItems.forEach(item => {
          item.mesh.visible = false;
        });
      }

      // Clean empty smart bin
      if (this.trashCan) {
        this.trashCan.setLedColor(0x10b981);
        if (typeof this.trashCan.closeLidInstant === 'function') {
          this.trashCan.closeLidInstant();
        } else {
          this.trashCan.closeLid();
        }
      }

      if (this.ultrasonicBeam) {
        this.ultrasonicBeam.setColor(0x10b981);
        this.ultrasonicBeam.update(0, true, t);
      }

      if (alertBanner) alertBanner.classList.add('hidden');
    }
  }

  // Easing helpers
  easeInOutQuad(x) {
    return x < 0.5 ? 2 * x * x : 1 - Math.pow(-2 * x + 2, 2) / 2;
  }
  easeInOutCubic(x) {
    return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
  }
  easeOutCubic(x) {
    return 1 - Math.pow(1 - x, 3);
  }
  easeInCubic(x) {
    return x * x * x;
  }
}

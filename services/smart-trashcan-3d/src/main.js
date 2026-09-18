import * as THREE from 'three';
import { APP_CONFIG } from './config.js';
import { World } from './scene/World.js';
import { UltrasonicBeam } from './scene/UltrasonicBeam.js';
import { PhysicsWorld } from './physics/PhysicsWorld.js';
import { TrashCanModel } from './models/TrashCanModel.js';
import { BottleModel } from './models/BottleModel.js';
import { GarbageBagModel } from './models/GarbageBagModel.js';
import { BottleSpawner } from './physics/BottleSpawner.js';
import { SoundAlert } from './iot/SoundAlert.js';
import { SensorManager } from './iot/SensorManager.js';
import { DashboardHUD } from './ui/DashboardHUD.js';
import { Controls } from './ui/Controls.js';
import { CinematicTrailer } from './scene/CinematicTrailer.js';

window.THREE = THREE;

class SmartTrashCanApp {
  constructor() {
    window.app = this;
    this.canvas = document.getElementById('webgl-canvas');
    this.clock = new THREE.Clock();

    // Core systems
    this.world = null;
    this.physicsWorld = null;
    this.ultrasonicBeam = null;
    this.trashCan = null;
    this.bottleModel = null;
    this.garbageBagModel = null;
    this.bottleSpawner = null;
    this.soundAlert = null;
    this.sensorManager = null;
    this.hud = null;
    this.controls = null;
    this.cinematicTrailer = null;

    // Interaction states
    this.autoFillInterval = null;
    this.lidCloseTimeout = null;
    this.isBeamVisible = true;
    this.isSoundEnabled = true;

    // Status colors
    this.statusColors = {
      NORMAL: 0x10b981,       // Clean emerald green
      CAUTION: 0xf59e0b,      // Amber
      CRITICAL_FULL: 0xef4444, // Red
      SENSOR_FAULT: 0xa855f7  // Purple
    };
  }

  async init() {
    console.log('[App] Khởi tạo Smart Waste Bin IoT với 3 Model 3D từ người dùng...');

    // 1. Initialize 3D World (Clean White Studio Scene)
    this.world = new World(this.canvas);

    // 2. Initialize Physics Engine (Cannon-es)
    this.physicsWorld = new PhysicsWorld();

    // 3. Initialize Ultrasonic 3D Cone Beam
    this.ultrasonicBeam = new UltrasonicBeam(this.world.scene);

    // 4. Initialize Audio & IoT Sensor Manager
    this.soundAlert = new SoundAlert();
    this.hud = new DashboardHUD();

    // 5. Initialize Models Containers
    this.trashCan = new TrashCanModel();
    this.bottleModel = new BottleModel();
    this.garbageBagModel = new GarbageBagModel();

    // 6. Initialize Physics Spawner
    this.bottleSpawner = new BottleSpawner(
      this.world.scene,
      this.physicsWorld,
      this.bottleModel,
      this.garbageBagModel
    );

    this.sensorManager = new SensorManager(this.bottleSpawner, APP_CONFIG);

    if (this.hud && typeof this.hud.setOnVerifyFault === 'function') {
      this.hud.setOnVerifyFault(() => {
        if (this.sensorManager) {
          this.sensorManager.verifyFault();
        }
      });
    }

    // 7. Initialize Controls
    this.controls = new Controls({
      onDropBottle: () => this.handleDropBottle(),
      onDropBag: () => this.handleDropBag(),
      onToggleAutoFill: (isActive) => this.handleToggleAutoFill(isActive),
      onResetBin: () => this.handleResetBin(),
      onStartTrailer: () => {
        if (this.cinematicTrailer) {
          this.cinematicTrailer.start();
        }
      }
    });

    // 7.1 Initialize Cinematic Trailer Manager (Street & Truck models)
    this.cinematicTrailer = new CinematicTrailer({
      world: this.world,
      trashCan: this.trashCan,
      ultrasonicBeam: this.ultrasonicBeam,
      sensorManager: this.sensorManager,
      bottleSpawner: this.bottleSpawner,
      bottleModel: this.bottleModel,
      garbageBagModel: this.garbageBagModel,
      soundAlert: this.soundAlert,
      onExit: () => {
        console.log('[App] Đã thoát chế độ trailer, khôi phục studio 3D.');
      }
    });

    // 8. Setup Microservice Bridge & Test Menu immediately (responsive from DOM ready)
    this.setupMicroserviceBridge();
    this.setupTestPanel();

    // Start render loop immediately
    this.animate = this.animate.bind(this);
    requestAnimationFrame(this.animate);

    // 9. Load user 3D models concurrently
    console.log('[App] Đang nạp 3 model 3D...');
    this.modelsLoadedPromise = Promise.all([
      this.trashCan.init(this.world.scene),
      this.bottleModel.init(),
      this.garbageBagModel.init()
    ]);
    await this.modelsLoadedPromise;
    this.modelsReady = true;
    this.ultrasonicBeam.attachTo(this.trashCan.group);
    console.log('[App] Đã nạp thành công toàn bộ 3 Model 3D!');
    if (this.sensorManager) {
      this.sensorManager.lastUpdateTime = Date.now();
    }

    // Optional automated test via URL query (?test=1 or ?overflow=1)
    if (window.location.search.includes('test') || window.location.search.includes('overflow')) {
      const maxCount = window.location.search.includes('overflow') ? 36 : 18;
      console.log(`[App] Auto-test parameter detected. Dropping ${maxCount} waste items...`);
      setTimeout(() => {
        let count = 0;
        const testInterval = setInterval(() => {
          if (count % 3 === 0) {
            this.handleDropBag();
          } else {
            this.handleDropBottle();
          }
          count++;
          if (count >= maxCount) clearInterval(testInterval);
        }, 35);
      }, 150);
    }

    console.log('[App] Hoàn tất nạp 3 Model và sẵn sàng mô phỏng!');
  }

  handleDropBottle() {
    this.openLidTemporary();
    this.bottleSpawner.spawnBottle();
    if (this.isSoundEnabled) {
      this.soundAlert.playBottleDrop();
    }
  }

  handleDropBag() {
    this.openLidTemporary();
    this.bottleSpawner.spawnGarbageBag();
    if (this.isSoundEnabled) {
      this.soundAlert.playBottleDrop();
    }
  }

  openLidTemporary() {
    if (!this.trashCan) return;

    const wasOpen = this.trashCan.isLidOpen;
    this.trashCan.openLid();

    if (!wasOpen && this.isSoundEnabled) {
      this.soundAlert.playServoOpen();
    }

    if (this.lidCloseTimeout) {
      clearTimeout(this.lidCloseTimeout);
    }

    this.lidCloseTimeout = setTimeout(() => {
      if (this.trashCan) {
        this.trashCan.closeLid();
        if (this.isSoundEnabled) {
          this.soundAlert.playServoClose();
        }
      }
    }, APP_CONFIG.IOT.LID_AUTO_CLOSE_DELAY_MS);
  }

  handleToggleAutoFill(isActive) {
    if (isActive) {
      let step = 0;
      this.autoFillInterval = setInterval(() => {
        const state = this.sensorManager ? this.sensorManager.getState() : null;
        if (state && state.fillPct >= 100) {
          this.controls.setAutoFillState(false);
          this.handleToggleAutoFill(false);
          return;
        }
        step++;
        if (step % 3 === 0) {
          this.handleDropBag();
        } else {
          this.handleDropBottle();
        }
      }, 1000);
      this.handleDropBottle();
    } else {
      if (this.autoFillInterval) {
        clearInterval(this.autoFillInterval);
        this.autoFillInterval = null;
      }
    }
  }

  handleResetBin() {
    if (this.autoFillInterval) {
      this.controls.setAutoFillState(false);
      this.handleToggleAutoFill(false);
    }

    this.bottleSpawner.clearAll();

    if (this.sensorManager && this.sensorManager.reset) {
      this.sensorManager.reset();
    }

    this.soundAlert.stopAlarm();

    if (this.trashCan) {
      this.trashCan.closeLid();
      this.trashCan.setLedColor(this.statusColors.NORMAL);
    }

    if (this.ultrasonicBeam) {
      this.ultrasonicBeam.setColor(this.statusColors.NORMAL);
      this.ultrasonicBeam.update(0, this.isBeamVisible, 0);
    }

    const emptyState = this.sensorManager ? this.sensorManager.getState() : {
      fillLevel: 0,
      fillPct: 0,
      odorDetected: false,
      batteryLevel: 98,
      updatedAt: '00:00:00',
      distanceCm: 220,
      count: 0,
      weightKg: '0.00',
      status: 'NORMAL',
      topY: 0
    };
    this.hud.update(emptyState, false);
    this.postToParent('BIN_RESET', emptyState);
  }

  /**
   * Configures postMessage API & URL embedding options for parent web applications
   */
  setupMicroserviceBridge() {
    const params = new URLSearchParams(window.location.search);

    // ?embed=1 or ?nobuttons=1: hide bottom control buttons for custom parent UI
    if (params.get('embed') === '1' || params.get('nobuttons') === '1') {
      const bottomBar = document.querySelector('.bottom-bar');
      if (bottomBar) bottomBar.style.display = 'none';
    }

    // ?nohud=1 or ?minimal=1: hide HUD overlays (pure 3D scene only)
    if (params.get('nohud') === '1' || params.get('minimal') === '1') {
      const hud = document.querySelector('.hud-wrapper');
      const alertPill = document.getElementById('critical-alert-banner');
      if (hud) hud.style.display = 'none';
      if (alertPill) alertPill.style.display = 'none';
    }

    // ?bg=transparent: transparent background for seamless embedding
    if (params.get('bg') === 'transparent' && this.world) {
      this.world.scene.background = null;
      this.world.renderer.setClearColor(0x000000, 0);
      document.body.style.backgroundColor = 'transparent';
    }

    // ?fault=LOW_BATTERY | SIGNAL_LOSS | ANOMALY_JUMP: auto-simulate fault for testing
    const faultParam = params.get('fault');
    if (faultParam && this.sensorManager) {
      setTimeout(() => {
        this.sensorManager.simulateFault(faultParam);
      }, 400);
    }

    // ?trailer=1: auto-start cinematic trailer on page load
    if (params.get('trailer') === '1') {
      const triggerTrailer = () => {
        if (this.cinematicTrailer) {
          this.cinematicTrailer.start();
        }
      };
      if (this.modelsLoadedPromise) {
        this.modelsLoadedPromise.then(() => setTimeout(triggerTrailer, 100));
      } else {
        setTimeout(triggerTrailer, 700);
      }
    }

    // Expose developer console test helper
    window.smartBin = {
      trailer: this.cinematicTrailer,
      simulateFault: (faultType = 'LOW_BATTERY') => this.sensorManager?.simulateFault(faultType),
      verifyFault: () => this.sensorManager?.verifyFault(),
      injectTelemetry: (data) => this.sensorManager?.injectTelemetry(data),
      dropBottle: () => this.handleDropBottle(),
      dropBag: () => this.handleDropBag(),
      resetBin: () => this.handleResetBin(),
      startTrailer: () => this.cinematicTrailer?.start(),
      stopTrailer: () => this.cinematicTrailer?.stop(),
      seekTrailer: (t) => this.cinematicTrailer?.seek(t),
      getState: () => this.sensorManager?.getState()
    };

    // Listen for incoming postMessage commands from parent web apps
    window.addEventListener('message', (event) => {
      const data = event.data;
      if (!data || typeof data !== 'object') return;

      switch (data.type) {
        case 'START_TRAILER':
        case 'PLAY_TRAILER':
          if (this.cinematicTrailer) {
            this.cinematicTrailer.start();
          }
          break;

        case 'STOP_TRAILER':
        case 'EXIT_TRAILER':
          if (this.cinematicTrailer) {
            this.cinematicTrailer.stop();
          }
          break;

        case 'DROP_BOTTLE':
        case 'ADD_BOTTLE':
          this.handleDropBottle();
          this.postToParent('BOTTLE_DROPPED', { count: this.bottleSpawner?.getBottleCount() });
          break;

        case 'DROP_BAG':
        case 'ADD_BAG':
          this.handleDropBag();
          this.postToParent('BAG_DROPPED', { count: this.bottleSpawner?.getBottleCount() });
          break;

        case 'RESET_BIN':
        case 'RESET':
        case 'EMPTY_BIN':
          this.handleResetBin();
          break;

        case 'SET_AUTO_FILL':
        case 'TOGGLE_AUTO':
          const active = data.active !== undefined ? !!data.active : !this.autoFillInterval;
          this.controls?.setAutoFillState(active);
          this.handleToggleAutoFill(active);
          this.postToParent('AUTO_FILL_STATUS', { active });
          break;

        case 'GET_TELEMETRY':
        case 'GET_STATE':
          if (this.sensorManager) {
            this.postToParent('SMART_BIN_TELEMETRY', this.sensorManager.getState());
          }
          break;

        case 'INJECT_TELEMETRY':
        case 'INJECT_DATA':
          if (this.sensorManager) {
            const injectedState = this.sensorManager.injectTelemetry(data.payload || data.data || data);
            this.postToParent('SMART_BIN_TELEMETRY', injectedState);
          }
          break;

        case 'VERIFY_FAULT':
          if (this.sensorManager) {
            this.sensorManager.verifyFault(data.options || {});
            this.postToParent('SMART_BIN_TELEMETRY', this.sensorManager.getState());
          }
          break;

        case 'SIMULATE_FAULT':
          if (this.sensorManager) {
            this.sensorManager.simulateFault(data.faultType || data.fault);
            this.postToParent('SMART_BIN_TELEMETRY', this.sensorManager.getState());
          }
          break;

        case 'SET_SOUND':
          this.isSoundEnabled = !!data.enabled;
          break;
      }
    });

    // Notify parent frame that 3D microservice is initialized and ready
    this.postToParent('SMART_BIN_READY', {
      version: '1.0.0',
      status: 'READY',
      capacity: APP_CONFIG.BIN.CAPACITY_ITEMS
    });
  }

  /**
   * Configures the right floating test menu panel for quick interactive fault testing
   */
  setupTestPanel() {
    const testPanel = document.getElementById('test-panel');
    const headerToggle = document.getElementById('test-panel-toggle');
    const btnLowBattery = document.getElementById('btn-test-low-battery');
    const subtextBattery = document.getElementById('subtext-test-battery');
    const btnSignalLoss = document.getElementById('btn-test-signal-loss');
    const subtextSignal = document.getElementById('subtext-test-signal');
    const btnAnomaly = document.getElementById('btn-test-anomaly');
    const subtextAnomaly = document.getElementById('subtext-test-anomaly');
    const btnToggleOdor = document.getElementById('btn-test-toggle-odor');
    const labelOdor = document.getElementById('label-test-odor');
    const btnVerify = document.getElementById('btn-test-verify');
    const btnRestore = document.getElementById('btn-test-restore');

    const updateTestMenuUI = () => {
      if (!this.sensorManager) return;
      const state = this.sensorManager.getState();
      const reasons = Array.isArray(state?.faultReasons) ? state.faultReasons : [];

      // 1. Battery fault button
      const isLowBat = (state?.batteryLevel <= 15);
      if (btnLowBattery) {
        btnLowBattery.classList.toggle('active', isLowBat);
        if (subtextBattery) {
          subtextBattery.textContent = isLowBat
            ? `[ĐANG BẬT] Pin ${Math.round(state?.batteryLevel || 10)}% - Click để tắt`
            : 'Kích hoạt lỗi PIN_YẾU ≤ 15%';
        }
      }

      // 2. Signal loss button
      const isSigLost = Boolean(state?.signalLoss);
      if (btnSignalLoss) {
        btnSignalLoss.classList.toggle('active', isSigLost);
        if (subtextSignal) {
          subtextSignal.textContent = isSigLost
            ? '[ĐANG BẬT] Mất sóng - Click để tắt'
            : 'Kích hoạt lỗi MẤT_TÍN_HIỆU > 6s';
        }
      }

      // 3. Anomaly button
      const isAnomaly = Boolean(state?.anomalyJump);
      if (btnAnomaly) {
        btnAnomaly.classList.toggle('active', isAnomaly);
        if (subtextAnomaly) {
          subtextAnomaly.textContent = isAnomaly
            ? '[ĐANG BẬT] Nhảy vọt 92% - Click để tắt'
            : 'Mức đầy nhảy vọt ≥ 40%';
        }
      }

      // 4. Odor button
      const isOdor = Boolean(state?.odorDetected);
      if (btnToggleOdor) {
        btnToggleOdor.classList.toggle('active', isOdor);
        if (labelOdor) {
          labelOdor.textContent = isOdor ? 'Tắt mùi hôi' : 'Bật mùi hôi';
        }
      }
    };

    this.updateTestMenuUI = updateTestMenuUI;

    // 1. Toggle collapse/expand on header click
    if (headerToggle && testPanel) {
      headerToggle.addEventListener('click', () => {
        testPanel.classList.toggle('collapsed');
      });
    }

    // 2. Fault simulation toggle buttons (independent toggles, not blocking each other!)
    if (btnLowBattery) {
      btnLowBattery.addEventListener('click', () => {
        if (this.sensorManager) {
          this.sensorManager.toggleFault('LOW_BATTERY');
          updateTestMenuUI();
        }
      });
    }

    if (btnSignalLoss) {
      btnSignalLoss.addEventListener('click', () => {
        if (this.sensorManager) {
          this.sensorManager.toggleFault('SIGNAL_LOSS');
          updateTestMenuUI();
        }
      });
    }

    if (btnAnomaly) {
      btnAnomaly.addEventListener('click', () => {
        if (this.sensorManager) {
          this.sensorManager.toggleFault('ANOMALY_JUMP');
          updateTestMenuUI();
        }
      });
    }

    // 3. Odor toggle button
    if (btnToggleOdor) {
      btnToggleOdor.addEventListener('click', () => {
        const curOdor = Boolean(this.sensorManager?.getState().odorDetected);
        this.sensorManager?.injectTelemetry({ odorDetected: !curOdor });
        updateTestMenuUI();
      });
    }

    // 4. Verify fault button
    if (btnVerify) {
      btnVerify.addEventListener('click', () => {
        this.sensorManager?.verifyFault({ restoreBattery: true, batteryLevel: 98 });
        updateTestMenuUI();
      });
    }

    // 5. Restore defaults button
    if (btnRestore) {
      btnRestore.addEventListener('click', () => {
        this.sensorManager?.verifyFault({ restoreBattery: true, batteryLevel: 98 });
        this.handleResetBin();
        updateTestMenuUI();
      });
    }

    // Initial sync
    updateTestMenuUI();

    // Hide test menu if URL query specifies embed/nohud/notest
    const params = new URLSearchParams(window.location.search);
    if (params.get('embed') === '1' || params.get('nohud') === '1' || params.get('notest') === '1') {
      if (testPanel) testPanel.style.display = 'none';
    }
  }

  /**
   * Sends structured telemetry & events to parent window
   */
  postToParent(type, payload = {}) {
    if (window.parent && window.parent !== window) {
      window.parent.postMessage({
        source: 'smart-trashcan-microservice',
        type,
        payload,
        timestamp: Date.now()
      }, '*');
    }
  }

  animate() {
    requestAnimationFrame(this.animate);

    const delta = Math.min(this.clock.getDelta(), 0.1);
    const elapsedTime = this.clock.getElapsedTime();

    // 1. Step Physics
    if (this.physicsWorld) {
      this.physicsWorld.step(delta);
    }

    // 2. Synchronize visual meshes with physics bodies
    if (this.bottleSpawner) {
      this.bottleSpawner.update();
    }

    // 3. Animate lid
    if (this.trashCan) {
      this.trashCan.update(delta);
    }

    // 4. Calculate IoT sensor metrics
    let sensorState = null;
    if (this.sensorManager) {
      sensorState = this.sensorManager.update(delta);
    }

    // 5. Reactive IoT updates
    if (sensorState) {
      const activeColor = this.statusColors[sensorState.status] || this.statusColors.NORMAL;

      // Update LED colors and Ultrasonic Beam (only when trailer is not running)
      const isTrailerActive = this.cinematicTrailer && this.cinematicTrailer.isActive;
      if (!isTrailerActive) {
        if (this.trashCan) {
          this.trashCan.setLedColor(activeColor);
        }
        if (this.ultrasonicBeam) {
          this.ultrasonicBeam.setColor(activeColor);
          this.ultrasonicBeam.update(sensorState.fillPct, this.isBeamVisible, elapsedTime);
        }
      }

      // Alarm audio
      if (this.soundAlert) {
        if (sensorState.status === 'CRITICAL_FULL' && this.isSoundEnabled) {
          if (!this.soundAlert.isAlarmActive) {
            this.soundAlert.startAlarm();
          }
        } else {
          if (this.soundAlert.isAlarmActive) {
            this.soundAlert.stopAlarm();
          }
        }
      }

      // Update Minimal HUD
      if (this.hud) {
        const isLidOpen = this.trashCan ? this.trashCan.isLidOpen : false;
        this.hud.update(sensorState, isLidOpen);
      }

      if (this.updateTestMenuUI && Math.floor(elapsedTime * 4) !== this._lastMenuSync) {
        this._lastMenuSync = Math.floor(elapsedTime * 4);
        this.updateTestMenuUI();
      }

      // Broadcast telemetry to parent application on change
      if (this.lastBroadcastFillPct !== sensorState.fillPct) {
        this.lastBroadcastFillPct = sensorState.fillPct;
        this.postToParent('SMART_BIN_TELEMETRY', sensorState);
      }
    }

    // 5.1 Update Cinematic Trailer Choreography (if active)
    if (this.cinematicTrailer && this.cinematicTrailer.isActive) {
      this.cinematicTrailer.update(delta);
    }

    // 6. Camera & Render
    if (this.world) {
      this.world.update(delta);
      this.world.render();
    }
  }
}

window.addEventListener('DOMContentLoaded', () => {
  const app = new SmartTrashCanApp();
  app.init().catch((err) => {
    console.error('[App] Lỗi khởi tạo ứng dụng:', err);
  });
});

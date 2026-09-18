import * as THREE from 'three';
import * as CANNON from 'cannon-es';
import { APP_CONFIG } from '../config.js';

/**
 * WasteSpawner
 * Spawns both user 3D models: Plastic Water Bottles & Garbage Bags into the Sci-Fi Trash Can.
 */
export class BottleSpawner {
  constructor(scene, physicsWorld, bottleModel, garbageBagModel = null) {
    this.scene = scene;
    this.physicsWorld = physicsWorld;
    this.bottleModel = bottleModel;
    this.garbageBagModel = garbageBagModel;

    this.bottles = [];
    this.wasteIdCounter = 0;

    // Physics materials
    this.wasteMaterial = this.physicsWorld?.wasteMaterial || new CANNON.Material('wasteMaterial');
  }

  setGarbageBagModel(model) {
    this.garbageBagModel = model;
  }

  /**
   * Spawns a plastic bottle or garbage bag
   * @param {string} [type='bottle'] 'bottle' | 'bag'
   * @param {object} [options={}]
   */
  spawnWaste(type = 'bottle', options = {}) {
    const topY = APP_CONFIG.BIN?.TOP_Y || 2.2;
    const isBag = type === 'bag' && this.garbageBagModel;

    // 1. Position directly above the front chute opening (completely in front of the slanted lid)
    // The front opening is at Z: [0.05, 0.25], Y: 1.70. The slanted lid is at Z <= 0.04, Y: 1.65 to 2.20.
    const spreadX = isBag ? 0.07 : 0.08;
    const x = options.x !== undefined ? options.x : ((Math.random() - 0.5) * 2 * spreadX);
    const y = options.y !== undefined ? options.y : 1.80;
    const z = options.z !== undefined ? options.z : (0.06 + (Math.random() - 0.5) * 0.04);

    // 2. Random rotation
    const rotX = Math.random() * Math.PI * 2;
    const rotY = Math.random() * Math.PI * 2;
    const rotZ = Math.random() * Math.PI * 2;
    const threeQuat = new THREE.Quaternion().setFromEuler(new THREE.Euler(rotX, rotY, rotZ));

    // 3. CANNON Body Shape
    let shape, weightKg, mesh;

    if (isBag) {
      const radius = APP_CONFIG.GARBAGE_BAG.RADIUS || 0.15;
      shape = new CANNON.Sphere(radius);
      weightKg = APP_CONFIG.GARBAGE_BAG.WEIGHT_KG || 0.25;
      mesh = this.garbageBagModel.createInstance();
    } else {
      const radius = APP_CONFIG.BOTTLE.RADIUS || 0.075;
      const height = APP_CONFIG.BOTTLE.HEIGHT || 0.36;
      shape = new CANNON.Cylinder(radius, radius, height, 8);
      weightKg = APP_CONFIG.BOTTLE.WEIGHT_KG || 0.035;
      mesh = this.bottleModel.createInstance();
    }

    const body = new CANNON.Body({
      mass: weightKg,
      shape: shape,
      material: this.physicsWorld?.wasteMaterial || this.wasteMaterial,
      linearDamping: isBag ? 0.22 : 0.16,
      angularDamping: isBag ? 0.35 : 0.25,
      allowSleep: true,
      sleepSpeedLimit: 0.06,
      sleepTimeLimit: 0.4
    });

    body.position.set(x, y, z);
    body.quaternion.set(threeQuat.x, threeQuat.y, threeQuat.z, threeQuat.w);

    // Natural, gentle downward entry velocity (moves immediately with zero delay, falls gracefully)
    body.velocity.set(
      (Math.random() - 0.5) * 0.06,
      -0.58 + (Math.random() - 0.5) * 0.10,
      -0.08 + (Math.random() - 0.5) * 0.04
    );
    body.angularVelocity.set(
      (Math.random() - 0.5) * 1.5,
      (Math.random() - 0.5) * 1.5,
      (Math.random() - 0.5) * 1.5
    );

    this.physicsWorld.addBody(body);

    mesh.position.set(x, y, z);
    mesh.quaternion.copy(threeQuat);
    this.scene.add(mesh);

    const record = {
      id: ++this.wasteIdCounter,
      type: isBag ? 'bag' : 'bottle',
      weightKg,
      mesh,
      body,
      settled: false
    };

    this.bottles.push(record);
    return record;
  }

  spawnBottle(options = {}) {
    return this.spawnWaste('bottle', options);
  }

  spawnGarbageBag(options = {}) {
    return this.spawnWaste('bag', options);
  }

  update() {
    for (let i = 0; i < this.bottles.length; i++) {
      const item = this.bottles[i];
      const body = item.body;

      // Check whether item is outside the bin or has spilled onto the floor
      const distSq = body.position.x * body.position.x + body.position.z * body.position.z;
      const isOutside = distSq > 0.14 || body.position.y < 0.15; // outside bin perimeter or on floor

      if (isOutside) {
        // Outside on the floor: smooth natural rolling & sliding across the podium
        body.angularDamping = item.type === 'bag' ? 0.30 : 0.20;
        body.linearDamping = item.type === 'bag' ? 0.18 : 0.12;
        body.sleepSpeedLimit = 0.05;
        body.sleepTimeLimit = 0.5;
      } else {
        // Inside the bin cavity: higher damping prevents internal stacking vibration
        body.angularDamping = 0.65;
        body.linearDamping = item.type === 'bag' ? 0.35 : 0.28;
        body.sleepSpeedLimit = 0.08;
        body.sleepTimeLimit = 0.3;
      }

      // Synchronize visual mesh with physics body
      item.mesh.position.copy(body.position);
      item.mesh.quaternion.copy(body.quaternion);

      if (!item.settled) {
        if (body.sleepState === CANNON.Body.SLEEPING ||
           (body.velocity.length() < 0.08 && body.angularVelocity.length() < 0.20)) {
          item.settled = true;
        }
      }
    }
  }

  clearAll() {
    for (let i = 0; i < this.bottles.length; i++) {
      const item = this.bottles[i];
      if (item.mesh && this.scene) {
        this.scene.remove(item.mesh);
      }
      if (item.body && this.physicsWorld) {
        this.physicsWorld.removeBody(item.body);
      }
    }
    this.bottles = [];
  }

  getBottles() {
    return this.bottles;
  }

  getBottleCount() {
    return this.bottles.length;
  }

  getTotalWeightKg() {
    let total = 0;
    for (let i = 0; i < this.bottles.length; i++) {
      total += this.bottles[i].weightKg || 0.035;
    }
    return +total.toFixed(2);
  }
}

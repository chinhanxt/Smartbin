import * as CANNON from 'cannon-es';
import { APP_CONFIG } from '../config.js';

/**
 * PhysicsWorld: Cannon-es physics simulation world.
 * Fitted specifically to the rectangular interior cavity of the Sci-Fi Dumpster.
 */
export class PhysicsWorld {
  constructor() {
    this.world = new CANNON.World({
      gravity: new CANNON.Vec3(0, -5.2, 0)
    });
    this.world.allowSleep = true;
    this.world.solver.iterations = 20;
    this.world.solver.tolerance = 0.001;

    // Contact Materials
    this.defaultMaterial = new CANNON.Material('default');
    this.containerMaterial = new CANNON.Material('containerMaterial');
    this.groundMaterial = new CANNON.Material('groundMaterial');
    this.wasteMaterial = new CANNON.Material('wasteMaterial');

    // 1. Contact between waste items and ground floor (allows natural rolling & sliding across the podium!)
    this.groundWasteContact = new CANNON.ContactMaterial(
      this.groundMaterial,
      this.wasteMaterial,
      {
        friction: 0.18,        // Low friction so items roll & slide smoothly outward
        restitution: 0.25,     // Realistic bounce on the floor
        contactEquationStiffness: 1e7,
        contactEquationRelaxation: 3
      }
    );
    this.world.addContactMaterial(this.groundWasteContact);

    // 2. Contact between waste items and container walls (stable, non-bouncy inside the bin)
    this.containerWasteContact = new CANNON.ContactMaterial(
      this.containerMaterial,
      this.wasteMaterial,
      {
        friction: 0.45,
        restitution: 0.02,
        contactEquationStiffness: 4e6,
        contactEquationRelaxation: 4
      }
    );
    this.world.addContactMaterial(this.containerWasteContact);

    // 3. Contact between waste items themselves (inter-waste stacking inside the bin)
    this.wasteWasteContact = new CANNON.ContactMaterial(
      this.wasteMaterial,
      this.wasteMaterial,
      {
        friction: 0.38,
        restitution: 0.02,
        contactEquationStiffness: 4e6,
        contactEquationRelaxation: 4
      }
    );
    this.world.addContactMaterial(this.wasteWasteContact);

    // Default fallback contact
    this.defaultContactMaterial = new CANNON.ContactMaterial(
      this.defaultMaterial,
      this.defaultMaterial,
      {
        friction: 0.40,
        restitution: 0.05,
        contactEquationStiffness: 5e6,
        contactEquationRelaxation: 4
      }
    );
    this.world.addContactMaterial(this.defaultContactMaterial);
    this.world.defaultContactMaterial = this.defaultContactMaterial;

    this.dynamicBodies = [];
    this._buildContainerCollider();
  }

  /**
   * Constructs solid rectangular box cavity collider matching Sci-Fi Dumpster.
   * Inner cavity:
   * X: [-0.30, +0.30] (width 0.60m)
   * Z: [-0.25, +0.27] (depth 0.52m)
   * Y: [0.15, 2.20]   (height 2.05m, raised 0.15m to block bottom chute)
   */
  _buildContainerCollider() {
    this.containerBody = new CANNON.Body({
      mass: 0,
      type: CANNON.Body.STATIC,
      material: this.containerMaterial
    });

    const wallThickness = 0.25; // Thick walls prevent any tunneling
    const halfThick = wallThickness / 2;
    const height = 2.2;
    const halfH = height / 2;

    const innerHalfX = 0.30;
    const innerHalfZ = 0.25;
    const floorY = 0.16; // Raised floor so waste never clips bottom front chute

    // 1. Solid Bottom Floor Box (thickness 0.2)
    const floorShape = new CANNON.Box(new CANNON.Vec3(innerHalfX + wallThickness, 0.1, innerHalfZ + wallThickness));
    this.containerBody.addShape(floorShape, new CANNON.Vec3(0, floorY, 0));

    // 2. Left Wall (-X)
    const leftShape = new CANNON.Box(new CANNON.Vec3(halfThick, halfH, innerHalfZ + wallThickness));
    this.containerBody.addShape(leftShape, new CANNON.Vec3(-innerHalfX - halfThick, halfH, 0));

    // 3. Right Wall (+X)
    const rightShape = new CANNON.Box(new CANNON.Vec3(halfThick, halfH, innerHalfZ + wallThickness));
    this.containerBody.addShape(rightShape, new CANNON.Vec3(innerHalfX + halfThick, halfH, 0));

    // 4. Front Wall (+Z)
    // Matches the actual front lip of the 3D dumpster model (height ~1.58m)
    // Keeps waste securely inside until full; when overflowing, waste spills through the front opening and rolls onto the floor!
    const frontHeight = 1.58;
    const halfHFront = frontHeight / 2;
    const frontShape = new CANNON.Box(new CANNON.Vec3(innerHalfX + wallThickness, halfHFront, halfThick));
    this.containerBody.addShape(frontShape, new CANNON.Vec3(0, halfHFront, innerHalfZ + halfThick));

    // 5. Back Wall (-Z)
    const backShape = new CANNON.Box(new CANNON.Vec3(innerHalfX + wallThickness, halfH, halfThick));
    this.containerBody.addShape(backShape, new CANNON.Vec3(0, halfH, -innerHalfZ - halfThick));

    // 6. Solid Physical Slanted Lid Collider
    // Matches the open slanted lid geometry at the back (Y: 1.65 to 2.20, Z: -0.32 to -0.05)
    // Prevents any waste from ever clipping through the lid while leaving the front chute open
    const lidShape = new CANNON.Box(new CANNON.Vec3(0.35, 0.03, 0.22));
    const lidQuat = new CANNON.Quaternion().setFromAxisAngle(new CANNON.Vec3(1, 0, 0), -0.40);
    this.containerBody.addShape(lidShape, new CANNON.Vec3(0, 1.96, -0.23), lidQuat);

    this.world.addBody(this.containerBody);

    // 6. Ground Collider Plane & Base Platform
    // Catches any overflowing bottles & garbage bags so they land and settle on the podium/floor
    this.groundBody = new CANNON.Body({
      mass: 0,
      type: CANNON.Body.STATIC,
      material: this.groundMaterial
    });

    // Infinite upward-facing plane at floor surface Y = 0.02
    const planeShape = new CANNON.Plane();
    this.groundBody.addShape(
      planeShape,
      new CANNON.Vec3(0, 0.02, 0),
      new CANNON.Quaternion().setFromAxisAngle(new CANNON.Vec3(1, 0, 0), -Math.PI / 2)
    );

    // Solid 40m x 40m support box underneath to guarantee no high-speed tunneling
    const groundBoxShape = new CANNON.Box(new CANNON.Vec3(20, 1.0, 20));
    this.groundBody.addShape(groundBoxShape, new CANNON.Vec3(0, -1.0 + 0.02, 0));

    this.world.addBody(this.groundBody);
  }

  step(dt = 1 / 60) {
    const safeDt = typeof dt === 'number' && dt > 0 ? Math.min(dt, 0.1) : 1 / 60;
    this.world.step(1 / 60, safeDt, 3);
  }

  addBody(body) {
    if (!body.material) {
      body.material = this.defaultMaterial;
    }
    this.world.addBody(body);
    if (body.mass > 0 && !this.dynamicBodies.includes(body)) {
      this.dynamicBodies.push(body);
    }
  }

  removeBody(body) {
    this.world.removeBody(body);
    const idx = this.dynamicBodies.indexOf(body);
    if (idx !== -1) {
      this.dynamicBodies.splice(idx, 1);
    }
  }

  clearDynamicBodies() {
    const removed = [...this.dynamicBodies];
    for (const body of removed) {
      this.world.removeBody(body);
    }
    this.dynamicBodies = [];
    return removed;
  }
}

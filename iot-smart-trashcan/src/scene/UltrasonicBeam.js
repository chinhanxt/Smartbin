import * as THREE from 'three';
import { APP_CONFIG } from '../config.js';

/**
 * UltrasonicBeam: Renders a slender 3D volumetric sonar/ultrasonic cone
 * confined strictly inside the trash can opening without flaring outside.
 */
export class UltrasonicBeam {
  /**
   * @param {THREE.Scene} scene - The Three.js scene to attach the beam to
   */
  constructor(scene) {
    this.scene = scene;
    this.sensorY = 1.82; // Positioned under the lid/top opening
    this.maxHeight = 1.66; // Extends from 1.82 down to bin floor at 0.16
    this.currentColor = 0x10b981; // Green
    this.baseOpacity = 0.35;

    // Root group positioned at the ultrasonic sensor under the lid
    this.group = new THREE.Group();
    this.group.position.set(0, this.sensorY, -0.04);

    this._buildMesh();
    this.scene.add(this.group);
  }

  _buildMesh() {
    // Slender cone fitting neatly inside the bin opening
    // radiusTop: 0.03m, radiusBottom: 0.20m (diameter 0.40m, comfortably within bin interior)
    const coneGeo = new THREE.CylinderGeometry(0.03, 0.20, 1.0, 32, 1, true);
    coneGeo.translate(0, -0.5, 0);

    this.beamMaterial = new THREE.MeshBasicMaterial({
      color: this.currentColor,
      transparent: true,
      opacity: this.baseOpacity,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide,
      depthWrite: false
    });

    this.beamMesh = new THREE.Mesh(coneGeo, this.beamMaterial);
    this.group.add(this.beamMesh);
    this.mesh = this.beamMesh;

    // High-intensity narrow central core beam
    const coreGeo = new THREE.CylinderGeometry(0.01, 0.08, 1.0, 16, 1, true);
    coreGeo.translate(0, -0.5, 0);

    this.coreMaterial = new THREE.MeshBasicMaterial({
      color: this.currentColor,
      transparent: true,
      opacity: 0.55,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide,
      depthWrite: false
    });

    this.coreMesh = new THREE.Mesh(coreGeo, this.coreMaterial);
    this.group.add(this.coreMesh);

    // Bottom target contact circle/ring at the waste level
    const ringGeo = new THREE.RingGeometry(0.02, 0.20, 32);
    ringGeo.rotateX(Math.PI / 2);

    this.ringMaterial = new THREE.MeshBasicMaterial({
      color: this.currentColor,
      transparent: true,
      opacity: 0.6,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide,
      depthWrite: false
    });

    this.targetRing = new THREE.Mesh(ringGeo, this.ringMaterial);
    this.targetRing.position.y = -this.maxHeight;
    this.group.add(this.targetRing);

    // Sensor emitter bead
    const emitterGeo = new THREE.SphereGeometry(0.03, 16, 16);
    this.emitterMaterial = new THREE.MeshBasicMaterial({
      color: this.currentColor,
      transparent: true,
      opacity: 0.85,
      blending: THREE.AdditiveBlending
    });
    this.emitterMesh = new THREE.Mesh(emitterGeo, this.emitterMaterial);
    this.emitterMesh.position.set(0, 0, 0);
    this.group.add(this.emitterMesh);
  }

  update(fillPct = 0, visible = true, time = 0) {
    const isVisible = Boolean(visible);
    this.group.visible = isVisible;
    this.mesh.visible = isVisible;

    if (!isVisible) return;

    const clampedPct = THREE.MathUtils.clamp(fillPct, 0, 100);
    // When 0% full, distance is 2.1m (hits bottom). When 100% full, distance is ~0.1m
    const targetLength = Math.max(0.1, this.maxHeight * (1 - clampedPct / 100) - 0.05);

    // Subtle taper scaling
    const spreadFactor = 0.6 + 0.4 * (targetLength / this.maxHeight);

    this.beamMesh.scale.set(spreadFactor, targetLength, spreadFactor);
    this.coreMesh.scale.set(spreadFactor, targetLength, spreadFactor);

    this.targetRing.position.y = -targetLength;
    this.targetRing.scale.set(spreadFactor, spreadFactor, spreadFactor);

    // Pulsing glow
    const pulse = Math.sin(time * 5);
    this.beamMaterial.opacity = THREE.MathUtils.clamp(this.baseOpacity + pulse * 0.1, 0.15, 0.5);
    this.coreMaterial.opacity = THREE.MathUtils.clamp(0.55 + pulse * 0.15, 0.25, 0.8);
    this.ringMaterial.opacity = THREE.MathUtils.clamp(0.6 + pulse * 0.2, 0.3, 0.9);
  }

  setColor(colorHex) {
    this.currentColor = colorHex;
    this.beamMaterial.color.set(colorHex);
    this.coreMaterial.color.set(colorHex);
    this.ringMaterial.color.set(colorHex);
    this.emitterMaterial.color.set(colorHex);
  }

  dispose() {
    this.scene.remove(this.group);
  }
}

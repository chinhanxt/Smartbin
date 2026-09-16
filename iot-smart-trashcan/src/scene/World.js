import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

export class World {
  constructor(canvasElement) {
    this.canvas = canvasElement;

    // 1. Scene with clean bright studio background
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0xf5f7fa);
    this.scene.fog = new THREE.FogExp2(0xf5f7fa, 0.04);

    // 2. Camera setup
    const aspect = window.innerWidth / window.innerHeight;
    this.camera = new THREE.PerspectiveCamera(45, aspect, 0.1, 100);
    this.camera.position.set(0, 3.0, 5.2);

    // 3. Renderer with soft shadows & physical lighting
    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      antialias: true,
      powerPreference: 'high-performance'
    });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.05;
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;

    // 4. OrbitControls with completely free rotation
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.06;
    this.controls.target.set(0, 1.1, 0);
    this.controls.maxPolarAngle = Math.PI / 2 - 0.01; // Allow viewing down to floor level
    this.controls.minPolarAngle = 0.05;               // Allow viewing from straight above
    this.controls.minDistance = 1.0;
    this.controls.maxDistance = 15.0;
    this.controls.enableRotate = true;
    this.controls.enableZoom = true;
    this.controls.enablePan = true;

    // 5. Studio Lighting for Clean White Theme
    this.setupLighting();

    // 6. Minimal Studio Floor
    this.setupFloor();

    // 7. Window resize handling
    this.onWindowResize = this.onWindowResize.bind(this);
    window.addEventListener('resize', this.onWindowResize);
  }

  setupLighting() {
    // Soft skylight ambient
    const hemiLight = new THREE.HemisphereLight(0xffffff, 0xe2e8f0, 1.4);
    hemiLight.position.set(0, 20, 0);
    this.scene.add(hemiLight);

    // Main Key Sunlight with soft shadow
    const mainLight = new THREE.DirectionalLight(0xffffff, 1.8);
    mainLight.position.set(5, 8, 5);
    mainLight.castShadow = true;
    mainLight.shadow.mapSize.width = 2048;
    mainLight.shadow.mapSize.height = 2048;
    mainLight.shadow.camera.near = 0.5;
    mainLight.shadow.camera.far = 25;
    mainLight.shadow.camera.left = -3.5;
    mainLight.shadow.camera.right = 3.5;
    mainLight.shadow.camera.top = 4.5;
    mainLight.shadow.camera.bottom = -1.5;
    mainLight.shadow.bias = -0.0005;
    mainLight.shadow.radius = 3;
    this.scene.add(mainLight);

    // Soft fill light
    const fillLight = new THREE.DirectionalLight(0xecf2f8, 0.8);
    fillLight.position.set(-5, 4, -3);
    this.scene.add(fillLight);

    // Subtle highlight above trash can rim - Green
    const rimPointLight = new THREE.PointLight(0x10b981, 1.2, 8);
    rimPointLight.position.set(0, 2.5, 0);
    this.scene.add(rimPointLight);
  }

  setupFloor() {
    // Floor shadow catcher
    const floorGeo = new THREE.PlaneGeometry(30, 30);
    const floorMat = new THREE.ShadowMaterial({
      opacity: 0.12
    });
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = -0.005;
    floor.receiveShadow = true;
    this.scene.add(floor);

    // Minimal elegant circular podium
    const podiumGeo = new THREE.CylinderGeometry(1.8, 1.85, 0.03, 64);
    const podiumMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      roughness: 0.3,
      metalness: 0.1
    });
    const podium = new THREE.Mesh(podiumGeo, podiumMat);
    podium.position.y = 0.015;
    podium.receiveShadow = true;
    this.scene.add(podium);

    // Soft ring border - Green
    const ringGeo = new THREE.RingGeometry(1.82, 1.86, 64);
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0x10b981,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.45
    });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.rotation.x = -Math.PI / 2;
    ring.position.y = 0.031;
    this.scene.add(ring);
  }

  update(delta) {
    // 100% Free mouse/touch orbit rotation, zoom, and pan
    this.controls.update();
  }

  render() {
    this.renderer.render(this.scene, this.camera);
  }

  onWindowResize() {
    const w = window.innerWidth;
    const h = window.innerHeight;
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  }
}

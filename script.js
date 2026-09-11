// ---- Config ----
// Three separate GLB models, each placed side by side in the scene.
// Point each at your actual file — kept generically named as "placeholder"
// so you can just swap files without renaming code.
const MODELS = [
  { key: "context",  path: "./assets/models/PlaceholderContext.glb",  x: 0 },
  { key: "monument", path: "./assets/models/PlaceholderMonument.glb", x: 0 },
  { key: "detail",   path: "./assets/models/PlaceholderDetail.glb",   x: 0 }
];

const container = document.getElementById('canvas-container');
const loadingEl = document.getElementById('loading');

// ---- Scene / Camera / Renderer ----
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x1a1a1a);

const camera = new THREE.PerspectiveCamera(
  50,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
);
camera.position.set(0, 4, 11);
camera.lookAt(0, 0.5, 0);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);
renderer.shadowMap.enabled = true;
container.appendChild(renderer.domElement);

// ---- Lighting ----
const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
scene.add(ambientLight);

const keyLight = new THREE.DirectionalLight(0xffffff, 1);
keyLight.position.set(5, 8, 5);
keyLight.castShadow = true;
keyLight.shadow.mapSize.set(1024, 1024);
keyLight.shadow.camera.near = 0.5;
keyLight.shadow.camera.far = 30;
scene.add(keyLight);

const fillLight = new THREE.DirectionalLight(0x88aaff, 0.3);
fillLight.position.set(-5, 3, -5);
scene.add(fillLight);

// ---- Ground plane ----
const groundGeo = new THREE.PlaneGeometry(40, 40);
const groundMat = new THREE.MeshStandardMaterial({ color: 0x2a2a2a, roughness: 0.9 });
const ground = new THREE.Mesh(groundGeo, groundMat);
ground.rotation.x = -Math.PI / 2;
ground.receiveShadow = true;
scene.add(ground);

const grid = new THREE.GridHelper(40, 40, 0x444444, 0x333333);
scene.add(grid);

// ---- Helpers ----
function makePlaceholderBox(xOffset, color) {
  const geo = new THREE.BoxGeometry(1.5, 1.5, 1.5);
  const mat = new THREE.MeshStandardMaterial({ color, roughness: 0.4, metalness: 0.2 });
  const box = new THREE.Mesh(geo, mat);
  box.position.set(xOffset, 0.75, 0);
  box.castShadow = true;
  return box;
}

function groundObject(object, xOffset) {
  const box = new THREE.Box3().setFromObject(object);
  const size = new THREE.Vector3();
  const center = new THREE.Vector3();
  box.getSize(size);
  box.getCenter(center);

  // Center on its own x slot, sit on the ground plane, keep original z centered.
  object.position.x += xOffset - center.x;
  object.position.z -= center.z;
  object.position.y -= box.min.y;
}

const BOX_COLORS = { context: 0x7d7d7d, monument: 0x4f8ef7, detail: 0xf7a44f };

function loadModel({ key, path, x }) {
  let placeholderBox = makePlaceholderBox(x, BOX_COLORS[key] || 0x4f8ef7);
  scene.add(placeholderBox);

  const loader = new THREE.GLTFLoader();
  loader.load(
    path,
    (gltf) => {
      const model = gltf.scene;
      model.traverse((node) => {
        if (node.isMesh) {
          node.castShadow = true;
          node.receiveShadow = true;
        }
      });

      scene.remove(placeholderBox);
      placeholderBox.geometry.dispose();
      placeholderBox.material.dispose();

      scene.add(model);
      groundObject(model, x);
    },
    undefined,
    (error) => {
      // Model not found yet (or failed to load) — keep showing its placeholder box.
      console.warn(`Could not load "${key}" model at ${path}; showing placeholder box instead.`, error);
    }
  );
}

MODELS.forEach(loadModel);

// ---- Resize handling ----
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

// ---- Render loop ----
function animate() {
  requestAnimationFrame(animate);
  renderer.render(scene, camera);
}
animate();
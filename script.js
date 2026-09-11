// ---- Config ----
// Point this at your own 3D object. Keeping the variable/file name generic
// as "placeholder" so you can just swap the file without renaming code.
const PLACEHOLDER_MODEL_PATH = "/assets/models/PlaceholderContext";

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
camera.position.set(4, 3, 5);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);
renderer.shadowMap.enabled = true;
container.appendChild(renderer.domElement);
camera.lookAt(0, 0.5, 0);

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
const groundGeo = new THREE.PlaneGeometry(30, 30);
const groundMat = new THREE.MeshStandardMaterial({ color: 0x2a2a2a, roughness: 0.9 });
const ground = new THREE.Mesh(groundGeo, groundMat);
ground.rotation.x = -Math.PI / 2;
ground.receiveShadow = true;
scene.add(ground);

const grid = new THREE.GridHelper(30, 30, 0x444444, 0x333333);
scene.add(grid);

// ---- Placeholder object ----
// This box shows instantly while your real model loads (or if it fails to
// load / hasn't been added yet). Once GLTFLoader succeeds, it's removed.
let placeholder = null;
{
  const geo = new THREE.BoxGeometry(1.5, 1.5, 1.5);
  const mat = new THREE.MeshStandardMaterial({
    color: 0x4f8ef7,
    roughness: 0.4,
    metalness: 0.2
  });
  placeholder = new THREE.Mesh(geo, mat);
  placeholder.position.set(0, 0.75, 0);
  placeholder.castShadow = true;
  placeholder.name = "placeholder-box";
  scene.add(placeholder);
}

// ---- Load your actual model, replacing the placeholder box ----
function centerAndFrameObject(object) {
  const box = new THREE.Box3().setFromObject(object);
  const size = new THREE.Vector3();
  const center = new THREE.Vector3();
  box.getSize(size);
  box.getCenter(center);

  // Sit the object on the ground plane, centered at the origin.
  object.position.x -= center.x;
  object.position.z -= center.z;
  object.position.y -= box.min.y;

  camera.lookAt(0, size.y / 2, 0);
}

function loadPlaceholderModel() {
  const loader = new THREE.GLTFLoader();
  loadingEl.style.display = 'block';

  loader.load(
    PLACEHOLDER_MODEL_PATH,
    (gltf) => {
      const model = gltf.scene;
      model.traverse((node) => {
        if (node.isMesh) {
          node.castShadow = true;
          node.receiveShadow = true;
        }
      });

      if (placeholder) {
        scene.remove(placeholder);
        placeholder.geometry.dispose();
        placeholder.material.dispose();
        placeholder = null;
      }

      scene.add(model);
      centerAndFrameObject(model);
      loadingEl.style.display = 'none';
    },
    undefined,
    (error) => {
      // No model found yet (or failed to load) — keep the placeholder box.
      console.warn(`Could not load ${PLACEHOLDER_MODEL_PATH}; showing placeholder box instead.`, error);
      loadingEl.textContent = "Using placeholder box (model not found)";
      setTimeout(() => { loadingEl.style.display = 'none'; }, 2000);
    }
  );
}

loadPlaceholderModel();

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
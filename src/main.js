/**
 * Main entry point for the flocking simulation.
 * Initializes the Three.js scene, camera, renderer, and other components.
 * Handles the animation loop and user interactions.
 */

import { Boid } from './boid.js';
import { Ground } from './ground.js';
import { Food } from './food.js';

let scene, camera, renderer, ground;
const context = {
  MAX_SPEED: 1.5,
  MAX_FORCE: 0.03,
  NEIGHBOR_DIST: 20,
  DESIRED_SEPARATION: 5,
  SCARE_FACTOR: 0.3,
  MIN_ALTITUDE: 10,
  DETECTION_RANGE: 100,
  FULL_TIME: 3000, // Time boids stay full after eating
  NUM_BOIDS: 150,
  boids: [],
  scareActive: false, // when true, boids add a strong upward force
  foodVisible: true // Track food visibility
};

export function initScene() {
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x111111);

  camera = new THREE.PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
  );
  camera.position.set(0, 75, 350);

  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  document.body.appendChild(renderer.domElement);

  // Resize renderer on window resize
  window.addEventListener("resize", () => {
    renderer.setSize(window.innerWidth, window.innerHeight);
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
  });

  // --- ADD LIGHTING ---
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
  scene.add(ambientLight);

  const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
  directionalLight.position.set(50, 100, 50);
  scene.add(directionalLight);

  // Create food instance
  context.food = new Food(scene);

  // Create ground instance
  ground = new Ground(scene);

  // --- CREATE THE FLOCK ---
  for (let i = 0; i < context.NUM_BOIDS; i++) {
    context.boids.push(new Boid(scene));
  }

  // On mouse click, trigger scare for a few seconds and add new food
  window.addEventListener("click", (event) => {
    context.scareActive = true;
    setTimeout(() => {
      context.scareActive = false;
    }, 3000);

    // Calculate mouse position in normalized device coordinates (-1 to +1)
    const mouse = new THREE.Vector2(
      (event.clientX / window.innerWidth) * 2 - 1,
      -(event.clientY / window.innerHeight) * 2 + 1
    );

    // Use Raycaster to find intersection point on the plane
    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObject(ground.mesh);

    if (intersects.length > 0) {
      const intersectPoint = intersects[0].point;
      const normal = ground.getNormal();
      intersectPoint.add(normal.multiplyScalar(100)); // Place food above the ground
      context.food.setPosition(intersectPoint);
    }
  });

  // Update flocking parameters from sliders
  const maxSpeedSlider = document.getElementById('maxSpeed');
  const maxForceSlider = document.getElementById('maxForce');
  const neighborDistSlider = document.getElementById('neighborDist');
  const desiredSeparationSlider = document.getElementById('desiredSeparation');
  const scareFactorSlider = document.getElementById('scareFactor');
  const minAltitudeSlider = document.getElementById('minAltitude');
  const detectionRangeSlider = document.getElementById('detectionRange');
  const fullTimeSlider = document.getElementById('fullTime');
  const neighborRadiusSlider = document.getElementById('neighborRadius');

  // Function to save slider values to localStorage
  function saveSliderValues() {
    localStorage.setItem('maxSpeed', maxSpeedSlider.value);
    localStorage.setItem('maxForce', maxForceSlider.value);
    localStorage.setItem('neighborDist', neighborDistSlider.value);
    localStorage.setItem('desiredSeparation', desiredSeparationSlider.value);
    localStorage.setItem('scareFactor', scareFactorSlider.value);
    localStorage.setItem('minAltitude', minAltitudeSlider.value);
    localStorage.setItem('detectionRange', detectionRangeSlider.value);
    localStorage.setItem('fullTime', fullTimeSlider.value);
    localStorage.setItem('neighborRadius', neighborRadiusSlider.value);
  }

  // Function to load slider values from localStorage
  function loadSliderValues() {
    if (localStorage.getItem('maxSpeed')) {
      maxSpeedSlider.value = localStorage.getItem('maxSpeed');
      context.MAX_SPEED = parseFloat(maxSpeedSlider.value);
    }
    if (localStorage.getItem('maxForce')) {
      maxForceSlider.value = localStorage.getItem('maxForce');
      context.MAX_FORCE = parseFloat(maxForceSlider.value);
    }
    if (localStorage.getItem('neighborDist')) {
      neighborDistSlider.value = localStorage.getItem('neighborDist');
      context.NEIGHBOR_DIST = parseFloat(neighborDistSlider.value);
    }
    if (localStorage.getItem('desiredSeparation')) {
      desiredSeparationSlider.value = localStorage.getItem('desiredSeparation');
      context.DESIRED_SEPARATION = parseFloat(desiredSeparationSlider.value);
    }
    if (localStorage.getItem('scareFactor')) {
      scareFactorSlider.value = localStorage.getItem('scareFactor');
      context.SCARE_FACTOR = parseFloat(scareFactorSlider.value);
    }
    if (localStorage.getItem('minAltitude')) {
      minAltitudeSlider.value = localStorage.getItem('minAltitude');
      context.MIN_ALTITUDE = parseFloat(minAltitudeSlider.value);
    }
    if (localStorage.getItem('detectionRange')) {
      detectionRangeSlider.value = localStorage.getItem('detectionRange');
      context.DETECTION_RANGE = parseFloat(detectionRangeSlider.value);
    }
    if (localStorage.getItem('fullTime')) {
      fullTimeSlider.value = localStorage.getItem('fullTime');
      context.FULL_TIME = parseInt(fullTimeSlider.value);
    }
    if (localStorage.getItem('neighborRadius')) {
      neighborRadiusSlider.value = localStorage.getItem('neighborRadius');
      context.NEIGHBOR_RADIUS = parseFloat(neighborRadiusSlider.value);
    }
  }

  // Load slider values from localStorage on page load
  loadSliderValues();

  maxSpeedSlider.addEventListener('input', () => {
    context.MAX_SPEED = parseFloat(maxSpeedSlider.value);
    saveSliderValues();
  });
  maxForceSlider.addEventListener('input', () => {
    context.MAX_FORCE = parseFloat(maxForceSlider.value);
    saveSliderValues();
  });
  neighborDistSlider.addEventListener('input', () => {
    context.NEIGHBOR_DIST = parseFloat(neighborDistSlider.value);
    saveSliderValues();
  });
  desiredSeparationSlider.addEventListener('input', () => {
    context.DESIRED_SEPARATION = parseFloat(desiredSeparationSlider.value);
    saveSliderValues();
  });
  scareFactorSlider.addEventListener('input', () => {
    context.SCARE_FACTOR = parseFloat(scareFactorSlider.value);
    saveSliderValues();
  });
  minAltitudeSlider.addEventListener('input', () => {
    context.MIN_ALTITUDE = parseFloat(minAltitudeSlider.value);
    saveSliderValues();
  });
  detectionRangeSlider.addEventListener('input', () => {
    context.DETECTION_RANGE = parseFloat(detectionRangeSlider.value);
    saveSliderValues();
  });
  fullTimeSlider.addEventListener('input', () => {
    context.FULL_TIME = parseInt(fullTimeSlider.value);
    saveSliderValues();
  });
  neighborRadiusSlider.addEventListener('input', () => {
    context.NEIGHBOR_RADIUS = parseFloat(neighborRadiusSlider.value);
    saveSliderValues();
  });
}

// --- ANIMATION LOOP ---
export function animate() {
  requestAnimationFrame(animate);
  // Update each boid
  context.boids.forEach(boid => boid.update(context.boids, context));
  renderer.render(scene, camera);
}

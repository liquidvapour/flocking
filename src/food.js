/**
 * Food class represents food objects in the simulation.
 * Each food object has a 3D mesh and can interact with boids.
 */
const FOOD_AMOUNT = 1000;

export class Food {
  constructor(scene) {
    const foodGeometry = new THREE.SphereGeometry(3, 16, 16);
    const foodMaterial = new THREE.MeshLambertMaterial({ color: 0xff00aa });
    this.mesh = new THREE.Mesh(foodGeometry, foodMaterial);
    this.mesh.position.set((Math.random() - 0.5) * 200, 3, (Math.random() - 0.5) * 200);
    scene.add(this.mesh);

    this.quantity = FOOD_AMOUNT;
  }

  setPosition(position) {
    this.mesh.position.copy(position);
    this.quantity = FOOD_AMOUNT;
    this.show();
    this.updateScale();
  }

  hide() {
    this.mesh.visible = false; // Hide the food mesh
  }

  show() {
    this.mesh.visible = true; // Show the food mesh
  }

  getPosition() {
    return this.mesh.position;
  }

  eat() {
    this.quantity -= 1;
    if (this.quantity <= 0) {
      this.hide(); // Hide the food when fully consumed
      return false;
    }
    this.updateScale();
    return true;
  }

  getIsAnyFoodLeft() {
    return this.quantity > 0;
  }

  updateScale() {
    const scale = this.quantity / FOOD_AMOUNT;
    this.mesh.scale.set(scale, scale, scale);
  }
}

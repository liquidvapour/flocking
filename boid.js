export class Boid {
  constructor(scene) {
    // Position, velocity, acceleration as THREE.Vector3
    this.position = new THREE.Vector3(
      (Math.random() - 0.5) * 100,
      10 + Math.random() * 30,
      (Math.random() - 0.5) * 100
    );
    this.velocity = new THREE.Vector3(
      (Math.random() - 0.5) * 2,
      (Math.random() - 0.5) * 2,
      (Math.random() - 0.5) * 2
    );
    this.acceleration = new THREE.Vector3();
    this.state = "Flying"; // "Flying", "Descending", or "Eating"
    this.fullTime = 0; // Time boid stays full after eating
    this.isFull = false; // Track if the boid is full
    this.desiredAltitude = 20; // Desired altitude between 20 and 30

    // Create a simple geometry to represent the boid (a cone pointing forward)
    const geom = new THREE.ConeGeometry(1, 4, 8);
    this.material = new THREE.MeshLambertMaterial({ color: 0x00ffcc });
    this.mesh = new THREE.Mesh(geom, this.material);
    scene.add(this.mesh);
  }

  // Main update method
  update(boids, context) {
    if (this.state === "Flying") {
      this.flyingBehavior(boids, context);
    } else if (this.state === "Descending") {
      this.descendingBehavior(context);
    } else if (this.state === "Eating") {
      this.eatingBehavior(boids, context);
    }

    // Update mesh position
    this.mesh.position.copy(this.position);

    // Orient the mesh along the velocity vector.
    const axis = new THREE.Vector3(0, 1, 0);
    this.mesh.quaternion.setFromUnitVectors(axis, this.velocity.clone().normalize());
  }

  // Flying behavior
  flyingBehavior(boids, context) {
    // Flocking behaviors
    const sep = this.separate(boids, context).multiplyScalar(1.5);
    const ali = this.align(boids, context);
    const coh = this.cohesion(boids, context);

    // Food attraction: if not feeding, and if food is below and not too far, move toward food
    let foodAttraction = new THREE.Vector3();
    const foodPos = context.foodPos;
    const distToFood = this.position.distanceTo(foodPos);
    if (!this.isFull) {
      foodAttraction = foodPos.clone().sub(this.position);
      foodAttraction.normalize();
      foodAttraction.multiplyScalar(0.05);
    }

    // Scare behavior: when active, add strong upward force
    let scareForce = new THREE.Vector3();

    // Maintain desired altitude
    let altitudeForce = new THREE.Vector3();
    if (this.position.y < context.MIN_ALTITUDE - 5) {
      altitudeForce.set(0, 1, 0).multiplyScalar(0.1);
    } else if (this.position.y > context.MIN_ALTITUDE + 5) {
      altitudeForce.set(0, -1, 0).multiplyScalar(0.1);
    }

    // Sum up all forces
    this.acceleration.add(sep);
    this.acceleration.add(ali);
    this.acceleration.add(coh);
    this.acceleration.add(foodAttraction);
    this.acceleration.add(scareForce);
    this.acceleration.add(altitudeForce);

    // Update velocity and position
    this.velocity.add(this.acceleration);
    // Limit speed
    this.velocity.clampLength(0, context.MAX_SPEED);
    this.position.add(this.velocity);

    // Reset acceleration for next frame.
    this.acceleration.set(0, 0, 0);

    // Bounce from boundaries (keep within a 250x250x250 cube)
    const BOUND = 250;
    if (this.position.x < -BOUND || this.position.x > BOUND)
      this.velocity.x *= -1;
    if (this.position.y < 1) {
      this.position.y = 1;
      this.velocity.y *= -1;
    }
    if (this.position.y > BOUND)
      this.velocity.y *= -1;
    if (this.position.z < -BOUND || this.position.z > BOUND)
      this.velocity.z *= -1;

    // Random chance to switch to "Descending" state if close to food and not full
    if (!this.isFull && distToFood < context.DETECTION_RANGE && Math.random() < 0.05) { // Increase chance and range
      this.state = "Descending";
      this.material.color.set(0xffa500); // Change color to amber when descending
    } else if (distToFood < context.DETECTION_RANGE) {
      this.material.color.set(0xffa500); // Change color to amber when near food
    } else {
      this.material.color.set(0x00ffcc); // Default color
    }

    // Check if fullness time has passed
    if (this.isFull && Date.now() - this.fullStartTime > this.fullTime) {
      this.isFull = false;
      this.material.color.set(0x00ffcc); // Change color back to default
    }
  }

  // Descending behavior
  descendingBehavior(context) {
    const foodPos = context.foodPos;
    const targetPos = foodPos.clone();
    targetPos.y = 3; // Target position on the ground

    const desired = targetPos.clone().sub(this.position);
    desired.normalize();
    desired.multiplyScalar(context.MAX_SPEED);
    const steer = desired.sub(this.velocity);
    steer.clampLength(0, context.MAX_FORCE);

    this.acceleration.add(steer);
    this.velocity.add(this.acceleration);
    this.velocity.clampLength(0, context.MAX_SPEED);
    this.position.add(this.velocity);
    this.acceleration.set(0, 0, 0);

    // Switch to "Eating" state when close to the ground
    if (this.position.distanceTo(targetPos) < 1) {
      this.state = "Eating";
      this.eatingStartTime = Date.now();
      this.material.color.set(0xff0000); // Change color to red when eating
    }
  }

  // Eating behavior
  eatingBehavior(boids, context) {
    // Stay near the food for a while
    const foodPos = context.foodPos;
    this.position.y = 3; // Stay on the ground
    this.velocity.set(0, 0, 0); // Stop moving

    // Maintain separation while eating
    const sep = this.separate(boids, context).multiplyScalar(1.5);
    this.acceleration.add(sep);
    this.velocity.add(this.acceleration);
    this.position.add(this.velocity);
    this.acceleration.set(0, 0, 0);

    // Switch back to "Flying" state after a few seconds
    if (Date.now() - this.eatingStartTime > 3000) {
      this.state = "Flying";
      this.isFull = true;
      this.fullTime = context.FULL_TIME + Math.random() * 2000; // Add random offset
      this.fullStartTime = Date.now();
      this.material.color.set(0x0000ff); // Change color to blue when full
    }
  }

  // Separation: steer to avoid crowding local flockmates
  separate(boids, context) {
    const steer = new THREE.Vector3();
    let count = 0;
    for (let other of boids) {
      const d = this.position.distanceTo(other.position);
      if (d > 0 && d < context.DESIRED_SEPARATION) {
        let diff = this.position.clone().sub(other.position);
        diff.normalize();
        diff.divideScalar(d); // Weight by distance
        steer.add(diff);
        count++;
      }
    }
    if (count > 0) {
      steer.divideScalar(count);
    }
    if (steer.length() > 0) {
      steer.normalize();
      steer.multiplyScalar(context.MAX_SPEED);
      steer.sub(this.velocity);
      steer.clampLength(0, context.MAX_FORCE);
    }
    return steer;
  }

  // Alignment: steer toward the average heading of local flockmates
  align(boids, context) {
    const sum = new THREE.Vector3();
    let count = 0;
    for (let other of boids) {
      const d = this.position.distanceTo(other.position);
      if (d > 0 && d < context.NEIGHBOR_DIST) {
        sum.add(other.velocity);
        count++;
      }
    }
    if (count > 0) {
      sum.divideScalar(count);
      sum.normalize();
      sum.multiplyScalar(context.MAX_SPEED);
      const steer = sum.sub(this.velocity);
      steer.clampLength(0, context.MAX_FORCE);
      return steer;
    }
    return new THREE.Vector3();
  }

  // Cohesion: steer to move toward the average position of local flockmates
  cohesion(boids, context) {
    const sum = new THREE.Vector3();
    let count = 0;
    for (let other of boids) {
      const d = this.position.distanceTo(other.position);
      if (d > 0 && d < context.NEIGHBOR_DIST) {
        sum.add(other.position);
        count++;
      }
    }
    if (count > 0) {
      sum.divideScalar(count);
      return this.seek(sum, context);
    }
    return new THREE.Vector3();
  }

  // A method that calculates a steering force toward a target
  seek(target, context) {
    const desired = target.clone().sub(this.position);
    desired.normalize();
    desired.multiplyScalar(context.MAX_SPEED);
    const steer = desired.sub(this.velocity);
    steer.clampLength(0, context.MAX_FORCE);
    return steer;
  }
}

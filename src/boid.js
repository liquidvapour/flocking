const VERTICAL_MARGIN = 60;

/**
 * Boid class represents an individual agent in the flocking simulation.
 * Each boid has properties like position, velocity, and acceleration.
 * It also contains methods to update its behavior based on flocking rules.
 */
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
    this.isFull = false; // Track if the boid is full
    this.fullAtTime = 0; // Time when the boid will no longer be full
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
      this.descendingBehavior(boids, context);
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

    let foodAttraction = this.getFoodAttraction(context);

    // Scare behavior: when active, add strong upward force
    let scareForce = new THREE.Vector3();

    // Maintain desired altitude

    // Sum up all forces
    this.acceleration.add(sep);
    this.acceleration.add(ali);
    this.acceleration.add(coh);
    this.acceleration.add(foodAttraction);
    this.acceleration.add(scareForce);
    this.acceleration.add(this.getAltitudeForce(
      context.MIN_ALTITUDE - VERTICAL_MARGIN,
      context.MIN_ALTITUDE + VERTICAL_MARGIN));

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

    const distToFood = this.position.distanceTo(context.food.getPosition());

    // Random chance to switch to "Descending" state if close to food and not full
    if (!this.isFull && context.food.getIsAnyFoodLeft() && distToFood < context.DETECTION_RANGE) { // Increase chance and range
      this.state = "Descending";
      this.material.color.set(0xffa5aa); // Change color to amber when descending
    } else if (distToFood < context.DETECTION_RANGE) {
      this.material.color.set(0xffa500); // Change color to amber when near food
    } else {
      this.material.color.set(0x00ffcc); // Default color
    }

    // Check if fullness time has passed
    if (this.isFull && Date.now() > this.fullAtTime) {
      this.isFull = false;
      this.material.color.set(0x00ffcc); // Change color back to default
    }
  }

  getFoodAttraction(context) {
    let foodAttraction = new THREE.Vector3();
    const foodPos = context.food?.getPosition().clone() ?? new THREE.Vector3();
    const isAnyFoodLeft = context.food.getIsAnyFoodLeft();
    if (!this.isFull && isAnyFoodLeft) {
      foodAttraction = foodPos.sub(this.position);
      foodAttraction.normalize();
      foodAttraction.multiplyScalar(0.05);
    }
    return foodAttraction;
  }

  getAltitudeForce(minAltitude, maxAltitude) {
    const yForce = this.position.y < minAltitude 
      ? 0.1
      : this.position.y > maxAltitude
        ? -0.1
        : 0.0

    return new THREE.Vector3(0, yForce, 0);
  }

  // Descending behavior
  descendingBehavior(boids, context) {
    if (!context.food.getIsAnyFoodLeft()) {
    if (context.scareActive && this.position.y < context.MIN_ALTITUDE - VERTICAL_MARGIN) {
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
    }

    // Update flocking parameters from sliders
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
      this.state = "Flying";
      return;
    }

    const sep = this.separate(boids, context).multiplyScalar(1.5);
    const ali = this.align(boids, context);
    const coh = this.cohesion(boids, context);

    let foodAttraction = this.getFoodAttraction(context);

    this.acceleration.add(sep);
    this.acceleration.add(ali);
    this.acceleration.add(coh);
    this.acceleration.add(foodAttraction);
    this.acceleration.add(this.getAltitudeForce(0, 100));

    this.velocity.add(this.acceleration);
    this.velocity.clampLength(0, context.MAX_SPEED);

    const targetPos = context.food.getPosition();
    // Slow down when near the food based on distance
    const distToFood = this.position.distanceTo(targetPos);
    if (context.food.getIsAnyFoodLeft && distToFood < 10) { // Adjust the distance threshold as needed
      const speedReductionFactor = Math.max(distToFood / 10, 0.75); // Linearly reduce speed based on distance
      this.velocity.multiplyScalar(speedReductionFactor);
    }

    this.position.add(this.velocity);
    this.acceleration.set(0, 0, 0);

    // Switch to "Eating" state when close to the ground
    if (this.position.distanceTo(targetPos) < 3) {
      this.state = "Eating";
      this.eatingStartTime = Date.now();
      this.material.color.set(0xff0000); // Change color to red when eating
    }
  }

  // Eating behavior
  eatingBehavior(boids, context) {
    // Stay near the food for a while
    const foodPos = context.food.getPosition();

    let foodAttraction = this.getFoodAttraction(context);

      // Maintain separation while eating
    const sep = this.separate(boids, context).multiplyScalar(1.5);
    this.acceleration.add(sep);
    this.acceleration.add(foodAttraction);


    this.velocity.add(this.acceleration);
    this.position.add(this.velocity);
    this.acceleration.set(0, 0, 0);

    const distToFood = this.position.distanceTo(foodPos);

    if (distToFood < 3 && context.food.eat()) {
      // Scale the boid mesh a little on each successful eat
      const scaleFactor = 1.005; // Increase size by 10%
      this.mesh.scale.multiplyScalar(scaleFactor);
    } else {
      this.state = "Flying";
      this.isFull = true;
      this.fullAtTime = Date.now() + context.FULL_TIME + Math.random() * 2000; // Set the time when the boid will no longer be full
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

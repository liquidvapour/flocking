/**
 * Ground class represents the ground plane in the simulation.
 * It provides a visual base for the 3D environment.
 */
export class Ground {
  constructor(scene) {
    const groundGeo = new THREE.PlaneGeometry(500, 500);
    const groundMat = new THREE.MeshLambertMaterial({ color: 0x333333 });
    this.mesh = new THREE.Mesh(groundGeo, groundMat);
    this.mesh.rotation.x = -Math.PI / 2;
    this.mesh.position.y = 0;
    scene.add(this.mesh);
  }

  getNormal() {
    return new THREE.Vector3(0, 1, 0);
  }
}

# Flocking Simulation

This project is a 3D simulation of flocking behavior, built using the Three.js library. It includes interactive elements like food and ground, and simulates the behavior of boids (bird-like agents).

## Features
- **Boids**: Simulated agents that exhibit flocking behavior.
- **Food**: Interactive food objects that boids can consume.
- **Ground**: A plane that serves as the environment for the simulation.
- **Three.js**: Utilized for rendering the 3D environment.

## Installation

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd flocking
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

## Usage

1. Start a local server to serve the project files. For example, using `http-server`:
   ```bash
   npx http-server
   ```

2. Open the simulation in your browser at `http://localhost:8080` (or the port specified by your server).

## Live Demo

You can view the live demo of the simulation here: [Flocking Simulation on GitHub Pages](https://liquidvapour.github.io/flocking/)

Replace `<your-github-username>` with your GitHub username and `<repository-name>` with the name of your repository.

## File Structure
- `boid.js`: Defines the behavior and properties of boids.
- `food.js`: Manages food objects, including their position, visibility, and interaction with boids.
- `ground.js`: Represents the ground plane in the simulation.
- `main.js`: Entry point for initializing the Three.js scene, camera, and renderer.
- `index.html`: HTML file to load and display the simulation.
- `package.json`: Contains project metadata and dependencies.

## Dependencies
- [Three.js](https://threejs.org/): A JavaScript library for 3D rendering.

## Contributing
Feel free to fork this repository and submit pull requests. Contributions are welcome!

## License
This project is licensed under the MIT License. See the LICENSE file for details.
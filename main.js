import "./style.css";
import * as THREE from "three";
import * as CANNON from "cannon";

let world;
const width = 10;
const height = width * (window.innerHeight / window.innerWidth);
const originalBoxSize = 3;
const scene = new THREE.Scene();
scene.background = new THREE.Color("#000000");

const camera = new THREE.OrthographicCamera(
  width / -2, // left
  width / 2, // right
  height / 2, // top
  height / -2, // bottom
  1, // near
  100 // far
);
const renderer = new THREE.WebGLRenderer({
  antialias: true,
  canvas: document.querySelector("#bg"),
});
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap; // default THREE.PCFShadowMap

// create an AudioListener and add it to the camera
const listener = new THREE.AudioListener();
camera.add(listener);

// create a global audio source
const sound = new THREE.Audio(listener);

// load a sound and set it as the Audio object's buffer
const audioLoader = new THREE.AudioLoader();

const light = new THREE.SpotLight(0xffffff);
light.castShadow = true; // default false
scene.add(light);
light.shadow.mapSize.width = 512; // default
light.shadow.mapSize.height = 512; // default
light.shadow.camera.near = 0.5; // default
light.shadow.camera.far = 500; // default
light.shadow.focus = 1; // default
const helper = new THREE.CameraHelper(light.shadow.camera);
//scene.add(helper);

function init() {
  // world
  world = new CANNON.World();
  world.gravity.set(0, -10, 0); // Gravity pulls things down
  world.broadphase = new CANNON.NaiveBroadphase();
  world.solver.iterations = 40;

  // FOUNDATION
  addLayer(0, 0, originalBoxSize, originalBoxSize);

  // First layer
  addLayer(-10, 0, originalBoxSize, originalBoxSize, "x");

  // set up the light
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
  scene.add(ambientLight);
  const dirLight = new THREE.DirectionalLight(0xffffff, 0.6);
  dirLight.position.set(10, 20, 0); // x, y, z
  scene.add(dirLight);

  // Orthographic camera
  camera.position.set(4, 4, 4);
  camera.lookAt(0, 0, 0);

  // renderer
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.render(scene, camera);
}

let stack = [];
let overhangs = [];
const boxHeight = 1;
let gameStarted = false;
let gameOver = false; // Track game over state
let layerCount = 0;
let coinCount = 0; // Initialize coin count
const counterElement = document.getElementById("counter");
const coinElement = document.getElementById("coins");

function addLayer(x, z, width, depth, direction) {
  const y = boxHeight * stack.length;
  const layer = generateBox(x, y, z, width, depth, false);
  layer.direction = direction;
  stack.push(layer);
}

function addOverhang(x, z, width, depth) {
  const y = boxHeight * (stack.length - 1);
  const overhang = generateBox(x, y, z, width, depth, true);
  overhangs.push(overhang);
}

function generateBox(x, y, z, width, depth, falls) {
  const geometry = new THREE.BoxGeometry(width, boxHeight, depth);
  const color = new THREE.Color(`hsl(${30 + stack.length * 4},100%,50%)`);
  const material = new THREE.MeshLambertMaterial({ color });

  const mesh = new THREE.Mesh(geometry, material);
  mesh.position.set(x, y, z);
  mesh.castShadow = true; // default is false
  mesh.receiveShadow = false; // default
  scene.add(mesh);

  // CANON JS
  const shape = new CANNON.Box(
    new CANNON.Vec3(width / 2, boxHeight / 2, depth / 2)
  );
  let mass = falls ? 5 : 0;
  const body = new CANNON.Body({ mass, shape });
  body.position.set(x, y, z);
  world.addBody(body);

  return {
    threejs: mesh,
    cannonjs: body,
    width,
    depth,
  };
}

window.addEventListener("click", startGame);

function startGame(event) {
  if (!gameStarted) {
    renderer.setAnimationLoop(animation);
    gameStarted = true;
  } else {
    placeLayer();
    showCoinAnimation(event.clientX, event.clientY);
  }
}
gameStarted = false;

function showCoinAnimation(mouseX, mouseY) {
  if (gameOver) return;
  const coinContainer = document.getElementById("coin-container");
  const coinElement = document.createElement("img");
  coinElement.src = "/public/coin-svgrepo-com.svg"; // Update this path to your coin image
  coinElement.classList.add("coin-animation"); // Add the spin class
  coinElement.style.width = "60px"; // Adjust the size as necessary
  coinElement.style.position = "absolute"; // Absolute positioning to place it correctly

  // Position the element at the mouse click location
  coinElement.style.left = `${mouseX}px`;
  coinElement.style.top = `${mouseY}px`;

  // Append it to the container
  coinContainer.appendChild(coinElement);
  // Create a new element for the +1 coin animation
  //   const coinElement = document.createElement("div");
  //   //var svg = document.createElementNS("/public/coin-svgrepo-com.svg", "svg");

  //   coinElement.classList.add("coin-animation");
  //   coinElement.textContent = "+1 Coin";

  //   // Position the element at the mouse click location
  //   coinElement.style.left = `${mouseX}px`;
  //   coinElement.style.top = `${mouseY}px`;

  //   // Append it to the container
  //   coinContainer.appendChild(coinElement);

  // Trigger the animation
  setTimeout(() => {
    coinElement.classList.add("animate");
  }, 100); // Slight delay to ensure the animation applies

  // Remove the element after the animation completes
  setTimeout(() => {
    coinElement.remove();
  }, 1000); // Duration of the animation (1 second)
}
// ending Game
function endGame() {
  gameOver = true; // Set game over state
  // Stop the animation loop
  renderer.setAnimationLoop(null);
  const restartButton = document.getElementById("restart-button"); // Show the restart button
  restartButton.style.display = "flex";
  // Create a game over message
  const gameOverMessage = document.getElementById("gameOverMessage");
  gameOverMessage.style.display = "block";
  // const gameOverMessage = document.createElement("div");
  // gameOverMessage.style.position = "absolute";
  // gameOverMessage.style.top = "50%";
  // gameOverMessage.style.left = "50%";
  // gameOverMessage.style.transform = "translate(-50%, -50%)";
  // gameOverMessage.style.color = "white";
  // gameOverMessage.style.fontSize = "30px";
  // gameOverMessage.style.zIndex = "2"; // Ensure it's on top
  // gameOverMessage.textContent = `Game Over! Total Coins: ${coinCount}`;
  // gameOverMessage.id = "game_Message";
  // document.body.appendChild(gameOverMessage);
}
// restart game
function restartGame() {
  // Reset game variables
  layerCount = 0; // Reset coins
  gameStarted = false; // Reset game state
  gameOver = false; // Reset game over state

  console.log("stack : ", stack);
  // Remove all blocks from the scene
  stack.forEach((layer) => {
    console.log("scene : ", scene);
    scene.remove(layer.threejs); // Remove each layer from the scene
  });
  overhangs.forEach((overhang) => {
    scene.remove(overhang.threejs); // Remove each overhang from the scene
  });

  stack.length = 0; // Clear the stack
  overhangs.length = 0; // Clear the overhangs

  // Remove any remaining coin elements from the DOM
  // const gameOverMessage = document.getElementById("game_Message");
  // console.log("gameOverMessage : ", gameOverMessage);
  // document.body.removeChild(gameOverMessage);
  // Reset the coin count display
  document.getElementById("counter").textContent = "layer: 0";
  //gameOverMessage.style.display = "none";

  // Reinitialize the game
  scene.clear();
  init();
  document.getElementById("restart-button").style.display = "none"; // Hide the restart button
  // Restart the animation loop
}
// Add event listener for the restart button
document
  .getElementById("restart-button")
  .addEventListener("click", restartGame);
// Capture the mouse click event

function placeLayer() {
  const topLayer = stack[stack.length - 1];
  const previousLayer = stack[stack.length - 2];
  const direction = topLayer.direction;

  const delta =
    topLayer.threejs.position[direction] -
    previousLayer.threejs.position[direction];
  const overHangSize = Math.abs(delta);

  const size = direction === "x" ? topLayer.width : topLayer.depth;
  const overlap = size - overHangSize;

  if (overlap > 0) {
    const newWidth = direction === "x" ? overlap : topLayer.width;
    const newDepth = direction === "z" ? overlap : topLayer.depth;

    topLayer.width = newWidth;
    topLayer.depth = newDepth;

    topLayer.threejs.scale[direction] = overlap / size;
    topLayer.threejs.position[direction] -= delta / 2;
    topLayer.cannonjs.position[direction] -= delta / 2;

    const shape = new CANNON.Box(
      new CANNON.Vec3(newWidth / 2, boxHeight / 2, newDepth / 2)
    );
    topLayer.cannonjs.shapes = [];
    topLayer.cannonjs.addShape(shape);

    // Add the overhang
    const overhangShift = (overlap / 2 + overHangSize / 2) * Math.sign(delta);
    const overhangX =
      direction == "x"
        ? topLayer.threejs.position.x + overhangShift
        : topLayer.threejs.position.x;
    const overhangZ =
      direction == "z"
        ? topLayer.threejs.position.z + overhangShift
        : topLayer.threejs.position.z;
    const overhangWidth = direction == "x" ? overHangSize : topLayer.width;
    const overhangDepth = direction == "z" ? overHangSize : topLayer.depth;

    addOverhang(overhangX, overhangZ, overhangWidth, overhangDepth);

    // Add next layer
    const nextX = direction === "x" ? topLayer.threejs.position.x : -10;
    const nextZ = direction === "z" ? topLayer.threejs.position.z : -10;
    const nextDirection = direction === "x" ? "z" : "x";
    addLayer(nextX, nextZ, newWidth, newDepth, nextDirection);

    layerCount++;
    counterElement.textContent = `Layers: ${layerCount}`;
    // Increment coin count and update coin counter
    coinCount++;
    coinElement.textContent = `Coins: ${coinCount}`;

    // Show coin animation
    showCoinAnimation(); // <--- Here we call the coin animation
  } else {
    endGame();
  }
}

function animation() {
  const speed = 0.15;
  const topLayer = stack[stack.length - 1];
  topLayer.threejs.position[topLayer.direction] += speed;
  topLayer.cannonjs.position[topLayer.direction] += speed;

  if (camera.position.y < boxHeight * (stack.length - 2) + 4) {
    camera.position.y += speed;
  }

  updatePhysics();
  renderer.render(scene, camera);
}

function updatePhysics() {
  world.step(1 / 60); // Step the physics world

  overhangs.forEach((element) => {
    element.threejs.position.copy(element.cannonjs.position);
    element.threejs.quaternion.copy(element.cannonjs.quaternion);
  });
}

window.addEventListener("resize", () => {
  const aspect = window.innerWidth / window.innerHeight;
  const width = 10;
  const height = width / aspect;

  camera.left = -width / 2;
  camera.right = width / 2;
  camera.top = height / 2;
  camera.bottom = -height / 2;

  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.render(scene, camera);
});

init();

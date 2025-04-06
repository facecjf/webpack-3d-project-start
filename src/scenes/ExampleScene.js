import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

export class ExampleScene {
  constructor(engine) {
    this.engine = engine;
    this.threeScene = new THREE.Scene();
    
    // References to main systems
    this.camera = engine.camera;
    this.inputManager = engine.inputManager;
    this.physicsSystem = engine.physicsSystem;
    this.audioManager = engine.audioManager;
    this.debug = engine.debug;
    
    // Scene specific properties
    this.objects = [];
    this.lights = [];
    this.controls = null;
    this.clock = new THREE.Clock();
    
    // Set up the scene
    this._setupScene();
  }
  
  /**
   * Set up the initial scene objects, lights, etc.
   * @private
   */
  _setupScene() {
    // Create scene background
    this.threeScene.background = new THREE.Color(0x222233);
    
    // Setup fog
    this.threeScene.fog = new THREE.FogExp2(0x222233, 0.02);
    
    // Create grid helper
    const gridHelper = new THREE.GridHelper(20, 20, 0x555555, 0x333333);
    this.threeScene.add(gridHelper);
    
    // Create the orbit controls
    this.controls = new OrbitControls(this.camera, this.engine.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.05;
    
    // Set initial camera position
    this.camera.position.set(8, 6, 8);
    this.camera.lookAt(0, 0, 0);
    
    // Add lights
    this._setupLights();
    
    // Add objects
    this._setupObjects();
  }
  
  /**
   * Set up the lighting for the scene
   * @private
   */
  _setupLights() {
    // Ambient light
    const ambientLight = new THREE.AmbientLight(0x404040, 0.5);
    this.threeScene.add(ambientLight);
    this.lights.push(ambientLight);
    
    // Directional light (sun)
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(-10, 20, 10);
    directionalLight.castShadow = true;
    
    // Configure shadow properties
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    directionalLight.shadow.camera.near = 0.5;
    directionalLight.shadow.camera.far = 50;
    directionalLight.shadow.camera.left = -20;
    directionalLight.shadow.camera.right = 20;
    directionalLight.shadow.camera.top = 20;
    directionalLight.shadow.camera.bottom = -20;
    
    this.threeScene.add(directionalLight);
    this.lights.push(directionalLight);
    
    // Point light
    const pointLight = new THREE.PointLight(0x0088ff, 1, 30, 2);
    pointLight.position.set(0, 5, 0);
    pointLight.castShadow = true;
    this.threeScene.add(pointLight);
    this.lights.push(pointLight);
  }
  
  /**
   * Set up the objects in the scene
   * @private
   */
  _setupObjects() {
    // Ground plane
    const groundGeometry = new THREE.PlaneGeometry(40, 40);
    const groundMaterial = new THREE.MeshStandardMaterial({
      color: 0x333333,
      roughness: 0.8,
      metalness: 0.2
    });
    const ground = new THREE.Mesh(groundGeometry, groundMaterial);
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    this.threeScene.add(ground);
    
    // Create physics body for ground
    const groundBody = this.physicsSystem.createBody({
      position: new THREE.Vector3(0, 0, 0),
      isStatic: true,
      dimensions: new THREE.Vector3(40, 1, 40)
    });
    
    // Create a central cube
    const boxGeometry = new THREE.BoxGeometry(2, 2, 2);
    const boxMaterial = new THREE.MeshStandardMaterial({
      color: 0xff0000,
      roughness: 0.5,
      metalness: 0.2
    });
    this.centerCube = new THREE.Mesh(boxGeometry, boxMaterial);
    this.centerCube.position.set(0, 1, 0);
    this.centerCube.castShadow = true;
    this.centerCube.receiveShadow = true;
    this.threeScene.add(this.centerCube);
    this.objects.push(this.centerCube);
    
    // Create a physics body for the cube
    this.centerCubeBody = this.physicsSystem.createBody({
      position: new THREE.Vector3(0, 1, 0),
      dimensions: new THREE.Vector3(2, 2, 2),
      mass: 1
    });
  }
  
  /**
   * Initialize the scene
   */
  init() {
    // Add any initialization logic here
    this.debug.log('Example scene initialized');
  }
  
  /**
   * Get the list of assets required by this scene
   * @returns {Object} Asset manifest
   */
  getAssetManifest() {
    // Example asset manifest (in a real game, you'd specify actual assets)
    return {
      models: {
        // example: { path: 'assets/models/character.glb', type: 'gltf' }
      },
      textures: {
        // example: 'assets/textures/ground.jpg'
      },
      audio: {
        // example: 'assets/audio/background.mp3'
      }
    };
  }
  
  /**
   * Handle window resize
   * @param {number} width - New width
   * @param {number} height - New height
   */
  onResize(width, height) {
    // Handle resize-specific logic if needed
  }
  
  /**
   * Update the scene
   * @param {number} deltaTime - Time since last update in seconds
   * @param {number} elapsedTime - Total elapsed time in seconds
   */
  update(deltaTime, elapsedTime) {
    // Update orbit controls
    if (this.controls) {
      this.controls.update();
    }
    
    // Rotate the center cube
    //this.centerCube.rotation.y += deltaTime * 0.5;
    // this.centerCube.rotation.x += deltaTime * 0.2;
    
    // Update physics objects to match their Three.js counterparts
    this.centerCubeBody.position.copy(this.centerCube.position);
    
    // Update object positions based on physics
    for (const object of this.objects) {
      if (object.userData.physicsBody) {
        object.position.copy(object.userData.physicsBody.position);
        
        // We could also update rotations here if needed
      }
    }
    
    // Handle input
    this._handleInput(deltaTime);
  }
  
  /**
   * Handle user input
   * @param {number} deltaTime - Time since last update in seconds
   * @private
   */
  _handleInput(deltaTime) {
    // Example of input handling
    if (this.inputManager.isKeyDown('KeyW')) {
      this.debug.log('W key is down');
    }
    
    if (this.inputManager.isKeyPressed('Space')) {
      // Apply an upward force to the center cube
      this.centerCubeBody.applyImpulse(new THREE.Vector3(0, 10, 0));
    }
    
    if (this.inputManager.isMouseButtonPressed('left')) {
      this.debug.log('Mouse clicked');
    }
  }
}

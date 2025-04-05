import * as THREE from 'three';
import { AssetLoader } from './AssetLoader';
import { InputManager } from './InputManager';
import { PhysicsSystem } from './PhysicsSystem';
import { AudioManager } from './AudioManager';

export class Engine {
  constructor(options = {}) {
    this.options = options;
    this.container = options.container || document.body;
    this.stats = options.stats || null;
    this.debug = options.debug || null;
    
    // State
    this.isRunning = false;
    this.activeScene = null;
    this.lastTime = 0;
    this.deltaTime = 0;
    this.elapsedTime = 0;
    
    // Core three.js components
    this.renderer = this._createRenderer();
    this.camera = this._createCamera();
    this.scene = new THREE.Scene();
    
    // Game systems
    this.assetLoader = new AssetLoader();
    this.inputManager = new InputManager();
    this.physicsSystem = new PhysicsSystem();
    this.audioManager = new AudioManager();
    
    // Perform initial resize
    this.handleResize();
  }
  
  _createRenderer() {
    const renderer = new THREE.WebGLRenderer({ 
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance',
    });
    
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    
    this.container.appendChild(renderer.domElement);
    
    return renderer;
  }
  
  _createCamera() {
    const camera = new THREE.PerspectiveCamera(
      75, 
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    
    camera.position.set(0, 5, 10);
    camera.lookAt(0, 0, 0);
    
    return camera;
  }
  
  setActiveScene(scene) {
    this.activeScene = scene;
    this.scene = scene.threeScene;
    this.debug.log(`Set active scene: ${scene.constructor.name}`);
  }
  
  async loadAssets(progressCallback) {
    if (!this.activeScene) {
      throw new Error('No active scene set. Call setActiveScene() first.');
    }
    
    // Load assets required by the active scene
    const assetManifest = this.activeScene.getAssetManifest();
    if (assetManifest && Object.keys(assetManifest).length > 0) {
      await this.assetLoader.loadAssets(assetManifest, progressCallback);
    } else {
      this.debug.log('No assets to load for current scene');
    }
  }
  
  start() {
    if (this.isRunning) return;
    
    this.isRunning = true;
    this.lastTime = performance.now();
    this.animate();
    
    // Initialize the active scene if one is set
    if (this.activeScene) {
      this.activeScene.init();
    }
    
    this.debug.log('Engine started');
  }
  
  stop() {
    this.isRunning = false;
    this.debug.log('Engine stopped');
  }
  
  animate() {
    if (!this.isRunning) return;
    
    // Request next frame
    requestAnimationFrame(this.animate.bind(this));
    
    // Calculate time delta
    const currentTime = performance.now();
    this.deltaTime = (currentTime - this.lastTime) / 1000; // Convert to seconds
    this.elapsedTime += this.deltaTime;
    this.lastTime = currentTime;
    
    // Start stats measurement
    if (this.stats) this.stats.begin();
    
    // Update physics
    this.physicsSystem.update(this.deltaTime);
    
    // Update active scene
    if (this.activeScene) {
      this.activeScene.update(this.deltaTime, this.elapsedTime);
    }
    
    // Render the scene
    this.renderer.render(this.scene, this.camera);
    
    // End stats measurement
    if (this.stats) this.stats.end();
  }
  
  handleResize() {
    const width = window.innerWidth;
    const height = window.innerHeight;
    
    // Update camera aspect ratio
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    
    // Update renderer size
    this.renderer.setSize(width, height);
    
    // Update active scene
    if (this.activeScene && typeof this.activeScene.onResize === 'function') {
      this.activeScene.onResize(width, height);
    }
    
    this.debug.log(`Resized: ${width}x${height}`);
  }
}

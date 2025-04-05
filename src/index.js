import './styles.css';
import * as THREE from 'three';
import Stats from 'stats.js';
import { Engine } from './engine/Engine';
import { DebugUtils } from './utils/DebugUtils';
import { ExampleScene } from './scenes/ExampleScene';

// DOM elements
const loadingScreen = document.getElementById('loading-screen');
const loadingProgress = document.getElementById('loading-progress');
const gameContainer = document.getElementById('game-container');
const statsContainer = document.getElementById('stats-container');
const debugInfo = document.getElementById('debug-info');

// Initialize Stats
const stats = new Stats();
stats.showPanel(0); // 0: fps, 1: ms, 2: mb, 3+: custom
statsContainer.appendChild(stats.dom);

// Initialize Debug Utils
const debug = new DebugUtils(debugInfo);

// Initialize Game Engine
const engine = new Engine({
  container: gameContainer,
  stats,
  debug
});

// Loading progress handler
const handleProgress = (itemsLoaded, itemsTotal) => {
  const progress = Math.floor((itemsLoaded / itemsTotal) * 100);
  loadingProgress.textContent = `Loading... ${progress}%`;
};

// Loading complete handler
const handleComplete = () => {
  // Hide loading screen
  loadingScreen.classList.add('hidden');
  
  // Start the engine
  engine.start();
  
  // Debug message
  debug.log('Game engine started');
};

// Initialize the game
const init = async () => {
  try {
    // Set up the main scene
    const mainScene = new ExampleScene(engine);
    engine.setActiveScene(mainScene);
    
    // Load all necessary assets
    await engine.loadAssets(handleProgress);
    
    // Loading complete
    handleComplete();
    
  } catch (error) {
    console.error('Error initializing game:', error);
    loadingProgress.textContent = 'Error loading game. Please refresh.';
  }
};

// Start the game
init();

// Handle window resize
window.addEventListener('resize', () => {
  engine.handleResize();
});

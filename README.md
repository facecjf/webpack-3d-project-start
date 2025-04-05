# Webpack 3D Game Development Boilerplate

A modern boilerplate project for 3D JavaScript game development with Webpack and Three.js.

## Features

- Complete webpack configuration for development and production
- Three.js integration for 3D rendering
- Game engine architecture with:
  - Asset loading system
  - Physics system
  - Input management
  - Audio management
  - Debug utilities
- Example scene with basic 3D objects and interaction
- Hot module replacement for development
- Code splitting and optimization for production

## Project Structure

```
/
├── dist/               # Build output directory
├── src/                # Source files
│   ├── assets/         # Game assets
│   │   ├── models/     # 3D models
│   │   ├── textures/   # Textures
│   │   └── audio/      # Audio files
│   ├── engine/         # Game engine components
│   │   ├── AssetLoader.js
│   │   ├── AudioManager.js
│   │   ├── Engine.js
│   │   ├── InputManager.js
│   │   └── PhysicsSystem.js
│   ├── scenes/         # Game scenes
│   │   └── ExampleScene.js
│   ├── utils/          # Utility functions and classes
│   │   └── DebugUtils.js
│   ├── index.html      # HTML template
│   ├── index.js        # Main entry point
│   └── styles.css      # Global styles
├── webpack.common.js   # Common webpack configuration
├── webpack.dev.js      # Development-specific webpack configuration
├── webpack.prod.js     # Production-specific webpack configuration
└── package.json        # Project dependencies and scripts
```

## Getting Started

### Prerequisites

- Node.js (12.x or higher)
- npm (6.x or higher)

### Installation

1. Clone the repository
```bash
git clone https://github.com/yourusername/webpack-3d-game-boilerplate.git
cd webpack-3d-game-boilerplate
```

2. Install dependencies
```bash
npm install
```

### Development

Run the development server:
```bash
npm start
```

This will start the webpack development server with hot reloading at http://localhost:3000.

### Building for Production

Build the project for production:
```bash
npm run build
```

The optimized files will be output to the `dist` directory.

## Game Engine Overview

### Engine

The core of the game engine, responsible for managing the game loop, scene rendering, and integrating all other systems.

### AssetLoader

Handles loading of all game assets (models, textures, audio) with progress tracking.

### InputManager

Manages keyboard, mouse, and touch input with support for key binding and event handling.

### PhysicsSystem

A simple physics system for basic collision detection and response.

### AudioManager

Handles audio playback with support for sounds, music, and 3D positional audio.

## Customization

### Adding New Assets

1. Place new assets in the appropriate directories:
   - 3D models in `src/assets/models/`
   - Textures in `src/assets/textures/`
   - Audio files in `src/assets/audio/`

2. Update the asset manifest in your scene:
```javascript
getAssetManifest() {
  return {
    models: {
      'character': 'assets/models/character.glb',
    },
    textures: {
      'ground': 'assets/textures/ground.jpg',
    },
    audio: {
      'background': 'assets/audio/background.mp3',
    }
  };
}
```

### Creating New Scenes

1. Create a new scene file in `src/scenes/`
2. Implement the required methods:
   - `constructor(engine)`
   - `init()`
   - `update(deltaTime, elapsedTime)`
   - `getAssetManifest()`

3. Update the scene instantiation in `src/index.js`:
```javascript
import { YourNewScene } from './scenes/YourNewScene';

// ...

const mainScene = new YourNewScene(engine);
engine.setActiveScene(mainScene);
```

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- [Three.js](https://threejs.org/) - JavaScript 3D library
- [Webpack](https://webpack.js.org/) - Module bundler
- [stats.js](https://github.com/mrdoob/stats.js/) - JavaScript performance monitor

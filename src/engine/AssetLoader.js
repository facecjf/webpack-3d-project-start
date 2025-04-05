import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader.js';
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader.js';

export class AssetLoader {
  constructor() {
    // Cache for loaded assets
    this.assets = {
      textures: {},
      models: {},
      audio: {},
      images: {},
      json: {},
    };
    
    // Loaders for different asset types
    this.loaders = {
      texture: new THREE.TextureLoader(),
      gltf: new GLTFLoader(),
      obj: new OBJLoader(),
      fbx: new FBXLoader(),
      audio: new THREE.AudioLoader(),
      json: new THREE.FileLoader(),
      image: new THREE.ImageLoader(),
    };
  }
  
  /**
   * Load all assets from an asset manifest
   * @param {Object} manifest - Asset manifest with categories and file paths
   * @param {Function} onProgress - Progress callback (itemsLoaded, totalItems)
   * @returns {Promise} Promise that resolves when all assets are loaded
   */
  async loadAssets(manifest, onProgress) {
    const totalAssets = this._countTotalAssets(manifest);
    let loadedAssets = 0;
    
    // Create loading promises for each asset type
    const promises = [];
    
    // Load textures
    if (manifest.textures) {
      for (const [id, path] of Object.entries(manifest.textures)) {
        const promise = this.loadTexture(id, path).then(() => {
          loadedAssets++;
          if (onProgress) onProgress(loadedAssets, totalAssets);
        });
        promises.push(promise);
      }
    }
    
    // Load models
    if (manifest.models) {
      for (const [id, config] of Object.entries(manifest.models)) {
        const path = typeof config === 'string' ? config : config.path;
        const type = typeof config === 'string' ? this._getFileType(path) : config.type;
        
        const promise = this.loadModel(id, path, type).then(() => {
          loadedAssets++;
          if (onProgress) onProgress(loadedAssets, totalAssets);
        });
        promises.push(promise);
      }
    }
    
    // Load audio
    if (manifest.audio) {
      for (const [id, path] of Object.entries(manifest.audio)) {
        const promise = this.loadAudio(id, path).then(() => {
          loadedAssets++;
          if (onProgress) onProgress(loadedAssets, totalAssets);
        });
        promises.push(promise);
      }
    }
    
    // Load JSON files
    if (manifest.json) {
      for (const [id, path] of Object.entries(manifest.json)) {
        const promise = this.loadJSON(id, path).then(() => {
          loadedAssets++;
          if (onProgress) onProgress(loadedAssets, totalAssets);
        });
        promises.push(promise);
      }
    }
    
    // Load images
    if (manifest.images) {
      for (const [id, path] of Object.entries(manifest.images)) {
        const promise = this.loadImage(id, path).then(() => {
          loadedAssets++;
          if (onProgress) onProgress(loadedAssets, totalAssets);
        });
        promises.push(promise);
      }
    }
    
    // Wait for all assets to load
    await Promise.all(promises);
    
    return this.assets;
  }
  
  /**
   * Load a texture and add it to the cache
   * @param {string} id - Asset identifier
   * @param {string} path - Path to the texture file
   * @returns {Promise<THREE.Texture>} The loaded texture
   */
  async loadTexture(id, path) {
    return new Promise((resolve, reject) => {
      this.loaders.texture.load(
        path,
        (texture) => {
          this.assets.textures[id] = texture;
          resolve(texture);
        },
        undefined,
        (error) => reject(new Error(`Failed to load texture: ${path}, ${error.message}`))
      );
    });
  }
  
  /**
   * Load a 3D model and add it to the cache
   * @param {string} id - Asset identifier
   * @param {string} path - Path to the model file
   * @param {string} type - Model type (gltf, obj, fbx)
   * @returns {Promise<Object>} The loaded model
   */
  async loadModel(id, path, type = 'gltf') {
    return new Promise((resolve, reject) => {
      const loader = this.loaders[type];
      
      if (!loader) {
        reject(new Error(`Unsupported model type: ${type}`));
        return;
      }
      
      loader.load(
        path,
        (model) => {
          this.assets.models[id] = model;
          resolve(model);
        },
        undefined,
        (error) => reject(new Error(`Failed to load model: ${path}, ${error.message}`))
      );
    });
  }
  
  /**
   * Load an audio file and add it to the cache
   * @param {string} id - Asset identifier
   * @param {string} path - Path to the audio file
   * @returns {Promise<AudioBuffer>} The loaded audio buffer
   */
  async loadAudio(id, path) {
    return new Promise((resolve, reject) => {
      this.loaders.audio.load(
        path,
        (buffer) => {
          this.assets.audio[id] = buffer;
          resolve(buffer);
        },
        undefined,
        (error) => reject(new Error(`Failed to load audio: ${path}, ${error.message}`))
      );
    });
  }
  
  /**
   * Load a JSON file and add it to the cache
   * @param {string} id - Asset identifier
   * @param {string} path - Path to the JSON file
   * @returns {Promise<Object>} The loaded JSON data
   */
  async loadJSON(id, path) {
    return new Promise((resolve, reject) => {
      this.loaders.json.setResponseType('json');
      this.loaders.json.load(
        path,
        (data) => {
          this.assets.json[id] = data;
          resolve(data);
        },
        undefined,
        (error) => reject(new Error(`Failed to load JSON: ${path}, ${error.message}`))
      );
    });
  }
  
  /**
   * Load an image and add it to the cache
   * @param {string} id - Asset identifier
   * @param {string} path - Path to the image file
   * @returns {Promise<Image>} The loaded image
   */
  async loadImage(id, path) {
    return new Promise((resolve, reject) => {
      this.loaders.image.load(
        path,
        (image) => {
          this.assets.images[id] = image;
          resolve(image);
        },
        undefined,
        (error) => reject(new Error(`Failed to load image: ${path}, ${error.message}`))
      );
    });
  }
  
  /**
   * Get an asset from the cache
   * @param {string} type - Asset type (textures, models, audio, etc.)
   * @param {string} id - Asset identifier
   * @returns {Object} The requested asset
   */
  getAsset(type, id) {
    if (!this.assets[type] || !this.assets[type][id]) {
      console.warn(`Asset not found: ${type}/${id}`);
      return null;
    }
    
    return this.assets[type][id];
  }
  
  /**
   * Count total number of assets in a manifest
   * @param {Object} manifest - Asset manifest
   * @returns {number} Total number of assets
   * @private
   */
  _countTotalAssets(manifest) {
    let count = 0;
    
    for (const category of Object.values(manifest)) {
      count += Object.keys(category).length;
    }
    
    return count;
  }
  
  /**
   * Get file type from a file path
   * @param {string} path - File path
   * @returns {string} File type
   * @private
   */
  _getFileType(path) {
    const extension = path.split('.').pop().toLowerCase();
    
    switch (extension) {
      case 'gltf':
      case 'glb':
        return 'gltf';
      case 'obj':
        return 'obj';
      case 'fbx':
        return 'fbx';
      default:
        return extension;
    }
  }
}

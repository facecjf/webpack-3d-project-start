import * as THREE from 'three';

export class AudioManager {
  constructor() {
    // Create audio listener
    this.listener = new THREE.AudioListener();
    
    // Sound collections
    this.sounds = {};
    this.music = {};
    
    // Global settings
    this.masterVolume = 1.0;
    this.soundVolume = 1.0;
    this.musicVolume = 0.7;
    this.muted = false;
    
    // Track currently playing music
    this.currentMusic = null;
    
    // Create audio context through the listener
    this.context = this.listener.context;
    
    // Set up audio context on user interaction
    this._setupAudioContextResuming();
  }
  
  /**
   * Set master volume for all audio
   * @param {number} volume - Volume level (0.0 to 1.0)
   */
  setMasterVolume(volume) {
    this.masterVolume = THREE.MathUtils.clamp(volume, 0, 1);
    this._updateAllVolumes();
  }
  
  /**
   * Set volume for sound effects
   * @param {number} volume - Volume level (0.0 to 1.0)
   */
  setSoundVolume(volume) {
    this.soundVolume = THREE.MathUtils.clamp(volume, 0, 1);
    this._updateSoundVolumes();
  }
  
  /**
   * Set volume for music
   * @param {number} volume - Volume level (0.0 to 1.0)
   */
  setMusicVolume(volume) {
    this.musicVolume = THREE.MathUtils.clamp(volume, 0, 1);
    this._updateMusicVolumes();
  }
  
  /**
   * Mute or unmute all audio
   * @param {boolean} muted - Whether audio should be muted
   */
  setMuted(muted) {
    this.muted = muted;
    this._updateAllVolumes();
  }
  
  /**
   * Create a sound from a loaded audio buffer
   * @param {string} id - Unique identifier for the sound
   * @param {AudioBuffer} buffer - Audio buffer
   * @param {Object} options - Sound options
   * @returns {THREE.Audio} The created sound
   */
  createSound(id, buffer, options = {}) {
    // Create Three.js audio object
    const sound = new THREE.Audio(this.listener);
    
    // Set audio buffer
    sound.setBuffer(buffer);
    
    // Apply options
    sound.setVolume(options.volume !== undefined ? options.volume : 1.0);
    sound.setLoop(options.loop !== undefined ? options.loop : false);
    
    // Store additional properties
    sound._baseVolume = sound.getVolume();
    sound._category = 'sound';
    
    // Apply the correct volume with global settings
    this._applySoundVolume(sound);
    
    // Store the sound
    this.sounds[id] = sound;
    
    return sound;
  }
  
  /**
   * Create music from a loaded audio buffer
   * @param {string} id - Unique identifier for the music
   * @param {AudioBuffer} buffer - Audio buffer
   * @param {Object} options - Music options
   * @returns {THREE.Audio} The created music
   */
  createMusic(id, buffer, options = {}) {
    // Create Three.js audio object
    const music = new THREE.Audio(this.listener);
    
    // Set audio buffer
    music.setBuffer(buffer);
    
    // Apply options
    music.setVolume(options.volume !== undefined ? options.volume : 1.0);
    music.setLoop(options.loop !== undefined ? options.loop : true);
    
    // Store additional properties
    music._baseVolume = music.getVolume();
    music._category = 'music';
    
    // Apply the correct volume with global settings
    this._applyMusicVolume(music);
    
    // Store the music
    this.music[id] = music;
    
    return music;
  }
  
  /**
   * Create a positional sound
   * @param {string} id - Unique identifier for the sound
   * @param {AudioBuffer} buffer - Audio buffer
   * @param {THREE.Object3D} object - Object to attach the sound to
   * @param {Object} options - Sound options
   * @returns {THREE.PositionalAudio} The created positional sound
   */
  createPositionalSound(id, buffer, object, options = {}) {
    // Create Three.js positional audio object
    const sound = new THREE.PositionalAudio(this.listener);
    
    // Set audio buffer
    sound.setBuffer(buffer);
    
    // Apply options
    sound.setVolume(options.volume !== undefined ? options.volume : 1.0);
    sound.setLoop(options.loop !== undefined ? options.loop : false);
    sound.setRefDistance(options.refDistance !== undefined ? options.refDistance : 1);
    sound.setRolloffFactor(options.rolloffFactor !== undefined ? options.rolloffFactor : 1);
    sound.setDistanceModel(options.distanceModel || 'inverse');
    
    // Add sound to object
    object.add(sound);
    
    // Store additional properties
    sound._baseVolume = sound.getVolume();
    sound._category = 'sound';
    
    // Apply the correct volume with global settings
    this._applySoundVolume(sound);
    
    // Store the sound
    this.sounds[id] = sound;
    
    return sound;
  }
  
  /**
   * Play a sound
   * @param {string} id - Identifier of the sound to play
   * @returns {THREE.Audio} The sound being played
   */
  playSound(id) {
    const sound = this.sounds[id];
    
    if (!sound) {
      console.warn(`Sound not found: ${id}`);
      return null;
    }
    
    // If sound is playing, stop it first
    if (sound.isPlaying) {
      sound.stop();
    }
    
    // Play the sound
    sound.play();
    
    return sound;
  }
  
  /**
   * Play music, stopping any currently playing music
   * @param {string} id - Identifier of the music to play
   * @param {Object} options - Options for playback
   * @returns {THREE.Audio} The music being played
   */
  playMusic(id, options = {}) {
    const music = this.music[id];
    
    if (!music) {
      console.warn(`Music not found: ${id}`);
      return null;
    }
    
    // Stop currently playing music with optional crossfade
    if (this.currentMusic && this.currentMusic.isPlaying) {
      if (options.crossfade) {
        this._crossfadeMusic(this.currentMusic, music, options.crossfadeDuration || 1.0);
      } else {
        this.currentMusic.stop();
      }
    }
    
    // Play the music if not crossfading
    if (!options.crossfade) {
      music.play();
    }
    
    // Set as current music
    this.currentMusic = music;
    
    return music;
  }
  
  /**
   * Stop a sound
   * @param {string} id - Identifier of the sound to stop
   */
  stopSound(id) {
    const sound = this.sounds[id];
    
    if (!sound) {
      console.warn(`Sound not found: ${id}`);
      return;
    }
    
    if (sound.isPlaying) {
      sound.stop();
    }
  }
  
  /**
   * Stop music
   * @param {string} id - Identifier of the music to stop (if omitted, stops current music)
   */
  stopMusic(id) {
    // If no ID is provided, stop current music
    if (!id && this.currentMusic) {
      this.currentMusic.stop();
      this.currentMusic = null;
      return;
    }
    
    const music = this.music[id];
    
    if (!music) {
      console.warn(`Music not found: ${id}`);
      return;
    }
    
    if (music.isPlaying) {
      music.stop();
    }
    
    if (this.currentMusic === music) {
      this.currentMusic = null;
    }
  }
  
  /**
   * Stop all audio
   */
  stopAll() {
    // Stop all sounds
    Object.values(this.sounds).forEach(sound => {
      if (sound.isPlaying) {
        sound.stop();
      }
    });
    
    // Stop all music
    Object.values(this.music).forEach(music => {
      if (music.isPlaying) {
        music.stop();
      }
    });
    
    this.currentMusic = null;
  }
  
  /**
   * Update listener position
   * @param {THREE.Object3D} camera - Camera or object to use for listener position
   */
  updateListener(camera) {
    this.listener.position.copy(camera.position);
    this.listener.quaternion.copy(camera.quaternion);
  }
  
  /**
   * Pause all audio (e.g., when game is paused)
   */
  pauseAll() {
    // Pause all sounds
    Object.values(this.sounds).forEach(sound => {
      if (sound.isPlaying) {
        sound.pause();
      }
    });
    
    // Pause all music
    Object.values(this.music).forEach(music => {
      if (music.isPlaying) {
        music.pause();
      }
    });
  }
  
  /**
   * Resume all paused audio
   */
  resumeAll() {
    // Resume context if needed
    if (this.context.state === 'suspended') {
      this.context.resume();
    }
    
    // Resume sounds
    Object.values(this.sounds).forEach(sound => {
      if (sound.buffer && !sound.isPlaying) {
        sound.play();
      }
    });
    
    // Resume music
    Object.values(this.music).forEach(music => {
      if (music.buffer && !music.isPlaying) {
        music.play();
      }
    });
  }
  
  /**
   * Clean up and dispose resources
   */
  dispose() {
    this.stopAll();
    
    // Dispose audio sources
    Object.values(this.sounds).forEach(sound => {
      sound.disconnect();
    });
    
    Object.values(this.music).forEach(music => {
      music.disconnect();
    });
    
    this.sounds = {};
    this.music = {};
    this.currentMusic = null;
  }
  
  /**
   * Apply mute state and volume to a sound
   * @param {THREE.Audio} sound - Sound to update
   * @private
   */
  _applySoundVolume(sound) {
    const effectiveVolume = this.muted ? 0 : sound._baseVolume * this.soundVolume * this.masterVolume;
    sound.setVolume(effectiveVolume);
  }
  
  /**
   * Apply mute state and volume to music
   * @param {THREE.Audio} music - Music to update
   * @private
   */
  _applyMusicVolume(music) {
    const effectiveVolume = this.muted ? 0 : music._baseVolume * this.musicVolume * this.masterVolume;
    music.setVolume(effectiveVolume);
  }
  
  /**
   * Update volumes for all sounds
   * @private
   */
  _updateSoundVolumes() {
    Object.values(this.sounds).forEach(sound => {
      this._applySoundVolume(sound);
    });
  }
  
  /**
   * Update volumes for all music
   * @private
   */
  _updateMusicVolumes() {
    Object.values(this.music).forEach(music => {
      this._applyMusicVolume(music);
    });
  }
  
  /**
   * Update volumes for all audio
   * @private
   */
  _updateAllVolumes() {
    this._updateSoundVolumes();
    this._updateMusicVolumes();
  }
  
  /**
   * Crossfade between two music tracks
   * @param {THREE.Audio} fromMusic - Music to fade out
   * @param {THREE.Audio} toMusic - Music to fade in
   * @param {number} duration - Duration of crossfade in seconds
   * @private
   */
  _crossfadeMusic(fromMusic, toMusic, duration) {
    const steps = 60;
    const interval = duration * 1000 / steps;
    
    // Store original volumes
    const fromBaseVolume = fromMusic.getVolume();
    const toBaseVolume = toMusic._baseVolume * this.musicVolume * this.masterVolume;
    
    // Start playing the new music at zero volume
    toMusic.setVolume(0);
    toMusic.play();
    
    // Perform the crossfade
    let step = 0;
    const fade = setInterval(() => {
      step++;
      const fadeRatio = step / steps;
      
      // Fade out the old music
      fromMusic.setVolume(fromBaseVolume * (1 - fadeRatio));
      
      // Fade in the new music
      toMusic.setVolume(toBaseVolume * fadeRatio);
      
      // When complete
      if (step >= steps) {
        clearInterval(fade);
        fromMusic.stop();
        toMusic.setVolume(toBaseVolume);
      }
    }, interval);
  }
  
  /**
   * Set up audio context resuming
   * @private
   */
  _setupAudioContextResuming() {
    // iOS and some browsers require user interaction to start audio context
    const resumeAudioContext = () => {
      if (this.context.state === 'suspended') {
        this.context.resume();
      }
      
      // Remove event listeners once audio is enabled
      document.removeEventListener('click', resumeAudioContext);
      document.removeEventListener('touchstart', resumeAudioContext);
      document.removeEventListener('keydown', resumeAudioContext);
    };
    
    document.addEventListener('click', resumeAudioContext);
    document.addEventListener('touchstart', resumeAudioContext);
    document.addEventListener('keydown', resumeAudioContext);
  }
}

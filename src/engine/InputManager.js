export class InputManager {
  constructor() {
    // Key states
    this.keys = {};
    this.previousKeys = {};
    
    // Mouse states
    this.mousePosition = { x: 0, y: 0 };
    this.mouseDelta = { x: 0, y: 0 };
    this.mouseButtons = { left: false, middle: false, right: false };
    this.previousMouseButtons = { left: false, middle: false, right: false };
    
    // Touch states
    this.touches = [];
    this.previousTouches = [];
    
    // Pointer lock state
    this.isPointerLocked = false;
    
    // Setup event listeners
    this._setupKeyboardEvents();
    this._setupMouseEvents();
    this._setupTouchEvents();
  }
  
  update() {
    // Update previous states for next frame
    this.previousKeys = { ...this.keys };
    this.previousMouseButtons = { ...this.mouseButtons };
    this.previousTouches = [...this.touches];
    
    // Reset mouse delta
    this.mouseDelta = { x: 0, y: 0 };
  }
  
  // Keyboard methods
  isKeyDown(keyCode) {
    return !!this.keys[keyCode];
  }
  
  isKeyPressed(keyCode) {
    return !!this.keys[keyCode] && !this.previousKeys[keyCode];
  }
  
  isKeyReleased(keyCode) {
    return !this.keys[keyCode] && !!this.previousKeys[keyCode];
  }
  
  // Mouse methods
  isMouseButtonDown(button) {
    return !!this.mouseButtons[button];
  }
  
  isMouseButtonPressed(button) {
    return !!this.mouseButtons[button] && !this.previousMouseButtons[button];
  }
  
  isMouseButtonReleased(button) {
    return !this.mouseButtons[button] && !!this.previousMouseButtons[button];
  }
  
  getMousePosition() {
    return { ...this.mousePosition };
  }
  
  getMouseDelta() {
    return { ...this.mouseDelta };
  }
  
  // Pointer lock methods
  requestPointerLock(element) {
    if (element.requestPointerLock) {
      element.requestPointerLock();
    }
  }
  
  exitPointerLock() {
    if (document.exitPointerLock) {
      document.exitPointerLock();
    }
  }
  
  isPointerLocked() {
    return this.isPointerLocked;
  }
  
  // Touch methods
  getTouches() {
    return [...this.touches];
  }
  
  // Private event setup methods
  _setupKeyboardEvents() {
    window.addEventListener('keydown', (event) => {
      this.keys[event.code] = true;
    });
    
    window.addEventListener('keyup', (event) => {
      this.keys[event.code] = false;
    });
    
    // Prevent default behavior for some keys
    window.addEventListener('keydown', (event) => {
      // Prevent default for arrow keys, space, etc. to avoid page scrolling
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(event.code)) {
        event.preventDefault();
      }
    });
  }
  
  _setupMouseEvents() {
    window.addEventListener('mousemove', (event) => {
      // Update mouse position
      const previousX = this.mousePosition.x;
      const previousY = this.mousePosition.y;
      
      this.mousePosition.x = event.clientX;
      this.mousePosition.y = event.clientY;
      
      // Calculate delta for non-pointer lock movement
      if (!this.isPointerLocked) {
        this.mouseDelta.x = this.mousePosition.x - previousX;
        this.mouseDelta.y = this.mousePosition.y - previousY;
      } else {
        // In pointer lock, movementX/Y gives the delta directly
        this.mouseDelta.x = event.movementX || 0;
        this.mouseDelta.y = event.movementY || 0;
      }
    });
    
    window.addEventListener('mousedown', (event) => {
      switch (event.button) {
        case 0: this.mouseButtons.left = true; break;
        case 1: this.mouseButtons.middle = true; break;
        case 2: this.mouseButtons.right = true; break;
      }
    });
    
    window.addEventListener('mouseup', (event) => {
      switch (event.button) {
        case 0: this.mouseButtons.left = false; break;
        case 1: this.mouseButtons.middle = false; break;
        case 2: this.mouseButtons.right = false; break;
      }
    });
    
    // Prevent context menu on right click
    window.addEventListener('contextmenu', (event) => {
      event.preventDefault();
    });
    
    // Pointer lock change
    document.addEventListener('pointerlockchange', () => {
      this.isPointerLocked = document.pointerLockElement !== null;
    });
  }
  
  _setupTouchEvents() {
    window.addEventListener('touchstart', (event) => {
      this._updateTouches(event.touches);
    });
    
    window.addEventListener('touchmove', (event) => {
      this._updateTouches(event.touches);
    });
    
    window.addEventListener('touchend', (event) => {
      this._updateTouches(event.touches);
    });
    
    window.addEventListener('touchcancel', (event) => {
      this._updateTouches(event.touches);
    });
  }
  
  _updateTouches(touchList) {
    this.touches = [];
    
    for (let i = 0; i < touchList.length; i++) {
      const touch = touchList[i];
      this.touches.push({
        id: touch.identifier,
        x: touch.clientX,
        y: touch.clientY
      });
    }
  }
}

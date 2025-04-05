import * as THREE from 'three';

export class PhysicsSystem {
  constructor(options = {}) {
    // Physics configuration
    this.gravity = options.gravity || { x: 0, y: -9.8, z: 0 };
    this.timeScale = options.timeScale || 1.0;
    
    // Collections for physics objects
    this.bodies = [];
    this.colliders = [];
    
    // Collision matrix for optimization
    this.collisionMatrix = {};
    
    // Debug information
    this.debugEnabled = options.debugEnabled || false;
    this.lastStepTime = 0;
  }
  
  /**
   * Add a physics body to the simulation
   * @param {Object} body - Physics body to add
   */
  addBody(body) {
    if (!body.id) {
      body.id = `body_${this.bodies.length}`;
    }
    
    this.bodies.push(body);
    
    return body;
  }
  
  /**
   * Remove a physics body from the simulation
   * @param {Object} body - Physics body to remove
   */
  removeBody(body) {
    const index = this.bodies.indexOf(body);
    if (index !== -1) {
      this.bodies.splice(index, 1);
      
      // Remove from collision matrix
      delete this.collisionMatrix[body.id];
      Object.keys(this.collisionMatrix).forEach(id => {
        delete this.collisionMatrix[id][body.id];
      });
    }
  }
  
  /**
   * Add a collider to the simulation
   * @param {Object} collider - Collider to add
   */
  addCollider(collider) {
    if (!collider.id) {
      collider.id = `collider_${this.colliders.length}`;
    }
    
    this.colliders.push(collider);
    
    return collider;
  }
  
  /**
   * Remove a collider from the simulation
   * @param {Object} collider - Collider to remove
   */
  removeCollider(collider) {
    const index = this.colliders.indexOf(collider);
    if (index !== -1) {
      this.colliders.splice(index, 1);
    }
  }
  
  /**
   * Create a simple physics body
   * @param {Object} options - Body options
   * @returns {Object} New physics body
   */
  createBody(options = {}) {
    const body = {
      id: options.id || `body_${this.bodies.length}`,
      position: options.position || new THREE.Vector3(),
      velocity: options.velocity || new THREE.Vector3(),
      acceleration: options.acceleration || new THREE.Vector3(),
      mass: options.mass || 1.0,
      restitution: options.restitution || 0.3,
      friction: options.friction || 0.5,
      isStatic: options.isStatic || false,
      shape: options.shape || 'box',
      dimensions: options.dimensions || new THREE.Vector3(1, 1, 1),
      userData: options.userData || {},
      
      // Methods to make it easier to work with the body
      applyForce(force) {
        if (this.isStatic) return;
        
        const forceVector = force instanceof THREE.Vector3 ? force : new THREE.Vector3(force.x, force.y, force.z);
        const acceleration = forceVector.divideScalar(this.mass);
        this.acceleration.add(acceleration);
      },
      
      applyImpulse(impulse) {
        if (this.isStatic) return;
        
        const impulseVector = impulse instanceof THREE.Vector3 ? impulse : new THREE.Vector3(impulse.x, impulse.y, impulse.z);
        const velocityChange = impulseVector.divideScalar(this.mass);
        this.velocity.add(velocityChange);
      },
    };
    
    return this.addBody(body);
  }
  
  /**
   * Create a simple collider
   * @param {Object} options - Collider options
   * @returns {Object} New collider
   */
  createCollider(options = {}) {
    const collider = {
      id: options.id || `collider_${this.colliders.length}`,
      position: options.position || new THREE.Vector3(),
      shape: options.shape || 'box',
      dimensions: options.dimensions || new THREE.Vector3(1, 1, 1),
      isTrigger: options.isTrigger || false,
      userData: options.userData || {},
      
      // Event handlers
      onCollisionEnter: options.onCollisionEnter || null,
      onCollisionStay: options.onCollisionStay || null,
      onCollisionExit: options.onCollisionExit || null,
      onTriggerEnter: options.onTriggerEnter || null,
      onTriggerStay: options.onTriggerStay || null,
      onTriggerExit: options.onTriggerExit || null,
    };
    
    return this.addCollider(collider);
  }
  
  /**
   * Update the physics simulation
   * @param {number} deltaTime - Time step for the update
   */
  update(deltaTime) {
    // Apply time scaling
    const scaledDelta = deltaTime * this.timeScale;
    
    // Skip if delta time is too small
    if (scaledDelta < 0.0001) return;
    
    // Update all physics bodies
    this.bodies.forEach(body => {
      if (body.isStatic) return;
      
      // Apply gravity
      body.acceleration.x += this.gravity.x;
      body.acceleration.y += this.gravity.y;
      body.acceleration.z += this.gravity.z;
      
      // Update velocity
      body.velocity.x += body.acceleration.x * scaledDelta;
      body.velocity.y += body.acceleration.y * scaledDelta;
      body.velocity.z += body.acceleration.z * scaledDelta;
      
      // Update position
      body.position.x += body.velocity.x * scaledDelta;
      body.position.y += body.velocity.y * scaledDelta;
      body.position.z += body.velocity.z * scaledDelta;
      
      // Reset acceleration for next frame
      body.acceleration.set(0, 0, 0);
    });
    
    // Check collisions (simple implementation)
    this._checkCollisions();
    
    // Update timing information
    this.lastStepTime = performance.now();
  }
  
  /**
   * Check for collisions between physics bodies and colliders
   * @private
   */
  _checkCollisions() {
    // This is a simplified collision detection system
    // In a real game, you'd use a more sophisticated algorithm or physics library
    
    // Check each dynamic body against static bodies and colliders
    for (let i = 0; i < this.bodies.length; i++) {
      const bodyA = this.bodies[i];
      
      if (bodyA.isStatic) continue;
      
      // Check against other bodies
      for (let j = 0; j < this.bodies.length; j++) {
        if (i === j) continue;
        
        const bodyB = this.bodies[j];
        
        // Initialize collision matrix entries if needed
        if (!this.collisionMatrix[bodyA.id]) {
          this.collisionMatrix[bodyA.id] = {};
        }
        
        // Check if collision occurred
        const isColliding = this._checkCollision(bodyA, bodyB);
        const wasColliding = this.collisionMatrix[bodyA.id][bodyB.id];
        
        // Update collision matrix
        this.collisionMatrix[bodyA.id][bodyB.id] = isColliding;
        
        // Handle collision events
        if (isColliding && !wasColliding) {
          this._handleCollisionEnter(bodyA, bodyB);
        } else if (isColliding && wasColliding) {
          this._handleCollisionStay(bodyA, bodyB);
        } else if (!isColliding && wasColliding) {
          this._handleCollisionExit(bodyA, bodyB);
        }
      }
      
      // Check against colliders
      for (let j = 0; j < this.colliders.length; j++) {
        const collider = this.colliders[j];
        
        // Initialize collision matrix entries if needed
        if (!this.collisionMatrix[bodyA.id]) {
          this.collisionMatrix[bodyA.id] = {};
        }
        
        // Check if collision occurred
        const isColliding = this._checkCollision(bodyA, collider);
        const wasColliding = this.collisionMatrix[bodyA.id][collider.id];
        
        // Update collision matrix
        this.collisionMatrix[bodyA.id][collider.id] = isColliding;
        
        // Handle collision events
        if (isColliding && !wasColliding) {
          if (collider.isTrigger) {
            if (collider.onTriggerEnter) collider.onTriggerEnter(bodyA);
          } else {
            this._handleCollisionEnter(bodyA, collider);
            if (collider.onCollisionEnter) collider.onCollisionEnter(bodyA);
          }
        } else if (isColliding && wasColliding) {
          if (collider.isTrigger) {
            if (collider.onTriggerStay) collider.onTriggerStay(bodyA);
          } else {
            this._handleCollisionStay(bodyA, collider);
            if (collider.onCollisionStay) collider.onCollisionStay(bodyA);
          }
        } else if (!isColliding && wasColliding) {
          if (collider.isTrigger) {
            if (collider.onTriggerExit) collider.onTriggerExit(bodyA);
          } else {
            if (collider.onCollisionExit) collider.onCollisionExit(bodyA);
          }
        }
      }
    }
  }
  
  /**
   * Check if two objects are colliding (simplified)
   * @param {Object} a - First object
   * @param {Object} b - Second object
   * @returns {boolean} True if objects are colliding
   * @private
   */
  _checkCollision(a, b) {
    // This is a very simplified collision check using bounding boxes
    // In a real game, you'd use more accurate collision detection
    
    // Only handle box-box collisions for simplicity
    if (a.shape !== 'box' || b.shape !== 'box') {
      return false;
    }
    
    // Check for AABB collision
    return (
      Math.abs(a.position.x - b.position.x) * 2 < (a.dimensions.x + b.dimensions.x) &&
      Math.abs(a.position.y - b.position.y) * 2 < (a.dimensions.y + b.dimensions.y) &&
      Math.abs(a.position.z - b.position.z) * 2 < (a.dimensions.z + b.dimensions.z)
    );
  }
  
  /**
   * Handle collision resolution when two objects start colliding
   * @param {Object} a - First object (typically a dynamic body)
   * @param {Object} b - Second object
   * @private
   */
  _handleCollisionEnter(a, b) {
    if (b.isStatic || b.isTrigger) {
      this._resolveCollision(a, b);
    } else {
      this._resolveCollisionDynamic(a, b);
    }
  }
  
  /**
   * Handle collision resolution when two objects continue colliding
   * @param {Object} a - First object (typically a dynamic body)
   * @param {Object} b - Second object
   * @private
   */
  _handleCollisionStay(a, b) {
    if (b.isStatic || b.isTrigger) {
      this._resolveCollision(a, b);
    } else {
      this._resolveCollisionDynamic(a, b);
    }
  }
  
  /**
   * Handle collision resolution when two objects stop colliding
   * @param {Object} a - First object
   * @param {Object} b - Second object
   * @private
   */
  _handleCollisionExit(a, b) {
    // Nothing to do for now
  }
  
  /**
   * Resolve collision between a dynamic body and a static object
   * @param {Object} body - Dynamic body
   * @param {Object} staticObj - Static object
   * @private
   */
  _resolveCollision(body, staticObj) {
    // Simplified collision resolution by pushing the body out
    const overlap = {
      x: (body.dimensions.x + staticObj.dimensions.x) / 2 - Math.abs(body.position.x - staticObj.position.x),
      y: (body.dimensions.y + staticObj.dimensions.y) / 2 - Math.abs(body.position.y - staticObj.position.y),
      z: (body.dimensions.z + staticObj.dimensions.z) / 2 - Math.abs(body.position.z - staticObj.position.z)
    };
    
    // Find the smallest overlap axis
    if (overlap.x < overlap.y && overlap.x < overlap.z) {
      // X-axis overlap is smallest
      const direction = body.position.x < staticObj.position.x ? -1 : 1;
      body.position.x += direction * overlap.x;
      body.velocity.x = -body.velocity.x * body.restitution;
    } else if (overlap.y < overlap.z) {
      // Y-axis overlap is smallest
      const direction = body.position.y < staticObj.position.y ? -1 : 1;
      body.position.y += direction * overlap.y;
      body.velocity.y = -body.velocity.y * body.restitution;
    } else {
      // Z-axis overlap is smallest
      const direction = body.position.z < staticObj.position.z ? -1 : 1;
      body.position.z += direction * overlap.z;
      body.velocity.z = -body.velocity.z * body.restitution;
    }
    
    // Apply friction
    if (body.friction > 0 && staticObj.friction > 0) {
      const combinedFriction = body.friction * staticObj.friction;
      body.velocity.x *= (1 - combinedFriction);
      body.velocity.z *= (1 - combinedFriction);
    }
  }
  
  /**
   * Resolve collision between two dynamic bodies
   * @param {Object} bodyA - First dynamic body
   * @param {Object} bodyB - Second dynamic body
   * @private
   */
  _resolveCollisionDynamic(bodyA, bodyB) {
    // Simplified collision resolution for two dynamic bodies
    
    // Calculate relative velocity
    const relativeVelocity = new THREE.Vector3(
      bodyA.velocity.x - bodyB.velocity.x,
      bodyA.velocity.y - bodyB.velocity.y,
      bodyA.velocity.z - bodyB.velocity.z
    );
    
    // Calculate collision normal (simplified)
    const normal = new THREE.Vector3(
      bodyB.position.x - bodyA.position.x,
      bodyB.position.y - bodyA.position.y,
      bodyB.position.z - bodyA.position.z
    ).normalize();
    
    // Calculate impulse strength
    const velocityAlongNormal = relativeVelocity.dot(normal);
    
    // Only apply impulse if objects are moving toward each other
    if (velocityAlongNormal > 0) return;
    
    // Calculate restitution (bounciness)
    const restitution = Math.min(bodyA.restitution, bodyB.restitution);
    
    // Calculate impulse scalar
    let impulseStrength = -(1 + restitution) * velocityAlongNormal;
    impulseStrength /= (1 / bodyA.mass) + (1 / bodyB.mass);
    
    // Apply impulse
    const impulse = normal.multiplyScalar(impulseStrength);
    
    bodyA.velocity.x += impulse.x / bodyA.mass;
    bodyA.velocity.y += impulse.y / bodyA.mass;
    bodyA.velocity.z += impulse.z / bodyA.mass;
    
    bodyB.velocity.x -= impulse.x / bodyB.mass;
    bodyB.velocity.y -= impulse.y / bodyB.mass;
    bodyB.velocity.z -= impulse.z / bodyB.mass;
    
    // Separate the bodies to prevent sticking
    const overlap = {
      x: (bodyA.dimensions.x + bodyB.dimensions.x) / 2 - Math.abs(bodyA.position.x - bodyB.position.x),
      y: (bodyA.dimensions.y + bodyB.dimensions.y) / 2 - Math.abs(bodyA.position.y - bodyB.position.y),
      z: (bodyA.dimensions.z + bodyB.dimensions.z) / 2 - Math.abs(bodyA.position.z - bodyB.position.z)
    };
    
    // Find the smallest overlap axis and separate bodies
    if (overlap.x < overlap.y && overlap.x < overlap.z) {
      const direction = bodyA.position.x < bodyB.position.x ? -1 : 1;
      const moveAmount = overlap.x / 2;
      bodyA.position.x += direction * moveAmount;
      bodyB.position.x -= direction * moveAmount;
    } else if (overlap.y < overlap.z) {
      const direction = bodyA.position.y < bodyB.position.y ? -1 : 1;
      const moveAmount = overlap.y / 2;
      bodyA.position.y += direction * moveAmount;
      bodyB.position.y -= direction * moveAmount;
    } else {
      const direction = bodyA.position.z < bodyB.position.z ? -1 : 1;
      const moveAmount = overlap.z / 2;
      bodyA.position.z += direction * moveAmount;
      bodyB.position.z -= direction * moveAmount;
    }
  }
}

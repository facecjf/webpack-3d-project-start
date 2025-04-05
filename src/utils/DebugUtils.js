export class DebugUtils {
  constructor(debugElement) {
    this.debugElement = debugElement;
    this.isEnabled = true;
    this.maxLogEntries = 10;
    this.logEntries = [];
    this.stats = {};
    
    // Initialize performance tracking
    this.frameCount = 0;
    this.lastTime = performance.now();
    this.frameTime = 0;
    this.renderTime = 0;
    this.updateTime = 0;
    this.physicsTime = 0;
  }
  
  /**
   * Enable or disable debug information
   * @param {boolean} enabled - Whether debug info should be displayed
   */
  setEnabled(enabled) {
    this.isEnabled = enabled;
    
    if (this.debugElement) {
      this.debugElement.style.display = enabled ? 'block' : 'none';
    }
  }
  
  /**
   * Log a debug message
   * @param {string} message - Message to log
   */
  log(message) {
    if (!this.isEnabled) return;
    
    console.log(`[DEBUG] ${message}`);
    
    this.logEntries.unshift({
      message,
      time: new Date().toISOString().substr(11, 8)
    });
    
    // Keep log entries under the maximum
    if (this.logEntries.length > this.maxLogEntries) {
      this.logEntries.pop();
    }
    
    this.updateDisplay();
  }
  
  /**
   * Log an error message
   * @param {string} message - Error message to log
   */
  error(message) {
    if (!this.isEnabled) return;
    
    console.error(`[ERROR] ${message}`);
    
    this.logEntries.unshift({
      message: `ERROR: ${message}`,
      time: new Date().toISOString().substr(11, 8),
      isError: true
    });
    
    // Keep log entries under the maximum
    if (this.logEntries.length > this.maxLogEntries) {
      this.logEntries.pop();
    }
    
    this.updateDisplay();
  }
  
  /**
   * Set a debug statistic
   * @param {string} key - Statistic name
   * @param {any} value - Statistic value
   */
  setStat(key, value) {
    if (!this.isEnabled) return;
    
    this.stats[key] = value;
    this.updateDisplay();
  }
  
  /**
   * Remove a debug statistic
   * @param {string} key - Statistic name to remove
   */
  removeStat(key) {
    if (this.stats[key] !== undefined) {
      delete this.stats[key];
      this.updateDisplay();
    }
  }
  
  /**
   * Clear all debug statistics
   */
  clearStats() {
    this.stats = {};
    this.updateDisplay();
  }
  
  /**
   * Clear log entries
   */
  clearLog() {
    this.logEntries = [];
    this.updateDisplay();
  }
  
  /**
   * Begin timing a frame
   */
  beginFrame() {
    if (!this.isEnabled) return;
    
    this.frameStartTime = performance.now();
  }
  
  /**
   * End timing a frame
   */
  endFrame() {
    if (!this.isEnabled || !this.frameStartTime) return;
    
    const now = performance.now();
    this.frameTime = now - this.frameStartTime;
    this.frameCount++;
    
    // Update FPS every 500ms
    if (now - this.lastTime > 500) {
      const fps = Math.round((this.frameCount * 1000) / (now - this.lastTime));
      this.setStat('FPS', fps);
      this.setStat('Frame Time', `${this.frameTime.toFixed(2)}ms`);
      
      // Reset counters
      this.frameCount = 0;
      this.lastTime = now;
    }
  }
  
  /**
   * Begin timing a specific operation
   * @param {string} type - Operation type (render, update, physics, etc.)
   */
  beginTime(type) {
    if (!this.isEnabled) return;
    
    this[`${type}StartTime`] = performance.now();
  }
  
  /**
   * End timing a specific operation
   * @param {string} type - Operation type (render, update, physics, etc.)
   */
  endTime(type) {
    if (!this.isEnabled || !this[`${type}StartTime`]) return;
    
    const time = performance.now() - this[`${type}StartTime`];
    this[`${type}Time`] = time;
    this.setStat(`${type} Time`, `${time.toFixed(2)}ms`);
  }
  
  /**
   * Update the debug display
   * @private
   */
  updateDisplay() {
    if (!this.debugElement || !this.isEnabled) return;
    
    // Build the HTML content
    let html = '<div class="debug-stats">';
    
    // Add statistics
    for (const [key, value] of Object.entries(this.stats)) {
      html += `<div><span>${key}:</span> ${value}</div>`;
    }
    
    html += '</div><div class="debug-log">';
    
    // Add log entries
    for (const entry of this.logEntries) {
      const className = entry.isError ? 'error-log' : '';
      html += `<div class="${className}"><span>[${entry.time}]</span> ${entry.message}</div>`;
    }
    
    html += '</div>';
    
    // Update the element content
    this.debugElement.innerHTML = html;
  }
  
  /**
   * Add CSS styles for the debug display
   */
  addStyles() {
    if (!document.querySelector('#debug-styles')) {
      const style = document.createElement('style');
      style.id = 'debug-styles';
      style.textContent = `
        .debug-stats {
          font-family: monospace;
          font-size: 12px;
          margin-bottom: 10px;
        }
        .debug-stats div {
          margin: 2px 0;
        }
        .debug-stats span {
          font-weight: bold;
        }
        .debug-log {
          font-family: monospace;
          font-size: 11px;
          max-height: 150px;
          overflow-y: auto;
        }
        .debug-log div {
          margin: 2px 0;
          white-space: nowrap;
        }
        .debug-log span {
          color: #aaa;
        }
        .error-log {
          color: #ff5555;
        }
      `;
      document.head.appendChild(style);
    }
  }
}

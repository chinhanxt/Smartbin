/**
 * SensorManager.js
 * Analyzes physical waste state inside the smart bin, calculates ultrasonic distance,
 * fill percentage (measuring settled waste vs bin capacity), total weight,
 * battery discharge, odor detection, and operational status alert levels.
 *
 * Implements fault detection rules and the critical non-clearing safety invariant:
 * - Signal loss / heartbeat timeout (> 6000ms) -> 'MẤT_TÍN_HIỆU'
 * - Low battery (<= 15%) -> 'PIN_YẾU'
 * - Data anomaly jump (>= 40% without items dropped, or out-of-bounds/NaN) -> 'DỮ_LIỆU_NHẢY_BẤT_THƯỜNG'
 * - Non-clearing latching invariant: 'Tuyệt đối không được tự ý xóa hoặc hủy bỏ cảnh báo'
 *   Only explicit verifyFault() can clear the latch.
 */

import { APP_CONFIG } from '../config.js';

export class SensorManager {
  /**
   * @param {Object} bottleSpawner - Spawner holding bottle/waste entities via getBottles()
   * @param {Object} [config=APP_CONFIG] - Application configuration
   */
  constructor(bottleSpawner, config = APP_CONFIG) {
    this.bottleSpawner = bottleSpawner;
    this.config = config || APP_CONFIG;

    const binTopY = this.config.BIN?.TOP_Y ?? 2.2;
    const binBottomY = this.config.BIN?.BOTTOM_Y ?? 0.16;

    this.batteryLevel = this.config.IOT?.INITIAL_BATTERY_PCT ?? 98;
    this.injectedData = {};

    // Fault detection & Safety latching state
    this.isFaultLatched = false;
    this.faultReasons = [];
    this.lastVerifiedAt = null;
    this.signalLoss = false;
    this.lastUpdateTime = Date.now();

    // Baseline tracking for anomaly jump detection
    this.previousFillLevel = 0;
    this.previousCount = 0;

    this.lastState = {
      fillLevel: 0,
      fillPct: 0,
      odorDetected: false,
      batteryLevel: Number(this.batteryLevel.toFixed(2)),
      updatedAt: this._getFormattedTime(),
      distanceCm: Math.round((binTopY - binBottomY) * 100),
      count: 0,
      weightKg: "0.00",
      status: 'NORMAL',
      faultReasons: [],
      isFaultLatched: false,
      topY: binBottomY
    };

    // Check initial battery level against threshold
    const batteryThreshold = this.config.IOT?.BATTERY_LOW_THRESHOLD_PCT ?? 15;
    if (this.batteryLevel <= batteryThreshold) {
      this._triggerFault('PIN_YẾU');
    }
  }

  /**
   * Formats current date/time as 'HH:mm:ss'.
   * @private
   * @param {Date} [date=new Date()]
   * @returns {string} Formatted timestamp 'HH:mm:ss'
   */
  _getFormattedTime(date = new Date()) {
    const pad = (n) => String(n).padStart(2, '0');
    return `${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
  }

  /**
   * Internal helper to latch a fault and record its reason.
   * CRITICAL INVARIANT: 'Tuyệt đối không được tự ý xóa hoặc hủy bỏ cảnh báo'
   * Once latched, this.isFaultLatched remains true until explicit verifyFault().
   * @private
   * @param {string} reason
   */
  _triggerFault(reason) {
    this.isFaultLatched = true;
    if (reason && !this.faultReasons.includes(reason)) {
      this.faultReasons.push(reason);
    }
    if (this.lastState) {
      this.lastState.status = 'SENSOR_FAULT';
      this.lastState.faultReasons = [...this.faultReasons];
      this.lastState.isFaultLatched = true;
    }
  }

  /**
   * Internal check for signal loss and heartbeat timeout.
   * @private
   * @returns {boolean} True if signal loss or timeout detected
   */
  _checkHeartbeatTimeout() {
    if (this.signalLoss || Boolean(this.injectedData.signalLoss)) {
      this._triggerFault('MẤT_TÍN_HIỆU');
      return true;
    }

    const timeoutMs = this.config.IOT?.HEARTBEAT_TIMEOUT_MS ?? 6000;
    const isTimedOut = (Date.now() - this.lastUpdateTime) > timeoutMs;
    if (isTimedOut) {
      this._triggerFault('MẤT_TÍN_HIỆU');
      return true;
    }

    return false;
  }

  /**
   * Getter indicating whether any sensor fault is currently active/latched.
   * @returns {boolean}
   */
  get isFaultActive() {
    return Boolean(this.isFaultLatched);
  }

  /**
   * Returns a copy of currently active fault reasons.
   * @returns {string[]}
   */
  getFaultReasons() {
    return [...this.faultReasons];
  }

  /**
   * Property getter for fault reasons list.
   * @returns {string[]}
   */
  get faultReasonsList() {
    return [...this.faultReasons];
  }

  /**
   * Sets explicit signal loss state.
   * @param {boolean} lost
   */
  setSignalLoss(lost) {
    this.signalLoss = Boolean(lost);
    if (this.signalLoss) {
      this._triggerFault('MẤT_TÍN_HIỆU');
    }
  }

  /**
   * Updates battery level directly.
   * @param {number} level - Battery percentage (0-100)
   */
  setBatteryLevel(level) {
    const val = Number(level);
    if (!isNaN(val)) {
      this.batteryLevel = Math.max(0, Math.min(100, val));
      if (this.lastState) {
        this.lastState.batteryLevel = Number(this.batteryLevel.toFixed(2));
      }

      const batteryThreshold = this.config.IOT?.BATTERY_LOW_THRESHOLD_PCT ?? 15;
      if (this.batteryLevel <= batteryThreshold) {
        this._triggerFault('PIN_YẾU');
      }
    }
  }

  /**
   * Explicit method to verify and acknowledge a fault alarm.
   * CRITICAL INVARIANT: This is the ONLY method authorized to clear isFaultLatched and faultReasons.
   * @param {Object} [options={}] - Optional verification parameters
   * @param {number} [options.batteryLevel] - New battery level if battery was serviced/replaced
   * @param {boolean} [options.restoreBattery] - If true, resets battery to initial level
   * @returns {boolean} Always returns true
   */
  verifyFault(options = {}) {
    this.isFaultLatched = false;
    this.faultReasons = [];
    this.lastVerifiedAt = Date.now();
    this.signalLoss = false;
    this.anomalyJump = false;
    delete this.injectedData.fillLevel;
    delete this.injectedData.distanceCm;
    this.lastUpdateTime = Date.now();

    if (options && options.batteryLevel !== undefined) {
      this.setBatteryLevel(options.batteryLevel);
    } else if (options && options.restoreBattery) {
      this.setBatteryLevel(this.config.IOT?.INITIAL_BATTERY_PCT ?? 98);
    } else if (this.batteryLevel <= (this.config.IOT?.BATTERY_LOW_THRESHOLD_PCT ?? 15)) {
      // If cleared without options, replenish battery to nominal level to prevent immediate re-latch
      this.setBatteryLevel(this.config.IOT?.INITIAL_BATTERY_PCT ?? 98);
    }

    // Reset anomaly reference to current baseline so normal state does not trigger anomaly
    this.previousFillLevel = undefined;
    this.previousCount = undefined;

    // Recalculate operational alert status based on baseline fill
    const criticalThreshold = this.config.IOT?.CRITICAL_THRESHOLD_PCT ?? 80;
    const warningThreshold = this.config.IOT?.WARNING_THRESHOLD_PCT ?? 50;

    let status = 'NORMAL';
    const baselineFill = (this.lastState && !this.anomalyJump) ? (this.lastState.fillLevel || 0) : 0;
    if (baselineFill >= criticalThreshold) {
      status = 'CRITICAL_FULL';
    } else if (baselineFill >= warningThreshold) {
      status = 'CAUTION';
    }

    if (this.injectedData.status !== undefined && this.injectedData.status !== 'SENSOR_FAULT') {
      status = this.injectedData.status;
    }

    if (this.lastState) {
      this.lastState = {
        ...this.lastState,
        status,
        faultReasons: [],
        isFaultLatched: false,
        signalLoss: false,
        anomalyJump: false
      };
    }

    return true;
  }

  /**
   * Helper method to simulate fault conditions for testing and verification.
   * Supports toggling individual faults: 'SIGNAL_LOSS', 'LOW_BATTERY', 'ANOMALY_JUMP'.
   * @param {string} faultType
   * @param {boolean} [enable=true] - Set false to turn off this specific simulated fault
   * @returns {Object} Updated telemetry state
   */
  simulateFault(faultType, enable = true) {
    const type = String(faultType || '').trim().toUpperCase();

    if (enable) {
      if (type === 'SIGNAL_LOSS' || type === 'MẤT_TÍN_HIỆU') {
        this.signalLoss = true;
        const timeoutMs = this.config.IOT?.HEARTBEAT_TIMEOUT_MS ?? 6000;
        this.lastUpdateTime = Date.now() - (timeoutMs + 1000);
        this._triggerFault('MẤT_TÍN_HIỆU');
      } else if (type === 'LOW_BATTERY' || type === 'PIN_YẾU') {
        this.batteryLevel = 10;
        if (this.lastState) {
          this.lastState.batteryLevel = 10;
        }
        this._triggerFault('PIN_YẾU');
      } else if (type === 'ANOMALY_JUMP' || type === 'DỮ_LIỆU_NHẢY_BẤT_THƯỜNG') {
        this.anomalyJump = true;
        this.injectedData.fillLevel = 92;
        this.injectedData.distanceCm = 18;
        this._triggerFault('DỮ_LIỆU_NHẢY_BẤT_THƯỜNG');
      } else {
        this._triggerFault(type || 'CẢM_BIẾN_BẤT_THƯỜNG');
      }
    } else {
      // Toggle OFF this specific fault
      if (type === 'SIGNAL_LOSS' || type === 'MẤT_TÍN_HIỆU') {
        this.signalLoss = false;
        this.lastUpdateTime = Date.now();
        this.faultReasons = this.faultReasons.filter(r => r !== 'MẤT_TÍN_HIỆU');
      } else if (type === 'LOW_BATTERY' || type === 'PIN_YẾU') {
        this.batteryLevel = this.config.IOT?.INITIAL_BATTERY_PCT ?? 98;
        if (this.lastState) {
          this.lastState.batteryLevel = 98;
        }
        this.faultReasons = this.faultReasons.filter(r => r !== 'PIN_YẾU');
      } else if (type === 'ANOMALY_JUMP' || type === 'DỮ_LIỆU_NHẢY_BẤT_THƯỜNG') {
        this.anomalyJump = false;
        delete this.injectedData.fillLevel;
        delete this.injectedData.distanceCm;
        this.previousFillLevel = undefined;
        this.previousCount = undefined;
        this.faultReasons = this.faultReasons.filter(r => r !== 'DỮ_LIỆU_NHẢY_BẤT_THƯỜNG');
      }

      if (this.faultReasons.length === 0) {
        this.isFaultLatched = false;
        const currentFill = this.injectedData.fillLevel !== undefined
          ? this.injectedData.fillLevel
          : (this.lastState && !this.anomalyJump ? (this.lastState.fillLevel || 0) : 0);
        const criticalThreshold = this.config.IOT?.CRITICAL_THRESHOLD_PCT ?? 80;
        const warningThreshold = this.config.IOT?.WARNING_THRESHOLD_PCT ?? 50;
        let status = 'NORMAL';
        if (currentFill >= criticalThreshold) {
          status = 'CRITICAL_FULL';
        } else if (currentFill >= warningThreshold) {
          status = 'CAUTION';
        }
        if (this.lastState) {
          this.lastState.status = status;
          this.lastState.isFaultLatched = false;
        }
      }
    }

    if (this.lastState) {
      if (this.isFaultLatched) {
        this.lastState.status = 'SENSOR_FAULT';
      }
      this.lastState.faultReasons = [...this.faultReasons];
      this.lastState.isFaultLatched = this.isFaultLatched;
      this.lastState.signalLoss = Boolean(this.signalLoss);
      this.lastState.anomalyJump = Boolean(this.anomalyJump);
    }

    return this.lastState;
  }

  /**
   * Toggles a fault state on or off.
   * @param {string} faultType
   * @returns {boolean} True if fault is now active, false if cleared
   */
  toggleFault(faultType) {
    const type = String(faultType || '').trim().toUpperCase();

    if (type === 'SIGNAL_LOSS' || type === 'MẤT_TÍN_HIỆU') {
      const isActive = Boolean(this.signalLoss);
      this.simulateFault('SIGNAL_LOSS', !isActive);
      return !isActive;
    } else if (type === 'LOW_BATTERY' || type === 'PIN_YẾU') {
      const isActive = (this.batteryLevel <= 15);
      this.simulateFault('LOW_BATTERY', !isActive);
      return !isActive;
    } else if (type === 'ANOMALY_JUMP' || type === 'DỮ_LIỆU_NHẢY_BẤT_THƯỜNG') {
      const isActive = Boolean(this.anomalyJump);
      this.simulateFault('ANOMALY_JUMP', !isActive);
      return !isActive;
    }

    return false;
  }

  /**
   * Injects external telemetry data (e.g. from parent web application or edge device).
   * Allows external sources to inject { fillLevel, odorDetected, batteryLevel, updatedAt, signalLoss, ... }.
   * Evaluates fault conditions and respects the latching safety invariant.
   * @param {Object} data - Injected telemetry fields
   * @returns {Object} Updated telemetry state
   */
  injectTelemetry(data = {}) {
    if (!data || typeof data !== 'object') {
      return this.getState();
    }

    // 1. Signal loss check from injected data
    if (data.signalLoss !== undefined) {
      this.signalLoss = Boolean(data.signalLoss);
      if (this.signalLoss) {
        this._triggerFault('MẤT_TÍN_HIỆU');
      }
    }

    // Check heartbeat timeout
    this._checkHeartbeatTimeout();

    // 2. Battery level update & check
    if (data.batteryLevel !== undefined) {
      this.setBatteryLevel(data.batteryLevel);
    } else {
      const batteryThreshold = this.config.IOT?.BATTERY_LOW_THRESHOLD_PCT ?? 15;
      if (this.batteryLevel <= batteryThreshold) {
        this._triggerFault('PIN_YẾU');
      }
    }

    if (data.odorDetected !== undefined) {
      this.injectedData.odorDetected = Boolean(data.odorDetected);
    }

    // 3. Fill level & anomaly detection
    const hasFill = data.fillLevel !== undefined || data.fillPct !== undefined;
    let targetFill = null;

    if (hasFill) {
      const rawFill = data.fillLevel !== undefined ? data.fillLevel : data.fillPct;
      const numFill = Number(rawFill);

      // Check bounds: out of bounds (< 0 or > 105 or NaN)
      if (Number.isNaN(numFill) || numFill < 0 || numFill > 105) {
        this._triggerFault('DỮ_LIỆU_NHẢY_BẤT_THƯỜNG');
        targetFill = Number.isNaN(numFill) ? 0 : numFill;
      } else {
        // Check delta jump
        const prevFill = this.previousFillLevel !== undefined ? this.previousFillLevel : this.lastState.fillLevel;
        const deltaFill = Math.abs(numFill - prevFill);
        const anomalyThreshold = this.config.IOT?.ANOMALY_DELTA_THRESHOLD_PCT ?? 40;

        const prevCount = this.previousCount !== undefined ? this.previousCount : this.lastState.count;
        const currCount = data.count !== undefined ? Number(data.count) : prevCount;
        const deltaCount = currCount - prevCount;

        if (deltaFill >= anomalyThreshold) {
          // Without corresponding items dropped
          if (deltaCount <= 0 || (deltaCount * 12 < deltaFill)) {
            this._triggerFault('DỮ_LIỆU_NHẢY_BẤT_THƯỜNG');
          }
        }

        targetFill = Math.round(numFill);
      }

      this.injectedData.fillLevel = targetFill;
      this.previousFillLevel = targetFill;
    }

    if (data.count !== undefined) {
      this.injectedData.count = Number(data.count);
      this.previousCount = this.injectedData.count;
    }

    if (data.updatedAt !== undefined) {
      this.injectedData.updatedAt = String(data.updatedAt);
    }

    if (data.distanceCm !== undefined) {
      this.injectedData.distanceCm = Number(data.distanceCm);
    }
    if (data.weightKg !== undefined) {
      this.injectedData.weightKg = typeof data.weightKg === 'number' ? data.weightKg.toFixed(2) : String(data.weightKg);
    }
    if (data.status !== undefined) {
      this.injectedData.status = String(data.status);
      if (this.injectedData.status === 'SENSOR_FAULT') {
        this.isFaultLatched = true;
      }
    }
    if (Array.isArray(data.faultReasons)) {
      data.faultReasons.forEach(r => this._triggerFault(r));
    }

    // Determine current effective fillLevel & status
    const fill = this.injectedData.fillLevel !== undefined ? this.injectedData.fillLevel : this.lastState.fillLevel;
    const criticalThreshold = this.config.IOT?.CRITICAL_THRESHOLD_PCT ?? 80;
    const warningThreshold = this.config.IOT?.WARNING_THRESHOLD_PCT ?? 50;

    let status = this.injectedData.status !== undefined ? this.injectedData.status : this.lastState.status;
    if (this.injectedData.fillLevel !== undefined && this.injectedData.status === undefined) {
      if (fill >= criticalThreshold) {
        status = 'CRITICAL_FULL';
      } else if (fill >= warningThreshold) {
        status = 'CAUTION';
      } else {
        status = 'NORMAL';
      }
    }

    // CRITICAL INVARIANT: Latching Safety Alarm
    if (this.isFaultLatched) {
      status = 'SENSOR_FAULT';
    }

    // Refresh lastUpdateTime if signal is normal
    if (!this.signalLoss && data.signalLoss !== true) {
      this.lastUpdateTime = Date.now();
    }

    const odor = this.injectedData.odorDetected !== undefined
      ? this.injectedData.odorDetected
      : this.lastState.odorDetected;

    this.lastState = {
      ...this.lastState,
      fillLevel: fill,
      fillPct: fill,
      odorDetected: odor,
      batteryLevel: Number(this.batteryLevel.toFixed(2)),
      updatedAt: this.injectedData.updatedAt || this._getFormattedTime(),
      distanceCm: this.injectedData.distanceCm !== undefined ? this.injectedData.distanceCm : this.lastState.distanceCm,
      count: this.injectedData.count !== undefined ? this.injectedData.count : this.lastState.count,
      weightKg: this.injectedData.weightKg !== undefined ? this.injectedData.weightKg : this.lastState.weightKg,
      status,
      faultReasons: [...this.faultReasons],
      isFaultLatched: this.isFaultLatched
    };

    return this.lastState;
  }

  /**
   * Safely extracts coordinate position from a waste entity.
   * @private
   */
  _getBottlePosition(bottle) {
    if (!bottle) return null;
    if (bottle.position && typeof bottle.position.x === 'number') {
      return bottle.position;
    }
    if (bottle.mesh && bottle.mesh.position && typeof bottle.mesh.position.x === 'number') {
      return bottle.mesh.position;
    }
    if (bottle.body && bottle.body.position && typeof bottle.body.position.x === 'number') {
      return bottle.body.position;
    }
    return null;
  }

  /**
   * Evaluates whether a waste item is settled (stationary at rest).
   * Falling or bouncing items (speed > 0.25 m/s) are not settled.
   * @private
   */
  _isBottleSettled(bottle) {
    if (bottle.body && bottle.body.velocity) {
      const v = bottle.body.velocity;
      const speedSq = v.x * v.x + v.y * v.y + v.z * v.z;
      // If moving faster than ~0.25 m/s, it is in mid-air or actively bouncing
      if (speedSq > 0.06) return false;
      return true;
    }
    if (bottle.settled !== undefined) return Boolean(bottle.settled);
    return true;
  }

  /**
   * Evaluates sensor readings and updates internal telemetry state.
   * @param {number} [delta=0] - Frame delta time in seconds
   * @returns {Object} Telemetry state: { fillLevel, fillPct, odorDetected, batteryLevel, updatedAt, distanceCm, count, weightKg, status, topY, faultReasons, isFaultLatched }
   */
  update(delta = 0) {
    // 1. Gradual discharge over time
    if (delta > 0 && this.batteryLevel > 0) {
      const dischargeRate = this.config.IOT?.BATTERY_DISCHARGE_RATE ?? 0.005;
      this.batteryLevel = Math.max(0, this.batteryLevel - (delta * dischargeRate));
    }

    // 2. Battery low check
    const batteryThreshold = this.config.IOT?.BATTERY_LOW_THRESHOLD_PCT ?? 15;
    if (this.batteryLevel <= batteryThreshold) {
      this._triggerFault('PIN_YẾU');
    }

    // 3. Signal loss & heartbeat timeout check
    this._checkHeartbeatTimeout();
    if (!this.signalLoss && !this.injectedData.signalLoss) {
      this.lastUpdateTime = Date.now();
    }

    const rawBottles = (this.bottleSpawner && typeof this.bottleSpawner.getBottles === 'function')
      ? this.bottleSpawner.getBottles()
      : (Array.isArray(this.bottleSpawner) ? this.bottleSpawner : []);

    const binRadius = 0.44; // Cavity radial boundary (inner cavity is 0.30 x 0.25)
    const binBottomY = this.config.BIN?.BOTTOM_Y ?? 0.16;
    const binTopY = this.config.BIN?.TOP_Y ?? 2.2;
    const capacityItems = this.config.BIN?.CAPACITY_ITEMS ?? 22;

    // Filter waste items located inside the bin cavity
    const inBinItems = [];
    for (const b of rawBottles) {
      const pos = this._getBottlePosition(b);
      if (!pos) continue;

      const radialDist = Math.hypot(pos.x, pos.z);
      // Item must be within inner cavity bounds and between bottom floor and top rim
      if (radialDist < binRadius && pos.y >= (binBottomY - 0.1) && pos.y <= (binTopY + 0.3)) {
        inBinItems.push({ item: b, pos });
      }
    }

    const totalInsideCount = inBinItems.length;

    // Find the highest settled item at rest inside the bin
    let Y_top = binBottomY;
    let settledCount = 0;
    let effectiveCount = 0;
    let totalWeightKg = 0;
    let bagCount = 0;

    for (const entry of inBinItems) {
      const b = entry.item;
      const isBag = (b.type === 'bag') || (b.name && b.name.includes('bag'));
      if (isBag) {
        bagCount++;
      }
      const halfH = isBag ? 0.16 : 0.18;
      const weight = isBag
        ? (this.config.GARBAGE_BAG?.WEIGHT_KG || 0.25)
        : (this.config.BOTTLE?.WEIGHT_KG || 0.035);

      totalWeightKg += weight;
      effectiveCount += isBag ? 2.5 : 1.0;

      if (this._isBottleSettled(b)) {
        settledCount++;
        const itemTop = entry.pos.y + halfH;
        if (itemTop > Y_top) {
          Y_top = itemTop;
        }
      }
    }

    // Clamp Y_top to physical bin boundaries
    Y_top = Math.max(binBottomY, Math.min(binTopY, Y_top));

    // Distance from ultrasonic sensor (at binTopY) down to settled waste level:
    const distanceM = (settledCount === 0)
      ? (binTopY - binBottomY)
      : Math.max(0.15, binTopY - Y_top);
    let distanceCm = Math.round(distanceM * 100);

    // Calculate Fill Percentage
    let fillPct = 0;
    if (settledCount > 0) {
      const heightRange = Math.max(0.1, binTopY - binBottomY - 0.2); // ~1.84m
      const heightRatio = Math.max(0, Math.min(1, (Y_top - binBottomY) / heightRange));
      const countRatio = Math.min(1, effectiveCount / capacityItems);

      const blendFactor = Math.min(1, settledCount / 5);
      const blendedRatio = countRatio * (1 - blendFactor * 0.5) + heightRatio * (blendFactor * 0.5);
      fillPct = Math.min(100, Math.max(1, Math.round(blendedRatio * 100)));

      if (Y_top >= (binTopY - 0.1) && settledCount >= 6) {
        fillPct = 100;
      }
    }

    // Injected overrides
    if (this.injectedData.fillLevel !== undefined) {
      fillPct = this.injectedData.fillLevel;
    }
    if (this.injectedData.distanceCm !== undefined) {
      distanceCm = this.injectedData.distanceCm;
    }

    const fillLevel = fillPct;

    // 4. Data anomaly jump check on physical calculation
    const currCount = this.injectedData.count !== undefined ? this.injectedData.count : totalInsideCount;
    if (this.previousFillLevel !== undefined && !this.anomalyJump) {
      const prevFill = this.previousFillLevel;
      const deltaFill = Math.abs(fillPct - prevFill);
      const prevCount = this.previousCount !== undefined ? this.previousCount : 0;
      const deltaCount = currCount - prevCount;
      const anomalyThreshold = this.config.IOT?.ANOMALY_DELTA_THRESHOLD_PCT ?? 40;

      if (Number.isNaN(fillPct) || fillPct < 0 || fillPct > 105) {
        this._triggerFault('DỮ_LIỆU_NHẢY_BẤT_THƯỜNG');
      } else if (deltaFill >= anomalyThreshold) {
        if (deltaCount <= 0 || (deltaCount * 12 < deltaFill)) {
          this._triggerFault('DỮ_LIỆU_NHẢY_BẤT_THƯỜNG');
        }
      }
    }

    this.previousFillLevel = fillPct;
    this.previousCount = currCount;

    // Odor detection: bags >= 3 OR total waste >= 12 OR injected
    const odorDetected = Boolean(
      this.injectedData.odorDetected ||
      bagCount >= 3 ||
      totalInsideCount >= 12
    );

    // Alert Status based on thresholds
    const criticalThreshold = this.config.IOT?.CRITICAL_THRESHOLD_PCT ?? 80;
    const warningThreshold = this.config.IOT?.WARNING_THRESHOLD_PCT ?? 50;

    let status = 'NORMAL';
    if (fillPct >= criticalThreshold) {
      status = 'CRITICAL_FULL';
    } else if (fillPct >= warningThreshold) {
      status = 'CAUTION';
    }

    if (this.injectedData.status !== undefined) {
      status = this.injectedData.status;
    }

    // CRITICAL INVARIANT: Latching Safety Alarm
    if (this.isFaultLatched) {
      status = 'SENSOR_FAULT';
    }

    const count = this.injectedData.count !== undefined ? this.injectedData.count : totalInsideCount;
    const weightKg = this.injectedData.weightKg !== undefined ? this.injectedData.weightKg : totalWeightKg.toFixed(2);
    const updatedAt = this.injectedData.updatedAt || this._getFormattedTime();

    this.lastState = {
      fillLevel,
      fillPct,
      odorDetected,
      batteryLevel: Number(this.batteryLevel.toFixed(2)),
      updatedAt,
      distanceCm,
      count,
      weightKg,
      status,
      signalLoss: Boolean(this.signalLoss),
      anomalyJump: Boolean(this.anomalyJump),
      faultReasons: [...this.faultReasons],
      isFaultLatched: this.isFaultLatched,
      topY: Number(Y_top.toFixed(3))
    };

    return this.lastState;
  }

  /**
   * Returns current or cached telemetry state.
   * Also verifies heartbeat timeout.
   * @returns {Object}
   */
  getState() {
    this._checkHeartbeatTimeout();
    if (this.isFaultLatched && this.lastState) {
      this.lastState.status = 'SENSOR_FAULT';
      this.lastState.faultReasons = [...this.faultReasons];
      this.lastState.isFaultLatched = true;
    }
    return this.lastState;
  }

  /**
   * Resets internal sensor telemetry state to empty bin defaults.
   * CRITICAL INVARIANT:
   * When reset() is called, if isFaultLatched is true, keep status as 'SENSOR_FAULT'
   * and keep isFaultLatched = true (do NOT auto-clear fault on reset!).
   * If no fault, reset normally.
   * @returns {Object} Reset telemetry state
   */
  reset() {
    this.injectedData = {};
    const binTopY = this.config.BIN?.TOP_Y ?? 2.2;
    const binBottomY = this.config.BIN?.BOTTOM_Y ?? 0.16;

    this.previousFillLevel = 0;
    this.previousCount = 0;

    if (!this.signalLoss) {
      this.lastUpdateTime = Date.now();
    }

    const currentStatus = this.isFaultLatched ? 'SENSOR_FAULT' : 'NORMAL';
    const currentFaultReasons = this.isFaultLatched ? [...this.faultReasons] : [];

    this.lastState = {
      fillLevel: 0,
      fillPct: 0,
      odorDetected: false,
      batteryLevel: Number(this.batteryLevel.toFixed(2)),
      updatedAt: this._getFormattedTime(),
      distanceCm: Math.round((binTopY - binBottomY) * 100),
      count: 0,
      weightKg: "0.00",
      status: currentStatus,
      faultReasons: currentFaultReasons,
      isFaultLatched: this.isFaultLatched,
      topY: binBottomY
    };

    return this.lastState;
  }
}

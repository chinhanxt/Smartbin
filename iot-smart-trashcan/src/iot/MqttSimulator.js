/**
 * MqttSimulator.js
 * Simulates an IoT edge device MQTT telemetry publisher for the Smart Waste Bin.
 * Dispatches structured JSON payloads periodically (every 1.5s) and immediately
 * upon state changes, lid actuation, bottle deposits, or bin reset events.
 */

import { APP_CONFIG } from '../config.js';

export class MqttSimulator {
  /**
   * @param {Object} sensorManager - Instance of SensorManager
   * @param {Function} onMessageCallback - Callback invoked with published telemetry payload
   * @param {Object} [options={}] - Configuration options
   */
  constructor(sensorManager, onMessageCallback, options = {}) {
    this.sensorManager = sensorManager;
    this.onMessageCallback = onMessageCallback;

    this.devId = options.devId || 'SMART-BIN-092';
    this.topic = options.topic || `/smart-bin/092/telemetry`;
    this.intervalMs = options.intervalMs || APP_CONFIG?.IOT?.POLL_INTERVAL_MS || 1500;

    this.lidOpen = false;
    this.batteryPct = options.batteryPct ?? 98;
    this.rssiDbm = options.rssiDbm ?? -72;

    this.lastStatus = null;
    this.timerId = null;
    this.isRunning = false;
  }

  /**
   * Safely retrieves current sensor reading state from SensorManager.
   * @private
   */
  _getSensorState() {
    if (!this.sensorManager) {
      return {
        fillLevel: 0,
        fillPct: 0,
        odorDetected: false,
        batteryLevel: 98,
        updatedAt: '00:00:00',
        distanceCm: 220,
        count: 0,
        weightKg: "0.00",
        status: 'NORMAL',
        topY: 0
      };
    }

    if (typeof this.sensorManager.getState === 'function') {
      return this.sensorManager.getState();
    }

    return this.sensorManager.lastState || {
      fillLevel: 0,
      fillPct: 0,
      odorDetected: false,
      batteryLevel: 98,
      updatedAt: '00:00:00',
      distanceCm: 220,
      count: 0,
      weightKg: "0.00",
      status: 'NORMAL',
      topY: 0
    };
  }

  /**
   * Sets current lid state (open or closed).
   * @param {boolean|string} openOrState - true/"OPEN" or false/"CLOSED"
   */
  setLidState(openOrState) {
    const wasOpen = this.lidOpen;
    if (typeof openOrState === 'string') {
      this.lidOpen = openOrState.toUpperCase() === 'OPEN';
    } else {
      this.lidOpen = Boolean(openOrState);
    }

    // If lid state transitioned, trigger an immediate MQTT publish
    if (wasOpen !== this.lidOpen && this.isRunning) {
      this.publishNow();
    }
  }

  /**
   * Checks if sensor alert status has changed and triggers publish if true.
   * @returns {Object|null} Published payload if status changed, else null
   */
  checkStatusChange() {
    const state = this._getSensorState();
    if (state.status !== this.lastStatus) {
      return this.publishNow();
    }
    return null;
  }

  /**
   * Builds the formatted JSON telemetry payload and dispatches it.
   * @param {Object} [customData={}] - Optional custom telemetry overrides
   * @returns {Object} Dispatched JSON payload
   */
  publishNow(customData = {}) {
    const state = this._getSensorState();

    const lidState = customData.lid_state !== undefined
      ? customData.lid_state
      : (this.lidOpen ? "OPEN" : "CLOSED");

    const payload = {
      dev_id: this.devId,
      timestamp: state.updatedAt || new Date().toISOString().substring(11, 19),
      fill_level: state.fillLevel ?? state.fillPct ?? 0,
      fill_pct: state.fillPct ?? state.fillLevel ?? 0,
      distance_cm: state.distanceCm ?? 220,
      waste_count: state.count ?? 0,
      weight_kg: state.weightKg ?? "0.00",
      odor_detected: state.odorDetected ?? false,
      lid_state: lidState,
      battery_pct: state.batteryLevel ?? this.batteryPct,
      rssi_dbm: this.rssiDbm,
      status: state.status ?? 'NORMAL',
      fault_reasons: state.faultReasons ?? [],
      is_fault_latched: Boolean(state.isFaultLatched),
      ...customData
    };

    this.lastStatus = payload.status;

    if (typeof this.onMessageCallback === 'function') {
      try {
        this.onMessageCallback(payload);
      } catch (err) {
        console.error('[MqttSimulator] Error in onMessageCallback:', err);
      }
    }

    return payload;
  }

  /**
   * Starts periodic simulated MQTT telemetry broadcasting.
   */
  start() {
    if (this.isRunning) return;
    this.isRunning = true;

    // Publish initial reading on connect
    this.publishNow();

    this.timerId = setInterval(() => {
      this.publishNow();
    }, this.intervalMs);
  }

  /**
   * Stops periodic broadcasting.
   */
  stop() {
    this.isRunning = false;
    if (this.timerId) {
      clearInterval(this.timerId);
      this.timerId = null;
    }
  }
}

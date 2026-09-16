export const APP_CONFIG = {
  BIN: {
    RADIUS: 0.32,
    HEIGHT: 2.2,
    BOTTOM_Y: 0.16,
    TOP_Y: 2.2,
    LID_MAX_ANGLE: Math.PI * 0.45,
    CAPACITY_ITEMS: 25
  },
  BOTTLE: {
    HEIGHT: 0.36,
    RADIUS: 0.075,
    WEIGHT_KG: 0.035
  },
  GARBAGE_BAG: {
    HEIGHT: 0.32,
    RADIUS: 0.15,
    WEIGHT_KG: 0.25
  },
  IOT: {
    WARNING_THRESHOLD_PCT: 50,
    CRITICAL_THRESHOLD_PCT: 80,
    POLL_INTERVAL_MS: 1500,
    LID_AUTO_CLOSE_DELAY_MS: 1400,
    BATTERY_LOW_THRESHOLD_PCT: 15,
    HEARTBEAT_TIMEOUT_MS: 6000,
    ANOMALY_DELTA_THRESHOLD_PCT: 40,
    INITIAL_BATTERY_PCT: 98
  },
  PATHS: {
    TRASH_CAN_GLB: '/models/sci_fi_trash_can.glb',
    BOTTLE_GLB: '/models/plastic_water_bottle.glb',
    GARBAGE_BAG_GLB: '/models/garbage_bag.glb'
  }
};

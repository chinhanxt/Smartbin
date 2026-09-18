/**
 * test_sensor_fault.js
 * Comprehensive unit and integration test suite for SensorManager fault rules,
 * latching safety invariant, and verifyFault() lifecycle.
 */

import { SensorManager } from './src/iot/SensorManager.js';
import { APP_CONFIG } from './src/config.js';

let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (!condition) {
    console.error(`❌ FAIL: ${message}`);
    failed++;
    throw new Error(message);
  } else {
    console.log(`✅ PASS: ${message}`);
    passed++;
  }
}

console.log('====================================================');
console.log('  TESTING FAULT DETECTION & LATCHING INVARIANT');
console.log('====================================================\n');

// ---------------------------------------------------------
// Test Suite 1: Low Battery Detection (<= 15%)
// ---------------------------------------------------------
console.log('--- Test Suite 1: Low Battery (<= 15%) ---');
{
  const manager = new SensorManager(null, APP_CONFIG);
  assert(manager.isFaultActive === false, 'Initial state: fault is not active');
  assert(manager.getState().status === 'NORMAL', 'Initial status is NORMAL');

  // Boundary check: 16% should NOT trigger fault
  manager.setBatteryLevel(16);
  assert(manager.isFaultActive === false, 'Battery at 16% (> 15%) does not trigger fault');
  assert(manager.getState().status === 'NORMAL', 'Status remains NORMAL at 16% battery');

  // Trigger: 15% should trigger low battery fault
  manager.setBatteryLevel(15);
  assert(manager.isFaultActive === true, 'Battery at 15% (<= 15%) triggers fault');
  assert(manager.isFaultLatched === true, 'isFaultLatched is set to true');
  assert(manager.getState().status === 'SENSOR_FAULT', 'Status becomes SENSOR_FAULT');
  assert(manager.getFaultReasons().includes('PIN_YẾU'), 'faultReasons includes PIN_YẾU');

  // Verify that recharging battery does NOT clear latched fault
  manager.setBatteryLevel(90);
  assert(manager.getState().batteryLevel === 90, 'Battery successfully charged to 90%');
  assert(manager.isFaultActive === true, 'CRITICAL INVARIANT: Recharged battery does NOT clear fault');
  assert(manager.isFaultLatched === true, 'CRITICAL INVARIANT: isFaultLatched remains true');
  assert(manager.getState().status === 'SENSOR_FAULT', 'CRITICAL INVARIANT: status remains SENSOR_FAULT');
  assert(manager.getFaultReasons().includes('PIN_YẾU'), 'faultReasons still preserves PIN_YẾU');

  // Verify that reset() does NOT clear latched fault
  manager.reset();
  assert(manager.isFaultActive === true, 'CRITICAL INVARIANT: reset() does NOT clear fault');
  assert(manager.getState().status === 'SENSOR_FAULT', 'CRITICAL INVARIANT: status remains SENSOR_FAULT after reset');
  assert(manager.getFaultReasons().includes('PIN_YẾU'), 'faultReasons preserved after reset');

  // Authorized clear via verifyFault()
  const cleared = manager.verifyFault();
  assert(cleared === true, 'verifyFault() returns true');
  assert(manager.isFaultActive === false, 'verifyFault() successfully clears fault');
  assert(manager.isFaultLatched === false, 'isFaultLatched is false after verifyFault');
  assert(manager.getFaultReasons().length === 0, 'faultReasons is empty after verifyFault');
  assert(manager.getState().status === 'NORMAL', 'Status returns to NORMAL after verifyFault');
  assert(typeof manager.lastVerifiedAt === 'number', 'lastVerifiedAt timestamp recorded');
}

// ---------------------------------------------------------
// Test Suite 2: Data Anomaly Jump & Out-of-Bounds
// ---------------------------------------------------------
console.log('\n--- Test Suite 2: Data Anomaly Jump & Out-of-Bounds ---');
{
  // Part A: Anomaly jump >= 40% without corresponding items
  const manager = new SensorManager(null, APP_CONFIG);
  manager.injectTelemetry({ fillLevel: 10, count: 2 });
  assert(manager.getState().fillLevel === 10, 'Baseline fillLevel set to 10%');
  assert(manager.isFaultActive === false, 'Baseline is not faulted');

  // Jump from 10% to 55% (delta = 45% >= 40%) with count unchanged
  manager.injectTelemetry({ fillLevel: 55, count: 2 });
  assert(manager.isFaultActive === true, 'Delta 45% jump without item drop triggers fault');
  assert(manager.getState().status === 'SENSOR_FAULT', 'Status becomes SENSOR_FAULT on jump');
  assert(manager.getFaultReasons().includes('DỮ_LIỆU_NHẢY_BẤT_THƯỜNG'), 'faultReasons includes DỮ_LIỆU_NHẢY_BẤT_THƯỜNG');

  // Subsequent normal data does not clear fault
  manager.injectTelemetry({ fillLevel: 20 });
  assert(manager.isFaultActive === true, 'Subsequent normal data does not clear fault');
  assert(manager.getState().status === 'SENSOR_FAULT', 'Status remains SENSOR_FAULT');

  manager.verifyFault();
  assert(manager.isFaultActive === false, 'verifyFault() clears anomaly jump fault');
  assert(manager.getState().status === 'NORMAL', 'Status restored to NORMAL');

  // Part B: Out-of-bounds (< 0)
  manager.injectTelemetry({ fillLevel: -10 });
  assert(manager.isFaultActive === true, 'Negative fillLevel (-10) triggers fault');
  assert(manager.getState().status === 'SENSOR_FAULT', 'Negative fillLevel status is SENSOR_FAULT');
  assert(manager.getFaultReasons().includes('DỮ_LIỆU_NHẢY_BẤT_THƯỜNG'), 'faultReasons includes DỮ_LIỆU_NHẢY_BẤT_THƯỜNG for negative');
  manager.verifyFault();

  // Part C: Out-of-bounds (> 105)
  manager.injectTelemetry({ fillLevel: 120 });
  assert(manager.isFaultActive === true, 'Over-limit fillLevel (120) triggers fault');
  assert(manager.getState().status === 'SENSOR_FAULT', 'Over-limit fillLevel status is SENSOR_FAULT');
  assert(manager.getFaultReasons().includes('DỮ_LIỆU_NHẢY_BẤT_THƯỜNG'), 'faultReasons includes DỮ_LIỆU_NHẢY_BẤT_THƯỜNG for > 105');
  manager.verifyFault();

  // Part D: Out-of-bounds (NaN)
  manager.injectTelemetry({ fillLevel: NaN });
  assert(manager.isFaultActive === true, 'NaN fillLevel triggers fault');
  assert(manager.getState().status === 'SENSOR_FAULT', 'NaN fillLevel status is SENSOR_FAULT');
  assert(manager.getFaultReasons().includes('DỮ_LIỆU_NHẢY_BẤT_THƯỜNG'), 'faultReasons includes DỮ_LIỆU_NHẢY_BẤT_THƯỜNG for NaN');
  manager.verifyFault();
}

// ---------------------------------------------------------
// Test Suite 3: Signal Loss & Heartbeat Timeout (> 6000ms)
// ---------------------------------------------------------
console.log('\n--- Test Suite 3: Signal Loss & Heartbeat Timeout ---');
{
  const manager = new SensorManager(null, APP_CONFIG);
  assert(manager.isFaultActive === false, 'Initial state: no signal fault');

  // Simulate timeout: set lastUpdateTime to 7000ms ago (> 6000ms)
  manager.lastUpdateTime = Date.now() - 7000;
  const state = manager.getState();
  assert(manager.isFaultActive === true, 'Heartbeat timeout (>6000ms) triggers fault');
  assert(state.status === 'SENSOR_FAULT', 'Status becomes SENSOR_FAULT on heartbeat timeout');
  assert(manager.getFaultReasons().includes('MẤT_TÍN_HIỆU'), 'faultReasons includes MẤT_TÍN_HIỆU');

  // Verify that an update attempt does NOT clear the latched timeout fault
  manager.update(0.016);
  assert(manager.isFaultActive === true, 'Update attempt does not clear timeout fault');
  assert(manager.getState().status === 'SENSOR_FAULT', 'Status remains SENSOR_FAULT');

  // Explicit verifyFault() clears it
  manager.verifyFault();
  assert(manager.isFaultActive === false, 'verifyFault() clears heartbeat timeout fault');

  // Test explicit signalLoss flag
  manager.injectTelemetry({ signalLoss: true });
  assert(manager.isFaultActive === true, 'injectTelemetry with signalLoss: true triggers fault');
  assert(manager.getFaultReasons().includes('MẤT_TÍN_HIỆU'), 'faultReasons has MẤT_TÍN_HIỆU');

  // Injected normal data without verifyFault does NOT clear
  manager.injectTelemetry({ signalLoss: false });
  assert(manager.isFaultActive === true, 'Restoring signal does NOT clear latched fault');
  assert(manager.getState().status === 'SENSOR_FAULT', 'Status remains SENSOR_FAULT');

  manager.verifyFault();
  assert(manager.isFaultActive === false, 'verifyFault clears signalLoss fault');
}

// ---------------------------------------------------------
// Test Suite 4: simulateFault() Helper Method
// ---------------------------------------------------------
console.log('\n--- Test Suite 4: simulateFault() Helper ---');
{
  const manager = new SensorManager(null, APP_CONFIG);

  // 1. SIGNAL_LOSS
  manager.simulateFault('SIGNAL_LOSS');
  assert(manager.isFaultActive === true, 'simulateFault("SIGNAL_LOSS") activates fault');
  assert(manager.getState().status === 'SENSOR_FAULT', 'Status is SENSOR_FAULT');
  assert(manager.getFaultReasons().includes('MẤT_TÍN_HIỆU'), 'Reasons include MẤT_TÍN_HIỆU');
  manager.verifyFault();
  assert(manager.isFaultActive === false, 'verifyFault() clears SIGNAL_LOSS');

  // 2. LOW_BATTERY
  manager.simulateFault('LOW_BATTERY');
  assert(manager.isFaultActive === true, 'simulateFault("LOW_BATTERY") activates fault');
  assert(manager.getState().status === 'SENSOR_FAULT', 'Status is SENSOR_FAULT');
  assert(manager.getFaultReasons().includes('PIN_YẾU'), 'Reasons include PIN_YẾU');
  assert(manager.batteryLevel <= 15, 'Battery level dropped to <= 15%');
  manager.verifyFault();
  assert(manager.isFaultActive === false, 'verifyFault() clears LOW_BATTERY');

  // 3. ANOMALY_JUMP
  manager.simulateFault('ANOMALY_JUMP');
  assert(manager.isFaultActive === true, 'simulateFault("ANOMALY_JUMP") activates fault');
  assert(manager.getState().status === 'SENSOR_FAULT', 'Status is SENSOR_FAULT');
  assert(manager.getFaultReasons().includes('DỮ_LIỆU_NHẢY_BẤT_THƯỜNG'), 'Reasons include DỮ_LIỆU_NHẢY_BẤT_THƯỜNG');
  manager.verifyFault();
  assert(manager.isFaultActive === false, 'verifyFault() clears ANOMALY_JUMP');
}

// ---------------------------------------------------------
// Test Suite 5: Multiple Simultaneous Faults
// ---------------------------------------------------------
console.log('\n--- Test Suite 5: Multiple Simultaneous Faults ---');
{
  const manager = new SensorManager(null, APP_CONFIG);

  // Trigger low battery
  manager.setBatteryLevel(10);
  // Trigger signal loss
  manager.setSignalLoss(true);
  // Trigger anomaly jump
  manager.simulateFault('ANOMALY_JUMP');

  const reasons = manager.getFaultReasons();
  assert(reasons.includes('PIN_YẾU'), 'Has PIN_YẾU');
  assert(reasons.includes('MẤT_TÍN_HIỆU'), 'Has MẤT_TÍN_HIỆU');
  assert(reasons.includes('DỮ_LIỆU_NHẢY_BẤT_THƯỜNG'), 'Has DỮ_LIỆU_NHẢY_BẤT_THƯỜNG');
  assert(reasons.length >= 3, 'Recorded all 3 active faults');

  // Reset preserves all reasons and SENSOR_FAULT
  manager.reset();
  assert(manager.getState().status === 'SENSOR_FAULT', 'Status is SENSOR_FAULT after reset');
  assert(manager.getFaultReasons().length >= 3, 'All reasons preserved across reset');

  // Verify clears everything
  manager.verifyFault();
  assert(manager.isFaultActive === false, 'All faults cleared by verifyFault');
  assert(manager.getFaultReasons().length === 0, 'faultReasons array is empty');
  assert(manager.getState().status === 'NORMAL', 'Status is NORMAL');
}

console.log('\n====================================================');
console.log(`  ALL TESTS COMPLETED: ${passed} PASSED, ${failed} FAILED`);
console.log('====================================================\n');

if (failed > 0) {
  process.exit(1);
} else {
  process.exit(0);
}

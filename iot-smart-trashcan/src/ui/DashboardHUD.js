/**
 * DashboardHUD - Clean Minimalist Light HUD Controller for IoT Smart Trash Can
 */

const CIRCUMFERENCE = 364.42; // 2 * Math.PI * 58

const COLORS = {
  NORMAL: '#10b981',       // Green
  CAUTION: '#f59e0b',      // Amber
  CRITICAL_FULL: '#ef4444', // Red
  SENSOR_FAULT: '#a855f7'  // Purple
};

export class DashboardHUD {
  /**
   * @param {Function|Object} [onVerifyFaultOrCallback] - Optional verification callback or options object
   */
  constructor(onVerifyFaultOrCallback = null) {
    const onVerify = typeof onVerifyFaultOrCallback === 'function'
      ? onVerifyFaultOrCallback
      : (onVerifyFaultOrCallback?.onVerifyFault || null);
    this.onVerifyFault = onVerify;

    // Cache existing DOM elements
    this.fillPctText = document.getElementById('fill-pct-text');
    this.gaugeCircle = document.getElementById('gauge-circle');
    this.distCmText = document.getElementById('dist-cm-text');
    this.bottleCountText = document.getElementById('bottle-count-text');
    this.weightKgText = document.getElementById('weight-kg-text');
    this.lidStateText = document.getElementById('lid-state-text');
    this.statusBadge = document.getElementById('status-badge');
    this.criticalAlertBanner = document.getElementById('critical-alert-banner');

    // Cache new DOM elements
    this.odorStatusText = document.getElementById('odor-status-text');
    this.batteryChip = document.getElementById('battery-chip');
    this.batteryPctText = document.getElementById('battery-pct-text');
    this.updatedTimeText = document.getElementById('updated-time-text');
    this.btnVerifyFault = document.getElementById('btn-verify-fault');
    this.criticalAlertMsg = document.getElementById('critical-alert-msg');
    this.signalChip = document.getElementById('signal-chip');
    this.signalIconWrapper = document.getElementById('signal-icon-wrapper');
    this.signalText = document.getElementById('signal-text');

    if (this.gaugeCircle) {
      this.gaugeCircle.style.strokeDasharray = `${CIRCUMFERENCE}`;
      this.gaugeCircle.style.strokeDashoffset = `${CIRCUMFERENCE}`;
    }

    if (this.btnVerifyFault) {
      this.btnVerifyFault.addEventListener('click', (e) => {
        e.preventDefault();
        if (typeof this.onVerifyFault === 'function') {
          this.onVerifyFault();
        }
      });
    }
  }

  /**
   * Set or update verify fault callback
   * @param {Function} callback
   */
  setOnVerifyFault(callback) {
    this.onVerifyFault = callback;
  }

  /**
   * Updates HUD telemetry displays
   * @param {Object} telemetryState
   * @param {boolean} isLidOpen
   */
  update(telemetryState = {}, isLidOpen = false) {
    // 1. Fill level (fillPct)
    const rawFill = telemetryState.fillLevel ?? telemetryState.fillPct ?? telemetryState.fillPercentage ?? 0;
    const fillPct = Math.min(100, Math.max(0, Number(rawFill)));
    const distanceCm = Number(telemetryState.distanceCm ?? telemetryState.distance ?? telemetryState.distance_cm ?? 0);
    const bottleCount = Number(telemetryState.bottleCount ?? telemetryState.bottles ?? telemetryState.count ?? telemetryState.waste_count ?? 0);
    const weightKg = Number(telemetryState.weightKg ?? telemetryState.weight ?? telemetryState.weight_kg ?? 0);

    // 2. Odor detection
    const odorDetected = Boolean(
      telemetryState.odorDetected ??
      telemetryState.odor ??
      telemetryState.odor_detected ??
      false
    );

    // 3. Battery level
    const rawBattery = telemetryState.batteryLevel ?? telemetryState.batteryPct ?? telemetryState.battery_pct ?? telemetryState.battery ?? 98;
    const batteryLevel = Number(rawBattery);

    // 4. Updated time
    const rawTime = telemetryState.updatedAt ?? telemetryState.timestamp ?? telemetryState.updated_at;
    let timeText = '--:--:--';
    if (rawTime) {
      if (typeof rawTime === 'string') {
        if (rawTime.includes('T')) {
          try {
            timeText = new Date(rawTime).toLocaleTimeString('vi-VN');
          } catch {
            timeText = rawTime;
          }
        } else {
          timeText = rawTime;
        }
      } else if (typeof rawTime === 'number') {
        timeText = new Date(rawTime).toLocaleTimeString('vi-VN');
      } else if (rawTime instanceof Date) {
        timeText = rawTime.toLocaleTimeString('vi-VN');
      }
    } else {
      timeText = new Date().toLocaleTimeString('vi-VN');
    }

    // 5. Status mapping
    let status = (telemetryState.status || 'NORMAL').toUpperCase();
    if (status === 'SENSOR_FAULT' || status === 'FAULT' || status === 'ERROR') {
      status = 'SENSOR_FAULT';
    } else if (status === 'CRITICAL' || status === 'FULL' || status === 'CRITICAL_FULL') {
      status = 'CRITICAL_FULL';
    } else if (status === 'CAUTION' || status === 'WARNING') {
      status = 'CAUTION';
    } else {
      status = 'NORMAL';
    }

    const statusColor = COLORS[status] || COLORS.NORMAL;

    // 1. Update Gauge & Numeric Text
    if (this.gaugeCircle) {
      const offset = CIRCUMFERENCE * (1 - fillPct / 100);
      this.gaugeCircle.style.strokeDashoffset = offset.toFixed(2);
      this.gaugeCircle.style.stroke = statusColor;
    }

    if (this.fillPctText) {
      this.fillPctText.textContent = `${Math.round(fillPct)}%`;
      this.fillPctText.style.color = statusColor;
    }

    if (this.distCmText) {
      this.distCmText.textContent = Number.isInteger(distanceCm) ? distanceCm : distanceCm.toFixed(0);
    }

    if (this.bottleCountText) {
      this.bottleCountText.textContent = bottleCount;
    }

    if (this.weightKgText) {
      this.weightKgText.textContent = weightKg.toFixed(2);
    }

    // 2. Update Odor Chip
    if (this.odorStatusText) {
      if (odorDetected) {
        this.odorStatusText.textContent = 'CÓ MÙI HÔI';
        this.odorStatusText.className = 'odor-detected';
      } else {
        this.odorStatusText.textContent = 'KHÔNG MÙI';
        this.odorStatusText.className = 'odor-clean';
      }
    }

    // 2b. Update LoRaWAN Signal Chip
    if (this.signalText && this.signalIconWrapper) {
      const isSignalLost = Boolean(telemetryState.signalLoss) ||
        (Array.isArray(telemetryState.faultReasons) && telemetryState.faultReasons.includes('MẤT_TÍN_HIỆU'));

      if (isSignalLost) {
        if (this.signalChip) this.signalChip.classList.add('signal-lost');
        this.signalText.textContent = 'MẤT TÍN HIỆU';
        this.signalIconWrapper.innerHTML = `<svg class="icon-svg icon-signal-off" viewBox="0 0 24 24"><line x1="1" y1="1" x2="23" y2="23"></line><path d="M16.72 11.06A10.94 10.94 0 0 1 19 12.55"></path><path d="M5 12.55a10.94 10.94 0 0 1 5.17-2.39"></path><path d="M10.71 5.05A16 16 0 0 1 22.58 9"></path><path d="M1.42 9a15.91 15.91 0 0 1 4.7-2.88"></path><path d="M8.53 16.11a6 6 0 0 1 6.95 0"></path><circle cx="12" cy="20" r="1"></circle></svg>`;
      } else {
        if (this.signalChip) this.signalChip.classList.remove('signal-lost');
        this.signalText.textContent = '-72 dBm';
        this.signalIconWrapper.innerHTML = `<svg class="icon-svg" viewBox="0 0 24 24"><path d="M5 12.55a11 11 0 0 1 14.08 0"></path><path d="M1.42 9a16 16 0 0 1 21.16 0"></path><path d="M8.53 16.11a6 6 0 0 1 6.95 0"></path><circle cx="12" cy="20" r="1"></circle></svg>`;
      }
    }

    // 3. Update Battery Chip
    if (this.batteryPctText) {
      this.batteryPctText.textContent = `${Math.round(batteryLevel)}%`;
    }
    if (this.batteryChip) {
      if (batteryLevel <= 15) {
        this.batteryChip.classList.add('battery-low');
      } else {
        this.batteryChip.classList.remove('battery-low');
      }
    }

    // 4. Update Time Chip
    if (this.updatedTimeText) {
      this.updatedTimeText.textContent = timeText;
    }

    // 5. Update Status Badge
    if (this.statusBadge) {
      this.statusBadge.className = 'badge';
      if (status === 'SENSOR_FAULT') {
        this.statusBadge.classList.add('badge-fault');
        this.statusBadge.textContent = 'CẦN XÁC MINH';
      } else if (status === 'CRITICAL_FULL') {
        this.statusBadge.classList.add('badge-full');
        this.statusBadge.textContent = 'ĐẦY RÁC';
      } else if (status === 'CAUTION') {
        this.statusBadge.classList.add('badge-caution');
        this.statusBadge.textContent = 'SẮP ĐẦY';
      } else {
        this.statusBadge.classList.add('badge-normal');
        this.statusBadge.textContent = 'BÌNH THƯỜNG';
      }
    }

    // 6. Update Lid State
    if (this.lidStateText) {
      if (isLidOpen) {
        this.lidStateText.textContent = 'MỞ';
        this.lidStateText.style.color = '#f59e0b';
      } else {
        this.lidStateText.textContent = 'ĐÓNG';
        this.lidStateText.style.color = '#10b981';
      }
    }

    // 7. Update Alert Banner & Action Button
    if (this.criticalAlertBanner) {
      if (status === 'SENSOR_FAULT') {
        this.criticalAlertBanner.classList.remove('hidden');
        this.criticalAlertBanner.classList.add('alert-fault');
        if (this.criticalAlertMsg) {
          const faultReasons = telemetryState.faultReasons
            ? (Array.isArray(telemetryState.faultReasons) ? telemetryState.faultReasons.join(', ') : telemetryState.faultReasons)
            : (telemetryState.faultReason || telemetryState.reason || telemetryState.message || 'Cảm biến bất thường');
          this.criticalAlertMsg.textContent = `Sự cố: ${faultReasons}`;
        }
        if (this.btnVerifyFault) {
          this.btnVerifyFault.classList.remove('hidden');
        }
      } else if (status === 'CRITICAL_FULL') {
        this.criticalAlertBanner.classList.remove('hidden');
        this.criticalAlertBanner.classList.remove('alert-fault');
        if (this.criticalAlertMsg) {
          this.criticalAlertMsg.textContent = telemetryState.message || 'Cảnh báo: Thùng rác đã đầy!';
        }
        if (this.btnVerifyFault) {
          this.btnVerifyFault.classList.add('hidden');
        }
      } else {
        this.criticalAlertBanner.classList.add('hidden');
        this.criticalAlertBanner.classList.remove('alert-fault');
        if (this.btnVerifyFault) {
          this.btnVerifyFault.classList.add('hidden');
        }
      }
    }
  }

  appendMqttLog() {
    // Minimal mode: keep quiet to avoid clutter
  }

  clearLogs() {}
}

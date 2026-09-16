import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  TextField,
  IconButton,
  Chip,
  Alert,
  Snackbar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Paper,
  Tooltip,
  Badge,
  Switch,
  FormControlLabel,
} from '@mui/material';
import SosIcon from '@mui/icons-material/Warning';
import StatusIcon from '@mui/icons-material/History';
import SettingsIcon from '@mui/icons-material/Settings';
import MyLocationIcon from '@mui/icons-material/MyLocation';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import BatteryIcon from '@mui/icons-material/BatteryChargingFull';
import SensorsIcon from '@mui/icons-material/Sensors';
import RecyclingIcon from '@mui/icons-material/Recycling';
import CopyIcon from '@mui/icons-material/ContentCopy';
import CloseIcon from '@mui/icons-material/Close';
import QrCode2Icon from '@mui/icons-material/QrCode2';
import LaptopIcon from '@mui/icons-material/Laptop';
import PhoneIphoneIcon from '@mui/icons-material/PhoneIphone';
import { QRCode } from 'react-qr-code';

const MobileTrackerPage = () => {
  // Device detection: Mobile phone has true satellite GPS; Desktop has network GeoIP
  const isMobile = /Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent);

  // State
  const [deviceId, setDeviceId] = useState(() => {
    const saved = localStorage.getItem('smartbin_device_id');
    if (saved && saved !== '81891318' && saved !== '81891319' && saved !== 'BIN-001') {
      return saved;
    }
    return '171.236.48.232';
  });
  const [serverUrl, setServerUrl] = useState(() => localStorage.getItem('smartbin_server_url') || '/gps');
  const [intervalSec, setIntervalSec] = useState(() => Number(localStorage.getItem('smartbin_interval')) || 5);
  
  // Continuous tracking: active by default to auto-connect on location permission
  const [isTracking, setIsTracking] = useState(true);
  
  // Real-time telemetry data
  const [currentPosition, setCurrentPosition] = useState(null);
  const [lastSentTime, setLastSentTime] = useState(null);
  const [sentCount, setSentCount] = useState(0);
  
  // Battery state (Universal: real Web Battery API on Android, quick-adjust modal for iOS Safari)
  const [batteryLevel, setBatteryLevel] = useState(() => {
    // Clear stale '60' legacy value from earlier tests
    const legacy = localStorage.getItem('smartbin_battery_sim');
    if (legacy === '60') {
      localStorage.removeItem('smartbin_battery_sim');
    }
    const saved = localStorage.getItem('smartbin_battery_level');
    return saved ? Number(saved) : 85;
  });
  const [isCharging, setIsCharging] = useState(() => localStorage.getItem('smartbin_is_charging') === 'true');
  const [hasRealBattery, setHasRealBattery] = useState(false);
  const [showBatteryModal, setShowBatteryModal] = useState(false);
  const [tempBatteryInput, setTempBatteryInput] = useState(() => {
    const saved = localStorage.getItem('smartbin_battery_level');
    return saved ? Number(saved) : 85;
  });
  const [tempChargingInput, setTempChargingInput] = useState(false);
  
  // Logs
  const [logs, setLogs] = useState([]);
  
  // Modals
  const [showSettings, setShowSettings] = useState(false);
  const [showLogsModal, setShowLogsModal] = useState(false);
  const [showQrModal, setShowQrModal] = useState(false);
  const [showSosSuccessModal, setShowSosSuccessModal] = useState(false);
  
  // UI feedback & network status
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState('success');
  const [gpsError, setGpsError] = useState(null);
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [copiedWeb, setCopiedWeb] = useState(false);

  // References
  const watchIdRef = useRef(null);
  const intervalTimerRef = useRef(null);
  const latestPosRef = useRef(null);
  const wakeLockRef = useRef(null);
  const transmitPositionRef = useRef(null);
  const deviceIdRef = useRef(deviceId);
  deviceIdRef.current = deviceId;
  const batteryLevelRef = useRef(batteryLevel);
  batteryLevelRef.current = batteryLevel;
  const isChargingRef = useRef(isCharging);
  isChargingRef.current = isCharging;
  const serverUrlRef = useRef(serverUrl);
  serverUrlRef.current = serverUrl;

  // Sync background color with body
  useEffect(() => {
    const originalBodyBg = document.body.style.backgroundColor;
    document.body.style.backgroundColor = '#f8fafc';
    return () => {
      document.body.style.backgroundColor = originalBodyBg;
    };
  }, []);

  const showToast = (msg, severity = 'info') => {
    setSnackbarMessage(msg);
    setSnackbarSeverity(severity);
  };

  const handleCopy = (text, type) => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text);
      if (type === 'gps') {
        setCopiedUrl(true);
        setTimeout(() => setCopiedUrl(false), 2000);
      } else {
        setCopiedWeb(true);
        setTimeout(() => setCopiedWeb(false), 2000);
      }
      showToast('Đã sao chép liên kết vào bộ nhớ tạm!', 'success');
    }
  };

  // Add entry to transmission logs
  const addLog = useCallback((text, success = true) => {
    const timeStr = new Date().toLocaleTimeString('vi-VN', { hour12: false });
    setLogs((prev) => [{ time: timeStr, text, success, id: Date.now() + Math.random() }, ...prev.slice(0, 49)]);
  }, []);

  // 1. Auto Device ID from Device IP
  useEffect(() => {
    let isCancelled = false;

    const fetchClientIp = async () => {
      let clientIp = null;
      try {
        const res = await fetch('/client-ip');
        if (res.ok) {
          const data = await res.json();
          if (data && data.ip && data.ip !== '127.0.0.1' && data.ip !== '::1') {
            clientIp = data.ip;
          }
        }
      } catch {
        // Fallback to external provider
      }

      if (!clientIp) {
        try {
          const res = await fetch('https://api.ipify.org?format=json');
          if (res.ok) {
            const data = await res.json();
            if (data && data.ip) {
              clientIp = data.ip;
            }
          }
        } catch {
          // Ignored
        }
      }

      if (!isCancelled && clientIp) {
        const isCustom = localStorage.getItem('smartbin_is_custom_id') === 'true';
        const saved = localStorage.getItem('smartbin_device_id');
        if (!isCustom || !saved || saved === '81891318' || saved === '81891319' || saved === 'BIN-001') {
          setDeviceId(clientIp);
          localStorage.setItem('smartbin_device_id', clientIp);
          if (latestPosRef.current && transmitPositionRef.current) {
            transmitPositionRef.current(latestPosRef.current);
          }
        }
      }
    };

    fetchClientIp();

    return () => {
      isCancelled = true;
    };
  }, []);

  // 2. Real-time automatic battery detection (Web Battery API for Android Chrome)
  useEffect(() => {
    let batteryObj = null;
    let isCancelled = false;

    const handleBatteryUpdate = () => {
      if (batteryObj && !isCancelled) {
        const lvl = Math.round(batteryObj.level * 100);
        const chg = Boolean(batteryObj.charging);
        setBatteryLevel(lvl);
        setIsCharging(chg);
        setTempBatteryInput(lvl);
        setTempChargingInput(chg);
      }
    };

    if (typeof navigator !== 'undefined' && typeof navigator.getBattery === 'function') {
      navigator.getBattery().then((battery) => {
        if (isCancelled) return;
        batteryObj = battery;
        setHasRealBattery(true);
        handleBatteryUpdate();
        battery.addEventListener('levelchange', handleBatteryUpdate);
        battery.addEventListener('chargingchange', handleBatteryUpdate);
      }).catch(() => {
        if (!isCancelled) setHasRealBattery(false);
      });
    }

    return () => {
      isCancelled = true;
      if (batteryObj) {
        batteryObj.removeEventListener('levelchange', handleBatteryUpdate);
        batteryObj.removeEventListener('chargingchange', handleBatteryUpdate);
      }
    };
  }, []);

  // Automatic realistic battery estimate for iOS Safari / WebKit (decay 1% gradually)
  useEffect(() => {
    if (hasRealBattery) return;

    const timer = setInterval(() => {
      setBatteryLevel((prev) => {
        const next = Math.max(15, (prev || 85) - 1);
        localStorage.setItem('smartbin_battery_level', next.toString());
        return next;
      });
    }, 180000);

    return () => clearInterval(timer);
  }, [hasRealBattery]);

  // Screen WakeLock for continuous operation
  const requestWakeLock = async () => {
    try {
      if ('wakeLock' in navigator) {
        wakeLockRef.current = await navigator.wakeLock.request('screen');
      }
    } catch {
      // Ignore
    }
  };

  const releaseWakeLock = () => {
    try {
      if (wakeLockRef.current) {
        wakeLockRef.current.release();
        wakeLockRef.current = null;
      }
    } catch {
      // Ignore
    }
  };

  // Transmit telemetry to server
  const transmitPosition = useCallback(async (pos, isSos = false) => {
    if (!pos || !pos.coords) return;
    const { latitude, longitude, accuracy, speed, heading, altitude } = pos.coords;
    const speedKnots = speed != null ? (speed * 1.94384).toFixed(2) : 0;
    const speedKmh = speed != null ? (speed * 3.6).toFixed(1) : '0.0';
    
    // Always use fresh monotonic timestamp in seconds so Traccar server never drops packets
    const timestamp = Math.round(Date.now() / 1000);
    const activeDeviceId = (deviceIdRef.current || '171.236.48.232').trim();
    const currentBatt = batteryLevelRef.current != null ? batteryLevelRef.current : 85;
    const currentCharging = isChargingRef.current;

    const queryParams = new URLSearchParams({
      id: activeDeviceId,
      lat: latitude.toFixed(6),
      lon: longitude.toFixed(6),
      timestamp: timestamp.toString(),
      speed: speedKnots.toString(),
      bearing: (heading || 0).toFixed(1),
      altitude: (altitude || 0).toFixed(1),
      accuracy: (accuracy || 0).toFixed(1),
      batt: currentBatt.toString(),
      charge: currentCharging ? 'true' : 'false',
    });

    if (isSos) {
      queryParams.append('alarm', 'sos');
    }

    const endpoint = serverUrlRef.current.trim() || '/gps';
    const fullUrl = `${endpoint}?${queryParams.toString()}`;

    try {
      const response = await fetch(fullUrl, { method: 'GET' });
      if (response.ok) {
        setSentCount((c) => c + 1);
        setLastSentTime(new Date());
        const accuracyText = accuracy > 1000 ? `±${(accuracy / 1000).toFixed(1)}km (IP mạng)` : `±${Math.round(accuracy)}m`;
        const info = `${isSos ? '🚨 [SOS KHẨN CẤP] ' : ''}Gửi (${latitude.toFixed(5)}, ${longitude.toFixed(5)}) • ${accuracyText} • ${speedKmh} km/h • Pin: ${currentBatt}%`;
        addLog(info, true);
        if (isSos) {
          setShowSosSuccessModal(true);
          if ('vibrate' in navigator) navigator.vibrate([400, 150, 400, 150, 600]);
        }
      } else {
        addLog(`Lỗi gửi máy chủ: HTTP ${response.status}`, false);
      }
    } catch (err) {
      addLog(`Mất kết nối mạng: ${err.message}`, false);
    }
  }, [addLog]);

  transmitPositionRef.current = transmitPosition;

  // Position updates
  const handlePositionSuccess = useCallback((pos) => {
    setGpsError(null);
    const isFirstPosition = latestPosRef.current === null;
    setCurrentPosition(pos);
    latestPosRef.current = pos;
    // As soon as GPS position is received, immediately transmit and connect!
    if (isFirstPosition) {
      transmitPositionRef.current?.(pos);
    }
  }, []);

  const handlePositionError = useCallback((err) => {
    let msg = 'Không lấy được định vị GPS';
    if (err.code === 1) msg = 'Vui lòng cấp quyền Vị trí (Location Permission) trong trình duyệt';
    else if (err.code === 2) msg = 'Mất tín hiệu GPS vệ tinh ngoài trời';
    else if (err.code === 3) msg = 'Hết thời gian chờ phản hồi GPS vệ tinh';
    setGpsError(msg);
    addLog(`Lỗi GPS: ${msg}`, false);
  }, [addLog]);

  // Start continuous tracking engine
  const startTracking = useCallback(() => {
    if (!navigator.geolocation) {
      showToast('Trình duyệt không hỗ trợ Geolocation!', 'error');
      setGpsError('Trình duyệt không hỗ trợ Geolocation!');
      return;
    }

    setIsTracking(true);
    localStorage.setItem('smartbin_tracking_enabled', 'true');
    requestWakeLock();
    addLog('Smartbin: Tự động kết nối & phát sóng định vị...', true);

    // Watch position
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
    }
    watchIdRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        handlePositionSuccess(pos);
      },
      handlePositionError,
      { enableHighAccuracy: true, maximumAge: 3000, timeout: 10000 }
    );

    // Initial position fetch & instant connect transmission
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        handlePositionSuccess(pos);
        transmitPositionRef.current?.(pos);
      },
      handlePositionError,
      { enableHighAccuracy: true, maximumAge: 3000, timeout: 10000 }
    );

    // Periodic ping timer
    if (intervalTimerRef.current) clearInterval(intervalTimerRef.current);
    intervalTimerRef.current = setInterval(() => {
      if (latestPosRef.current) {
        transmitPositionRef.current?.(latestPosRef.current);
      }
    }, Math.max(2000, intervalSec * 1000));
  }, [handlePositionSuccess, handlePositionError, intervalSec, addLog]);

  const stopTracking = useCallback(() => {
    setIsTracking(false);
    localStorage.setItem('smartbin_tracking_enabled', 'false');
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    if (intervalTimerRef.current) {
      clearInterval(intervalTimerRef.current);
      intervalTimerRef.current = null;
    }
    releaseWakeLock();
    addLog('Smartbin: Đã tạm dừng phát định vị', false);
  }, [addLog]);

  // Auto-start on mount (auto-connect on location permission)
  useEffect(() => {
    startTracking();
    return () => {
      if (watchIdRef.current !== null) navigator.geolocation.clearWatch(watchIdRef.current);
      if (intervalTimerRef.current) clearInterval(intervalTimerRef.current);
      releaseWakeLock();
    };
  }, [startTracking]);

  // SOS Emergency button: High priority burst transmission
  const handleSendSos = () => {
    if (!navigator.geolocation) {
      showToast('Không hỗ trợ định vị GPS', 'error');
      return;
    }

    showToast('🚨 Đang phát báo động SOS về ban quản lý...', 'error');

    // Immediate pulse 1
    if (latestPosRef.current) {
      transmitPosition(latestPosRef.current, true);
    }

    // Burst pulse 2 after 400ms to guarantee packet arrival over mobile network
    setTimeout(() => {
      if (latestPosRef.current) {
        transmitPosition(latestPosRef.current, true);
      }
    }, 400);

    // Refresh GPS coordinates concurrently
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        handlePositionSuccess(pos);
        transmitPosition(pos, true);
      },
      (err) => {
        handlePositionError(err);
        if (latestPosRef.current) {
          transmitPosition(latestPosRef.current, true);
        }
      },
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 3000 }
    );
  };

  // Save settings handler
  const handleSaveSettings = () => {
    localStorage.setItem('smartbin_device_id', deviceId.trim());
    localStorage.setItem('smartbin_is_custom_id', 'true');
    localStorage.setItem('smartbin_server_url', serverUrl.trim());
    localStorage.setItem('smartbin_interval', intervalSec.toString());
    setShowSettings(false);
    showToast('Smartbin: Đã lưu thông số thiết bị thành công!', 'success');
    if (isTracking) {
      startTracking();
    }
  };

  const isConnected = isTracking && currentPosition !== null;

  return (
    <Box
      sx={{
        minHeight: '100vh',
        width: '100%',
        backgroundColor: '#f8fafc',
        backgroundImage: 'radial-gradient(at 0% 0%, rgba(16, 185, 129, 0.08) 0px, transparent 50%), radial-gradient(at 100% 100%, rgba(5, 150, 105, 0.05) 0px, transparent 50%)',
        color: '#0f172a',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        pt: { xs: 2.5, sm: 4 },
        pb: { xs: 6, sm: 8 },
        px: { xs: 2, sm: 3 },
        boxSizing: 'border-box',
      }}
    >
      <Box sx={{ width: '100%', maxWidth: 440 }}>
        {/* Top App Header */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            mb: 2.5,
            pb: 2,
            borderBottom: '1px solid #e2e8f0',
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Box
              sx={{
                width: 44,
                height: 44,
                borderRadius: '12px',
                backgroundColor: '#ecfdf5',
                border: '1.5px solid #a7f3d0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#059669',
                boxShadow: '0 4px 12px rgba(16, 185, 129, 0.15)',
              }}
            >
              <RecyclingIcon sx={{ fontSize: 28 }} />
            </Box>
            <Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography variant="h5" sx={{ fontWeight: 800, color: '#065f46', letterSpacing: '-0.5px', lineHeight: 1.2 }}>
                  Smartbin
                </Typography>
                <Chip
                  size="small"
                  label="V2.5"
                  sx={{
                    height: 18,
                    fontSize: '0.65rem',
                    fontWeight: 700,
                    backgroundColor: '#d1fae5',
                    color: '#047857',
                  }}
                />
              </Box>
              <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 600, display: 'block' }}>
                Hệ thống Định vị Thu gom Rác Thông minh
              </Typography>
            </Box>
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {/* QR Code Button */}
            <Tooltip title="Mã QR mở trên điện thoại">
              <IconButton
                onClick={() => setShowQrModal(true)}
                sx={{
                  backgroundColor: '#ffffff',
                  color: '#475569',
                  border: '1px solid #e2e8f0',
                  boxShadow: '0 2px 6px rgba(0,0,0,0.04)',
                  '&:hover': { backgroundColor: '#f1f5f9', color: '#059669', borderColor: '#10b981' },
                }}
              >
                <QrCode2Icon sx={{ fontSize: 20 }} />
              </IconButton>
            </Tooltip>

            {/* Logs Icon Button */}
            <Tooltip title="Xem nhật ký truyền tin">
              <IconButton
                onClick={() => setShowLogsModal(true)}
                sx={{
                  backgroundColor: '#ffffff',
                  color: '#475569',
                  border: '1px solid #e2e8f0',
                  boxShadow: '0 2px 6px rgba(0,0,0,0.04)',
                  '&:hover': { backgroundColor: '#f1f5f9', color: '#059669', borderColor: '#10b981' },
                }}
              >
                <Badge badgeContent={logs.length} color="success" max={99}>
                  <StatusIcon sx={{ fontSize: 20 }} />
                </Badge>
              </IconButton>
            </Tooltip>

            {/* Settings Icon Button */}
            <Tooltip title="Cài đặt thông số thiết bị">
              <IconButton
                onClick={() => setShowSettings(true)}
                sx={{
                  backgroundColor: '#ffffff',
                  color: '#475569',
                  border: '1px solid #e2e8f0',
                  boxShadow: '0 2px 6px rgba(0,0,0,0.04)',
                  '&:hover': { backgroundColor: '#f1f5f9', color: '#059669', borderColor: '#10b981' },
                }}
              >
                <SettingsIcon sx={{ fontSize: 20 }} />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>

        {/* Laptop/Desktop Awareness Alert */}
        {!isMobile && (
          <Alert
            severity="info"
            icon={<LaptopIcon sx={{ color: '#0284c7' }} />}
            sx={{
              mb: 2.5,
              borderRadius: 2.5,
              border: '1px solid #bae6fd',
              backgroundColor: '#f0f9ff',
              color: '#0369a1',
              fontWeight: 500,
              fontSize: '0.82rem',
            }}
            action={
              <Button
                size="small"
                variant="outlined"
                onClick={() => setShowQrModal(true)}
                sx={{ textTransform: 'none', fontWeight: 700, borderColor: '#0284c7', color: '#0284c7' }}
              >
                Quét QR
              </Button>
            }
          >
            <strong>Đang mở trên Máy tính:</strong> Laptop dùng địa chỉ IP mạng (sai số cao). Hãy mở trên <strong>Điện thoại di động</strong> để có GPS vệ tinh chính xác từng mét!
          </Alert>
        )}

        {/* GPS Error Alert if any */}
        {gpsError && (
          <Alert
            severity="warning"
            sx={{
              mb: 2.5,
              borderRadius: 2.5,
              border: '1px solid #fed7aa',
              backgroundColor: '#fffbeb',
              color: '#9a3412',
              fontWeight: 500,
            }}
          >
            {gpsError}
          </Alert>
        )}

        {/* Main Card: Bảng Điều Khiển Smartbin */}
        <Card
          sx={{
            backgroundColor: '#ffffff',
            borderRadius: 3.5,
            border: '1px solid #e2e8f0',
            boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.04), 0 8px 10px -6px rgba(0, 0, 0, 0.02)',
            overflow: 'hidden',
          }}
        >
          {/* Header Status Bar: Pulsing Beacon */}
          <Box
            sx={{
              px: 2.5,
              py: 1.8,
              backgroundColor: isTracking ? '#f0fdf4' : '#f8fafc',
              borderBottom: `1px solid ${isTracking ? '#bbf7d0' : '#e2e8f0'}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Box
                sx={{
                  width: 10,
                  height: 10,
                  borderRadius: '50%',
                  backgroundColor: isTracking ? '#10b981' : '#94a3b8',
                  boxShadow: isTracking ? '0 0 10px #10b981' : 'none',
                  animation: isTracking ? 'pulse 1.8s infinite' : 'none',
                  '@keyframes pulse': {
                    '0%': { transform: 'scale(0.95)', opacity: 0.7 },
                    '50%': { transform: 'scale(1.25)', opacity: 1 },
                    '100%': { transform: 'scale(0.95)', opacity: 0.7 },
                  },
                }}
              />
              <Typography variant="subtitle2" sx={{ fontWeight: 700, color: isTracking ? '#065f46' : '#64748b' }}>
                {isTracking ? 'Đang phát định vị GPS liên tục' : 'Tạm dừng phát định vị'}
              </Typography>
            </Box>

            <Chip
              size="small"
              icon={<SensorsIcon sx={{ fontSize: '14px !important' }} />}
              label={`Đã gửi: ${sentCount}`}
              sx={{
                height: 24,
                fontSize: '0.75rem',
                fontWeight: 700,
                backgroundColor: '#dcfce7',
                color: '#15803d',
                border: '1px solid #86efac',
              }}
            />
          </Box>

          <CardContent sx={{ p: 2.5 }}>
            {/* Device ID Display */}
            <Box
              sx={{
                p: 1.5,
                mb: 2.5,
                backgroundColor: '#f8fafc',
                border: '1px solid #e2e8f0',
                borderRadius: 2,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <Box>
                <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 600, display: 'block', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Mã thiết bị (IP tự động)
                </Typography>
                <Typography variant="body1" sx={{ fontWeight: 800, color: '#0f172a', fontSize: '1.2rem', fontFamily: 'monospace' }}>
                  {deviceId || 'Đang lấy IP...'}
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Chip
                  label={isMobile ? "GPS Di Động" : "Mạng Laptop"}
                  size="small"
                  sx={{
                    backgroundColor: isMobile ? '#ecfdf5' : '#f1f5f9',
                    color: isMobile ? '#059669' : '#475569',
                    fontWeight: 700,
                    border: `1px solid ${isMobile ? '#a7f3d0' : '#cbd5e1'}`,
                  }}
                />
              </Box>
            </Box>

            {/* Live GPS Telemetry Bento Grid */}
            {currentPosition ? (
              <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1.5, mb: 2.5 }}>
                <Paper
                  elevation={0}
                  sx={{
                    p: 1.5,
                    backgroundColor: '#ffffff',
                    border: '1px solid #e2e8f0',
                    borderRadius: 2,
                    boxShadow: '0 2px 5px rgba(0,0,0,0.02)',
                  }}
                >
                  <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 600 }}>
                    Vĩ độ (Latitude)
                  </Typography>
                  <Typography variant="body1" sx={{ fontWeight: 700, color: '#0369a1', fontFamily: 'monospace' }}>
                    {currentPosition.coords.latitude.toFixed(6)}°
                  </Typography>
                </Paper>

                <Paper
                  elevation={0}
                  sx={{
                    p: 1.5,
                    backgroundColor: '#ffffff',
                    border: '1px solid #e2e8f0',
                    borderRadius: 2,
                    boxShadow: '0 2px 5px rgba(0,0,0,0.02)',
                  }}
                >
                  <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 600 }}>
                    Kinh độ (Longitude)
                  </Typography>
                  <Typography variant="body1" sx={{ fontWeight: 700, color: '#0369a1', fontFamily: 'monospace' }}>
                    {currentPosition.coords.longitude.toFixed(6)}°
                  </Typography>
                </Paper>

                <Paper
                  elevation={0}
                  sx={{
                    p: 1.5,
                    backgroundColor: '#ffffff',
                    border: '1px solid #e2e8f0',
                    borderRadius: 2,
                    boxShadow: '0 2px 5px rgba(0,0,0,0.02)',
                  }}
                >
                  <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 600 }}>
                    Sai số định vị
                  </Typography>
                  <Typography
                    variant="body1"
                    sx={{
                      fontWeight: 700,
                      color: currentPosition.coords.accuracy > 1000 ? '#d97706' : '#059669',
                    }}
                  >
                    {currentPosition.coords.accuracy > 1000
                      ? `±${(currentPosition.coords.accuracy / 1000).toFixed(1)} km`
                      : `±${Math.round(currentPosition.coords.accuracy)} mét`}
                  </Typography>
                </Paper>

                <Paper
                  elevation={0}
                  sx={{
                    p: 1.5,
                    backgroundColor: '#ffffff',
                    border: '1px solid #e2e8f0',
                    borderRadius: 2,
                    boxShadow: '0 2px 5px rgba(0,0,0,0.02)',
                  }}
                >
                  <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 600 }}>
                    Tốc độ di chuyển
                  </Typography>
                  <Typography variant="body1" sx={{ fontWeight: 700, color: '#d97706' }}>
                    {currentPosition.coords.speed != null ? (currentPosition.coords.speed * 3.6).toFixed(1) : '0.0'} km/h
                  </Typography>
                </Paper>
              </Box>
            ) : (
              <Box
                sx={{
                  p: 2.5,
                  mb: 2.5,
                  borderRadius: 2,
                  backgroundColor: '#f8fafc',
                  border: '1px dashed #cbd5e1',
                  textAlign: 'center',
                }}
              >
                <Typography variant="caption" sx={{ color: '#64748b', fontStyle: 'italic', display: 'block' }}>
                  Đang đồng bộ tín hiệu vệ tinh GPS... Vui lòng giữ trang mở.
                </Typography>
              </Box>
            )}

            {/* Battery status card */}
            <Box
              onClick={() => {
                if (!hasRealBattery) {
                  setTempBatteryInput(batteryLevel);
                  setTempChargingInput(isCharging);
                  setShowBatteryModal(true);
                }
              }}
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                mb: !hasRealBattery ? 1 : 2.5,
                p: 1.5,
                borderRadius: 2,
                backgroundColor: '#f8fafc',
                border: '1px solid #e2e8f0',
                cursor: !hasRealBattery ? 'pointer' : 'default',
                transition: 'all 0.2s',
                '&:hover': !hasRealBattery
                  ? {
                      borderColor: '#10b981',
                      backgroundColor: '#f0fdf4',
                      boxShadow: '0 2px 8px rgba(16, 185, 129, 0.08)',
                    }
                  : {},
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2 }}>
                <BatteryIcon sx={{ color: isCharging ? '#059669' : '#0284c7', fontSize: 24 }} />
                <Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8 }}>
                    <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 600 }}>
                      Mức pin gửi máy chủ
                    </Typography>
                    {!hasRealBattery && (
                      <Typography variant="caption" sx={{ color: '#0284c7', fontSize: '0.7rem', fontWeight: 700 }}>
                        (Chạm để chỉnh)
                      </Typography>
                    )}
                  </Box>
                  <Typography variant="body2" sx={{ fontWeight: 800, color: '#0f172a' }}>
                    {batteryLevel}% {isCharging ? '(Đang cắm sạc ⚡)' : ''}
                  </Typography>
                </Box>
              </Box>
              <Chip
                size="small"
                label={hasRealBattery ? 'Pin thực tế' : 'Chỉnh % (iOS)'}
                sx={{
                  height: 22,
                  fontSize: '0.7rem',
                  fontWeight: 600,
                  backgroundColor: hasRealBattery ? '#ecfdf5' : '#eff6ff',
                  color: hasRealBattery ? '#059669' : '#1d4ed8',
                  border: `1px solid ${hasRealBattery ? '#a7f3d0' : '#bfdbfe'}`,
                }}
              />
            </Box>

            {!hasRealBattery && (
              <Box sx={{ mb: 2.5, px: 0.5 }}>
                <Typography variant="caption" sx={{ color: '#64748b', fontSize: '0.72rem', display: 'block' }}>
                  📱 Apple iOS chặn tự đọc pin. Chạm vào ô pin trên để nhập nhanh <strong>43%</strong> giống trên máy bạn nhé!
                </Typography>
              </Box>
            )}

            {/* Status & SOS Action Area */}
            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1.5, alignItems: 'stretch' }}>
              {/* Clean text / chip / badge status */}
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 0.8,
                  minHeight: 48,
                  px: 1.5,
                  py: 1,
                  borderRadius: 2.5,
                  backgroundColor: isConnected ? '#ecfdf5' : '#fffbeb',
                  border: `1.5px solid ${isConnected ? '#a7f3d0' : '#fde68a'}`,
                  boxShadow: isConnected ? '0 2px 8px rgba(16, 185, 129, 0.12)' : 'none',
                  transition: 'all 0.3s ease',
                  textAlign: 'center',
                }}
              >
                {isConnected ? (
                  <>
                    <CheckCircleIcon sx={{ fontSize: 20, color: '#059669' }} />
                    <Typography variant="body2" sx={{ fontWeight: 800, color: '#065f46', fontSize: '0.85rem' }}>
                      ✓ Đã kết nối
                    </Typography>
                    <Box
                      sx={{
                        width: 8,
                        height: 8,
                        borderRadius: '50%',
                        backgroundColor: '#10b981',
                        boxShadow: '0 0 8px #10b981',
                        animation: 'pulse 1.8s infinite',
                        '@keyframes pulse': {
                          '0%': { transform: 'scale(0.95)', opacity: 0.7 },
                          '50%': { transform: 'scale(1.25)', opacity: 1 },
                          '100%': { transform: 'scale(0.95)', opacity: 0.7 },
                        },
                      }}
                    />
                  </>
                ) : (
                  <>
                    <MyLocationIcon
                      sx={{
                        fontSize: 18,
                        color: '#d97706',
                        animation: 'pulse 1.5s infinite',
                        '@keyframes pulse': {
                          '0%': { transform: 'scale(0.95)', opacity: 0.7 },
                          '50%': { transform: 'scale(1.2)', opacity: 1 },
                          '100%': { transform: 'scale(0.95)', opacity: 0.7 },
                        },
                      }}
                    />
                    <Typography
                      variant="caption"
                      sx={{ fontWeight: 700, color: '#b45309', lineHeight: 1.2, fontSize: '0.75rem' }}
                    >
                      Đang kết nối GPS vệ tinh...
                    </Typography>
                  </>
                )}
              </Box>

              {/* Primary emergency action button */}
              <Button
                variant="contained"
                onClick={handleSendSos}
                startIcon={<SosIcon />}
                sx={{
                  minHeight: 48,
                  backgroundColor: '#dc2626',
                  color: '#ffffff',
                  fontWeight: 800,
                  fontSize: '0.95rem',
                  textTransform: 'none',
                  borderRadius: 2.5,
                  py: 1.2,
                  boxShadow: '0 4px 12px rgba(220, 38, 38, 0.25)',
                  '&:hover': { backgroundColor: '#b91c1c' },
                }}
              >
                SOS
              </Button>
            </Box>

            {/* If on desktop, provide button to toggle continuous broadcasting */}
            {!isMobile && (
              <Box sx={{ mt: 2, textAlign: 'center' }}>
                <Button
                  size="small"
                  onClick={() => {
                    if (isTracking) stopTracking();
                    else startTracking();
                  }}
                  sx={{ textTransform: 'none', color: '#64748b', fontSize: '0.78rem' }}
                >
                  {isTracking ? 'Tạm dừng phát thử nghiệm máy tính' : 'Bật phát thử nghiệm máy tính'}
                </Button>
              </Box>
            )}
          </CardContent>
        </Card>
      </Box>

      {/* POPUP 1: Nhật ký truyền tin Smartbin */}
      <Dialog
        open={showLogsModal}
        onClose={() => setShowLogsModal(false)}
        maxWidth="xs"
        fullWidth
        slotProps={{
          paper: {
            sx: {
              backgroundColor: '#ffffff',
              color: '#0f172a',
              borderRadius: 3.5,
              border: '1px solid #e2e8f0',
              m: 2,
            },
          },
        }}
      >
        <DialogTitle
          sx={{
            fontWeight: 800,
            color: '#065f46',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            pb: 1,
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <StatusIcon />
            <span>Nhật ký Smartbin ({logs.length})</span>
          </Box>
          <IconButton size="small" onClick={() => setShowLogsModal(false)}>
            <CloseIcon fontSize="small" />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ p: 2 }}>
          <Box
            sx={{
              maxHeight: 340,
              overflowY: 'auto',
              backgroundColor: '#f8fafc',
              border: '1px solid #e2e8f0',
              borderRadius: 2,
              p: 1.5,
            }}
          >
            {logs.length === 0 ? (
              <Typography variant="caption" sx={{ color: '#94a3b8', fontStyle: 'italic', display: 'block', py: 3, textAlign: 'center' }}>
                Chưa có gói tin nào được ghi nhận.
              </Typography>
            ) : (
              logs.map((item) => (
                <Box
                  key={item.id}
                  sx={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: 1.5,
                    py: 0.8,
                    borderBottom: '1px solid #e2e8f0',
                    fontSize: '0.75rem',
                    fontFamily: 'monospace',
                  }}
                >
                  <Typography
                    variant="caption"
                    sx={{ color: '#64748b', fontFamily: 'monospace', minWidth: 62, fontWeight: 600 }}
                  >
                    {item.time}
                  </Typography>
                  <Typography
                    variant="caption"
                    sx={{
                      color: item.success ? '#047857' : '#dc2626',
                      fontFamily: 'monospace',
                      fontWeight: 600,
                      wordBreak: 'break-word',
                    }}
                  >
                    {item.success ? '✓ ' : '✕ '}
                    {item.text}
                  </Typography>
                </Box>
              ))
            )}
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2, pt: 0, justifyContent: 'space-between' }}>
          {logs.length > 0 && (
            <Button
              size="small"
              onClick={() => setLogs([])}
              sx={{ color: '#94a3b8', textTransform: 'none', fontWeight: 600 }}
            >
              Xóa lịch sử
            </Button>
          )}
          <Button
            variant="contained"
            onClick={() => setShowLogsModal(false)}
            sx={{
              backgroundColor: '#059669',
              color: '#ffffff',
              fontWeight: 700,
              borderRadius: 2,
              ml: 'auto',
              '&:hover': { backgroundColor: '#047857' },
            }}
          >
            Đóng
          </Button>
        </DialogActions>
      </Dialog>

      {/* POPUP 2: QR Code Modal for Mobile Phone */}
      <Dialog
        open={showQrModal}
        onClose={() => setShowQrModal(false)}
        maxWidth="xs"
        fullWidth
        slotProps={{
          paper: {
            sx: {
              backgroundColor: '#ffffff',
              color: '#0f172a',
              borderRadius: 3.5,
              border: '1px solid #e2e8f0',
              m: 2,
              textAlign: 'center',
            },
          },
        }}
      >
        <DialogTitle sx={{ fontWeight: 800, color: '#065f46', pb: 1, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <PhoneIphoneIcon />
            <span>Mở trên Điện Thoại</span>
          </Box>
          <IconButton size="small" onClick={() => setShowQrModal(false)}>
            <CloseIcon fontSize="small" />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ p: 3, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
          <Typography variant="body2" sx={{ color: '#475569', fontWeight: 500 }}>
            Quét mã bằng <strong>Camera iPhone / Android hoặc Zalo</strong> để phát định vị vệ tinh GPS chuẩn xác nhất:
          </Typography>

          <Paper
            elevation={0}
            sx={{
              p: 2,
              backgroundColor: '#ffffff',
              border: '2px solid #a7f3d0',
              borderRadius: 3,
              display: 'inline-flex',
            }}
          >
            <QRCode value={window.location.href} size={200} />
          </Paper>

          <Typography variant="caption" sx={{ color: '#059669', fontWeight: 700, wordBreak: 'break-all' }}>
            {window.location.href}
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 2, pt: 0, justifyContent: 'center' }}>
          <Button
            variant="outlined"
            onClick={() => handleCopy(window.location.href, 'web')}
            startIcon={<CopyIcon />}
            sx={{ textTransform: 'none', fontWeight: 700, borderRadius: 2 }}
          >
            Sao chép liên kết
          </Button>
          <Button
            variant="contained"
            onClick={() => setShowQrModal(false)}
            sx={{
              backgroundColor: '#059669',
              color: '#ffffff',
              fontWeight: 700,
              borderRadius: 2,
              '&:hover': { backgroundColor: '#047857' },
            }}
          >
            Đóng
          </Button>
        </DialogActions>
      </Dialog>

      {/* POPUP 3: SOS Alert Sent Confirmation */}
      <Dialog
        open={showSosSuccessModal}
        onClose={() => setShowSosSuccessModal(false)}
        maxWidth="xs"
        fullWidth
        slotProps={{
          paper: {
            sx: {
              backgroundColor: '#ffffff',
              color: '#0f172a',
              borderRadius: 3.5,
              border: '2px solid #ef4444',
              m: 2,
            },
          },
        }}
      >
        <DialogTitle sx={{ fontWeight: 900, color: '#dc2626', pb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
          <SosIcon sx={{ fontSize: 28 }} />
          <span>ĐÃ PHÁT TÍN HIỆU SOS!</span>
        </DialogTitle>
        <DialogContent sx={{ pt: '12px !important' }}>
          <Typography variant="body2" sx={{ color: '#334155', fontWeight: 600, mb: 1.5 }}>
            Tín hiệu cấp cứu khẩn cấp từ phương tiện <strong>{deviceId}</strong> đã được chuyển tiếp thành công về màn hình giám sát trung tâm.
          </Typography>
          <Box sx={{ p: 1.5, backgroundColor: '#fef2f2', borderRadius: 2, border: '1px solid #fecaca' }}>
            <Typography variant="caption" sx={{ color: '#991b1b', fontWeight: 700, display: 'block' }}>
              • Âm thanh cảnh báo đã kích hoạt tại phòng điều hành.
            </Typography>
            <Typography variant="caption" sx={{ color: '#991b1b', fontWeight: 700, display: 'block' }}>
              • Toạ độ GPS và lộ trình hiện tại đã được ghim ưu tiên.
            </Typography>
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button
            variant="contained"
            fullWidth
            onClick={() => setShowSosSuccessModal(false)}
            sx={{
              backgroundColor: '#dc2626',
              color: '#ffffff',
              fontWeight: 800,
              borderRadius: 2.5,
              py: 1.2,
              '&:hover': { backgroundColor: '#b91c1c' },
            }}
          >
            Đã hiểu & Tiếp tục
          </Button>
        </DialogActions>
      </Dialog>

      {/* POPUP: Cập nhật mức pin thực tế (Dành cho iOS Safari / WebKit) */}
      <Dialog
        open={showBatteryModal}
        onClose={() => setShowBatteryModal(false)}
        maxWidth="xs"
        fullWidth
        slotProps={{
          paper: {
            sx: {
              backgroundColor: '#ffffff',
              color: '#0f172a',
              borderRadius: 3.5,
              border: '1px solid #e2e8f0',
              m: 2,
            },
          },
        }}
      >
        <DialogTitle sx={{ fontWeight: 800, color: '#0369a1', pb: 1, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span>Cập nhật mức pin thực tế</span>
          <IconButton size="small" onClick={() => setShowBatteryModal(false)}>
            <CloseIcon fontSize="small" />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: '12px !important' }}>
          <Alert severity="info" sx={{ fontSize: '0.8rem', borderRadius: 2 }}>
            <strong>Apple iOS</strong> chặn các website tự đọc pin phần cứng để bảo vệ riêng tư. Bạn có thể chọn nhanh hoặc nhập đúng % pin trên máy bạn để hệ thống đồng bộ chuẩn xác:
          </Alert>

          <Box>
            <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 600, display: 'block', mb: 1 }}>
              Chọn nhanh % pin hiện tại:
            </Typography>
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              {[20, 35, 43, 50, 65, 80, 100].map((val) => (
                <Chip
                  key={val}
                  label={`${val}%`}
                  onClick={() => setTempBatteryInput(val)}
                  color={tempBatteryInput === val ? 'primary' : 'default'}
                  variant={tempBatteryInput === val ? 'filled' : 'outlined'}
                  clickable
                  sx={{ fontWeight: 700 }}
                />
              ))}
            </Box>
          </Box>

          <TextField
            label="Mức pin chính xác (%)"
            type="number"
            value={tempBatteryInput}
            onChange={(e) => setTempBatteryInput(Math.min(100, Math.max(1, Number(e.target.value) || 1)))}
            inputProps={{ min: 1, max: 100 }}
            fullWidth
            size="small"
            slotProps={{
              inputLabel: { sx: { color: '#64748b', fontWeight: 600 } },
              input: { sx: { color: '#0f172a', backgroundColor: '#f8fafc', borderRadius: 1.5 } },
            }}
          />

          <FormControlLabel
            control={
              <Switch
                checked={tempChargingInput}
                onChange={(e) => setTempChargingInput(e.target.checked)}
                color="success"
              />
            }
            label="Thiết bị đang cắm sạc pin ⚡"
          />
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setShowBatteryModal(false)} sx={{ color: '#64748b', fontWeight: 600 }}>
            Hủy
          </Button>
          <Button
            variant="contained"
            onClick={() => {
              setBatteryLevel(tempBatteryInput);
              setIsCharging(tempChargingInput);
              localStorage.setItem('smartbin_battery_level', tempBatteryInput.toString());
              localStorage.setItem('smartbin_is_charging', tempChargingInput.toString());
              setShowBatteryModal(false);
              showToast(`Đã đồng bộ mức pin ${tempBatteryInput}% về máy chủ!`, 'success');
              addLog(`Đã cập nhật pin: ${tempBatteryInput}% ${tempChargingInput ? '(Đang sạc)' : ''}`);
              if (latestPosRef.current && transmitPositionRef.current) {
                transmitPositionRef.current(latestPosRef.current);
              }
            }}
            sx={{
              backgroundColor: '#059669',
              color: '#ffffff',
              fontWeight: 700,
              borderRadius: 2,
              '&:hover': { backgroundColor: '#047857' },
            }}
          >
            Lưu & Gửi ngay
          </Button>
        </DialogActions>
      </Dialog>

      {/* POPUP 4: Cài đặt Smartbin */}
      <Dialog
        open={showSettings}
        onClose={() => setShowSettings(false)}
        maxWidth="xs"
        fullWidth
        slotProps={{
          paper: {
            sx: {
              backgroundColor: '#ffffff',
              color: '#0f172a',
              borderRadius: 3.5,
              border: '1px solid #e2e8f0',
              m: 2,
            },
          },
        }}
      >
        <DialogTitle sx={{ fontWeight: 800, color: '#065f46', pb: 1, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span>Cài đặt Smartbin</span>
          <IconButton size="small" onClick={() => setShowSettings(false)}>
            <CloseIcon fontSize="small" />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, pt: '12px !important' }}>
          {/* Device ID field */}
          <Box>
            <TextField
              label="Mã định danh thiết bị (IP tự động)"
              value={deviceId}
              onChange={(e) => setDeviceId(e.target.value)}
              helperText="Tự động nhận diện theo địa chỉ IP của thiết bị mạng"
              fullWidth
              variant="outlined"
              size="small"
              slotProps={{
                inputLabel: { sx: { color: '#64748b', fontWeight: 600 } },
                input: { sx: { color: '#0f172a', backgroundColor: '#f8fafc', borderRadius: 1.5 } },
                formHelperText: { sx: { color: '#64748b' } },
              }}
            />
          </Box>

          {/* Interval */}
          <TextField
            label="Tần suất gửi tín hiệu (giây)"
            type="number"
            value={intervalSec}
            onChange={(e) => setIntervalSec(Math.max(2, Number(e.target.value) || 5))}
            helperText="Khuyến nghị: 2 đến 5 giây để vẽ lộ trình thời gian thực mượt mà"
            fullWidth
            variant="outlined"
            size="small"
            slotProps={{
              inputLabel: { sx: { color: '#64748b', fontWeight: 600 } },
              input: { sx: { color: '#0f172a', backgroundColor: '#f8fafc', borderRadius: 1.5 } },
              formHelperText: { sx: { color: '#64748b' } },
            }}
          />

          {/* Server URL with Copy */}
          <Box>
            <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 600, display: 'block', mb: 0.5 }}>
              URL máy chủ nhận tín hiệu (Server URL)
            </Typography>
            <Paper
              elevation={0}
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                p: 1.2,
                backgroundColor: '#f8fafc',
                border: '1px solid #e2e8f0',
                borderRadius: 2,
              }}
            >
              <Typography variant="body2" sx={{ fontFamily: 'monospace', fontWeight: 700, color: '#0369a1', wordBreak: 'break-all', fontSize: '0.8rem' }}>
                {window.location.origin}{serverUrl}
              </Typography>
              <Tooltip title={copiedUrl ? 'Đã chép!' : 'Sao chép link'}>
                <IconButton size="small" onClick={() => handleCopy(`${window.location.origin}${serverUrl}`, 'gps')} sx={{ ml: 1, color: '#059669' }}>
                  <CopyIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            </Paper>
          </Box>

          {/* Website Map Tracking Link with Copy */}
          <Box>
            <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 600, display: 'block', mb: 0.5 }}>
              Link website bản đồ theo dõi (Giám sát trung tâm)
            </Typography>
            <Paper
              elevation={0}
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                p: 1.2,
                backgroundColor: '#f8fafc',
                border: '1px solid #e2e8f0',
                borderRadius: 2,
              }}
            >
              <Typography variant="body2" sx={{ fontFamily: 'monospace', fontWeight: 700, color: '#059669', wordBreak: 'break-all', fontSize: '0.8rem' }}>
                {window.location.origin}
              </Typography>
              <Tooltip title={copiedWeb ? 'Đã chép!' : 'Sao chép link'}>
                <IconButton size="small" onClick={() => handleCopy(window.location.origin, 'web')} sx={{ ml: 1, color: '#059669' }}>
                  <CopyIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            </Paper>
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2.5, pt: 1 }}>
          <Button onClick={() => setShowSettings(false)} sx={{ color: '#64748b', fontWeight: 600 }}>
            Hủy
          </Button>
          <Button
            variant="contained"
            onClick={handleSaveSettings}
            sx={{
              backgroundColor: '#059669',
              color: '#ffffff',
              fontWeight: 700,
              borderRadius: 2,
              '&:hover': { backgroundColor: '#047857' },
            }}
          >
            Lưu cài đặt
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar feedback */}
      <Snackbar
        open={Boolean(snackbarMessage)}
        autoHideDuration={3500}
        onClose={() => setSnackbarMessage('')}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          onClose={() => setSnackbarMessage('')}
          severity={snackbarSeverity}
          sx={{ width: '100%', borderRadius: 2.5, fontWeight: 700, boxShadow: '0 8px 24px rgba(0,0,0,0.12)' }}
        >
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default MobileTrackerPage;

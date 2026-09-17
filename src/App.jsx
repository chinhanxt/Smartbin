import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Navigation,
  Settings,
  History,
  AlertTriangle,
  CheckCircle2,
  Copy,
  Check,
  X,
  Radio,
  ExternalLink,
  Smartphone,
  Laptop,
  Flame,
  Zap,
} from 'lucide-react';

export default function App() {
  const isMobile = /Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent);

  // State
  const [deviceId, setDeviceId] = useState(() => {
    const saved = localStorage.getItem('smartbin_device_id');
    if (saved && !['81891318', '81891319', 'BIN-001'].includes(saved)) {
      return saved;
    }
    return '';
  });

  const [serverUrl, setServerUrl] = useState(() => {
    return localStorage.getItem('smartbin_server_url') || '/gps';
  });

  const [intervalSec, setIntervalSec] = useState(() => {
    return Number(localStorage.getItem('smartbin_interval')) || 5;
  });

  const [isTracking, setIsTracking] = useState(true);
  const [currentPosition, setCurrentPosition] = useState(null);
  const [lastSentTime, setLastSentTime] = useState(null);
  const [sentCount, setSentCount] = useState(0);

  // Modals
  const [showSettings, setShowSettings] = useState(false);
  const [showLogs, setShowLogs] = useState(false);
  const [showSosModal, setShowSosModal] = useState(false);

  // Logs & Toasts
  const [logs, setLogs] = useState([]);
  const [toast, setToast] = useState(null);
  const [gpsError, setGpsError] = useState(null);
  const [copiedUrl, setCopiedUrl] = useState(false);

  // Refs
  const watchIdRef = useRef(null);
  const intervalTimerRef = useRef(null);
  const latestPosRef = useRef(null);
  const transmitPositionRef = useRef(null);
  const deviceIdRef = useRef(deviceId);
  deviceIdRef.current = deviceId;
  const serverUrlRef = useRef(serverUrl);
  serverUrlRef.current = serverUrl;

  const showToast = (message, type = 'info') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  const addLog = useCallback((text, success = true) => {
    const timeStr = new Date().toLocaleTimeString('vi-VN', { hour12: false });
    setLogs((prev) => [{ time: timeStr, text, success, id: Date.now() + Math.random() }, ...prev.slice(0, 49)]);
  }, []);

  const [deviceIndex, setDeviceIndex] = useState(() => {
    return Number(localStorage.getItem('smartbin_device_index')) || 1;
  });
  const [clientIp, setClientIp] = useState('');

  // Client token helper for persistent device identification
  const getOrCreateClientToken = () => {
    let tok = localStorage.getItem('smartbin_client_token');
    if (!tok) {
      tok = 'dev_' + Math.random().toString(36).substring(2, 9) + Date.now().toString(36);
      localStorage.setItem('smartbin_client_token', tok);
    }
    return tok;
  };

  // 1. Auto IP & Multi-device Discrimination (e.g. 171.236.48.232-01, 171.236.48.232-02)
  useEffect(() => {
    let cancelled = false;

    const fetchIp = async () => {
      const clientToken = getOrCreateClientToken();
      let resolvedDeviceId = null;
      let resolvedIp = null;
      let resolvedIndex = 1;

      try {
        const res = await fetch(`/client-ip?token=${encodeURIComponent(clientToken)}`);
        if (res.ok) {
          const data = await res.json();
          if (data?.deviceId) {
            resolvedDeviceId = data.deviceId;
            resolvedIp = data.ip;
            resolvedIndex = data.deviceIndex || 1;
          }
        }
      } catch {}

      if (!resolvedDeviceId) {
        try {
          const res = await fetch('https://api.ipify.org?format=json');
          if (res.ok) {
            const data = await res.json();
            if (data?.ip) {
              resolvedIp = data.ip;
              let suffix = localStorage.getItem('smartbin_device_suffix');
              if (!suffix) {
                suffix = String(Math.floor(10 + Math.random() * 90));
                localStorage.setItem('smartbin_device_suffix', suffix);
              }
              resolvedDeviceId = `${data.ip}-${suffix}`;
            }
          }
        } catch {}
      }

      if (!cancelled && resolvedDeviceId) {
        const isCustom = localStorage.getItem('smartbin_is_custom_id') === 'true';
        if (!isCustom) {
          setDeviceId(resolvedDeviceId);
          localStorage.setItem('smartbin_device_id', resolvedDeviceId);
        }
        setClientIp(resolvedIp || '');
        setDeviceIndex(resolvedIndex);
        localStorage.setItem('smartbin_device_index', resolvedIndex.toString());

        if (latestPosRef.current && transmitPositionRef.current) {
          transmitPositionRef.current(latestPosRef.current);
        }
      }
    };

    fetchIp();
    return () => { cancelled = true; };
  }, []);

  // Transmit Telemetry
  const transmitPosition = useCallback(async (pos, isSos = false) => {
    if (!pos?.coords) return;
    const { latitude, longitude, accuracy, speed, heading, altitude } = pos.coords;
    const speedKnots = speed != null ? (speed * 1.94384).toFixed(2) : '0';
    const speedKmh = speed != null ? (speed * 3.6).toFixed(1) : '0.0';
    const timestamp = Math.round(Date.now() / 1000);
    const activeDeviceId = (deviceIdRef.current || '171.236.48.232').trim();

    const queryParams = new URLSearchParams({
      id: activeDeviceId,
      lat: latitude.toFixed(6),
      lon: longitude.toFixed(6),
      timestamp: timestamp.toString(),
      speed: speedKnots,
      bearing: (heading || 0).toFixed(1),
      altitude: (altitude || 0).toFixed(1),
      accuracy: (accuracy || 0).toFixed(1),
    });

    if (isSos) queryParams.append('alarm', 'sos');

    const endpoint = serverUrlRef.current.trim() || '/gps';
    const fullUrl = `${endpoint}?${queryParams.toString()}`;

    try {
      const res = await fetch(fullUrl, { method: 'GET' });
      if (res.ok) {
        setSentCount((c) => c + 1);
        setLastSentTime(new Date());
        const accText = accuracy > 1000 ? `±${(accuracy / 1000).toFixed(1)}km` : `±${Math.round(accuracy)}m`;
        const logMsg = `${isSos ? '🚨 [SOS] ' : ''}Toạ độ (${latitude.toFixed(5)}, ${longitude.toFixed(5)}) • ${accText} • ${speedKmh} km/h`;
        addLog(logMsg, true);
        if (isSos) {
          setShowSosModal(true);
          if ('vibrate' in navigator) navigator.vibrate([300, 100, 300, 100, 500]);
        }
      } else {
        addLog(`Lỗi gửi máy chủ: HTTP ${res.status}`, false);
      }
    } catch (err) {
      addLog(`Mất kết nối máy chủ: ${err.message}`, false);
    }
  }, [addLog]);

  transmitPositionRef.current = transmitPosition;

  // Position Handlers
  const handlePosSuccess = useCallback((pos) => {
    setGpsError(null);
    const isFirst = latestPosRef.current === null;
    setCurrentPosition(pos);
    latestPosRef.current = pos;
    if (isFirst) {
      transmitPositionRef.current?.(pos);
    }
  }, []);

  const handlePosError = useCallback((err) => {
    let msg = 'Không lấy được toạ độ GPS';
    if (err.code === 1) msg = 'Vui lòng cho phép quyền Vị trí (Location) trong trình duyệt';
    else if (err.code === 2) msg = 'Mất tín hiệu vệ tinh GPS';
    else if (err.code === 3) msg = 'Hết thời gian chờ phản hồi GPS';
    setGpsError(msg);
    addLog(`Lỗi GPS: ${msg}`, false);
  }, [addLog]);

  // Start tracking
  const startTracking = useCallback(() => {
    if (!navigator.geolocation) {
      setGpsError('Trình duyệt không hỗ trợ Geolocation!');
      return;
    }
    setIsTracking(true);

    if (watchIdRef.current !== null) navigator.geolocation.clearWatch(watchIdRef.current);
    watchIdRef.current = navigator.geolocation.watchPosition(
      handlePosSuccess,
      handlePosError,
      { enableHighAccuracy: true, maximumAge: 3000, timeout: 10000 }
    );

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        handlePosSuccess(pos);
        transmitPositionRef.current?.(pos);
      },
      handlePosError,
      { enableHighAccuracy: true, maximumAge: 3000, timeout: 10000 }
    );

    if (intervalTimerRef.current) clearInterval(intervalTimerRef.current);
    intervalTimerRef.current = setInterval(() => {
      if (latestPosRef.current) {
        transmitPositionRef.current?.(latestPosRef.current);
      }
    }, Math.max(2000, intervalSec * 1000));
  }, [handlePosSuccess, handlePosError, intervalSec]);

  useEffect(() => {
    startTracking();
    return () => {
      if (watchIdRef.current !== null) navigator.geolocation.clearWatch(watchIdRef.current);
      if (intervalTimerRef.current) clearInterval(intervalTimerRef.current);
    };
  }, [startTracking]);

  // SOS button handler
  const handleSendSos = () => {
    if (!latestPosRef.current) {
      showToast('Đang chờ toạ độ GPS trước khi phát SOS...', 'error');
      return;
    }
    showToast('🚨 Đang phát báo động SOS về máy chủ...', 'error');
    transmitPosition(latestPosRef.current, true);
    setTimeout(() => {
      if (latestPosRef.current) transmitPosition(latestPosRef.current, true);
    }, 400);
  };

  const handleCopy = (text) => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text);
      setCopiedUrl(true);
      setTimeout(() => setCopiedUrl(false), 2000);
      showToast('Đã sao chép link máy chủ!', 'success');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col items-center px-4 py-4 sm:py-8">
      <div className="w-full max-w-md">
        {/* Ultra-compact Header */}
        <header className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-emerald-600 flex items-center justify-center shadow-sm">
              <Navigation className="w-4 h-4 text-white" />
            </div>
            <div className="flex items-center gap-1.5">
              <h1 className="font-extrabold text-base text-slate-900 leading-tight">Smartbin Mobile</h1>
              <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-800 border border-emerald-200">
                GPS
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            {/* Logs button */}
            <button
              onClick={() => setShowLogs(true)}
              className="relative p-1.5 rounded-lg bg-white border border-slate-200 text-slate-600 hover:text-emerald-600 hover:border-emerald-300 shadow-2xs transition-all"
              title="Nhật ký"
            >
              <History className="w-4 h-4" />
              {logs.length > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-emerald-600 text-white text-[9px] font-bold flex items-center justify-center border border-white">
                  {logs.length > 9 ? '9+' : logs.length}
                </span>
              )}
            </button>

            {/* Settings button */}
            <button
              onClick={() => setShowSettings(true)}
              className="p-1.5 rounded-lg bg-white border border-slate-200 text-slate-600 hover:text-emerald-600 hover:border-emerald-300 shadow-2xs transition-all"
              title="Cài đặt"
            >
              <Settings className="w-4 h-4" />
            </button>
          </div>
        </header>

        {/* Slim Laptop Warning */}
        {!isMobile && (
          <div className="mb-3 px-2.5 py-1 rounded-lg bg-sky-50 border border-sky-200/80 text-sky-800 text-[11px] flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <Laptop className="w-3.5 h-3.5 text-sky-600 shrink-0" />
              <span className="font-medium">Chế độ Laptop (GPS IP)</span>
            </div>
            <span className="text-[10px] text-sky-600 font-medium">Khuyên dùng Mobile</span>
          </div>
        )}

        {/* GPS Error Alert */}
        {gpsError && (
          <div className="mb-3 px-2.5 py-1.5 rounded-lg bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-center gap-2">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
            <span className="font-semibold text-[11px]">{gpsError}</span>
          </div>
        )}

        {/* Main Card */}
        <main className="bg-white rounded-2xl border border-slate-200 shadow-lg shadow-slate-200/40 overflow-hidden">
          {/* Header Beacon Bar */}
          <div className="px-4 py-2.5 bg-emerald-50/70 border-b border-emerald-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ripple absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-600"></span>
              </span>
              <span className="text-xs font-bold text-emerald-900">
                Đang phát GPS liên tục
              </span>
            </div>
            <div className="flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-100/80 text-emerald-800 border border-emerald-300">
              <Radio className="w-3 h-3 text-emerald-600" />
              <span>Gửi: {sentCount}</span>
            </div>
          </div>

          <div className="p-5 space-y-4">
            {/* Device ID (Automatic IP + Device Index) */}
            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-center justify-between">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Mã thiết bị (Tự động phân biệt)
                </p>
                <p className="text-lg font-extrabold text-slate-900 font-mono tracking-tight">
                  {deviceId || 'Đang nhận diện...'}
                </p>
                {clientIp && (
                  <p className="text-[11px] text-slate-500 font-medium mt-0.5">
                    IP mạng: <span className="font-mono">{clientIp}</span> • Máy số: <strong className="text-emerald-700">#{deviceIndex}</strong>
                  </p>
                )}
              </div>
              <span className="text-xs font-bold px-2.5 py-1 rounded-lg bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center gap-1">
                <Smartphone className="w-3.5 h-3.5" />
                {isMobile ? `iPhone #${deviceIndex}` : `Thiết bị #${deviceIndex}`}
              </span>
            </div>

            {/* GPS Telemetry Grid */}
            {currentPosition ? (
              <div className="grid grid-cols-2 gap-2.5">
                <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200/80">
                  <p className="text-[11px] font-semibold text-slate-500">Vĩ độ (Latitude)</p>
                  <p className="text-base font-bold text-sky-800 font-mono mt-0.5">
                    {currentPosition.coords.latitude.toFixed(6)}°
                  </p>
                </div>
                <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200/80">
                  <p className="text-[11px] font-semibold text-slate-500">Kinh độ (Longitude)</p>
                  <p className="text-base font-bold text-sky-800 font-mono mt-0.5">
                    {currentPosition.coords.longitude.toFixed(6)}°
                  </p>
                </div>
                <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200/80">
                  <p className="text-[11px] font-semibold text-slate-500">Sai số toạ độ</p>
                  <p className={`text-base font-bold font-mono mt-0.5 ${currentPosition.coords.accuracy > 1000 ? 'text-amber-600' : 'text-emerald-700'}`}>
                    {currentPosition.coords.accuracy > 1000
                      ? `±${(currentPosition.coords.accuracy / 1000).toFixed(1)} km`
                      : `±${Math.round(currentPosition.coords.accuracy)} mét`}
                  </p>
                </div>
                <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200/80">
                  <p className="text-[11px] font-semibold text-slate-500">Tốc độ xe chạy</p>
                  <p className="text-base font-bold text-amber-700 font-mono mt-0.5">
                    {currentPosition.coords.speed != null ? (currentPosition.coords.speed * 3.6).toFixed(1) : '0.0'} km/h
                  </p>
                </div>
              </div>
            ) : (
              <div className="p-6 rounded-2xl bg-slate-50 border border-dashed border-slate-300 text-center">
                <Navigation className="w-8 h-8 text-slate-400 mx-auto mb-2 animate-spin" style={{ animationDuration: '4s' }} />
                <p className="text-xs text-slate-500 font-medium">Đang bắt tín hiệu vệ tinh GPS... Vui lòng giữ trang mở.</p>
              </div>
            )}

            {/* Status & Action */}
            <div className="grid grid-cols-2 gap-2.5 pt-1">
              {/* Connected Status Badge */}
              <div className="flex items-center justify-center gap-2 py-3 px-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 font-bold text-sm shadow-sm">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>✓ Đã kết nối</span>
              </div>

              {/* SOS Emergency Button */}
              <button
                onClick={handleSendSos}
                className="flex items-center justify-center gap-1.5 py-3 px-3 rounded-2xl bg-red-600 hover:bg-red-700 active:scale-95 text-white font-extrabold text-sm shadow-lg shadow-red-600/30 transition-all"
              >
                <AlertTriangle className="w-4 h-4 fill-white text-red-600" />
                <span>PHÁT SOS</span>
              </button>
            </div>
          </div>
        </main>

        {/* Footer info */}
        <footer className="mt-3 text-center text-[10px] font-mono text-slate-400">
          Smartbin GPS • {serverUrl}
        </footer>
      </div>

      {/* Settings Modal */}
      {showSettings && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-5 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-extrabold text-slate-900 text-base">Cài đặt Smartbin Client</h3>
              <button onClick={() => setShowSettings(false)} className="p-1 rounded-lg text-slate-400 hover:bg-slate-100">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-500 block mb-1">Mã thiết bị (IP tự động)</label>
              <input
                type="text"
                value={deviceId}
                onChange={(e) => setDeviceId(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 font-mono text-xs font-bold text-slate-900 focus:outline-none focus:border-emerald-500"
              />
              <p className="text-[10px] text-slate-400 mt-1">Tự động nhận diện từ địa chỉ IP thiết bị mạng</p>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-500 block mb-1">Tần suất gửi tín hiệu (giây)</label>
              <input
                type="number"
                min="2"
                max="60"
                value={intervalSec}
                onChange={(e) => setIntervalSec(Math.max(2, Number(e.target.value) || 5))}
                className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 font-mono text-xs font-bold text-slate-900 focus:outline-none focus:border-emerald-500"
              />
              <p className="text-[10px] text-slate-400 mt-1">Khuyến nghị: 2 đến 5 giây để vẽ lộ trình thời gian thực</p>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-500 block mb-1">URL máy chủ nhận tín hiệu (Server URL)</label>
              <div className="flex items-center gap-1.5 p-2 rounded-xl bg-slate-50 border border-slate-200">
                <input
                  type="text"
                  value={serverUrl}
                  onChange={(e) => setServerUrl(e.target.value)}
                  className="flex-1 bg-transparent font-mono text-xs text-sky-700 font-bold focus:outline-none"
                />
                <button
                  onClick={() => handleCopy(`${window.location.origin}${serverUrl}`)}
                  className="p-1.5 rounded-lg text-emerald-600 hover:bg-emerald-50"
                  title="Sao chép"
                >
                  {copiedUrl ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setShowSettings(false)}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-bold text-xs hover:bg-slate-50"
              >
                Hủy
              </button>
              <button
                onClick={() => {
                  localStorage.setItem('smartbin_device_id', deviceId.trim());
                  localStorage.setItem('smartbin_server_url', serverUrl.trim());
                  localStorage.setItem('smartbin_interval', intervalSec.toString());
                  setShowSettings(false);
                  showToast('Đã lưu cấu hình thiết bị thành công!', 'success');
                  startTracking();
                }}
                className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md shadow-emerald-600/20"
              >
                Lưu cấu hình
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Logs Modal */}
      {showLogs && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-5 shadow-2xl border border-slate-200 flex flex-col max-h-[80vh]">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <History className="w-4 h-4 text-slate-500" />
                <h3 className="font-extrabold text-slate-900 text-base">Nhật ký truyền tin ({logs.length})</h3>
              </div>
              <button onClick={() => setShowLogs(false)} className="p-1 rounded-lg text-slate-400 hover:bg-slate-100">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto py-3 space-y-2 pr-1">
              {logs.length === 0 ? (
                <p className="text-center text-xs text-slate-400 py-8">Chưa có gói tin nào được ghi nhận.</p>
              ) : (
                logs.map((log) => (
                  <div
                    key={log.id}
                    className={`p-2.5 rounded-xl border text-xs ${
                      log.success
                        ? 'bg-slate-50 border-slate-200 text-slate-700'
                        : 'bg-red-50 border-red-200 text-red-800'
                    }`}
                  >
                    <div className="flex items-center justify-between text-[10px] font-bold text-slate-400 mb-0.5">
                      <span>{log.time}</span>
                      <span className={log.success ? 'text-emerald-600' : 'text-red-600'}>
                        {log.success ? '✓ ĐÃ GỬI' : '✗ LỖI'}
                      </span>
                    </div>
                    <p className="font-mono text-[11px] leading-relaxed">{log.text}</p>
                  </div>
                ))
              )}
            </div>

            <button
              onClick={() => setShowLogs(false)}
              className="w-full mt-2 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs"
            >
              Đóng
            </button>
          </div>
        </div>
      )}

      {/* SOS Success Modal */}
      {showSosModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-5 shadow-2xl border-2 border-red-500 space-y-4">
            <div className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="w-6 h-6 fill-red-600 text-white" />
              <h3 className="font-extrabold text-base uppercase">ĐÃ PHÁT TÍN HIỆU SOS!</h3>
            </div>
            <p className="text-xs text-slate-600 font-medium leading-relaxed">
              Tín hiệu cấp cứu khẩn cấp từ phương tiện <strong>{deviceId}</strong> đã được chuyển tiếp ưu tiên về trung tâm điều hành.
            </p>
            <div className="p-3 rounded-xl bg-red-50 border border-red-100 text-[11px] text-red-800 space-y-1 font-semibold">
              <p>• Âm thanh báo động đã kích hoạt tại phòng điều phối.</p>
              <p>• Toạ độ GPS và lộ trình hiện trường đã được ghim ưu tiên.</p>
            </div>
            <button
              onClick={() => setShowSosModal(false)}
              className="w-full py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-extrabold text-xs shadow-lg shadow-red-600/30"
            >
              Đã hiểu & Tiếp tục
            </button>
          </div>
        </div>
      )}

      {/* Floating Toast Notification */}
      {toast && (
        <div className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-50 px-4 py-2.5 rounded-2xl shadow-xl border text-xs font-bold flex items-center gap-2 transition-all ${
          toast.type === 'success'
            ? 'bg-emerald-900 text-white border-emerald-700'
            : toast.type === 'error'
            ? 'bg-red-900 text-white border-red-700'
            : 'bg-slate-900 text-white border-slate-700'
        }`}>
          {toast.type === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
          {toast.type === 'error' && <AlertTriangle className="w-4 h-4 text-red-400" />}
          <span>{toast.message}</span>
        </div>
      )}
    </div>
  );
}

import dayjs from 'dayjs';
import { useState, useMemo } from 'react';
import { useSelector } from 'react-redux';
import {
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  useTheme,
  Box,
  Typography,
  Card,
  CardContent,
  Chip,
} from '@mui/material';
import {
  Speed as SpeedIcon,
  Timeline as TimelineIcon,
  Route as RouteIcon,
  GpsFixed as GpsFixedIcon,
  BatteryChargingFull as BatteryIcon,
  Delete as WasteIcon,
  Thermostat as TempIcon,
  Height as AltitudeIcon,
  DirectionsCar as CarIcon,
} from '@mui/icons-material';
import {
  Brush,
  CartesianGrid,
  Line,
  LineChart,
  Area,
  AreaChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  Legend,
  ReferenceLine,
} from 'recharts';
import ReportFilter from './components/ReportFilter';
import { formatTime } from '../common/util/formatter';
import { useTranslation } from '../common/components/LocalizationProvider';
import PageLayout from '../common/components/PageLayout';
import ReportsMenu from './components/ReportsMenu';
import usePositionAttributes from '../common/attributes/usePositionAttributes';
import { useCatchCallback } from '../reactHelper';
import { useAttributePreference } from '../common/util/preferences';
import {
  altitudeFromMeters,
  distanceFromMeters,
  speedFromKnots,
} from '../common/util/converter';
import useReportStyles from './common/useReportStyles';
import fetchOrThrow from '../common/util/fetchOrThrow';

const DEVICE_COLORS = {
  13: '#1d4ed8', // Blue - Xe thu gom 06
  12: '#059669', // Emerald - Xe ép rác 03
  16: '#d97706', // Amber - Xe tuần tra 07
};
const FALLBACK_PALETTE = ['#1d4ed8', '#059669', '#d97706', '#6366f1', '#ec4899', '#06b6d4'];

const METRIC_DEFINITIONS = [
  { id: 'speed', label: 'Vận tốc (km/h)', icon: <SpeedIcon fontSize="small" />, unit: ' km/h', color: '#1d4ed8' },
  { id: 'batteryLevel', label: 'Mức pin IoT (%)', icon: <BatteryIcon fontSize="small" />, unit: '%', color: '#059669' },
  { id: 'wasteLevel', label: 'Dung tích rác (%)', icon: <WasteIcon fontSize="small" />, unit: '%', color: '#7c3aed' },
  { id: 'temp', label: 'Nhiệt độ máy (°C)', icon: <TempIcon fontSize="small" />, unit: '°C', color: '#dc2626' },
  { id: 'altitude', label: 'Độ cao (m)', icon: <AltitudeIcon fontSize="small" />, unit: ' m', color: '#0891b2' },
];

const ChartReportPage = () => {
  const { classes } = useReportStyles();
  const theme = useTheme();
  const t = useTranslation();

  const devices = useSelector((state) => state.devices.items);
  const positionAttributes = usePositionAttributes(t);

  const speedUnit = useAttributePreference('speedUnit');
  const altitudeUnit = useAttributePreference('altitudeUnit');
  const distanceUnit = useAttributePreference('distanceUnit');

  const [rawPositions, setRawPositions] = useState([]);
  const [selectedDeviceTab, setSelectedDeviceTab] = useState('all');
  const [activeMetric, setActiveMetric] = useState('speed');
  const [timeType, setTimeType] = useState('fixTime');

  // Load positions from API
  const onShow = useCatchCallback(
    async ({ deviceIds, from, to }) => {
      const query = new URLSearchParams({ from, to });
      deviceIds.forEach((deviceId) => query.append('deviceId', deviceId));
      const response = await fetchOrThrow(`/api/reports/route?${query.toString()}`, {
        headers: { Accept: 'application/json' },
      });
      const positions = await response.json();
      setRawPositions(positions);
      if (deviceIds.length === 1 && deviceIds[0] !== 'all') {
        setSelectedDeviceTab(deviceIds[0]);
      } else {
        setSelectedDeviceTab('all');
      }
    },
    [],
  );

  // Distinct devices present in results
  const availableDevices = useMemo(() => {
    const devMap = new Map();
    rawPositions.forEach((p) => {
      if (!devMap.has(p.deviceId)) {
        devMap.set(p.deviceId, {
          id: p.deviceId,
          name: devices[p.deviceId]?.name || `Phương tiện ${p.deviceId}`,
          color: DEVICE_COLORS[p.deviceId] || FALLBACK_PALETTE[devMap.size % FALLBACK_PALETTE.length],
        });
      }
    });
    return Array.from(devMap.values());
  }, [rawPositions, devices]);

  // Positions filtered by current active device tab
  const activePositions = useMemo(() => {
    if (selectedDeviceTab === 'all') {
      return rawPositions;
    }
    return rawPositions.filter((p) => p.deviceId === selectedDeviceTab);
  }, [rawPositions, selectedDeviceTab]);

  // Metric value helper for a single position
  const getMetricValue = (pos, metricKey) => {
    const attrs = pos.attributes || {};
    switch (metricKey) {
      case 'speed':
        return parseFloat(speedFromKnots(pos.speed || 0, speedUnit).toFixed(1));
      case 'batteryLevel':
        return attrs.batteryLevel != null ? Number(attrs.batteryLevel) : null;
      case 'wasteLevel':
        return attrs.wasteLevel != null ? Number(attrs.wasteLevel) : null;
      case 'temp':
        return attrs.temp != null ? Number(attrs.temp) : null;
      case 'altitude':
        return parseFloat(altitudeFromMeters(pos.altitude || 0, altitudeUnit).toFixed(1));
      default:
        return attrs[metricKey] != null ? Number(attrs[metricKey]) : null;
    }
  };

  // KPI Summary Metrics Calculation
  const kpiMetrics = useMemo(() => {
    if (!activePositions.length) {
      return { maxSpeed: 0, avgSpeed: 0, totalDistKm: 0, pointCount: 0 };
    }
    let maxSpd = 0;
    let sumMovingSpd = 0;
    let movingCount = 0;
    let totalMeters = 0;

    activePositions.forEach((p) => {
      const spd = speedFromKnots(p.speed || 0, speedUnit);
      if (spd > maxSpd) maxSpd = spd;
      if (spd > 1.0) {
        sumMovingSpd += spd;
        movingCount += 1;
      }
      if (p.attributes?.distance) {
        totalMeters += p.attributes.distance;
      }
    });

    const avgSpd = movingCount > 0 ? sumMovingSpd / movingCount : 0;
    const distKm = totalMeters > 0 ? totalMeters / 1000.0 : (maxSpd > 0 ? (avgSpd * 1.5) : 0);

    return {
      maxSpeed: maxSpd.toFixed(1),
      avgSpeed: avgSpd.toFixed(1),
      totalDistKm: distKm.toFixed(1),
      pointCount: activePositions.length,
    };
  }, [activePositions, speedUnit]);

  // Prepare chart series data
  const chartData = useMemo(() => {
    if (!rawPositions.length) return [];

    if (selectedDeviceTab !== 'all') {
      // Single device trajectory
      return activePositions.map((pos) => ({
        time: dayjs(pos[timeType] || pos.fixTime).valueOf(),
        value: getMetricValue(pos, activeMetric),
        speed: speedFromKnots(pos.speed || 0, speedUnit).toFixed(1),
        address: pos.address || '',
        deviceId: pos.deviceId,
      }));
    }

    // Multiple devices comparison: map each device to its own dedicated key to avoid zig-zag lines!
    return rawPositions.map((pos) => ({
      time: dayjs(pos[timeType] || pos.fixTime).valueOf(),
      [`val_${pos.deviceId}`]: getMetricValue(pos, activeMetric),
      address: pos.address || '',
      deviceId: pos.deviceId,
    }));
  }, [rawPositions, activePositions, selectedDeviceTab, activeMetric, timeType, speedUnit]);

  // Current metric config
  const currentMetricDef = METRIC_DEFINITIONS.find((m) => m.id === activeMetric) || METRIC_DEFINITIONS[0];

  // Tooltip formatter
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const p = payload[0];
      const address = p.payload?.address;
      return (
        <Box
          sx={{
            backgroundColor: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(8px)',
            border: '1px solid #e2e8f0',
            borderRadius: '12px',
            p: 1.5,
            boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)',
            minWidth: 200,
          }}
        >
          <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 600, display: 'block', mb: 0.5 }}>
            {formatTime(label, 'seconds')}
          </Typography>
          {payload.map((entry) => {
            if (entry.value == null) return null;
            return (
              <Box key={entry.name || entry.dataKey} sx={{ display: 'flex', alignItems: 'center', gap: 1, my: 0.5 }}>
                <Box sx={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: entry.color }} />
                <Typography variant="body2" sx={{ fontWeight: 600, color: '#0f172a' }}>
                  {entry.name || t('reportChart')}:
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 700, color: entry.color }}>
                  {entry.value} {currentMetricDef.unit}
                </Typography>
              </Box>
            );
          })}
          {address && (
            <Typography variant="caption" sx={{ color: '#475569', mt: 1, display: 'block', borderTop: '1px solid #f1f5f9', pt: 0.5 }}>
              📍 {address}
            </Typography>
          )}
        </Box>
      );
    }
    return null;
  };

  return (
    <PageLayout menu={<ReportsMenu />} breadcrumbs={['reportTitle', 'reportChart']}>
      {/* 1. Filter bar */}
      <ReportFilter onShow={onShow} onExport={() => {}} deviceType="multiple" formats={[]}>
        <div className={classes.filterItem}>
          <FormControl fullWidth size="small">
            <InputLabel>{t('reportTimeType')}</InputLabel>
            <Select
              label={t('reportTimeType')}
              value={timeType}
              onChange={(e) => setTimeType(e.target.value)}
            >
              <MenuItem value="fixTime">Thời gian chốt GPS (Fix Time)</MenuItem>
              <MenuItem value="deviceTime">Thời gian thiết bị (Device Time)</MenuItem>
              <MenuItem value="serverTime">Thời gian máy chủ (Server Time)</MenuItem>
            </Select>
          </FormControl>
        </div>
      </ReportFilter>

      {/* 2. Loaded state with KPI cards and interactive chart */}
      {rawPositions.length > 0 ? (
        <Box sx={{ p: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
          {/* KPI Summary Cards */}
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: 'repeat(4, 1fr)' },
              gap: 2,
            }}
          >
            <Card variant="outlined" sx={{ borderRadius: '12px', borderColor: '#e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
              <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                    Vận tốc cao nhất
                  </Typography>
                  <Box sx={{ p: 0.8, borderRadius: '8px', backgroundColor: '#eff6ff', color: '#1d4ed8' }}>
                    <SpeedIcon fontSize="small" />
                  </Box>
                </Box>
                <Typography variant="h5" sx={{ fontWeight: 700, color: '#0f172a', mt: 0.5 }}>
                  {kpiMetrics.maxSpeed} <Typography component="span" variant="body2" sx={{ color: '#64748b' }}>km/h</Typography>
                </Typography>
                <Typography variant="caption" sx={{ color: '#059669', fontWeight: 500 }}>
                  Đỉnh tốc độ ghi nhận
                </Typography>
              </CardContent>
            </Card>

            <Card variant="outlined" sx={{ borderRadius: '12px', borderColor: '#e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
              <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                    Vận tốc trung bình
                  </Typography>
                  <Box sx={{ p: 0.8, borderRadius: '8px', backgroundColor: '#ecfdf5', color: '#059669' }}>
                    <TimelineIcon fontSize="small" />
                  </Box>
                </Box>
                <Typography variant="h5" sx={{ fontWeight: 700, color: '#0f172a', mt: 0.5 }}>
                  {kpiMetrics.avgSpeed} <Typography component="span" variant="body2" sx={{ color: '#64748b' }}>km/h</Typography>
                </Typography>
                <Typography variant="caption" sx={{ color: '#64748b' }}>
                  Khi xe lăn bánh
                </Typography>
              </CardContent>
            </Card>

            <Card variant="outlined" sx={{ borderRadius: '12px', borderColor: '#e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
              <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                    Quãng đường GPS
                  </Typography>
                  <Box sx={{ p: 0.8, borderRadius: '8px', backgroundColor: '#fef3c7', color: '#d97706' }}>
                    <RouteIcon fontSize="small" />
                  </Box>
                </Box>
                <Typography variant="h5" sx={{ fontWeight: 700, color: '#0f172a', mt: 0.5 }}>
                  {kpiMetrics.totalDistKm} <Typography component="span" variant="body2" sx={{ color: '#64748b' }}>km</Typography>
                </Typography>
                <Typography variant="caption" sx={{ color: '#64748b' }}>
                  Hành trình di chuyển
                </Typography>
              </CardContent>
            </Card>

            <Card variant="outlined" sx={{ borderRadius: '12px', borderColor: '#e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
              <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                    Dữ liệu chốt vị trí
                  </Typography>
                  <Box sx={{ p: 0.8, borderRadius: '8px', backgroundColor: '#f5f3ff', color: '#7c3aed' }}>
                    <GpsFixedIcon fontSize="small" />
                  </Box>
                </Box>
                <Typography variant="h5" sx={{ fontWeight: 700, color: '#0f172a', mt: 0.5 }}>
                  {kpiMetrics.pointCount.toLocaleString()} <Typography component="span" variant="body2" sx={{ color: '#64748b' }}>điểm</Typography>
                </Typography>
                <Typography variant="caption" sx={{ color: '#059669', fontWeight: 500 }}>
                  Độ phân giải cao
                </Typography>
              </CardContent>
            </Card>
          </Box>

          {/* Controls Bar: Vehicle Tabs & Metric Selector */}
          <Card variant="outlined" sx={{ borderRadius: '12px', borderColor: '#e2e8f0', p: 1.5 }}>
            <Box
              sx={{
                display: 'flex',
                flexDirection: { xs: 'column', md: 'row' },
                justifyContent: 'space-between',
                alignItems: { xs: 'flex-start', md: 'center' },
                gap: 1.5,
              }}
            >
              {/* Vehicle Selection Chips */}
              <Box sx={{ display: 'flex', flexDirection: 'row', flexWrap: 'wrap', gap: 1 }}>
                {availableDevices.length > 1 && (
                  <Chip
                    icon={<CarIcon fontSize="small" />}
                    label={`Tất cả phương tiện (${availableDevices.length})`}
                    clickable
                    color={selectedDeviceTab === 'all' ? 'primary' : 'default'}
                    variant={selectedDeviceTab === 'all' ? 'filled' : 'outlined'}
                    onClick={() => setSelectedDeviceTab('all')}
                    sx={{ fontWeight: 600, borderRadius: '8px' }}
                  />
                )}
                {availableDevices.map((dev) => (
                  <Chip
                    key={dev.id}
                    label={dev.name}
                    clickable
                    variant={selectedDeviceTab === dev.id ? 'filled' : 'outlined'}
                    onClick={() => setSelectedDeviceTab(dev.id)}
                    sx={{
                      fontWeight: 600,
                      borderRadius: '8px',
                      backgroundColor: selectedDeviceTab === dev.id ? dev.color : 'transparent',
                      color: selectedDeviceTab === dev.id ? '#ffffff' : '#475569',
                      borderColor: dev.color,
                      '&:hover': {
                        backgroundColor: selectedDeviceTab === dev.id ? dev.color : '#f1f5f9',
                      },
                    }}
                  />
                ))}
              </Box>

              {/* Metric Type Chips */}
              <Box sx={{ display: 'flex', flexDirection: 'row', flexWrap: 'wrap', gap: 1 }}>
                {METRIC_DEFINITIONS.map((metric) => {
                  const isActive = activeMetric === metric.id;
                  return (
                    <Chip
                      key={metric.id}
                      icon={metric.icon}
                      label={metric.label}
                      clickable
                      onClick={() => setActiveMetric(metric.id)}
                      variant={isActive ? 'filled' : 'outlined'}
                      sx={{
                        fontWeight: 600,
                        borderRadius: '8px',
                        backgroundColor: isActive ? '#1d4ed8' : 'transparent',
                        color: isActive ? '#ffffff' : '#475569',
                        borderColor: '#e2e8f0',
                      }}
                    />
                  );
                })}
              </Box>
            </Box>
          </Card>

          {/* Main Chart Canvas */}
          <Card
            variant="outlined"
            sx={{
              borderRadius: '16px',
              borderColor: '#e2e8f0',
              p: 2,
              backgroundColor: '#ffffff',
              boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)',
            }}
          >
            <Box sx={{ width: '100%', height: 440 }}>
              <ResponsiveContainer>
                {selectedDeviceTab !== 'all' ? (
                  /* Single Device Area Chart with smooth gradient fill */
                  <AreaChart data={chartData} margin={{ top: 15, right: 30, left: 10, bottom: 15 }}>
                    <defs>
                      <linearGradient id="metricGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={currentMetricDef.color} stopOpacity={0.25} />
                        <stop offset="95%" stopColor={currentMetricDef.color} stopOpacity={0.01} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid stroke="#f1f5f9" strokeDasharray="3 3" />
                    <XAxis
                      stroke="#94a3b8"
                      dataKey="time"
                      type="number"
                      domain={['dataMin', 'dataMax']}
                      scale="time"
                      tickFormatter={(val) => formatTime(val, 'time')}
                      tick={{ fontSize: 12 }}
                    />
                    <YAxis
                      stroke="#94a3b8"
                      type="number"
                      tick={{ fontSize: 12 }}
                      tickFormatter={(val) => `${val}${currentMetricDef.unit}`}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    {activeMetric === 'speed' && (
                      <ReferenceLine
                        y={50}
                        stroke="#ef4444"
                        strokeDasharray="4 4"
                        label={{ value: 'Giới hạn tốc độ đô thị (50 km/h)', fill: '#ef4444', fontSize: 12, position: 'top' }}
                      />
                    )}
                    <Brush
                      dataKey="time"
                      height={32}
                      stroke="#cbd5e1"
                      fill="#f8fafc"
                      tickFormatter={() => ''}
                    />
                    <Area
                      type="monotone"
                      dataKey="value"
                      name={currentMetricDef.label}
                      stroke={currentMetricDef.color}
                      strokeWidth={2.5}
                      fill="url(#metricGradient)"
                      activeDot={{ r: 6, stroke: '#ffffff', strokeWidth: 2 }}
                    />
                  </AreaChart>
                ) : (
                  /* Multi-Device Comparison Line Chart */
                  <LineChart data={chartData} margin={{ top: 15, right: 30, left: 10, bottom: 15 }}>
                    <CartesianGrid stroke="#f1f5f9" strokeDasharray="3 3" />
                    <XAxis
                      stroke="#94a3b8"
                      dataKey="time"
                      type="number"
                      domain={['dataMin', 'dataMax']}
                      scale="time"
                      tickFormatter={(val) => formatTime(val, 'time')}
                      tick={{ fontSize: 12 }}
                    />
                    <YAxis
                      stroke="#94a3b8"
                      type="number"
                      tick={{ fontSize: 12 }}
                      tickFormatter={(val) => `${val}${currentMetricDef.unit}`}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend
                      verticalAlign="top"
                      height={36}
                      wrapperStyle={{ paddingBottom: '8px' }}
                    />
                    {activeMetric === 'speed' && (
                      <ReferenceLine
                        y={50}
                        stroke="#ef4444"
                        strokeDasharray="4 4"
                        label={{ value: 'Giới hạn tốc độ đô thị (50 km/h)', fill: '#ef4444', fontSize: 12, position: 'top' }}
                      />
                    )}
                    <Brush
                      dataKey="time"
                      height={32}
                      stroke="#cbd5e1"
                      fill="#f8fafc"
                      tickFormatter={() => ''}
                    />
                    {availableDevices.map((dev) => (
                      <Line
                        key={dev.id}
                        type="monotone"
                        dataKey={`val_${dev.id}`}
                        name={dev.name}
                        stroke={dev.color}
                        strokeWidth={2.5}
                        dot={false}
                        connectNulls={true}
                        activeDot={{ r: 6 }}
                      />
                    ))}
                  </LineChart>
                )}
              </ResponsiveContainer>
            </Box>
          </Card>
        </Box>
      ) : (
        /* Empty State */
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            py: 12,
            px: 2,
            textAlign: 'center',
          }}
        >
          <Box
            sx={{
              width: 72,
              height: 72,
              borderRadius: '50%',
              backgroundColor: '#eff6ff',
              color: '#1d4ed8',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              mb: 2,
            }}
          >
            <TimelineIcon sx={{ fontSize: 36 }} />
          </Box>
          <Typography variant="h6" sx={{ fontWeight: 700, color: '#0f172a', mb: 1 }}>
            Chưa có dữ liệu biểu đồ phân tích
          </Typography>
          <Typography variant="body2" sx={{ color: '#64748b', maxWidth: 460 }}>
            Vui lòng chọn phương tiện và khoảng thời gian ở thanh lọc bên trên, sau đó nhấn{' '}
            <strong style={{ color: '#1d4ed8' }}>"Xem báo cáo"</strong> để hiển thị đồ thị viễn thông và các chỉ số đo lường.
          </Typography>
        </Box>
      )}
    </PageLayout>
  );
};

export default ChartReportPage;

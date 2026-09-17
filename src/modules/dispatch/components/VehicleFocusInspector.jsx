import {
  Box,
  Typography,
  Paper,
  Chip,
  Button,
  IconButton,
  Tooltip,
  LinearProgress,
  Stack,
  Avatar,
  Divider,
} from '@mui/material';
import MyLocationIcon from '@mui/icons-material/MyLocation';
import CloseIcon from '@mui/icons-material/Close';
import ArrowBackIosNewIcon from '@mui/icons-material/ArrowBackIosNew';
import ArrowForwardIosIcon from '@mui/icons-material/ArrowForwardIos';
import TrackChangesIcon from '@mui/icons-material/TrackChanges';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import FlagIcon from '@mui/icons-material/Flag';
import FilterAltIcon from '@mui/icons-material/FilterAlt';
import AutoModeIcon from '@mui/icons-material/AutoMode';

const VehicleFocusInspector = ({
  vehicles = [],
  focusedVehicleId,
  isTrackingVehicle,
  onSelectVehicle,
  onToggleTracking,
  onFlyToVehicle,
  onFlyToStop,
  onSendToDepot,
  onRunAIPlan,
  onTriggerSos,
  bins = [],
  depot,
  depots = [],
  activeOptimizationReport = null,
}) => {
  const currentVehicle = vehicles.find((v) => v.vehicleId === focusedVehicleId);
  const currentIndex = vehicles.findIndex((v) => v.vehicleId === focusedVehicleId);

  // Chuyển sang xe trước / xe kế tiếp
  const handlePrevVehicle = () => {
    if (vehicles.length === 0) return;
    const nextIdx = (currentIndex - 1 + vehicles.length) % vehicles.length;
    onSelectVehicle(vehicles[nextIdx].vehicleId);
  };

  const handleNextVehicle = () => {
    if (vehicles.length === 0) return;
    const nextIdx = (currentIndex + 1) % vehicles.length;
    onSelectVehicle(vehicles[nextIdx].vehicleId);
  };

  if (!currentVehicle) {
    return null;
  }

  const loadPercent = Math.round(
    (currentVehicle.currentLoadKg / currentVehicle.maxCapacityKg) * 100,
  );

  let statusLabel = 'Đang rảnh rỗi';
  let statusColor = 'default';
  if (currentVehicle.status === 'MOVING_TO_BIN') {
    statusLabel = `Đang tới ${currentVehicle.targetBinId}`;
    statusColor = 'info';
  } else if (currentVehicle.status === 'COLLECTING') {
    statusLabel = 'Đang nâng thùng bốc dỡ...';
    statusColor = 'warning';
  } else if (currentVehicle.status === 'MOVING_TO_DEPOT') {
    statusLabel = 'Đang về trạm dỡ rác (Depot)';
    statusColor = 'secondary';
  } else if (currentVehicle.status === 'UNLOADING') {
    statusLabel = 'Đang xả rác tại trạm...';
    statusColor = 'success';
  }

  // Danh sách các điểm dừng của xe này
  const stopsList = [];
  if (currentVehicle.targetBinId) {
    const targetBin = bins.find((b) => b.id === currentVehicle.targetBinId);
    stopsList.push({
      binId: currentVehicle.targetBinId,
      name: targetBin ? targetBin.name : currentVehicle.targetBinId,
      lat: currentVehicle.targetCoords?.lat || targetBin?.lat,
      lng: currentVehicle.targetCoords?.lng || targetBin?.lng,
      fill: targetBin ? Math.round(targetBin.currentFillPercent) : null,
      isCurrent: true,
      stopNumber: targetBin?.assignedStopNumber || 1,
    });
  }

  if (currentVehicle.waypoints && currentVehicle.waypoints.length > 0) {
    currentVehicle.waypoints.forEach((wp, idx) => {
      const wpBin = bins.find((b) => b.id === wp.binId);
      stopsList.push({
        binId: wp.binId,
        name: wpBin ? wpBin.name : wp.binId,
        lat: wp.lat,
        lng: wp.lng,
        fill: wpBin ? Math.round(wpBin.currentFillPercent) : null,
        isCurrent: false,
        stopNumber: wpBin?.assignedStopNumber || idx + 2,
      });
    });
  }

  // Xác định trạm dỡ rác mục tiêu của xe này (ưu tiên theo tuyến phân công hoặc trạm gần nhất)
  const activeDepot =
    (currentVehicle.targetDepotId && depots.find((d) => d.id === currentVehicle.targetDepotId)) ||
    depot;

  // Khi xe đang trên đường về Depot hoặc đang xả rác, hiển thị Trạm Depot là điểm đến
  if (currentVehicle.status === 'MOVING_TO_DEPOT' || currentVehicle.status === 'UNLOADING') {
    stopsList.push({
      binId: activeDepot?.shortName || activeDepot?.name || 'Trạm dỡ rác Depot',
      name: `${activeDepot?.name || 'Điểm dỡ chất thải'} (Đang ép xả ${Math.round(currentVehicle.currentLoadKg)} kg rác)`,
      lat: currentVehicle.targetCoords?.lat || activeDepot?.lat || 10.7615,
      lng: currentVehicle.targetCoords?.lng || activeDepot?.lng || 106.6912,
      fill: null,
      isCurrent: true,
      isDepot: true,
      stopNumber: '♻️',
    });
  }

  // Bổ sung các thùng rác được gán trực tiếp cho xe này nếu chưa có trong stopsList
  bins.forEach((b) => {
    if (
      b.assignedVehicleId === currentVehicle.vehicleId &&
      !stopsList.some((s) => s.binId === b.id)
    ) {
      stopsList.push({
        binId: b.id,
        name: b.name || b.id,
        lat: b.lat,
        lng: b.lng,
        fill: Math.round(b.currentFillPercent),
        isCurrent: false,
        stopNumber: b.assignedStopNumber || stopsList.length + 1,
      });
    }
  });

  // Bổ sung thêm từ báo cáo tối ưu hóa đang kích hoạt (nếu có)
  if (activeOptimizationReport?.vehicleRoutes) {
    const vRoute = activeOptimizationReport.vehicleRoutes.find(
      (r) => r.vehicleId === currentVehicle.vehicleId,
    );
    if (vRoute?.stops) {
      vRoute.stops.forEach((s) => {
        if (s.binId && !stopsList.some((item) => item.binId === s.binId)) {
          const bObj = bins.find((b) => b.id === s.binId);
          if (!bObj || bObj.status !== 'NORMAL' || bObj.currentFillPercent > 0) {
            stopsList.push({
              binId: s.binId,
              name: bObj ? bObj.name : s.binId,
              lat: s.lat,
              lng: s.lng,
              fill: bObj ? Math.round(bObj.currentFillPercent) : null,
              isCurrent: false,
              stopNumber: s.stopIndex || stopsList.length + 1,
            });
          }
        }
      });
    }
  }

  stopsList.sort((a, b) => (a.stopNumber || 0) - (b.stopNumber || 0));

  return (
    <Paper
      elevation={8}
      sx={{
        position: 'absolute',
        bottom: 24,
        right: 24,
        zIndex: 15,
        width: { xs: 290, sm: 360 },
        borderRadius: 3.5,
        backgroundColor: 'rgba(255, 255, 255, 0.97)',
        backdropFilter: 'blur(12px)',
        border: `2.5px solid ${currentVehicle.color}`,
        overflow: 'hidden',
        boxShadow: `0 10px 30px rgba(0,0,0,0.22), 0 0 15px ${currentVehicle.color}40`,
      }}
    >
      {/* Header Xe & Tài xế */}
      <Box
        sx={{
          p: 1.8,
          backgroundColor: '#0f172a',
          color: '#ffffff',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          borderBottom: `3px solid ${currentVehicle.color}`,
        }}
      >
        <Stack direction="row" spacing={1.2} alignItems="center">
          <Avatar
            sx={{
              bgcolor: currentVehicle.color,
              width: 34,
              height: 34,
              border: '2px solid #ffffff',
            }}
          >
            <LocalShippingIcon sx={{ fontSize: 20 }} />
          </Avatar>
          <Box>
            <Typography variant="subtitle2" sx={{ fontWeight: 900, lineHeight: 1.2 }}>
              {currentVehicle.vehicleId} • {currentVehicle.driverName}
            </Typography>
            <Typography variant="caption" sx={{ color: '#94a3b8', fontSize: '0.72rem' }}>
              Mã TX: {currentVehicle.driverId || 'DRV'} • Vận tốc: {currentVehicle.speedKmh || 40}{' '}
              km/h
            </Typography>
          </Box>
        </Stack>

        <IconButton
          size="small"
          onClick={() => onSelectVehicle(null)}
          title="Đóng bảng thanh tra (Hiện lại toàn bộ)"
          sx={{
            color: '#94a3b8',
            '&:hover': { color: '#ffffff', backgroundColor: 'rgba(255,255,255,0.1)' },
          }}
        >
          <CloseIcon fontSize="small" />
        </IconButton>
      </Box>

      {/* Thông báo chế độ lọc riêng cho tài xế */}
      <Box sx={{ px: 2, pt: 1.2, pb: 0.5 }}>
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 1,
            p: 1,
            borderRadius: 2,
            bgcolor: `${currentVehicle.color}15`,
            border: `1.5px solid ${currentVehicle.color}40`,
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8 }}>
            <FilterAltIcon sx={{ fontSize: 17, color: currentVehicle.color }} />
            <Typography
              variant="caption"
              sx={{ color: '#0f172a', fontWeight: 800, fontSize: '0.73rem', lineHeight: 1.3 }}
            >
              {stopsList.length > 0
                ? `Đã ẩn các xe & thùng khác • Hiện ${stopsList.length} thùng của tài xế này`
                : 'Đã ẩn xe khác • Tài xế hiện chưa có thùng rác'}
            </Typography>
          </Box>
          <Button
            size="small"
            variant="text"
            onClick={() => onSelectVehicle(null)}
            sx={{
              minWidth: 'auto',
              p: '2px 6px',
              fontSize: '0.68rem',
              fontWeight: 800,
              textTransform: 'none',
              color: '#475569',
              whiteSpace: 'nowrap',
            }}
          >
            Hiện tất cả
          </Button>
        </Box>
      </Box>

      {/* Điều hướng chuyển đổi nhanh giữa các xe */}
      <Box
        sx={{
          px: 2,
          py: 0.8,
          backgroundColor: '#f8fafc',
          borderBottom: '1px solid #e2e8f0',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <Button
          size="small"
          startIcon={<ArrowBackIosNewIcon sx={{ fontSize: '10px !important' }} />}
          onClick={handlePrevVehicle}
          sx={{ textTransform: 'none', fontWeight: 800, fontSize: '0.72rem', color: '#475569' }}
        >
          Xe trước
        </Button>

        <Typography variant="caption" sx={{ fontWeight: 800, color: '#64748b' }}>
          Xe {currentIndex + 1} / {vehicles.length}
        </Typography>

        <Button
          size="small"
          endIcon={<ArrowForwardIosIcon sx={{ fontSize: '10px !important' }} />}
          onClick={handleNextVehicle}
          sx={{ textTransform: 'none', fontWeight: 800, fontSize: '0.72rem', color: '#475569' }}
        >
          Xe sau
        </Button>
      </Box>

      {/* Nội dung chi tiết xe */}
      <Box sx={{ p: 2 }}>
        {/* Trạng thái & Tải trọng */}
        <Box sx={{ mb: 2 }}>
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              mb: 0.8,
            }}
          >
            <Typography variant="caption" sx={{ fontWeight: 800, color: '#475569' }}>
              Tải trọng rác trên xe:
            </Typography>
            <Chip
              label={statusLabel}
              size="small"
              color={statusColor}
              sx={{ fontWeight: 800, height: 22, fontSize: '0.7rem' }}
            />
          </Box>

          <LinearProgress
            variant="determinate"
            value={Math.min(100, loadPercent)}
            sx={{
              height: 10,
              borderRadius: 5,
              backgroundColor: '#e2e8f0',
              '& .MuiLinearProgress-bar': {
                backgroundColor:
                  loadPercent >= 85
                    ? '#ef4444'
                    : loadPercent >= 50
                      ? '#f59e0b'
                      : currentVehicle.color,
                borderRadius: 5,
              },
            }}
          />

          <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 0.6 }}>
            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700 }}>
              {currentVehicle.currentLoadKg.toLocaleString()} /{' '}
              {currentVehicle.maxCapacityKg.toLocaleString()} kg
            </Typography>
            <Typography
              variant="caption"
              sx={{
                fontWeight: 900,
                color: loadPercent >= 85 ? '#ef4444' : loadPercent >= 50 ? '#d97706' : '#059669',
              }}
            >
              {loadPercent}% đầy
            </Typography>
          </Box>
        </Box>

        <Divider sx={{ my: 1.5 }} />

        {/* Danh sách Hành trình các Điểm Dừng của riêng tài xế này */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
          <Typography variant="caption" sx={{ fontWeight: 800, color: '#334155' }}>
            📍 THÙNG RÁC TÀI XẾ SẼ GOM ({stopsList.length}):
          </Typography>
          {stopsList.length > 0 && (
            <Chip
              label="Chỉ hiện trên map"
              size="small"
              sx={{
                height: 18,
                fontSize: '0.62rem',
                fontWeight: 800,
                bgcolor: '#e0f2fe',
                color: '#0369a1',
              }}
            />
          )}
        </Box>

        {stopsList.length === 0 ? (
          <Box
            sx={{
              p: 1.5,
              borderRadius: 2,
              backgroundColor: '#f8fafc',
              border: '1px dashed #cbd5e1',
              textAlign: 'center',
              mb: 1.5,
            }}
          >
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
              Tài xế hiện chưa có thùng rác nào được phân bổ (Đang rảnh rỗi).
            </Typography>
            {onRunAIPlan && (
              <Button
                variant="contained"
                size="small"
                color="primary"
                startIcon={<AutoModeIcon />}
                onClick={onRunAIPlan}
                sx={{
                  textTransform: 'none',
                  fontWeight: 800,
                  fontSize: '0.72rem',
                  borderRadius: 2,
                }}
              >
                🧠 Điều Phối Tuyến AI Ngay
              </Button>
            )}
          </Box>
        ) : (
          <Stack spacing={0.8} sx={{ mb: 1.5, maxHeight: 140, overflowY: 'auto' }}>
            {stopsList.map((stop, sIdx) => (
              <Box
                key={stop.binId || sIdx}
                onClick={() => onFlyToStop && onFlyToStop(stop.lng, stop.lat)}
                sx={{
                  p: 0.8,
                  borderRadius: 1.5,
                  backgroundColor: stop.isDepot
                    ? '#f5f3ff'
                    : stop.isCurrent
                      ? '#eff6ff'
                      : '#f8fafc',
                  border: stop.isDepot
                    ? '1.5px solid #8b5cf6'
                    : stop.isCurrent
                      ? '1.5px solid #3b82f6'
                      : '1px solid #e2e8f0',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  cursor: 'pointer',
                  '&:hover': { backgroundColor: '#e2e8f0' },
                }}
              >
                <Stack direction="row" spacing={1} alignItems="center">
                  <Box
                    sx={{
                      width: 22,
                      height: 22,
                      borderRadius: '50%',
                      backgroundColor: stop.isDepot
                        ? '#8b5cf6'
                        : stop.isCurrent
                          ? '#3b82f6'
                          : '#64748b',
                      color: '#ffffff',
                      fontSize: stop.isDepot ? '12px' : '10px',
                      fontWeight: 800,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    {stop.isDepot ? '♻️' : `#${stop.stopNumber}`}
                  </Box>
                  <Box>
                    <Typography variant="caption" sx={{ fontWeight: 800, display: 'block' }}>
                      {stop.binId}
                    </Typography>
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      sx={{ fontSize: '0.68rem' }}
                    >
                      {stop.name}
                    </Typography>
                  </Box>
                </Stack>

                {stop.isDepot ? (
                  <Chip
                    label="Xả Rác"
                    size="small"
                    color="secondary"
                    sx={{ height: 18, fontSize: '0.65rem', fontWeight: 800 }}
                  />
                ) : stop.fill !== null ? (
                  <Chip
                    label={`${stop.fill}%`}
                    size="small"
                    color={stop.fill >= 80 ? 'error' : 'warning'}
                    sx={{ height: 18, fontSize: '0.65rem', fontWeight: 800 }}
                  />
                ) : null}
              </Box>
            ))}

            {/* Trạm dỡ rác: Chỉ ghim đích về Depot khi xe đang về hoặc tải trọng cao >= 75% */}
            {currentVehicle.status === 'MOVING_TO_DEPOT' ||
            currentVehicle.status === 'UNLOADING' ||
            currentVehicle.currentLoadKg / currentVehicle.maxCapacityKg >= 0.75 ? (
              <Box
                onClick={() =>
                  onFlyToStop && activeDepot && onFlyToStop(activeDepot.lng, activeDepot.lat)
                }
                sx={{
                  p: 0.8,
                  borderRadius: 1.5,
                  backgroundColor: '#ecfdf5',
                  border: '1px solid #a7f3d0',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1,
                  cursor: 'pointer',
                }}
              >
                <FlagIcon sx={{ fontSize: 16, color: '#059669' }} />
                <Typography variant="caption" sx={{ fontWeight: 800, color: '#065f46' }}>
                  Đích dỡ rác: {activeDepot?.shortName || activeDepot?.name || 'Trạm dỡ rác Depot'}{' '}
                  ({Math.round(currentVehicle.currentLoadKg)} kg)
                </Typography>
              </Box>
            ) : (
              <Box
                sx={{
                  p: 0.8,
                  borderRadius: 1.5,
                  backgroundColor: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1,
                }}
              >
                <LocalShippingIcon sx={{ fontSize: 16, color: '#0284c7' }} />
                <Typography
                  variant="caption"
                  sx={{ fontWeight: 700, color: '#334155', fontSize: '0.68rem' }}
                >
                  Chế độ: Thu gom tích lũy (Tải:{' '}
                  {Math.round((currentVehicle.currentLoadKg / currentVehicle.maxCapacityKg) * 100)}%
                  - Ngưỡng xả: 75%)
                </Typography>
              </Box>
            )}
          </Stack>
        )}

        {/* Các nút Tác Vụ Xe */}
        <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
          <Tooltip
            title={isTrackingVehicle ? 'Tắt camera bám theo xe' : 'Khóa góc nhìn bám theo xe'}
          >
            <Button
              fullWidth
              variant={isTrackingVehicle ? 'contained' : 'outlined'}
              size="small"
              color={isTrackingVehicle ? 'warning' : 'inherit'}
              startIcon={<TrackChangesIcon />}
              onClick={onToggleTracking}
              sx={{ textTransform: 'none', fontWeight: 800, fontSize: '0.72rem' }}
            >
              {isTrackingVehicle ? 'Đang bám xe' : 'Bám theo xe'}
            </Button>
          </Tooltip>

          <Tooltip title="Bay camera ngay tới vị trí xe">
            <IconButton
              size="small"
              onClick={() =>
                onFlyToVehicle && onFlyToVehicle(currentVehicle.lng, currentVehicle.lat)
              }
              sx={{
                border: '1px solid #cbd5e1',
                borderRadius: 1.5,
                color: '#0284c7',
                '&:hover': { backgroundColor: '#f0f9ff' },
              }}
            >
              <MyLocationIcon fontSize="small" />
            </IconButton>
          </Tooltip>

          <Tooltip title="Cưỡng chế xe quay về Depot để xả rác ngay lập tức">
            <Button
              variant="outlined"
              size="small"
              color="secondary"
              onClick={() => onSendToDepot && onSendToDepot(currentVehicle.vehicleId)}
              disabled={
                currentVehicle.status === 'MOVING_TO_DEPOT' || currentVehicle.status === 'UNLOADING'
              }
              sx={{
                textTransform: 'none',
                fontWeight: 800,
                fontSize: '0.72rem',
                whiteSpace: 'nowrap',
              }}
            >
              Về Depot
            </Button>
          </Tooltip>
        </Stack>

        {/* Nút Báo SOS Xe Gặp Sự Cố Giữa Tuyến (Trang 03 PDF) */}
        <Box sx={{ mt: 1 }}>
          {currentVehicle.isBroken ? (
            <Chip
              label="🚨 XE ĐANG GẶP SỰ CỐ / ĐÃ PHÁT TÍN HIỆU SOS"
              color="error"
              size="small"
              sx={{ width: '100%', fontWeight: 800, fontSize: '0.68rem', py: 0.4 }}
            />
          ) : (
            <Tooltip title="Mô phỏng xe phát tín hiệu SOS khẩn cấp (thủng lốp/hỏng máy) để AI lập phương án xét duyệt chuyển giao tuyến">
              <Button
                fullWidth
                variant="contained"
                size="small"
                color="error"
                onClick={() => onTriggerSos && onTriggerSos(currentVehicle.vehicleId)}
                sx={{
                  textTransform: 'none',
                  fontWeight: 800,
                  fontSize: '0.72rem',
                  backgroundColor: '#dc2626',
                  '&:hover': { backgroundColor: '#b91c1c' },
                }}
              >
                🚨 Phát Tín Hiệu SOS (Báo Xe Hỏng)
              </Button>
            </Tooltip>
          )}
        </Box>
      </Box>
    </Paper>
  );
};

export default VehicleFocusInspector;

import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Grid,
  Paper,
  Chip,
  Stack,
} from '@mui/material';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import AltRouteIcon from '@mui/icons-material/AltRoute';
import SpeedIcon from '@mui/icons-material/Speed';
import NaturePeopleIcon from '@mui/icons-material/NaturePeople';
import LocalGasStationIcon from '@mui/icons-material/LocalGasStation';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import PlaceIcon from '@mui/icons-material/Place';
import FlagIcon from '@mui/icons-material/Flag';

const RouteOptimizationInspectorModal = ({
  open,
  onClose,
  optimizationReport,
  onApplyAndDispatch,
}) => {
  if (!optimizationReport) return null;

  const {
    algorithm = 'CVRP (Capacitated Vehicle Routing) + 2-Opt TSP Local Search',
    metrics = {},
    vehicleRoutes = [],
    generatedAt,
  } = optimizationReport;

  const {
    totalNaiveDistanceKm = 0,
    totalOptimizedDistanceKm = 0,
    totalDistanceSavedKm = 0,
    overallSavingsPercent = 0,
    totalCo2SavedKg = 0,
    totalFuelSavedLiters = 0,
  } = metrics;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth scroll="paper">
      <DialogTitle
        sx={{
          backgroundColor: '#0f172a',
          color: '#ffffff',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          py: 2,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <AutoAwesomeIcon sx={{ color: '#38bdf8' }} />
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 800, fontSize: '1.1rem' }}>
              Bảng Phân Tích Thuật Toán Tối Ưu Quản Đường AI
            </Typography>
            <Typography variant="caption" sx={{ color: '#94a3b8' }}>
              Giải thuật CVRP & 2-Opt Local Search bám sát mạng lưới đường bộ (OSRM TP.HCM)
            </Typography>
          </Box>
        </Box>
        <Chip
          label={`Tiết kiệm ${overallSavingsPercent}% km`}
          color="success"
          sx={{ fontWeight: 800 }}
        />
      </DialogTitle>

      <DialogContent sx={{ p: 3, backgroundColor: '#f8fafc' }}>
        {/* 1. Tổng quan hiệu quả tối ưu (Impact Metrics) */}
        <Typography variant="subtitle2" sx={{ fontWeight: 800, mb: 1.5, color: '#1e293b' }}>
          📈 HIỆU QUẢ TỐI ƯU HÓA TUYẾN THU GOM
        </Typography>

        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={4}>
            <Paper
              elevation={0}
              sx={{
                p: 2,
                borderRadius: 2.5,
                border: '1px solid #e2e8f0',
                backgroundColor: '#ffffff',
              }}
            >
              <Stack direction="row" spacing={1.5} alignItems="center">
                <AltRouteIcon color="primary" sx={{ fontSize: 32 }} />
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    Gốc: {totalNaiveDistanceKm} km ➔ Tối ưu:
                  </Typography>
                  <Typography variant="h6" sx={{ fontWeight: 800, color: '#0f172a' }}>
                    {totalOptimizedDistanceKm} km
                  </Typography>
                  <Typography variant="caption" sx={{ color: '#059669', fontWeight: 700 }}>
                    Tiết kiệm: -{totalDistanceSavedKm} km ({overallSavingsPercent}%)
                  </Typography>
                </Box>
              </Stack>
            </Paper>
          </Grid>

          <Grid item xs={12} sm={4}>
            <Paper
              elevation={0}
              sx={{
                p: 2,
                borderRadius: 2.5,
                border: '1px solid #e2e8f0',
                backgroundColor: '#ffffff',
              }}
            >
              <Stack direction="row" spacing={1.5} alignItems="center">
                <LocalGasStationIcon sx={{ color: '#d97706', fontSize: 32 }} />
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    Nhiên liệu tiết kiệm
                  </Typography>
                  <Typography variant="h6" sx={{ fontWeight: 800, color: '#0f172a' }}>
                    ~{totalFuelSavedLiters} Lít
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Dầu Diesel xe gom rác
                  </Typography>
                </Box>
              </Stack>
            </Paper>
          </Grid>

          <Grid item xs={12} sm={4}>
            <Paper
              elevation={0}
              sx={{
                p: 2,
                borderRadius: 2.5,
                border: '1px solid #e2e8f0',
                backgroundColor: '#ffffff',
              }}
            >
              <Stack direction="row" spacing={1.5} alignItems="center">
                <NaturePeopleIcon sx={{ color: '#10b981', fontSize: 32 }} />
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    Giảm phát thải CO₂
                  </Typography>
                  <Typography variant="h6" sx={{ fontWeight: 800, color: '#10b981' }}>
                    ~{totalCo2SavedKg} kg
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Bảo vệ môi trường đô thị
                  </Typography>
                </Box>
              </Stack>
            </Paper>
          </Grid>
        </Grid>

        {/* 2. Nguyên lý thuật toán & Mô hình Toán học */}
        <Paper
          elevation={0}
          sx={{
            p: 2.5,
            borderRadius: 2.5,
            border: '1px solid #cbd5e1',
            backgroundColor: '#ffffff',
            mb: 3,
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
            <SpeedIcon sx={{ color: '#0284c7' }} />
            <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#0f172a' }}>
              Mô Hình Toán Học & Thuật Toán Áp Dụng
            </Typography>
          </Box>
          <Typography variant="body2" sx={{ color: '#475569', mb: 1.5, lineHeight: 1.6 }}>
            Hệ thống giải bài toán <strong>Capacitated Vehicle Routing Problem (CVRP)</strong> kết
            hợp <strong>2-Opt Local Search Heuristic</strong> và dữ liệu mạng lưới đường bộ thực tế
            (OSRM) để tìm thứ tự di chuyển tối ưu nhất:
          </Typography>

          <Box
            sx={{
              p: 1.5,
              borderRadius: 2,
              backgroundColor: '#0f172a',
              color: '#38bdf8',
              fontFamily: 'monospace',
              fontSize: '0.8rem',
              mb: 1.5,
              lineHeight: 1.7,
            }}
          >
            <div>
              1. <strong>Mục tiêu:</strong> Min Z = ∑(i,j) d_road(i, j) * x_ij
            </div>
            <div>
              2. <strong>Ràng buộc sức chứa:</strong> ∑(i ∈ Route_k) q_i ≤ Q_max (Sức chứa định mức
              từng xe)
            </div>
            <div>
              3. <strong>2-Opt Heuristic:</strong> Đảo chiều chuỗi con [i...k] nếu d(i-1, k) + d(i,
              k+1) &lt; d(i-1, i) + d(k, k+1)
            </div>
            <div>
              4. <strong>Đích kết thúc:</strong> Mọi xe sau khi hoàn thành điểm gom đều kết thúc tại
              Trạm dỡ rác (Depot).
            </div>
          </Box>

          <Typography variant="caption" sx={{ color: '#64748b' }}>
            * Thuật toán: <strong>{algorithm}</strong> • Thời điểm giải:{' '}
            {new Date(generatedAt).toLocaleTimeString('vi-VN')}
          </Typography>
        </Paper>

        {/* 3. Chi tiết Kế hoạch Di chuyển Tối ưu cho từng xe */}
        <Typography variant="subtitle2" sx={{ fontWeight: 800, mb: 1.5, color: '#1e293b' }}>
          🚚 LỘ TRÌNH ĐƯỢC PHÂN BỔ THEO XE
        </Typography>

        <Stack spacing={2}>
          {vehicleRoutes.map((route, idx) => (
            <Paper
              key={route.vehicleId || idx}
              elevation={0}
              sx={{
                p: 2,
                borderRadius: 2.5,
                border: '1px solid #e2e8f0',
                backgroundColor: '#ffffff',
              }}
            >
              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  mb: 1.5,
                  flexWrap: 'wrap',
                  gap: 1,
                }}
              >
                <Stack direction="row" spacing={1} alignItems="center">
                  <LocalShippingIcon color="primary" />
                  <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>
                    Xe {route.vehicleId} ({route.driverName})
                  </Typography>
                  <Chip
                    label={`${route.totalWeightKg} kg rác (${route.capacityUsagePercent}%)`}
                    size="small"
                    color="primary"
                    variant="outlined"
                    sx={{ fontWeight: 700 }}
                  />
                </Stack>

                <Stack direction="row" spacing={1}>
                  <Chip
                    label={`Lộ trình: ${route.totalDistanceKm} km`}
                    size="small"
                    sx={{ fontWeight: 800 }}
                  />
                  <Chip
                    label={`Tiết kiệm: -${route.distanceSavedKm} km (${route.savingsPercent}%)`}
                    size="small"
                    color="success"
                    sx={{ fontWeight: 800 }}
                  />
                </Stack>
              </Box>

              {/* Trình tự ghé thăm các điểm (Stop Sequence Breadcrumbs) */}
              <Box
                sx={{
                  p: 1.5,
                  borderRadius: 2,
                  backgroundColor: '#f1f5f9',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1,
                  overflowX: 'auto',
                  py: 1.5,
                }}
              >
                {/* Điểm xuất phát */}
                <Chip
                  icon={<PlaceIcon />}
                  label="Xuất phát"
                  size="small"
                  sx={{ fontWeight: 700, backgroundColor: '#ffffff' }}
                />
                <ArrowForwardIcon sx={{ fontSize: 16, color: '#64748b' }} />

                {/* Các điểm thu gom */}
                {route.stops.map((stop, sIdx) => (
                  <Box
                    key={stop.ticketId || sIdx}
                    sx={{ display: 'flex', alignItems: 'center', gap: 1, flexShrink: 0 }}
                  >
                    <Chip
                      label={`#${stop.stopIndex} ${stop.binId} (${stop.estimatedKg}kg)`}
                      size="small"
                      color="primary"
                      sx={{ fontWeight: 800 }}
                    />
                    <ArrowForwardIcon sx={{ fontSize: 16, color: '#64748b' }} />
                  </Box>
                ))}

                {/* Trạm dỡ rác */}
                <Chip
                  icon={<FlagIcon />}
                  label="♻️ Trạm dỡ rác (Depot)"
                  size="small"
                  color="success"
                  sx={{ fontWeight: 800 }}
                />
              </Box>
            </Paper>
          ))}
        </Stack>
      </DialogContent>

      <DialogActions sx={{ p: 2, backgroundColor: '#ffffff', borderTop: '1px solid #e2e8f0' }}>
        <Button onClick={onClose} sx={{ fontWeight: 700 }}>
          Đóng
        </Button>
        {onApplyAndDispatch && (
          <Button
            variant="contained"
            color="primary"
            startIcon={<CheckCircleIcon />}
            onClick={() => {
              onApplyAndDispatch();
              onClose();
            }}
            sx={{ fontWeight: 800 }}
          >
            Áp Dụng Lộ Trình & Điều Xe Chạy
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default RouteOptimizationInspectorModal;

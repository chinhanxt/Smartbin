import { useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  Stack,
  Button,
  Switch,
  FormControlLabel,
  Slider,
  Chip,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  ButtonGroup,
  Grid,
} from '@mui/material';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import PauseIcon from '@mui/icons-material/Pause';
import RestartAltIcon from '@mui/icons-material/RestartAlt';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import DeleteIcon from '@mui/icons-material/Delete';
import ScaleIcon from '@mui/icons-material/Scale';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import InfoIcon from '@mui/icons-material/Info';
import FlashOnIcon from '@mui/icons-material/FlashOn';
import AddLocationAltIcon from '@mui/icons-material/AddLocationAlt';
import AltRouteIcon from '@mui/icons-material/AltRoute';
import { simulationEngine } from '../services/WasteSimulationEngine';
import RouteOptimizationInspectorModal from '../../routing/components/RouteOptimizationInspectorModal';

const SimulationControls = ({
  simulationState,
  onStart,
  onPause,
  onReset,
  onSetSpeed,
  onToggleAutoDispatch,
  onSetThreshold,
  onTriggerRandomOverflow,
  isAddingBinMode,
  setIsAddingBinMode,
}) => {
  const {
    isRunning,
    speedMultiplier,
    autoDispatch,
    overflowThreshold,
    stats,
    logs,
    bins,
    vehicles,
  } = simulationState;

  const [inspectorOpen, setInspectorOpen] = useState(false);

  // Tính toán nhanh số liệu
  const overflowBinsCount = bins.filter((b) => b.currentFillPercent >= overflowThreshold).length;
  const activeVehiclesCount = vehicles.filter((v) => v.status !== 'IDLE').length;

  const formatTime = (secondsTotal) => {
    const mins = Math.floor(secondsTotal / 60);
    const secs = Math.floor(secondsTotal % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <Stack spacing={2.5}>
      {/* 1. Bộ điều khiển tiến trình thời gian (Simulation Clock & Controls) */}
      <Paper elevation={1} sx={{ p: 2.5, borderRadius: 2.5 }}>
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: 1.5,
            mb: 2,
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Box
              sx={{
                width: 12,
                height: 12,
                borderRadius: '50%',
                backgroundColor: isRunning ? '#10b981' : '#f59e0b',
                boxShadow: isRunning ? '0 0 10px #10b981' : 'none',
              }}
            />
            <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>
              {isRunning ? 'Mô Phỏng Đang Chạy' : 'Mô Phỏng Tạm Dừng'}
            </Typography>
            <Chip
              label={`Thời gian: ${formatTime(stats.elapsedSeconds || 0)}`}
              size="small"
              sx={{ fontFamily: 'monospace', fontWeight: 700 }}
            />
          </Box>

          {/* Nút Play / Pause / Reset */}
          <Stack direction="row" spacing={1}>
            {isRunning ? (
              <Button
                variant="contained"
                color="warning"
                size="small"
                startIcon={<PauseIcon />}
                onClick={onPause}
                sx={{ textTransform: 'none', fontWeight: 700 }}
              >
                Tạm Dừng
              </Button>
            ) : (
              <Button
                variant="contained"
                color="success"
                size="small"
                startIcon={<PlayArrowIcon />}
                onClick={onStart}
                sx={{ textTransform: 'none', fontWeight: 700 }}
              >
                Bắt Đầu Chạy
              </Button>
            )}

            <Button
              variant="outlined"
              color="inherit"
              size="small"
              startIcon={<RestartAltIcon />}
              onClick={onReset}
              sx={{ textTransform: 'none', fontWeight: 700 }}
            >
              Làm Mới
            </Button>
          </Stack>
        </Box>

        {/* Tốc độ mô phỏng */}
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Typography variant="body2" sx={{ fontWeight: 700, color: 'text.secondary' }}>
            Tốc độ thời gian:
          </Typography>
          <ButtonGroup size="small" variant="outlined">
            {[1, 2, 5, 10].map((mult) => (
              <Button
                key={mult}
                variant={speedMultiplier === mult ? 'contained' : 'outlined'}
                onClick={() => onSetSpeed(mult)}
                sx={{ fontWeight: 800, minWidth: 42 }}
              >
                {mult}x
              </Button>
            ))}
          </ButtonGroup>
        </Box>
      </Paper>

      {/* 2. Bảng điều khiển AI Tự động Phân công Xe (AI Auto-Dispatch) */}
      <Paper
        elevation={1}
        sx={{
          p: 2.5,
          borderRadius: 2.5,
          border: autoDispatch ? '2px solid #0284c7' : '1px solid #e2e8f0',
          backgroundColor: autoDispatch ? 'rgba(2, 132, 199, 0.03)' : '#ffffff',
        }}
      >
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            mb: 1.5,
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <AutoAwesomeIcon sx={{ color: autoDispatch ? '#0284c7' : '#64748b' }} />
            <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>
              AI Tự Động Điều Phối Xe (VRP Engine)
            </Typography>
          </Box>
          <FormControlLabel
            control={
              <Switch
                checked={autoDispatch}
                onChange={(e) => onToggleAutoDispatch(e.target.checked)}
                color="primary"
              />
            }
            label=""
            sx={{ m: 0 }}
          />
        </Box>

        <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mb: 2 }}>
          Khi bật, thuật toán AI sẽ tự động phân tích khoảng cách và tải trọng xe để điều phối xe
          gần nhất tới ngay khi có thùng rác đạt ngưỡng cảnh báo.
        </Typography>

        {/* Cấu hình ngưỡng cảnh báo % rác */}
        <Box sx={{ mb: 2 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
            <Typography variant="caption" sx={{ fontWeight: 700 }}>
              Ngưỡng rác kích hoạt AI thu gom:
            </Typography>
            <Typography variant="caption" sx={{ fontWeight: 800, color: '#0284c7' }}>
              ≥ {overflowThreshold}%
            </Typography>
          </Box>
          <Slider
            size="small"
            value={overflowThreshold}
            min={60}
            max={95}
            step={5}
            onChange={(_, val) => onSetThreshold(val)}
            disabled={!autoDispatch}
          />
        </Box>

        {/* Thao tác tương tác nhanh */}
        <Stack spacing={1.2}>
          {/* Nút chạy Thuật toán Tối ưu Tuyến đường 2-Opt */}
          <Button
            fullWidth
            variant="contained"
            size="small"
            startIcon={<AutoAwesomeIcon />}
            onClick={() => simulationEngine.runRouteOptimization()}
            sx={{
              textTransform: 'none',
              fontWeight: 800,
              fontSize: '0.82rem',
              py: 0.9,
              background: 'linear-gradient(135deg, #6366f1 0%, #0284c7 100%)',
              color: '#ffffff',
              boxShadow: '0 4px 12px rgba(99, 102, 241, 0.35)',
              '&:hover': {
                background: 'linear-gradient(135deg, #4f46e5 0%, #0369a1 100%)',
              },
            }}
          >
            ⚡ Chạy Thuật Toán Tối Ưu Quản Đường (2-Opt)
          </Button>

          {simulationState.optimizationReport && (
            <Paper
              elevation={0}
              sx={{
                p: 1.2,
                borderRadius: 2,
                backgroundColor: '#f0fdf4',
                border: '1px solid #86efac',
              }}
            >
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography
                  variant="caption"
                  sx={{ fontWeight: 800, color: '#166534', fontSize: '0.74rem' }}
                >
                  🏆 Đã tối ưu: -{simulationState.optimizationReport.metrics?.totalDistanceSavedKm}{' '}
                  km ({simulationState.optimizationReport.metrics?.overallSavingsPercent}%)
                </Typography>
                <Button
                  size="small"
                  onClick={() => setInspectorOpen(true)}
                  sx={{
                    fontSize: '0.72rem',
                    fontWeight: 800,
                    p: 0,
                    minWidth: 0,
                    textTransform: 'none',
                    color: '#059669',
                  }}
                >
                  Báo cáo ➔
                </Button>
              </Box>
            </Paper>
          )}

          <Stack direction="row" spacing={1}>
            <Button
              fullWidth
              variant="contained"
              color="primary"
              size="small"
              startIcon={<AddLocationAltIcon />}
              onClick={() => setIsAddingBinMode(!isAddingBinMode)}
              sx={{
                textTransform: 'none',
                fontWeight: 700,
                backgroundColor: isAddingBinMode ? '#f59e0b' : undefined,
              }}
            >
              {isAddingBinMode ? 'Đang bật cắm thùng' : '➕ Thêm Thùng'}
            </Button>

            <Button
              fullWidth
              variant="outlined"
              color="secondary"
              size="small"
              startIcon={<FlashOnIcon />}
              onClick={onTriggerRandomOverflow}
              sx={{ textTransform: 'none', fontWeight: 700 }}
            >
              Làm đầy 1 thùng
            </Button>
          </Stack>

          <Button
            fullWidth
            variant="outlined"
            color="info"
            size="small"
            startIcon={<AltRouteIcon />}
            onClick={() => {
              if (!simulationState.optimizationReport) {
                simulationEngine.runRouteOptimization();
              }
              setInspectorOpen(true);
            }}
            sx={{ textTransform: 'none', fontWeight: 700, fontSize: '0.75rem' }}
          >
            📊 Bảng Phân Tích Thuật Toán VRP & 2-Opt
          </Button>
        </Stack>
      </Paper>

      {/* 3. Chỉ số Giám sát Thời Gian Thực (Live Metrics & KPIs) */}
      <Grid container spacing={1.5}>
        <Grid item xs={6}>
          <Paper elevation={1} sx={{ p: 1.5, borderRadius: 2 }}>
            <Stack direction="row" spacing={1} alignItems="center">
              <DeleteIcon sx={{ color: overflowBinsCount > 0 ? '#ef4444' : '#10b981' }} />
              <Box>
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                  Thùng rác đầy
                </Typography>
                <Typography variant="h6" sx={{ fontWeight: 800, lineHeight: 1.2 }}>
                  {overflowBinsCount} / {bins.length}
                </Typography>
              </Box>
            </Stack>
          </Paper>
        </Grid>

        <Grid item xs={6}>
          <Paper elevation={1} sx={{ p: 1.5, borderRadius: 2 }}>
            <Stack direction="row" spacing={1} alignItems="center">
              <LocalShippingIcon sx={{ color: '#0284c7' }} />
              <Box>
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                  Xe đang hoạt động
                </Typography>
                <Typography variant="h6" sx={{ fontWeight: 800, lineHeight: 1.2 }}>
                  {activeVehiclesCount} / {vehicles.length}
                </Typography>
              </Box>
            </Stack>
          </Paper>
        </Grid>

        <Grid item xs={6}>
          <Paper elevation={1} sx={{ p: 1.5, borderRadius: 2 }}>
            <Stack direction="row" spacing={1} alignItems="center">
              <ScaleIcon sx={{ color: '#059669' }} />
              <Box>
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                  Tổng rác đã gom
                </Typography>
                <Typography variant="h6" sx={{ fontWeight: 800, lineHeight: 1.2 }}>
                  {stats.totalCollectedKg} kg
                </Typography>
              </Box>
            </Stack>
          </Paper>
        </Grid>

        <Grid item xs={6}>
          <Paper elevation={1} sx={{ p: 1.5, borderRadius: 2 }}>
            <Stack direction="row" spacing={1} alignItems="center">
              <AutoAwesomeIcon sx={{ color: '#8b5cf6' }} />
              <Box>
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                  Số lượt AI điều xe
                </Typography>
                <Typography variant="h6" sx={{ fontWeight: 800, lineHeight: 1.2 }}>
                  {stats.totalAutoDispatches} lượt
                </Typography>
              </Box>
            </Stack>
          </Paper>
        </Grid>
      </Grid>

      {/* 4. Nhật ký Sự kiện Thời Gian Thực (Live AI Dispatch Feed) */}
      <Paper elevation={1} sx={{ p: 2, borderRadius: 2.5, flex: 1 }}>
        <Typography variant="subtitle2" sx={{ fontWeight: 800, mb: 1 }}>
          📡 Nhật Ký Điều Phối & Hoạt Động Thời Gian Thực
        </Typography>
        <Divider sx={{ mb: 1 }} />

        <List
          dense
          sx={{
            maxHeight: 280,
            overflowY: 'auto',
            p: 0,
            '&::-webkit-scrollbar': { width: 6 },
            '&::-webkit-scrollbar-thumb': { backgroundColor: '#cbd5e1', borderRadius: 3 },
          }}
        >
          {logs.map((item) => {
            let icon = <InfoIcon fontSize="small" sx={{ color: '#64748b' }} />;
            if (item.type === 'AI')
              icon = <AutoAwesomeIcon fontSize="small" sx={{ color: '#0284c7' }} />;
            else if (item.type === 'ALERT')
              icon = <WarningAmberIcon fontSize="small" sx={{ color: '#ef4444' }} />;
            else if (item.type === 'COLLECT')
              icon = <CheckCircleIcon fontSize="small" sx={{ color: '#10b981' }} />;
            else if (item.type === 'DEPOT')
              icon = <LocalShippingIcon fontSize="small" sx={{ color: '#059669' }} />;

            return (
              <ListItem key={item.id} sx={{ px: 1, py: 0.6, borderBottom: '1px solid #f1f5f9' }}>
                <ListItemIcon sx={{ minWidth: 28 }}>{icon}</ListItemIcon>
                <ListItemText
                  primary={
                    <Typography variant="caption" sx={{ fontWeight: 700, color: '#334155' }}>
                      <span style={{ color: '#94a3b8', marginRight: 6 }}>[{item.time}]</span>
                      {item.message}
                    </Typography>
                  }
                />
              </ListItem>
            );
          })}
        </List>
      </Paper>

      {/* Bảng Phân Tích Thuật Toán Tối Ưu Quản Đường (2-Opt VRP Inspector) */}
      <RouteOptimizationInspectorModal
        open={inspectorOpen}
        onClose={() => setInspectorOpen(false)}
        optimizationReport={simulationState.optimizationReport}
        onApplyAndDispatch={() => simulationEngine.runRouteOptimization()}
      />
    </Stack>
  );
};

export default SimulationControls;

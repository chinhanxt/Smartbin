import { Box, Typography, Paper, Chip, Stack, Button } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import RouteIcon from '@mui/icons-material/Route';
import FlagIcon from '@mui/icons-material/Flag';
import MyLocationIcon from '@mui/icons-material/MyLocation';
import PlayCircleIcon from '@mui/icons-material/PlayCircle';

const RouteMapPreview = ({ route }) => {
  const navigate = useNavigate();
  if (!route) {
    return (
      <Paper elevation={1} sx={{ p: 4, borderRadius: 2, textAlign: 'center' }}>
        <Typography variant="body2" color="text.secondary">
          Vui lòng chọn một tuyến xe để xem bản đồ lộ trình chi tiết.
        </Typography>
      </Paper>
    );
  }

  const {
    vehicleId,
    driverId,
    stops,
    unloadingStation,
    totalDistanceKm,
    estimatedDurationMinutes,
  } = route;

  return (
    <Paper elevation={1} sx={{ p: 2, borderRadius: 2 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <RouteIcon color="primary" />
          <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>
            Sơ đồ Tuyến Thu Gom Dự Kiến (Xe {vehicleId})
          </Typography>
        </Box>
        <Stack direction="row" spacing={1} alignItems="center">
          <Button
            size="small"
            variant="contained"
            color="success"
            startIcon={<PlayCircleIcon />}
            onClick={() => navigate('/dispatch/simulation')}
            sx={{ textTransform: 'none', fontWeight: 800, fontSize: '0.75rem', py: 0.3 }}
          >
            Bản Đồ Ghim Trực Tiếp
          </Button>
          <Chip
            label={`${totalDistanceKm} Km`}
            size="small"
            sx={{ fontWeight: 700 }}
            variant="outlined"
          />
          <Chip
            label={`~${estimatedDurationMinutes} Phút`}
            size="small"
            color="secondary"
            sx={{ fontWeight: 700 }}
          />
        </Stack>
      </Box>

      {/* Minh họa trực quan bản đồ hành trình dạng sơ đồ tuyến nối */}
      <Box
        sx={{
          p: 2.5,
          borderRadius: 2,
          backgroundColor: '#0f172a',
          color: '#ffffff',
          position: 'relative',
          overflow: 'hidden',
          minHeight: 220,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
        }}
      >
        {/* Điểm xuất phát của xe */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, zIndex: 2 }}>
          <Box
            sx={{
              width: 32,
              height: 32,
              borderRadius: '50%',
              backgroundColor: '#0284c7',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <LocalShippingIcon sx={{ fontSize: 18 }} />
          </Box>
          <Box>
            <Typography variant="body2" sx={{ fontWeight: 800 }}>
              XUẤT PHÁT: Xe {vehicleId} (Tài xế {driverId})
            </Typography>
            <Typography variant="caption" sx={{ color: '#94a3b8' }}>
              Vị trí GPS Traccar hiện tại • Khởi hành ca làm việc
            </Typography>
          </Box>
        </Box>

        {/* Các điểm dừng nối tiếp */}
        <Box
          sx={{
            my: 2,
            display: 'flex',
            alignItems: 'center',
            gap: 1,
            overflowX: 'auto',
            py: 1,
            zIndex: 2,
          }}
        >
          {stops.map((stop, idx) => (
            <Box key={idx} sx={{ display: 'flex', alignItems: 'center', flexShrink: 0 }}>
              <Box
                sx={{
                  p: 1.2,
                  borderRadius: 2,
                  backgroundColor: '#1e293b',
                  border: '1px solid #334155',
                  minWidth: 120,
                  textAlign: 'center',
                }}
              >
                <Box
                  sx={{
                    width: 22,
                    height: 22,
                    borderRadius: '50%',
                    backgroundColor: '#059669',
                    fontSize: '0.75rem',
                    fontWeight: 800,
                    mx: 'auto',
                    mb: 0.5,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {stop.stopIndex}
                </Box>
                <Typography variant="caption" sx={{ fontWeight: 700, display: 'block' }}>
                  {stop.binId}
                </Typography>
                <Typography variant="caption" sx={{ color: '#38bdf8', fontSize: '0.65rem' }}>
                  {new Date(stop.eta).toLocaleTimeString('vi-VN', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </Typography>
              </Box>

              {idx < stops.length - 1 && (
                <Box sx={{ width: 24, height: 2, backgroundColor: '#059669', mx: 0.5 }} />
              )}
            </Box>
          ))}

          {/* Đường nối về Trạm dỡ rác */}
          <Box sx={{ width: 24, height: 2, backgroundColor: '#10b981', mx: 0.5 }} />

          {unloadingStation && (
            <Box
              sx={{
                p: 1.2,
                borderRadius: 2,
                backgroundColor: '#064e3b',
                border: '1px solid #059669',
                minWidth: 140,
                textAlign: 'center',
                flexShrink: 0,
              }}
            >
              <FlagIcon sx={{ fontSize: 18, color: '#34d399', mb: 0.5 }} />
              <Typography variant="caption" sx={{ fontWeight: 800, display: 'block' }}>
                TRẠM DỠ RÁC
              </Typography>
              <Typography variant="caption" sx={{ color: '#a7f3d0', fontSize: '0.65rem' }}>
                {new Date(unloadingStation.eta).toLocaleTimeString('vi-VN', {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </Typography>
            </Box>
          )}
        </Box>

        {/* Thông số tổng kết */}
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            zIndex: 2,
            borderTop: '1px solid #334155',
            pt: 1,
          }}
        >
          <Stack direction="row" spacing={1} alignItems="center">
            <MyLocationIcon sx={{ fontSize: 14, color: '#38bdf8' }} />
            <Typography variant="caption" sx={{ color: '#94a3b8' }}>
              Tổng {stops.length} điểm thu gom trên toàn tuyến
            </Typography>
          </Stack>
          <Typography variant="caption" sx={{ color: '#34d399', fontWeight: 700 }}>
            Hoàn tất dự kiến:{' '}
            {unloadingStation?.eta
              ? new Date(unloadingStation.eta).toLocaleTimeString('vi-VN', {
                  hour: '2-digit',
                  minute: '2-digit',
                })
              : '--:--'}
          </Typography>
        </Box>
      </Box>
    </Paper>
  );
};

export default RouteMapPreview;

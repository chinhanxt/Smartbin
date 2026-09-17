import {
  Box,
  Typography,
  Paper,
  List,
  ListItem,
  ListItemText,
  IconButton,
  Chip,
  Stack,
  Tooltip,
} from '@mui/material';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import ScaleIcon from '@mui/icons-material/Scale';
import DeleteIcon from '@mui/icons-material/Delete';

const WaypointList = ({ route, onReorderStops, onRemoveStop, isReadOnly = false }) => {
  if (!route || !route.stops || route.stops.length === 0) {
    return (
      <Paper elevation={1} sx={{ p: 3, borderRadius: 2, textAlign: 'center' }}>
        <Typography variant="body2" color="text.secondary">
          Chưa có điểm dừng nào trong lộ trình xe này.
        </Typography>
      </Paper>
    );
  }

  const handleMoveUp = (index) => {
    if (index === 0 || isReadOnly) return;
    const newStops = [...route.stops];
    const temp = newStops[index - 1];
    newStops[index - 1] = newStops[index];
    newStops[index] = temp;
    // Cập nhật lại số thứ tự
    newStops.forEach((s, idx) => {
      s.stopIndex = idx + 1;
    });
    onReorderStops(route.vehicleId, newStops);
  };

  const handleMoveDown = (index) => {
    if (index === route.stops.length - 1 || isReadOnly) return;
    const newStops = [...route.stops];
    const temp = newStops[index + 1];
    newStops[index + 1] = newStops[index];
    newStops[index] = temp;
    newStops.forEach((s, idx) => {
      s.stopIndex = idx + 1;
    });
    onReorderStops(route.vehicleId, newStops);
  };

  return (
    <Paper elevation={1} sx={{ p: 2, borderRadius: 2 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Box>
          <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>
            Thứ tự Điểm Gom (Lộ trình Xe: {route.vehicleId})
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Tài xế: {route.driverId} • {route.totalStops} điểm • {route.totalDistanceKm} Km • ~
            {route.estimatedDurationMinutes} phút
          </Typography>
        </Box>
        <Chip
          label={`Tải trọng: ${route.totalWeightKg} Kg (${route.capacityUsagePercent}%)`}
          color={route.capacityUsagePercent > 90 ? 'error' : 'success'}
          size="small"
          sx={{ fontWeight: 700 }}
        />
      </Box>

      <List disablePadding>
        {route.stops.map((stop, index) => (
          <Box key={stop.ticketId || index}>
            <ListItem
              sx={{
                px: 1.5,
                py: 1,
                borderRadius: 1.5,
                backgroundColor: 'action.hover',
                mb: 1,
                border: '1px solid',
                borderColor: 'divider',
                display: 'flex',
                alignItems: 'center',
                gap: 1.5,
              }}
            >
              {/* Badge số thứ tự */}
              <Box
                sx={{
                  width: 28,
                  height: 28,
                  borderRadius: '50%',
                  backgroundColor: 'primary.main',
                  color: 'primary.contrastText',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 800,
                  fontSize: '0.8rem',
                  flexShrink: 0,
                }}
              >
                {stop.stopIndex}
              </Box>

              <ListItemText
                primary={
                  <Box
                    sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                  >
                    <Typography variant="body2" sx={{ fontWeight: 700 }}>
                      {stop.binId} {stop.householdId ? `• Hộ: ${stop.householdId}` : ''}
                    </Typography>
                    <Stack direction="row" spacing={1} alignItems="center">
                      <AccessTimeIcon sx={{ fontSize: 14, color: 'info.main' }} />
                      <Typography variant="caption" sx={{ fontWeight: 700, color: 'info.main' }}>
                        ETA:{' '}
                        {new Date(stop.eta).toLocaleTimeString('vi-VN', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </Typography>
                    </Stack>
                  </Box>
                }
                secondary={
                  <Box sx={{ mt: 0.5 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <LocationOnIcon sx={{ fontSize: 14, color: 'text.secondary' }} />
                      <Typography variant="caption" color="text.secondary" sx={{ lineHeight: 1.2 }}>
                        {stop.address}
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', gap: 1.5, mt: 0.5, alignItems: 'center' }}>
                      <Typography
                        variant="caption"
                        sx={{
                          color: 'secondary.main',
                          fontWeight: 600,
                          display: 'flex',
                          alignItems: 'center',
                          gap: 0.3,
                        }}
                      >
                        <ScaleIcon sx={{ fontSize: 12 }} /> {stop.estimatedKg} Kg
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Cách điểm trước: {stop.distanceFromPrevKm} Km (~{stop.travelTimeMinutes}{' '}
                        phút)
                      </Typography>
                    </Box>
                  </Box>
                }
              />

              {/* Điều khiển đổi thứ tự thủ công (Trang 03 PDF) */}
              {!isReadOnly && (
                <Stack direction="row" spacing={0.2}>
                  <Tooltip title="Đẩy lên trước">
                    <span>
                      <IconButton
                        size="small"
                        disabled={index === 0}
                        onClick={() => handleMoveUp(index)}
                        sx={{ p: 0.5 }}
                      >
                        <ArrowUpwardIcon fontSize="small" />
                      </IconButton>
                    </span>
                  </Tooltip>
                  <Tooltip title="Đẩy xuống sau">
                    <span>
                      <IconButton
                        size="small"
                        disabled={index === route.stops.length - 1}
                        onClick={() => handleMoveDown(index)}
                        sx={{ p: 0.5 }}
                      >
                        <ArrowDownwardIcon fontSize="small" />
                      </IconButton>
                    </span>
                  </Tooltip>
                  {onRemoveStop && (
                    <Tooltip title="Loại bỏ khỏi chuyến">
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() => onRemoveStop(route.vehicleId, stop.ticketId)}
                        sx={{ p: 0.5 }}
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  )}
                </Stack>
              )}
            </ListItem>
          </Box>
        ))}

        {/* Điểm kết thúc: Trạm dỡ rác */}
        {route.unloadingStation && (
          <ListItem
            sx={{
              px: 2,
              py: 1.5,
              borderRadius: 1.5,
              backgroundColor: 'action.selected',
              border: '1px dashed',
              borderColor: 'secondary.main',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <Box>
              <Typography variant="subtitle2" sx={{ fontWeight: 800, color: 'secondary.main' }}>
                🏁 ĐIỂM KẾT THÚC: {route.unloadingStation.name}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Bàn giao rác & cập nhật phiếu cân • Cách điểm cuối:{' '}
                {route.unloadingStation.distanceFromLastStopKm} Km
              </Typography>
            </Box>
            <Typography variant="caption" sx={{ fontWeight: 800, color: 'secondary.main' }}>
              ETA:{' '}
              {new Date(route.unloadingStation.eta).toLocaleTimeString('vi-VN', {
                hour: '2-digit',
                minute: '2-digit',
              })}
            </Typography>
          </ListItem>
        )}
      </List>
    </Paper>
  );
};

export default WaypointList;

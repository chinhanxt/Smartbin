import {
  Box,
  Typography,
  Paper,
  Grid,
  Card,
  CardContent,
  Chip,
  LinearProgress,
  Stack,
  Button,
  Tooltip,
  useTheme,
} from '@mui/material';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import PersonIcon from '@mui/icons-material/Person';
import BuildIcon from '@mui/icons-material/Build';

const VEHICLE_STATUS_MAP = {
  IDLE: { label: 'Chờ lệnh / Sẵn sàng', color: 'default' },
  EN_ROUTE: { label: 'Đang di chuyển', color: 'info' },
  COLLECTING: { label: 'Đang thu gom', color: 'warning' },
  UNLOADING: { label: 'Đang dỡ rác tại trạm', color: 'success' },
};

const DispatchBoard = ({ vehicles, selectedVehicleId, onSelectVehicle, onReportBreakdown }) => {
  const theme = useTheme();

  return (
    <Paper elevation={1} sx={{ p: 2, borderRadius: 2 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <LocalShippingIcon color="primary" />
          <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>
            Bảng Điều Phối Phương Tiện (Fleet Dispatch Board)
          </Typography>
        </Box>
        <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
          {vehicles.length} phương tiện trong ca
        </Typography>
      </Box>

      <Grid container spacing={2}>
        {vehicles.map((v) => {
          const isSelected = v.vehicleId === selectedVehicleId;
          const statusConfig = VEHICLE_STATUS_MAP[v.status] || VEHICLE_STATUS_MAP.IDLE;
          const capacityPercent = Math.round((v.currentCapacityKg / v.maxCapacityKg) * 100);

          return (
            <Grid item xs={12} sm={6} md={4} key={v.vehicleId}>
              <Card
                elevation={isSelected ? 3 : 0}
                sx={{
                  borderRadius: 2,
                  border: '2px solid',
                  borderColor: isSelected ? 'primary.main' : v.isBroken ? 'error.main' : 'divider',
                  backgroundColor: isSelected ? 'action.selected' : 'background.paper',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  '&:hover': {
                    borderColor: 'primary.main',
                    boxShadow: theme.shadows[3],
                  },
                }}
                onClick={() => onSelectVehicle(v.vehicleId)}
              >
                <CardContent sx={{ p: 2 }}>
                  <Box
                    sx={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      mb: 1,
                    }}
                  >
                    <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>
                      {v.vehicleId}
                    </Typography>
                    <Chip
                      label={v.isBroken ? 'Xe hỏng / Cần hỗ trợ' : statusConfig.label}
                      color={v.isBroken ? 'error' : statusConfig.color}
                      size="small"
                      sx={{ fontWeight: 700, fontSize: '0.7rem' }}
                    />
                  </Box>

                  {/* Tài xế & Ca */}
                  <Stack spacing={0.5} sx={{ mb: 1.5 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <PersonIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                      <Typography variant="caption" sx={{ fontWeight: 600 }}>
                        {v.driverName}
                      </Typography>
                    </Box>
                    <Typography variant="caption" color="text.secondary" sx={{ pl: 2.5 }}>
                      {v.shift}
                    </Typography>
                  </Stack>

                  {/* Tải trọng hiện tại */}
                  <Box sx={{ mb: 1.5, p: 1, backgroundColor: 'action.hover', borderRadius: 1.5 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                      <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                        Tải trọng rác:
                      </Typography>
                      <Typography
                        variant="caption"
                        sx={{
                          fontWeight: 800,
                          color: capacityPercent >= 85 ? 'error.main' : 'success.main',
                        }}
                      >
                        {v.currentCapacityKg} / {v.maxCapacityKg} Kg ({capacityPercent}%)
                      </Typography>
                    </Box>
                    <LinearProgress
                      variant="determinate"
                      value={Math.min(100, capacityPercent)}
                      sx={{
                        height: 6,
                        borderRadius: 3,
                        '& .MuiLinearProgress-bar': {
                          backgroundColor: capacityPercent >= 85 ? 'error.main' : 'success.main',
                        },
                      }}
                    />
                  </Box>

                  {/* Hành động */}
                  <Box
                    sx={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      pt: 1,
                      borderTop: '1px solid',
                      borderColor: 'divider',
                    }}
                  >
                    <Typography
                      variant="caption"
                      color={isSelected ? 'primary.main' : 'text.secondary'}
                      sx={{ fontWeight: 700 }}
                    >
                      {isSelected ? '✓ Đang xem tuyến' : 'Bấm để xem'}
                    </Typography>

                    {!v.isBroken && onReportBreakdown && (
                      <Tooltip title="Khai báo xe gặp sự cố hỏng hóc giữa chừng (Trang 03)">
                        <Button
                          size="small"
                          color="error"
                          startIcon={<BuildIcon sx={{ fontSize: '0.85rem !important' }} />}
                          onClick={(e) => {
                            e.stopPropagation();
                            onReportBreakdown(v.vehicleId);
                          }}
                          sx={{ textTransform: 'none', fontSize: '0.7rem', fontWeight: 700 }}
                        >
                          Báo xe hỏng
                        </Button>
                      </Tooltip>
                    )}
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          );
        })}
      </Grid>
    </Paper>
  );
};

export default DispatchBoard;

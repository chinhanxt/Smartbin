import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Paper,
  Chip,
  Typography,
  Avatar,
  Stack,
  Tooltip,
  Button,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Divider,
} from '@mui/material';
import DirectionsCarIcon from '@mui/icons-material/DirectionsCar';
import GroupsIcon from '@mui/icons-material/Groups';
import FilterAltIcon from '@mui/icons-material/FilterAlt';
import MenuIcon from '@mui/icons-material/Menu';
import AssignmentIcon from '@mui/icons-material/Assignment';
import AltRouteIcon from '@mui/icons-material/AltRoute';
import PlayCircleIcon from '@mui/icons-material/PlayCircle';
import MyLocationIcon from '@mui/icons-material/MyLocation';
import DescriptionIcon from '@mui/icons-material/Description';
import SettingsIcon from '@mui/icons-material/Settings';

const VehicleSelectorBar = ({
  vehicles = [],
  focusedVehicleId,
  onSelectVehicle,
  bins = [],
  activeOptimizationReport = null,
}) => {
  const navigate = useNavigate();
  const [navAnchorEl, setNavAnchorEl] = useState(null);

  // Tính số lượng thùng rác mà mỗi tài xế phụ trách gom
  const getAssignedCount = (vehicle) => {
    if (!vehicle) return 0;
    const assignedBinIds = new Set();
    if (vehicle.targetBinId) assignedBinIds.add(vehicle.targetBinId);
    if (vehicle.waypoints && vehicle.waypoints.length > 0) {
      vehicle.waypoints.forEach((wp) => {
        if (wp.binId) assignedBinIds.add(wp.binId);
      });
    }
    bins.forEach((b) => {
      if (b.assignedVehicleId === vehicle.vehicleId) assignedBinIds.add(b.id);
    });
    if (activeOptimizationReport?.vehicleRoutes) {
      const vRoute = activeOptimizationReport.vehicleRoutes.find(
        (r) => r.vehicleId === vehicle.vehicleId,
      );
      if (vRoute?.stops) {
        vRoute.stops.forEach((s) => {
          if (s.binId) {
            const bObj = bins.find((b) => b.id === s.binId);
            if (!bObj || bObj.status !== 'NORMAL' || bObj.currentFillPercent > 0) {
              assignedBinIds.add(s.binId);
            }
          }
        });
      }
    }
    return assignedBinIds.size;
  };

  const focusedVehicle = vehicles.find((v) => v.vehicleId === focusedVehicleId);
  const focusedBinCount = focusedVehicle ? getAssignedCount(focusedVehicle) : 0;

  return (
    <>
      <Paper
        elevation={5}
        sx={{
          position: 'absolute',
          top: 16,
          left: { xs: 16, md: 80 },
          zIndex: 10,
          p: 0.8,
          borderRadius: 3,
          backgroundColor: 'rgba(255, 255, 255, 0.96)',
          backdropFilter: 'blur(10px)',
          border: focusedVehicleId
            ? `1.5px solid ${focusedVehicle?.color || '#0284c7'}`
            : '1px solid #e2e8f0',
          display: 'flex',
          alignItems: 'center',
          gap: 1,
          maxWidth: { xs: 'calc(100vw - 32px)', md: 'calc(100vw - 320px)' },
          overflowX: 'auto',
          boxShadow: focusedVehicleId
            ? `0 6px 20px rgba(0,0,0,0.18), 0 0 12px ${focusedVehicle?.color || '#0284c7'}30`
            : '0 6px 20px rgba(0,0,0,0.14)',
          '&::-webkit-scrollbar': { height: 4 },
          '&::-webkit-scrollbar-thumb': { backgroundColor: '#cbd5e1', borderRadius: 2 },
        }}
      >
        {/* Nút Menu Điều Hành thay thế cho BottomMenu */}
        <Tooltip title="Menu Quản Lý Phiếu Việc & Điều Hành Hệ Thống">
          <Button
            size="small"
            variant="contained"
            color="primary"
            startIcon={<MenuIcon sx={{ fontSize: 16 }} />}
            onClick={(e) => setNavAnchorEl(e.currentTarget)}
            sx={{
              fontWeight: 800,
              fontSize: '0.72rem',
              height: 26,
              borderRadius: 2,
              textTransform: 'none',
              px: 1.2,
              whiteSpace: 'nowrap',
              boxShadow: '0 2px 8px rgba(30,41,59,0.25)',
              backgroundColor: '#0f172a',
              color: '#ffffff',
              '&:hover': { backgroundColor: '#1e293b' },
            }}
          >
            Điều Hành
          </Button>
        </Tooltip>

        <Divider orientation="vertical" flexItem sx={{ mx: 0.2, my: 0.3 }} />

        <Typography
          variant="caption"
          sx={{
            fontWeight: 800,
            color: '#475569',
            px: 0.8,
            fontSize: '0.72rem',
            whiteSpace: 'nowrap',
            display: { xs: 'none', sm: 'block' },
          }}
        >
          👨‍✈️ Tài xế:
        </Typography>

        <Stack direction="row" spacing={0.6} alignItems="center">
          {/* Nút Xem toàn bộ đội xe */}
          <Tooltip title="Hiện lại tất cả xe và tất cả các thùng rác trên bản đồ">
            <Chip
              icon={<GroupsIcon sx={{ fontSize: 14 }} />}
              label="Tất cả xe"
              size="small"
              variant={!focusedVehicleId ? 'filled' : 'outlined'}
              color={!focusedVehicleId ? 'primary' : 'default'}
              onClick={() => onSelectVehicle(null)}
              sx={{
                fontWeight: 800,
                fontSize: '0.7rem',
                height: 26,
                cursor: 'pointer',
                borderWidth: 1.5,
              }}
            />
          </Tooltip>

          {/* Các chip từng tài xế/xe một */}
          {vehicles.map((veh) => {
            const isSelected = focusedVehicleId === veh.vehicleId;
            const loadPercent = Math.round((veh.currentLoadKg / veh.maxCapacityKg) * 100);
            const binCount = getAssignedCount(veh);

            let statusDotColor = '#94a3b8';
            if (veh.status === 'MOVING_TO_BIN') statusDotColor = '#0284c7';
            else if (veh.status === 'COLLECTING') statusDotColor = '#d97706';
            else if (veh.status === 'MOVING_TO_DEPOT') statusDotColor = '#8b5cf6';
            else if (veh.status === 'UNLOADING') statusDotColor = '#059669';

            // Lấy tên ngắn gọn của tài xế
            const shortName = veh.driverName.split(' ').slice(-1)[0] || veh.driverName;
            const vehShortId = `V${veh.vehicleId.replace('VEH-0', '').replace('VEH-', '')}`;

            return (
              <Tooltip
                key={veh.vehicleId}
                title={`Tài xế: ${veh.driverName} (${veh.vehicleId}) • ${binCount > 0 ? `Gom ${binCount} thùng` : 'Rảnh rỗi'} • Tải: ${loadPercent}% • Bấm để chỉ xem xe này`}
              >
                <Chip
                  avatar={
                    <Avatar
                      sx={{
                        bgcolor: veh.color,
                        color: '#ffffff',
                        width: 18,
                        height: 18,
                        fontSize: '0.65rem',
                      }}
                    >
                      <DirectionsCarIcon sx={{ fontSize: 11 }} />
                    </Avatar>
                  }
                  label={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <Box
                        sx={{
                          width: 6,
                          height: 6,
                          borderRadius: '50%',
                          backgroundColor: statusDotColor,
                          boxShadow: `0 0 4px ${statusDotColor}`,
                        }}
                      />
                      <span>
                        <strong>{vehShortId}</strong> {shortName}
                      </span>
                      <Box
                        component="span"
                        sx={{
                          bgcolor: isSelected ? veh.color : '#e2e8f0',
                          color: isSelected ? '#ffffff' : '#334155',
                          px: 0.5,
                          py: 0.05,
                          borderRadius: 1,
                          fontSize: '0.62rem',
                          fontWeight: 900,
                        }}
                      >
                        {binCount}
                      </Box>
                    </Box>
                  }
                  size="small"
                  variant={isSelected ? 'filled' : 'outlined'}
                  onClick={() => onSelectVehicle(veh.vehicleId)}
                  sx={{
                    fontWeight: isSelected ? 900 : 700,
                    fontSize: '0.68rem',
                    height: 26,
                    cursor: 'pointer',
                    borderColor: isSelected ? veh.color : '#cbd5e1',
                    backgroundColor: isSelected ? `${veh.color}20` : '#ffffff',
                    color: isSelected ? veh.color : '#1e293b',
                    borderWidth: isSelected ? 2 : 1,
                    '&:hover': {
                      backgroundColor: `${veh.color}15`,
                      borderColor: veh.color,
                    },
                  }}
                />
              </Tooltip>
            );
          })}
        </Stack>

        {/* Thông báo trạng thái lọc khi đang chọn 1 tài xế */}
        {focusedVehicle && (
          <Box
            sx={{
              display: { xs: 'none', lg: 'flex' },
              alignItems: 'center',
              gap: 0.6,
              pl: 1,
              borderLeft: '1.5px solid #e2e8f0',
            }}
          >
            <FilterAltIcon sx={{ fontSize: 16, color: focusedVehicle.color }} />
            <Typography
              variant="caption"
              sx={{
                fontWeight: 800,
                fontSize: '0.72rem',
                color: '#0f172a',
                whiteSpace: 'nowrap',
              }}
            >
              Đang lọc: {focusedVehicle.driverName} ({focusedBinCount} thùng gom)
            </Typography>
          </Box>
        )}
      </Paper>

      {/* Dropdown Menu Điều Hành & Quản Lý */}
      <Menu
        anchorEl={navAnchorEl}
        open={Boolean(navAnchorEl)}
        onClose={() => setNavAnchorEl(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
        transformOrigin={{ vertical: 'top', horizontal: 'left' }}
        PaperProps={{
          sx: {
            borderRadius: 2.5,
            boxShadow: '0 10px 30px rgba(0,0,0,0.22)',
            minWidth: 240,
            mt: 0.8,
          },
        }}
      >
        <MenuItem
          onClick={() => {
            setNavAnchorEl(null);
            navigate('/tickets');
          }}
        >
          <ListItemIcon>
            <AssignmentIcon fontSize="small" color="primary" />
          </ListItemIcon>
          <ListItemText primary="Quản Lý Phiếu Việc" secondary="Quy trình 6 bước & Chống trùng" />
        </MenuItem>
        <MenuItem
          onClick={() => {
            setNavAnchorEl(null);
            navigate('/dispatch');
          }}
        >
          <ListItemIcon>
            <AltRouteIcon fontSize="small" color="secondary" />
          </ListItemIcon>
          <ListItemText primary="Điều Phối Tuyến Đường" secondary="Tối ưu VRP & Phân công xe" />
        </MenuItem>
        <MenuItem
          onClick={() => {
            setNavAnchorEl(null);
            navigate('/dispatch/simulation');
          }}
        >
          <ListItemIcon>
            <PlayCircleIcon fontSize="small" color="success" />
          </ListItemIcon>
          <ListItemText primary="Bản Đồ Mô Phỏng AI" secondary="Mô phỏng toàn diện" />
        </MenuItem>
        <Divider />
        <MenuItem
          onClick={() => {
            setNavAnchorEl(null);
            navigate('/tracker');
          }}
        >
          <ListItemIcon>
            <MyLocationIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText primary="Bộ Phát GPS Di Động" />
        </MenuItem>
        <MenuItem
          onClick={() => {
            setNavAnchorEl(null);
            navigate('/reports/combined');
          }}
        >
          <ListItemIcon>
            <DescriptionIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText primary="Báo Cáo Tổng Hợp" />
        </MenuItem>
        <MenuItem
          onClick={() => {
            setNavAnchorEl(null);
            navigate('/settings/preferences?menu=true');
          }}
        >
          <ListItemIcon>
            <SettingsIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText primary="Cài Đặt Hệ Thống" />
        </MenuItem>
      </Menu>
    </>
  );
};

export default VehicleSelectorBar;

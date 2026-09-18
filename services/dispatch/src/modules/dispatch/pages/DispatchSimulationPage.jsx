import { useState, useEffect } from 'react';
import { Box, Typography, Grid, Paper, Tabs, Tab } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import AltRouteIcon from '@mui/icons-material/AltRoute';
import PlayCircleIcon from '@mui/icons-material/PlayCircle';

import PageLayout from '../../../common/components/PageLayout';
import OperationsMenu from '../../common/OperationsMenu';
import { simulationEngine } from '../services/WasteSimulationEngine';
import LiveSimulationMap from '../components/LiveSimulationMap';
import SimulationControls from '../components/SimulationControls';

const DispatchSimulationPage = () => {
  const navigate = useNavigate();
  const [simulationState, setSimulationState] = useState(() => simulationEngine.getStateSnapshot());
  const [isAddingBinMode, setIsAddingBinMode] = useState(false);

  // Đăng ký nhận cập nhật từ Engine
  useEffect(() => {
    const unsubscribe = simulationEngine.subscribe((newState) => {
      setSimulationState(newState);
    });

    // Mặc định tự động khởi động chạy mô phỏng
    simulationEngine.start();

    return () => {
      unsubscribe();
      simulationEngine.pause();
    };
  }, []);

  // Kích hoạt ngẫu nhiên 1 thùng rác đầy để test ngay phản ứng của AI
  const handleTriggerRandomOverflow = () => {
    const availableBins = simulationState.bins.filter(
      (b) => b.currentFillPercent < simulationState.overflowThreshold && !b.assignedVehicleId,
    );
    if (availableBins.length > 0) {
      const randomBin = availableBins[Math.floor(Math.random() * availableBins.length)];
      simulationEngine.setBinFillLevel(randomBin.id, 92);
    }
  };

  return (
    <PageLayout
      menu={<OperationsMenu />}
      breadcrumbs={['Trung Tâm Điều Phối', 'Mô Phỏng Trực Quan AI']}
    >
      <Box sx={{ p: { xs: 2, md: 3 } }}>
        {/* Navigation Tabs để chuyển đổi mượt mà giữa Bảng Điều Phối VRP và Mô Phỏng */}
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: 2,
            mb: 2.5,
          }}
        >
          <Box>
            <Typography variant="h5" sx={{ fontWeight: 800 }}>
              Mô Phỏng Thực Địa & Điều Phối Tuyến AI
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Mô phỏng xe thu gom rác di chuyển thời gian thực, thùng rác đầy dần và AI tự động lập
              tuyến
            </Typography>
          </Box>

          <Paper elevation={1} sx={{ borderRadius: 2 }}>
            <Tabs
              value={1}
              onChange={(_, newVal) => {
                if (newVal === 0) navigate('/dispatch');
              }}
              textColor="primary"
              indicatorColor="primary"
              sx={{ minHeight: 42 }}
            >
              <Tab
                icon={<AltRouteIcon fontSize="small" />}
                iconPosition="start"
                label="Bảng Điều Hành VRP"
                sx={{ textTransform: 'none', fontWeight: 700, minHeight: 42 }}
              />
              <Tab
                icon={<PlayCircleIcon fontSize="small" />}
                iconPosition="start"
                label="Mô Phỏng Thực Địa AI"
                sx={{ textTransform: 'none', fontWeight: 800, minHeight: 42 }}
              />
            </Tabs>
          </Paper>
        </Box>

        {/* Layout chính: Bản đồ tương tác lớn và Bảng điều khiển */}
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', lg: '7.5fr 4.5fr' },
            gap: 3,
            width: '100%',
            alignItems: 'start',
          }}
        >
          {/* Cột trái: Bản đồ MapLibre Trực Quan */}
          <Box sx={{ width: '100%', minWidth: 0 }}>
            <LiveSimulationMap
              simulationState={simulationState}
              onAddBin={(params) => simulationEngine.addBinAtLocation(params)}
              onSetBinFill={(binId, fill) => simulationEngine.setBinFillLevel(binId, fill)}
              onDeleteBin={(binId) => simulationEngine.deleteBin(binId)}
              isAddingBinMode={isAddingBinMode}
              setIsAddingBinMode={setIsAddingBinMode}
            />
          </Box>

          {/* Cột phải: Bảng điều khiển mô phỏng & Nhật ký AI */}
          <Box sx={{ width: '100%', minWidth: 0 }}>
            <SimulationControls
              simulationState={simulationState}
              onStart={() => simulationEngine.start()}
              onPause={() => simulationEngine.pause()}
              onReset={() => simulationEngine.reset()}
              onSetSpeed={(speed) => simulationEngine.setSpeed(speed)}
              onToggleAutoDispatch={(val) => simulationEngine.setAutoDispatch(val)}
              onSetThreshold={(val) => simulationEngine.setOverflowThreshold(val)}
              onTriggerRandomOverflow={handleTriggerRandomOverflow}
              isAddingBinMode={isAddingBinMode}
              setIsAddingBinMode={setIsAddingBinMode}
            />
          </Box>
        </Box>
      </Box>
    </PageLayout>
  );
};

export default DispatchSimulationPage;

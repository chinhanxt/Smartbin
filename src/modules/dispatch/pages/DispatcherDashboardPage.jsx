import { useState, useMemo, useEffect } from 'react';
import {
  Box,
  Typography,
  Grid,
  Button,
  Chip,
  Stack,
  Alert,
  Snackbar,
  Paper,
  Tabs,
  Tab,
} from '@mui/material';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import DoneAllIcon from '@mui/icons-material/DoneAll';
import BuildCircleIcon from '@mui/icons-material/BuildCircle';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import PlayCircleIcon from '@mui/icons-material/PlayCircle';
import AltRouteIcon from '@mui/icons-material/AltRoute';

import PageLayout from '../../../common/components/PageLayout';
import OperationsMenu from '../../common/OperationsMenu';
import { RouteOptimizationService } from '../../routing/services/RouteOptimizationService';
import { simulationEngine } from '../services/WasteSimulationEngine';
import LiveSimulationMap from '../components/LiveSimulationMap';
import SimulationControls from '../components/SimulationControls';
import DispatchBoard from '../components/DispatchBoard';
import DriverAssignmentModal from '../components/DriverAssignmentModal';
import RouteMapPreview from '../../routing/components/RouteMapPreview';
import WaypointList from '../../routing/components/WaypointList';
import ConstraintSettings from '../../routing/components/ConstraintSettings';

// Dữ liệu mẫu khởi tạo các điểm cần thu gom
const MOCK_TICKETS_FOR_ROUTING = [
  {
    id: 'TCK-20260917-001',
    binId: 'BIN-101',
    householdId: 'HH-8012',
    type: 'IOT_OVERFLOW',
    lat: 10.776889,
    lng: 106.700806,
    address: '128 Lê Lợi, Phường Bến Thành, Q.1',
    estimatedKg: 35,
  },
  {
    id: 'TCK-20260917-002',
    binId: 'BIN-102',
    householdId: 'HH-8013',
    type: 'SCHEDULED_COLLECTION',
    lat: 10.7745,
    lng: 106.7032,
    address: '45 Nguyễn Huệ, Phường Bến Nghé, Q.1',
    estimatedKg: 20,
  },
  {
    id: 'TCK-20260917-003',
    binId: 'BIN-105',
    householdId: 'HH-8020',
    type: 'BULKY_WASTE',
    lat: 10.7785,
    lng: 106.6982,
    address: '88 Pasteur, Phường Bến Nghé, Q.1',
    estimatedKg: 60,
  },
  {
    id: 'TCK-20260917-004',
    binId: 'BIN-108',
    householdId: 'HH-8045',
    type: 'IOT_OVERFLOW',
    lat: 10.7721,
    lng: 106.6955,
    address: '15 Tôn Thất Tùng, Q.1',
    estimatedKg: 40,
  },
  {
    id: 'TCK-20260917-006',
    binId: 'BIN-112',
    householdId: 'HH-8080',
    type: 'IOT_OVERFLOW',
    lat: 10.7689,
    lng: 106.6925,
    address: '102 Bùi Viện, Q.1',
    estimatedKg: 50,
  },
];

const INITIAL_VEHICLES = [
  {
    vehicleId: 'VEH-01',
    driverId: 'DRV-05',
    driverName: 'Lê Văn Tài',
    maxCapacityKg: 3000,
    currentCapacityKg: 450,
    lat: 10.7768,
    lng: 106.7009,
    status: 'EN_ROUTE',
    shift: 'Ca sáng (06:00 - 14:00)',
    isBroken: false,
  },
  {
    vehicleId: 'VEH-02',
    driverId: 'DRV-02',
    driverName: 'Trần Đình Trọng',
    maxCapacityKg: 4000,
    currentCapacityKg: 900,
    lat: 10.7812,
    lng: 106.6954,
    status: 'COLLECTING',
    shift: 'Ca sáng (06:00 - 14:00)',
    isBroken: false,
  },
  {
    vehicleId: 'VEH-03',
    driverId: null,
    driverName: 'Chưa phân công',
    maxCapacityKg: 2500,
    currentCapacityKg: 0,
    lat: 10.7701,
    lng: 106.6989,
    status: 'STANDBY',
    shift: 'Dự phòng khẩn cấp',
    isBroken: false,
  },
];

const DispatcherDashboardPage = () => {
  const [activeTab, setActiveTab] = useState(0); // 0: Bản đồ Mô phỏng có Ghim, 1: Kế hoạch Tuyến VRP
  const [vehicles, setVehicles] = useState(INITIAL_VEHICLES);
  const [selectedVehicleId, setSelectedVehicleId] = useState('VEH-01');
  const [isCalculating, setIsCalculating] = useState(false);
  const [assignmentModalOpen, setAssignmentModalOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');

  // Trạng thái mô phỏng thực địa thời gian thực
  const [simulationState, setSimulationState] = useState(() => simulationEngine.getStateSnapshot());
  const [isAddingBinMode, setIsAddingBinMode] = useState(false);

  useEffect(() => {
    const unsubscribe = simulationEngine.subscribe((newState) => {
      setSimulationState(newState);
    });
    simulationEngine.start();
    return () => {
      unsubscribe();
      simulationEngine.pause();
    };
  }, []);

  const handleTriggerRandomOverflow = () => {
    const availableBins = simulationState.bins.filter(
      (b) => b.currentFillPercent < simulationState.overflowThreshold && !b.assignedVehicleId,
    );
    if (availableBins.length > 0) {
      const randomBin = availableBins[Math.floor(Math.random() * availableBins.length)];
      simulationEngine.setBinFillLevel(randomBin.id, 92);
    }
  };

  // Kế hoạch lộ trình hiện tại
  const [plan, setPlan] = useState(() => {
    return RouteOptimizationService.optimizeRoutes({
      tickets: MOCK_TICKETS_FOR_ROUTING,
      vehicles: INITIAL_VEHICLES.filter((v) => !v.isBroken),
    });
  });

  const [planStatus, setPlanStatus] = useState('DRAFT'); // 'DRAFT' | 'APPROVED' | 'ACTIVE'

  // Lấy lộ trình của xe đang chọn
  const currentVehicleRoute = useMemo(() => {
    return plan?.vehicleRoutes?.find((r) => r.vehicleId === selectedVehicleId) || null;
  }, [plan, selectedVehicleId]);

  // 1. Kích hoạt giải thuật toán VRP tối ưu tuyến
  const handleOptimizeRoutes = (constraints = {}) => {
    setIsCalculating(true);
    setTimeout(() => {
      const newPlan = RouteOptimizationService.optimizeRoutes({
        tickets: MOCK_TICKETS_FOR_ROUTING,
        vehicles: vehicles.filter((v) => !v.isBroken),
        ...constraints,
      });
      setPlan(newPlan);
      setPlanStatus('DRAFT');
      setIsCalculating(false);
      setSnackbarMessage(
        `⚡ Đã tối ưu tuyến thành công (Phiên bản: ${newPlan.version}). Phân bổ ${newPlan.assignedStopsCount} điểm gom!`,
      );
    }, 400);
  };

  // 2. Phê duyệt phiên bản kế hoạch (Trang 03 PDF: "Điều phối viên duyệt phiên bản kế hoạch")
  const handleApprovePlan = () => {
    setPlanStatus('APPROVED');
    setSnackbarMessage(
      `✅ Đã phê duyệt và phát hành phiên bản kế hoạch ${plan.version}! Danh sách điểm đã gửi tới tài xế.`,
    );
  };

  // 3. Xử lý xe hỏng giữa chừng (Trang 03 PDF: "Chỉ lập lại phần chưa thực hiện, giữ kết quả đã nghiệm thu")
  const handleReportBreakdown = (brokenVehicleId) => {
    setVehicles((prev) =>
      prev.map((v) =>
        v.vehicleId === brokenVehicleId ? { ...v, isBroken: true, status: 'IDLE' } : v,
      ),
    );

    // Tìm xe dự phòng (VEH-03)
    const backupVehicle = vehicles.find((v) => v.vehicleId === 'VEH-03' && !v.isBroken);
    if (!backupVehicle) {
      alert('Không còn xe dự phòng nào sẵn sàng để tiếp quản tuyến!');
      return;
    }

    // Giả định điểm đầu tiên TCK-20260917-001 đã nghiệm thu xong, chỉ tái lập tuyến cho các điểm còn lại
    const brokenRoute = plan?.vehicleRoutes?.find((r) => r.vehicleId === brokenVehicleId);
    if (!brokenRoute) return;

    const completedIds = ['TCK-20260917-001'];
    const reoptimized = RouteOptimizationService.reoptimizeRemainingRoute(
      brokenRoute,
      completedIds,
      backupVehicle,
    );

    if (reoptimized) {
      setPlan(reoptimized);
      setSelectedVehicleId(backupVehicle.vehicleId);
      setSnackbarMessage(
        `🚨 Đã xử lý sự cố xe ${brokenVehicleId}: Giữ nguyên 1 điểm đã gom, tái lập tuyến ${reoptimized.assignedStopsCount} điểm còn lại sang xe dự phòng ${backupVehicle.vehicleId}!`,
      );
    }
  };

  // 4. Sắp xếp lại điểm thủ công
  const handleReorderStops = (vehicleId, newStops) => {
    setPlan((prev) => {
      const newRoutes = prev.vehicleRoutes.map((r) => {
        if (r.vehicleId === vehicleId) {
          return { ...r, stops: newStops };
        }
        return r;
      });
      return { ...prev, vehicleRoutes: newRoutes };
    });
  };

  // 5. Xác nhận phân công tài xế
  const handleConfirmAssignment = ({ vehicleId, driverId, driverName }) => {
    setVehicles((prev) =>
      prev.map((v) => (v.vehicleId === vehicleId ? { ...v, driverId, driverName } : v)),
    );
    setSnackbarMessage(`🧑‍✈️ Đã phân công tài xế ${driverName} cho phương tiện ${vehicleId}!`);
  };

  return (
    <PageLayout
      menu={<OperationsMenu />}
      breadcrumbs={['Trung Tâm Điều Phối', 'Tối Ưu & Phân Công']}
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
            mb: 2,
          }}
        >
          <Box>
            <Typography variant="h5" sx={{ fontWeight: 800 }}>
              Trung Tâm Điều Phối Tuyến Thu Gom
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Thuật toán VRP đa phương tiện & Giám sát đội xe Traccar (Trang 03 & 07 PDF)
            </Typography>
          </Box>

          <Paper elevation={1} sx={{ borderRadius: 2 }}>
            <Tabs
              value={activeTab}
              onChange={(_, newVal) => setActiveTab(newVal)}
              textColor="primary"
              indicatorColor="primary"
              sx={{ minHeight: 42 }}
            >
              <Tab
                icon={<PlayCircleIcon fontSize="small" />}
                iconPosition="start"
                label="Bản Đồ Mô Phỏng AI (Xem Ghim)"
                sx={{ textTransform: 'none', fontWeight: 800, minHeight: 42 }}
              />
              <Tab
                icon={<AltRouteIcon fontSize="small" />}
                iconPosition="start"
                label="Kế Hoạch Tuyến VRP & Đội Xe"
                sx={{ textTransform: 'none', fontWeight: 700, minHeight: 42 }}
              />
            </Tabs>
          </Paper>
        </Box>

        {/* NỘI DUNG THEO TAB ĐƯỢC CHỌN */}
        {activeTab === 0 ? (
          /* TAB 0: BẢN ĐỒ MÔ PHỎNG THỜI GIAN THỰC VỚI CÁC GHIM XE & THÙNG RÁC */
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', lg: '7.5fr 4.5fr' },
              gap: 3,
              width: '100%',
              alignItems: 'start',
            }}
          >
            {/* Cột trái: Bản đồ MapLibre Trực Quan Có Ghim */}
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
        ) : (
          /* TAB 1: KẾ HOẠCH TUYẾN VRP & BẢNG ĐIỀU PHỐI XE */
          <>
            {/* Action Controls Bar */}
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'flex-end',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: 1.5,
                mb: 2.5,
              }}
            >
              <Stack direction="row" spacing={1.5} alignItems="center" flexWrap="wrap">
                <Chip
                  label={`Phiên bản: ${plan.version}`}
                  sx={{ fontWeight: 700 }}
                  variant="outlined"
                />

                <Chip
                  label={planStatus === 'APPROVED' ? 'Đã Phê Duyệt' : 'Bản Thảo (Draft)'}
                  color={planStatus === 'APPROVED' ? 'success' : 'warning'}
                  sx={{ fontWeight: 800 }}
                />

                <Button
                  variant="outlined"
                  size="small"
                  color="primary"
                  startIcon={<AutoAwesomeIcon />}
                  onClick={() => handleOptimizeRoutes()}
                  disabled={isCalculating}
                  sx={{ textTransform: 'none', fontWeight: 700 }}
                >
                  Tối ưu VRP AI
                </Button>

                <Button
                  variant="contained"
                  color="primary"
                  size="small"
                  startIcon={<DoneAllIcon />}
                  onClick={handleApprovePlan}
                  disabled={planStatus === 'APPROVED'}
                  sx={{ textTransform: 'none', fontWeight: 700 }}
                >
                  Duyệt & Phát Hành Tuyến
                </Button>
              </Stack>
            </Box>

            {/* Thông tin hỗ trợ sự cố */}
            <Alert severity="info" sx={{ mb: 3, borderRadius: 2 }}>
              <strong>Quy tắc nghiệp vụ cốt lõi (Trang 03 PDF):</strong> Sức chứa xe lấy từ vận
              hành/phiếu cân, không suy diễn từ GPS. Khi có sự cố xe hỏng hoặc từ chối việc, hệ
              thống chỉ lập lại lộ trình cho phần điểm chưa thực hiện và giữ nguyên các điểm đã
              nghiệm thu xong.
            </Alert>

            {/* Main Layout */}
            <Grid container spacing={3}>
              {/* Cột trái: Quản lý đội xe & Cấu hình ràng buộc */}
              <Grid item xs={12} lg={6}>
                <Stack spacing={3}>
                  {/* Fleet Dispatch Board */}
                  <DispatchBoard
                    vehicles={vehicles}
                    selectedVehicleId={selectedVehicleId}
                    onSelectVehicle={(id) => setSelectedVehicleId(id)}
                    onReportBreakdown={handleReportBreakdown}
                  />

                  {/* Quick Actions for Selected Vehicle */}
                  <Paper elevation={1} sx={{ p: 2, borderRadius: 2 }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1.5 }}>
                      Thao Tác Nhanh Theo Phương Tiện (Xe {selectedVehicleId})
                    </Typography>
                    <Grid container spacing={1.5}>
                      <Grid item xs={12} sm={6}>
                        <Button
                          fullWidth
                          variant="outlined"
                          size="small"
                          startIcon={<PersonAddIcon />}
                          onClick={() => setAssignmentModalOpen(true)}
                          sx={{ textTransform: 'none', fontWeight: 600 }}
                        >
                          Phân Công Tài Xế
                        </Button>
                      </Grid>

                      <Grid item xs={12} sm={6}>
                        <Button
                          fullWidth
                          variant="outlined"
                          size="small"
                          color="error"
                          startIcon={<BuildCircleIcon />}
                          onClick={() => handleReportBreakdown(selectedVehicleId)}
                          sx={{ textTransform: 'none', fontWeight: 600 }}
                        >
                          Mô phỏng Xe Hỏng
                        </Button>
                      </Grid>
                    </Grid>
                  </Paper>

                  {/* Constraint Settings */}
                  <ConstraintSettings
                    onApplyConstraints={handleOptimizeRoutes}
                    isCalculating={isCalculating}
                  />
                </Stack>
              </Grid>

              {/* Cột phải: Bản đồ lộ trình & Danh sách điểm dừng */}
              <Grid item xs={12} lg={6}>
                <Stack spacing={3}>
                  {/* Route Map Preview */}
                  <RouteMapPreview route={currentVehicleRoute} />

                  {/* Waypoint Ordered List */}
                  <WaypointList
                    route={currentVehicleRoute}
                    onReorderStops={handleReorderStops}
                    isReadOnly={planStatus === 'APPROVED'}
                  />
                </Stack>
              </Grid>
            </Grid>
          </>
        )}

        {/* Modal Phân công tài xế */}
        <DriverAssignmentModal
          open={assignmentModalOpen}
          onClose={() => setAssignmentModalOpen(false)}
          vehicleId={selectedVehicleId}
          planVersion={plan.version}
          onConfirmAssignment={handleConfirmAssignment}
        />

        {/* Thông báo tương tác */}
        <Snackbar
          open={Boolean(snackbarMessage)}
          autoHideDuration={5000}
          onClose={() => setSnackbarMessage('')}
          message={snackbarMessage}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        />
      </Box>
    </PageLayout>
  );
};

export default DispatcherDashboardPage;

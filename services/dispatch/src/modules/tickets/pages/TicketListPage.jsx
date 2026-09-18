import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Grid,
  Paper,
  TextField,
  MenuItem,
  Button,
  Stack,
  InputAdornment,
  Card,
  Snackbar,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Chip,
  IconButton,
  ToggleButtonGroup,
  ToggleButton,
  LinearProgress,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import AddIcon from '@mui/icons-material/Add';
import LayersIcon from '@mui/icons-material/Layers';
import ViewModuleIcon from '@mui/icons-material/ViewModule';
import ViewListIcon from '@mui/icons-material/ViewList';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';

import PageLayout from '../../../common/components/PageLayout';
import OperationsMenu from '../../common/OperationsMenu';
import {
  TICKET_STATUS,
  TICKET_STATUS_LABELS,
  TICKET_STATUS_COLORS,
  TICKET_TYPE,
  TICKET_TYPE_LABELS,
  TICKET_PRIORITY,
} from '../../../contracts/ticketStatus';
import { DeduplicationEngine } from '../services/DeduplicationEngine';
import TicketCard from '../components/TicketCard';

// Dữ liệu mẫu khởi tạo
const INITIAL_TICKETS = [
  {
    id: 'TCK-20260917-001',
    binId: 'BIN-101',
    householdId: 'HH-8012',
    type: TICKET_TYPE.IOT_OVERFLOW,
    status: TICKET_STATUS.PENDING_PLAN,
    priority: TICKET_PRIORITY.HIGH,
    lat: 10.776889,
    lng: 106.700806,
    address: '128 Lê Lợi, Phường Bến Thành, Quận 1, TP.HCM',
    createdAt: new Date(Date.now() - 3600 * 1000 * 2).toISOString(),
    deadline: new Date(Date.now() + 3600 * 1000 * 2).toISOString(),
    estimatedKg: 35,
    latestFillLevel: 92,
    latestOdorLevel: 45,
    assignedVehicleId: null,
    assignedDriverId: null,
    evidence: {
      beforePhotoUrl: null,
      afterPhotoUrl: null,
      submittedAt: null,
      inspectedBy: null,
      note: '',
    },
    history: [
      {
        timestamp: new Date(Date.now() - 3600 * 1000 * 2).toISOString(),
        action: 'TICKET_CREATED',
        performedBy: 'Hệ thống IoT Telemetry',
        details: 'Cảm biến phát hiện mức đầy vượt ngưỡng (92%)',
      },
    ],
    mergedEvents: [],
  },
  {
    id: 'TCK-20260917-002',
    binId: 'BIN-102',
    householdId: 'HH-8013',
    type: TICKET_TYPE.SCHEDULED_COLLECTION,
    status: TICKET_STATUS.AWAITING_APPROVAL,
    priority: TICKET_PRIORITY.NORMAL,
    lat: 10.7745,
    lng: 106.7032,
    address: '45 Nguyễn Huệ, Phường Bến Nghé, Quận 1, TP.HCM',
    createdAt: new Date(Date.now() - 3600 * 1000 * 3).toISOString(),
    deadline: new Date(Date.now() + 3600 * 1000 * 4).toISOString(),
    estimatedKg: 20,
    latestFillLevel: 65,
    latestOdorLevel: 20,
    assignedVehicleId: 'VEH-01',
    assignedDriverId: 'DRV-05',
    evidence: {
      beforePhotoUrl: null,
      afterPhotoUrl: null,
      submittedAt: null,
      inspectedBy: null,
      note: '',
    },
    history: [
      {
        timestamp: new Date(Date.now() - 3600 * 1000 * 3).toISOString(),
        action: 'TICKET_CREATED',
        performedBy: 'Lịch định kỳ',
        details: 'Tạo phiếu theo chu kỳ thu gom thứ Năm hàng tuần',
      },
      {
        timestamp: new Date(Date.now() - 3600 * 1000 * 1.5).toISOString(),
        action: 'TRANSITION_PENDING_PLAN_TO_AWAITING_APPROVAL',
        performedBy: 'Hệ thống tối ưu tuyến VRP',
        details: 'Đã lập phương án khả thi với xe VEH-01',
      },
    ],
    mergedEvents: [],
  },
  {
    id: 'TCK-20260917-003',
    binId: 'BIN-105',
    householdId: 'HH-8020',
    type: TICKET_TYPE.BULKY_WASTE,
    status: TICKET_STATUS.IN_PROGRESS,
    priority: TICKET_PRIORITY.HIGH,
    lat: 10.7785,
    lng: 106.6982,
    address: '88 Pasteur, Phường Bến Nghé, Quận 1, TP.HCM',
    createdAt: new Date(Date.now() - 3600 * 1000 * 5).toISOString(),
    deadline: new Date(Date.now() + 3600 * 1000 * 3).toISOString(),
    estimatedKg: 60,
    assignedVehicleId: 'VEH-02',
    assignedDriverId: 'DRV-02',
    evidence: {
      beforePhotoUrl: null,
      afterPhotoUrl: null,
      submittedAt: null,
      inspectedBy: null,
      note: '',
    },
    history: [
      {
        timestamp: new Date(Date.now() - 3600 * 1000 * 5).toISOString(),
        action: 'TICKET_CREATED',
        performedBy: 'Đơn cồng kềnh DEV 3',
        details: 'Cư dân đã trả trước đơn thu gom bộ bàn ghế cũ',
      },
      {
        timestamp: new Date(Date.now() - 3600 * 1000 * 2).toISOString(),
        action: 'TRANSITION_AWAITING_APPROVAL_TO_ASSIGNED',
        performedBy: 'Điều phối viên',
        details: 'Phân công xe tải chuyên dụng VEH-02',
      },
      {
        timestamp: new Date(Date.now() - 3600 * 1000 * 1).toISOString(),
        action: 'TRANSITION_ASSIGNED_TO_IN_PROGRESS',
        performedBy: 'Tài xế DRV-02',
        details: 'Đã nhận nhiệm vụ và đang di chuyển tới điểm',
      },
    ],
    mergedEvents: [],
  },
  {
    id: 'TCK-20260917-004',
    binId: 'BIN-108',
    householdId: 'HH-8045',
    type: TICKET_TYPE.IOT_OVERFLOW,
    status: TICKET_STATUS.AWAITING_INSPECTION,
    priority: TICKET_PRIORITY.HIGH,
    lat: 10.7721,
    lng: 106.6955,
    address: '15 Tôn Thất Tùng, Phường Phạm Ngũ Lão, Quận 1, TP.HCM',
    createdAt: new Date(Date.now() - 3600 * 1000 * 6).toISOString(),
    deadline: new Date(Date.now() + 3600 * 1000 * 1).toISOString(),
    estimatedKg: 40,
    assignedVehicleId: 'VEH-01',
    assignedDriverId: 'DRV-05',
    evidence: {
      beforePhotoUrl:
        'https://images.unsplash.com/photo-1532996122724-e3c354a0b15b?w=500&auto=format&fit=crop',
      afterPhotoUrl:
        'https://images.unsplash.com/photo-1503596476-1c12a8ba09a9?w=500&auto=format&fit=crop',
      submittedAt: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
      inspectedBy: null,
      note: 'Đã gom sạch rác tràn xung quanh thùng và lau nắp.',
    },
    history: [
      {
        timestamp: new Date(Date.now() - 3600 * 1000 * 6).toISOString(),
        action: 'TICKET_CREATED',
        performedBy: 'IoT Telemetry',
        details: 'Cảnh báo đầy 95%',
      },
      {
        timestamp: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
        action: 'TRANSITION_IN_PROGRESS_TO_AWAITING_INSPECTION',
        performedBy: 'Tài xế DRV-05',
        details: 'Đã gửi ảnh trước/sau và xác nhận nghiệm thu tại điểm',
      },
    ],
    mergedEvents: [],
  },
  {
    id: 'TCK-20260917-005',
    binId: 'BIN-110',
    householdId: 'HH-8060',
    type: TICKET_TYPE.IOT_OVERFLOW,
    status: TICKET_STATUS.EXCEPTION,
    priority: TICKET_PRIORITY.CRITICAL,
    lat: 10.7712,
    lng: 106.6912,
    address: 'Hẻm 214 Nguyễn Trãi, Phường Nguyễn Cư Trinh, Quận 1, TP.HCM',
    createdAt: new Date(Date.now() - 3600 * 1000 * 8).toISOString(),
    deadline: new Date(Date.now() - 3600 * 1000 * 1).toISOString(),
    estimatedKg: 30,
    assignedVehicleId: 'VEH-01',
    assignedDriverId: 'DRV-05',
    evidence: {
      beforePhotoUrl: null,
      afterPhotoUrl: null,
      submittedAt: null,
      inspectedBy: null,
      note: '',
    },
    history: [
      {
        timestamp: new Date(Date.now() - 3600 * 1000 * 8).toISOString(),
        action: 'TICKET_CREATED',
        performedBy: 'Hệ thống',
        details: 'Tạo phiếu thu gom',
      },
      {
        timestamp: new Date(Date.now() - 3600 * 1000 * 2).toISOString(),
        action: 'TRANSITION_IN_PROGRESS_TO_EXCEPTION',
        performedBy: 'Tài xế DRV-05',
        details: 'Xe không tiếp cận được do công trình đào đường chắn toàn bộ đầu hẻm',
        reason: 'Hẻm thi công công trình ngầm, xe thu gom không thể vào',
      },
    ],
    mergedEvents: [],
  },
];

const TicketListPage = () => {
  const navigate = useNavigate();
  const [tickets, setTickets] = useState(INITIAL_TICKETS);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [viewMode, setViewMode] = useState('cards'); // 'cards' | 'table'
  const [snackbarMessage, setSnackbarMessage] = useState('');

  // Lọc danh sách theo tiêu chí
  const filteredTickets = tickets.filter((t) => {
    const matchSearch =
      t.id.toLowerCase().includes(search.toLowerCase()) ||
      t.binId.toLowerCase().includes(search.toLowerCase()) ||
      t.address.toLowerCase().includes(search.toLowerCase());

    const matchStatus = statusFilter === 'ALL' || t.status === statusFilter;
    const matchType = typeFilter === 'ALL' || t.type === typeFilter;

    return matchSearch && matchStatus && matchType;
  });

  // Số liệu thống kê
  const stats = {
    total: tickets.length,
    pending: tickets.filter((t) => t.status === TICKET_STATUS.PENDING_PLAN).length,
    inProgress: tickets.filter((t) => t.status === TICKET_STATUS.IN_PROGRESS).length,
    inspecting: tickets.filter((t) => t.status === TICKET_STATUS.AWAITING_INSPECTION).length,
    exceptions: tickets.filter((t) => t.status === TICKET_STATUS.EXCEPTION).length,
  };

  // 1. Thử nghiệm: Phát sinh sự kiện mới (Tạo phiếu mới)
  const handleSimulateNewEvent = () => {
    const newBinId = `BIN-${Math.floor(120 + Math.random() * 80)}`;
    const event = {
      binId: newBinId,
      type: TICKET_TYPE.IOT_OVERFLOW,
      source: 'Cảm biến IoT (Mới)',
      householdId: `HH-${Math.floor(8100 + Math.random() * 100)}`,
      address: `${Math.floor(10 + Math.random() * 200)} Hai Bà Trưng, Quận 1, TP.HCM`,
      payload: { fillLevel: 94, odorLevel: 60 },
    };

    const { updatedTickets, action, resultTicket } = DeduplicationEngine.processEvent(
      tickets,
      event,
    );
    setTickets(updatedTickets);
    setSnackbarMessage(
      `✅ [${action}]: Đã tạo phiếu mới ${resultTicket.id} cho thùng ${newBinId}!`,
    );
  };

  // 2. Thử nghiệm: Phát sinh cảnh báo lặp cho BIN-101 (Chống trùng theo Trang 02 PDF)
  const handleSimulateDuplicateEvent = () => {
    const event = {
      binId: 'BIN-101',
      type: TICKET_TYPE.IOT_OVERFLOW,
      source: 'Cảm biến IoT Telemetry (Cảnh báo lặp)',
      payload: { fillLevel: 98, odorLevel: 75 },
    };

    const { updatedTickets, action, resultTicket } = DeduplicationEngine.processEvent(
      tickets,
      event,
    );
    setTickets(updatedTickets);
    setSnackbarMessage(
      `🛡️ [CHỐNG TRÙNG - ${action}]: Phát hiện cảnh báo lặp cho ${resultTicket.binId}. Đã gộp vào phiếu ${resultTicket.id} và cập nhật timeline!`,
    );
  };

  return (
    <PageLayout
      menu={<OperationsMenu />}
      breadcrumbs={['Quản Lý Phiếu Việc', 'Danh Sách Phiếu Việc']}
    >
      <Box sx={{ p: { xs: 2, md: 3 } }}>
        {/* Module Header Bar */}
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
              Quản Lý Phiếu Việc Thu Gom
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Vòng đời 6 bước chuẩn & Chống trùng lặp sự kiện (Trang 01, 02, 06 PDF)
            </Typography>
          </Box>

          <Stack direction="row" spacing={1.5} flexWrap="wrap">
            <Button
              variant="outlined"
              size="small"
              startIcon={<LayersIcon />}
              onClick={handleSimulateDuplicateEvent}
              sx={{ textTransform: 'none', fontWeight: 600 }}
            >
              Mô phỏng Chống Trùng (BIN-101)
            </Button>

            <Button
              variant="contained"
              color="primary"
              size="small"
              startIcon={<AddIcon />}
              onClick={handleSimulateNewEvent}
              sx={{ textTransform: 'none', fontWeight: 700 }}
            >
              Phát sinh Sự kiện Mới
            </Button>
          </Stack>
        </Box>

        {/* Quick Stats Cards */}
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={6} sm={2.4}>
            <Card elevation={1} sx={{ p: 1.5, borderRadius: 2 }}>
              <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                Tổng phiếu việc
              </Typography>
              <Typography variant="h5" sx={{ fontWeight: 800 }}>
                {stats.total}
              </Typography>
            </Card>
          </Grid>

          <Grid item xs={6} sm={2.4}>
            <Card elevation={1} sx={{ p: 1.5, borderRadius: 2 }}>
              <Typography variant="caption" color="warning.main" sx={{ fontWeight: 600 }}>
                Chờ lập kế hoạch
              </Typography>
              <Typography variant="h5" color="warning.main" sx={{ fontWeight: 800 }}>
                {stats.pending}
              </Typography>
            </Card>
          </Grid>

          <Grid item xs={6} sm={2.4}>
            <Card elevation={1} sx={{ p: 1.5, borderRadius: 2 }}>
              <Typography variant="caption" color="info.main" sx={{ fontWeight: 600 }}>
                Đang thực hiện
              </Typography>
              <Typography variant="h5" color="info.main" sx={{ fontWeight: 800 }}>
                {stats.inProgress}
              </Typography>
            </Card>
          </Grid>

          <Grid item xs={6} sm={2.4}>
            <Card elevation={1} sx={{ p: 1.5, borderRadius: 2 }}>
              <Typography variant="caption" color="secondary.main" sx={{ fontWeight: 600 }}>
                Chờ nghiệm thu
              </Typography>
              <Typography variant="h5" color="secondary.main" sx={{ fontWeight: 800 }}>
                {stats.inspecting}
              </Typography>
            </Card>
          </Grid>

          <Grid item xs={6} sm={2.4}>
            <Card elevation={1} sx={{ p: 1.5, borderRadius: 2 }}>
              <Typography variant="caption" color="error.main" sx={{ fontWeight: 600 }}>
                Ngoại lệ (Sự cố)
              </Typography>
              <Typography variant="h5" color="error.main" sx={{ fontWeight: 800 }}>
                {stats.exceptions}
              </Typography>
            </Card>
          </Grid>
        </Grid>

        {/* Filter and Search Bar */}
        <Paper elevation={1} sx={{ p: 2, mb: 3, borderRadius: 2 }}>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                size="small"
                placeholder="Tìm theo mã phiếu, mã thùng, hoặc địa chỉ..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon color="action" />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>

            <Grid item xs={6} sm={2.5}>
              <TextField
                select
                fullWidth
                size="small"
                label="Trạng thái"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <MenuItem value="ALL">Tất cả trạng thái</MenuItem>
                {Object.keys(TICKET_STATUS).map((key) => (
                  <MenuItem key={key} value={key}>
                    {TICKET_STATUS_LABELS[key]}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>

            <Grid item xs={6} sm={2.5}>
              <TextField
                select
                fullWidth
                size="small"
                label="Loại việc"
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
              >
                <MenuItem value="ALL">Tất cả loại việc</MenuItem>
                {Object.keys(TICKET_TYPE).map((key) => (
                  <MenuItem key={key} value={key}>
                    {TICKET_TYPE_LABELS[key]}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>

            <Grid item xs={12} sm={3} sx={{ display: 'flex', justifyContent: 'flex-end' }}>
              <ToggleButtonGroup
                value={viewMode}
                exclusive
                size="small"
                onChange={(_, next) => next && setViewMode(next)}
              >
                <ToggleButton value="cards" aria-label="card view">
                  <ViewModuleIcon fontSize="small" sx={{ mr: 0.5 }} /> Thẻ
                </ToggleButton>
                <ToggleButton value="table" aria-label="table view">
                  <ViewListIcon fontSize="small" sx={{ mr: 0.5 }} /> Bảng
                </ToggleButton>
              </ToggleButtonGroup>
            </Grid>
          </Grid>
        </Paper>

        {/* Content: Cards or Table */}
        {viewMode === 'cards' ? (
          <Grid container spacing={2.5}>
            {filteredTickets.map((ticket) => (
              <Grid item xs={12} sm={6} md={4} key={ticket.id}>
                <TicketCard
                  ticket={ticket}
                  onSelect={(id) => navigate(`/tickets/${id}`, { state: { ticket } })}
                />
              </Grid>
            ))}
          </Grid>
        ) : (
          <Paper elevation={1} sx={{ borderRadius: 2, overflow: 'hidden' }}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 700 }}>Mã Phiếu</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Loại Việc</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Thùng & Địa Chỉ</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Mức Đầy</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Trạng Thái</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Xe / Tài Xế</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Hạn Xử Lý</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 700 }}>
                    Thao Tác
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredTickets.map((ticket) => {
                  const statusColor = TICKET_STATUS_COLORS[ticket.status] || '#64748b';
                  const isOverdue =
                    new Date(ticket.deadline) < new Date() && ticket.status !== 'COMPLETED';

                  return (
                    <TableRow key={ticket.id} hover>
                      <TableCell>
                        <Typography variant="body2" sx={{ fontWeight: 700 }}>
                          {ticket.id}
                        </Typography>
                        {ticket.priority === 'CRITICAL' && (
                          <Chip
                            icon={<WarningAmberIcon sx={{ fontSize: '0.9rem !important' }} />}
                            label="Khẩn cấp"
                            color="error"
                            size="small"
                            sx={{ mt: 0.5, height: 20, fontSize: '0.7rem' }}
                          />
                        )}
                      </TableCell>

                      <TableCell>
                        <Chip
                          label={TICKET_TYPE_LABELS[ticket.type] || ticket.type}
                          size="small"
                          variant="outlined"
                        />
                      </TableCell>

                      <TableCell>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          {ticket.binId}
                        </Typography>
                        <Typography
                          variant="caption"
                          color="text.secondary"
                          sx={{ display: 'block', maxWidth: 220 }}
                          noWrap
                        >
                          {ticket.address}
                        </Typography>
                      </TableCell>

                      <TableCell sx={{ minWidth: 120 }}>
                        {ticket.latestFillLevel !== undefined ? (
                          <Box>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                              <Typography variant="caption" sx={{ fontWeight: 700 }}>
                                {ticket.latestFillLevel}%
                              </Typography>
                            </Box>
                            <LinearProgress
                              variant="determinate"
                              value={ticket.latestFillLevel}
                              sx={{
                                height: 6,
                                borderRadius: 3,
                                '& .MuiLinearProgress-bar': {
                                  backgroundColor:
                                    ticket.latestFillLevel >= 90 ? 'error.main' : 'success.main',
                                },
                              }}
                            />
                          </Box>
                        ) : (
                          <Typography variant="caption" color="text.secondary">
                            --
                          </Typography>
                        )}
                      </TableCell>

                      <TableCell>
                        <Chip
                          label={TICKET_STATUS_LABELS[ticket.status] || ticket.status}
                          size="small"
                          sx={{
                            backgroundColor: `${statusColor}20`,
                            color: statusColor,
                            fontWeight: 700,
                            border: `1px solid ${statusColor}50`,
                          }}
                        />
                      </TableCell>

                      <TableCell>
                        {ticket.assignedVehicleId ? (
                          <Typography variant="caption" sx={{ fontWeight: 600, display: 'block' }}>
                            {ticket.assignedVehicleId} • {ticket.assignedDriverId || 'Chưa nhận'}
                          </Typography>
                        ) : (
                          <Typography variant="caption" color="text.secondary">
                            Chưa phân công
                          </Typography>
                        )}
                      </TableCell>

                      <TableCell>
                        <Typography
                          variant="caption"
                          sx={{
                            color: isOverdue ? 'error.main' : 'text.primary',
                            fontWeight: isOverdue ? 700 : 500,
                          }}
                        >
                          {new Date(ticket.deadline).toLocaleTimeString('vi-VN', {
                            hour: '2-digit',
                            minute: '2-digit',
                            day: '2-digit',
                            month: '2-digit',
                          })}
                        </Typography>
                      </TableCell>

                      <TableCell align="right">
                        <IconButton
                          color="primary"
                          size="small"
                          onClick={() => navigate(`/tickets/${ticket.id}`, { state: { ticket } })}
                        >
                          <ArrowForwardIcon fontSize="small" />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </Paper>
        )}

        {filteredTickets.length === 0 && (
          <Paper
            elevation={0}
            sx={{
              p: 6,
              textAlign: 'center',
              borderRadius: 2,
              border: '1px dashed',
              borderColor: 'divider',
              mt: 2,
            }}
          >
            <Typography variant="body1" color="text.secondary" sx={{ fontWeight: 600 }}>
              Không tìm thấy phiếu việc nào phù hợp với bộ lọc.
            </Typography>
          </Paper>
        )}

        {/* Thông báo tương tác */}
        <Snackbar
          open={Boolean(snackbarMessage)}
          autoHideDuration={4000}
          onClose={() => setSnackbarMessage('')}
          message={snackbarMessage}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        />
      </Box>
    </PageLayout>
  );
};

export default TicketListPage;

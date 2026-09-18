import { useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import {
  Box,
  Typography,
  Grid,
  Paper,
  Button,
  Chip,
  Stack,
  IconButton,
  Card,
  CardContent,
  Divider,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import AssignmentTurnedInIcon from '@mui/icons-material/AssignmentTurnedIn';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import ReplyIcon from '@mui/icons-material/Reply';

import PageLayout from '../../../common/components/PageLayout';
import OperationsMenu from '../../common/OperationsMenu';
import {
  TICKET_STATUS,
  TICKET_STATUS_LABELS,
  TICKET_STATUS_COLORS,
  TICKET_TYPE_LABELS,
  TICKET_PRIORITY_LABELS,
} from '../../../contracts/ticketStatus';
import { TicketStateMachineService } from '../services/TicketStateMachineService';
import TicketTimeline from '../components/TicketTimeline';
import EvidenceViewer from '../components/EvidenceViewer';
import ExceptionModal from '../components/ExceptionModal';

const TicketDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  // Nhận dữ liệu ticket từ location.state hoặc khởi tạo mặc định bằng lazy state
  const [ticket, setTicket] = useState(() => {
    if (location.state?.ticket) {
      return location.state.ticket;
    }
    const now = new Date();
    return {
      id: id || 'TCK-20260917-001',
      binId: 'BIN-101',
      householdId: 'HH-8012',
      type: 'IOT_OVERFLOW',
      status: TICKET_STATUS.PENDING_PLAN,
      priority: 'HIGH',
      lat: 10.776889,
      lng: 106.700806,
      address: '128 Lê Lợi, Phường Bến Thành, Quận 1, TP.HCM',
      createdAt: now.toISOString(),
      deadline: new Date(now.getTime() + 4 * 3600 * 1000).toISOString(),
      estimatedKg: 35,
      latestFillLevel: 92,
      latestOdorLevel: 45,
      assignedVehicleId: null,
      assignedDriverId: null,
      evidence: {
        beforePhotoUrl:
          'https://images.unsplash.com/photo-1532996122724-e3c354a0b15b?w=500&auto=format&fit=crop',
        afterPhotoUrl:
          'https://images.unsplash.com/photo-1503596476-1c12a8ba09a9?w=500&auto=format&fit=crop',
        submittedAt: null,
        inspectedBy: null,
        note: '',
      },
      history: [
        {
          timestamp: now.toISOString(),
          action: 'TICKET_CREATED',
          performedBy: 'Hệ thống IoT Telemetry',
          details: 'Cảm biến phát hiện mức đầy vượt ngưỡng 90%',
        },
      ],
      mergedEvents: [],
    };
  });

  const [exceptionModalOpen, setExceptionModalOpen] = useState(false);
  const [exceptionMode, setExceptionMode] = useState('RESOLVE'); // 'RAISE' hoặc 'RESOLVE'

  const statusColor = TICKET_STATUS_COLORS[ticket.status] || '#64748b';

  // Hàm chuyển trạng thái thông qua Service
  const handleTransition = (targetStatus, options = {}) => {
    try {
      const updated = TicketStateMachineService.transition(ticket, targetStatus, options);
      setTicket(updated);
    } catch (err) {
      alert(err.message);
    }
  };

  // Mở modal báo ngoại lệ
  const handleOpenRaiseException = () => {
    setExceptionMode('RAISE');
    setExceptionModalOpen(true);
  };

  // Mở modal khôi phục ngoại lệ
  const handleOpenResolveException = () => {
    setExceptionMode('RESOLVE');
    setExceptionModalOpen(true);
  };

  // Xử lý submit từ modal ngoại lệ
  const handleExceptionSubmit = ({ reason, resolutionAction, targetStatus, resolutionNotes }) => {
    if (exceptionMode === 'RAISE') {
      handleTransition(TICKET_STATUS.EXCEPTION, {
        performedBy: 'Tài xế / Điều phối viên',
        reason,
      });
    } else {
      handleTransition(targetStatus || TICKET_STATUS.PENDING_PLAN, {
        performedBy: 'Cấp Quản lý',
        resolutionAction,
        resolutionNotes,
      });
    }
  };

  // Nghiệm thu đạt (Trang 04 PDF: Nghiệm thu tại điểm)
  const handleApproveInspection = ({ note }) => {
    handleTransition(TICKET_STATUS.COMPLETED, {
      performedBy: 'Nguyễn Văn Quản Lý (Nghiệm thu)',
      additionalData: {
        evidence: {
          ...ticket.evidence,
          inspectedBy: 'Nguyễn Văn Quản Lý',
          inspectedAt: new Date().toISOString(),
          note,
        },
      },
    });
  };

  // Nghiệm thu không đạt
  const handleRejectInspection = ({ reason }) => {
    handleTransition(TICKET_STATUS.EXCEPTION, {
      performedBy: 'Nguyễn Văn Quản Lý (Nghiệm thu)',
      reason: `Nghiệm thu không đạt: ${reason}`,
    });
  };

  return (
    <PageLayout menu={<OperationsMenu />} breadcrumbs={['Quản Lý Phiếu Việc', ticket.id]}>
      <Box sx={{ p: { xs: 2, md: 3 } }}>
        {/* Header Bar */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2.5 }}>
          <IconButton
            onClick={() => navigate('/tickets')}
            sx={{ border: '1px solid', borderColor: 'divider' }}
          >
            <ArrowBackIcon />
          </IconButton>
          <Box>
            <Stack direction="row" spacing={1.5} alignItems="center" flexWrap="wrap">
              <Typography variant="h5" sx={{ fontWeight: 800 }}>
                Phiếu việc: {ticket.id}
              </Typography>
              <Chip
                label={TICKET_STATUS_LABELS[ticket.status] || ticket.status}
                sx={{
                  backgroundColor: `${statusColor}20`,
                  color: statusColor,
                  fontWeight: 800,
                  border: `1px solid ${statusColor}50`,
                }}
              />
              <Chip
                label={TICKET_TYPE_LABELS[ticket.type] || ticket.type}
                variant="outlined"
                size="small"
                sx={{ fontWeight: 600 }}
              />
              <Chip
                label={`Ưu tiên: ${TICKET_PRIORITY_LABELS[ticket.priority] || ticket.priority}`}
                color={
                  ticket.priority === 'CRITICAL'
                    ? 'error'
                    : ticket.priority === 'HIGH'
                      ? 'warning'
                      : 'default'
                }
                size="small"
                sx={{ fontWeight: 700 }}
              />
            </Stack>
            <Typography variant="caption" color="text.secondary">
              Tạo lúc: {new Date(ticket.createdAt).toLocaleString('vi-VN')} • Hạn xử lý:{' '}
              {new Date(ticket.deadline).toLocaleString('vi-VN')}
            </Typography>
          </Box>
        </Box>

        {/* Action Bar: Các nút chuyển bước của State Machine */}
        <Paper
          elevation={1}
          sx={{
            p: 2,
            mb: 3,
            borderRadius: 2,
          }}
        >
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: 1.5,
            }}
          >
            <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
              Thao tác quy trình (State Machine):
            </Typography>

            <Stack direction="row" spacing={1} flexWrap="wrap">
              {/* Chờ lập kế hoạch -> Chờ duyệt */}
              {ticket.status === TICKET_STATUS.PENDING_PLAN && (
                <Button
                  variant="contained"
                  size="small"
                  color="primary"
                  startIcon={<PlayArrowIcon />}
                  onClick={() =>
                    handleTransition(TICKET_STATUS.AWAITING_APPROVAL, {
                      performedBy: 'Hệ thống VRP Optimization',
                      details: 'Đã hoàn tất tính toán tuyến đường tối ưu',
                    })
                  }
                  sx={{ textTransform: 'none', fontWeight: 700 }}
                >
                  1. Lập phương án tuyến ➔ Chờ duyệt
                </Button>
              )}

              {/* Chờ duyệt -> Đã giao */}
              {ticket.status === TICKET_STATUS.AWAITING_APPROVAL && (
                <>
                  <Button
                    variant="outlined"
                    color="warning"
                    size="small"
                    startIcon={<ReplyIcon />}
                    onClick={() =>
                      handleTransition(TICKET_STATUS.PENDING_PLAN, {
                        performedBy: 'Điều phối viên',
                        reason: 'Từ chối phương án để điều chỉnh lại ràng buộc',
                      })
                    }
                    sx={{ textTransform: 'none', fontWeight: 700 }}
                  >
                    Từ chối phương án (Lập lại)
                  </Button>

                  <Button
                    variant="contained"
                    size="small"
                    color="primary"
                    startIcon={<AssignmentTurnedInIcon />}
                    onClick={() =>
                      handleTransition(TICKET_STATUS.ASSIGNED, {
                        performedBy: 'Điều phối viên',
                        additionalData: {
                          assignedVehicleId: 'VEH-01',
                          assignedDriverId: 'DRV-05',
                        },
                      })
                    }
                    sx={{ textTransform: 'none', fontWeight: 700 }}
                  >
                    2. Duyệt & Giao việc cho xe VEH-01
                  </Button>
                </>
              )}

              {/* Đã giao -> Đang thực hiện */}
              {ticket.status === TICKET_STATUS.ASSIGNED && (
                <Button
                  variant="contained"
                  size="small"
                  color="info"
                  startIcon={<LocalShippingIcon />}
                  onClick={() =>
                    handleTransition(TICKET_STATUS.IN_PROGRESS, {
                      performedBy: 'Tài xế DRV-05',
                      details: 'Tài xế xác nhận nhận việc và bắt đầu di chuyển',
                    })
                  }
                  sx={{ textTransform: 'none', fontWeight: 700 }}
                >
                  3. Tài xế nhận việc ➔ Đang thực hiện
                </Button>
              )}

              {/* Đang thực hiện -> Chờ nghiệm thu */}
              {ticket.status === TICKET_STATUS.IN_PROGRESS && (
                <Button
                  variant="contained"
                  size="small"
                  color="warning"
                  startIcon={<CheckCircleIcon />}
                  onClick={() =>
                    handleTransition(TICKET_STATUS.AWAITING_INSPECTION, {
                      performedBy: 'Tài xế DRV-05',
                      details: 'Đã hoàn thành thu gom tại điểm và gửi ảnh chụp hiện trường',
                    })
                  }
                  sx={{ textTransform: 'none', fontWeight: 700 }}
                >
                  4. Gửi bằng chứng ➔ Chờ nghiệm thu
                </Button>
              )}

              {/* Nút xử lý Ngoại lệ (Khi đang ở EXCEPTION) */}
              {ticket.status === TICKET_STATUS.EXCEPTION && (
                <Button
                  variant="contained"
                  size="small"
                  color="error"
                  startIcon={<WarningAmberIcon />}
                  onClick={handleOpenResolveException}
                  sx={{ textTransform: 'none', fontWeight: 700 }}
                >
                  Xử lý & Khôi phục Ngoại lệ (Quản lý)
                </Button>
              )}

              {/* Nút báo ngoại lệ (luôn sẵn sàng nếu chưa hoàn thành hoặc chưa ở ngoại lệ) */}
              {ticket.status !== TICKET_STATUS.COMPLETED &&
                ticket.status !== TICKET_STATUS.EXCEPTION && (
                  <Button
                    variant="outlined"
                    color="error"
                    size="small"
                    startIcon={<WarningAmberIcon />}
                    onClick={handleOpenRaiseException}
                    sx={{ textTransform: 'none', fontWeight: 700 }}
                  >
                    Báo Ngoại lệ (Sự cố)
                  </Button>
                )}
            </Stack>
          </Box>
        </Paper>

        {/* Nội dung chi tiết: Cột trái Thông tin & Nghiệm thu, Cột phải Timeline */}
        <Grid container spacing={3}>
          {/* Cột Trái: Chi tiết điểm gom & Bằng chứng nghiệm thu */}
          <Grid item xs={12} md={7}>
            <Stack spacing={3}>
              {/* Card thông tin điểm thu gom */}
              <Card elevation={1} sx={{ borderRadius: 2 }}>
                <CardContent sx={{ p: 2.5 }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 800, mb: 2 }}>
                    📍 Thông Tin Điểm Thu Gom & Thùng Rác
                  </Typography>

                  <Grid container spacing={2}>
                    <Grid item xs={6}>
                      <Typography variant="caption" color="text.secondary">
                        Mã Thùng (Bin ID):
                      </Typography>
                      <Typography variant="body2" sx={{ fontWeight: 700 }}>
                        {ticket.binId}
                      </Typography>
                    </Grid>

                    <Grid item xs={6}>
                      <Typography variant="caption" color="text.secondary">
                        Mã Hộ Gia Đình (Household ID):
                      </Typography>
                      <Typography variant="body2" sx={{ fontWeight: 700 }}>
                        {ticket.householdId || 'Công cộng'}
                      </Typography>
                    </Grid>

                    <Grid item xs={12}>
                      <Typography variant="caption" color="text.secondary">
                        Địa chỉ hiện trường:
                      </Typography>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {ticket.address}
                      </Typography>
                    </Grid>

                    <Grid item xs={4}>
                      <Typography variant="caption" color="text.secondary">
                        Mức đầy cảm biến:
                      </Typography>
                      <Typography
                        variant="body2"
                        sx={{
                          fontWeight: 800,
                          color: ticket.latestFillLevel >= 90 ? 'error.main' : 'success.main',
                        }}
                      >
                        {ticket.latestFillLevel !== undefined ? `${ticket.latestFillLevel}%` : '--'}
                      </Typography>
                    </Grid>

                    <Grid item xs={4}>
                      <Typography variant="caption" color="text.secondary">
                        Chỉ số mùi hôi:
                      </Typography>
                      <Typography variant="body2" sx={{ fontWeight: 700 }}>
                        {ticket.latestOdorLevel !== undefined
                          ? `${ticket.latestOdorLevel} ppm`
                          : '--'}
                      </Typography>
                    </Grid>

                    <Grid item xs={4}>
                      <Typography variant="caption" color="text.secondary">
                        Khối lượng ước tính:
                      </Typography>
                      <Typography variant="body2" sx={{ fontWeight: 700 }}>
                        {ticket.estimatedKg} Kg
                      </Typography>
                    </Grid>
                  </Grid>

                  <Divider sx={{ my: 2 }} />

                  {/* Thông tin phân công */}
                  <Typography variant="subtitle2" sx={{ fontWeight: 800, mb: 1.5 }}>
                    🚛 Phân Công Phương Tiện & Tài Xế
                  </Typography>

                  <Grid container spacing={2}>
                    <Grid item xs={6}>
                      <Typography variant="caption" color="text.secondary">
                        Phương tiện đảm trách:
                      </Typography>
                      <Typography variant="body2" sx={{ fontWeight: 700 }}>
                        {ticket.assignedVehicleId || 'Chưa phân công'}
                      </Typography>
                    </Grid>

                    <Grid item xs={6}>
                      <Typography variant="caption" color="text.secondary">
                        Tài xế thực hiện:
                      </Typography>
                      <Typography variant="body2" sx={{ fontWeight: 700 }}>
                        {ticket.assignedDriverId || 'Chưa phân công'}
                      </Typography>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>

              {/* Card Nghiệm thu Hiện trường (Trang 04 PDF) */}
              <EvidenceViewer
                ticket={ticket}
                onApprove={handleApproveInspection}
                onReject={handleRejectInspection}
              />
            </Stack>
          </Grid>

          {/* Cột Phải: Lịch sử vòng đời & Ghi nhận Chống trùng */}
          <Grid item xs={12} md={5}>
            <TicketTimeline ticket={ticket} />
          </Grid>
        </Grid>

        {/* Modal Xử lý Ngoại lệ */}
        <ExceptionModal
          open={exceptionModalOpen}
          mode={exceptionMode}
          currentTicket={ticket}
          onClose={() => setExceptionModalOpen(false)}
          onSubmit={handleExceptionSubmit}
        />
      </Box>
    </PageLayout>
  );
};

export default TicketDetailPage;

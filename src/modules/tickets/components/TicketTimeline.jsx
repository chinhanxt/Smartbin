import {
  Box,
  Typography,
  Stepper,
  Step,
  StepLabel,
  Paper,
  Alert,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Chip,
  Divider,
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import RadioButtonUncheckedIcon from '@mui/icons-material/RadioButtonUnchecked';
import WarningIcon from '@mui/icons-material/Warning';
import HistoryIcon from '@mui/icons-material/History';
import MergeTypeIcon from '@mui/icons-material/MergeType';
import EditLocationIcon from '@mui/icons-material/EditLocation';
import { TICKET_STATUS, TICKET_STATUS_LABELS } from '../../../contracts/ticketStatus';

const ORDERED_STEPS = [
  { key: TICKET_STATUS.PENDING_PLAN, label: '1. Chờ lập kế hoạch' },
  { key: TICKET_STATUS.AWAITING_APPROVAL, label: '2. Chờ duyệt' },
  { key: TICKET_STATUS.ASSIGNED, label: '3. Đã giao' },
  { key: TICKET_STATUS.IN_PROGRESS, label: '4. Đang thực hiện' },
  { key: TICKET_STATUS.AWAITING_INSPECTION, label: '5. Chờ nghiệm thu' },
  { key: TICKET_STATUS.COMPLETED, label: '6. Hoàn thành' },
];

const TicketTimeline = ({ ticket }) => {
  const currentStepIndex = ORDERED_STEPS.findIndex((s) => s.key === ticket.status);
  const isException = ticket.status === TICKET_STATUS.EXCEPTION;

  // Lấy lịch sử sự kiện (sắp xếp mới nhất trước)
  const sortedHistory = [...(ticket.history || [])].reverse();

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      {/* Cảnh báo nếu ở trạng thái Ngoại lệ */}
      {isException && (
        <Alert
          severity="error"
          variant="filled"
          icon={<WarningIcon fontSize="inherit" />}
          sx={{ borderRadius: 2.5, fontWeight: 600 }}
        >
          <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>
            Phiếu đang ở trạng thái NGOẠI LỆ (EXCEPTION)
          </Typography>
          <Typography variant="body2" sx={{ mt: 0.5 }}>
            {ticket.history?.findLast((h) => h.reason)?.reason ||
              'Đang chờ cấp quản lý xem xét và chỉ định bước quay lại quy trình.'}
          </Typography>
        </Alert>
      )}

      {/* Máy trạng thái trực quan 6 bước */}
      <Paper
        elevation={0}
        sx={{ p: 3, borderRadius: 3, border: '1px solid #e2e8f0', backgroundColor: '#ffffff' }}
      >
        <Typography variant="subtitle1" sx={{ fontWeight: 800, mb: 2, color: '#1e293b' }}>
          Tiến trình Vòng đời Phiếu việc (6 Trạng thái chuẩn)
        </Typography>

        <Stepper
          activeStep={isException ? -1 : currentStepIndex}
          alternativeLabel
          sx={{
            '& .MuiStepLabel-label': {
              fontSize: '0.8rem',
              fontWeight: 600,
              mt: 1,
            },
            '& .MuiStepIcon-root.Mui-active': {
              color: '#059669',
            },
            '& .MuiStepIcon-root.Mui-completed': {
              color: '#10b981',
            },
          }}
        >
          {ORDERED_STEPS.map((step, index) => {
            const isDone = currentStepIndex > index || ticket.status === TICKET_STATUS.COMPLETED;
            const isCurrent = !isException && currentStepIndex === index;

            return (
              <Step key={step.key} completed={isDone}>
                <StepLabel
                  StepIconComponent={() => {
                    if (isDone) {
                      return <CheckCircleIcon sx={{ color: '#10b981', fontSize: 24 }} />;
                    }
                    if (isCurrent) {
                      return (
                        <Box
                          sx={{
                            width: 24,
                            height: 24,
                            borderRadius: '50%',
                            backgroundColor: '#059669',
                            color: '#ffffff',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontWeight: 700,
                            fontSize: '0.75rem',
                          }}
                        >
                          {index + 1}
                        </Box>
                      );
                    }
                    return <RadioButtonUncheckedIcon sx={{ color: '#cbd5e1', fontSize: 24 }} />;
                  }}
                >
                  <Typography
                    variant="caption"
                    sx={{
                      fontWeight: isCurrent ? 800 : 600,
                      color: isCurrent ? '#059669' : '#64748b',
                    }}
                  >
                    {step.label}
                  </Typography>
                </StepLabel>
              </Step>
            );
          })}
        </Stepper>
      </Paper>

      {/* Nhật ký thao tác & Dữ liệu gộp chống trùng */}
      <Paper
        elevation={0}
        sx={{ p: 3, borderRadius: 3, border: '1px solid #e2e8f0', backgroundColor: '#ffffff' }}
      >
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <HistoryIcon sx={{ color: '#059669' }} />
            <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#1e293b' }}>
              Nhật ký Lịch sử & Thao tác (Timeline)
            </Typography>
          </Box>
          <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 600 }}>
            Tổng số: {sortedHistory.length} sự kiện
          </Typography>
        </Box>

        <List disablePadding>
          {sortedHistory.map((entry, idx) => {
            const isMerged = entry.action === 'DEDUPLICATION_MERGED';
            const isExc = entry.action.includes('EXCEPTION');

            return (
              <Box key={idx}>
                <ListItem
                  alignItems="flex-start"
                  sx={{
                    px: 1.5,
                    py: 1.2,
                    borderRadius: 2,
                    backgroundColor: isMerged ? '#f0fdf4' : isExc ? '#fef2f2' : 'transparent',
                    mb: 1,
                  }}
                >
                  <ListItemIcon sx={{ minWidth: 36, mt: 0.5 }}>
                    {isMerged ? (
                      <MergeTypeIcon sx={{ color: '#16a34a', fontSize: 20 }} />
                    ) : isExc ? (
                      <WarningIcon sx={{ color: '#dc2626', fontSize: 20 }} />
                    ) : (
                      <EditLocationIcon sx={{ color: '#0284c7', fontSize: 20 }} />
                    )}
                  </ListItemIcon>

                  <ListItemText
                    primary={
                      <Box
                        sx={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                        }}
                      >
                        <Typography variant="body2" sx={{ fontWeight: 700, color: '#1e293b' }}>
                          {entry.action}
                        </Typography>
                        <Typography variant="caption" sx={{ color: '#94a3b8' }}>
                          {new Date(entry.timestamp).toLocaleString('vi-VN')}
                        </Typography>
                      </Box>
                    }
                    secondary={
                      <Box sx={{ mt: 0.5 }}>
                        <Typography variant="body2" sx={{ color: '#475569' }}>
                          {entry.details || entry.reason || 'Thực hiện chuyển bước quy trình'}
                        </Typography>
                        <Box sx={{ display: 'flex', gap: 1, mt: 0.5, alignItems: 'center' }}>
                          <Chip
                            label={`Thực hiện bởi: ${entry.performedBy}`}
                            size="small"
                            sx={{ height: 20, fontSize: '0.7rem', backgroundColor: '#f1f5f9' }}
                          />
                          {entry.fromStatus && entry.toStatus && (
                            <Chip
                              label={`${TICKET_STATUS_LABELS[entry.fromStatus]} ➔ ${TICKET_STATUS_LABELS[entry.toStatus]}`}
                              size="small"
                              variant="outlined"
                              sx={{ height: 20, fontSize: '0.7rem' }}
                            />
                          )}
                        </Box>
                      </Box>
                    }
                  />
                </ListItem>
                {idx < sortedHistory.length - 1 && (
                  <Divider sx={{ my: 0.5, borderColor: '#f1f5f9' }} />
                )}
              </Box>
            );
          })}
        </List>
      </Paper>
    </Box>
  );
};

export default TicketTimeline;

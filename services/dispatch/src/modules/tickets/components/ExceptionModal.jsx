import { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  MenuItem,
  Typography,
  Box,
  Alert,
} from '@mui/material';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import { TICKET_STATUS, TICKET_STATUS_LABELS } from '../../../contracts/ticketStatus';

const COMMON_REASONS = [
  'Xe gặp sự cố hỏng hóc kỹ thuật giữa đường',
  'Ngõ hẻm bị rào chắn / công trình ngầm không thể tiếp cận',
  'Tài xế từ chối nhiệm vụ do phát sinh khẩn cấp / hết ca',
  'Cảm biến báo mức ảo hoặc mất kết nối mạng',
  'Bằng chứng hình ảnh nghiệm thu mờ / không đúng hiện trường',
  'Khác (nhập chi tiết bên dưới)',
];

const ExceptionModal = ({ open, onClose, onSubmit, mode = 'RESOLVE' }) => {
  const [selectedReason, setSelectedReason] = useState(COMMON_REASONS[0]);
  const [customReason, setCustomReason] = useState('');
  const [targetStep, setTargetStep] = useState(TICKET_STATUS.PENDING_PLAN);
  const [resolverName, setResolverName] = useState('Nguyễn Văn Quản Lý');

  const finalReason =
    selectedReason === 'Khác (nhập chi tiết bên dưới)'
      ? customReason
      : `${selectedReason} - ${customReason}`.trim();

  const handleConfirm = () => {
    if (!finalReason.trim()) {
      alert('Vui lòng nhập lý do ngoại lệ chi tiết!');
      return;
    }

    onSubmit({
      reason: finalReason,
      returnToStatus: targetStep,
      resolvedBy: resolverName,
    });
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{ sx: { borderRadius: 3 } }}
    >
      <DialogTitle sx={{ pb: 1, display: 'flex', alignItems: 'center', gap: 1, color: '#dc2626' }}>
        <WarningAmberIcon />
        <Typography variant="h6" sx={{ fontWeight: 800 }}>
          {mode === 'RAISE' ? 'Khai báo Ngoại lệ (EXCEPTION)' : 'Xử lý & Khôi phục Ngoại lệ'}
        </Typography>
      </DialogTitle>

      <DialogContent dividers sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, pt: 2 }}>
        <Alert severity="warning" sx={{ borderRadius: 2 }}>
          {mode === 'RAISE'
            ? 'Chuyển phiếu sang trạng thái Ngoại lệ để tạm dừng điều phối và yêu cầu quản lý thẩm định.'
            : 'Người có thẩm quyền quyết định bước quy trình đưa phiếu trở lại, đồng thời hệ thống bảo lưu toàn bộ nhật ký sự cố.'}
        </Alert>

        <Box>
          <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 0.5, color: '#334155' }}>
            Lý do / Phân loại sự cố:
          </Typography>
          <TextField
            select
            fullWidth
            size="small"
            value={selectedReason}
            onChange={(e) => setSelectedReason(e.target.value)}
          >
            {COMMON_REASONS.map((r) => (
              <MenuItem key={r} value={r}>
                {r}
              </MenuItem>
            ))}
          </TextField>
        </Box>

        <Box>
          <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 0.5, color: '#334155' }}>
            Chi tiết ghi chú hiện trường:
          </Typography>
          <TextField
            fullWidth
            multiline
            rows={3}
            size="small"
            placeholder="Mô tả cụ thể diễn biến, biển số xe hỏng, hoặc giải pháp đề xuất..."
            value={customReason}
            onChange={(e) => setCustomReason(e.target.value)}
          />
        </Box>

        {mode === 'RESOLVE' && (
          <Box>
            <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 0.5, color: '#334155' }}>
              Quyết định đưa phiếu quay lại bước:
            </Typography>
            <TextField
              select
              fullWidth
              size="small"
              value={targetStep}
              onChange={(e) => setTargetStep(e.target.value)}
            >
              <MenuItem value={TICKET_STATUS.PENDING_PLAN}>
                {TICKET_STATUS_LABELS[TICKET_STATUS.PENDING_PLAN]} (Lập lại phương án từ đầu)
              </MenuItem>
              <MenuItem value={TICKET_STATUS.ASSIGNED}>
                {TICKET_STATUS_LABELS[TICKET_STATUS.ASSIGNED]} (Phân công lại xe/tài xế khác)
              </MenuItem>
              <MenuItem value={TICKET_STATUS.IN_PROGRESS}>
                {TICKET_STATUS_LABELS[TICKET_STATUS.IN_PROGRESS]} (Tiếp tục thực hiện điểm gom)
              </MenuItem>
              <MenuItem value={TICKET_STATUS.COMPLETED}>
                {TICKET_STATUS_LABELS[TICKET_STATUS.COMPLETED]} (Duyệt đóng phiếu ngoại lệ có căn
                cứ)
              </MenuItem>
            </TextField>
          </Box>
        )}

        <Box>
          <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 0.5, color: '#334155' }}>
            Người thẩm định / quyết định:
          </Typography>
          <TextField
            fullWidth
            size="small"
            value={resolverName}
            onChange={(e) => setResolverName(e.target.value)}
          />
        </Box>
      </DialogContent>

      <DialogActions sx={{ p: 2.5 }}>
        <Button onClick={onClose} sx={{ textTransform: 'none', fontWeight: 600 }}>
          Hủy bỏ
        </Button>
        <Button
          variant="contained"
          color={mode === 'RAISE' ? 'error' : 'primary'}
          onClick={handleConfirm}
          sx={{
            textTransform: 'none',
            fontWeight: 700,
            borderRadius: 2,
            px: 3,
            backgroundColor: mode === 'RAISE' ? '#dc2626' : '#059669',
            '&:hover': {
              backgroundColor: mode === 'RAISE' ? '#b91c1c' : '#047857',
            },
          }}
        >
          {mode === 'RAISE' ? 'Xác nhận Báo Ngoại Lệ' : 'Khôi phục Phiếu'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ExceptionModal;

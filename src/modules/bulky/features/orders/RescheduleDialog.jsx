import { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Typography,
  Alert,
  Stack,
  CircularProgress,
} from '@mui/material';

export function RescheduleDialog({
  open,
  onClose,
  currentDate,
  onConfirmReschedule,
  isLoading = false,
}) {
  const [newDate, setNewDate] = useState('');
  const [reason, setReason] = useState('');
  const [error, setError] = useState(null);

  const handleSubmit = async () => {
    if (!newDate) {
      setError('Vui lòng chọn ngày thu gom mới');
      return;
    }
    setError(null);
    if (onConfirmReschedule) {
      await onConfirmReschedule({ requestedDate: newDate, reason });
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Đổi Ngày Thu Gom Rác Cồng Kềnh</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ mt: 1 }}>
          <Typography variant="body2">
            Ngày thu gom hiện tại: <strong>{currentDate}</strong>
          </Typography>

          <Alert severity="info">
            Chính sách đổi ngày: Trước 24h so với giờ hẹn, bạn có thể chọn ngày phục vụ mới còn chỗ
            mà không mất thêm phí (trừ khi thay đổi địa điểm hoặc phát sinh đồ). Sau 24h, yêu cầu sẽ
            cần nhân viên hỗ trợ xem xét.
          </Alert>

          {error && <Alert severity="error">{error}</Alert>}

          <TextField
            type="date"
            label="Ngày mong muốn mới"
            slotProps={{ inputLabel: { shrink: true } }}
            fullWidth
            value={newDate}
            onChange={(e) => setNewDate(e.target.value)}
          />

          <TextField
            label="Lý do thay đổi (không bắt buộc)"
            multiline
            rows={2}
            fullWidth
            value={reason}
            onChange={(e) => setReason(e.target.value)}
          />
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={isLoading}>
          Hủy bỏ
        </Button>
        <Button
          variant="contained"
          onClick={handleSubmit}
          disabled={isLoading || !newDate}
          startIcon={isLoading ? <CircularProgress size={16} color="inherit" /> : null}
        >
          Xác nhận đổi ngày
        </Button>
      </DialogActions>
    </Dialog>
  );
}

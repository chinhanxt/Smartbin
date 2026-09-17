import { useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Button,
  TextField,
  FormControlLabel,
  Checkbox,
  Alert,
  Chip,
  Divider,
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import HighlightOffIcon from '@mui/icons-material/HighlightOff';
import PhotoCameraIcon from '@mui/icons-material/PhotoCamera';
import VerifiedIcon from '@mui/icons-material/Verified';

const EvidenceViewer = ({ ticket, onApprove, onReject, isReadOnly = false }) => {
  const evidence = ticket.evidence || {};
  const [chkBinMatch, setChkBinMatch] = useState(false);
  const [chkCleanSurroundings, setChkCleanSurroundings] = useState(false);
  const [chkSensorReset, setChkSensorReset] = useState(false);
  const [inspectorNote, setInspectorNote] = useState('');

  const allChecksPassed = chkBinMatch && chkCleanSurroundings && chkSensorReset;
  const isCompleted = ticket.status === 'COMPLETED';

  const handleApprove = () => {
    onApprove({
      note: inspectorNote || 'Nghiệm thu đạt yêu cầu tại hiện trường',
      inspectedAt: new Date().toISOString(),
    });
  };

  const handleReject = () => {
    onReject({
      reason: inspectorNote || 'Bằng chứng hiện trường chưa đạt tiêu chuẩn nghiệm thu',
    });
  };

  return (
    <Paper
      elevation={0}
      sx={{
        p: 3,
        borderRadius: 3,
        border: '1px solid #e2e8f0',
        backgroundColor: '#ffffff',
      }}
    >
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <PhotoCameraIcon sx={{ color: '#059669' }} />
          <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#1e293b' }}>
            Hồ sơ Bằng chứng & Nghiệm thu Hiện trường (Trang 04 PDF)
          </Typography>
        </Box>
        {isCompleted && (
          <Chip
            icon={<VerifiedIcon />}
            label="Đã Nghiệm Thu Đạt"
            color="success"
            size="small"
            sx={{ fontWeight: 700 }}
          />
        )}
      </Box>

      {/* Hiển thị 2 ảnh Trước - Sau */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6}>
          <Box
            sx={{
              p: 1.5,
              borderRadius: 2,
              border: '1px dashed #cbd5e1',
              backgroundColor: '#f8fafc',
              textAlign: 'center',
            }}
          >
            <Typography
              variant="caption"
              sx={{ fontWeight: 700, color: '#475569', display: 'block', mb: 1 }}
            >
              ẢNH TRƯỚC KHI THU GOM
            </Typography>
            {evidence.beforePhotoUrl ? (
              <Box
                component="img"
                src={evidence.beforePhotoUrl}
                alt="Trước khi thu gom"
                sx={{
                  width: '100%',
                  height: 180,
                  objectFit: 'cover',
                  borderRadius: 1.5,
                  border: '1px solid #e2e8f0',
                }}
              />
            ) : (
              <Box
                sx={{
                  height: 180,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#94a3b8',
                }}
              >
                Chưa có ảnh trước khi gom
              </Box>
            )}
          </Box>
        </Grid>

        <Grid item xs={12} sm={6}>
          <Box
            sx={{
              p: 1.5,
              borderRadius: 2,
              border: '1px dashed #cbd5e1',
              backgroundColor: '#f8fafc',
              textAlign: 'center',
            }}
          >
            <Typography
              variant="caption"
              sx={{ fontWeight: 700, color: '#475569', display: 'block', mb: 1 }}
            >
              ẢNH SAU KHI THU GOM
            </Typography>
            {evidence.afterPhotoUrl ? (
              <Box
                component="img"
                src={evidence.afterPhotoUrl}
                alt="Sau khi thu gom"
                sx={{
                  width: '100%',
                  height: 180,
                  objectFit: 'cover',
                  borderRadius: 1.5,
                  border: '1px solid #e2e8f0',
                }}
              />
            ) : (
              <Box
                sx={{
                  height: 180,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#94a3b8',
                }}
              >
                Chưa có ảnh sau khi gom
              </Box>
            )}
          </Box>
        </Grid>
      </Grid>

      {/* Ghi chú của tài xế */}
      {evidence.note && (
        <Box sx={{ mb: 2.5, p: 1.5, backgroundColor: '#f1f5f9', borderRadius: 2 }}>
          <Typography variant="caption" sx={{ fontWeight: 700, color: '#475569' }}>
            Ghi chú từ nhân viên hiện trường:
          </Typography>
          <Typography variant="body2" sx={{ color: '#334155', mt: 0.5 }}>
            {evidence.note}
          </Typography>
        </Box>
      )}

      <Divider sx={{ my: 2 }} />

      {/* Khung kiểm tra điều kiện nghiệm thu dành cho Quản lý / Điều phối */}
      {!isReadOnly && ticket.status === 'AWAITING_INSPECTION' && (
        <Box>
          <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1.5, color: '#1e293b' }}>
            Biên bản Kiểm tra Điều kiện Nghiệm thu:
          </Typography>

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5, mb: 2 }}>
            <FormControlLabel
              control={
                <Checkbox
                  checked={chkBinMatch}
                  onChange={(e) => setChkBinMatch(e.target.checked)}
                  color="success"
                />
              }
              label={
                <Typography variant="body2">
                  Đúng mã thùng ({ticket.binId}) và vị trí địa chỉ được phân công
                </Typography>
              }
            />

            <FormControlLabel
              control={
                <Checkbox
                  checked={chkCleanSurroundings}
                  onChange={(e) => setChkCleanSurroundings(e.target.checked)}
                  color="success"
                />
              }
              label={
                <Typography variant="body2">
                  Xung quanh thùng sạch sẽ, không còn rác tồn đọng hoặc rơi vãi
                </Typography>
              }
            />

            <FormControlLabel
              control={
                <Checkbox
                  checked={chkSensorReset}
                  onChange={(e) => setChkSensorReset(e.target.checked)}
                  color="success"
                />
              }
              label={
                <Typography variant="body2">
                  Số đo cảm biến sau thu gom đã giảm về ngưỡng an toàn (hoặc xác nhận ngoại lệ cảm
                  biến)
                </Typography>
              }
            />
          </Box>

          <TextField
            fullWidth
            size="small"
            label="Ghi chú thẩm định của Quản lý nghiệm thu"
            value={inspectorNote}
            onChange={(e) => setInspectorNote(e.target.value)}
            sx={{ mb: 2.5 }}
          />

          {!allChecksPassed && (
            <Alert severity="info" sx={{ mb: 2, borderRadius: 2 }}>
              Vui lòng xác nhận đủ cả 3 tiêu chí trên để kích hoạt nút duyệt nghiệm thu hoàn thành.
            </Alert>
          )}

          <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
            <Button
              variant="outlined"
              color="error"
              startIcon={<HighlightOffIcon />}
              onClick={handleReject}
              sx={{ textTransform: 'none', fontWeight: 700, borderRadius: 2 }}
            >
              Không đạt / Báo Ngoại lệ
            </Button>

            <Button
              variant="contained"
              color="success"
              startIcon={<CheckCircleIcon />}
              disabled={!allChecksPassed}
              onClick={handleApprove}
              sx={{
                textTransform: 'none',
                fontWeight: 700,
                borderRadius: 2,
                backgroundColor: '#059669',
                '&:hover': { backgroundColor: '#047857' },
              }}
            >
              Duyệt Nghiệm Thu (Đóng phiếu)
            </Button>
          </Box>
        </Box>
      )}
    </Paper>
  );
};

export default EvidenceViewer;

import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  Stack,
  Alert,
  CircularProgress,
} from '@mui/material';

export function PaymentSimulator({ onSimulate, isLoading = false }) {
  return (
    <Card variant="outlined" sx={{ p: 2, bgcolor: 'background.paper' }}>
      <CardContent>
        <Stack spacing={2}>
          <Box>
            <Typography variant="h6" color="primary">
              Mô Phỏng Cổng Thanh Toán Trực Tuyến
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Môi trường thử nghiệm Smartbin V2.5: Cho phép kiểm thử tức thì các kịch bản giao dịch
              cổng thanh toán VNPay/MoMo/ZaloPay.
            </Typography>
          </Box>

          <Alert severity="info">
            Chọn một trong các tình huống bên dưới để kiểm tra phản hồi của hệ thống:
          </Alert>

          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
            <Button
              variant="contained"
              color="success"
              fullWidth
              disabled={isLoading}
              onClick={() => onSimulate('SUCCESS')}
              startIcon={isLoading ? <CircularProgress size={16} color="inherit" /> : null}
            >
              Mô phỏng: Thành công
            </Button>
            <Button
              variant="outlined"
              color="error"
              fullWidth
              disabled={isLoading}
              onClick={() => onSimulate('FAILED')}
            >
              Mô phỏng: Thất bại
            </Button>
            <Button
              variant="outlined"
              color="warning"
              fullWidth
              disabled={isLoading}
              onClick={() => onSimulate('LATE_SUCCESS')}
            >
              Mô phỏng: Thanh toán muộn
            </Button>
          </Stack>
        </Stack>
      </CardContent>
    </Card>
  );
}

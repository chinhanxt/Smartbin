import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import {
  Container,
  Box,
  Typography,
  Card,
  CardContent,
  Alert,
  Stack,
  Divider,
  Button,
} from '@mui/material';
import { PaymentSimulator } from '../features/payment/PaymentSimulator.jsx';
import { LatePaymentReconciliation } from '../features/payment/LatePaymentReconciliation.jsx';
import { selectBulkyOrderById, selectCanManageBulky } from '../store/selectors.js';
import { ORDER_STATUS, PAYMENT_STATUS } from '../domain/constants.js';

export function BulkyPaymentPage({ thunks, onPaymentSuccess }) {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const canManage = useSelector(selectCanManageBulky);
  const order = useSelector((state) => selectBulkyOrderById(state, orderId));
  const paymentsById = useSelector((state) => state.bulky?.paymentsById || {});

  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);

  const formatVnd = (val) =>
    new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val || 0);

  const existingAttempt = Object.values(paymentsById).find((p) => p.orderId === orderId);
  const paymentAttemptId = existingAttempt?.paymentAttemptId || `pay-${orderId}`;
  const amountVnd = order?.acceptedQuote?.totalVnd || existingAttempt?.amountVnd || 0;

  const handleSimulate = async (result) => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      if (thunks?.simulatePaymentResult && dispatch) {
        const res = await dispatch(
          thunks.simulatePaymentResult({
            paymentAttemptId,
            result,
          }),
        );
        if (res?.order?.orderStatus === ORDER_STATUS.CONFIRMED && onPaymentSuccess) {
          onPaymentSuccess(res.order);
        }
      }
    } catch (err) {
      setErrorMessage(err.message || 'Mô phỏng thanh toán thất bại');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAcceptAlternative = async (date) => {
    setIsLoading(true);
    try {
      if (thunks?.acceptLatePaymentAlternative && dispatch) {
        await dispatch(thunks.acceptLatePaymentAlternative({ orderId, selectedDate: date }));
      }
    } catch (err) {
      setErrorMessage(err.message || 'Không thể chọn ngày thay thế');
    } finally {
      setIsLoading(false);
    }
  };

  const handleChooseRefund = async () => {
    setIsLoading(true);
    try {
      if (thunks?.chooseLatePaymentRefund && dispatch) {
        await dispatch(thunks.chooseLatePaymentRefund({ orderId }));
      }
    } catch (err) {
      setErrorMessage(err.message || 'Không thể yêu cầu hoàn tiền');
    } finally {
      setIsLoading(false);
    }
  };

  if (!canManage) {
    return (
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Alert severity="error">
          Bạn không có quyền quản lý thanh toán đơn này (Yêu cầu quyền MANAGE_BULKY_ORDERS).
        </Alert>
      </Container>
    );
  }

  if (!order) {
    return (
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Alert severity="info">Không tìm thấy đơn hàng cần thanh toán.</Alert>
      </Container>
    );
  }

  const isConfirmed =
    order.orderStatus === ORDER_STATUS.CONFIRMED && order.paymentStatus === PAYMENT_STATUS.SUCCESS;

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" component="h1" gutterBottom fontWeight="bold">
          Thanh Toán Dịch Vụ Thu Gom
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Mã đơn: <strong>{order.orderId}</strong> • Địa chỉ thu gom:{' '}
          {order.serviceLocation?.address}
        </Typography>
      </Box>

      {errorMessage && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {errorMessage}
        </Alert>
      )}

      {isConfirmed ? (
        <Card variant="outlined" sx={{ p: 3, textAlign: 'center', borderColor: 'success.main' }}>
          <CardContent>
            <Typography variant="h5" color="success.main" fontWeight="bold" gutterBottom>
              Xác Nhận & Thanh Toán Thành Công!
            </Typography>
            <Typography variant="body1" sx={{ mb: 2 }}>
              Đơn thu gom rác cồng kềnh đã được hệ thống xác nhận và lên lịch xe điều động (Phiên
              bản: v{order.confirmationVersion || 1}).
            </Typography>
            <Alert severity="success" sx={{ my: 2, textAlign: 'left' }}>
              <strong>Ngày thu gom dự kiến:</strong>{' '}
              {order.confirmedServiceWindow?.date || order.requestedDate}
              <br />
              <strong>Mã giao dịch thanh toán:</strong>{' '}
              {order.acceptedPayment?.transactionReference || 'TXN-SUCCESS'}
            </Alert>
            <Button
              variant="contained"
              size="large"
              onClick={() => navigate('/bulky/orders')}
              sx={{ mt: 2 }}
            >
              Xem Danh Sách Đơn Của Tôi
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Stack spacing={3}>
          <Card variant="outlined" sx={{ p: 2 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Tóm Tắt Khoản Phí Cần Thanh Toán
              </Typography>
              <Divider sx={{ my: 1 }} />
              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  py: 1,
                }}
              >
                <Typography variant="body1">Phí thu gom & vận chuyển rác cồng kềnh:</Typography>
                <Typography variant="h5" color="primary" fontWeight="bold">
                  {formatVnd(amountVnd)}
                </Typography>
              </Box>
            </CardContent>
          </Card>

          {order.latePaymentResolution ? (
            <LatePaymentReconciliation
              resolution={order.latePaymentResolution}
              onAcceptAlternative={handleAcceptAlternative}
              onChooseRefund={handleChooseRefund}
              isLoading={isLoading}
            />
          ) : (
            <PaymentSimulator onSimulate={handleSimulate} isLoading={isLoading} />
          )}
        </Stack>
      )}
    </Container>
  );
}

export default BulkyPaymentPage;

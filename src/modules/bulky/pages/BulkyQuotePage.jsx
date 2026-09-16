import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { Container, Box, Typography, Button, Alert, Stack, CircularProgress } from '@mui/material';
import { QuoteBreakdown } from '../features/quote/QuoteBreakdown.jsx';
import { CapacitySelector } from '../features/quote/CapacitySelector.jsx';
import { selectBulkyOrderById, selectCanManageBulky } from '../store/selectors.js';

export function BulkyQuotePage({ thunks, onProceedToPayment }) {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const canManage = useSelector(selectCanManageBulky);
  const order = useSelector((state) => selectBulkyOrderById(state, orderId));
  const quotesById = useSelector((state) => state.bulky?.quotesById || {});
  const holdsById = useSelector((state) => state.bulky?.holdsById || {});

  const [currentTime] = useState(() => Date.now());
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const activeQuote = order?.activeQuoteId ? quotesById[order.activeQuoteId] : null;
  const activeHold = order?.activeHoldId ? holdsById[order.activeHoldId] : null;

  const isExpired =
    activeHold?.status === 'EXPIRED' ||
    (activeQuote?.expiresAt && currentTime >= new Date(activeQuote.expiresAt).getTime());

  const handleRequestQuote = async (targetDate) => {
    if (!orderId || !thunks?.reserveQuoteAndHold) return;
    setIsLoading(true);
    setError(null);
    try {
      await dispatch(
        thunks.reserveQuoteAndHold({
          orderId,
          requestedDate: targetDate || order.requestedDate,
        }),
      );
    } catch (err) {
      setError(err.message || 'Không thể tạo báo giá và vị trí giữ chỗ');
    } finally {
      setIsLoading(false);
    }
  };

  const handleProceed = () => {
    if (onProceedToPayment) {
      onProceedToPayment({ orderId, quote: activeQuote, hold: activeHold });
    } else {
      navigate(`/bulky/payment/${orderId}`);
    }
  };

  if (!canManage) {
    return (
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Alert severity="error">
          Bạn không có quyền quản lý đơn đặt thu gom này (Yêu cầu quyền MANAGE_BULKY_ORDERS).
        </Alert>
      </Container>
    );
  }

  if (!order) {
    return (
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Alert severity="info">Không tìm thấy thông tin đơn thu gom rác cồng kềnh.</Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" component="h1" gutterBottom fontWeight="bold">
          Báo Giá & Giữ Chỗ Thu Gom
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Mã đơn: <strong>{order.orderId}</strong> • Địa chỉ: {order.serviceLocation?.address}
        </Typography>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <Stack spacing={3}>
        <CapacitySelector
          selectedDate={order.requestedDate}
          onSelectDate={(newDate) => handleRequestQuote(newDate)}
        />

        {activeQuote ? (
          <QuoteBreakdown quote={activeQuote} hold={activeHold} />
        ) : (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <Button
              variant="contained"
              size="large"
              onClick={() => handleRequestQuote()}
              disabled={isLoading}
              startIcon={isLoading ? <CircularProgress size={20} color="inherit" /> : null}
            >
              {isLoading ? 'Đang kiểm tra & tạo báo giá...' : 'Lấy báo giá & Giữ chỗ'}
            </Button>
          </Box>
        )}

        {activeQuote && (
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2, pt: 2 }}>
            <Button variant="outlined" onClick={() => navigate('/bulky/booking')}>
              Chỉnh sửa thông tin
            </Button>
            <Button variant="contained" size="large" disabled={isExpired} onClick={handleProceed}>
              Tiến hành thanh toán
            </Button>
          </Box>
        )}
      </Stack>
    </Container>
  );
}

export default BulkyQuotePage;

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

  const handleProceed = async () => {
    if (thunks?.startOrderPayment && activeQuote?.quoteId) {
      try {
        await dispatch(thunks.startOrderPayment({ orderId, quoteId: activeQuote.quoteId }));
      } catch (err) {
        console.warn('Could not start payment attempt on proceed:', err);
      }
    }
    if (onProceedToPayment) {
      onProceedToPayment({ orderId, quote: activeQuote, hold: activeHold });
    } else {
      navigate(`/bulky/payment/${orderId}`);
    }
  };

  if (!canManage) {
    return (
      <Box sx={{ minHeight: '100vh', width: '100%', backgroundColor: '#f8fafc', color: '#0f172a', py: { xs: 2, sm: 4 } }}>
        <Container maxWidth="md">
          <Alert severity="error">
            Bạn không có quyền quản lý đơn đặt thu gom này (Yêu cầu quyền MANAGE_BULKY_ORDERS).
          </Alert>
        </Container>
      </Box>
    );
  }

  if (!order) {
    return (
      <Box sx={{ minHeight: '100vh', width: '100%', backgroundColor: '#f8fafc', color: '#0f172a', py: { xs: 2, sm: 4 } }}>
        <Container maxWidth="md">
          <Alert severity="info">Không tìm thấy thông tin đơn thu gom rác cồng kềnh.</Alert>
        </Container>
      </Box>
    );
  }

  return (
    <Box sx={{ minHeight: '100vh', width: '100%', backgroundColor: '#f8fafc', color: '#0f172a', py: { xs: 2, sm: 4 } }}>
      <Container maxWidth="md">
        {/* Navigation Breadcrumb */}
        <Box sx={{ mb: 2 }}>
          <Button
            onClick={() => navigate('/bulky/orders')}
            sx={{
              textTransform: 'none',
              color: '#64748b',
              fontWeight: 600,
              fontSize: '0.875rem',
              '&:hover': { color: '#1d4ed8', backgroundColor: '#eff6ff' },
            }}
          >
            ← Danh sách đơn thu gom
          </Button>
        </Box>

        <Box sx={{ mb: 3 }}>
          <Typography variant="h4" component="h1" gutterBottom fontWeight="bold" sx={{ color: '#0f172a', letterSpacing: '-0.02em' }}>
            Báo Giá & Giữ Chỗ Thu Gom
          </Typography>
          <Typography variant="body1" sx={{ color: '#64748b' }}>
            Mã đơn: <strong style={{ color: '#0f172a' }}>{order.orderId}</strong> • Địa chỉ: {order.serviceLocation?.address}
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
    </Box>
  );
}

export default BulkyQuotePage;

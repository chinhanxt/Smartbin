// @vitest-environment jsdom
import { describe, it, expect, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { BulkyOrderDetailPage } from './BulkyOrderDetailPage.jsx';
import { bulkyReducer } from '../store/bulkySlice.js';
import { BULKY_CAPABILITIES } from '../services/bulkyServiceContract.js';
import { ORDER_STATUS, PAYMENT_STATUS, REFUND_STATUS } from '../domain/constants.js';

afterEach(() => {
  cleanup();
});

function renderWithStore(ui, { initialState = {}, route = '/bulky/orders/ord-1' } = {}) {
  const store = configureStore({
    reducer: {
      bulky: bulkyReducer,
    },
    preloadedState: {
      bulky: {
        capabilities: [
          BULKY_CAPABILITIES.VIEW_BULKY_ORDERS,
          BULKY_CAPABILITIES.MANAGE_BULKY_ORDERS,
        ],
        catalog: [],
        draft: null,
        ordersById: {},
        orderIds: [],
        quotesById: {},
        holdsById: {},
        paymentsById: {},
        refundsById: {},
        changeRequestsById: {},
        latePaymentResolutionsById: {},
        pagination: { cursor: null, hasMore: false },
        requestsByKey: {},
        activeRequestContexts: {},
        ...initialState,
      },
    },
  });

  return {
    store,
    ...render(
      <Provider store={store}>
        <MemoryRouter initialEntries={[route]}>
          <Routes>
            <Route path="/bulky/orders/:orderId" element={ui} />
          </Routes>
        </MemoryRouter>
      </Provider>,
    ),
  };
}

describe('BulkyOrderDetailPage', () => {
  const baseOrder = {
    orderId: 'ord-1',
    orderStatus: ORDER_STATUS.CONFIRMED,
    paymentStatus: PAYMENT_STATUS.SUCCESS,
    requestedDate: '2026-09-20',
    serviceLocation: { address: '123 Nguyen Trai, Q5' },
    acceptedQuote: { totalVnd: 150000 },
    confirmedItems: [{ catalogItemCode: 'SOFA', displayName: 'Sofa da', quantity: 1 }],
    handlingConditions: { placement: 'CURBSIDE', floorNumber: 0, hasLift: false },
    timeline: [
      { event: 'DRAFT_CREATED', occurredAt: '2026-09-17T08:00:00.000Z' },
      { event: 'ORDER_CONFIRMED_PAID', occurredAt: '2026-09-17T08:30:00.000Z' },
    ],
  };

  it('renders order details, items, location, and timeline', () => {
    renderWithStore(<BulkyOrderDetailPage />, {
      initialState: {
        ordersById: { 'ord-1': baseOrder },
      },
    });

    expect(screen.getByText('ord-1')).toBeInTheDocument();
    expect(screen.getByText(/123 Nguyen Trai, Q5/)).toBeInTheDocument();
    expect(screen.getByText('Sofa da')).toBeInTheDocument();
    expect(screen.getByText(/Lịch sử sự kiện/i)).toBeInTheDocument();
  });

  it('opens cancel dialog and shows financial effect disclosure', async () => {
    renderWithStore(<BulkyOrderDetailPage />, {
      initialState: {
        ordersById: { 'ord-1': baseOrder },
      },
    });

    const cancelBtn = screen.getByRole('button', { name: /Hủy đơn/i });
    fireEvent.click(cancelBtn);

    await waitFor(() => {
      expect(screen.getByText(/Xác nhận hủy yêu cầu thu gom/i)).toBeInTheDocument();
      expect(
        screen.getByText(/khoản tiền đã thanh toán sẽ được tự động hoàn trả/i),
      ).toBeInTheDocument();
    });
  });

  it('renders refund tracker when refund is requested', () => {
    renderWithStore(<BulkyOrderDetailPage />, {
      initialState: {
        ordersById: {
          'ord-1': {
            ...baseOrder,
            orderStatus: ORDER_STATUS.CANCELLED,
            refundStatus: REFUND_STATUS.REQUESTED,
          },
        },
        refundsById: {
          'ref-1': {
            refundId: 'ref-1',
            orderId: 'ord-1',
            amountVnd: 150000,
            status: REFUND_STATUS.REQUESTED,
          },
        },
      },
    });

    expect(screen.getByText(/Tiến Trình Hoàn Tiền/i)).toBeInTheDocument();
    expect(screen.getByText(/Đã gửi yêu cầu hoàn tiền/i)).toBeInTheDocument();
  });
});

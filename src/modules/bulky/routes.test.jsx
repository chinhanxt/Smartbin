// @vitest-environment jsdom
import { describe, it, expect, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { MemoryRouter, useRoutes } from 'react-router-dom';
import { bulkyRoutes } from './routes.jsx';
import { bulkyReducer } from './store/bulkySlice.js';
import { BULKY_CAPABILITIES } from './services/bulkyServiceContract.js';

afterEach(() => {
  cleanup();
});

function AppRoutes() {
  return useRoutes(bulkyRoutes);
}

function renderRoute(route) {
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
      },
    },
  });

  return render(
    <Provider store={store}>
      <MemoryRouter initialEntries={[route]}>
        <AppRoutes />
      </MemoryRouter>
    </Provider>,
  );
}

describe('bulkyRoutes', () => {
  it('exports 5 bulky routes', () => {
    expect(bulkyRoutes).toHaveLength(5);
    const paths = bulkyRoutes.map((r) => r.path);
    expect(paths).toContain('/bulky/booking');
    expect(paths).toContain('/bulky/quote/:orderId');
    expect(paths).toContain('/bulky/payment/:orderId');
    expect(paths).toContain('/bulky/orders');
    expect(paths).toContain('/bulky/orders/:orderId');
  });

  it('renders booking page on /bulky/booking', () => {
    renderRoute('/bulky/booking');
    expect(
      screen.getByRole('heading', { name: /Đặt Lịch Thu Gom Rác Cồng Kềnh/i }),
    ).toBeInTheDocument();
  });

  it('renders orders page on /bulky/orders', () => {
    renderRoute('/bulky/orders');
    expect(
      screen.getByRole('heading', { level: 1, name: /Đơn Thu Gom Rác Cồng Kềnh/i }),
    ).toBeInTheDocument();
  });
});

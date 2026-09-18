// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { MemoryRouter } from 'react-router-dom';
import { BulkyBookingPage } from './BulkyBookingPage.jsx';
import { bulkyReducer } from '../store/bulkySlice.js';
import { BULKY_CAPABILITIES } from '../services/bulkyServiceContract.js';

afterEach(() => {
  cleanup();
});

function renderWithStore(ui, { initialState } = {}) {
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
        <MemoryRouter>{ui}</MemoryRouter>
      </Provider>,
    ),
  };
}

describe('BulkyBookingPage', () => {
  it('renders access denied alert when user lacks MANAGE_BULKY_ORDERS', () => {
    renderWithStore(<BulkyBookingPage />, {
      initialState: {
        capabilities: [BULKY_CAPABILITIES.VIEW_BULKY_ORDERS],
      },
    });

    expect(screen.getByText(/Bạn không có quyền quản lý đơn đặt thu gom/i)).toBeInTheDocument();
  });

  it('renders wizard steps when user has MANAGE_BULKY_ORDERS', () => {
    renderWithStore(<BulkyBookingPage />);

    expect(
      screen.getByRole('heading', { name: /Đặt Lịch Thu Gom Rác Cồng Kềnh/i }),
    ).toBeInTheDocument();
    expect(screen.getByText(/1. Chụp ảnh & AI quét đồ trực tiếp/i)).toBeInTheDocument();
    expect(screen.getAllByText(/Ảnh đồ vật & AI Quét/i).length).toBeGreaterThanOrEqual(1);
  });

  it('validates required fields before proceeding to step 2', async () => {
    renderWithStore(<BulkyBookingPage />);

    const nextBtn = screen.getByRole('button', { name: /Tiếp theo/i });
    fireEvent.click(nextBtn);

    await waitFor(() => {
      expect(screen.getByText(/Vui lòng cung cấp ít nhất 1 ảnh đồ vật/i)).toBeInTheDocument();
    });
  });

  it('invokes onBookingCreated callback upon wizard completion', async () => {
    const handleCreated = vi.fn();
    renderWithStore(
      <BulkyBookingPage
        serviceLocations={[{ id: 'loc-1', address: '123 Test St', serviceArea: { code: 'D1' } }]}
        onBookingCreated={handleCreated}
      />,
    );

    // Step 1: Add a photo via 1-click sample preset
    const presetBtn = screen.getByRole('button', { name: /Sofa da phòng khách/i });
    fireEvent.click(presetBtn);

    // Click next to Step 2
    const nextBtn = screen.getByRole('button', { name: /Tiếp theo/i });
    fireEvent.click(nextBtn);

    // Verify Step 2 is reached
    await waitFor(() => {
      expect(screen.getByText(/2. Địa điểm & Điều kiện bốc xếp/i)).toBeInTheDocument();
    });

    // Fill date & select location
    const dateInput = screen.getByLabelText(/Ngày thu gom mong muốn/i);
    fireEvent.change(dateInput, { target: { value: '2026-09-25' } });
    expect(dateInput.value).toBe('2026-09-25');

    const locSelect = screen.getByTestId('service-location-input');
    fireEvent.change(locSelect, { target: { value: 'loc-1' } });

    // Click next to Step 3
    fireEvent.click(screen.getByRole('button', { name: /Tiếp theo/i }));

    // Verify Step 3 is reached
    await waitFor(() => {
      expect(screen.getByText(/3. Xem lại & Báo giá minh bạch/i)).toBeInTheDocument();
    });

    // Submit booking
    const submitBtn = screen.getByRole('button', { name: /Xác nhận & Gửi yêu cầu/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(handleCreated).toHaveBeenCalledTimes(1);
      expect(handleCreated).toHaveBeenCalledWith(
        expect.objectContaining({
          serviceLocationId: 'loc-1',
          requestedDate: '2026-09-25',
        }),
      );
    });
  });
});

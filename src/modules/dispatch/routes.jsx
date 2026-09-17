import { lazy } from 'react';

const DispatcherDashboardPage = lazy(() => import('./pages/DispatcherDashboardPage'));
const DispatchSimulationPage = lazy(() => import('./pages/DispatchSimulationPage'));

/**
 * Khai báo danh sách Routes của Module Dispatch (Dev 2 - congnghip)
 * Tuân thủ kiến trúc Zero-Conflict Modular Architecture:
 * Xuất cấu hình route riêng biệt để tích hợp vào hệ thống mà không gây xung đột Git với Dev 1 & Dev 3.
 */
export const dispatchRoutes = [
  {
    path: 'dispatch',
    element: <DispatcherDashboardPage />,
    index: true,
  },
  {
    path: 'dispatch/simulation',
    element: <DispatchSimulationPage />,
  },
];

export default dispatchRoutes;

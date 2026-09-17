import { lazy } from 'react';

const TicketListPage = lazy(() => import('./pages/TicketListPage'));
const TicketDetailPage = lazy(() => import('./pages/TicketDetailPage'));

/**
 * Khai báo danh sách Routes của Module Tickets (Dev 2 - congnghip)
 * Tuân thủ kiến trúc Zero-Conflict Modular Architecture:
 * Xuất cấu hình route riêng biệt để tích hợp vào hệ thống mà không gây xung đột Git với Dev 1 & Dev 3.
 */
export const ticketRoutes = [
  {
    path: 'tickets',
    element: <TicketListPage />,
    index: true,
  },
  {
    path: 'tickets/:id',
    element: <TicketDetailPage />,
  },
];

export default ticketRoutes;

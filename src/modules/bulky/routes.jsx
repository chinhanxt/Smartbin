import { BulkyBookingPage } from './pages/BulkyBookingPage.jsx';
import { BulkyQuotePage } from './pages/BulkyQuotePage.jsx';
import { BulkyPaymentPage } from './pages/BulkyPaymentPage.jsx';
import { BulkyOrdersPage } from './pages/BulkyOrdersPage.jsx';
import { BulkyOrderDetailPage } from './pages/BulkyOrderDetailPage.jsx';

export const bulkyRoutes = [
  {
    path: '/bulky/booking',
    element: <BulkyBookingPage />,
  },
  {
    path: '/bulky/quote/:orderId',
    element: <BulkyQuotePage />,
  },
  {
    path: '/bulky/payment/:orderId',
    element: <BulkyPaymentPage />,
  },
  {
    path: '/bulky/orders',
    element: <BulkyOrdersPage />,
  },
  {
    path: '/bulky/orders/:orderId',
    element: <BulkyOrderDetailPage />,
  },
];

export default bulkyRoutes;

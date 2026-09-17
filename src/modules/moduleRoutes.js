import ticketRoutes from './tickets/routes';
import dispatchRoutes from './dispatch/routes';

/**
 * Module Route Registry (Kiến trúc Zero-Conflict theo Mục 4.1 TEAM_WORKFLOW_RULES.md)
 * File cầu nối duy nhất tổng hợp routes của các modules độc lập.
 */
export const moduleRoutes = [...ticketRoutes, ...dispatchRoutes];

export default moduleRoutes;

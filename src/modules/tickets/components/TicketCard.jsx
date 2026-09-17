import { useMemo } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Chip,
  Box,
  Button,
  Stack,
  LinearProgress,
  Tooltip,
  useTheme,
} from '@mui/material';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import DeleteSweepIcon from '@mui/icons-material/DeleteSweep';
import LayersIcon from '@mui/icons-material/Layers';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import {
  TICKET_STATUS_LABELS,
  TICKET_STATUS_COLORS,
  TICKET_TYPE_LABELS,
  TICKET_PRIORITY_LABELS,
} from '../../../contracts/ticketStatus';

const PRIORITY_COLORS = {
  LOW: 'default',
  NORMAL: 'info',
  HIGH: 'warning',
  CRITICAL: 'error',
};

const TicketCard = ({ ticket, onSelect }) => {
  const theme = useTheme();

  const isOverdue = useMemo(() => {
    return new Date(ticket.deadline) < new Date() && ticket.status !== 'COMPLETED';
  }, [ticket.deadline, ticket.status]);

  const statusColor = TICKET_STATUS_COLORS[ticket.status] || theme.palette.text.secondary;
  const mergedCount = ticket.mergedEvents ? ticket.mergedEvents.length : 0;

  return (
    <Card
      elevation={1}
      sx={{
        borderRadius: 2,
        border: '1px solid',
        borderColor: ticket.status === 'EXCEPTION' ? 'error.main' : 'divider',
        transition: 'all 0.2s ease-in-out',
        '&:hover': {
          transform: 'translateY(-2px)',
          boxShadow: theme.shadows[4],
        },
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <CardContent sx={{ p: 2, flex: 1, display: 'flex', flexDirection: 'column' }}>
        {/* Header: ID + Priority + Status */}
        <Box
          sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}
        >
          <Stack direction="row" spacing={1} alignItems="center">
            <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
              {ticket.id}
            </Typography>
            <Chip
              label={TICKET_PRIORITY_LABELS[ticket.priority] || ticket.priority}
              color={PRIORITY_COLORS[ticket.priority] || 'default'}
              size="small"
              sx={{ fontWeight: 700, fontSize: '0.75rem', height: 20 }}
            />
          </Stack>

          <Chip
            label={TICKET_STATUS_LABELS[ticket.status] || ticket.status}
            sx={{
              backgroundColor: `${statusColor}20`,
              color: statusColor,
              fontWeight: 700,
              fontSize: '0.75rem',
              border: `1px solid ${statusColor}50`,
            }}
            size="small"
          />
        </Box>

        {/* Type & Deduplication Merge Indicator */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
          <Chip
            icon={<DeleteSweepIcon sx={{ fontSize: '1rem !important' }} />}
            label={TICKET_TYPE_LABELS[ticket.type] || ticket.type}
            variant="outlined"
            size="small"
            sx={{ fontSize: '0.75rem' }}
          />

          {mergedCount > 0 && (
            <Tooltip title={`Đã gộp ${mergedCount} cảnh báo lặp từ cảm biến/hệ thống`}>
              <Chip
                icon={<LayersIcon sx={{ fontSize: '1rem !important' }} />}
                label={`Gộp +${mergedCount}`}
                size="small"
                color="secondary"
                sx={{ fontWeight: 700, fontSize: '0.75rem' }}
              />
            </Tooltip>
          )}
        </Box>

        {/* Location & Household */}
        <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1, mb: 1.5 }}>
          <LocationOnIcon sx={{ fontSize: 18, color: 'text.secondary', mt: 0.2 }} />
          <Box>
            <Typography variant="body2" sx={{ fontWeight: 600 }}>
              Thùng: {ticket.binId} {ticket.householdId ? `• Hộ: ${ticket.householdId}` : ''}
            </Typography>
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ display: 'block', lineHeight: 1.3 }}
            >
              {ticket.address}
            </Typography>
          </Box>
        </Box>

        {/* Telemetry Indicator (if available) */}
        {ticket.latestFillLevel !== undefined && (
          <Box sx={{ mb: 1.5, p: 1, backgroundColor: 'action.hover', borderRadius: 1.5 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
              <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                Mức đầy thùng rác:
              </Typography>
              <Typography
                variant="caption"
                sx={{
                  fontWeight: 800,
                  color: ticket.latestFillLevel >= 90 ? 'error.main' : 'success.main',
                }}
              >
                {ticket.latestFillLevel}%
              </Typography>
            </Box>
            <LinearProgress
              variant="determinate"
              value={ticket.latestFillLevel}
              sx={{
                height: 6,
                borderRadius: 3,
                '& .MuiLinearProgress-bar': {
                  backgroundColor: ticket.latestFillLevel >= 90 ? 'error.main' : 'success.main',
                },
              }}
            />
          </Box>
        )}

        {/* Assigned Vehicle / Driver info */}
        {(ticket.assignedVehicleId || ticket.assignedDriverId) && (
          <Box sx={{ mb: 1.5, display: 'flex', gap: 1 }}>
            {ticket.assignedVehicleId && (
              <Chip
                label={`Xe: ${ticket.assignedVehicleId}`}
                size="small"
                variant="outlined"
                sx={{ fontWeight: 600, fontSize: '0.75rem' }}
              />
            )}
            {ticket.assignedDriverId && (
              <Chip
                label={`Tài xế: ${ticket.assignedDriverId}`}
                size="small"
                variant="outlined"
                sx={{ fontWeight: 600, fontSize: '0.75rem' }}
              />
            )}
          </Box>
        )}

        <Box sx={{ flex: 1 }} />

        {/* Footer: Deadline + Action Buttons */}
        <Box
          sx={{
            pt: 1.5,
            borderTop: '1px solid',
            borderColor: 'divider',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <Stack direction="row" spacing={0.5} alignItems="center">
            <AccessTimeIcon
              sx={{ fontSize: 16, color: isOverdue ? 'error.main' : 'text.secondary' }}
            />
            <Typography
              variant="caption"
              sx={{
                color: isOverdue ? 'error.main' : 'text.secondary',
                fontWeight: isOverdue ? 700 : 500,
              }}
            >
              {isOverdue ? 'Quá hạn: ' : 'Hạn: '}
              {new Date(ticket.deadline).toLocaleTimeString('vi-VN', {
                hour: '2-digit',
                minute: '2-digit',
                day: '2-digit',
                month: '2-digit',
              })}
            </Typography>
          </Stack>

          <Button
            size="small"
            variant="contained"
            color="primary"
            disableElevation
            endIcon={<ArrowForwardIcon />}
            onClick={() => onSelect(ticket.id)}
            sx={{
              borderRadius: 1.5,
              textTransform: 'none',
              fontWeight: 700,
              fontSize: '0.8rem',
            }}
          >
            Chi tiết
          </Button>
        </Box>
      </CardContent>
    </Card>
  );
};

export default TicketCard;

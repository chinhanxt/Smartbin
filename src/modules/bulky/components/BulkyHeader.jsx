import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import {
  AppBar,
  Toolbar,
  Box,
  Typography,
  Button,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Card,
  CardActionArea,
  CardContent,
  Stack,
  Divider,
  Container,
} from '@mui/material';
import { BULKY_PERSONAS } from '../services/bulkyServiceContract.js';
import { switchBulkyUser } from '../store/bulkySlice.js';
import { selectActiveBulkyUser } from '../store/selectors.js';

export function BulkyHeader() {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  const activeUser = useSelector(selectActiveBulkyUser) || BULKY_PERSONAS[0];

  const [openModal, setOpenModal] = useState(false);

  const handleSelectPersona = (persona) => {
    dispatch(switchBulkyUser(persona));
    setOpenModal(false);
  };

  const getRoleBadge = (role) => {
    switch (role) {
      case 'DISPATCHER':
        return { label: 'Điều Phối Viên', color: 'warning', icon: '🚛' };
      case 'ADMIN':
        return { label: 'Quản Trị Viên', color: 'error', icon: '⚙️' };
      default:
        return { label: 'Người Dân', color: 'primary', icon: '👤' };
    }
  };

  const currentBadge = getRoleBadge(activeUser.role);

  return (
    <>
      <AppBar
        position="sticky"
        elevation={0}
        sx={{
          backgroundColor: '#ffffff',
          borderBottom: '1px solid #e2e8f0',
          color: '#0f172a',
          zIndex: 1100,
        }}
      >
        <Container maxWidth="lg">
          <Toolbar disableGutters sx={{ justifyContent: 'space-between', minHeight: 64 }}>
            {/* Brand Logo & Title */}
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1.5,
                cursor: 'pointer',
              }}
              onClick={() => navigate('/bulky/orders')}
            >
              <Box
                sx={{
                  width: 40,
                  height: 40,
                  borderRadius: 2,
                  backgroundColor: '#eff6ff',
                  border: '1px solid #bfdbfe',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1.4rem',
                }}
              >
                🛋️
              </Box>
              <Box>
                <Typography
                  variant="subtitle1"
                  fontWeight="bold"
                  sx={{ color: '#1e3a8a', lineHeight: 1.2 }}
                >
                  Smartbin • Thu Gom Rác Cồng Kềnh
                </Typography>
                <Typography variant="caption" sx={{ color: '#64748b' }}>
                  Phân hệ Cư Dân &amp; Bàn Điều Phối
                </Typography>
              </Box>
            </Box>

            {/* Navigation & Role Switcher */}
            <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center' }}>
              <Button
                variant={location.pathname === '/bulky/orders' ? 'contained' : 'text'}
                size="small"
                onClick={() => navigate('/bulky/orders')}
                sx={{
                  textTransform: 'none',
                  fontWeight: 600,
                  borderRadius: 1.5,
                  ...(location.pathname === '/bulky/orders'
                    ? { backgroundColor: '#1d4ed8', color: '#ffffff' }
                    : { color: '#475569' }),
                }}
              >
                📋 Đơn thu gom
              </Button>

              <Button
                variant={location.pathname === '/bulky/booking' ? 'contained' : 'outlined'}
                size="small"
                onClick={() => navigate('/bulky/booking')}
                sx={{
                  textTransform: 'none',
                  fontWeight: 600,
                  borderRadius: 1.5,
                  ...(location.pathname === '/bulky/booking'
                    ? { backgroundColor: '#1d4ed8', color: '#ffffff' }
                    : { borderColor: '#cbd5e1', color: '#1d4ed8' }),
                }}
              >
                ➕ Đặt lịch mới
              </Button>

              <Divider orientation="vertical" flexItem sx={{ height: 24, my: 'auto', mx: 0.5 }} />

              {/* Active User Chip & Switch Button */}
              <Box
                onClick={() => setOpenModal(true)}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1,
                  px: 1.5,
                  py: 0.75,
                  borderRadius: 2,
                  backgroundColor: activeUser.role === 'DISPATCHER' ? '#fffbeb' : '#f8fafc',
                  border:
                    activeUser.role === 'DISPATCHER'
                      ? '1px solid #fde68a'
                      : '1px solid #e2e8f0',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  '&:hover': {
                    borderColor: '#94a3b8',
                    backgroundColor: activeUser.role === 'DISPATCHER' ? '#fef3c7' : '#f1f5f9',
                  },
                }}
              >
                <Typography sx={{ fontSize: '1.1rem' }}>{currentBadge.icon}</Typography>
                <Box sx={{ display: { xs: 'none', sm: 'block' } }}>
                  <Typography
                    variant="body2"
                    fontWeight="bold"
                    sx={{ color: '#0f172a', lineHeight: 1.1 }}
                  >
                    {activeUser.name}
                  </Typography>
                  <Typography variant="caption" sx={{ color: '#64748b' }}>
                    {currentBadge.label}
                  </Typography>
                </Box>
                <Chip
                  label={currentBadge.label}
                  size="small"
                  color={currentBadge.color}
                  sx={{
                    fontWeight: 700,
                    fontSize: '0.7rem',
                    height: 22,
                    display: { xs: 'flex', sm: 'none' },
                  }}
                />
                <Typography variant="caption" sx={{ color: '#3b82f6', fontWeight: 600, ml: 0.5 }}>
                  Đổi vai trò ▾
                </Typography>
              </Box>
            </Stack>
          </Toolbar>
        </Container>
      </AppBar>

      {/* Role Switcher Dialog */}
      <Dialog
        open={openModal}
        onClose={() => setOpenModal(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: { borderRadius: 3, p: 1 },
        }}
      >
        <DialogTitle sx={{ pb: 1 }}>
          <Typography variant="h6" fontWeight="bold" sx={{ color: '#0f172a' }}>
            Đăng Nhập / Chuyển Đổi Tài Khoản &amp; Vai Trò
          </Typography>
          <Typography variant="body2" sx={{ color: '#64748b' }}>
            Chọn tài khoản để trải nghiệm đúng quyền hạn nghiệp vụ giữa Người dân và Điều phối viên.
          </Typography>
        </DialogTitle>

        <DialogContent sx={{ pt: 2 }}>
          <Stack spacing={2}>
            {BULKY_PERSONAS.map((persona) => {
              const isSelected = activeUser.id === persona.id;
              const badge = getRoleBadge(persona.role);

              return (
                <Card
                  key={persona.id}
                  variant="outlined"
                  sx={{
                    borderRadius: 2.5,
                    borderColor: isSelected ? '#1d4ed8' : '#e2e8f0',
                    borderWidth: isSelected ? 2 : 1,
                    backgroundColor: isSelected ? '#eff6ff' : '#ffffff',
                    transition: 'all 0.2s',
                  }}
                >
                  <CardActionArea
                    onClick={() => handleSelectPersona(persona)}
                    sx={{ p: 2 }}
                  >
                    <CardContent sx={{ p: 0 }}>
                      <Box
                        sx={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          mb: 1,
                        }}
                      >
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2 }}>
                          <Typography sx={{ fontSize: '1.4rem' }}>{badge.icon}</Typography>
                          <Box>
                            <Typography
                              variant="subtitle1"
                              fontWeight="bold"
                              sx={{ color: '#0f172a' }}
                            >
                              {persona.name}
                            </Typography>
                            <Typography variant="caption" sx={{ color: '#64748b' }}>
                              {persona.householdName || 'Hệ thống Smartbin'}
                            </Typography>
                          </Box>
                        </Box>
                        <Chip
                          label={badge.label}
                          color={badge.color}
                          size="small"
                          sx={{ fontWeight: 700 }}
                        />
                      </Box>
                      <Typography variant="body2" sx={{ color: '#334155', mt: 0.5 }}>
                        {persona.description}
                      </Typography>
                      {isSelected && (
                        <Typography
                          variant="caption"
                          sx={{
                            color: '#1d4ed8',
                            fontWeight: 700,
                            display: 'block',
                            mt: 1,
                          }}
                        >
                          ✓ Đang hoạt động ở vai trò này
                        </Typography>
                      )}
                    </CardContent>
                  </CardActionArea>
                </Card>
              );
            })}
          </Stack>
        </DialogContent>

        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button
            onClick={() => setOpenModal(false)}
            variant="outlined"
            sx={{ textTransform: 'none', borderRadius: 2 }}
          >
            Đóng
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}

export default BulkyHeader;

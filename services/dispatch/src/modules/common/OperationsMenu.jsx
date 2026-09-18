import { Divider, List } from '@mui/material';
import AssignmentIcon from '@mui/icons-material/Assignment';
import AltRouteIcon from '@mui/icons-material/AltRoute';
import MapIcon from '@mui/icons-material/Map';
import MyLocationIcon from '@mui/icons-material/MyLocation';
import DescriptionIcon from '@mui/icons-material/Description';
import SettingsIcon from '@mui/icons-material/Settings';
import { useLocation } from 'react-router-dom';
import PlayCircleIcon from '@mui/icons-material/PlayCircle';
import MenuItem from '../../common/components/MenuItem';

const OperationsMenu = () => {
  const location = useLocation();

  return (
    <>
      <List>
        <MenuItem
          title="Quản Lý Phiếu Việc"
          link="/tickets"
          icon={<AssignmentIcon />}
          selected={location.pathname.startsWith('/tickets')}
        />
        <MenuItem
          title="Điều Phối Tuyến Đường"
          link="/dispatch"
          icon={<AltRouteIcon />}
          selected={location.pathname === '/dispatch'}
        />
        <MenuItem
          title="Mô Phỏng Thu Gom AI"
          link="/dispatch/simulation"
          icon={<PlayCircleIcon />}
          selected={location.pathname === '/dispatch/simulation'}
        />
      </List>
      <Divider />
      <List>
        <MenuItem
          title="Bản Đồ Giám Sát"
          link="/"
          icon={<MapIcon />}
          selected={location.pathname === '/'}
        />
        <MenuItem
          title="Phát GPS Di Động"
          link="/tracker"
          icon={<MyLocationIcon />}
          selected={location.pathname === '/tracker'}
        />
        <MenuItem
          title="Báo Cáo Tổng Hợp"
          link="/reports/combined"
          icon={<DescriptionIcon />}
          selected={location.pathname.startsWith('/reports')}
        />
        <MenuItem
          title="Cài Đặt Hệ Thống"
          link="/settings/preferences"
          icon={<SettingsIcon />}
          selected={location.pathname.startsWith('/settings')}
        />
      </List>
    </>
  );
};

export default OperationsMenu;

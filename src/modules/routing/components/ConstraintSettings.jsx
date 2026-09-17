import { useState } from 'react';
import { Box, Typography, Paper, Grid, TextField, MenuItem, Button, Slider } from '@mui/material';
import TuneIcon from '@mui/icons-material/Tune';
import RefreshIcon from '@mui/icons-material/Refresh';

const UNLOADING_STATIONS = [
  { name: 'Khu Liên hiệp Xử lý Chất thải Đa Phước', lat: 10.6698, lng: 106.6631 },
  { name: 'Trạm Trung chuyển Rác Tống Văn Trân, Q.11', lat: 10.7682, lng: 106.6455 },
  { name: 'Trạm Trung chuyển Rác Quang Trung, Q.Gò Vấp', lat: 10.8415, lng: 106.6578 },
];

const ConstraintSettings = ({ onApplyConstraints, isCalculating = false }) => {
  const [avgSpeed, setAvgSpeed] = useState(25);
  const [stopDuration, setStopDuration] = useState(8);
  const [capacityBufferPercent, setCapacityBufferPercent] = useState(10); // Dự phòng 10% tải
  const [selectedStationIndex, setSelectedStationIndex] = useState(0);

  const handleApply = () => {
    onApplyConstraints({
      avgSpeedKmh: avgSpeed,
      serviceMinutesPerStop: stopDuration,
      capacityBufferPercent,
      unloadingStation: UNLOADING_STATIONS[selectedStationIndex],
    });
  };

  return (
    <Paper elevation={1} sx={{ p: 2, borderRadius: 2 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
        <TuneIcon color="primary" />
        <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>
          Ràng Buộc Tối Ưu Tuyến Thu Gom (VRP Constraints - Trang 03 PDF)
        </Typography>
      </Box>

      <Grid container spacing={2.5}>
        <Grid item xs={12} sm={6}>
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{ fontWeight: 600, display: 'block', mb: 1 }}
          >
            Vận tốc trung bình trong đô thị: {avgSpeed} km/h
          </Typography>
          <Slider
            value={avgSpeed}
            min={15}
            max={45}
            step={5}
            onChange={(e, val) => setAvgSpeed(val)}
            valueLabelDisplay="auto"
            color="primary"
          />
        </Grid>

        <Grid item xs={12} sm={6}>
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{ fontWeight: 600, display: 'block', mb: 1 }}
          >
            Thời gian dừng bốc dỡ tại mỗi thùng: {stopDuration} phút
          </Typography>
          <Slider
            value={stopDuration}
            min={3}
            max={20}
            step={1}
            onChange={(e, val) => setStopDuration(val)}
            valueLabelDisplay="auto"
            color="primary"
          />
        </Grid>

        <Grid item xs={12} sm={6}>
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{ fontWeight: 600, display: 'block', mb: 1 }}
          >
            Tỷ lệ dự phòng sức chứa xe: {capacityBufferPercent}%
          </Typography>
          <Slider
            value={capacityBufferPercent}
            min={0}
            max={25}
            step={5}
            onChange={(e, val) => setCapacityBufferPercent(val)}
            valueLabelDisplay="auto"
            color="secondary"
          />
        </Grid>

        <Grid item xs={12} sm={6}>
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{ fontWeight: 600, display: 'block', mb: 0.5 }}
          >
            Trạm dỡ rác kết thúc lộ trình (Depot)
          </Typography>
          <TextField
            select
            fullWidth
            size="small"
            value={selectedStationIndex}
            onChange={(e) => setSelectedStationIndex(Number(e.target.value))}
          >
            {UNLOADING_STATIONS.map((station, idx) => (
              <MenuItem key={idx} value={idx}>
                {station.name}
              </MenuItem>
            ))}
          </TextField>
        </Grid>

        <Grid item xs={12}>
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 1 }}>
            <Button
              variant="contained"
              color="primary"
              startIcon={<RefreshIcon />}
              disabled={isCalculating}
              onClick={handleApply}
              sx={{
                textTransform: 'none',
                fontWeight: 700,
                px: 3,
              }}
            >
              {isCalculating
                ? 'Đang giải thuật toán VRP...'
                : 'Áp Dụng Ràng Buộc & Tối Ưu Lại Tuyến'}
            </Button>
          </Box>
        </Grid>
      </Grid>
    </Paper>
  );
};

export default ConstraintSettings;

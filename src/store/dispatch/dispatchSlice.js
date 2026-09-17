import { createSlice } from '@reduxjs/toolkit';

const initialMockVehicles = [
  {
    vehicleId: 'VEH-01',
    driverId: 'DRV-05',
    driverName: 'Lê Văn Tài (Đội 1)',
    maxCapacityKg: 3000,
    currentCapacityKg: 650,
    lat: 10.7768,
    lng: 106.7009,
    status: 'EN_ROUTE', // 'IDLE' | 'EN_ROUTE' | 'COLLECTING' | 'UNLOADING'
    currentRouteVersion: 'PLAN-V1726543000',
    shift: 'Ca sáng (06:00 - 14:00)',
  },
  {
    vehicleId: 'VEH-02',
    driverId: 'DRV-02',
    driverName: 'Trần Đình Trọng (Đội 2)',
    maxCapacityKg: 5000,
    currentCapacityKg: 1200,
    lat: 10.7812,
    lng: 106.6954,
    status: 'COLLECTING',
    currentRouteVersion: 'PLAN-V1726543000',
    shift: 'Ca sáng (06:00 - 14:00)',
  },
  {
    vehicleId: 'VEH-03',
    driverId: null,
    driverName: 'Chưa phân công',
    maxCapacityKg: 2500,
    currentCapacityKg: 0,
    lat: 10.7654,
    lng: 106.6821,
    status: 'IDLE',
    currentRouteVersion: null,
    shift: 'Ca chiều (14:00 - 22:00)',
  },
];

const initialState = {
  vehicles: initialMockVehicles,
  activePlan: null,
  planHistory: [],
  selectedVehicleId: 'VEH-01',
  isOptimizing: false,
};

export const dispatchSlice = createSlice({
  name: 'dispatch',
  initialState,
  reducers: {
    selectVehicle: (state, action) => {
      state.selectedVehicleId = action.payload;
    },
    setActivePlan: (state, action) => {
      state.activePlan = action.payload;
    },
    approvePlan: (state, action) => {
      if (state.activePlan) {
        state.activePlan.approvedAt = new Date().toISOString();
        state.activePlan.approvedBy = action.payload.approvedBy || 'Điều phối viên trưởng';
        state.activePlan.status = 'APPROVED';
        state.planHistory.push(state.activePlan);
      }
    },
    updateVehicleStatus: (state, action) => {
      const { vehicleId, status, currentCapacityKg } = action.payload;
      const v = state.vehicles.find((item) => item.vehicleId === vehicleId);
      if (v) {
        if (status) v.status = status;
        if (currentCapacityKg !== undefined) v.currentCapacityKg = currentCapacityKg;
      }
    },
    assignDriverToVehicle: (state, action) => {
      const { vehicleId, driverId, driverName } = action.payload;
      const v = state.vehicles.find((item) => item.vehicleId === vehicleId);
      if (v) {
        v.driverId = driverId;
        v.driverName = driverName;
      }
    },
    reportVehicleBreakdown: (state, action) => {
      const { vehicleId } = action.payload;
      const v = state.vehicles.find((item) => item.vehicleId === vehicleId);
      if (v) {
        v.status = 'IDLE';
        v.isBroken = true;
      }
    },
  },
});

export const dispatchActions = dispatchSlice.actions;
export default dispatchSlice.reducer;

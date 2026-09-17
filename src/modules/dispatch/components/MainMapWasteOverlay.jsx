import { useEffect, useRef, useState, useCallback } from 'react';
import { useSelector } from 'react-redux';
import {
  Box,
  Typography,
  Paper,
  Stack,
  Button,
  IconButton,
  Tooltip,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Slider,
  Collapse,
} from '@mui/material';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import PauseIcon from '@mui/icons-material/Pause';
import AddLocationAltIcon from '@mui/icons-material/AddLocationAlt';
import CenterFocusStrongIcon from '@mui/icons-material/CenterFocusStrong';
import CloseIcon from '@mui/icons-material/Close';
import DeleteForeverIcon from '@mui/icons-material/DeleteForever';
import RestartAltIcon from '@mui/icons-material/RestartAlt';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import PsychologyIcon from '@mui/icons-material/Psychology';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import FlashOnIcon from '@mui/icons-material/FlashOn';

import * as maplibregl from 'maplibre-gl';
import { map } from '../../../map/core/MapView';
import { toMapCoordinates } from '../../../map/core/mapUtil';
import { simulationEngine } from '../services/WasteSimulationEngine';
import { roadRoutingService } from '../../routing/services/RoadRoutingService';
import RouteOptimizationInspectorModal from '../../routing/components/RouteOptimizationInspectorModal';
import VehicleSelectorBar from './VehicleSelectorBar';
import VehicleFocusInspector from './VehicleFocusInspector';

const STAGE_CONFIG = {
  PERCEPTION: {
    label: 'Cảm Biến IoT',
    color: '#0284c7',
    bgColor: '#e0f2fe',
    icon: '📡',
  },
  REASONING: {
    label: 'Phân Tích & Tải',
    color: '#7c3aed',
    bgColor: '#ede9fe',
    icon: '🧠',
  },
  OPTIMIZATION: {
    label: 'Tối Ưu 2-Opt VRP',
    color: '#4f46e5',
    bgColor: '#eef2ff',
    icon: '⚡',
  },
  DECISION: {
    label: 'Điều Phối Tuyến',
    color: '#059669',
    bgColor: '#ecfdf5',
    icon: '🎯',
  },
  DEPOT: {
    label: 'Trạm Dỡ Rác',
    color: '#0d9488',
    bgColor: '#f0fdfa',
    icon: '♻️',
  },
  HUMAN_INTERACTION: {
    label: 'Xác Nhận Người',
    color: '#d97706',
    bgColor: '#fffbeb',
    icon: '🤝',
  },
};

const MainMapWasteOverlay = () => {
  const [simulationState, setSimulationState] = useState(() => simulationEngine.getStateSnapshot());
  const [isAddingBinMode, setIsAddingBinMode] = useState(false);
  const [panelOpen, setPanelOpen] = useState(true);
  const [inspectorModalOpen, setInspectorModalOpen] = useState(false);
  const [focusedVehicleId, setFocusedVehicleId] = useState(null);
  const [isTrackingVehicle, setIsTrackingVehicle] = useState(false);

  // Inspector card states
  const [selectedBin, setSelectedBin] = useState(null);

  // Modal thêm thùng rác mới khi click
  const [newBinCoords, setNewBinCoords] = useState(null);
  const [newBinName, setNewBinName] = useState('');
  const [newBinCapacity, setNewBinCapacity] = useState(120);
  const [newBinInitialFill, setNewBinInitialFill] = useState(35);
  const [newBinFillRate, setNewBinFillRate] = useState(1.0);

  // Refs giữ HTML Markers
  const binMarkersRef = useRef(new Map());
  const vehicleMarkersRef = useRef(new Map());
  const depotMarkersRef = useRef(new Map());
  const isLayerReadyRef = useRef(false);

  // 1. Đăng ký nhận cập nhật từ Engine và khởi động mô phỏng
  useEffect(() => {
    const unsubscribe = simulationEngine.subscribe((newState) => {
      setSimulationState(newState);
    });

    simulationEngine.start();

    // Tự động căn máy bay về trung tâm khu vực Quận 1 để thấy ghim cận cảnh
    if (map) {
      map.flyTo({
        center: toMapCoordinates(106.698, 10.774),
        zoom: 14.5,
        pitch: 25,
        duration: 1500,
      });
    }

    return () => {
      unsubscribe();
    };
  }, []);

  // 1.05 Lắng nghe tín hiệu GPS SOS từ thiết bị Mobile Tracker gửi về qua Traccar WebSocket
  const realPositions = useSelector((state) => state.session?.positions);
  const handledSosKeysRef = useRef(new Set());

  useEffect(() => {
    if (!realPositions) return;
    Object.values(realPositions).forEach((pos) => {
      if (pos?.attributes?.alarm === 'sos') {
        const key = `${pos.deviceId || pos.id}-${pos.fixTime || pos.deviceTime || pos.serverTime || ''}`;
        if (!handledSosKeysRef.current.has(key)) {
          handledSosKeysRef.current.add(key);
          const targetVeh =
            simulationState.vehicles.find((v) => !v.isBroken && v.status !== 'IDLE') ||
            simulationState.vehicles.find((v) => !v.isBroken) ||
            simulationState.vehicles[0];
          if (targetVeh) {
            simulationEngine.triggerVehicleSos(
              targetVeh.vehicleId,
              false,
              'Tín hiệu SOS báo động từ thiết bị GPS Mobile Tracker (/tracker)',
            );
          }
        }
      }
    });
  }, [realPositions, simulationState.vehicles]);

  // 1.1 Chọn xe để xem chi tiết từng xe một (Individual Vehicle Focus)
  const handleSelectVehicle = useCallback(
    (vehicleId) => {
      setFocusedVehicleId(vehicleId);
      setSelectedBin(null);

      if (vehicleId) {
        setIsTrackingVehicle(true);
        const veh = simulationState.vehicles.find((v) => v.vehicleId === vehicleId);
        if (veh && map) {
          map.flyTo({
            center: toMapCoordinates(veh.lng, veh.lat),
            zoom: 16.5,
            pitch: 35,
            duration: 1100,
          });
        }
      } else {
        setIsTrackingVehicle(false);
        if (map) {
          map.flyTo({
            center: toMapCoordinates(106.698, 10.774),
            zoom: 14.5,
            pitch: 25,
            duration: 1000,
          });
        }
      }
    },
    [simulationState.vehicles],
  );

  // 1.2 Bám theo xe khi xe di chuyển trên mạng lưới đường
  useEffect(() => {
    if (!map || !isTrackingVehicle || !focusedVehicleId) return;
    const veh = simulationState.vehicles.find((v) => v.vehicleId === focusedVehicleId);
    if (veh) {
      map.easeTo({
        center: toMapCoordinates(veh.lng, veh.lat),
        duration: 120,
        easing: (t) => t,
      });
    }
  }, [simulationState?.vehicles, isTrackingVehicle, focusedVehicleId]);

  const handleFlyToVehicle = useCallback((veh) => {
    if (map && veh) {
      map.flyTo({
        center: toMapCoordinates(veh.lng, veh.lat),
        zoom: 17,
        pitch: 40,
        duration: 900,
      });
    }
  }, []);

  const handleFlyToStop = useCallback((lng, lat) => {
    if (map && lng && lat) {
      setIsTrackingVehicle(false);
      map.flyTo({
        center: toMapCoordinates(lng, lat),
        zoom: 17,
        pitch: 30,
        duration: 900,
      });
    }
  }, []);

  const handleSendToDepot = useCallback((vehicleId) => {
    simulationEngine.sendVehicleToDepot(vehicleId);
  }, []);

  // 2. Khởi tạo Source & Layer cho Lộ trình xe trên singleton `map`
  useEffect(() => {
    if (!map) return;

    const setupRouteLayers = () => {
      if (map.getSource('waste-routes-source')) return;

      map.addSource('waste-routes-source', {
        type: 'geojson',
        data: { type: 'FeatureCollection', features: [] },
      });

      map.addLayer({
        id: 'waste-routes-casing',
        type: 'line',
        source: 'waste-routes-source',
        layout: { 'line-join': 'round', 'line-cap': 'round' },
        paint: {
          'line-color': '#000000',
          'line-width': 6,
          'line-opacity': 0.45,
        },
      });

      map.addLayer({
        id: 'waste-routes-line',
        type: 'line',
        source: 'waste-routes-source',
        layout: { 'line-join': 'round', 'line-cap': 'round' },
        paint: {
          'line-color': ['get', 'color'],
          'line-width': 4,
          'line-dasharray': [2, 2],
        },
      });

      isLayerReadyRef.current = true;
    };

    if (map.loaded() || map.isStyleLoaded()) {
      setupRouteLayers();
    } else {
      map.once('load', setupRouteLayers);
      map.once('styledata', setupRouteLayers);
    }

    const binMarkers = binMarkersRef.current;
    const vehicleMarkers = vehicleMarkersRef.current;
    const depotMarkers = depotMarkersRef.current;

    return () => {
      binMarkers.forEach((m) => m.remove());
      vehicleMarkers.forEach((m) => m.remove());
      depotMarkers.forEach((m) => m.remove());

      if (map.getLayer('waste-routes-line')) map.removeLayer('waste-routes-line');
      if (map.getLayer('waste-routes-casing')) map.removeLayer('waste-routes-casing');
      if (map.getSource('waste-routes-source')) map.removeSource('waste-routes-source');
      isLayerReadyRef.current = false;
    };
  }, []);

  // 3. Xử lý click trên bản đồ chính khi đang ở chế độ cắm thùng rác
  useEffect(() => {
    if (!map) return;

    if (isAddingBinMode) {
      map.getCanvas().style.cursor = 'crosshair';
    } else {
      map.getCanvas().style.cursor = '';
    }

    const handleMapClick = (e) => {
      if (!isAddingBinMode) return;
      const { lng, lat } = e.lngLat;
      setNewBinCoords({ lat, lng });
      setNewBinName(`Thùng rác Điểm mới #${simulationState.bins.length + 1}`);
      setNewBinInitialFill(35);
    };

    map.on('click', handleMapClick);
    return () => {
      map.off('click', handleMapClick);
    };
  }, [isAddingBinMode, simulationState?.bins?.length]);

  // 4. Render Marker các Trạm dỡ rác (Depots)
  useEffect(() => {
    if (!map) return;
    const depots =
      simulationState?.depots && simulationState.depots.length > 0
        ? simulationState.depots
        : simulationState?.depot
          ? [simulationState.depot]
          : [];

    const existingMarkers = depotMarkersRef.current;
    const activeDepotIds = new Set(depots.map((d) => d.id));

    // Xóa marker không còn tồn tại
    existingMarkers.forEach((marker, dId) => {
      if (!activeDepotIds.has(dId)) {
        marker.remove();
        existingMarkers.delete(dId);
      }
    });

    depots.forEach((depot) => {
      if (!existingMarkers.has(depot.id)) {
        const el = document.createElement('div');
        el.className = `main-depot-marker main-depot-${depot.id}`;
        el.innerHTML = `
          <style>
            @keyframes depotWave {
              0% { transform: scale(0.96); box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.85); }
              70% { transform: scale(1.03); box-shadow: 0 0 0 8px rgba(16, 185, 129, 0); }
              100% { transform: scale(0.96); box-shadow: 0 0 0 0 rgba(16, 185, 129, 0); }
            }
          </style>
          <div style="
            display: flex;
            flex-direction: column;
            align-items: center;
            cursor: pointer;
            filter: drop-shadow(0 2px 6px rgba(16,185,129,0.45));
            user-select: none;
          ">
            <div style="
              display: flex;
              align-items: center;
              gap: 3px;
              background: #064e3b;
              color: #a7f3d0;
              padding: 2px 7px;
              border-radius: 12px;
              border: 1.5px solid #10b981;
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
              font-size: 9.5px;
              font-weight: 800;
              white-space: nowrap;
              animation: depotWave 2.5s infinite ease-in-out;
            ">
              <span style="font-size: 11px;">♻️</span>
              <span>${depot.shortName || depot.name || 'Depot'}</span>
            </div>
            <div style="
              width: 0;
              height: 0;
              border-left: 3px solid transparent;
              border-right: 3px solid transparent;
              border-top: 4px solid #10b981;
              margin-top: -0.5px;
            "></div>
          </div>
        `;
        el.onclick = () => {
          map.flyTo({ center: toMapCoordinates(depot.lng, depot.lat), zoom: 15.5 });
        };

        const marker = new maplibregl.Marker({ element: el, anchor: 'bottom' })
          .setLngLat(toMapCoordinates(depot.lng, depot.lat))
          .addTo(map);

        existingMarkers.set(depot.id, marker);
      }
    });
  }, [simulationState?.depots, simulationState?.depot]);

  // 5. Render & Cập nhật các GHIM THÙNG RÁC (Smart Bins)
  useEffect(() => {
    if (!map || !simulationState?.bins) return;

    const currentBins = simulationState.bins;
    const existingMarkers = binMarkersRef.current;
    const activeBinIds = new Set(currentBins.map((b) => b.id));

    // Xóa marker nếu thùng bị xóa
    existingMarkers.forEach((marker, binId) => {
      if (!activeBinIds.has(binId)) {
        marker.remove();
        existingMarkers.delete(binId);
      }
    });

    // Xác định các thùng rác mà tài xế/xe đang chọn sẽ gom
    const focusedVehicle = focusedVehicleId
      ? simulationState?.vehicles?.find((v) => v.vehicleId === focusedVehicleId)
      : null;

    const assignedBinIdsForFocused = new Set();
    if (focusedVehicle) {
      if (focusedVehicle.targetBinId) {
        assignedBinIdsForFocused.add(focusedVehicle.targetBinId);
      }
      if (focusedVehicle.waypoints && focusedVehicle.waypoints.length > 0) {
        focusedVehicle.waypoints.forEach((wp) => {
          if (wp.binId) assignedBinIdsForFocused.add(wp.binId);
        });
      }
      currentBins.forEach((b) => {
        if (b.assignedVehicleId === focusedVehicle.vehicleId) {
          assignedBinIdsForFocused.add(b.id);
        }
      });
      if (simulationState?.activeOptimizationReport?.vehicleRoutes) {
        const vRoute = simulationState.activeOptimizationReport.vehicleRoutes.find(
          (r) => r.vehicleId === focusedVehicle.vehicleId,
        );
        if (vRoute?.stops) {
          vRoute.stops.forEach((s) => {
            if (s.binId) {
              const bObj = currentBins.find((b) => b.id === s.binId);
              if (!bObj || bObj.status !== 'NORMAL' || bObj.currentFillPercent > 0) {
                assignedBinIdsForFocused.add(s.binId);
              }
            }
          });
        }
      }
    }

    currentBins.forEach((bin) => {
      const fill = Math.round(bin.currentFillPercent);
      const isOverflow = fill >= (simulationState.overflowThreshold || 80);
      const isCollecting = bin.status === 'COLLECTING';
      const isAssigned = Boolean(bin.assignedVehicleId);

      let statusColor = '#10b981'; // Xanh lá (<50%)
      if (fill >= 50 && fill < 80) statusColor = '#f59e0b'; // Vàng cam (50-79%)
      if (fill >= 80) statusColor = '#ef4444'; // Đỏ (>=80%)

      if (!existingMarkers.has(bin.id)) {
        const el = document.createElement('div');
        el.className = `main-bin-marker main-bin-${bin.id}`;
        el.style.cursor = 'pointer';

        el.onclick = (e) => {
          e.stopPropagation();
          setSelectedBin(bin);
        };

        const marker = new maplibregl.Marker({ element: el, anchor: 'bottom' })
          .setLngLat(toMapCoordinates(bin.lng, bin.lat))
          .addTo(map);

        existingMarkers.set(bin.id, marker);
      }

      const marker = existingMarkers.get(bin.id);
      const el = marker.getElement();

      // NẾU ĐANG CHỌN 1 TÀI XẾ CỤ THỂ:
      // Chỉ hiện các thùng rác tài xế đó sẽ gom, ẩn hoàn toàn các thùng không liên quan
      if (focusedVehicleId) {
        const willCollect = assignedBinIdsForFocused.has(bin.id);
        if (!willCollect) {
          el.style.display = 'none';
          return;
        }
      }
      el.style.display = '';

      const pulseStyle = isOverflow
        ? 'box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.9); animation: binMiniPulse 1.4s infinite ease-in-out;'
        : isCollecting
          ? 'box-shadow: 0 0 0 0 rgba(59, 130, 246, 0.9); animation: binCollectMiniHalo 1.1s infinite ease-in-out;'
          : '';

      const stopNumberBadge = bin.assignedStopNumber
        ? `<div style="
            position: absolute;
            top: -6px;
            right: -6px;
            background: linear-gradient(135deg, #6366f1, #0284c7);
            color: #ffffff;
            font-size: 8px;
            font-weight: 900;
            width: 14px;
            height: 14px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            border: 1.5px solid #ffffff;
            box-shadow: 0 1px 4px rgba(0,0,0,0.3);
            z-index: 10;
          ">#${bin.assignedStopNumber}</div>`
        : '';

      const collectingTag = isCollecting
        ? `<div style="
            background: #2563eb;
            color: #ffffff;
            font-size: 7.5px;
            padding: 1px 4px;
            border-radius: 4px;
            margin-top: 1px;
            font-weight: 800;
            white-space: nowrap;
            box-shadow: 0 1px 4px rgba(37,99,235,0.4);
          ">⏳ Gom</div>`
        : isAssigned
          ? `<div style="
              background: #7c3aed;
              color: #ffffff;
              font-size: 7.5px;
              padding: 1px 4px;
              border-radius: 4px;
              margin-top: 1px;
              font-weight: 800;
              white-space: nowrap;
              box-shadow: 0 1px 4px rgba(124,58,237,0.3);
            ">V${bin.assignedVehicleId.replace('VEH-0', '').replace('VEH-', '')}</div>`
          : '';

      const binShortId = bin.id.replace('BIN-', '');

      el.innerHTML = `
        <style>
          @keyframes binMiniPulse {
            0% { transform: scale(0.96); box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.85); }
            70% { transform: scale(1.06); box-shadow: 0 0 0 7px rgba(239, 68, 68, 0); }
            100% { transform: scale(0.96); box-shadow: 0 0 0 0 rgba(239, 68, 68, 0); }
          }
          @keyframes binCollectMiniHalo {
            0% { transform: scale(0.97); box-shadow: 0 0 0 0 rgba(59, 130, 246, 0.85); }
            70% { transform: scale(1.06); box-shadow: 0 0 0 6px rgba(59, 130, 246, 0); }
            100% { transform: scale(0.97); box-shadow: 0 0 0 0 rgba(59, 130, 246, 0); }
          }
        </style>
        <div style="
          display: flex;
          flex-direction: column;
          align-items: center;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          user-select: none;
          filter: drop-shadow(0 2px 5px rgba(0,0,0,0.3));
        ">
          <!-- Huy hiệu tròn gọn gàng thể hiện % rác -->
          <div style="
            position: relative;
            background: ${statusColor};
            color: #ffffff;
            width: 24px;
            height: 24px;
            border-radius: 50%;
            border: 1.5px solid #ffffff;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 8.5px;
            font-weight: 900;
            ${pulseStyle}
          ">
            ${stopNumberBadge}
            ${fill}%
          </div>

          <!-- Kim cắm nhỏ gọn -->
          <div style="
            width: 0;
            height: 0;
            border-left: 3px solid transparent;
            border-right: 3px solid transparent;
            border-top: 4px solid ${statusColor};
            margin-top: -0.5px;
          "></div>

          <!-- Micro nhãn ID -->
          <div style="
            background: rgba(15, 23, 42, 0.82);
            color: #ffffff;
            font-size: 7px;
            font-weight: 700;
            padding: 0.5px 3px;
            border-radius: 3px;
            margin-top: 1px;
            white-space: nowrap;
          ">
            ${binShortId}
          </div>
          ${collectingTag}
        </div>
      `;
    });
  }, [
    simulationState?.bins,
    simulationState?.overflowThreshold,
    simulationState?.vehicles,
    simulationState?.activeOptimizationReport,
    focusedVehicleId,
  ]);

  // 6. Render & Cập nhật các GHIM XE THU GOM DI CHUYỂN
  useEffect(() => {
    if (!map || !simulationState?.vehicles) return;

    const vehicles = simulationState.vehicles;
    const existingMarkers = vehicleMarkersRef.current;

    vehicles.forEach((veh) => {
      let marker = existingMarkers.get(veh.vehicleId);

      if (!marker) {
        const el = document.createElement('div');
        el.className = `main-vehicle-marker main-veh-${veh.vehicleId}`;
        el.style.cursor = 'pointer';

        el.onclick = (e) => {
          e.stopPropagation();
          handleSelectVehicle(veh.vehicleId);
        };

        marker = new maplibregl.Marker({ element: el, anchor: 'center' })
          .setLngLat(toMapCoordinates(veh.lng, veh.lat))
          .addTo(map);

        existingMarkers.set(veh.vehicleId, marker);
      }

      // Di chuyển marker theo tọa độ mới nhất
      marker.setLngLat(toMapCoordinates(veh.lng, veh.lat));

      const el = marker.getElement();

      // NẾU ĐANG CHỌN 1 TÀI XẾ CỤ THỂ:
      // Chỉ hiện xe của tài xế đó, ẩn hoàn toàn các xe khác không liên quan
      if (focusedVehicleId && veh.vehicleId !== focusedVehicleId) {
        el.style.display = 'none';
        return;
      }
      el.style.display = '';

      const loadPercent = Math.round((veh.currentLoadKg / veh.maxCapacityKg) * 100);
      const isFocused = veh.vehicleId === focusedVehicleId;

      const vehShortId = `V${veh.vehicleId.replace('VEH-0', '').replace('VEH-', '')}`;

      let miniStatus = '';
      if (veh.status === 'MOVING_TO_BIN') {
        miniStatus = `<div style="background:#0284c7;color:#fff;font-size:7px;font-weight:800;padding:0.5px 3px;border-radius:3px;margin-top:1px;white-space:nowrap;">👉 ${veh.targetBinId ? veh.targetBinId.replace('BIN-', '') : ''}</div>`;
      } else if (veh.status === 'COLLECTING') {
        miniStatus = `<div style="background:#d97706;color:#fff;font-size:7px;font-weight:800;padding:0.5px 3px;border-radius:3px;margin-top:1px;white-space:nowrap;animation:vehTagBounce 0.8s infinite;">⏳ Gom</div>`;
      } else if (veh.status === 'MOVING_TO_DEPOT') {
        miniStatus = `<div style="background:#8b5cf6;color:#fff;font-size:7px;font-weight:800;padding:0.5px 3px;border-radius:3px;margin-top:1px;white-space:nowrap;">♻️ Trạm</div>`;
      } else if (veh.status === 'UNLOADING') {
        miniStatus = `<div style="background:#059669;color:#fff;font-size:7px;font-weight:800;padding:0.5px 3px;border-radius:3px;margin-top:1px;white-space:nowrap;animation:vehTagBounce 0.8s infinite;">♻️ Xả</div>`;
      }

      const isCollectingVeh = veh.status === 'COLLECTING';
      const isUnloadingVeh = veh.status === 'UNLOADING';
      const isMovingVeh = veh.status === 'MOVING_TO_BIN' || veh.status === 'MOVING_TO_DEPOT';

      const animStyle = isCollectingVeh
        ? 'animation: vehCollectPulse 0.9s infinite ease-in-out;'
        : isUnloadingVeh
          ? 'animation: vehUnloadPulse 0.9s infinite ease-in-out;'
          : isMovingVeh
            ? 'animation: vehMotionPulse 1.8s infinite ease-in-out;'
            : '';

      const iconBoxShadow = isFocused
        ? `box-shadow: 0 0 0 2.5px #fbbf24, 0 0 16px rgba(251, 191, 36, 0.9); border: 2px solid #ffffff;`
        : `box-shadow: 0 2px 6px rgba(0,0,0,0.32); border: 1.5px solid #ffffff;`;

      const trackingTag =
        isFocused && isTrackingVehicle
          ? `<div style="background:#fbbf24;color:#0f172a;font-size:7px;padding:0.5px 4px;border-radius:3px;font-weight:900;margin-top:1px;box-shadow:0 1px 4px rgba(0,0,0,0.3); animation: vehTagBounce 1s infinite;">🎯 BÁM THEO</div>`
          : '';

      el.innerHTML = `
        <style>
          @keyframes vehCollectPulse {
            0% { transform: rotate(${veh.heading || 0}deg) scale(1); box-shadow: 0 0 0 0 rgba(217, 119, 6, 0.85); }
            50% { transform: rotate(${veh.heading || 0}deg) scale(1.08); box-shadow: 0 0 0 8px rgba(217, 119, 6, 0); }
            100% { transform: rotate(${veh.heading || 0}deg) scale(1); box-shadow: 0 0 0 0 rgba(217, 119, 6, 0); }
          }
          @keyframes vehUnloadPulse {
            0% { transform: rotate(${veh.heading || 0}deg) scale(1); box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.85); }
            50% { transform: rotate(${veh.heading || 0}deg) scale(1.08); box-shadow: 0 0 0 9px rgba(16, 185, 129, 0); }
            100% { transform: rotate(${veh.heading || 0}deg) scale(1); box-shadow: 0 0 0 0 rgba(16, 185, 129, 0); }
          }
          @keyframes vehMotionPulse {
            0% { box-shadow: 0 0 0 0 rgba(2, 132, 199, 0.6); }
            70% { box-shadow: 0 0 0 7px rgba(2, 132, 199, 0); }
            100% { box-shadow: 0 0 0 0 rgba(2, 132, 199, 0); }
          }
          @keyframes vehTagBounce {
            0%, 100% { transform: translateY(0); }
            50% { transform: translateY(-1.5px); }
          }
        </style>
        <div style="
          display: flex;
          flex-direction: column;
          align-items: center;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          user-select: none;
          filter: drop-shadow(0 2px 6px rgba(0,0,0,0.35));
        ">
          <!-- Nhãn micro xe & % tải -->
          <div style="
            background: #0f172a;
            color: #ffffff;
            font-size: 8px;
            font-weight: 800;
            padding: 1px 4px;
            border-radius: 4px;
            border: 1px solid ${isFocused ? '#fbbf24' : veh.color};
            white-space: nowrap;
            margin-bottom: 1.5px;
          ">
            ${vehShortId} • ${loadPercent}%
          </div>

          <!-- Puck Xe gọn gàng xoay theo hướng di chuyển -->
          <div style="
            width: 28px;
            height: 28px;
            border-radius: 50%;
            background: ${veh.color};
            ${iconBoxShadow}
            display: flex;
            align-items: center;
            justify-content: center;
            transform: rotate(${veh.heading || 0}deg);
            transition: transform 0.15s ease-out;
            ${animStyle}
          ">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="#ffffff">
              <path d="M20 8h-3V4H3c-1.1 0-2 .9-2 2v11h2c0 1.66 1.34 3 3 3s3-1.34 3-3h6c0 1.66 1.34 3 3 3s3-1.34 3-3h2v-5l-3-4zM6 18.5c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zm13.5-9l1.96 2.5H17V9.5h2.5zm-1.5 9c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5z"/>
            </svg>
          </div>
          ${miniStatus}
          ${trackingTag}
        </div>
      `;
    });
  }, [simulationState?.vehicles, focusedVehicleId, handleSelectVehicle, isTrackingVehicle]);

  // 7. Cập nhật đường lộ trình (Polyline)
  useEffect(() => {
    if (!map || !simulationState?.vehicles) return;
    const source = map.getSource('waste-routes-source');
    if (!source) return;

    const features = [];

    simulationState.vehicles.forEach((veh) => {
      // Khi người dùng chọn xem 1 xe cụ thể, chỉ hiển thị lộ trình của riêng xe đó
      if (focusedVehicleId && veh.vehicleId !== focusedVehicleId) return;

      if (veh.targetCoords) {
        let coords = [];

        // Nếu xe đã có tọa độ đường giao thông thực tế OSRM
        if (veh.roadPathCoordinates && veh.roadPathCoordinates.length > 1) {
          // Bắt đầu từ vị trí hiện tại của xe đến các điểm tiếp theo trên đường
          coords.push(toMapCoordinates(veh.lng, veh.lat));
          const currentIdx = veh.roadPathIndex || 0;
          for (let i = currentIdx + 1; i < veh.roadPathCoordinates.length; i++) {
            const pt = veh.roadPathCoordinates[i];
            coords.push(toMapCoordinates(pt[0], pt[1]));
          }
        } else {
          coords = [
            toMapCoordinates(veh.lng, veh.lat),
            toMapCoordinates(veh.targetCoords.lng, veh.targetCoords.lat),
          ];
        }

        // Nối tiếp toàn bộ các điểm dừng còn lại trong lộ trình DỌC THEO MẶT ĐƯỜNG
        let prevLegStop = veh.targetCoords;
        if (veh.waypoints && veh.waypoints.length > 0) {
          veh.waypoints.forEach((wp) => {
            if (prevLegStop) {
              const legRoadCoords = roadRoutingService.getRoadCoordinatesSync(
                prevLegStop.lng,
                prevLegStop.lat,
                wp.lng,
                wp.lat,
              );
              if (legRoadCoords && legRoadCoords.length > 1) {
                for (let k = 1; k < legRoadCoords.length; k++) {
                  coords.push(toMapCoordinates(legRoadCoords[k][0], legRoadCoords[k][1]));
                }
              } else {
                coords.push(toMapCoordinates(wp.lng, wp.lat));
              }
            }
            prevLegStop = wp;
          });
        }

        // Nối tiếp chặng cuối cùng về Trạm dỡ rác (Depot) DỌC THEO MẶT ĐƯỜNG
        if (veh.status !== 'MOVING_TO_DEPOT' && veh.status !== 'UNLOADING') {
          const targetDepot =
            (veh.targetDepotId &&
              simulationState?.depots?.find((d) => d.id === veh.targetDepotId)) ||
            veh.targetDepot ||
            veh.assignedDepot ||
            simulationState?.depot;
          if (targetDepot && prevLegStop) {
            const depotRoadCoords = roadRoutingService.getRoadCoordinatesSync(
              prevLegStop.lng,
              prevLegStop.lat,
              targetDepot.lng,
              targetDepot.lat,
            );
            if (depotRoadCoords && depotRoadCoords.length > 1) {
              for (let k = 1; k < depotRoadCoords.length; k++) {
                coords.push(toMapCoordinates(depotRoadCoords[k][0], depotRoadCoords[k][1]));
              }
            } else {
              coords.push(toMapCoordinates(targetDepot.lng, targetDepot.lat));
            }
          }
        }

        // Khi xe đang về Depot, đảm bảo điểm cuối cùng của đường dẫn nối thẳng vào tâm Trạm Depot tương ứng
        if (veh.status === 'MOVING_TO_DEPOT' && coords.length > 0) {
          const targetDepot =
            (veh.targetDepotId &&
              simulationState?.depots?.find((d) => d.id === veh.targetDepotId)) ||
            simulationState?.depot;
          if (targetDepot) {
            const depotMapCoords = toMapCoordinates(targetDepot.lng, targetDepot.lat);
            const lastPt = coords[coords.length - 1];
            if (
              Math.abs(lastPt[0] - depotMapCoords[0]) > 0.0001 ||
              Math.abs(lastPt[1] - depotMapCoords[1]) > 0.0001
            ) {
              coords.push(depotMapCoords);
            }
          }
        }

        if (coords.length >= 2) {
          features.push({
            type: 'Feature',
            geometry: {
              type: 'LineString',
              coordinates: coords,
            },
            properties: {
              vehicleId: veh.vehicleId,
              color: veh.color || '#0284c7',
            },
          });
        }
      }
    });

    source.setData({
      type: 'FeatureCollection',
      features,
    });
  }, [
    simulationState?.vehicles,
    simulationState?.depot,
    simulationState?.depots,
    focusedVehicleId,
  ]);

  // Xác nhận thêm thùng rác mới
  const handleConfirmAddBin = () => {
    if (!newBinCoords) return;
    simulationEngine.addBinAtLocation({
      lat: newBinCoords.lat,
      lng: newBinCoords.lng,
      name: newBinName,
      capacityKg: newBinCapacity,
      initialFill: newBinInitialFill,
      fillRate: newBinFillRate,
    });
    setNewBinCoords(null);
  };

  const handleZoomToCluster = useCallback(() => {
    if (map) {
      map.flyTo({
        center: toMapCoordinates(106.698, 10.774),
        zoom: 14.5,
        pitch: 25,
        duration: 1200,
      });
    }
  }, []);

  const overflowCount = simulationState.bins.filter(
    (b) => b.currentFillPercent >= simulationState.overflowThreshold,
  ).length;

  return (
    <>
      <style>{`
        @keyframes brainGlow {
          0%, 100% { transform: scale(1); filter: drop-shadow(0 0 2px #818cf8); }
          50% { transform: scale(1.16); filter: drop-shadow(0 0 10px #c084fc); }
        }
        @keyframes liveDotPing {
          0% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.85); }
          70% { transform: scale(1.1); box-shadow: 0 0 0 8px rgba(16, 185, 129, 0); }
          100% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(16, 185, 129, 0); }
        }
        @keyframes dilemmaPopIn {
          0% { opacity: 0; transform: scale(0.92) translateY(-10px); }
          100% { opacity: 1; transform: scale(1) translateY(0); }
        }
        @keyframes sirenRock {
          0%, 100% { transform: rotate(0deg); }
          20% { transform: rotate(-14deg); }
          40% { transform: rotate(14deg); }
          60% { transform: rotate(-8deg); }
          80% { transform: rotate(8deg); }
        }
        @keyframes dangerBorderGlow {
          0%, 100% { border-color: #f59e0b; box-shadow: 0 4px 16px rgba(245, 158, 11, 0.35); }
          50% { border-color: #ef4444; box-shadow: 0 6px 24px rgba(239, 68, 68, 0.55); }
        }
        @keyframes primaryBtnPulse {
          0%, 100% { box-shadow: 0 3px 10px rgba(37, 99, 235, 0.35); transform: translateY(0); }
          50% { box-shadow: 0 6px 18px rgba(37, 99, 235, 0.65); transform: translateY(-2px); }
        }
        @keyframes dotWave {
          0%, 80%, 100% { transform: scale(0.6); opacity: 0.35; }
          40% { transform: scale(1.3); opacity: 1; }
        }
        @keyframes thoughtSlideIn {
          from { opacity: 0; transform: translateY(-8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes newBadgeShine {
          0%, 100% { opacity: 0.85; transform: scale(1); }
          50% { opacity: 1; transform: scale(1.08); }
        }
      `}</style>

      {/* Thanh công cụ Chọn Xem Từng Xe một (Vehicle Selector Bar) */}
      <VehicleSelectorBar
        vehicles={simulationState.vehicles}
        focusedVehicleId={focusedVehicleId}
        onSelectVehicle={handleSelectVehicle}
        bins={simulationState.bins}
        activeOptimizationReport={simulationState.activeOptimizationReport}
      />

      {/* Banner thông báo khi đang ở chế độ cắm thùng */}
      {isAddingBinMode && (
        <Paper
          elevation={5}
          sx={{
            position: 'absolute',
            top: 16,
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 10,
            py: 1,
            px: 2.5,
            borderRadius: 3,
            backgroundColor: '#0284c7',
            color: '#ffffff',
            display: 'flex',
            alignItems: 'center',
            gap: 1.5,
            border: '2px solid #ffffff',
            boxShadow: '0 6px 20px rgba(2,132,199,0.5)',
          }}
        >
          <AddLocationAltIcon />
          <Typography variant="body2" sx={{ fontWeight: 800 }}>
            Chế độ cắm thùng rác: Nhấp chuột vào bất kỳ vị trí nào trên bản đồ!
          </Typography>
          <Button
            size="small"
            variant="contained"
            color="inherit"
            onClick={() => setIsAddingBinMode(false)}
            sx={{
              color: '#0284c7',
              fontWeight: 800,
              fontSize: '0.75rem',
              py: 0.2,
              px: 1,
              ml: 1,
            }}
          >
            Xong
          </Button>
        </Paper>
      )}

      {/* Bảng điều khiển nổi Thu gọn/Mở rộng (AI Chain-of-Thought & Autonomous Decision Console) */}
      <Paper
        elevation={6}
        sx={{
          position: 'absolute',
          top: 16,
          right: 16,
          zIndex: 6,
          borderRadius: panelOpen ? 3 : 5,
          backgroundColor: panelOpen ? 'rgba(255, 255, 255, 0.97)' : '#0f172a',
          backdropFilter: 'blur(12px)',
          border: '1px solid',
          borderColor: panelOpen ? '#e2e8f0' : 'rgba(255,255,255,0.2)',
          width: panelOpen ? { xs: 300, sm: 335 } : 'auto',
          maxWidth: { xs: 'calc(100vw - 32px)', sm: 350 },
          overflow: 'hidden',
          boxShadow: '0 8px 30px rgba(0,0,0,0.18)',
          transition: 'all 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
        }}
      >
        {/* Header Widget */}
        <Box
          sx={{
            py: panelOpen ? 0.8 : 0.6,
            px: panelOpen ? 1.2 : 1.2,
            backgroundColor: '#0f172a',
            color: '#ffffff',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            cursor: 'pointer',
            userSelect: 'none',
          }}
          onClick={() => setPanelOpen(!panelOpen)}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8, minWidth: 0 }}>
            <Box
              sx={{
                width: 8,
                height: 8,
                borderRadius: '50%',
                flexShrink: 0,
                backgroundColor: simulationState.isRunning ? '#10b981' : '#f59e0b',
                boxShadow: simulationState.isRunning ? '0 0 8px #10b981' : 'none',
                animation: simulationState.isRunning
                  ? 'liveDotPing 1.8s infinite ease-in-out'
                  : 'none',
              }}
            />
            <PsychologyIcon
              sx={{
                fontSize: '1.15rem',
                color: '#818cf8',
                flexShrink: 0,
                animation: simulationState.isRunning
                  ? 'brainGlow 2.5s infinite ease-in-out'
                  : 'none',
              }}
            />
            <Typography
              variant="subtitle2"
              sx={{
                fontWeight: 800,
                fontSize: '0.8rem',
                whiteSpace: 'nowrap',
              }}
            >
              {panelOpen
                ? 'Mô Phỏng Suy Nghĩ AI'
                : `AI (${simulationState.vehicles.length} xe / ${overflowCount} đầy)`}
            </Typography>
          </Box>

          <Box
            sx={{ display: 'flex', alignItems: 'center', gap: 0.2 }}
            onClick={(e) => e.stopPropagation()}
          >
            {panelOpen && (
              <>
                <Tooltip
                  title={simulationState.isRunning ? 'Tạm dừng mô phỏng' : 'Tiếp tục mô phỏng'}
                >
                  <IconButton
                    size="small"
                    sx={{ color: '#ffffff', p: 0.3 }}
                    onClick={() =>
                      simulationState.isRunning
                        ? simulationEngine.pause()
                        : simulationEngine.start()
                    }
                  >
                    {simulationState.isRunning ? (
                      <PauseIcon sx={{ fontSize: '1rem' }} />
                    ) : (
                      <PlayArrowIcon sx={{ fontSize: '1rem' }} />
                    )}
                  </IconButton>
                </Tooltip>

                <Tooltip title="Reset mô phỏng">
                  <IconButton
                    size="small"
                    sx={{ color: '#94a3b8', p: 0.3, '&:hover': { color: '#ffffff' } }}
                    onClick={() => simulationEngine.reset()}
                  >
                    <RestartAltIcon sx={{ fontSize: '1rem' }} />
                  </IconButton>
                </Tooltip>

                <Tooltip title="Xuất xe gom rác ngay lập tức (không cần chờ đầy 80%)">
                  <IconButton
                    size="small"
                    sx={{ color: '#34d399', p: 0.3, '&:hover': { color: '#10b981' } }}
                    onClick={() => simulationEngine.forceDispatchNow()}
                  >
                    <FlashOnIcon sx={{ fontSize: '1rem' }} />
                  </IconButton>
                </Tooltip>

                <Tooltip title="Căn giữa Quận 1">
                  <IconButton
                    size="small"
                    sx={{ color: '#94a3b8', p: 0.3, '&:hover': { color: '#ffffff' } }}
                    onClick={handleZoomToCluster}
                  >
                    <CenterFocusStrongIcon sx={{ fontSize: '1rem' }} />
                  </IconButton>
                </Tooltip>

                <Tooltip
                  title={
                    isAddingBinMode ? 'Tắt chế độ cắm thùng' : 'Cắm thêm thùng rác mới trên bản đồ'
                  }
                >
                  <IconButton
                    size="small"
                    sx={{
                      color: isAddingBinMode ? '#38bdf8' : '#94a3b8',
                      p: 0.3,
                      '&:hover': { color: '#38bdf8' },
                    }}
                    onClick={() => setIsAddingBinMode(!isAddingBinMode)}
                  >
                    <AddLocationAltIcon sx={{ fontSize: '1rem' }} />
                  </IconButton>
                </Tooltip>
              </>
            )}

            <IconButton
              size="small"
              sx={{ color: '#ffffff', p: 0.3 }}
              onClick={() => setPanelOpen(!panelOpen)}
            >
              {panelOpen ? (
                <ExpandLessIcon sx={{ fontSize: '1.1rem' }} />
              ) : (
                <ExpandMoreIcon sx={{ fontSize: '1.1rem' }} />
              )}
            </IconButton>
          </Box>
        </Box>

        {/* Thân Widget */}
        <Collapse in={panelOpen}>
          <Box sx={{ p: 1.1 }}>
            {/* Thanh trạng thái chu kỳ AI */}
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                p: '6px 10px',
                mb: 1,
                borderRadius: 2,
                backgroundColor:
                  simulationState?.aiState === 'WAITING_FLEET'
                    ? '#fefce8'
                    : simulationState?.aiState === 'OPTIMIZING'
                      ? '#eff6ff'
                      : '#f0fdf4',
                border: '1px solid',
                borderColor:
                  simulationState?.aiState === 'WAITING_FLEET'
                    ? '#fef08a'
                    : simulationState?.aiState === 'OPTIMIZING'
                      ? '#bfdbfe'
                      : '#bbf7d0',
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.6 }}>
                <Typography
                  variant="caption"
                  sx={{ fontWeight: 800, fontSize: '0.7rem', color: '#475569' }}
                >
                  TRẠNG THÁI:
                </Typography>
                <Chip
                  size="small"
                  label={
                    simulationState?.aiState === 'WAITING_FLEET'
                      ? '🛰️ AI Giám Sát Tuyến'
                      : simulationState?.aiState === 'OPTIMIZING'
                        ? '⚡ AI Đang Tối Ưu Tuyến'
                        : '✨ AI Sẵn Sàng (Chờ việc)'
                  }
                  sx={{
                    fontWeight: 800,
                    fontSize: '0.68rem',
                    height: 20,
                    backgroundColor:
                      simulationState?.aiState === 'WAITING_FLEET'
                        ? '#fef08a'
                        : simulationState?.aiState === 'OPTIMIZING'
                          ? '#dbeafe'
                          : '#dcfce7',
                    color:
                      simulationState?.aiState === 'WAITING_FLEET'
                        ? '#854d0e'
                        : simulationState?.aiState === 'OPTIMIZING'
                          ? '#1e40af'
                          : '#166534',
                  }}
                />
              </Box>
              <Typography
                variant="caption"
                sx={{ color: '#64748b', fontSize: '0.68rem', fontWeight: 700 }}
              >
                {simulationState?.aiState === 'WAITING_FLEET'
                  ? `${simulationState.vehicles.filter((v) => v.status !== 'IDLE').length} xe đang gom`
                  : simulationState?.aiState === 'OPTIMIZING'
                    ? 'Đang giải CVRP'
                    : 'Toàn đội rảnh'}
              </Typography>
            </Box>

            {/* Thống kê nhanh */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1, gap: 0.6 }}>
              <Chip
                label={`🗑️ ${overflowCount}/${simulationState.bins.length} đầy`}
                size="small"
                color={overflowCount > 0 ? 'error' : 'success'}
                sx={{ fontWeight: 800, fontSize: '0.68rem', height: 22, flex: 1 }}
              />
              <Chip
                label={`🚚 ${simulationState.vehicles.length} xe`}
                size="small"
                color="primary"
                sx={{ fontWeight: 800, fontSize: '0.68rem', height: 22, flex: 1 }}
              />
              <Chip
                label={`⚖️ ${simulationState.stats.totalCollectedKg}kg`}
                size="small"
                sx={{ fontWeight: 800, fontSize: '0.68rem', height: 22, flex: 1 }}
              />
            </Box>

            {/* Cảnh báo khi mô phỏng đang tạm dừng */}
            {!simulationState.isRunning && (
              <Paper
                elevation={0}
                sx={{
                  p: 0.8,
                  mb: 1,
                  borderRadius: 1.5,
                  backgroundColor: '#fef3c7',
                  border: '1.5px solid #f59e0b',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <Typography
                  variant="caption"
                  sx={{ color: '#92400e', fontWeight: 800, fontSize: '0.68rem' }}
                >
                  ⏸️ Đang tạm dừng (Xe không di chuyển)
                </Typography>
                <Button
                  size="small"
                  variant="contained"
                  color="warning"
                  startIcon={<PlayArrowIcon sx={{ fontSize: '0.85rem' }} />}
                  onClick={() => simulationEngine.start()}
                  sx={{
                    py: 0.2,
                    px: 0.8,
                    fontSize: '0.65rem',
                    fontWeight: 800,
                    textTransform: 'none',
                    borderRadius: 1,
                  }}
                >
                  Tiếp tục
                </Button>
              </Paper>
            )}

            {/* Trạng thái khi tất cả thùng sạch và toàn đội xe đang rảnh */}
            {simulationState.isRunning &&
              overflowCount === 0 &&
              simulationState.vehicles.every((v) => v.status === 'IDLE') && (
                <Paper
                  elevation={0}
                  sx={{
                    p: 0.8,
                    mb: 1,
                    borderRadius: 1.5,
                    backgroundColor: '#f0fdf4',
                    border: '1px solid #86efac',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 0.6,
                  }}
                >
                  <Typography
                    variant="caption"
                    sx={{ color: '#166534', fontWeight: 800, fontSize: '0.68rem' }}
                  >
                    ✨ Đã dọn sạch thùng rác đầy. Toàn đội đang nghỉ tại trạm.
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 0.6 }}>
                    <Button
                      size="small"
                      variant="contained"
                      color="success"
                      fullWidth
                      startIcon={<FlashOnIcon sx={{ fontSize: '0.85rem' }} />}
                      onClick={() => simulationEngine.forceDispatchNow()}
                      sx={{
                        py: 0.3,
                        fontSize: '0.66rem',
                        fontWeight: 800,
                        textTransform: 'none',
                        borderRadius: 1.2,
                      }}
                    >
                      🚀 Gom rác ngay
                    </Button>
                    <Button
                      size="small"
                      variant="outlined"
                      color="success"
                      onClick={() => simulationEngine.triggerRandomOverflow(3)}
                      sx={{
                        py: 0.3,
                        px: 0.8,
                        fontSize: '0.66rem',
                        fontWeight: 800,
                        textTransform: 'none',
                        borderRadius: 1.2,
                        whiteSpace: 'nowrap',
                      }}
                    >
                      ⚡ Rác cao điểm (+3)
                    </Button>
                  </Box>
                </Paper>
              )}

            {/* PHẦN 1: QUYẾT ĐỊNH KHÓ KHĂN CẦN ĐIỀU PHỐI VIÊN XÁC NHẬN */}
            {simulationState.pendingDecision ? (
              <Paper
                elevation={4}
                sx={{
                  p: 1.1,
                  mb: 1.1,
                  borderRadius: 2,
                  backgroundColor: simulationState.pendingDecision.isSos ? '#fef2f2' : '#fffbeb',
                  border: simulationState.pendingDecision.isSos
                    ? '2px solid #ef4444'
                    : '1.5px solid #f59e0b',
                  boxShadow: simulationState.pendingDecision.isSos
                    ? '0 4px 16px rgba(239, 68, 68, 0.3)'
                    : '0 4px 14px rgba(245, 158, 11, 0.2)',
                  animation:
                    'dilemmaPopIn 0.4s cubic-bezier(0.34, 1.56, 0.64, 1), dangerBorderGlow 2s infinite ease-in-out',
                }}
              >
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    mb: 0.8,
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.6 }}>
                    <WarningAmberIcon
                      sx={{
                        color: simulationState.pendingDecision.isSos ? '#dc2626' : '#d97706',
                        fontSize: '1.1rem',
                        animation: 'sirenRock 1.2s infinite ease-in-out',
                      }}
                    />
                    <Typography
                      variant="subtitle2"
                      sx={{
                        fontWeight: 900,
                        color: simulationState.pendingDecision.isSos ? '#991b1b' : '#92400e',
                        fontSize: '0.74rem',
                      }}
                    >
                      {simulationState.pendingDecision.isSos
                        ? '🚨 BÁO ĐỘNG SOS TỪ XE'
                        : 'AI CẦN XÁC NHẬN'}
                    </Typography>
                  </Box>
                  <Chip
                    label={
                      simulationState.pendingDecision.isSos
                        ? simulationState.pendingDecision.type === 'VEHICLE_SOS_CRITICAL'
                          ? 'SOS Nguy Cấp'
                          : 'SOS Cần Duyệt Tuyến'
                        : 'Tình huống khó'
                    }
                    size="small"
                    color={simulationState.pendingDecision.isSos ? 'error' : 'warning'}
                    sx={{ fontWeight: 800, fontSize: '0.6rem', height: 18 }}
                  />
                </Box>

                <Typography
                  variant="body2"
                  sx={{ fontWeight: 800, color: '#1e293b', fontSize: '0.75rem', mb: 0.8 }}
                >
                  {simulationState.pendingDecision.title}
                </Typography>

                <Paper
                  elevation={0}
                  sx={{
                    p: 0.8,
                    mb: 0.8,
                    borderRadius: 1.2,
                    backgroundColor: '#ffffff',
                    border: '1px solid #fde68a',
                  }}
                >
                  <Typography
                    variant="caption"
                    sx={{
                      color: '#475569',
                      fontSize: '0.66rem',
                      display: 'block',
                      lineHeight: 1.38,
                    }}
                  >
                    <strong>📌 Tình huống:</strong> {simulationState.pendingDecision.situation}
                  </Typography>
                </Paper>

                <Paper
                  elevation={0}
                  sx={{
                    p: 0.8,
                    mb: 1,
                    borderRadius: 1.2,
                    backgroundColor: '#eff6ff',
                    border: '1px solid #bfdbfe',
                  }}
                >
                  <Typography
                    variant="caption"
                    sx={{
                      color: '#1e40af',
                      fontSize: '0.66rem',
                      display: 'block',
                      lineHeight: 1.38,
                    }}
                  >
                    <strong>💡 Đề xuất:</strong> {simulationState.pendingDecision.aiRecommendation}
                  </Typography>
                </Paper>

                <Stack spacing={0.8}>
                  {simulationState.pendingDecision.options.map((opt, idx) => (
                    <Button
                      key={opt.id}
                      fullWidth
                      variant={idx === 0 ? 'contained' : 'outlined'}
                      color={idx === 0 ? 'primary' : 'inherit'}
                      size="small"
                      onClick={() => simulationEngine.resolveDecision(opt.id)}
                      sx={{
                        py: 0.5,
                        px: 0.8,
                        borderRadius: 1.5,
                        textTransform: 'none',
                        justifyContent: 'flex-start',
                        textAlign: 'left',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'flex-start',
                        backgroundColor: idx === 0 ? '#2563eb' : '#ffffff',
                        borderColor: idx === 0 ? '#2563eb' : '#cbd5e1',
                        color: idx === 0 ? '#ffffff' : '#1e293b',
                        boxShadow: idx === 0 ? '0 2px 8px rgba(37,99,235,0.25)' : 'none',
                        '&:hover': {
                          backgroundColor: idx === 0 ? '#1d4ed8' : '#f8fafc',
                        },
                      }}
                    >
                      <Typography variant="body2" sx={{ fontWeight: 800, fontSize: '0.72rem' }}>
                        {opt.label}
                      </Typography>
                      <Typography
                        variant="caption"
                        sx={{ fontSize: '0.61rem', opacity: 0.85, mt: 0.1 }}
                      >
                        {opt.description}
                      </Typography>
                    </Button>
                  ))}
                </Stack>
              </Paper>
            ) : (
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  mb: 1,
                  px: 0.8,
                  py: 0.5,
                  borderRadius: 1.5,
                  backgroundColor: '#f8fafc',
                  border: '1px dashed #cbd5e1',
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.6 }}>
                  <Box
                    sx={{
                      width: 7,
                      height: 7,
                      borderRadius: '50%',
                      backgroundColor: '#10b981',
                      boxShadow: '0 0 5px #10b981',
                      animation: 'liveDotPing 1.8s infinite ease-in-out',
                    }}
                  />
                  <Typography
                    variant="caption"
                    sx={{ color: '#475569', fontSize: '0.66rem', fontWeight: 600 }}
                  >
                    AI tự chủ điều phối {simulationState.vehicles.length} xe
                  </Typography>
                </Box>

                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8 }}>
                  <Tooltip title="Mô phỏng xe phát tín hiệu SOS để AI lập phương án xét duyệt">
                    <Button
                      size="small"
                      variant="text"
                      color="error"
                      onClick={() => {
                        const targetVeh =
                          simulationState.vehicles.find(
                            (v) => !v.isBroken && v.status !== 'IDLE',
                          ) ||
                          simulationState.vehicles.find((v) => !v.isBroken) ||
                          simulationState.vehicles[0];
                        if (targetVeh) {
                          simulationEngine.triggerVehicleSos(
                            targetVeh.vehicleId,
                            false,
                            'Xe gặp sự cố hỏng động cơ giữa chừng',
                          );
                        }
                      }}
                      sx={{
                        fontSize: '0.64rem',
                        fontWeight: 800,
                        textTransform: 'none',
                        p: 0,
                        minWidth: 0,
                        color: '#dc2626',
                        '&:hover': { transform: 'scale(1.04)' },
                      }}
                    >
                      🚨 Thử SOS Xe
                    </Button>
                  </Tooltip>

                  <Tooltip title="Mô phỏng tình huống khó khăn để AI xin ý kiến Điều phối viên">
                    <Button
                      size="small"
                      variant="text"
                      color="warning"
                      onClick={() => simulationEngine.triggerDifficultDecision()}
                      sx={{
                        fontSize: '0.64rem',
                        fontWeight: 800,
                        textTransform: 'none',
                        p: 0,
                        minWidth: 0,
                        '&:hover': { transform: 'scale(1.04)' },
                      }}
                    >
                      ⚡ Thử thách
                    </Button>
                  </Tooltip>

                  <Tooltip title="Kích hoạt gom rác ngay cho toàn bộ các xe rảnh">
                    <Button
                      size="small"
                      variant="text"
                      color="success"
                      onClick={() => simulationEngine.forceDispatchNow()}
                      sx={{
                        fontSize: '0.64rem',
                        fontWeight: 800,
                        textTransform: 'none',
                        p: 0,
                        minWidth: 0,
                        color: '#059669',
                        '&:hover': { transform: 'scale(1.04)' },
                      }}
                    >
                      🚀 Gom ngay
                    </Button>
                  </Tooltip>
                </Box>
              </Box>
            )}

            {/* PHẦN 2: CHUỖI SUY NGHĨ & LẬP LUẬN CỦA AI (AI CHAIN-OF-THOUGHT STREAM) */}
            <Box sx={{ mb: 0.5 }}>
              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  mb: 0.6,
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <PsychologyIcon
                    sx={{
                      fontSize: '0.95rem',
                      color: '#6366f1',
                      animation: simulationState.isRunning
                        ? 'brainGlow 2.5s infinite ease-in-out'
                        : 'none',
                    }}
                  />
                  <Typography
                    variant="caption"
                    sx={{ fontWeight: 800, color: '#334155', fontSize: '0.72rem' }}
                  >
                    Luồng Suy Nghĩ AI
                  </Typography>
                </Box>
                <Chip
                  label={`${simulationState.aiThoughts?.length || 0}`}
                  size="small"
                  sx={{ height: 16, fontSize: '0.58rem', fontWeight: 700 }}
                />
              </Box>

              {/* Dòng trạng thái đang tư duy */}
              {simulationState.isRunning && (
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 0.8,
                    p: 0.5,
                    px: 0.8,
                    borderRadius: 1.2,
                    backgroundColor: '#eef2ff',
                    border: '1px solid #c7d2fe',
                    mb: 0.6,
                  }}
                >
                  <Box sx={{ display: 'flex', gap: 0.3 }}>
                    <Box
                      sx={{
                        width: 4,
                        height: 4,
                        borderRadius: '50%',
                        backgroundColor: '#6366f1',
                        animation: 'dotWave 1.2s infinite ease-in-out',
                        animationDelay: '0s',
                      }}
                    />
                    <Box
                      sx={{
                        width: 4,
                        height: 4,
                        borderRadius: '50%',
                        backgroundColor: '#6366f1',
                        animation: 'dotWave 1.2s infinite ease-in-out',
                        animationDelay: '0.2s',
                      }}
                    />
                    <Box
                      sx={{
                        width: 4,
                        height: 4,
                        borderRadius: '50%',
                        backgroundColor: '#6366f1',
                        animation: 'dotWave 1.2s infinite ease-in-out',
                        animationDelay: '0.4s',
                      }}
                    />
                  </Box>
                  <Typography
                    variant="caption"
                    sx={{
                      color: '#4338ca',
                      fontSize: '0.64rem',
                      fontWeight: 700,
                      fontStyle: 'italic',
                    }}
                  >
                    {simulationState.aiState === 'OPTIMIZING'
                      ? 'Đang giải thuật toán 2-Opt CVRP...'
                      : 'Đang giám sát hành trình thời gian thực OSRM...'}
                  </Typography>
                </Box>
              )}

              <Box
                sx={{
                  maxHeight: 185,
                  overflowY: 'auto',
                  pr: 0.4,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 0.6,
                  '&::-webkit-scrollbar': { width: '3px' },
                  '&::-webkit-scrollbar-track': { background: '#f1f5f9' },
                  '&::-webkit-scrollbar-thumb': {
                    background: '#cbd5e1',
                    borderRadius: '3px',
                  },
                }}
              >
                {simulationState.aiThoughts?.length > 0 ? (
                  simulationState.aiThoughts.map((thought, idx) => {
                    const cfg = STAGE_CONFIG[thought.stage] || {
                      label: thought.stage,
                      color: '#64748b',
                      bgColor: '#f1f5f9',
                      icon: '💡',
                    };
                    const isLatest = idx === 0;

                    return (
                      <Paper
                        key={thought.id}
                        elevation={0}
                        sx={{
                          p: 0.6,
                          borderRadius: 1.4,
                          backgroundColor: isLatest ? '#fcfcff' : '#ffffff',
                          border: isLatest ? '1.2px solid #c7d2fe' : '1px solid #e2e8f0',
                          borderLeft: `3px solid ${cfg.color}`,
                          boxShadow: isLatest ? '0 1px 6px rgba(99, 102, 241, 0.12)' : 'none',
                          animation: 'thoughtSlideIn 0.35s cubic-bezier(0.16, 1, 0.3, 1)',
                          transition: 'all 0.15s',
                        }}
                      >
                        <Box
                          sx={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            mb: 0.2,
                          }}
                        >
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.4 }}>
                            <Chip
                              label={`${thought.icon || cfg.icon} ${cfg.label}`}
                              size="small"
                              sx={{
                                height: 16,
                                fontSize: '0.58rem',
                                fontWeight: 800,
                                color: cfg.color,
                                backgroundColor: cfg.bgColor,
                                border: `1px solid ${cfg.color}30`,
                              }}
                            />
                            {isLatest && (
                              <Chip
                                label="✨ MỚI"
                                size="small"
                                sx={{
                                  height: 14,
                                  fontSize: '0.52rem',
                                  fontWeight: 900,
                                  color: '#4338ca',
                                  backgroundColor: '#e0e7ff',
                                }}
                              />
                            )}
                          </Box>
                          <Typography
                            variant="caption"
                            sx={{ color: '#94a3b8', fontSize: '0.6rem' }}
                          >
                            {thought.time}
                          </Typography>
                        </Box>

                        <Typography
                          variant="body2"
                          sx={{
                            fontWeight: 800,
                            color: '#1e293b',
                            fontSize: '0.7rem',
                            mb: 0.2,
                          }}
                        >
                          {thought.title}
                        </Typography>

                        <Typography
                          variant="caption"
                          sx={{
                            color: '#475569',
                            fontSize: '0.64rem',
                            display: 'block',
                            lineHeight: 1.34,
                          }}
                        >
                          {thought.detail}
                        </Typography>

                        {(thought.vehicleId || thought.binId) && (
                          <Box sx={{ display: 'flex', gap: 0.4, mt: 0.4 }}>
                            {thought.vehicleId && (
                              <Chip
                                label={`🚚 ${thought.vehicleId}`}
                                size="small"
                                sx={{ height: 14, fontSize: '0.55rem', fontWeight: 700 }}
                              />
                            )}
                            {thought.binId && (
                              <Chip
                                label={`🗑️ ${thought.binId}`}
                                size="small"
                                sx={{ height: 14, fontSize: '0.55rem', fontWeight: 700 }}
                              />
                            )}
                          </Box>
                        )}
                      </Paper>
                    );
                  })
                ) : (
                  <Box sx={{ py: 2, textAlign: 'center' }}>
                    <Typography
                      variant="caption"
                      sx={{ color: '#94a3b8', fontStyle: 'italic', fontSize: '0.65rem' }}
                    >
                      Đang đợi dữ liệu IoT...
                    </Typography>
                  </Box>
                )}
              </Box>
            </Box>

            {/* Footer tóm tắt tối ưu & chi tiết VRP */}
            {simulationState.optimizationReport && (
              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  pt: 0.8,
                  mt: 0.8,
                  borderTop: '1px solid #f1f5f9',
                }}
              >
                <Typography
                  variant="caption"
                  sx={{ fontSize: '0.68rem', color: '#166534', fontWeight: 800 }}
                >
                  🏆 2-Opt: -{simulationState.optimizationReport.metrics?.totalDistanceSavedKm} km
                  (-
                  {simulationState.optimizationReport.metrics?.overallSavingsPercent}%)
                </Typography>
                <Button
                  size="small"
                  onClick={() => setInspectorModalOpen(true)}
                  sx={{
                    fontSize: '0.66rem',
                    fontWeight: 800,
                    p: 0,
                    minWidth: 0,
                    textTransform: 'none',
                    color: '#0284c7',
                  }}
                >
                  Bảng VRP ➔
                </Button>
              </Box>
            )}
          </Box>
        </Collapse>
      </Paper>

      {/* Chi tiết Thùng rác khi nhấp vào Ghim */}
      {selectedBin && (
        <Paper
          elevation={6}
          sx={{
            position: 'absolute',
            bottom: 30,
            left: 30,
            zIndex: 10,
            p: 2,
            borderRadius: 3,
            minWidth: 280,
            maxWidth: 320,
            backgroundColor: 'rgba(255, 255, 255, 0.96)',
            backdropFilter: 'blur(10px)',
            border: '1px solid #e2e8f0',
          }}
        >
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              mb: 1,
            }}
          >
            <Box>
              <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#0f172a' }}>
                🗑️ {selectedBin.id} - {selectedBin.name}
              </Typography>
              <Typography variant="caption" sx={{ color: '#64748b' }}>
                {selectedBin.address}
              </Typography>
            </Box>
            <IconButton size="small" onClick={() => setSelectedBin(null)}>
              <CloseIcon fontSize="small" />
            </IconButton>
          </Box>

          <Box sx={{ my: 1.5 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
              <Typography variant="caption" sx={{ fontWeight: 700 }}>
                Mức rác hiện tại:
              </Typography>
              <Typography
                variant="caption"
                sx={{
                  fontWeight: 800,
                  color:
                    selectedBin.currentFillPercent >= 80
                      ? '#ef4444'
                      : selectedBin.currentFillPercent >= 50
                        ? '#f59e0b'
                        : '#10b981',
                }}
              >
                {Math.round(selectedBin.currentFillPercent)}% (
                {Math.round((selectedBin.currentFillPercent / 100) * selectedBin.capacityKg)} /{' '}
                {selectedBin.capacityKg} kg)
              </Typography>
            </Box>
            <Slider
              size="small"
              value={Math.round(selectedBin.currentFillPercent)}
              min={0}
              max={100}
              onChange={(_, val) => {
                simulationEngine.setBinFillLevel(selectedBin.id, val);
                setSelectedBin((prev) => (prev ? { ...prev, currentFillPercent: val } : null));
              }}
            />
          </Box>

          <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
            <Button
              size="small"
              variant="outlined"
              color="error"
              onClick={() => {
                simulationEngine.setBinFillLevel(selectedBin.id, 92);
                setSelectedBin((prev) => (prev ? { ...prev, currentFillPercent: 92 } : null));
              }}
              sx={{ flex: 1, fontSize: '0.72rem', textTransform: 'none', fontWeight: 700 }}
            >
              Làm đầy 92%
            </Button>
            <Button
              size="small"
              variant="outlined"
              color="success"
              onClick={() => {
                simulationEngine.setBinFillLevel(selectedBin.id, 0);
                setSelectedBin((prev) => (prev ? { ...prev, currentFillPercent: 0 } : null));
              }}
              sx={{ flex: 1, fontSize: '0.72rem', textTransform: 'none', fontWeight: 700 }}
            >
              Rỗng 0%
            </Button>
            <IconButton
              size="small"
              color="error"
              onClick={() => {
                simulationEngine.deleteBin(selectedBin.id);
                setSelectedBin(null);
              }}
            >
              <DeleteForeverIcon fontSize="small" />
            </IconButton>
          </Stack>
        </Paper>
      )}

      {/* Bảng Chi Tiết Xem Từng Xe Một (Individual Vehicle Focus Inspector) */}
      <VehicleFocusInspector
        vehicles={simulationState.vehicles}
        focusedVehicleId={focusedVehicleId}
        isTrackingVehicle={isTrackingVehicle}
        onSelectVehicle={handleSelectVehicle}
        onToggleTracking={() => setIsTrackingVehicle(!isTrackingVehicle)}
        onFlyToVehicle={handleFlyToVehicle}
        onFlyToStop={handleFlyToStop}
        onSendToDepot={handleSendToDepot}
        onRunAIPlan={() => simulationEngine.runRouteOptimization()}
        onTriggerSos={(vehId) =>
          simulationEngine.triggerVehicleSos(vehId, false, 'Xe gặp sự cố hỏng động cơ giữa tuyến')
        }
        bins={simulationState.bins}
        depot={simulationState.depot}
        depots={simulationState.depots}
        activeOptimizationReport={simulationState.activeOptimizationReport}
      />

      {/* Modal Cắm Thùng Rác Mới */}
      <Dialog
        open={Boolean(newBinCoords)}
        onClose={() => setNewBinCoords(null)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle sx={{ fontWeight: 800 }}>📍 Cắm Thùng Rác Mới Trên Bản Đồ</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Tọa độ: [{newBinCoords?.lat.toFixed(5)}, {newBinCoords?.lng.toFixed(5)}]
          </Typography>

          <TextField
            fullWidth
            label="Tên thùng rác"
            value={newBinName}
            onChange={(e) => setNewBinName(e.target.value)}
            size="small"
            sx={{ mb: 2 }}
          />

          <Box sx={{ mb: 2 }}>
            <Typography variant="caption" sx={{ fontWeight: 700 }}>
              Sức chứa tối đa: {newBinCapacity} kg
            </Typography>
            <Slider
              value={newBinCapacity}
              min={60}
              max={240}
              step={20}
              onChange={(_, v) => setNewBinCapacity(v)}
            />
          </Box>

          <Box sx={{ mb: 2 }}>
            <Typography variant="caption" sx={{ fontWeight: 700 }}>
              Mức rác ban đầu: {newBinInitialFill}%
            </Typography>
            <Slider
              value={newBinInitialFill}
              min={0}
              max={100}
              onChange={(_, v) => setNewBinInitialFill(v)}
            />
          </Box>

          <Box>
            <Typography variant="caption" sx={{ fontWeight: 700 }}>
              Tốc độ đầy rác: {newBinFillRate}% / giây
            </Typography>
            <Slider
              value={newBinFillRate}
              min={0.2}
              max={3.0}
              step={0.2}
              onChange={(_, v) => setNewBinFillRate(v)}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setNewBinCoords(null)}>Hủy</Button>
          <Button variant="contained" onClick={handleConfirmAddBin} sx={{ fontWeight: 800 }}>
            Tạo Thùng Rác
          </Button>
        </DialogActions>
      </Dialog>

      {/* Bảng Phân Tích Thuật Toán Tối Ưu Quản Đường (2-Opt VRP Inspector) */}
      <RouteOptimizationInspectorModal
        open={inspectorModalOpen}
        onClose={() => setInspectorModalOpen(false)}
        optimizationReport={simulationState.optimizationReport}
        onApplyAndDispatch={() => simulationEngine.runRouteOptimization()}
      />
    </>
  );
};

export default MainMapWasteOverlay;

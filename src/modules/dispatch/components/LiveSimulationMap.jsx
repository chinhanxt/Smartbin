import { useEffect, useRef, useState, useCallback } from 'react';
import * as maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import maplibreWorkerUrl from 'maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url';
import {
  Box,
  Typography,
  IconButton,
  Tooltip,
  Paper,
  Stack,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Slider,
} from '@mui/material';
import AddLocationAltIcon from '@mui/icons-material/AddLocationAlt';
import LayersIcon from '@mui/icons-material/Layers';
import MyLocationIcon from '@mui/icons-material/MyLocation';
import CloseIcon from '@mui/icons-material/Close';
import DeleteForeverIcon from '@mui/icons-material/DeleteForever';
import FlashOnIcon from '@mui/icons-material/FlashOn';
import RestartAltIcon from '@mui/icons-material/RestartAlt';

import VehicleSelectorBar from './VehicleSelectorBar';
import VehicleFocusInspector from './VehicleFocusInspector';
import { simulationEngine } from '../services/WasteSimulationEngine';
import { roadRoutingService } from '../../routing/services/RoadRoutingService';

maplibregl.setWorkerUrl(maplibreWorkerUrl);

// 1. Bản đồ Google Maps Road (Tải cực nhanh, sắc nét, tiếng Việt, không bị chặn mạng tại VN)
const MAP_STYLE_GOOGLE = {
  version: 8,
  sources: {
    'google-tiles': {
      type: 'raster',
      tiles: [
        'https://mt0.google.com/vt/lyrs=m&hl=vi&x={x}&y={y}&z={z}&s=Ga',
        'https://mt1.google.com/vt/lyrs=m&hl=vi&x={x}&y={y}&z={z}&s=Ga',
        'https://mt2.google.com/vt/lyrs=m&hl=vi&x={x}&y={y}&z={z}&s=Ga',
        'https://mt3.google.com/vt/lyrs=m&hl=vi&x={x}&y={y}&z={z}&s=Ga',
      ],
      tileSize: 256,
      attribution: '© Google Maps',
    },
  },
  layers: [
    {
      id: 'google-tiles-layer',
      type: 'raster',
      source: 'google-tiles',
      minzoom: 0,
      maxzoom: 20,
    },
  ],
};

// 2. Bản đồ OpenStreetMap dự phòng
const MAP_STYLE_OSM = {
  version: 8,
  sources: {
    'osm-tiles': {
      type: 'raster',
      tiles: [
        'https://a.tile.openstreetmap.org/{z}/{x}/{y}.png',
        'https://b.tile.openstreetmap.org/{z}/{x}/{y}.png',
      ],
      tileSize: 256,
      attribution: '© OpenStreetMap contributors',
    },
  },
  layers: [
    {
      id: 'osm-tiles-layer',
      type: 'raster',
      source: 'osm-tiles',
      minzoom: 0,
      maxzoom: 19,
    },
  ],
};

const LiveSimulationMap = ({
  simulationState,
  onAddBin,
  onSetBinFill,
  onDeleteBin,
  isAddingBinMode,
  setIsAddingBinMode,
}) => {
  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [selectedBin, setSelectedBin] = useState(null);
  const [currentStyle, setCurrentStyle] = useState('google');
  const [focusedVehicleId, setFocusedVehicleId] = useState(null);
  const [isTrackingVehicle, setIsTrackingVehicle] = useState(false);

  // Modal thêm thùng rác tùy biến khi click
  const [newBinCoords, setNewBinCoords] = useState(null);
  const [newBinName, setNewBinName] = useState('');
  const [newBinCapacity, setNewBinCapacity] = useState(120);
  const [newBinInitialFill, setNewBinInitialFill] = useState(30);
  const [newBinFillRate, setNewBinFillRate] = useState(1.0);

  // Tham chiếu giữ danh sách HTML Marker của Thùng rác, Xe và Depot
  const binMarkersRef = useRef(new Map());
  const vehicleMarkersRef = useRef(new Map());
  const depotMarkersRef = useRef(new Map());

  const handleSelectVehicle = useCallback(
    (vehicleId) => {
      setFocusedVehicleId(vehicleId);
      setSelectedBin(null);

      const map = mapRef.current;
      if (vehicleId) {
        setIsTrackingVehicle(true);
        const veh = simulationState.vehicles.find((v) => v.vehicleId === vehicleId);
        if (veh && map) {
          map.flyTo({
            center: [veh.lng, veh.lat],
            zoom: 16.5,
            pitch: 35,
            duration: 1100,
          });
        }
      } else {
        setIsTrackingVehicle(false);
        if (map) {
          map.flyTo({
            center: [106.698, 10.774],
            zoom: 14.5,
            pitch: 25,
            duration: 1000,
          });
        }
      }
    },
    [simulationState.vehicles],
  );

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !isTrackingVehicle || !focusedVehicleId) return;
    const veh = simulationState.vehicles.find((v) => v.vehicleId === focusedVehicleId);
    if (veh) {
      map.easeTo({
        center: [veh.lng, veh.lat],
        duration: 120,
        easing: (t) => t,
      });
    }
  }, [simulationState?.vehicles, isTrackingVehicle, focusedVehicleId]);

  const handleFlyToVehicle = useCallback((veh) => {
    const map = mapRef.current;
    if (map && veh) {
      map.flyTo({
        center: [veh.lng, veh.lat],
        zoom: 17,
        pitch: 40,
        duration: 900,
      });
    }
  }, []);

  const handleFlyToStop = useCallback((lng, lat) => {
    const map = mapRef.current;
    if (map && lng && lat) {
      setIsTrackingVehicle(false);
      map.flyTo({
        center: [lng, lat],
        zoom: 17,
        pitch: 30,
        duration: 900,
      });
    }
  }, []);

  const handleSendToDepot = useCallback((vehicleId) => {
    simulationEngine.sendVehicleToDepot(vehicleId);
  }, []);

  // 1. Khởi tạo MapLibre GL
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    const map = new maplibregl.Map({
      container: mapContainerRef.current,
      style: MAP_STYLE_GOOGLE,
      center: [106.698, 10.774], // Trung tâm Quận 1, TP.HCM
      zoom: 14.5,
      pitch: 25,
      bearing: 0,
    });

    // Gán tham chiếu bản đồ NGAY LẬP TỨC để các Markers có thể gắn vào DOM không cần chờ style
    mapRef.current = map;

    map.addControl(new maplibregl.NavigationControl(), 'top-right');
    map.addControl(new maplibregl.ScaleControl({ unit: 'metric' }), 'bottom-left');

    const setupRoutesLayer = () => {
      if (!map.getSource('routes-source')) {
        map.addSource('routes-source', {
          type: 'geojson',
          data: { type: 'FeatureCollection', features: [] },
        });

        // Lớp bóng viền lộ trình
        map.addLayer({
          id: 'routes-casing',
          type: 'line',
          source: 'routes-source',
          layout: { 'line-join': 'round', 'line-cap': 'round' },
          paint: {
            'line-color': '#000000',
            'line-width': 6,
            'line-opacity': 0.4,
          },
        });

        // Lớp đường di chuyển chính (màu theo xe)
        map.addLayer({
          id: 'routes-line',
          type: 'line',
          source: 'routes-source',
          layout: { 'line-join': 'round', 'line-cap': 'round' },
          paint: {
            'line-color': ['get', 'color'],
            'line-width': 4,
            'line-dasharray': [2, 2],
          },
        });
      }
      setMapLoaded(true);
    };

    if (map.loaded() || map.isStyleLoaded()) {
      setupRoutesLayer();
    } else {
      map.once('load', setupRoutesLayer);
      map.once('styledata', () => {
        if (map.isStyleLoaded()) setupRoutesLayer();
      });
    }

    // Tự động resize map sau khi mount để tránh lỗi canvas 0px
    const resizeTimer = setTimeout(() => {
      map.resize();
    }, 250);

    const binMarkers = binMarkersRef.current;
    const vehicleMarkers = vehicleMarkersRef.current;
    const depotMarkers = depotMarkersRef.current;

    return () => {
      clearTimeout(resizeTimer);
      binMarkers.forEach((m) => m.remove());
      vehicleMarkers.forEach((m) => m.remove());
      depotMarkers.forEach((m) => m.remove());
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // Đổi kiểu map giữa Google Maps và OSM
  const toggleMapStyle = () => {
    if (!mapRef.current) return;
    const next = currentStyle === 'google' ? 'osm' : 'google';
    setCurrentStyle(next);
    mapRef.current.setStyle(next === 'google' ? MAP_STYLE_GOOGLE : MAP_STYLE_OSM);
  };

  // 2. Xử lý sự kiện click trên bản đồ để thêm thùng rác
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    if (isAddingBinMode) {
      map.getCanvas().style.cursor = 'crosshair';
    } else {
      map.getCanvas().style.cursor = '';
    }

    const handleClick = (e) => {
      if (!isAddingBinMode) return;
      const { lng, lat } = e.lngLat;
      setNewBinCoords({ lat, lng });
      setNewBinName(`Thùng rác Điểm mới #${simulationState.bins.length + 1}`);
      setNewBinInitialFill(35);
    };

    map.on('click', handleClick);
    return () => {
      map.off('click', handleClick);
    };
  }, [isAddingBinMode, simulationState?.bins?.length]);

  // 3. Render Marker các Trạm dỡ rác (Depots)
  useEffect(() => {
    const map = mapRef.current;
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
        el.className = `depot-marker depot-${depot.id}`;
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
          map.flyTo({ center: [depot.lng, depot.lat], zoom: 15.5 });
        };

        const marker = new maplibregl.Marker({ element: el, anchor: 'bottom' })
          .setLngLat([depot.lng, depot.lat])
          .addTo(map);

        existingMarkers.set(depot.id, marker);
      }
    });
  }, [simulationState?.depots, simulationState?.depot]);

  // 4. Render & Đồng bộ Marker Ghim Thùng rác (Smart Bins)
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !simulationState?.bins) return;

    const currentBins = simulationState.bins;
    const existingMarkers = binMarkersRef.current;
    const activeBinIds = new Set(currentBins.map((b) => b.id));

    // Xóa các marker của thùng rác đã bị xóa
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

    // Cập nhật hoặc tạo mới marker cho từng thùng rác
    currentBins.forEach((bin) => {
      const fill = Math.round(bin.currentFillPercent);
      const isOverflow = fill >= (simulationState.overflowThreshold || 80);
      const isCollecting = bin.status === 'COLLECTING';
      const isAssigned = Boolean(bin.assignedVehicleId);

      // Màu sắc theo mức rác
      let statusColor = '#10b981'; // Xanh lá (<50%)
      if (fill >= 50 && fill < 80) statusColor = '#f59e0b'; // Cam (50-79%)
      if (fill >= 80) statusColor = '#ef4444'; // Đỏ (>=80%)

      if (!existingMarkers.has(bin.id)) {
        // Tạo DOM element mới cho ghim thùng rác
        const el = document.createElement('div');
        el.className = `bin-marker bin-${bin.id}`;
        el.style.cursor = 'pointer';

        el.onclick = (e) => {
          e.stopPropagation();
          setSelectedBin(bin);
        };

        const marker = new maplibregl.Marker({ element: el, anchor: 'bottom' })
          .setLngLat([bin.lng, bin.lat])
          .addTo(map);

        existingMarkers.set(bin.id, marker);
      }

      // Cập nhật giao diện bên trong của Ghim Marker
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

  // 5. Render & Cập nhật Vị trí & Hướng xoay của Xe (Moving Vehicles)
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !simulationState?.vehicles) return;

    const vehicles = simulationState.vehicles;
    const existingMarkers = vehicleMarkersRef.current;

    vehicles.forEach((veh) => {
      let marker = existingMarkers.get(veh.vehicleId);

      if (!marker) {
        const el = document.createElement('div');
        el.className = `vehicle-marker veh-${veh.vehicleId}`;
        el.style.cursor = 'pointer';

        el.onclick = (e) => {
          e.stopPropagation();
          handleSelectVehicle(veh.vehicleId);
        };

        marker = new maplibregl.Marker({ element: el, anchor: 'center' })
          .setLngLat([veh.lng, veh.lat])
          .addTo(map);

        existingMarkers.set(veh.vehicleId, marker);
      }

      // Di chuyển marker tới tọa độ mới nhất
      marker.setLngLat([veh.lng, veh.lat]);

      // Cập nhật giao diện bên trong
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
        miniStatus = `<div style="background:#d97706;color:#fff;font-size:7px;font-weight:800;padding:0.5px 3px;border-radius:3px;margin-top:1px;white-space:nowrap;">⏳ Gom</div>`;
      } else if (veh.status === 'MOVING_TO_DEPOT') {
        miniStatus = `<div style="background:#8b5cf6;color:#fff;font-size:7px;font-weight:800;padding:0.5px 3px;border-radius:3px;margin-top:1px;white-space:nowrap;">♻️ Trạm</div>`;
      } else if (veh.status === 'UNLOADING') {
        miniStatus = `<div style="background:#059669;color:#fff;font-size:7px;font-weight:800;padding:0.5px 3px;border-radius:3px;margin-top:1px;white-space:nowrap;">♻️ Xả</div>`;
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
          ? `<div style="background:#fbbf24;color:#0f172a;font-size:7px;padding:0.5px 4px;border-radius:3px;font-weight:900;margin-top:1px;box-shadow:0 1px 4px rgba(0,0,0,0.3);">🎯 BÁM THEO</div>`
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

  // 6. Vẽ lộ trình kết nối giữa Xe -> Đích đến (Route Lines)
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapLoaded || !simulationState?.vehicles) return;

    const source = map.getSource('routes-source');
    if (!source) return;

    const features = [];

    simulationState.vehicles.forEach((veh) => {
      // Khi chọn xem 1 xe cụ thể, chỉ hiển thị lộ trình của xe đó
      if (focusedVehicleId && veh.vehicleId !== focusedVehicleId) return;

      if (veh.targetCoords) {
        let coords = [];

        if (veh.roadPathCoordinates && veh.roadPathCoordinates.length > 1) {
          coords.push([veh.lng, veh.lat]);
          const currentIdx = veh.roadPathIndex || 0;
          for (let i = currentIdx + 1; i < veh.roadPathCoordinates.length; i++) {
            coords.push(veh.roadPathCoordinates[i]);
          }
        } else {
          coords = [
            [veh.lng, veh.lat],
            [veh.targetCoords.lng, veh.targetCoords.lat],
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
                  coords.push([legRoadCoords[k][0], legRoadCoords[k][1]]);
                }
              } else {
                coords.push([wp.lng, wp.lat]);
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
                coords.push([depotRoadCoords[k][0], depotRoadCoords[k][1]]);
              }
            } else {
              coords.push([targetDepot.lng, targetDepot.lat]);
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
            const lastPt = coords[coords.length - 1];
            if (
              Math.abs(lastPt[0] - targetDepot.lng) > 0.0001 ||
              Math.abs(lastPt[1] - targetDepot.lat) > 0.0001
            ) {
              coords.push([targetDepot.lng, targetDepot.lat]);
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
    mapLoaded,
    focusedVehicleId,
  ]);

  // Xác nhận thêm thùng rác mới từ Modal
  const handleConfirmAddBin = () => {
    if (!newBinCoords) return;
    onAddBin({
      lat: newBinCoords.lat,
      lng: newBinCoords.lng,
      name: newBinName,
      capacityKg: newBinCapacity,
      initialFill: newBinInitialFill,
      fillRate: newBinFillRate,
    });
    setNewBinCoords(null);
  };

  return (
    <Box
      sx={{
        position: 'relative',
        width: '100%',
        height: { xs: 550, md: 'calc(100vh - 180px)' },
        minHeight: 550,
      }}
    >
      {/* Container bản đồ MapLibre */}
      <Box
        ref={mapContainerRef}
        sx={{
          width: '100%',
          height: '100%',
          minHeight: 550,
          borderRadius: 2.5,
          overflow: 'hidden',
          boxShadow: '0 4px 20px rgba(0,0,0,0.12)',
        }}
      />

      {/* Thanh công cụ Chọn Xem Từng Xe một (Vehicle Selector Bar) */}
      <VehicleSelectorBar
        vehicles={simulationState.vehicles}
        focusedVehicleId={focusedVehicleId}
        onSelectVehicle={handleSelectVehicle}
        bins={simulationState.bins}
        activeOptimizationReport={simulationState.activeOptimizationReport}
      />

      {/* Banner thông báo chế độ Cắm thùng rác */}
      {isAddingBinMode && (
        <Paper
          elevation={4}
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
            boxShadow: '0 6px 20px rgba(2,132,199,0.4)',
          }}
        >
          <AddLocationAltIcon />
          <Typography variant="body2" sx={{ fontWeight: 800 }}>
            Chế độ thêm thùng: Nhấp chuột vào bất kỳ điểm nào trên bản đồ để cắm thùng rác!
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
            Hoàn tất
          </Button>
        </Paper>
      )}

      {/* Thanh công cụ nổi trên bản đồ */}
      <Stack
        direction="column"
        spacing={1}
        sx={{
          position: 'absolute',
          top: 16,
          left: 16,
          zIndex: 5,
        }}
      >
        <Tooltip
          title={isAddingBinMode ? 'Thoát chế độ thêm thùng' : 'Bật chế độ Thêm Thùng Rác trên map'}
          placement="right"
        >
          <Button
            variant="contained"
            color={isAddingBinMode ? 'warning' : 'primary'}
            startIcon={<AddLocationAltIcon />}
            onClick={() => setIsAddingBinMode(!isAddingBinMode)}
            sx={{
              fontWeight: 800,
              borderRadius: 2,
              boxShadow: '0 4px 14px rgba(0,0,0,0.2)',
              textTransform: 'none',
            }}
          >
            {isAddingBinMode ? 'Đang thêm...' : '➕ Thêm Thùng Rác'}
          </Button>
        </Tooltip>

        <Tooltip title="Đổi kiểu bản đồ (Google Maps / OpenStreetMap)" placement="right">
          <IconButton
            onClick={toggleMapStyle}
            sx={{
              backgroundColor: '#ffffff',
              color: '#334155',
              boxShadow: '0 2px 8px rgba(0,0,0,0.18)',
              '&:hover': { backgroundColor: '#f1f5f9' },
            }}
          >
            <LayersIcon />
          </IconButton>
        </Tooltip>

        <Tooltip title="Định vị về trung tâm đội xe Q.1" placement="right">
          <IconButton
            onClick={() => {
              if (mapRef.current) {
                mapRef.current.flyTo({ center: [106.698, 10.774], zoom: 14.5, pitch: 25 });
              }
            }}
            sx={{
              backgroundColor: '#ffffff',
              color: '#334155',
              boxShadow: '0 2px 8px rgba(0,0,0,0.18)',
              '&:hover': { backgroundColor: '#f1f5f9' },
            }}
          >
            <MyLocationIcon />
          </IconButton>
        </Tooltip>
      </Stack>

      {/* Bảng chi tiết Thùng rác được chọn (Inspector Card) */}
      {selectedBin && (
        <Paper
          elevation={5}
          sx={{
            position: 'absolute',
            bottom: 24,
            left: 24,
            zIndex: 10,
            p: 2,
            borderRadius: 3,
            minWidth: 290,
            maxWidth: 340,
            backgroundColor: 'rgba(255, 255, 255, 0.96)',
            backdropFilter: 'blur(8px)',
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
                onSetBinFill(selectedBin.id, val);
                setSelectedBin((prev) => (prev ? { ...prev, currentFillPercent: val } : null));
              }}
            />
          </Box>

          <Stack direction="row" spacing={1} sx={{ mt: 1.5 }}>
            <Button
              size="small"
              variant="outlined"
              color="error"
              startIcon={<FlashOnIcon />}
              onClick={() => {
                onSetBinFill(selectedBin.id, 92);
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
              startIcon={<RestartAltIcon />}
              onClick={() => {
                onSetBinFill(selectedBin.id, 0);
                setSelectedBin((prev) => (prev ? { ...prev, currentFillPercent: 0 } : null));
              }}
              sx={{ flex: 1, fontSize: '0.72rem', textTransform: 'none', fontWeight: 700 }}
            >
              Làm trống 0%
            </Button>
            <IconButton
              size="small"
              color="error"
              onClick={() => {
                onDeleteBin(selectedBin.id);
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
        bins={simulationState.bins}
        depot={simulationState.depot}
        depots={simulationState.depots}
        activeOptimizationReport={simulationState.activeOptimizationReport}
      />

      {/* Modal Cấu hình khi click đặt thùng rác mới */}
      <Dialog
        open={Boolean(newBinCoords)}
        onClose={() => setNewBinCoords(null)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle sx={{ fontWeight: 800 }}>📍 Đặt Thùng Rác Mới</DialogTitle>
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
    </Box>
  );
};

export default LiveSimulationMap;

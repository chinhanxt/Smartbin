import * as maplibregl from 'maplibre-gl';
import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { usePreference } from '../../common/util/preferences';
import { map } from '../core/MapView';
import { toMapCoordinates } from '../core/mapUtil';

const MapDefaultCamera = ({ filteredPositions }) => {
  const selectedDeviceId = useSelector((state) => state.devices.selectedId);
  const positions = useSelector((state) => state.session.positions);

  const defaultLatitude = usePreference('latitude', 10.774);
  const defaultLongitude = usePreference('longitude', 106.698);
  const defaultZoom = usePreference('zoom', 14.5);

  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    if (initialized) return;
    if (selectedDeviceId) {
      const position = positions[selectedDeviceId];
      if (position) {
        map.jumpTo({
          center: toMapCoordinates(position.longitude, position.latitude),
          zoom: Math.max(defaultZoom > 0 ? defaultZoom : map.getZoom(), 10),
        });
        setInitialized(true);
      }
    } else {
      if (defaultLatitude && defaultLongitude) {
        map.jumpTo({
          center: toMapCoordinates(defaultLongitude, defaultLatitude),
          zoom: defaultZoom > 0 ? defaultZoom : 14,
        });
        setInitialized(true);
      } else {
        const coordinates = (filteredPositions || Object.values(positions)).map((item) =>
          toMapCoordinates(item.longitude, item.latitude),
        );
        if (coordinates.length > 1) {
          const bounds = coordinates.reduce(
            (bounds, item) => bounds.extend(item),
            new maplibregl.LngLatBounds(coordinates[0], coordinates[1]),
          );
          const canvas = map.getCanvas();
          map.fitBounds(bounds, {
            duration: 0,
            padding: Math.min(canvas.width, canvas.height) * 0.1,
          });
          setInitialized(true);
        } else if (coordinates.length) {
          const [individual] = coordinates;
          map.jumpTo({
            center: individual,
            zoom: Math.max(defaultZoom > 0 ? defaultZoom : map.getZoom(), 14),
          });
          setInitialized(true);
        } else if (navigator.geolocation) {
          navigator.geolocation.getCurrentPosition(
            (pos) => {
              map.jumpTo({
                center: toMapCoordinates(pos.coords.longitude, pos.coords.latitude),
                zoom: 15,
              });
              setInitialized(true);
            },
            () => {
              // Mặc định về trung tâm TP.HCM (Khu vực hoạt động Smartbin)
              map.jumpTo({
                center: toMapCoordinates(106.700806, 10.776889),
                zoom: 14,
              });
              setInitialized(true);
            },
            { timeout: 4000, enableHighAccuracy: true },
          );
        } else {
          map.jumpTo({
            center: toMapCoordinates(106.700806, 10.776889),
            zoom: 14,
          });
          setInitialized(true);
        }
      }
    }
  }, [
    selectedDeviceId,
    initialized,
    defaultLatitude,
    defaultLongitude,
    defaultZoom,
    positions,
    filteredPositions,
  ]);

  return null;
};

export default MapDefaultCamera;

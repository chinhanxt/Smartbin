import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import dimensions from '../../common/theme/dimensions';
import { map } from '../core/MapView';
import { usePrevious } from '../../reactHelper';
import { useAttributePreference } from '../../common/util/preferences';
import { toMapCoordinates } from '../core/mapUtil';
import { sessionActions } from '../../store';

const MapSelectedDevice = () => {
  const dispatch = useDispatch();
  const currentTime = useSelector((state) => state.devices.selectTime);
  const currentId = useSelector((state) => state.devices.selectedId);
  const previousTime = usePrevious(currentTime);
  const previousId = usePrevious(currentId);

  const selectZoom = useAttributePreference('web.selectZoom', 15.5);
  const mapFollow = useAttributePreference('mapFollow', false);

  const position = useSelector((state) => state.session.positions[currentId]);
  const previousPosition = usePrevious(position);

  // If selected device has no position in store yet, eagerly fetch it
  useEffect(() => {
    if (currentId && !position) {
      fetch(`/api/positions?deviceId=${currentId}`)
        .then((res) => (res.ok ? res.json() : []))
        .then((posList) => {
          if (posList && posList.length) {
            dispatch(sessionActions.updatePositions(posList));
          }
        })
        .catch(() => {});
    }
  }, [currentId, position, dispatch]);

  useEffect(() => {
    const positionChanged =
      position &&
      (!previousPosition ||
        position.latitude !== previousPosition.latitude ||
        position.longitude !== previousPosition.longitude);

    if (
      (currentId !== previousId ||
        currentTime !== previousTime ||
        (mapFollow && positionChanged)) &&
      position
    ) {
      map.easeTo({
        center: toMapCoordinates(position.longitude, position.latitude),
        zoom: Math.min(Math.max(map.getZoom(), selectZoom), 15.5),
        offset: [0, -dimensions.popupMapOffset / 2],
      });
    }
  }, [
    currentId,
    previousId,
    currentTime,
    previousTime,
    mapFollow,
    position,
    previousPosition,
    selectZoom,
  ]);

  return null;
};

export default MapSelectedDevice;

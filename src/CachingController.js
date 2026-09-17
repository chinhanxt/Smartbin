import { useDispatch, useSelector } from 'react-redux';
import {
  geofencesActions,
  groupsActions,
  driversActions,
  maintenancesActions,
  calendarsActions,
} from './store';
import { useAsyncTask } from './reactHelper';
import fetchOrThrow from './common/util/fetchOrThrow';

const CachingController = () => {
  const authenticated = useSelector((state) => !!state.session.user);
  const dispatch = useDispatch();

  useAsyncTask(
    async ({ signal }) => {
      if (authenticated) {
        try {
          const response = await fetch('/api/geofences', { signal });
          if (response.ok) dispatch(geofencesActions.refresh(await response.json()));
        } catch {}
      }
    },
    [authenticated, dispatch],
  );

  useAsyncTask(
    async ({ signal }) => {
      if (authenticated) {
        try {
          const response = await fetch('/api/groups', { signal });
          if (response.ok) dispatch(groupsActions.refresh(await response.json()));
        } catch {}
      }
    },
    [authenticated, dispatch],
  );

  useAsyncTask(
    async ({ signal }) => {
      if (authenticated) {
        try {
          const response = await fetch('/api/drivers', { signal });
          if (response.ok) dispatch(driversActions.refresh(await response.json()));
        } catch {}
      }
    },
    [authenticated, dispatch],
  );

  useAsyncTask(
    async ({ signal }) => {
      if (authenticated) {
        try {
          const response = await fetch('/api/maintenance', { signal });
          if (response.ok) dispatch(maintenancesActions.refresh(await response.json()));
        } catch {}
      }
    },
    [authenticated, dispatch],
  );

  useAsyncTask(
    async ({ signal }) => {
      if (authenticated) {
        try {
          const response = await fetch('/api/calendars', { signal });
          if (response.ok) dispatch(calendarsActions.refresh(await response.json()));
        } catch {}
      }
    },
    [authenticated, dispatch],
  );

  return null;
};

export default CachingController;

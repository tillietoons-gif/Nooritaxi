import * as TaskManager from 'expo-task-manager';
import * as Location from 'expo-location';
import { updateMyDriverStatus, getStoredUser, isDriverUser } from './api';

export const LOCATION_TASK_NAME = 'background-location-task';

TaskManager.defineTask(LOCATION_TASK_NAME, async ({ data, error }) => {
  if (error) {
    console.error('Background location error:', error);
    return;
  }
  if (data) {
    const { locations } = data as any;
    const location = locations[0];
    if (location) {
      try {
        const user = await getStoredUser();
        if (user && isDriverUser(user)) {
          await updateMyDriverStatus({
            status: 'ONLINE', // or keep current
            lat: location.coords.latitude,
            lng: location.coords.longitude,
          });
          console.log('Background location updated for driver');
        }
      } catch (e) {
        console.error('Failed to update background location', e);
      }
    }
  }
});

export async function startBackgroundLocation() {
  const { status } = await Location.requestBackgroundPermissionsAsync();
  if (status !== 'granted') {
    console.warn('Background location permission denied');
    return false;
  }

  await Location.startLocationUpdatesAsync(LOCATION_TASK_NAME, {
    accuracy: Location.Accuracy.Balanced,
    timeInterval: 30000, // 30 seconds
    distanceInterval: 50, // 50 meters
    showsBackgroundLocationIndicator: true,
    foregroundService: {
      notificationTitle: 'Noori Driver',
      notificationBody: 'Tracking your location for jobs',
      notificationColor: '#006947',
    },
  });
  return true;
}

export async function stopBackgroundLocation() {
  if (await TaskManager.isTaskRegisteredAsync(LOCATION_TASK_NAME)) {
    await Location.stopLocationUpdatesAsync(LOCATION_TASK_NAME);
  }
}
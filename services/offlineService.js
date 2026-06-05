import AsyncStorage from "@react-native-async-storage/async-storage";

const LOCATION_QUEUE_KEY = "offlineLocationQueue";
const ACTION_QUEUE_KEY = "offlineActionQueue";

export const queueLocationUpdate = async (locationData) => {
  try {
    const existingQueue = await AsyncStorage.getItem(LOCATION_QUEUE_KEY);
    const queue = existingQueue ? JSON.parse(existingQueue) : [];
    queue.push(locationData);
    await AsyncStorage.setItem(LOCATION_QUEUE_KEY, JSON.stringify(queue));
  } catch (error) {
    console.error("Error queueing location update:", error);
  }
};

export const getAndClearQueuedUpdates = async () => {
  try {
    const queueJson = await AsyncStorage.getItem(LOCATION_QUEUE_KEY);
    await AsyncStorage.removeItem(LOCATION_QUEUE_KEY);
    return queueJson ? JSON.parse(queueJson) : [];
  } catch (error) {
    console.error("Error getting and clearing queued updates:", error);
    return [];
  }
};

export const queueEndTripAction = async (actionData) => {
  try {
    const existingQueue = await AsyncStorage.getItem(ACTION_QUEUE_KEY);
    const queue = existingQueue ? JSON.parse(existingQueue) : [];
    queue.push({ type: "END_TRIP", ...actionData });
    await AsyncStorage.setItem(ACTION_QUEUE_KEY, JSON.stringify(queue));
  } catch (error) {
    console.error("Error queueing end trip action:", error);
  }
};

export const getAndClearQueuedActions = async () => {
  try {
    const queueJson = await AsyncStorage.getItem(ACTION_QUEUE_KEY);
    await AsyncStorage.removeItem(ACTION_QUEUE_KEY);
    return queueJson ? JSON.parse(queueJson) : [];
  } catch (error) {
    console.error("Error getting and clearing queued actions:", error);
    return [];
  }
};
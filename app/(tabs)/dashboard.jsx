import { appEvents } from "@/events/appEvents";
import {
  getFleetsForUserWithPermission,
  notifySpeeding,
} from "@/services/fleetMembershipService";
import { getFleetVehicles } from "@/services/fleetVechicleService";
import {
  endTrip,
  getActiveTripForUser,
  getSpeedLimit,
  listenToActiveTrips,
  startTrip,
  updateTripLocation
} from "@/services/locationService";
import {
  getAndClearQueuedActions,
  getAndClearQueuedUpdates,
  queueEndTripAction,
  queueLocationUpdate,
} from "@/services/offlineService";
import AsyncStorage from "@react-native-async-storage/async-storage";
import NetInfo, { useNetInfo } from "@react-native-community/netinfo";
import * as Location from "expo-location";
import * as TaskManager from "expo-task-manager";
import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import DropDownPicker from "react-native-dropdown-picker";
import { SafeAreaView } from "react-native-safe-area-context";
import { auth } from "../../config/firebaseConfig";

const LOCATION_TASK_NAME = "background-location-task";
let lastNotificationTime = 0;

TaskManager.defineTask(LOCATION_TASK_NAME, async ({ data, error }) => {
  if (error) {
    console.error("Background location task error:", error);
    return;
  }
  if (data) {
    const { locations } = data;
    const location = locations[locations.length - 1];
    if (!location) return;

    try {
      const tripData = await AsyncStorage.getItem("current_trip");
      if (!tripData) return;
      const { tripId, fleetId, userId, userEmail } = JSON.parse(tripData);

      if (location.coords.accuracy > 25) return;

      const { latitude, longitude, speed } = location.coords;
      const speedKmh = (speed || 0) * 3.6;

      if (speedKmh > 10) {
        const limit = await getSpeedLimit(latitude, longitude);
        const limitVal = parseInt(limit, 10);
        if (!isNaN(limitVal) && limitVal > 0 && speedKmh > limitVal + 5) {
          const now = Date.now();
          if (now - lastNotificationTime > 5 * 60 * 1000) {
            lastNotificationTime = now;
            await notifySpeeding(fleetId, userEmail, Math.round(speedKmh), limitVal);
          }
        }
      }

      const netState = await NetInfo.fetch();
      if (netState.isConnected) {
        await updateTripLocation(tripId, latitude, longitude, userId, speedKmh);
      } else {
        await queueLocationUpdate({ tripId, latitude, longitude, userId, speedKmh });
      }
    } catch (err) {
      console.error("Task Error:", err);
    }
  }
});

const DashboardScreen = () => {
  const [fleets, setFleets] = useState([]);
  const [vehicles, setVehicles] = useState([]);

  const [fleetOpen, setFleetOpen] = useState(false);
  const [vehicleOpen, setVehicleOpen] = useState(false);

  const [selectedFleet, setSelectedFleet] = useState(null);
  const [selectedVehicle, setSelectedVehicle] = useState(null);

  const [loadingFleets, setLoadingFleets] = useState(true);
  const [loadingVehicles, setLoadingVehicles] = useState(false);

  const [recording, setRecording] = useState(false);
  const [unavailableVehicleIds, setUnavailableVehicleIds] = useState(new Set());

  const currentTripId = useRef(null);

  const user = auth.currentUser;
  const netInfo = useNetInfo();

  useEffect(() => {
    const fetchFleets = async () => {
      try {
        setLoadingFleets(true);
        const userFleets = await getFleetsForUserWithPermission(
          user.uid,
          "record_position"
        );
        setFleets(userFleets);
      } catch (err) {
        console.error("Error fetching fleets:", err);
      } finally {
        setLoadingFleets(false);
      }
    };

    fetchFleets();

    appEvents.on("fleetAccepted", fetchFleets);

    return () => {
      appEvents.removeListener("fleetAccepted", fetchFleets);
    };
  }, [user]);

  useEffect(() => {
    if (!selectedFleet) return;

    const unsubscribe = listenToActiveTrips(selectedFleet, (trips) => {
      const ids = new Set();
      if (trips) {
        trips.forEach((trip) => {
          if (trip.userId !== user?.uid) {
            ids.add(trip.vehicleId);
          }
        });
      }
      setUnavailableVehicleIds(ids);
    });

    return () => unsubscribe();
  }, [selectedFleet, user]);

  useEffect(() => {
    const checkForActiveTrip = async () => {
      if (!user) return;
      if (recording) return;
      if (!user || loadingFleets || recording) return;

      const activeTrip = await getActiveTripForUser(user.uid);
      if (activeTrip) {
        setSelectedFleet(activeTrip.fleetId);
        setSelectedVehicle(activeTrip.vehicleId);
        currentTripId.current = activeTrip.tripId;
        setRecording(true);

        await AsyncStorage.setItem("current_trip", JSON.stringify({
          tripId: activeTrip.tripId,
          fleetId: activeTrip.fleetId,
          userId: user.uid,
          userEmail: user.email
        }));

        try {
          const { status } = await Location.requestForegroundPermissionsAsync();
          if (status === "granted") {
            await Location.requestBackgroundPermissionsAsync();
            const hasStarted = await Location.hasStartedLocationUpdatesAsync(LOCATION_TASK_NAME);
            if (!hasStarted) {
              await Location.startLocationUpdatesAsync(LOCATION_TASK_NAME, {
                accuracy: Location.Accuracy.High,
                timeInterval: 10000,
                distanceInterval: 10,
                showsBackgroundLocationIndicator: true,
                pausesUpdatesAutomatically: false,
                activityType: Location.ActivityType.AutomotiveNavigation,
                foregroundService: {
                  notificationTitle: "Vehicle Fleet",
                  notificationBody: "Recording your trip in background...",
                },
              });
            }
          }
        } catch (error) {
          console.error("Error resuming location updates:", error);
        }
      }
    };

    checkForActiveTrip();

  }, [user, loadingFleets]);

  // Synchronize offline data when connection is restored
  useEffect(() => {
    const syncOfflineData = async () => {
      if (netInfo.isConnected && user) {
        const queuedActions = await getAndClearQueuedActions();
        if (queuedActions.length > 0) {
          console.log(`Syncing ${queuedActions.length} offline actions...`);
          for (const action of queuedActions) {
            if (action.type === "END_TRIP") {
              await endTrip(action.tripId, action.latitude, action.longitude);
            }
          }
          console.log("Offline actions synced successfully.");
        }

        const activeTrip = await getActiveTripForUser(user.uid);

        if (activeTrip) {
          if (currentTripId.current !== activeTrip.tripId) {
            console.log(
              `Sync: Active trip found on server. Updating local tripId from ${currentTripId.current} to ${activeTrip.tripId}`
            );
            currentTripId.current = activeTrip.tripId;
          }
        } else if (recording) {
          console.log(
            "Sync: No active trip on server, but app is recording. Stopping recording state."
          );
          setRecording(false);
          currentTripId.current = null;
        }

        const queuedUpdates = await getAndClearQueuedUpdates();
        if (queuedUpdates.length > 0) {
          console.log(`${queuedUpdates.length} offline updates...`);
          await Promise.all(
            queuedUpdates.map((update) =>
              updateTripLocation(
                update.tripId,
                update.latitude,
                update.longitude,
                update.userId,
                update.speedKmh
              )
            )
          );
          console.log("Offline data synced successfully.");
        }
      }
    };

    syncOfflineData();
  }, [netInfo.isConnected, user]);

  useEffect(() => {
    const fetchVehicles = async () => {
      if (!selectedFleet) return;

      try {
        setLoadingVehicles(true);
        const fleetVehicles = await getFleetVehicles(selectedFleet);
        setVehicles(fleetVehicles);
      } catch (err) {
        console.error("Error fetching vehicles:", err);
      } finally {
        setLoadingVehicles(false);
      }
    };

    fetchVehicles();
  }, [selectedFleet]);

  const startRecording = async () => {
    if (!selectedFleet || !selectedVehicle) {
      Alert.alert("Select fleet and vehicle first.");
      return;
    }

    if (unavailableVehicleIds.has(selectedVehicle)) {
      Alert.alert("Vehicle Unavailable", "This vehicle is currently in use by another driver.");
      return;
    }

    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Permission Denied", "No access to location.");
        return;
      }
      
      const { status: bgStatus } = await Location.requestBackgroundPermissionsAsync();
      if (bgStatus !== "granted") {
        Alert.alert("Permission Denied", "Background location permission is required for trip recording.");
        return;
      }

      setRecording(true);
      const pos = await Location.getCurrentPositionAsync({});
      const { latitude, longitude } = pos.coords;

      const tripId = await startTrip(
        user.uid,
        selectedFleet,
        selectedVehicle,
        latitude,
        longitude
      );
      currentTripId.current = tripId;

      await AsyncStorage.setItem("current_trip", JSON.stringify({
        tripId,
        fleetId: selectedFleet,
        userId: user.uid,
        userEmail: user.email
      }));

      await Location.startLocationUpdatesAsync(LOCATION_TASK_NAME, {
        accuracy: Location.Accuracy.High,
        timeInterval: 10000,
        distanceInterval: 10,
        showsBackgroundLocationIndicator: true,
        pausesUpdatesAutomatically: false,
        activityType: Location.ActivityType.AutomotiveNavigation,
        foregroundService: {
          notificationTitle: "Vehicle Fleet",
          notificationBody: "Recording your trip...",
        },
      });
    } catch (error) {
      console.error("Error starting recording:", error);
      Alert.alert("Error", "Could not start recording trip.");
      setRecording(false);
      currentTripId.current = null;
      await AsyncStorage.removeItem("current_trip");
    }
  };

  const stopRecording = async () => {
    try {
      const hasStarted = await Location.hasStartedLocationUpdatesAsync(LOCATION_TASK_NAME);
      if (hasStarted) {
        await Location.stopLocationUpdatesAsync(LOCATION_TASK_NAME);
      }
      await AsyncStorage.removeItem("current_trip");
    } catch (err) {
      console.log("Error stopping updates", err);
    }

    try {
      const { status: currentStatus } =
        await Location.getForegroundPermissionsAsync();
      if (currentStatus !== "granted") {
        const { status: newStatus } =
          await Location.requestForegroundPermissionsAsync();
        if (newStatus !== "granted") {
          Alert.alert(
            "Permission Denied",
            "Location permission is required to stop the trip accurately."
          );
          return;
        }
      }
      const lastPos = await Location.getCurrentPositionAsync({});
      const { latitude, longitude } = lastPos.coords;
      if (netInfo.isConnected) {
        await endTrip(currentTripId.current, latitude, longitude);
      } else {
        console.log("Offline: Queuing END_TRIP action");
        await queueEndTripAction({
          type: "END_TRIP",
          tripId: currentTripId.current,
          latitude: latitude,
          longitude: longitude,
          timestamp: Date.now(),
        });
        Alert.alert("Offline", "Trip end queued and will sync when online.");
      }
      currentTripId.current = null;
      setRecording(false);
    } catch (error) {
      console.error("Error stopping trip:", error);
      Alert.alert("Error", "Error stopping trip.");
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.contentContainer}>
        <Text style={styles.title}>Record your position</Text>
        {!netInfo.isConnected && recording && (
          <Text style={styles.offlineIndicator}>
            No internet connection: Location data is being saved locally.
          </Text>
        )}

        <Text style={styles.label}>Select Fleet:</Text>
        {loadingFleets ? (
          <ActivityIndicator size="small" color="#007bff" />
        ) : (
          <View style={{ zIndex: 2 }}>
            <DropDownPicker
              open={fleetOpen}
              value={selectedFleet}
              items={fleets.map((fleet) => ({
                label: fleet.name,
                value: fleet.id,
              }))}
              setOpen={setFleetOpen}
              setValue={setSelectedFleet}
              placeholder="Choose a fleet"
              disabled={recording}
              style={styles.dropdown}
              dropDownContainerStyle={styles.dropdownContainer}
            />
          </View>
        )}

        <Text style={styles.label}>Select Vehicle:</Text>
        {loadingVehicles ? (
          <ActivityIndicator size="small" color="#007bff" />
        ) : (
          <View style={{ zIndex: 1 }}>
            <DropDownPicker
              open={vehicleOpen}
              value={selectedVehicle}
              items={vehicles.map((vehicle) => ({
                label: unavailableVehicleIds.has(vehicle.id) ? `${vehicle.name} (In Use)` : `${vehicle.name} (${vehicle.registrationNumber})`,
                value: vehicle.id,
                disabled: unavailableVehicleIds.has(vehicle.id),
              }))}
              setOpen={setVehicleOpen}
              setValue={setSelectedVehicle}
              placeholder={
                selectedFleet ? "Choose a vehicle" : "Select fleet first"
              }
              disabled={!selectedFleet || recording}
              style={styles.dropdown}
              dropDownContainerStyle={styles.dropdownContainer}
            />
          </View>
        )}

        {selectedFleet && selectedVehicle && (
          <>
            <View style={styles.infoBox}>
              <View style={styles.infoRow}>
                <Text style={styles.info}>
                  Fleet:{" "}
                  {fleets.find((fleet) => fleet.id === selectedFleet)?.name}
                </Text>
              </View>

              <View style={styles.divider} />

              <View style={styles.infoRow}>
                <Text style={styles.info}>
                  Vehicle:{" "}
                  {
                    vehicles.find((vehicle) => vehicle.id === selectedVehicle)
                      ?.name
                  }
                </Text>
              </View>
            </View>

            <View style={styles.bottomContainer}>
              <TouchableOpacity
                style={[
                  styles.button,
                  recording
                    ? { backgroundColor: "red" }
                    : { backgroundColor: "#007bff" },
                ]}
                onPress={recording ? stopRecording : startRecording}
              >
                <Text style={styles.buttonText}>
                  {recording ? "Stop Recording" : "Start Recording"}
                </Text>
              </TouchableOpacity>
            </View>
          </>
        )}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: "#f4f6f9",
  },
  contentContainer: {
    flex: 1,
    padding: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 20,
    textAlign: "center",
  },
  offlineIndicator: {
    textAlign: "center",
    color: "red",
    padding: 5,
    marginBottom: 10,
  },
  label: {
    fontSize: 16,
    marginBottom: 8,
    fontWeight: "600",
  },
  dropdown: {
    marginBottom: 5,
    borderColor: "transparent",
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    paddingHorizontal: 15,
    height: 55,
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
  },
  dropdownContainer: {
    borderColor: "#eaeaea",
    backgroundColor: "#fff",
    borderRadius: 12,
    elevation: 5,
  },
  infoBox: {
    marginTop: 30,
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 20,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
  },
  info: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    flex: 1,
  },
  divider: {
    height: 1,
    backgroundColor: "#f0f0f0",
    marginVertical: 4,
  },
  bottomContainer: {
    marginTop: "auto",
  },
  button: {
    borderRadius: 30,
    paddingVertical: 18,
    alignItems: "center",
    justifyContent: "center",
    elevation: 4,
    shadowColor: "#007bff",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    marginTop: 20,
  },
  buttonText: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "700",
  },
});

export default DashboardScreen;

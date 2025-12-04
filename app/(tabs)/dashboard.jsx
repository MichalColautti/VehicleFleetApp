import { appEvents } from "@/events/appEvents";
import { getFleetsForUserWithPermission } from "@/services/fleetMembershipService";
import { getFleetVehicles } from "@/services/fleetVechicleService";
import {
  endTrip,
  getActiveTripForUser,
  startTrip,
  updateTripLocation,
} from "@/services/locationService";
import * as Location from "expo-location";
import { getAuth } from "firebase/auth";
import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Button,
  StyleSheet,
  Text,
  View,
} from "react-native";
import DropDownPicker from "react-native-dropdown-picker";

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
  const locationSubscription = useRef(null);

  const currentTripId = useRef(null);

  const auth = getAuth();
  const user = auth.currentUser;

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
    const checkForActiveTrip = async () => {
      if (!user) return;

      const activeTrip = await getActiveTripForUser(user.uid);
      if (activeTrip) {
        console.log("Active trip found, resuming...", activeTrip);
        setSelectedFleet(activeTrip.fleetId);
        setSelectedVehicle(activeTrip.vehicleId);
        currentTripId.current = activeTrip.tripId;
        setRecording(true);

        locationSubscription.current = await Location.watchPositionAsync(
          {
            accuracy: Location.Accuracy.High,
            timeInterval: 10000,
          },
          async (location) => {
            const { latitude, longitude, speed } = location.coords;
            const speedKmh = speed * 3.6;
            await updateTripLocation(
              currentTripId.current,
              latitude,
              longitude,
              user.uid,
              speedKmh
            );
          }
        );
      }
    };

    checkForActiveTrip();

    return () => {
      locationSubscription.current?.remove();
    };
  }, [user]);

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

    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Permission Denied", "No access to location.");
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

      locationSubscription.current = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.High,
          timeInterval: 10000,
          //distanceInterval: 10, // refresh every 10 meters
        },
        async (location) => {
          try {
            if (location.coords.accuracy > 25) {
              console.log(`Removed inaccurate location update with accuracy: ${location.coords.accuracy}m`);
              return;
            }

            const { latitude, longitude, speed } = location.coords;
            const speedKmh = speed * 3.6;
            await updateTripLocation(
              currentTripId.current,
              latitude,
              longitude,
              user.uid,
              speedKmh
            );
          } catch (error) {
            console.error("Error updating trip location:", error);
          }
        }
      );
    } catch (error) {
      console.error("Error starting recording:", error);
      Alert.alert("Error", "Could not start recording trip.");
      setRecording(false); 
    }
  };

  const stopRecording = async () => {
    try {
      const { status: currentStatus } =
        await Location.getForegroundPermissionsAsync();
      if (currentStatus !== "granted") {
        const { status: newStatus } =
          await Location.requestForegroundPermissionsAsync();
        if (newStatus !== "granted") {
          Alert.alert("Permission Denied", "Location permission is required to stop the trip accurately.");
          return;
        }
      }
      const lastPos = await Location.getCurrentPositionAsync({});
      await endTrip(
        currentTripId.current,
        lastPos.coords.latitude,
        lastPos.coords.longitude
      );
    } catch (error) {
      console.error("Error stopping trip:", error);
      Alert.alert("Error", "Could not save the end of your trip properly.");
    } finally {
      locationSubscription.current?.remove();
      locationSubscription.current = null;
      currentTripId.current = null;
      setRecording(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Record your position</Text>

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
              label: `${vehicle.name} (${vehicle.registrationNumber})`,
              value: vehicle.id,
            }))}
            setOpen={setVehicleOpen}
            setValue={setSelectedVehicle}
            placeholder={
              selectedFleet ? "Choose a vehicle" : "Select fleet first"
            }
            disabled={!selectedFleet}
            style={styles.dropdown}
            dropDownContainerStyle={styles.dropdownContainer}
          />
        </View>
      )}

      {selectedFleet && selectedVehicle && (
        <View style={styles.infoBox}>
          <Text style={styles.info}>
            Fleet: {fleets.find((fleet) => fleet.id === selectedFleet)?.name}
          </Text>
          <Text style={styles.info}>
            Vehicle:{" "}
            {vehicles.find((vehicle) => vehicle.id === selectedVehicle)?.name}
          </Text>

          <Button
            title={recording ? "Stop Recording" : "Start Recording"}
            color={recording ? "red" : "#007bff"}
            onPress={recording ? stopRecording : startRecording}
          />
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: "#fff",
  },
  title: {
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 20,
    textAlign: "center",
  },
  label: {
    fontSize: 16,
    marginBottom: 8,
  },
  dropdown: {
    marginBottom: 20,
    borderColor: "#aaa",
  },
  dropdownContainer: {
    borderColor: "#aaa",
  },
  infoBox: {
    marginTop: 20,
    alignItems: "center",
    gap: 10,
  },
  info: {
    fontSize: 16,
    color: "#333",
  },
});

export default DashboardScreen;

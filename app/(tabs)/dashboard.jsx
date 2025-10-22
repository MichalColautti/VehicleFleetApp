import { getFleetsForUserWithPermission } from "@/services/fleetMembershipService";
import {
  getFleetVehicles,
  updateVechicleLocation,
} from "@/services/fleetVechicleService";
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
  const [filteredVehicles, setFilteredVehicles] = useState([]);

  const [fleetOpen, setFleetOpen] = useState(false);
  const [vehicleOpen, setVehicleOpen] = useState(false);

  const [selectedFleet, setSelectedFleet] = useState(null);
  const [selectedVehicle, setSelectedVehicle] = useState(null);

  const [loadingFleets, setLoadingFleets] = useState(true);
  const [loadingVehicles, setLoadingVehicles] = useState(false);

  const [recording, setRecording] = useState(false);
  const locationSubscription = useRef(null);

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
  }, [user]);

  useEffect(() => {
    const fetchVehicles = async () => {
      if (!selectedFleet) return;

      try {
        setLoadingVehicles(true);
        const fleetVehicles = await getFleetVehicles(selectedFleet);
        setVehicles(fleetVehicles);
        setFilteredVehicles(fleetVehicles);
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

    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("No access to location");
      return;
    }

    setRecording(true);

    locationSubscription.current = await Location.watchPositionAsync(
      {
        accuracy: Location.Accuracy.High,
        timeInterval: 10000,
        distanceInterval: 10, // refresh every 10 meters
      },
      async (location) => {
        const { latitude, longitude, speed } = location.coords;
        const speedKmh = speed * 3.6;
        console.log('lat:', latitude, "lon:", longitude, "speed", speedKmh)

        try {
          await updateVechicleLocation(
            user.uid,
            selectedFleet,
            latitude,
            longitude,
            speedKmh,
            selectedVehicle,
          );
        } catch (error) {
          console.error("Error updating location:", error);
        }
      }
    );
  };

  const stopRecording = () => {
    if (locationSubscription.current) {
      locationSubscription.current.remove();
      locationSubscription.current = null;
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
      )}

      <Text style={styles.label}>Select Vehicle:</Text>
      {loadingVehicles ? (
        <ActivityIndicator size="small" color="#007bff" />
      ) : (
        <DropDownPicker
          open={vehicleOpen}
          value={selectedVehicle}
          items={filteredVehicles.map((vehicle) => ({
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

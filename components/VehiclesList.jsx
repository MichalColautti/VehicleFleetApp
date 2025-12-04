import VehicleDetailsModal from "@/components/VehicleDetailsModal";
import { useState } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

const VehiclesList = ({ vehicles, handleDeleteVehicle, fleet }) => {
  const [vehicleModalVisible, setVehicleModalVisible] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState(null);

  const handleOpenVehicle = (vehicle) => {
    setSelectedVehicle(vehicle);
    setVehicleModalVisible(true);
  };

  const handleCloseVehicle = () => {
    setSelectedVehicle(null);
    setVehicleModalVisible(false);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Vehicles:</Text>
      {vehicles?.length ? (
        <ScrollView style={styles.vehicleList}>
          {vehicles.map((vehicle) => (
            <TouchableOpacity
              key={vehicle.id}
              style={styles.vehicleItem}
              onPress={() => handleOpenVehicle(vehicle)}
            >
              <Text style={styles.vehicleText}>
                {vehicle.name} ({vehicle.registrationNumber})
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      ) : (
        <Text style={styles.noVehicles}>No vehicles in this fleet.</Text>
      )}
      {selectedVehicle && (
        <VehicleDetailsModal
          vehicleModalVisible={vehicleModalVisible}
          handleCloseVehicle={handleCloseVehicle}
          selectedVehicle={selectedVehicle}
          handleDeleteVehicle={handleDeleteVehicle}
          fleet={fleet}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 12,
    backgroundColor: "#fff",
    borderRadius: 10,
  },
  title: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 20,
  },
  vehicleList: {
    maxHeight: 185,
    borderLeftWidth: 1,
    borderColor: "#ddd",
  },
  vehicleItem: {
    alignItems: "center",
    justifyContent: "center",
    borderBottomWidth: 1,
    borderColor: "#ddd",
    padding: 14,
    backgroundColor: "#fff",
  },
  vehicleText: {
    fontSize: 14,
    color: "#434343",
  },
  noVehicles: {
    fontSize: 14,
    color: "#aaa",
    textAlign: "center",
    marginVertical: 10,
  },
});

export default VehiclesList;

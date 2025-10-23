import VehicleDetailsModal from "@/components/VehicleDetailsModal";
import { useState } from "react";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";

const VehicleList = ({ vehicles, handleDeleteVehicle }) => {
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

  if (!vehicles?.length) {
    return <Text style={styles.noVehicles}>No vehicles in this fleet.</Text>;
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Vehicles:</Text>
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

      {selectedVehicle && (
        <VehicleDetailsModal
          vehicleModalVisible={vehicleModalVisible}
          handleCloseVehicle={handleCloseVehicle}
          selectedVehicle={selectedVehicle}
          handleDeleteVehicle={handleDeleteVehicle}
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
    maxHeight: 140,
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

export default VehicleList;

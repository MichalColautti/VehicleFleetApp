import { useState } from "react";
import {
    Modal,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";

const AddVehicleModal = ({
  vehicleModalVisible,
  setVehicleModalVisible,
  handleAddVehicle,
  fleetId,
}) => {
  const [vehicleData, setVehicleData] = useState({
    name: "",
    registrationNumber: "",
  });

  const [error, setError] = useState("");

  const handleSubmit = () => {
    if (!vehicleData.name || !vehicleData.registrationNumber) {
      setError("All fields are required");
      return;
    }

    setError("");
    handleAddVehicle(fleetId, vehicleData);
    setVehicleData({ name: "", registrationNumber: "" });
    setVehicleModalVisible(false);
  };

  return (
    <Modal
      visible={vehicleModalVisible}
      animationType="slide"
      transparent
      onRequestClose={() => setVehicleModalVisible(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>Add Vehicle</Text>
          <Text style={styles.modalSubtitle}>Enter vehicle details below</Text>

          <TextInput
            placeholder="Vehicle Name"
            placeholderTextColor="#aaaaaa"
            value={vehicleData.name}
            onChangeText={(text) =>
              setVehicleData({ ...vehicleData, name: text })
            }
            style={styles.modalInput}
          />

          <TextInput
            placeholder="Registration Number"
            placeholderTextColor="#aaaaaa"
            value={vehicleData.registrationNumber}
            onChangeText={(text) =>
              setVehicleData({ ...vehicleData, registrationNumber: text })
            }
            style={styles.modalInput}
            autoCapitalize="characters"
          />

          {error ? <Text style={styles.error}>{error}</Text> : null}

          <TouchableOpacity style={styles.inviteButton} onPress={handleSubmit}>
            <Text style={styles.inviteButtonText}>Add Vehicle</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.cancelButton}
            onPress={() => {
              setVehicleModalVisible(false);
              setVehicleData({ name: "", registrationNumber: "" });
              setError("");
            }}
          >
            <Text style={styles.cancelButtonText}>Close</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  modalContent: {
    padding: 20,
    backgroundColor: "white",
    width: "80%",
    borderRadius: 10,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 15,
  },
  modalSubtitle: {
    marginTop: 15,
    fontWeight: "bold",
    marginBottom: 10,
  },
  modalInput: {
    borderWidth: 1,
    borderColor: "#aaaaaa",
    padding: 10,
    marginBottom: 8,
    borderRadius: 8,
  },
  inviteButton: {
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    backgroundColor: "#007bff",
    borderColor: "#000000",
    padding: 6,
    borderRadius: 8,
  },
  inviteButtonText: {
    fontSize: 16,
    color: "#ffffff",
  },
  cancelButton: {
    alignItems: "center",
    justifyContent: "center",
    marginTop: 10,
    borderWidth: 1,
    backgroundColor: "#aaaaaa",
    borderColor: "#000000",
    padding: 6,
    borderRadius: 8,
  },
  cancelButtonText: {
    fontSize: 16,
    color: "#000000",
  },
  error: {
    color: "red",
    marginBottom: 10,
    fontSize: 10,
  },
});

export default AddVehicleModal;

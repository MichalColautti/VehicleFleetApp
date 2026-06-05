import { hasPermissions } from "@/services/roleService";
import { getAuth } from "firebase/auth";
import { useEffect, useState } from "react";
import { Modal, StyleSheet, Text, TouchableOpacity, View } from "react-native";

const VehicleDetailsModal = ({
  vehicleModalVisible,
  handleCloseVehicle,
  selectedVehicle,
  handleDeleteVehicle,
  fleet,
}) => {
  const auth = getAuth();
  const currentUser = auth.currentUser;

  const [canDeleteVehicle, setCanDeleteVehicle] = useState(false);
  const [isCheckingPermission, setIsCheckingPermission] = useState(true);

  const handleDelete = async () => {
    if (!selectedVehicle) return;

    await handleDeleteVehicle(selectedVehicle.id);
    handleCloseVehicle();
  };

  useEffect(() => {
    const checkPermission = async () => {
      if (fleet?.id && currentUser?.uid) {
        const hasPermission = await hasPermissions(
          currentUser.uid,
          fleet.id,
          "delete_vehicle"
        );
        setCanDeleteVehicle(hasPermission);
        setIsCheckingPermission(false);
      }
    };
    checkPermission();
  }, [fleet, currentUser]);

  return (
    <Modal
      visible={vehicleModalVisible && !isCheckingPermission}
      animationType="slide"
      transparent={true}
      onRequestClose={handleCloseVehicle}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>Vehicle Details</Text>
          {selectedVehicle && (
            <>
              <Text style={styles.vehicleDetails}>
                Name: {selectedVehicle.name}
              </Text>
              <Text style={styles.vehicleDetails}>
                Registration Number: {selectedVehicle.registrationNumber}
              </Text>
            </>
          )}

          {selectedVehicle && canDeleteVehicle && (
            <TouchableOpacity
              style={styles.deleteButton}
              onPress={handleDelete}
            >
              <Text style={styles.deleteButtonText}>Delete Vehicle</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={styles.cancelButton}
            onPress={handleCloseVehicle}
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
    textAlign: "center",
  },
  vehicleDetails: {
    fontSize: 16,
    marginBottom: 10,
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
  deleteButton: {
    alignItems: "center",
    justifyContent: "center",
    marginTop: 10,
    borderWidth: 1,
    backgroundColor: "red",
    borderColor: "#000000",
    padding: 6,
    borderRadius: 8,
  },
  deleteButtonText: {
    fontSize: 16,
    color: "#000000",
  },
});

export default VehicleDetailsModal;

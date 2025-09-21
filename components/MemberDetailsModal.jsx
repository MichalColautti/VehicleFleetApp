import { getRoleById } from "@/services/roleService";
import { useEffect, useState } from "react";
import { Modal, StyleSheet, Text, TouchableOpacity, View } from "react-native";

const MemberDetailsModal = ({ memberModalVisible, handleCloseMember, selectedMember }) => {
  const [roleName, setRoleName] = useState("");

  useEffect(() => {
    const fetchRole = async () => {
      if (selectedMember?.roleId) {
        const role = await getRoleById(selectedMember.roleId);
        setRoleName(role?.name || "Unknown role");
      } else {
        setRoleName("No role");
      }
    };
    fetchRole();
  }, [selectedMember]);

  return (
    <Modal
      visible={memberModalVisible}
      animationType="slide"
      transparent={true}
      onRequestClose={handleCloseMember}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>Member Details</Text>
          {selectedMember && (
            <>
              <Text style={styles.memberDetails}>
                Name: {selectedMember.name}
              </Text>
              <Text style={styles.memberDetails}>
                Email: {selectedMember.email}
              </Text>
              <Text style={styles.memberDetails}>
                Role: {roleName}
              </Text>
              <Text style={styles.memberDetails}>
                Status: {selectedMember.status}
              </Text>
            </>
          )}
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={handleCloseMember}
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
  memberDetails: {
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
});

export default MemberDetailsModal;

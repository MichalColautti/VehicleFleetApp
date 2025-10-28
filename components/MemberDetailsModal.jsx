import { getRoleById, hasPermissions } from "@/services/roleService";
import { getAuth } from "firebase/auth";
import { useEffect, useState } from "react";
import { Modal, StyleSheet, Text, TouchableOpacity, View } from "react-native";

const MemberDetailsModal = ({
  memberModalVisible,
  handleCloseMember,
  selectedMember,
  handleDeleteMember,
  handleDeleteInvite,
  fleet,
}) => {
  const auth = getAuth();
  const currentUser = auth.currentUser;

  const [roleName, setRoleName] = useState("");
  const [canDeleteMember, setCanDeleteMember] = useState(false);
  const [isCheckingPermission, setIsCheckingPermission] = useState(true);

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

  const handleDelete = async () => {
    if (!selectedMember) return;

    if (selectedMember.status === "pending") {
      await handleDeleteInvite(selectedMember.notificationId);
    } else {
      await handleDeleteMember(selectedMember);
    }
    handleCloseMember();
  };

  useEffect(() => {
    const checkPermission = async () => {
      if (fleet?.id && currentUser?.uid && selectedMember) {
        const hasPermission = await hasPermissions(
          currentUser.uid,
          fleet.id,
          "delete_member"
        );
        setCanDeleteMember(hasPermission);
        setIsCheckingPermission(false);
      }
    };
    checkPermission();
  }, [fleet, currentUser, selectedMember]);

  const deleteLabel =
    selectedMember?.status === "pending" ? "Delete Invite" : "Delete Member";

  return (
    <Modal
      visible={memberModalVisible && !isCheckingPermission}
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
                Email: {selectedMember.email}
              </Text>
              <Text style={styles.memberDetails}>Role: {roleName}</Text>
              <Text style={styles.memberDetails}>
                Status: {selectedMember.status}
              </Text>
            </>
          )}
          {selectedMember &&
            selectedMember.roleId !== "owner" &&
            canDeleteMember && (
              <TouchableOpacity
                style={styles.deleteButton}
                onPress={handleDelete}
              >
                <Text style={styles.deleteButtonText}>{deleteLabel}</Text>
              </TouchableOpacity>
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

export default MemberDetailsModal;

import { getActiveTripForUser } from "@/services/locationService";
import { getRoleById, hasPermissions } from "@/services/roleService";
import { useRouter } from "expo-router";
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
  const router = useRouter();

  const [roleName, setRoleName] = useState("");
  const [canDeleteMember, setCanDeleteMember] = useState(false);
  const [isCheckingPermission, setIsCheckingPermission] = useState(true);
  const [hasActiveTrip, setHasActiveTrip] = useState(false);
  const [canViewPosition, setCanViewPosition] = useState(false);
  const [canViewHistory, setCanViewHistory] = useState(false);

  useEffect(() => {
    const fetchRole = async () => {
      if (selectedMember?.roleId) {
        const role = await getRoleById(selectedMember.roleId);
        setRoleName(role?.name || "Unknown role");
      } else {
        setRoleName("No role");
      }
    };

    const checkForActiveTrip = async () => {
      if (selectedMember?.userId && fleet?.id) {
        const activeTrip = await getActiveTripForUser(
          selectedMember.userId,
          fleet.id
        );
        setHasActiveTrip(!!activeTrip);
      } else {
        setHasActiveTrip(false);
      }
    };
    fetchRole();
    checkForActiveTrip();
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
      setIsCheckingPermission(true);
      if (fleet?.id && currentUser?.uid && selectedMember) {
        const [
          hasDeletePermission,
          hasViewPositionPermission,
          hasViewHistoryPermission,
        ] = await Promise.all([
          hasPermissions(currentUser.uid, fleet.id, "delete_member"),
          hasPermissions(currentUser.uid, fleet.id, "view_driver_position"),
          hasPermissions(currentUser.uid, fleet.id, "view_trip_history"),
        ]);

        setCanDeleteMember(hasDeletePermission);
        setCanViewPosition(hasViewPositionPermission);
        setCanViewHistory(hasViewHistoryPermission);
      }
      setIsCheckingPermission(false);
    };
    checkPermission();
  }, [fleet, currentUser, selectedMember]);

  const deleteLabel =
    selectedMember?.status === "pending" ? "Delete Invite" : "Delete Member";

  const handleShowHistory = () => {
    if (!selectedMember) return;
    handleCloseMember();
    router.push({
      pathname: "/trip/tripHistoryList",
      params: {
        userId: selectedMember.userId,
        userEmail: selectedMember.email,
        fleetId: fleet.id,
      },
    });
  };

  const handleShowOnMap = () => {
    if (!selectedMember) return;
    handleCloseMember();
    router.push({
      pathname: "/trip/driverLocation",
      params: {
        userId: selectedMember.userId,
        fleetId: fleet.id,
      },
    });
  };

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

          {selectedMember && selectedMember.status === "accepted" && (
            <>
              {canViewHistory && (
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={handleShowHistory}
                >
                  <Text style={styles.actionButtonText}>
                    Show trip history
                  </Text>
                </TouchableOpacity>
              )}
              {hasActiveTrip && canViewPosition && (
                <TouchableOpacity style={styles.actionButton} onPress={handleShowOnMap}>
                  <Text style={styles.actionButtonText}>Show on map</Text>
                </TouchableOpacity>
              )}
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
  actionButton: {
    alignItems: "center",
    justifyContent: "center",
    marginTop: 10,
    borderWidth: 1,
    backgroundColor: "#e0e0e0",
    borderColor: "#000000",
    padding: 6,
    borderRadius: 8,
  },
  actionButtonText: {
    fontSize: 16,
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

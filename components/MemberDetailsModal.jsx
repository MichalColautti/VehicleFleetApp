import { getActiveTripForUser } from "@/services/locationService";
import {
  getRoleById,
  getRoles,
  hasPermissions,
  updateFleetMemberRole,
} from "@/services/roleService";
import { useRouter } from "expo-router";
import { getAuth } from "firebase/auth";
import { useEffect, useState } from "react";
import { Alert, Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";

const MemberDetailsModal = ({
  memberModalVisible,
  handleCloseMember,
  selectedMember,
  handleDeleteMember,
  handleDeleteInvite,
  fleet,
  onMemberUpdated,
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
  const [canUpdateRole, setCanUpdateRole] = useState(false);
  const [isEditingRole, setIsEditingRole] = useState(false);
  const [canRecordPosition, setCanRecordPosition] = useState(false);
  const [allRoles, setAllRoles] = useState([]);
  const [currentRoleId, setCurrentRoleId] = useState(null);

  useEffect(() => {
    const fetchRole = async () => {
      if (selectedMember?.roleId) {
        const role = await getRoleById(selectedMember.roleId);
        setRoleName(role?.name || "Unknown role");
      } else {
        setRoleName("No role");
      }
      setCurrentRoleId(selectedMember?.roleId || null);
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

  useEffect(() => {
    const fetchRoles = async () => {
      try {
        const roles = await getRoles();
        setAllRoles(roles);
      } catch (e) {
        console.error(e);
      }
    };
    fetchRoles();
  }, []);

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
          hasUpdatePermission,
          memberHasRecordPermission,
        ] = await Promise.all([
          hasPermissions(currentUser.uid, fleet.id, "delete_member"),
          hasPermissions(currentUser.uid, fleet.id, "view_drivers_position"),
          hasPermissions(currentUser.uid, fleet.id, "view_trip_history"),
          hasPermissions(currentUser.uid, fleet.id, "update_member"),
          hasPermissions(selectedMember.userId, fleet.id, "record_position"),
        ]);

        setCanDeleteMember(hasDeletePermission);
        setCanViewPosition(hasViewPositionPermission);
        setCanViewHistory(hasViewHistoryPermission);
        setCanUpdateRole(hasUpdatePermission);
        setCanRecordPosition(memberHasRecordPermission);
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

  const handleRoleUpdate = async (newRoleId) => {
    if (!selectedMember?.membershipId) return;
    try {
      await updateFleetMemberRole(selectedMember.membershipId, newRoleId);
      const role = allRoles.find((r) => r.id === newRoleId);
      if (role) setRoleName(role.name);
      setIsEditingRole(false);
      setCurrentRoleId(newRoleId);
      if (onMemberUpdated) onMemberUpdated();
      Alert.alert("Success", "Role updated successfully");
    } catch (e) {
      Alert.alert("Error", "Failed to update role");
    }
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
              {!isEditingRole ? (
                <Text style={styles.memberDetails}>Role: {roleName}</Text>
              ) : (
                <View style={styles.roleSelectionContainer}>
                  <Text style={styles.sectionTitle}>Select new role:</Text>
                  <ScrollView style={{ maxHeight: 150 }}>
                    {allRoles
                      .filter((role) => role.id !== "owner")
                      .map((role) => (
                      <TouchableOpacity
                        key={role.id}
                        disabled={role.id === currentRoleId}
                        style={[
                          styles.roleOption,
                          role.id === currentRoleId && styles.selectedRole,
                          role.id === currentRoleId && { opacity: 0.5 },
                        ]}
                        onPress={() => handleRoleUpdate(role.id)}
                      >
                        <Text>{role.name}</Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
              )}
              <Text style={styles.memberDetails}>
                Status: {selectedMember.status}
              </Text>
            </>
          )}

          {selectedMember && selectedMember.status === "accepted" && !isEditingRole && (
            <>
              {canViewHistory && canRecordPosition && (
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
              {canUpdateRole && selectedMember.roleId !== "owner" && (
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={() => setIsEditingRole(true)}
                >
                  <Text style={styles.actionButtonText}>Change Role</Text>
                </TouchableOpacity>
              )}
            </>
          )}

          {selectedMember &&
            selectedMember.roleId !== "owner" &&
            !isEditingRole &&
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
            onPress={isEditingRole ? () => setIsEditingRole(false) : handleCloseMember}
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
  roleSelectionContainer: {
    marginVertical: 10,
    borderWidth: 1,
    borderColor: "#eee",
    borderRadius: 5,
  },
  roleOption: {
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
    alignItems: "center",
  },
  selectedRole: {
    backgroundColor: "#e6f7ff",
  },
  sectionTitle: {
    fontWeight: "bold",
    marginTop: 10,
    marginBottom: 5,
    textAlign: "center",
  },
});

export default MemberDetailsModal;

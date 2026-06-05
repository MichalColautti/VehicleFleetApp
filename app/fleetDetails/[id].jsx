import AddVehicleModal from "@/components/AddVehicleModal";
import InviteNewMemberModal from "@/components/InviteNewMemberModal";
import MembersList from "@/components/MembersList";
import VehiclesList from "@/components/VehiclesList";
import { appEvents } from "@/events/appEvents";
import {
  deleteFleetMember,
  getFleetMembersIncludingPending,
  inviteUserToFleet,
  rejectInvite,
  updateFleetMemberSetting,
} from "@/services/fleetMembershipService";
import { getFleetById } from "@/services/fleetService";
import {
  addVehicle,
  deleteVehicle,
  getFleetVehicles,
} from "@/services/fleetVechicleService";
import { hasPermissions } from "@/services/roleService";
import { checkUserSubscriptionStatus } from "@/services/subscriptionService";
import { getUserIdByEmail } from "@/services/userService";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import { getAuth } from "firebase/auth";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  AppState,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

const FleetDetailsScreen = () => {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const auth = getAuth();
  const currentUser = auth.currentUser;

  const [loading, setLoading] = useState(false);
  const [fleet, setFleet] = useState(null);
  const [members, setMembers] = useState([]);
  const [vehicles, setVehicles] = useState([]);

  const [inviteInput, setInviteInput] = useState({ email: "", roleId: "" });

  const [inviteModalVisible, setInviteModalVisible] = useState(false);
  const [addVehicleModalVisible, setAddVehicleModalVisible] = useState(false);

  const [canAddVehicle, setCanAddVehicle] = useState(false);
  const [isCheckingAddVehiclePermission, setIsCheckingAddVehiclePermission] = useState(true);

  const [canInviteMember, setCanInviteMember] = useState(false);
  const [isCheckingInviteMemberPermission, setIsCheckingInviteMemberPermission] = useState(true);
  const [isCheckingSpeedingPermission, setIsCheckingSpeedingPermission] = useState(true);

  const [notifySpeeding, setNotifySpeeding] = useState(true);
  const [canReceiveSpeedingAlerts, setCanReceiveSpeedingAlerts] = useState(false);
  const [currentUserMembershipId, setCurrentUserMembershipId] = useState(null);

  const [subStatus, setSubStatus] = useState({ 
    isValid: true, 
    isExpired: false, 
    daysLeft: 30, 
    limit: 3, 
    planId: 'basic',
    originalPlanId: 'basic'
  });

  const fetchFleetData = async () => {
    if (!id) return;
    try {
      setLoading(true);

      const [fleetData, membersData, vehiclesData] = await Promise.all([
        getFleetById(id),
        getFleetMembersIncludingPending(id),
        getFleetVehicles(id),
      ]);

      setFleet(fleetData || {});
      setMembers(membersData || []);
      setVehicles(vehiclesData || []);

      const ownerMember = membersData?.find(m => m.roleId === 'owner');

      if (ownerMember) {
        const status = await checkUserSubscriptionStatus(ownerMember.userId);
        setSubStatus(status);
      } else {
        if (currentUser) {
            const status = await checkUserSubscriptionStatus(currentUser.uid);
            setSubStatus(status);
        }
      }

    } catch (error) {
      console.error("Error loading fleet details:", error);
      Alert.alert("Error", "Failed to load fleet details");
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchFleetData();
    }, [id])
  );

  useEffect(() => {
    const subscription = AppState.addEventListener("change", (nextAppState) => {
      if (nextAppState === "active") {
        fetchFleetData();
      }
    });
    return () => {
      subscription.remove();
    };
  }, [id]);

  const handleInvite = async () => {
    if (!inviteInput.email) {
      Alert.alert("Error", "All fields are required");
      return;
    }

    if (!inviteInput.roleId) {
      Alert.alert("Error", "Please select a role for the new member");
      return;
    }

    //console.log("RoleId:", inviteInput.roleId, typeof inviteInput.roleId);

    if (members.length >= subStatus.limit) {
       const isCurrentUserOwner = members.find(m => m.userId === currentUser?.uid)?.roleId === 'owner';
       Alert.alert(
         "Limit Reached", 
         isCurrentUserOwner 
           ? `Your current plan allows for ${subStatus.limit} drivers. Please upgrade your plan to invite more members.`
           : `The fleet owner's plan limit (${subStatus.limit} drivers) has been reached. The owner must upgrade to add more members.`
       );
       return;
    }

    try {
      const userId = await getUserIdByEmail(inviteInput.email);

      if (!userId) {
        Alert.alert("Error", "User with this email does not exist");
        return;
      }

      const currentMembers = await getFleetMembersIncludingPending(fleet.id);
      const memberInvited = currentMembers.some((m) => m.userId === userId);

      if (memberInvited) {
        Alert.alert("Error", "This user is already a member of the fleet");
        return;
      }

      const chosenRole = inviteInput.roleId;
      await inviteUserToFleet(fleet.id, userId, inviteInput.roleId);
      Alert.alert("Success", "User invited successfully");

      setInviteInput({ email: "", roleId: chosenRole });

      fetchFleetData();
    } catch (error) {
      Alert.alert("Error", error.message);
    }
  };

  const handleDeleteMember = async (member) => {
    Alert.alert(
      "Delete Fleet",
      "Are you sure you want to delete this member?",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteFleetMember(member.membershipId);
              Alert.alert("Success", "Member removed successfully");
              fetchFleetData();
              appEvents.emit("fleetAccepted");
            } catch (error) {
              Alert.alert("Error", error.message);
            }
          },
        },
      ]
    );
  };

  const handleDeleteInvite = async (notificationId) => {
    if (!notificationId) return;
    try {
      await rejectInvite(notificationId);
      Alert.alert("Success", "Invitation cancelled");
      fetchFleetData();
    } catch (error) {
      Alert.alert("Error", error.message);
    }
  };

  const handleAddVehicle = async (vehicleData) => {
    if (!vehicleData) return;
    try {
      //console.log("Adding vehicle:", fleetId, vehicleData);
      await addVehicle(
        id,
        vehicleData.name,
        vehicleData.registrationNumber
      );
      Alert.alert("Success", "Vehicle added successfully");
      setAddVehicleModalVisible(false);
      fetchFleetData();
    } catch (error) {
      Alert.alert("Error", error.message);
    }
  };

  const handleDeleteVehicle = async (vehicleId) => {
    try {
      await deleteVehicle(vehicleId);
      Alert.alert("Success", "Vehicle deleted successfully");
      fetchFleetData();
    } catch (error) {
      Alert.alert("Error", error.message);
    }
  };

  const toggleSpeedingNotification = async (value) => {
    setNotifySpeeding(value);
    try {
      await updateFleetMemberSetting(currentUserMembershipId, "notifySpeeding", value);
    } catch (error) {
      Alert.alert("Error", "Failed to update setting");
      setNotifySpeeding(!value);
    }
  };

  const handleLeaveFleet = async () => {
    if (!currentUserMembershipId) return;

    Alert.alert(
      "Leave Fleet",
      "Are you sure you want to leave this fleet?",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Leave",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteFleetMember(currentUserMembershipId);
              Alert.alert("Success", "You have left the fleet");
              router.replace("/(tabs)/fleetManagement");
            } catch (error) {
              Alert.alert("Error", error.message);
            }
          },
        },
      ]
    );
  };

  useEffect(() => {
    const checkSpeedingSettings = async () => {
      if (members.length > 0 && currentUser && fleet?.id) {
        const membership = members.find(m => m.userId === currentUser.uid && m.status === 'accepted');
        if (membership) {
          setCurrentUserMembershipId(membership.membershipId);
          setNotifySpeeding(membership.settings?.notifySpeeding !== false);
          const hasPermission = await hasPermissions(currentUser.uid, fleet.id, "get_notified_speeding");
          setCanReceiveSpeedingAlerts(hasPermission);
        }
      }
    };
    checkSpeedingSettings();
  }, [members, currentUser, fleet]);

  useEffect(() => {
    const checkPermission = async () => {
      if (fleet?.id && currentUser?.uid) {
        const hasPermission = await hasPermissions(
          currentUser.uid,
          fleet.id,
          "add_vehicle"
        );
        setCanAddVehicle(hasPermission);
        setIsCheckingAddVehiclePermission(false);
      }
    };
    checkPermission();
  }, [fleet, currentUser]);

  useEffect(() => {
    const checkPermission = async () => {
      if (fleet?.id && currentUser?.uid) {
        const hasPermission = await hasPermissions(
          currentUser.uid,
          fleet.id,
          "invite_member"
        );
        setCanInviteMember(hasPermission);
        setIsCheckingInviteMemberPermission(false);
      }
    };
    checkPermission();
  }, [fleet, currentUser]);

  if (loading || isCheckingAddVehiclePermission || isCheckingInviteMemberPermission) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color="#007bff" />
      </View>
    );
  }

  const currentUserMembership = members.find(
    (m) => m.userId === currentUser?.uid && m.status === "accepted"
  );
  const isOwner = currentUserMembership?.roleId === "owner";

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{fleet?.name}</Text>

      {canReceiveSpeedingAlerts && (
        <View style={styles.settingRow}>
          <Text style={styles.settingText}>Receive speeding notifications</Text>
          <Switch
            trackColor={{ false: "#cecdcdff", true: "#9acbffff" }}
            thumbColor={notifySpeeding ? "#007bff" : "#fff"}
            onValueChange={toggleSpeedingNotification}
            value={notifySpeeding}
          />
        </View>
      )}

      <MembersList
        members={members}
        handleDeleteMember={handleDeleteMember}
        handleDeleteInvite={handleDeleteInvite}
        fleet={fleet}
      />

      {canInviteMember && (
        <TouchableOpacity
          style={styles.inviteButton}
          onPress={() => setInviteModalVisible(true)}
        >
          <Text style={styles.inviteButtonText}>Invite new member</Text>
        </TouchableOpacity>
      )}

      <VehiclesList
        vehicles={vehicles}
        handleDeleteVehicle={handleDeleteVehicle}
        fleet={fleet}
      />

      {canAddVehicle && (
        <TouchableOpacity
          style={styles.inviteButton}
          onPress={() => setAddVehicleModalVisible(true)}
        >
          <Text style={styles.inviteButtonText}>Add new vehicle</Text>
        </TouchableOpacity>
      )}

      {!isOwner && currentUserMembership && (
        <TouchableOpacity style={styles.leaveButton} onPress={handleLeaveFleet}>
          <Text style={styles.leaveButtonText}>Leave Fleet</Text>
        </TouchableOpacity>
      )}

      <InviteNewMemberModal
        inviteModalVisible={inviteModalVisible}
        setInviteModalVisible={setInviteModalVisible}
        inviteInput={inviteInput}
        setInviteInput={setInviteInput}
        handleInvite={handleInvite}
      />

      <AddVehicleModal
        vehicleModalVisible={addVehicleModalVisible}
        setVehicleModalVisible={setAddVehicleModalVisible}
        handleAddVehicle={handleAddVehicle}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  container: {
    padding: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 15,
    textAlign: "center",
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
  noMembersText: {
    fontSize: 14,
    color: "#aaaaaa",
    marginLeft: 10,
  },
  settingRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 15,
    paddingHorizontal: 10,
  },
  settingText: {
    fontSize: 16,
  },
  leaveButton: {
    alignItems: "center",
    justifyContent: "center",
    marginTop: 20,
    borderWidth: 1,
    backgroundColor: "red",
    borderColor: "#000000",
    padding: 10,
    borderRadius: 8,
  },
  leaveButtonText: {
    fontSize: 16,
    color: "#ffffff",
    fontWeight: "bold",
  },
});

export default FleetDetailsScreen;

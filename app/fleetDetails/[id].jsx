import AddVehicleModal from "@/components/AddVehicleModal";
import InviteNewMemberModal from "@/components/InviteNewMemberModal";
import MembersList from "@/components/MembersList";
import VehiclesList from "@/components/VehiclesList";
import {
  deleteFleetMember,
  getFleetMembersIncludingPending,
  inviteUserToFleet,
  rejectInvite,
} from "@/services/fleetMembershipService";
import { getFleetById } from "@/services/fleetService";
import {
  addVehicle,
  deleteVehicle,
  getFleetVehicles,
} from "@/services/fleetVechicleService";
import { hasPermissions } from "@/services/roleService";
import { getUserIdByEmail } from "@/services/userService";
import { useLocalSearchParams, useRouter } from "expo-router";
import { getAuth } from "firebase/auth";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  StyleSheet,
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

  const [inviteInput, setInviteInput] = useState("");

  const [inviteModalVisible, setInviteModalVisible] = useState(false);
  const [addVehicleModalVisible, setAddVehicleModalVisible] = useState(false);

  const [canAddVehicle, setCanAddVehicle] = useState(false);
  const [isCheckingAddVehiclePermission, setIsCheckingAddVehiclePermission] = useState(true);

  const [canInviteMember, setCanInviteMember] = useState(false);
  const [isCheckingInviteMemberPermission, setIsCheckingInviteMemberPermission] = useState(true);

  const fetchFleetData = async () => {
    try {
      setLoading(true);
      const fleetData = await getFleetById(id);
      const membersData = await getFleetMembersIncludingPending(id);
      const vehiclesData = await getFleetVehicles(id);

      setFleet(fleetData || {});
      setMembers(membersData || []);
      setVehicles(vehiclesData || []);
    } catch (error) {
      console.error("Error loading fleet details:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) {
      fetchFleetData();
    }
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

  const handleAddVehicle = async (fleetId, vehicleData) => {
    try {
      //console.log("Adding vehicle:", fleetId, vehicleData);
      await addVehicle(
        fleetId,
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

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{fleet?.name}</Text>

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
});

export default FleetDetailsScreen;

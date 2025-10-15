import FleetDetailsModal from "@/components/FleetDetailsModal";
import FleetList from "@/components/FleetList";
import { getAuth } from "firebase/auth";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import {
  deleteFleetMember,
  getFleetMembersIncludingPending,
  inviteUserToFleet,
} from "@/services/fleetMembershipService";
import {
  createFleet,
  deleteFleet,
  getOwnedFleets,
} from "@/services/fleetService";
import {
  addVehicle,
  deleteVehicle,
  getFleetVehicles,
} from "@/services/fleetVechicleService";
import { getUserIdByEmail } from "@/services/userService";

const FleetManagementScreen = () => {
  const [fleetName, setFleetName] = useState("");
  const [fleets, setFleets] = useState([]);
  const [selectedFleet, setSelectedFleet] = useState(null);
  const [inviteInput, setInviteInput] = useState({ email: "", roleId: "" });
  const [modalVisible, setModalVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const auth = getAuth();
  const currentUser = auth.currentUser;
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (currentUser) {
      fetchFleets();
    }
  }, [currentUser]);

  const fetchFleets = async () => {
    setLoading(true);
    try {
      const userFleets = await getOwnedFleets(currentUser.uid);

      const fleetsWithMembers = await Promise.all(
        userFleets.map(async (fleet) => {
          const members = await getFleetMembersIncludingPending(fleet.id);
          return { ...fleet, members };
        })
      );
      setFleets(fleetsWithMembers);

      const fleetsWithVehicles = await Promise.all(
        fleetsWithMembers.map(async (fleet) => {
          const vehicles = await getFleetVehicles(fleet.id);
          return { ...fleet, vehicles };
        })
      );
      setFleets(fleetsWithVehicles);

      return fleetsWithVehicles;
    } catch (error) {
      Alert.alert("Error", error.message);
      return [];
    } finally {
      setLoading(false);
    }
  };

  const handleCreateFleet = async () => {
    if (!fleetName.trim()) {
      Alert.alert("Error", "Fleet name cannot be empty");
      return;
    }

    if (fleets.find((f) => f.name === fleetName)) {
      Alert.alert("Error", "Fleet with that name already exists");
      return;
    }

    try {
      await createFleet(currentUser.uid, fleetName);
      Alert.alert("Success", "Fleet created successfully");
      setFleetName("");
      fetchFleets();
    } catch (error) {
      Alert.alert("Error", error.message);
    }
  };

  const handleDeleteFleet = (fleetId) => {
    Alert.alert("Delete Fleet", "Are you sure you want to delete this fleet?", [
      {
        text: "Cancel",
        style: "cancel",
      },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            await deleteFleet(fleetId);
            Alert.alert("Success", "Fleet deleted successfully");
            fetchFleets();
          } catch (error) {
            Alert.alert("Error", error.message);
          }
        },
      },
    ]);
  };

  const handleOpenFleet = (fleet) => {
    setSelectedFleet(fleet);
    setInviteInput({ email: "", roleId: "" });
    setModalVisible(true);
  };

  const handleInvite = async () => {
    if (!inviteInput.email || !selectedFleet) {
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

      const currentMembers = await getFleetMembersIncludingPending(
        selectedFleet.id
      );
      const memberInvited = currentMembers.some((m) => m.userId === userId);

      if (memberInvited) {
        Alert.alert("Error", "This user is already a member of the fleet");
        return;
      }

      const chosenRole = inviteInput.roleId;
      await inviteUserToFleet(selectedFleet.id, userId, inviteInput.roleId);
      Alert.alert("Success", "User invited successfully");

      setInviteInput({ email: "", roleId: chosenRole });

      const updatedFleets = await fetchFleets();
      const updatedFleet = updatedFleets.find((f) => f.id === selectedFleet.id);
      if (updatedFleet) {
        setSelectedFleet(updatedFleet);
      }
    } catch (error) {
      Alert.alert("Error", error.message);
    }
  };

  const handleDeleteMember = async (member) => {
    if (!selectedFleet || !member) return;

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

              const updatedFleets = await fetchFleets();
              const updatedFleet = updatedFleets.find(
                (f) => f.id === selectedFleet.id
              );
              if (updatedFleet) {
                setSelectedFleet(updatedFleet);
              }

              Alert.alert("Success", "Member removed successfully");
            } catch (error) {
              Alert.alert("Error", error.message);
            }
          },
        },
      ]
    );
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
      const updatedFleets = await fetchFleets();
      const updatedFleet = updatedFleets.find((f) => f.id === fleetId);
      if (updatedFleet) setSelectedFleet(updatedFleet);
    } catch (error) {
      Alert.alert("Error", error.message);
    }
  };

  const handleDeleteVehicle = async (vehicleId) => {
    try {
      await deleteVehicle(vehicleId);
      Alert.alert("Success", "Vehicle deleted successfully");

      const updatedFleet = {
        ...selectedFleet,
        vehicles: selectedFleet.vehicles.filter((v) => v.id !== vehicleId),
      };
      setSelectedFleet(updatedFleet);
      fetchFleets();
    } catch (error) {
      Alert.alert("Error", error.message);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchFleets();
    setRefreshing(false);
  };

  return (
    <View style={styles.container}>
      <View style={{ padding: 16 }}>
        <Text style={styles.title}>Create Fleet</Text>

        <TextInput
          placeholder="Fleet Name"
          value={fleetName}
          onChangeText={setFleetName}
          style={styles.input}
        />

        <TouchableOpacity
          style={styles.createFleetButton}
          onPress={handleCreateFleet}
        >
          <Text style={styles.createFleetButtonText}>Create fleet</Text>
        </TouchableOpacity>

        <Text style={styles.title}>Your Fleets</Text>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#007bff" style={styles.loader} />
      ) : (
        <FleetList
          fleets={fleets}
          handleOpenFleet={handleOpenFleet}
          handleDeleteFleet={handleDeleteFleet}
          refreshing={refreshing}
          handleRefresh={handleRefresh}
        />
      )}

      <FleetDetailsModal
        modalVisible={modalVisible}
        setModalVisible={setModalVisible}
        selectedFleet={selectedFleet}
        inviteInput={inviteInput}
        setInviteInput={setInviteInput}
        handleInvite={handleInvite}
        handleDeleteMember={handleDeleteMember}
        handleAddVehicle={handleAddVehicle}
        handleDeleteVehicle={handleDeleteVehicle}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  title: {
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 8,
    marginTop: 16,
    textAlign: "center",
  },
  input: {
    borderWidth: 1,
    borderColor: "#cccccc",
    padding: 12,
    marginBottom: 12,
    borderRadius: 8,
  },
  loader: {
    marginTop: 40,
    alignSelf: "center",
  },
  createFleetButton: {
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    backgroundColor: "#007bff",
    borderColor: "#000000",
    padding: 10,
    borderRadius: 8,
  },
  createFleetButtonText: {
    fontSize: 16,
    color: "#ffffff",
  },
  noFleetsText: {
    textAlign: "center",
    fontSize: 16,
    color: "#aaaaaa",
    marginTop: 20,
  },
  fleetItemContainer: {
    alignItems: "center",
    backgroundColor: "#fafafa",
    flex: 1,
    flexDirection: "row",
    justifyContent: "flex-end",
  },
  deleteButton: {
    backgroundColor: "red",
    width: 70,
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
  },
  deleteButtonText: {
    color: "#fff",
    fontSize: 16,
  },
});

export default FleetManagementScreen;

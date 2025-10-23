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
  getFleetMembersIncludingPending
} from "@/services/fleetMembershipService";
import {
  createFleet,
  deleteFleet,
  getOwnedFleets,
} from "@/services/fleetService";
import {
  getFleetVehicles
} from "@/services/fleetVechicleService";
import { useRouter } from "expo-router";

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
  const router = useRouter();

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
    router.push(`/fleetDetails/${fleet.id}`);
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

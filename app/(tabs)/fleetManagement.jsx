import FleetDetailsModal from "@/components/FleetDetailsModal";
import FleetItem from "@/components/FleetItem";
import {
    createFleet,
    getUserFleetsWithMembers,
    inviteUserToFleet,
} from "@/services/fleetService";
import { getAuth } from "firebase/auth";
import { useEffect, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    FlatList,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";

const FleetManagementScreen = () => {
  const [fleetName, setFleetName] = useState("");
  const [fleets, setFleets] = useState([]);
  const [selectedFleet, setSelectedFleet] = useState(null);
  const [inviteInput, setInviteInput] = useState({ email: "", name: "" });
  const [modalVisible, setModalVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const auth = getAuth();
  const currentUser = auth.currentUser;

  useEffect(() => {
    if (currentUser) {
      fetchFleets();
    }
  }, [currentUser]);

  const fetchFleets = async () => {
    setLoading(true);
    try {
      const userFleets = await getUserFleetsWithMembers(currentUser.uid);
      setFleets(userFleets);
      return userFleets;
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

  const handleOpenFleet = (fleet) => {
    setSelectedFleet(fleet);
    setInviteInput({ email: "", name: "" });
    setModalVisible(true);
  };

  const handleInvite = async () => {
    if (!inviteInput.email || !inviteInput.name || !selectedFleet) {
      Alert.alert("Error", "All fields are required");
      return;
    }

    try {
      await inviteUserToFleet(
        selectedFleet.id,
        inviteInput.email,
        inviteInput.name
      );
      Alert.alert("Success", "User invited successfully");
      setInviteInput({ email: "", name: "" });

      const updatedFleets = await fetchFleets();
      const updatedFleet = updatedFleets.find((f) => f.id === selectedFleet.id);
      if (updatedFleet) {
        setSelectedFleet(updatedFleet);
      }
    } catch (error) {
      Alert.alert("Error", error.message);
    }
  };

  return (
    <View style={styles.container}>
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

      {loading ? (
        <ActivityIndicator size="large" color="#007bff" style={styles.loader} />
      ) : (
        <FlatList
          data={fleets}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <FleetItem handleOpenFleet={handleOpenFleet} item={item} />
          )}
        />
      )}

      <FleetDetailsModal
        modalVisible={modalVisible}
        setModalVisible={setModalVisible}
        selectedFleet={selectedFleet}
        inviteInput={inviteInput}
        setInviteInput={setInviteInput}
        handleInvite={handleInvite}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  title: {
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 10,
    marginTop: 10,
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
});

export default FleetManagementScreen;

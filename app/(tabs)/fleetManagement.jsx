import DeleteIcon from "@/assets/icons/delete.svg";
import FleetItem from "@/components/FleetItem";
import { appEvents } from "@/events/appEvents";
import { getFleetMembersIncludingPending } from "@/services/fleetMembershipService";
import {
  createFleet,
  deleteFleet,
  getJoinedFleets,
  getOwnedFleets,
} from "@/services/fleetService";
import { getFleetVehicles } from "@/services/fleetVechicleService";
import { useRouter } from "expo-router";
import { getAuth } from "firebase/auth";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { SwipeListView } from "react-native-swipe-list-view";

const FleetManagementScreen = () => {
  const [fleetName, setFleetName] = useState("");
  const [ownedFleets, setOwnedFleets] = useState([]);
  const [joinedFleets, setJoinedFleets] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const auth = getAuth();
  const currentUser = auth.currentUser;
  const router = useRouter();

  useEffect(() => {
    if (currentUser) {
      fetchFleets();
    }

    appEvents.on("fleetAccepted", fetchFleets);

    return () => {
      appEvents.off("fleetAccepted", fetchFleets);
    };
  }, [currentUser]);

  const fetchFleets = async () => {
    setLoading(true);
    try {
      const owned = await getOwnedFleets(currentUser.uid);
      const joined = await getJoinedFleets(currentUser.uid);

      const ownedFleetsWithData = await Promise.all(
        owned.map(async (fleet) => {
          const members = await getFleetMembersIncludingPending(fleet.id);
          const vehicles = await getFleetVehicles(fleet.id);
          return { ...fleet, members, vehicles };
        })
      );
      setOwnedFleets(ownedFleetsWithData);

      const joinedFleetsWithData = await Promise.all(
        joined.map(async (fleet) => {
          const members = await getFleetMembersIncludingPending(fleet.id);
          const vehicles = await getFleetVehicles(fleet.id);
          return { ...fleet, members, vehicles };
        })
      );
      setJoinedFleets(joinedFleetsWithData);
    } catch (error) {
      Alert.alert("Error", error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateFleet = async () => {
    if (!fleetName.trim()) {
      Alert.alert("Error", "Fleet name cannot be empty");
      return;
    }

    if (ownedFleets.find((f) => f.name === fleetName)) {
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
      { text: "Cancel", style: "cancel" },
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


  const ListHeader = () => (
    <View>
      <View style={styles.inputContainer}>
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
      </View>
      <Text style={styles.sectionTitle}>Your Fleets</Text>
    </View>
  );

  const ListFooter = () => (
    <View style={{ paddingBottom: 40 }}>
      <Text style={styles.sectionTitle}>Joined Fleets</Text>
      {joinedFleets.length === 0 ? (
        <Text style={styles.noFleetsText}>No joined fleets</Text>
      ) : (
        joinedFleets.map((item) => (
          <FleetItem
            key={item.id}
            handleOpenFleet={handleOpenFleet}
            item={item}
          />
        ))
      )}
    </View>
  );

  const renderHiddenItem = ({ item }) => (
    <View style={styles.fleetItemContainer}>
      <TouchableOpacity
        style={styles.deleteButton}
        onPress={() => handleDeleteFleet(item.id)}
      >
        <DeleteIcon width={24} height={24} />
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.container}
      >
        {loading ? (
          <ActivityIndicator
            size="large"
            color="#007bff"
            style={styles.loader}
          />
        ) : (
          <SwipeListView
            data={ownedFleets}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <FleetItem handleOpenFleet={handleOpenFleet} item={item} />
            )}
            renderHiddenItem={renderHiddenItem}
            rightOpenValue={-70}
            disableRightSwipe
            stopRightSwipe={-70}
            ListHeaderComponent={ListHeader}
            ListFooterComponent={ListFooter}
            ListEmptyComponent={
              <Text style={styles.noFleetsText}>No owned fleets found</Text>
            }
            refreshing={refreshing}
            onRefresh={handleRefresh}
            contentContainerStyle={styles.listContent}
          />
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#fff",
  },
  container: {
    flex: 1,
  },
  listContent: {
    paddingBottom: 20,
  },
  inputContainer: {
    marginHorizontal: 16,
    marginBottom: 10,
  },
  title: {
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 16,
    marginTop: 16,
    textAlign: "center",
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 10,
    marginTop: 30,
    marginLeft: 16,
    color: "#000",
  },
  input: {
    borderWidth: 1,
    borderColor: "#cccccc",
    padding: 12,
    marginBottom: 12,
    borderRadius: 8,
    backgroundColor: "#fff",
  },
  loader: {
    flex: 1,
    alignSelf: "center",
  },
  createFleetButton: {
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    backgroundColor: "#007bff",
    borderColor: "#000000",
    padding: 12,
    borderRadius: 8,
  },
  createFleetButtonText: {
    fontSize: 16,
    color: "#ffffff",
    fontWeight: "bold",
  },
  noFleetsText: {
    textAlign: "center",
    fontSize: 16,
    color: "#aaaaaa",
    marginTop: 20,
    marginBottom: 20,
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
});

export default FleetManagementScreen;
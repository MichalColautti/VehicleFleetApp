import { getTripsForUser } from "@/services/locationService";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
    ActivityIndicator,
    FlatList,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";

const TripHistoryListScreen = () => {
  const router = useRouter();
  const { userId, userEmail, fleetId } = useLocalSearchParams(); 
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (userId && fleetId) {
      const fetchTrips = async () => {
        try {
          setLoading(true);
          const userTrips = await getTripsForUser(userId, fleetId);
          setTrips(userTrips);
        } catch (error) {
          console.error("Error fetching user trips:", error);
        } finally {
          setLoading(false);
        }
      };
      fetchTrips();
    }
  }, [userId, fleetId]);

  const handleTripPress = (trip) => {
    router.push({
      pathname: "/trip/tripHistoryMap", 
      params: { tripData: JSON.stringify(trip) }, 
    });
  };

  const renderTripItem = ({ item }) => {
    const startTime = item.startTime
      ? new Date(item.startTime.seconds * 1000).toLocaleString()
      : "Brak daty";
    const status = item.active ? " (Aktywny)" : " (Zakończony)";

    return (
      <TouchableOpacity
        style={styles.tripItem}
        onPress={() => handleTripPress(item)}
      >
        <Text style={styles.tripText}>Przejazd z dnia: {startTime}</Text>
        <Text style={styles.tripStatus}>{status}</Text>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Historia przejazdów</Text>
      <Text style={styles.subtitle}>{userEmail}</Text>
      <FlatList
        data={trips}
        renderItem={renderTripItem}
        keyExtractor={(item) => item.tripId}
        ListEmptyComponent={
          <Text style={styles.emptyText}>Brak przejazdów</Text>
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  centered: { flex: 1, justifyContent: "center", alignItems: "center" },
  title: {
    fontSize: 22,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 16,
    color: "gray",
    textAlign: "center",
    marginBottom: 20,
  },
  tripItem: {
    backgroundColor: "#f0f0f0",
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
  },
  tripText: { fontSize: 16 },
  tripStatus: { fontSize: 14, color: "gray" },
  emptyText: {
    textAlign: "center",
    marginTop: 20,
    fontSize: 16,
    color: "gray",
  },
});

export default TripHistoryListScreen;

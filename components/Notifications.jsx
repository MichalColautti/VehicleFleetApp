import InviteItem from "@/components/InviteItem";
import {
    ActivityIndicator,
    FlatList,
    StyleSheet,
    Text,
    View,
} from "react-native";

const Notifications = ({ invites, loading, handleAccept, handleReject }) => {
  return (
    <View style={styles.container}>
      {loading ? (
        <Text style={styles.subtitle}>Notifications: loading</Text>
      ) : (
        <Text style={styles.subtitle}>
          Notifications: {invites?.length || 0}
        </Text>
      )}

      <View style={styles.notificationsContainer}>
        {loading ? (
          <ActivityIndicator size="large" color="#0000ff" />
        ) : invites.length === 0 ? (
          <Text style={styles.noNotificationsText}>No new notifications</Text>
        ) : (
          <FlatList
            data={invites}
            keyExtractor={(item) => item.fleetId}
            renderItem={({ item }) => (
              <InviteItem
                invite={item}
                onAccept={handleAccept}
                onReject={handleReject}
              />
            )}
          />
        )}
      </View>
    </View>
  );
};

export default Notifications;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: "#ffffff",
  },
  notificationsContainer: {
    padding: 10,
    backgroundColor: "#eeeeeeff",
    borderRadius: 10,
    marginBottom: 20,
    borderColor: "#000000",
    borderWidth: 1,
    justifyContent: "center",
    minHeight: 225,
    maxHeight: 225,
  },
  loading: {
    padding: 50,
    alignItems: "center",
  },
  subtitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 10,
    //textAlign: "center",
  },
  noNotificationsText: {
    fontSize: 20,
    color: "#5c5c5cff",
    textAlign: "center",
  },
});

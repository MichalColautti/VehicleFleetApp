import InviteItem from "@/components/InviteItem";
import { appEvents } from "@/events/appEvents";
import {
  acceptInvite,
  getPendingInvites,
  rejectInvite,
} from "@/services/fleetMembershipService";
import { getAuth } from "firebase/auth";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  StyleSheet,
  Text,
  View,
} from "react-native";

const Notifications = ({fetchNotificationCount}) => {
  const [invites, setInvites] = useState([]);
  const auth = getAuth();
  const currentUser = auth.currentUser;
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (currentUser?.uid) {
      fetchPendingInvites();
    }
  }, [currentUser]);

  const fetchPendingInvites = async () => {
    if (!currentUser?.uid) return;

    try {
      setLoading(true);
      const pendingInvites = await getPendingInvites(currentUser.uid);
      setInvites(pendingInvites);
    } catch (error) {
      Alert.alert("Error", error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async (invite) => {
    if (!currentUser?.uid) return;

    try {
      await acceptInvite(invite.notificationId, currentUser.uid, invite.fleetId, invite.roleId);
      Alert.alert("Success", "You have been added to the fleet.");
      fetchPendingInvites();
      appEvents.emit("fleetAccepted")
      fetchNotificationCount();
    } catch (error) {
      Alert.alert("Error", error.message);
    }
  };

  const handleReject = async (invite) => {
    if (!currentUser?.uid) return;

    try {
      await rejectInvite(invite.notificationId);
      Alert.alert("", "You have rejected the invite.");
      fetchPendingInvites();
    } catch (error) {
      Alert.alert("Error", error.message);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchPendingInvites();
    setRefreshing(false);
  };

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
        ) : (
          <FlatList
            data={invites}
            keyExtractor={(item) => item}
            renderItem={({ item }) => (
              <InviteItem
                invite={item}
                onAccept={() => {
                  handleAccept(item);
                  fetchNotificationCount();
                }}
                onReject={() => {
                  handleReject(item);
                  fetchNotificationCount();
                }}
              />
            )}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Text style={styles.noNotificationsText}>
                  No new notifications
                </Text>
              </View>
            }
            refreshing={refreshing}
            onRefresh={handleRefresh}
          />
        )}
      </View>
    </View>
  );
};

export default Notifications;

const styles = StyleSheet.create({
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
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    height: 200,
  },
});

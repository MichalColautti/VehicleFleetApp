import Notifications from "@/components/Notifications";
import { getPendingInvites } from "@/services/fleetService";
import { getAuth } from "firebase/auth";
import { useEffect, useState } from "react";
import { Alert, StyleSheet } from "react-native";

const DashboardScreen = () => {
  const [invites, setInvites] = useState([]);
  const auth = getAuth();
  const currentUser = auth.currentUser;
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (currentUser) {
      fetchPendingInvites();
    }
  }, [currentUser]);

  const fetchPendingInvites = async () => {
    try {
      setLoading(true);
      const pendingInvites = await getPendingInvites(currentUser);
      setInvites(pendingInvites);
    } catch (error) {
      Alert.alert("Error", error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async (fleetId) => {
    try {
    } catch (error) {
      Alert.alert("Error", error.message);
    }
  };

  const handleReject = async (fleetId) => {
    try {
    } catch (error) {
      Alert.alert("Error", error.message);
    }
  };

  return (
    <Notifications
      invites={invites}
      loading={loading}
      handleAccept={handleAccept}
      handleReject={handleReject}
    />
  );
};

const styles = StyleSheet.create({});

export default DashboardScreen;

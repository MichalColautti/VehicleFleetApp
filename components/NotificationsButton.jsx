import NitificationsIcon from "@/assets/icons/notifications.svg";
import Notifications from "@/components/Notifications";
import { appEvents } from "@/events/appEvents";
import { getPendingInvites } from "@/services/fleetMembershipService";
import { getAuth } from "firebase/auth";
import { useEffect, useState } from "react";
import { Modal, StyleSheet, Text, TouchableOpacity, View } from "react-native";

const NotificationsButton = () => {
  const [visible, setVisible] = useState(false);
  const [count, setCount] = useState(0);

  const auth = getAuth();
  const currentUser = auth.currentUser;

  const fetchNotificationCount = async () => {
    if (!currentUser?.uid) return;
    const invites = await getPendingInvites(currentUser.uid);
    setCount(invites.length);
  };

  useEffect(() => {
    fetchNotificationCount();
    const interval = setInterval(fetchNotificationCount, 10000);

    return () => clearInterval(interval);
  }, [currentUser]);

  useEffect(() => {
    const openModal = () => setVisible(true);
    appEvents.on("openNotificationsModal", openModal);

    return () => {
      appEvents.off("openNotificationsModal", openModal);
    };
  }, []);

  return (
    <>
      <TouchableOpacity
        style={styles.notificationsIcon}
        onPress={() => setVisible(true)}
      >
        <NitificationsIcon width={24} height={24} color="#fff" />
        {count > 0 && (
          <View style={styles.numberOfNotifications}>
            <Text style={styles.numberOfNotificationsText}>{count}</Text>
          </View>
        )}
      </TouchableOpacity>

      <Modal
        visible={visible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Notifications fetchNotificationCount={fetchNotificationCount}/>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => {
                setVisible(false);
                fetchNotificationCount();
              }}
            >
              <Text style={styles.closeText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  notificationsIcon: {
    marginRight: 15,
  },
  numberOfNotifications: {
    position: "absolute",
    top: -5,
    right: -5,
    backgroundColor: "red",
    width: 16,
    height: 16,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  numberOfNotificationsText: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "bold",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
  },
  modalContent: {
    margin: 20,
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 10,
  },
  closeButton: {
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    backgroundColor: "#aaaaaa",
    borderColor: "#000000",
    padding: 6,
    borderRadius: 8,
  },
  closeButtonText: {
    fontSize: 16,
    color: "#000000",
  },
});

export default NotificationsButton;

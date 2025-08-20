import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

const InviteItem = ({ invite, onAccept, onReject }) => {
  return (
    <View style={styles.inviteCard}>
      <Text style={styles.inviteText}>
        You have been invited to{" "}
        <Text style={{ fontWeight: "bold" }}>{invite.fleetName}</Text>
      </Text>
      <View style={styles.buttonRow}>
        <TouchableOpacity
          style={styles.acceptButton}
          onPress={() => onAccept(invite.fleetId)}
        >
          <Text style={styles.buttonText}>Accept</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.rejectButton}
          onPress={() => onReject(invite.fleetId)}
        >
          <Text style={styles.buttonText}>Reject</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default InviteItem;

const styles = StyleSheet.create({
  inviteCard: {
    backgroundColor: "#f9f9f9",
    padding: 15,
    marginBottom: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#000000",
  },
  inviteText: {
    fontSize: 16,
    marginBottom: 10,
  },
  buttonRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  acceptButton: {
    flex: 1,
    alignItems: "center",
    padding: 8,
    marginHorizontal: 5,
    borderRadius: 6,
    backgroundColor: "#23b746ff",
  },
  rejectButton: {
    flex: 1,
    alignItems: "center",
    padding: 8,
    marginHorizontal: 5,
    borderRadius: 6,
    backgroundColor: "red",
  },
  buttonText: {
    color: "#ffffff",
    fontWeight: "bold",
  },
});

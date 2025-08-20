import { useState } from "react";
import {
  Modal,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

const FleetDetailsModal = ({
  modalVisible,
  setModalVisible,
  selectedFleet,
  inviteInput,
  setInviteInput,
  handleInvite,
}) => {
  const [error, setError] = useState("");

  const validateEmail = (email) => {
    const reg = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
    return reg.test(email);
  };

  const onInvitePress = () => {
    if (!validateEmail(inviteInput.email)) {
      setError("Please enter a valid email address");
      return;
    }

    setError("");
    handleInvite();
  };

  return (
    <View>
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{selectedFleet?.name}</Text>

            <Text style={styles.modalSubtitle}>Members:</Text>
            {selectedFleet?.members && selectedFleet.members.length > 0 ? (
              selectedFleet.members.map((member) => (
                <Text key={member.id} style={styles.memberText}>
                  {member.name} ({member.email}) – {member.status}
                </Text>
              ))
            ) : (
              <Text style={styles.noMembersText}>No members</Text>
            )}

            <Text style={styles.modalSubtitle}>Invite members:</Text>
            <TextInput
              placeholder="Email"
              placeholderTextColor="#aaaaaa"
              value={inviteInput.email}
              onChangeText={(text) =>
                setInviteInput({ ...inviteInput, email: text })
              }
              style={styles.modalInput}
              keyboardType="email-address"
              autoCapitalize="none"
            />
            <TextInput
              placeholder="Name"
              placeholderTextColor="#aaaaaa"
              value={inviteInput.name}
              onChangeText={(text) =>
                setInviteInput({ ...inviteInput, name: text })
              }
              style={styles.modalInput}
            />

            {error ? <Text style={styles.error}>{error}</Text> : null}

            <TouchableOpacity
              style={styles.inviteButton}
              onPress={() => onInvitePress()}
            >
              <Text style={styles.inviteButtonText}>Invite</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => setModalVisible(false)}
            >
              <Text style={styles.cancelButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  modalContent: {
    padding: 20,
    backgroundColor: "white",
    width: "80%",
    borderRadius: 10,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 15,
  },
  modalSubtitle: {
    marginTop: 15,
    fontWeight: "bold",
    marginBottom: 10,
  },
  modalInput: {
    borderWidth: 1,
    borderColor: "#ccc",
    padding: 10,
    marginBottom: 8,
    borderRadius: 8,
  },
  memberText: {
    fontSize: 14,
    marginBottom: 4,
  },
  inviteButton: {
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    backgroundColor: "#007bff",
    borderColor: "#000000",
    padding: 6,
    borderRadius: 8,
  },
  inviteButtonText: {
    fontSize: 16,
    color: "#ffffff",
  },
  cancelButton: {
    alignItems: "center",
    justifyContent: "center",
    marginTop: 10,
    borderWidth: 1,
    backgroundColor: "#aaaaaa",
    borderColor: "#000000",
    padding: 6,
    borderRadius: 8,
  },
  cancelButtonText: {
    fontSize: 16,
    color: "#000000",
  },
  error: {
    color: "red",
    marginBottom: 10,
    fontSize: 10,
  },
  noMembersText: {
    fontSize: 14,
    color: "#aaaaaa",
    marginLeft: 10,
  },  
});

export default FleetDetailsModal;

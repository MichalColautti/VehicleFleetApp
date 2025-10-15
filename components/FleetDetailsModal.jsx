import InviteNewMemberModal from "@/components/InviteNewMemberModal";
import MembersList from "@/components/MembersList";
import { useState } from "react";
import { Modal, StyleSheet, Text, TouchableOpacity, View } from "react-native";

const FleetDetailsModal = ({
  modalVisible,
  setModalVisible,
  selectedFleet,
  inviteInput,
  setInviteInput,
  handleInvite,
  handleDeleteMember,
}) => {
  const [inviteModalVisible, setInviteModalVisible] = useState(false);

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

            <MembersList
              members={selectedFleet?.members}
              handleDeleteMember={handleDeleteMember}
            />

            <TouchableOpacity
              style={styles.inviteButton}
              onPress={() => setInviteModalVisible(true)}
            >
              <Text style={styles.inviteButtonText}>Invite new member</Text>
            </TouchableOpacity>

            <InviteNewMemberModal
              inviteModalVisible={inviteModalVisible}
              setInviteModalVisible={setInviteModalVisible}
              inviteInput={inviteInput}
              setInviteInput={setInviteInput}
              handleInvite={handleInvite}
            />

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
  noMembersText: {
    fontSize: 14,
    color: "#aaaaaa",
    marginLeft: 10,
  },
});

export default FleetDetailsModal;

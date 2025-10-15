import { getRoles } from "@/services/roleService";
import { useEffect, useState } from "react";
import {
  Modal,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import DropDownPicker from "react-native-dropdown-picker";

const InviteNewMemberModal = ({
  inviteModalVisible,
  setInviteModalVisible,
  inviteInput,
  setInviteInput,
  handleInvite,
}) => {
  const [error, setError] = useState("");
  const [roles, setRoles] = useState([]);
  const [selectedRole, setSelectedRole] = useState("");
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const fetchRoles = async () => {
      try {
        const rolesData = await getRoles();
        const formattedRoles = rolesData
          .filter((role) => role.name.toLowerCase() !== "owner")
          .map((role) => ({
            label: role.name,
            value: role.id,
          }));

        setRoles(formattedRoles);

        if (formattedRoles.length > 0) {
          const driverRole = formattedRoles.find(
            (r) => r.label.toLowerCase() === "driver"
          );

          const defaultRole = driverRole || formattedRoles[0];

          setSelectedRole(defaultRole.value);
          setInviteInput((prev) => ({ ...prev, roleId: defaultRole.value }));
        }
      } catch (error) {
        console.error("Error fetching roles:", error);
      }
    };

    fetchRoles();
  }, []);

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
    <Modal
      visible={inviteModalVisible}
      animationType="slide"
      transparent
      onRequestClose={() => setInviteModalVisible(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>Invite Member</Text>
          <Text style={styles.modalSubtitle}>
            Enter email and choose role to send invitation
          </Text>
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

          <DropDownPicker
            open={open}
            value={selectedRole}
            items={roles}
            setOpen={setOpen}
            setValue={(callbackOrValue) => {
              const val =
                typeof callbackOrValue === "function"
                  ? callbackOrValue(selectedRole)
                  : callbackOrValue;
              setSelectedRole(val);
              setInviteInput((prev) => ({ ...prev, roleId: val }));
            }}
            setItems={setRoles}
            style={styles.dropDownPicker}
            containerStyle={{ marginBottom: 10 }}
            dropDownContainerStyle={{ borderColor: "#aaaaaa" }}
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
            onPress={() => {
              setInviteModalVisible(false);
              setInviteInput({ email: "", roleId: selectedRole });
            }}
          >
            <Text style={styles.cancelButtonText}>Close</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
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
    borderColor: "#aaaaaa",
    padding: 10,
    marginBottom: 8,
    borderRadius: 8,
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
  dropDownPicker: {
    borderWidth: 1,
    borderColor: "#aaaaaa",
    borderRadius: 8,
    marginBottom: 10,
  },
});

export default InviteNewMemberModal;

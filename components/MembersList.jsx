import MemberDetailsModal from "@/components/MemberDetailsModal";
import { useState } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

const MembersList = ({ members, handleDeleteMember, handleDeleteInvite, fleet }) => {
  const [memberModalVisible, setMemberModalVisible] = useState(false);
  const [selectedMember, setSelectedMember] = useState(null);

  const handleOpenMember = (member) => {
    setSelectedMember(member);
    setMemberModalVisible(true);
  };

  const handleCloseMember = () => {
    setSelectedMember(null);
    setMemberModalVisible(false);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Members:</Text>
      <ScrollView style={styles.memberList}>
        {members && members.length > 0 ? (
          members.map((member) => (
            <TouchableOpacity
              key={member.membershipId}
              style={styles.memberItem}
              onPress={() => handleOpenMember(member)}
            >
              <Text style={styles.memberText}>{member.email} {member.status === "pending" && "(pending)"}</Text>
            </TouchableOpacity>
          ))
        ) : (
          <Text style={styles.noMembersText}>No members</Text>
        )}
      </ScrollView>

      <MemberDetailsModal
        memberModalVisible={memberModalVisible}
        handleCloseMember={handleCloseMember}
        selectedMember={selectedMember}
        handleDeleteMember={handleDeleteMember}
        handleDeleteInvite={handleDeleteInvite}
        fleet={fleet}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 12,
    backgroundColor: "#fff",
    borderRadius: 10,
  },
  title: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 20,
  },
  memberList: {
    maxHeight: 185,
    borderLeftWidth: 1,
    borderColor: "#ddd",
  },
  memberItem: {
    alignItems: "center",
    justifyContent: "center",
    borderBottomWidth: 1,
    borderColor: "#ddd",
    padding: 14,
    backgroundColor: "#fff",
  },
  memberText: {
    fontSize: 14,
    color: "#434343",
    textAlign: "center",
  },
  noMembersText: {
    fontSize: 14,
    color: "#aaa",
  },
});

export default MembersList;

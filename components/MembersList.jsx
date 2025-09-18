import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

const MembersList = ({ members }) => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Members:</Text>
      <ScrollView style={styles.memberList}>
        {members && members.length > 0 ? (
          members.map((member) => (
            <TouchableOpacity key={member.id} style={styles.memberItem}>
              <Text style={styles.memberDetails}>
                {member.name} ({member.email})
              </Text>
            </TouchableOpacity>
          ))
        ) : (
          <Text style={styles.noMembersText}>No members</Text>
        )}
      </ScrollView>
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
    maxHeight: 140,
    borderLeftWidth: 1,
    borderColor: "#ddd",
  },
  memberItem: {
    alignItems: "center",
    justifyContent: "center",
    borderBottomWidth: 1,
    borderColor: "#ddd",
    padding: 14,
    backgroundColor: "#fff"
  },
  memberDetails: {
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

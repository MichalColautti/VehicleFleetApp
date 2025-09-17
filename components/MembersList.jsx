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
    marginLeft: 3,
  },
  memberItem: {
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
    borderColor: "#000",
    borderWidth: 1,
    borderRadius: 10,
    padding: 8,
    backgroundColor: "#e7e7e7ff",
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

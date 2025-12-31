import { StyleSheet, Text, TouchableHighlight, View } from "react-native";

const FleetItem = ({ handleOpenFleet, item }) => {
  return (
    <TouchableHighlight
      onPress={() => handleOpenFleet(item)}
      underlayColor="#e2e2e2ff"
      style={styles.fleetBox}
    >
      <View>
        <Text style={styles.fleetName}>{item.name}</Text>
        <Text style={styles.memberCount}>Members: {item.members.length}</Text>
      </View>
    </TouchableHighlight>
  );
};

const styles = StyleSheet.create({
  fleetBox: {
    padding: 20,
    borderBottomWidth: 1,
    borderColor: "#ddd",
    backgroundColor: "#fff",
    justifyContent: "center",
  },
  fleetName: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#000",
  },
  memberCount: {
    fontSize: 14,
    color: "#aaaaaa",
    marginTop: 4,
  },
});

export default FleetItem;

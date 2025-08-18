import { StyleSheet, Text, TouchableOpacity } from "react-native";

const FleetItem = ({ handleOpenFleet, item }) => {
    return (
      <TouchableOpacity onPress={() => handleOpenFleet(item)} style={styles.fleetBox}>
        <Text style={styles.fleetName}>{item.name}</Text>
        <Text style={styles.memberCount}>Members: {item.members.length}</Text>
      </TouchableOpacity>
    )
}

const styles = StyleSheet.create({
  fleetBox: {
    marginTop: 12,
    padding: 15,
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 10,
    backgroundColor: "#f9f9f9",
  },
  fleetName: { 
    fontSize: 18, 
    fontWeight: "bold",
  },
  memberCount: { 
    fontSize: 14, 
    color: "#aaaaaa",
  },
})

export default FleetItem;
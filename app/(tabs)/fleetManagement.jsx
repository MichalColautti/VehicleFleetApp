import { StyleSheet, Text, View } from "react-native";

const FleetManagementScreen = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Zarządzanie flotą</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  text: {
    fontSize: 16,
  },
});

export default FleetManagementScreen;
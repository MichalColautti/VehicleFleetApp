import DeleteIcon from "@/assets/icons/delete.svg";
import FleetItem from "@/components/FleetItem";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SwipeListView } from "react-native-swipe-list-view";

const FleetList = ({
  fleets,
  handleOpenFleet,
  handleDeleteFleet,
  refreshing,
  handleRefresh,
}) => {
  const renderHiddenItem = handleDeleteFleet
    ? ({ item }) => (
        <View style={styles.fleetItemContainer}>
          <TouchableOpacity
            style={styles.deleteButton}
            onPress={() => handleDeleteFleet(item.id)}
          >
            <DeleteIcon width={24} height={24} />
          </TouchableOpacity>
        </View>
      )
    : undefined;
  return (
    <SwipeListView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      data={fleets}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => (
        <FleetItem handleOpenFleet={handleOpenFleet} item={item} />
      )}
      renderHiddenItem={renderHiddenItem}
      rightOpenValue={-70}
      disableRightSwipe
      stopRightSwipe={-70}
      ListEmptyComponent={
        <Text style={styles.noFleetsText}>No fleets found</Text>
      }
      refreshing={refreshing}
      onRefresh={handleRefresh}
      scrollEnabled={fleets.length > 0}
    />
  );
};

const styles = StyleSheet.create({
  container: {
    flexGrow: 0,
  },
  contentContainer: {
    paddingBottom: 20, 
  },
  noFleetsText: {
    textAlign: "center",
    fontSize: 16,
    color: "#aaaaaa",
    marginTop: 20,
  },
  fleetItemContainer: {
    alignItems: "center",
    backgroundColor: "#fafafa",
    flexDirection: "row",
    justifyContent: "flex-end",
    paddingLeft: 15,
  },
  deleteButton: {
    backgroundColor: "red",
    width: 70,
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
    position: "absolute",
    right: 0,
    top: 0,
    bottom: 0,
  },
});

export default FleetList;

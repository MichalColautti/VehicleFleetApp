import { StyleSheet, Text, View } from "react-native";
import MapView, { Callout, Marker, UrlTile } from "react-native-maps";


const FleetMap = ({ mapRef, location, members }) => {
  return (
    <MapView
      ref={mapRef}
      style={styles.map}
      initialRegion={{
        latitude: location ? location.coords.latitude : 52.237049,
        longitude: location ? location.coords.longitude : 21.017532,
        latitudeDelta: 0.0922,
        longitudeDelta: 0.0421,
      }}
      showsUserLocation={true}
    >
      <UrlTile
        urlTemplate="https://a.tile.openstreetmap.org/{z}/{x}/{y}.png"
        zIndex={-1}
      />

      {members.map((member) =>
        member.latitude != null && member.longitude != null ? (
          <Marker
            key={`${member.fleetId}-${member.id}`}
            coordinate={{
              latitude: member.latitude,
              longitude: member.longitude,
            }}
            title={member.email || "No email error"}
            pinColor="red"
          >
            <Callout>
              <View>
                <Text>{member.email || "No email"}</Text>
                <Text>
                  Speed: {member.speed ? (member.speed).toFixed(2) + " km/h" : "no record"}
                </Text>
                <Text>
                  Status: {member.status || "no record"}
                </Text>
              </View>
            </Callout>
          </Marker>
        ) : null
      )}
    </MapView>
  );
};

const styles = StyleSheet.create({
  map: {
    flex: 1,
  },
});

export default FleetMap;

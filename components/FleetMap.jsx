import { StyleSheet } from "react-native";
import MapView, { Marker, UrlTile } from "react-native-maps";

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
            description={member.status || ""}
            pinColor="red"
          />
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

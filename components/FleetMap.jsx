import { getUserEmailById } from "@/services/fleetService";
import { useEffect, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import MapView, { Callout, Marker, UrlTile } from "react-native-maps";

const FleetMap = ({ mapRef, location, members }) => {
  const [membersWithEmails, setMembersWithEmails] = useState([]);

  useEffect(() => {
    const fetchEmails = async () => {
      if (!members || members.length === 0) {
        setMembersWithEmails([]);
        return;
      }

      const membersEmails = await Promise.all(
        members.map(async (m) => {
          const email = await getUserEmailById(m.userId);
          return { ...m, email: email || "No email" };
        })
      );

      setMembersWithEmails(membersEmails);
    };

    fetchEmails();
  }, [members]);

  return (
    <MapView
      key={membersWithEmails.length}
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

      {membersWithEmails.map((member) =>
        member.latitude != null && member.longitude != null ? (
          <Marker
            key={member.membershipId}
            coordinate={{
              latitude: member.latitude,
              longitude: member.longitude,
            }}
            title={member.email || "No email error"}
            pinColor="red"
          >
            <Callout>
              <View style={styles.markerContainer}>
                <Text>{member.email || "No email"}</Text>
                <Text>
                  Speed:
                  {member.speed != null
                    ? member.speed.toFixed(2) + " km/h"
                    : "no record"}
                </Text>
                <Text>Status: {member.status || "no record"}</Text>
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
  markerContainer: {
    width: 120,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
});

export default FleetMap;

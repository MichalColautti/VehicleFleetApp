import FleetMap from "@/components/FleetMap";
import { listenToFleetMembersLocations } from "@/services/fleetService";
import * as Location from "expo-location";
import { StatusBar } from "expo-status-bar";
import { getAuth } from "firebase/auth";
import { useEffect, useRef, useState } from "react";
import { StyleSheet, View } from "react-native";

const MapScreen = () => {
  const [location, setLocation] = useState(null);
  const [members, setMembers] = useState([]);
  const mapRef = useRef(null);

  useEffect(() => {
    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== "granted") {
          console.log("Permission to access location was denied");
          return;
        }

        const currentLocation = await Location.getCurrentPositionAsync({});
        setLocation(currentLocation);

        if (mapRef.current) {
          mapRef.current.animateToRegion(
            {
              latitude: currentLocation.coords.latitude,
              longitude: currentLocation.coords.longitude,
              latitudeDelta: 0.0922,
              longitudeDelta: 0.0421,
            },
            500
          );
        }
      } catch (error) {
        console.error("Error getting location:", error);
      }
    })();
  }, []);

  useEffect(() => {
    const auth = getAuth();
    const user = auth.currentUser;
    if (!user) return;

    const unsubscribe = listenToFleetMembersLocations(user.uid, (fleetId, fleetMembers) => {
      setMembers((prevMembers) => {
        // Usuń poprzednich członków tej floty
        const others = prevMembers.filter((m) => m.fleetId !== fleetId);

        // Dodaj nowych członków z membershipId
        const updated = fleetMembers.map((m) => ({
          membershipId: m.membershipId || m.id || `${fleetId}-${m.userId}`,
          ...m,
          fleetId,
        }));

        return [...others, ...updated];
      });
    });

    return () => unsubscribe?.();
  }, []);

  return (
    <View style={styles.container}>
      <FleetMap mapRef={mapRef} location={location} members={members} />
      <StatusBar style="auto" />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

export default MapScreen;

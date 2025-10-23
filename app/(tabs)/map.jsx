import FleetMap from "@/components/FleetMap";
import * as Location from "expo-location";
import { StatusBar } from "expo-status-bar";
import { getAuth } from "firebase/auth";
import { useEffect, useRef, useState } from "react";
import { StyleSheet, View } from "react-native";

import {
  getFleetsForUserWithPermission
} from "@/services/fleetMembershipService";

const MapScreen = () => {
  const [location, setLocation] = useState(null);
  const [fleetIds, setFleetIds] = useState([]);

  const mapRef = useRef(null);
  const auth = getAuth();
  const user = auth.currentUser;

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
    const fetchFleetIds = async () => {
      const fleets = await getFleetsForUserWithPermission(user.uid, "view_drivers_position")
      setFleetIds(fleets.map((f) => f.id));
    }

    fetchFleetIds();
  }, [user]);

  return (
    <View style={styles.container}>
      <FleetMap mapRef={mapRef} location={location} fleetIds={fleetIds} />
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

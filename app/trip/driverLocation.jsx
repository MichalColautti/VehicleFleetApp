import { subscribeToActiveTripLocation } from "@/services/locationService";
import { getUserEmailById } from "@/services/userService";
import { useLocalSearchParams } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import MapView, { Marker } from "react-native-maps";

const DriverLocationScreen = () => {
  const { userId, fleetId } = useLocalSearchParams();
  const [location, setLocation] = useState(null);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const mapRef = useRef(null);

  useEffect(() => {
    if (!userId) {
      setError("Driver ID is missing."); 
      setIsLoading(false);
      return;
    }
    if (!fleetId) {
      setError("Fleet ID is missing."); 
      setIsLoading(false);
      return;
    }

    const unsubscribe = subscribeToActiveTripLocation(userId, fleetId, (newLocation) => {
      if (newLocation) {
        setLocation(newLocation);
        if (mapRef.current) {
          mapRef.current.animateToRegion(
            {
              latitude: newLocation.latitude,
              longitude: newLocation.longitude,
              latitudeDelta: 0.01,
              longitudeDelta: 0.01,
            },
            3000
          );
        }
      } else {
        setError("Driver doesn't have an active trip or location.");
      }
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [userId, fleetId]);

  if (isLoading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" />
        <Text>Loading map...</Text>
      </View>
    );
  }

  if (error && !location) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {location ? (
        <MapView
          ref={mapRef}
          style={styles.map}
          initialRegion={{
            latitude: location.latitude,
            longitude: location.longitude,
            latitudeDelta: 0.01,
            longitudeDelta: 0.01,
          }}
        >
          <Marker
            coordinate={{
              latitude: location.latitude,
              longitude: location.longitude,
            }}
            title={getUserEmailById(userId)}
            description={`Last update: ${new Date(
              location.timestamp?.toDate()
            ).toLocaleTimeString()}`}
          />
        </MapView>
      ) : (
        <Text>Waiting for driver location...</Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
  errorText: {
    color: "red",
    fontSize: 16,
  },
});

export default DriverLocationScreen;

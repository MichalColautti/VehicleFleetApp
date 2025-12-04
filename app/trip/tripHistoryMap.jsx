import { useLocalSearchParams } from "expo-router";
import { useMemo, useRef } from "react";
import { StyleSheet, Text, View } from "react-native";
import MapView, { Marker, Polyline } from "react-native-maps";

const fixPath = (points, epsilon) => {
  if (points.length < 3) return points;

  const fixed = [points[0]];
  for (let i = 1; i < points.length - 1; i++) {
    const prev = fixed[fixed.length - 1];
    const current = points[i];
    if (Math.abs(current.lat - prev.lat) > epsilon || Math.abs(current.lon - prev.lon) > epsilon) {
      fixed.push(current);
    }
  }
  fixed.push(points[points.length - 1]);
  return fixed;
};

const TripHistoryMapScreen = () => {
  const { tripData } = useLocalSearchParams();
  const mapRef = useRef(null);

  const trip = useMemo(() => {
    try {
      console.log("Parsing trip data:", tripData);
      return JSON.parse(tripData);
    } catch (e) {
      return null;
    }
  }, [tripData]);

  const coordinates = useMemo(() => {
    if (!trip || !trip.points || trip.points.length === 0) return [];
    const fixedPoints = fixPath(trip.points, 0.00005);
    return fixedPoints.map((p) => ({
      latitude: p.lat,
      longitude: p.lon,
    }));
  }, [trip]);

  if (coordinates.length === 0) {
    return (
      <View style={styles.container}>
        <Text>Cannot load trip data.</Text>
      </View>
    );
  }

  const startPoint = coordinates[0];
  const endPoint = coordinates[coordinates.length - 1];

  const onMapReady = () => {
    if (mapRef.current) {
      mapRef.current.fitToCoordinates(coordinates, {
        edgePadding: { top: 50, right: 50, bottom: 50, left: 50 },
        animated: true,
      });
    }
  };

  return (
    <MapView
      ref={mapRef}
      style={styles.map}
      onMapReady={onMapReady}
      initialRegion={{
        latitude: startPoint.latitude,
        longitude: startPoint.longitude,
        latitudeDelta: 0.0922,
        longitudeDelta: 0.0421,
      }}
    >
      <Polyline
        coordinates={coordinates}
        strokeColor="#007bff"
        strokeWidth={4}
      />

      <Marker key="start" coordinate={startPoint} title="Start" pinColor="green" />

      {!trip.active && (
        <Marker key="end" coordinate={endPoint} title="End" pinColor="red" />
      )}
    </MapView>
  );
};

const styles = StyleSheet.create({
  map: {
    flex: 1,
  },
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});

export default TripHistoryMapScreen;

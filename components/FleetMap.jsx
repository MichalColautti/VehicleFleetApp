import { useEffect, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import MapView, { Callout, Marker, UrlTile } from "react-native-maps";

import { getFleetById } from "@/services/fleetService";
import { getVehicleById } from "@/services/fleetVechicleService";
import { listenToActiveTrips } from "@/services/locationService";
import { getUserEmailById } from "@/services/userService";

const FleetMap = ({ mapRef, location, fleetIds }) => {
  const [activeTrips, setActiveTrips] = useState([]);
  const [drivers, setDrivers] = useState([]);

  useEffect(() => {
    if (!fleetIds || fleetIds.length === 0) return;

    let unsubscribers = [];
    fleetIds.forEach((fleetId) => {
      const unsub = listenToActiveTrips(fleetId, (fleetTrips) => {
        console.log("Active trips for fleet:", fleetId, fleetTrips);
        setActiveTrips((prev) => {
          const others = prev.filter((t) => t.fleetId !== fleetId);
          return [...others, ...fleetTrips];
        });
      });
      unsubscribers.push(unsub);
    });

    return () => unsubscribers.forEach((unsub) => unsub && unsub());
  }, [fleetIds]);

  useEffect(() => {
    const fetchTripDetails = async () => {
      const result = await Promise.all(
        activeTrips.map(async (trip) => {
          const email = await getUserEmailById(trip.userId);
          const vehicle = await getVehicleById(trip.vehicleId);
          const fleet = await getFleetById(trip.fleetId);
          const lastPoint = trip.points?.[trip.points.length - 1];
          return {
            ...trip,
            email,
            fleetName: fleet?.name || "Unknown Fleet",
            vehicleName: vehicle?.name || "Unknown Vehicle",
            registrationNumber: vehicle?.registrationNumber || "Unknown Registration",
            lastLat: lastPoint?.lat,
            lastLon: lastPoint?.lon,
            speed: lastPoint?.speed || 0,
          };
        })
      );

      setDrivers(result);
    };

    if (activeTrips.length > 0) fetchTripDetails();
  }, [activeTrips]);

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

      {drivers.map((driver) =>
        driver.lastLat != null && driver.lastLon != null ? (
          <Marker
            key={driver.tripId || `${driver.fleetId}-${driver.userId}`}
            coordinate={{
              latitude: driver.lastLat,
              longitude: driver.lastLon,
            }}
            title={driver.email || "No email error"}
            pinColor="red"
          >
            <Callout>
              <View style={styles.markerContainer}>
                <Text>{driver.email}</Text>
                <Text>Fleet: {driver.fleetName}</Text>
                <Text>
                  Vehicle: {driver.vehicleName} ({driver.registrationNumber})
                </Text>
                <Text>
                  Speed:{" "}
                  {driver.speed
                    ? driver.speed.toFixed(2) + " km/h"
                    : "no record"}
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
  markerContainer: {
    width: 170,
    borderRadius: 20,
    alignItems: "flex-start",
    justifyContent: "center",
  },
});

export default FleetMap;

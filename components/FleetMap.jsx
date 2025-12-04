import { useEffect, useRef, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import MapView, { Callout, Marker } from "react-native-maps";

import { getFleetById } from "@/services/fleetService";
import { getVehicleById } from "@/services/fleetVechicleService";
import { listenToActiveTrips } from "@/services/locationService";
import { getUserEmailById } from "@/services/userService";

const FleetMap = ({ mapRef, location, fleetIds }) => {
  const [activeTrips, setActiveTrips] = useState({}); 
  const [drivers, setDrivers] = useState([]);
  const driverDetailsCache = useRef({});

  useEffect(() => {
    if (!fleetIds || fleetIds.length === 0) return;

    let unsubscribers = [];
    fleetIds.forEach((fleetId) => {
      const unsub = listenToActiveTrips(fleetId, (fleetTrips) => {
        setActiveTrips((prevTrips) => ({
          ...prevTrips,
          ...Object.fromEntries(
            fleetTrips.map((trip) => [trip.tripId, trip])
          ),
        }));
      });
      unsubscribers.push(unsub);
    });

    return () => unsubscribers.forEach((unsub) => unsub && unsub());
  }, [fleetIds]);

  useEffect(() => {
    const fetchTripDetails = async () => {
      const tripsArray = Object.values(activeTrips);
      if (tripsArray.length === 0) {
        setDrivers([]);
        return;
      }

      const newDrivers = await Promise.all(
        tripsArray.map(async (trip) => {
          if (driverDetailsCache.current[trip.tripId]) {
            const lastPoint = trip.points?.[trip.points.length - 1];
            return {
              ...driverDetailsCache.current[trip.tripId],
              ...trip,
              lastLat: lastPoint?.lat,
              lastLon: lastPoint?.lon,
              speed: lastPoint?.speed || 0,
            };
          }

          const [email, vehicle, fleet] = await Promise.all([
            getUserEmailById(trip.userId),
            getVehicleById(trip.vehicleId),
            getFleetById(trip.fleetId),
          ]);

          const lastPoint = trip.points?.[trip.points.length - 1];
          const driverDetail = {
            ...trip,
            email,
            fleetName: fleet?.name || "Unknown Fleet",
            vehicleName: vehicle?.name || "Unknown Vehicle",
            registrationNumber:
              vehicle?.registrationNumber || "Unknown Registration",
            lastLat: lastPoint?.lat,
            lastLon: lastPoint?.lon,
            speed: lastPoint?.speed || 0,
          };
          driverDetailsCache.current[trip.tripId] = driverDetail;
          return driverDetail;
        })
      );
      setDrivers(newDrivers);
    };

    fetchTripDetails();
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
      {drivers.map((driver) => (
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
      ))}
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

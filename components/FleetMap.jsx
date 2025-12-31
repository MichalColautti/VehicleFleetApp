import * as Location from "expo-location";
import { useEffect, useRef, useState } from "react";
import { Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { WebView } from "react-native-webview";

import { getFleetById } from "@/services/fleetService";
import { getVehicleById } from "@/services/fleetVechicleService";
import { listenToActiveTrips } from "@/services/locationService";
import { getUserEmailById } from "@/services/userService";

const PIN_ICON_SOURCE = require("@/assets/images/pin.png");
const CLOSE_ICON_SOURCE = require("@/assets/images/close.png");

const PIN_WIDTH = 48;
const PIN_HEIGHT = 40;

const FleetMap = ({ mapRef, location, fleetIds }) => {
  const [activeTrips, setActiveTrips] = useState({});
  const [drivers, setDrivers] = useState([]);
  const [hasPermission, setHasPermission] = useState(false);
  const [selectedDriver, setSelectedDriver] = useState(null);
  
  const driverDetailsCache = useRef({});
  const webViewRef = useRef(null);

  const pinIconUri = Image.resolveAssetSource(PIN_ICON_SOURCE).uri;

  useEffect(() => {
    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status === "granted") setHasPermission(true);
      } catch (error) {
        console.warn(error);
      }
    })();
  }, []);

  useEffect(() => {
    if (!fleetIds || fleetIds.length === 0 || !hasPermission) return;
    let unsubscribers = [];
    fleetIds.forEach((fleetId) => {
      const unsub = listenToActiveTrips(fleetId, (fleetTrips) => {
        if (!fleetTrips) return;
        setActiveTrips((prevTrips) => ({
          ...prevTrips,
          ...Object.fromEntries(fleetTrips.map((trip) => [trip.tripId, trip])),
        }));
      });
      unsubscribers.push(unsub);
    });
    return () => unsubscribers.forEach((unsub) => unsub && unsub());
  }, [fleetIds, hasPermission]);

  useEffect(() => {
    const fetchTripDetails = async () => {
      try {
        const tripsArray = Object.values(activeTrips);
        if (tripsArray.length === 0) {
          setDrivers([]);
          return;
        }
        const newDrivers = await Promise.all(
          tripsArray.map(async (trip) => {
            if (driverDetailsCache.current[trip.tripId]) {
              const lastPoint = trip.points?.[trip.points.length - 1];
              const updatedDriver = {
                ...driverDetailsCache.current[trip.tripId],
                ...trip,
                lastLat: lastPoint?.lat,
                lastLon: lastPoint?.lon,
                speed: lastPoint?.speed || 0,
              };
              if (selectedDriver && selectedDriver.tripId === trip.tripId) {
                setSelectedDriver(updatedDriver);
              }
              return updatedDriver;
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
              registrationNumber: vehicle?.registrationNumber || "Unknown",
              lastLat: lastPoint?.lat,
              lastLon: lastPoint?.lon,
              speed: lastPoint?.speed || 0,
            };
            driverDetailsCache.current[trip.tripId] = driverDetail;
            return driverDetail;
          })
        );
        setDrivers(newDrivers);
      } catch (error) {
        console.error(error);
      }
    };
    fetchTripDetails();
  }, [activeTrips]);

  useEffect(() => {
    if (drivers.length > 0 && webViewRef.current) {
      const markersData = drivers
        .filter((d) => d.lastLat && d.lastLon)
        .map((d) => ({
          id: d.tripId || `${d.fleetId}-${d.userId}`,
          lat: d.lastLat,
          lng: d.lastLon,
        }));

      const script = `
        if (window.updateMarkers) {
          window.updateMarkers(${JSON.stringify(markersData)});
        }
      `;
      webViewRef.current.injectJavaScript(script);
    }
  }, [drivers]);

  const leafletHtml = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
      <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
      <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
      <style>
        body { margin: 0; padding: 0; }
        #map { height: 100vh; width: 100vw; }
      </style>
    </head>
    <body>
      <div id="map"></div>
      <script>
        var map = L.map('map', { zoomControl: false }).setView([${location?.coords.latitude || 52.237}, ${location?.coords.longitude || 21.017}], 13);
        
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '&copy; OpenStreetMap'
        }).addTo(map);

        var pinIcon = L.icon({
          iconUrl: '${pinIconUri}',
          iconSize: [${PIN_WIDTH}, ${PIN_HEIGHT}],
          iconAnchor: [${PIN_WIDTH / 2}, ${PIN_HEIGHT}], 
          popupAnchor: [0, -${PIN_HEIGHT}]
        });

        var markers = {};

        window.updateMarkers = function(data) {
          var currentIds = new Set();
          data.forEach(function(item) {
            currentIds.add(item.id);
            if (markers[item.id]) {
              var newLatLng = new L.LatLng(item.lat, item.lng);
              markers[item.id].setLatLng(newLatLng);
            } else {
              var m = L.marker([item.lat, item.lng], {icon: pinIcon}).addTo(map);
              m.on('click', function() {
                window.ReactNativeWebView.postMessage(JSON.stringify({
                  type: 'markerClick',
                  id: item.id
                }));
              });
              markers[item.id] = m;
            }
          });
          Object.keys(markers).forEach(function(id) {
            if (!currentIds.has(id)) {
              map.removeLayer(markers[id]);
              delete markers[id];
            }
          });
        }
      </script>
    </body>
    </html>
  `;

  const handleWebViewMessage = (event) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      if (data.type === 'markerClick') {
        const driver = drivers.find(d => (d.tripId || `${d.fleetId}-${d.userId}`) === data.id);
        if (driver) setSelectedDriver(driver);
      }
    } catch (e) {}
  };

  return (
    <View style={styles.container}>
      <WebView
        ref={webViewRef}
        originWhitelist={['*']}
        source={{ html: leafletHtml }}
        style={styles.map}
        onMessage={handleWebViewMessage}
        cacheEnabled={false}
      />
      {selectedDriver && (
        <View style={styles.infoCard}>
          <View style={styles.markerContainer}>
            <Text style={styles.infoTitle}>{selectedDriver.email}</Text>
            <Text>Fleet: {selectedDriver.fleetName}</Text>
            <Text>Vehicle: {selectedDriver.vehicleName} ({selectedDriver.registrationNumber})</Text>
            <Text>Speed: {selectedDriver.speed ? selectedDriver.speed.toFixed(2) + " km/h" : "0 km/h"}</Text>
          </View>
          <TouchableOpacity style={styles.closeButton} onPress={() => setSelectedDriver(null)}>
            <Image source={CLOSE_ICON_SOURCE} style={styles.closeIcon} />
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: "#fff" 
  },
  map: { 
    flex: 1,
  },
  infoCard: {
    position: "absolute", 
    bottom: 30, 
    left: 20, 
    right: 20,
    backgroundColor: "white", 
    borderRadius: 20, 
    padding: 15,
    paddingRight: 40, 
    flexDirection: "row", 
    justifyContent: "space-between", 
    alignItems: "center",
    shadowColor: "#000", 
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25, 
    shadowRadius: 3.84, 
    elevation: 5,
  },
  markerContainer: { 
    alignItems: "flex-start", 
    justifyContent: "center", 
    flex: 1 
  },
  infoTitle: { 
    fontWeight: "bold", 
    marginBottom: 5 
  },
  closeButton: { 
    position: "absolute",
    top: 10,
    right: 15,
    zIndex: 1,
  },
  closeIcon: {
    width: 30,
    height: 30,
    resizeMode: "contain",
  },
});

export default FleetMap;
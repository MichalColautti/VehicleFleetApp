import { Asset } from "expo-asset";
import * as FileSystem from "expo-file-system/legacy";
import * as Location from "expo-location";
import { useEffect, useRef, useState } from "react";
import { ActivityIndicator, Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { WebView } from "react-native-webview";

import { getFleetById } from "@/services/fleetService";
import { getVehicleById } from "@/services/fleetVechicleService";
import { listenToActiveTrips } from "@/services/locationService";
import { checkUserSubscriptionStatus } from "@/services/subscriptionService";
import { getUserEmailById } from "@/services/userService";
import { useRouter } from "expo-router";
import { getAuth } from "firebase/auth";

const PIN_ICON_SOURCE = require("../assets/images/pin.png");
const CLOSE_ICON_SOURCE = require("../assets/images/close.png");

const PIN_WIDTH = 48;
const PIN_HEIGHT = 40;

const FleetMap = ({ mapRef, location, fleetIds }) => {
  const router = useRouter();
  const auth = getAuth();

  const [activeTripsByFleet, setActiveTripsByFleet] = useState({});
  const [drivers, setDrivers] = useState([]);
  const [hasPermission, setHasPermission] = useState(false);
  const [selectedDriver, setSelectedDriver] = useState(null);

  const [subStatus, setSubStatus] = useState({ limit: 1, isExpired: false, isValid: true });
  const [isSubLoading, setIsSubLoading] = useState(true);
  
  const [pinBase64, setPinBase64] = useState(null);
  
  const driverDetailsCache = useRef({});
  const webViewRef = useRef(null);

  // Load and convert pin icon to base64
  useEffect(() => {
    (async () => {
      try {
        const asset = Asset.fromModule(PIN_ICON_SOURCE);
        await asset.downloadAsync(); 
        
        const base64 = await FileSystem.readAsStringAsync(asset.localUri, {
          encoding: "base64",
        });
        
        setPinBase64(`data:image/png;base64,${base64}`);
      } catch (e) {
        console.error("Error loading pin icon:", e);
      }
    })();
  }, []);

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
        setActiveTripsByFleet((prev) => ({
          ...prev,
          [fleetId]: fleetTrips || [] 
        }));
      });
      unsubscribers.push(unsub);
    });
    return () => unsubscribers.forEach((unsub) => unsub && unsub());
  }, [fleetIds, hasPermission]);

  useEffect(() => {
    const fetchTripDetails = async () => {
      try {
        const allTrips = Object.values(activeTripsByFleet).flat();

        if (allTrips.length === 0) {
          setDrivers([]);
          return;
        }

        const newDrivers = await Promise.all(
          allTrips.map(async (trip) => {
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
  }, [activeTripsByFleet]);

  useEffect(() => {
    if (webViewRef.current && pinBase64) {
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
  }, [drivers, pinBase64]);

  useEffect(() => {
    const checkSub = async () => {
      if (auth.currentUser) {
        const status = await checkUserSubscriptionStatus(auth.currentUser.uid);
        setSubStatus(status); 
      }
      setIsSubLoading(false);
    };
    checkSub();
  }, [drivers.length]);

  const totalDriversCount = drivers.length;
  //console.log(`Drivers: ${totalDriversCount}, Limit: ${subStatus.limit}, Is limit exceeded: ${totalDriversCount > subStatus.limit}`);
  const isLimitExceeded = totalDriversCount > subStatus.limit;

  useEffect(() => {
    if (isLimitExceeded) {
        if (webViewRef.current) {
            // Clear markers
            webViewRef.current.injectJavaScript(`if(window.updateMarkers) { window.updateMarkers([]); }`);
        }
        return;
    }

    if (webViewRef.current && pinBase64) {
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
  }, [drivers, pinBase64, isLimitExceeded]);

  if (!pinBase64) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#000" />
      </View>
    );
  }

  if (isLimitExceeded) {
    return (
        <View style={styles.container}>
            <View style={styles.lockOverlay}>
                <Text style={styles.lockTitle}>Too much drivers for current plan</Text>
                <Text style={styles.lockText}>
                   You have {totalDriversCount} active drivers, but your current plan limit is {subStatus.limit}.
                </Text>
                {subStatus.isExpired && (
                    <Text style={styles.lockReason}>
                        (Your subscription has expired and has been reverted to Basic)
                    </Text>
                )}
                <Text style={styles.lockInstruction}>
                    Please remove {totalDriversCount - subStatus.limit} drivers to see remaining drivers on map or renew your subscription to view the map.
                </Text>

                <TouchableOpacity 
                    style={styles.renewButton}
                    onPress={() => router.push("/profile")}
                >
                    <Text style={styles.renewButtonText}>Renew / Upgrade Plan</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
  }

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
        delete L.Icon.Default.prototype._getIconUrl;
        L.Icon.Default.mergeOptions({
          iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
          iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
          shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
        });

        var map = L.map('map', { zoomControl: false }).setView([52.237, 21.017], 13);

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '&copy; OpenStreetMap'
        }).addTo(map);

        var pinIcon = L.icon({
          iconUrl: '${pinBase64}',
          iconSize: [${PIN_WIDTH}, ${PIN_HEIGHT}],
          iconAnchor: [${PIN_WIDTH / 2}, ${PIN_HEIGHT}], 
          popupAnchor: [0, -${PIN_HEIGHT}]
        });

        var markers = {};
        var featureGroup = L.featureGroup().addTo(map);

        window.updateMarkers = function(data) {
          var currentIds = new Set();
          var boundsChanged = false;
          
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
              m.addTo(featureGroup);
              markers[item.id] = m;
              boundsChanged = true;
            }
          });

          Object.keys(markers).forEach(function(id) {
            if (!currentIds.has(id)) {
              map.removeLayer(markers[id]);
              delete markers[id];
            }
          });

          if (featureGroup.getLayers().length > 0) {
             map.fitBounds(featureGroup.getBounds(), { padding: [50, 50] });
          }
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
    backgroundColor: "#fff",
    justifyContent: 'center',
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
    padding: 20,
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
  lockOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#f8f9fa',
  },
  lockTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#dc3545',
    marginBottom: 10,
  },
  lockText: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 5,
    color: '#333',
  },
  lockReason: {
    fontSize: 14,
    textAlign: 'center',
    color: '#dc3545',
    marginBottom: 15,
    fontStyle: 'italic',
  },
  lockInstruction: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 30,
    fontWeight: '600',
  },
  renewButton: {
    backgroundColor: '#007bff',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  renewButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default FleetMap;
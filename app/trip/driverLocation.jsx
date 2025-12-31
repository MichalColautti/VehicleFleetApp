import { subscribeToActiveTripLocation } from "@/services/locationService";
import { getUserEmailById } from "@/services/userService";
import { Asset } from "expo-asset";
import * as FileSystem from "expo-file-system/legacy";
import { useLocalSearchParams } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { WebView } from "react-native-webview";

const PIN_ICON_SOURCE = require("@/assets/images/pin.png");

const PIN_WIDTH = 48;
const PIN_HEIGHT = 40;

const DriverLocationScreen = () => {
  const { userId, fleetId } = useLocalSearchParams();
  const [location, setLocation] = useState(null);
  const [driverEmail, setDriverEmail] = useState("");
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isMapReady, setIsMapReady] = useState(false);
  
  const [pinBase64, setPinBase64] = useState(null);
  
  const webViewRef = useRef(null);

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
    const fetchEmail = async () => {
      if (userId) {
        try {
          const email = await getUserEmailById(userId);
          setDriverEmail(email || "Unknown Driver");
        } catch (e) {
          console.log(e);
        }
      }
    };
    fetchEmail();
  }, [userId]);

  useEffect(() => {
    if (!userId || !fleetId) {
      setError("Driver ID is missing.");
      setIsLoading(false);
      return;
    }

    const unsubscribe = subscribeToActiveTripLocation(userId, fleetId, (newLocation) => {
      setIsLoading(false);
      if (newLocation) {
        setLocation(newLocation);
      }
    });

    return () => unsubscribe();
  }, [userId, fleetId]);

  useEffect(() => {
    if (location && isMapReady && webViewRef.current) {
      const timestamp = location.timestamp?.toDate 
        ? location.timestamp.toDate().toLocaleTimeString() 
        : new Date().toLocaleTimeString();

      const payload = {
        lat: location.latitude,
        lng: location.longitude,
        email: driverEmail,
        timestamp: timestamp
      };
      
      webViewRef.current.postMessage(JSON.stringify(payload));
    }
  }, [location, isMapReady, driverEmail]);

  if (!pinBase64) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" />
        <Text>Loading map assets...</Text>
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
        var map = L.map('map').setView([0, 0], 2);
        
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '&copy; OpenStreetMap contributors'
        }).addTo(map);

        var pinIcon = L.icon({
          iconUrl: '${pinBase64}',
          iconSize: [${PIN_WIDTH}, ${PIN_HEIGHT}],
          iconAnchor: [${PIN_WIDTH / 2}, ${PIN_HEIGHT}], 
          popupAnchor: [0, -${PIN_HEIGHT}]
        });

        var marker = null;
        var isFirstUpdate = true;

        document.addEventListener("message", function(event) {
          handleUpdate(event.data);
        });
        window.addEventListener("message", function(event) {
          handleUpdate(event.data);
        });

        function handleUpdate(dataString) {
          try {
            var data = JSON.parse(dataString);
            var lat = data.lat;
            var lng = data.lng;
            var popupContent = data.email + "<br>Update: " + data.timestamp;

            if (!marker) {
              marker = L.marker([lat, lng], {icon: pinIcon}).addTo(map);
              marker.bindPopup(popupContent).openPopup();
            } else {
              marker.setLatLng([lat, lng]);
              marker.setPopupContent(popupContent);
            }

            if (isFirstUpdate) {
              map.setView([lat, lng], 15);
              isFirstUpdate = false;
            } else {
              map.panTo([lat, lng]);
            }
          } catch(e) {}
        }
      </script>
    </body>
    </html>
  `;

  if (isLoading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" />
        <Text>Loading map...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <WebView
        ref={webViewRef}
        originWhitelist={['*']}
        source={{ html: leafletHtml }}
        style={styles.map}
        onLoadEnd={() => setIsMapReady(true)}
      />
      
      {!location && !error && (
        <View style={styles.overlay}>
          <Text style={styles.overlayText}>Loading</Text>
        </View>
      )}

      {error && (
         <View style={styles.overlay}>
          <Text style={{color: 'red'}}>{error}</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  map: {
    flex: 1,
  },
  overlay: {
    position: 'absolute',
    bottom: 50,
    alignSelf: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    padding: 8,
    borderRadius: 8,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  overlayText: {
    fontSize: 14
  }
});

export default DriverLocationScreen;
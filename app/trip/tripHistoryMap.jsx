import { useLocalSearchParams } from "expo-router";
import { useMemo } from "react";
import { StyleSheet, Text, View } from "react-native";
import { WebView } from "react-native-webview";

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

  const trip = useMemo(() => {
    try {
      return JSON.parse(tripData);
    } catch (e) {
      return null;
    }
  }, [tripData]);

  const coordinates = useMemo(() => {
    if (!trip || !trip.points || trip.points.length === 0) return [];
    const fixedPoints = fixPath(trip.points, 0.00005);
    return fixedPoints.map((p) => [p.lat, p.lon]);
  }, [trip]);

  if (coordinates.length === 0) {
    return (
      <View style={styles.container}>
        <Text>Cannot load trip data.</Text>
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
        var map = L.map('map');
        
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '&copy; OpenStreetMap contributors'
        }).addTo(map);

        var pathData = ${JSON.stringify(coordinates)};
        var isActive = ${trip.active ? 'true' : 'false'};

        if (pathData.length > 0) {
          var polyline = L.polyline(pathData, {
            color: '#007bff',
            weight: 4
          }).addTo(map);

          map.fitBounds(polyline.getBounds(), { padding: [50, 50] });

          L.circleMarker(pathData[0], {
            color: 'green',
            fillColor: 'green',
            fillOpacity: 1,
            radius: 8
          }).addTo(map).bindPopup("Start");

          if (!isActive) {
            L.circleMarker(pathData[pathData.length - 1], {
              color: 'red',
              fillColor: 'red',
              fillOpacity: 1,
              radius: 8
            }).addTo(map).bindPopup("End");
          }
        } else {
          map.setView([52.237049, 21.017532], 13);
        }
      </script>
    </body>
    </html>
  `;

  return (
    <View style={styles.mapContainer}>
      <WebView
        originWhitelist={['*']}
        source={{ html: leafletHtml }}
        style={styles.map}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  mapContainer: {
    flex: 1,
    backgroundColor: '#fff',
  },
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
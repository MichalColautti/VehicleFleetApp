import DashboardIcon from "@/assets/icons/dashboard.svg";
import FleetIcon from "@/assets/icons/fleet.svg";
import MapIcon from "@/assets/icons/map.svg";
import * as Location from "expo-location";
import { Tabs } from "expo-router";
import { getAuth } from "firebase/auth";
import { useEffect } from "react";
import { updateVechicleLocation } from "../../services/fleetService";

const MainLayout = () => {
  const auth = getAuth();
  const user = auth.currentUser;

  useEffect(() => {
    if (!user) return;

    let locationSubscription;

    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === "granted") {
        locationSubscription = await Location.watchPositionAsync(
          {
            accuracy: Location.Accuracy.High,
            timeInterval: 10000,  // refresh every 10 seconds
            distanceInterval: 10,  // refresh every 10 meters
          },
          (location) => {
            const { latitude, longitude, speed } = location.coords;
            console.log("Location update:", user.email, latitude, longitude, speed);
            updateVechicleLocation(user.uid, latitude, longitude, speed);
          }
        );
      }
    })();

    return () => {
      if (locationSubscription) locationSubscription.remove();
    };
  }, [user]);

  return (
    <Tabs
      screenOptions={{
        headerStyle: { backgroundColor: "#101820" },
        headerTintColor: "#fff",
        headerTitleStyle: {
          fontWeight: "bold",
          fontSize: 20,
        },
        headerTitleAlign: "center",
        tabBarActiveTintColor: "#007bff",
      }}
    >
      <Tabs.Screen
        name="map"
        options={{
          title: "Map",
          tabBarIcon: ({ focused }) => (
            <MapIcon
                width={24}
                height={24}
                fill={focused ? "#007bff" : "#999"}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="dashboard"
        options={{
          title: "Dashboard",
          tabBarIcon: ({ focused }) => (
            <DashboardIcon
                width={24}
                height={24}
                fill={focused ? "#007bff" : "#999"}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="fleetManagement"
        options={{
          title: "Fleet Management",
          tabBarIcon: ({ focused }) => (
            <FleetIcon
                width={24}
                height={24}
                fill={focused ? "#007bff" : "#999"}
            />
          ),
        }}
      />
    </Tabs>
  );
}

export default MainLayout;
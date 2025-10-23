import DashboardIcon from "@/assets/icons/dashboard.svg";
import FleetIcon from "@/assets/icons/fleet.svg";
import MapIcon from "@/assets/icons/map.svg";
import NotificationsButton from "@/components/NotificationsButton";
import { Tabs } from "expo-router";
import { getAuth } from "firebase/auth";
import { useEffect, useState } from "react";
import { StyleSheet } from "react-native";

import { getFleetsForUserWithPermission } from "@/services/fleetMembershipService";

const MainLayout = () => {
  const auth = getAuth();
  const user = auth.currentUser;
  const [fleetsWhereRecordPosition, setFleetsWhereRecordPosition] = useState(
    []
  );

  useEffect(() => {
    if (!user) return;

    (async () => {
      const fleets = await getFleetsForUserWithPermission(
        user.uid,
        "record_position"
      );
      //console.log("Fleets where user can record position:", fleets);
      setFleetsWhereRecordPosition(fleets.map((f) => f.id));
    })();
  }, [user]);

  useEffect(() => {
    if (!user || fleetsWhereRecordPosition.length === 0) return;

    let locationSubscription;

    const startLocationTracking = async () => {
      return;
    };

    startLocationTracking();

    return () => {
      if (locationSubscription) locationSubscription.remove();
    };
  }, [user, fleetsWhereRecordPosition]);

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
        headerRight: () => <NotificationsButton />,
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
};

const styles = StyleSheet.create({
  notificationsIcon: {
    marginRight: 15,
  },
});

export default MainLayout;

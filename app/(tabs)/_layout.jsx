import DashboardIcon from "@/assets/icons/dashboard.svg";
import FleetIcon from "@/assets/icons/fleet.svg";
import MapIcon from "@/assets/icons/map.svg";
import NotificationsButton from "@/components/NotificationsButton";
import { Tabs, useRouter } from "expo-router";
import { getAuth, signOut } from "firebase/auth";
import { useEffect } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

import usePushNotifications from "@/hooks/usePushNotifications";
import { saveExpoPushToken } from "@/services/userService";

const MainLayout = () => {
  const auth = getAuth();
  const user = auth.currentUser;
  const router = useRouter();
  const { expoPushToken } = usePushNotifications();

  const handleLogout = async () => {
    await signOut(auth);
    router.replace("/");
  };

  useEffect(() => {
    if (user && expoPushToken) {
      saveExpoPushToken(user.uid, expoPushToken);
    }
  }, [user, expoPushToken]);

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
        tabBarStyle: {
          borderTopWidth: 1,
          borderTopColor: "#F3F4F6",
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.05,
          shadowRadius: 4,
          paddingTop: 8,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: "500",
          marginBottom: 0,
        },
        headerRight: () => (
          <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
            <Text style={styles.logoutButtonText}>Logout</Text>
          </TouchableOpacity>
        ),
        headerLeft: () => (
          <View style={styles.headerLeftContainer}>
              <NotificationsButton />
          </View>
        ),
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
  headerLeftContainer: {
    marginLeft: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoutButton: {
    marginRight: 15,
    backgroundColor: '#303638',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
  },
  logoutButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "500",
  },
});

export default MainLayout;

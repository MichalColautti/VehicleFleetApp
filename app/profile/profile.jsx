import ProfileIcon from "@/assets/icons/profile.svg";
import { Stack, useRouter } from "expo-router";
import { getAuth, signOut } from "firebase/auth";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

const ProfileScreen = () => {
  const auth = getAuth();
  const user = auth.currentUser;
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await signOut(auth);
      router.replace("/");
    } catch (error) {
      console.error("Error signing out: ", error);
    }
  };

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          title: "Profile",
          headerStyle: { backgroundColor: "#101820" },
          headerTintColor: "#fff",
          headerTitleStyle: { fontWeight: "bold" },
        }}
      />
      <View style={styles.content}>
        <View style={styles.iconContainer}>
          <ProfileIcon width={100} height={100} color="#666" />
        </View>
        <Text style={styles.label}>Logged in as:</Text>
        <Text style={styles.email}>{user?.email}</Text>

        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.logoutButtonText}>Logout</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  content: {
    flex: 1,
    padding: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  iconContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    color: "#666",
    marginBottom: 10,
  },
  email: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 40,
  },
  logoutButton: {
    backgroundColor: "#ff4444",
    paddingVertical: 12,
    paddingHorizontal: 40,
    borderRadius: 8,
    width: "100%",
    alignItems: "center",
  },
  logoutButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
});

export default ProfileScreen;

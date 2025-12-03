import { AuthProvider } from "@/contexts/AuthContext";
import { Stack } from "expo-router";

const RootLayout = () => {
  return (
    <AuthProvider>
      <Stack 
        screenOptions={{
          headerStyle: {
            backgroundColor: '#101820',
          },
          headerTintColor: '#ffffff',
          headerTitleStyle: {
            fontWeight: 'bold',
            fontSize: 24,
          },
          headerTitleAlign: 'center',
          contentStyle: {
            backgroundColor: '#ffffff',
          }
        }}
      >;
        <Stack.Screen name="index" options={{ title: 'Home' }} />
        <Stack.Screen name='auth' options={{ headerTitle: 'Login'}}/>
        <Stack.Screen name='(tabs)' options={{ headerShown: false}}/>
        <Stack.Screen name="fleetDetails" options={{ headerTitle: 'Fleet Details', headerBackTitleVisible: false, headerBackTitle: "go back"}}/>
        <Stack.Screen name="trip" options={{ headerTitle: 'Trip History', headerBackTitleVisible: false, headerBackTitle: "go back"}}/>
      </Stack>
    </AuthProvider>
  )
};

export default RootLayout;
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
            paddingHorizontal: 10,
            paddingTop: 10,
            backgroundColor: '#ffffff',
          }
        }}
      >;
        <Stack.Screen name="index" options={{ title: 'Home' }} />
        <Stack.Screen name='auth' options={{ headerTitle: 'Login'}}/>
      </Stack>
    </AuthProvider>
  )
};

export default RootLayout;
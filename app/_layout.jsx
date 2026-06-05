import { AuthProvider } from "@/contexts/AuthContext";
import { StripeProvider } from "@stripe/stripe-react-native";
import { Stack } from "expo-router";

const RootLayout = () => {
  return (
    <AuthProvider>
      <StripeProvider
        publishableKey="pk_test_51SlAML1Nr1wJIzap1nIRTrbnL6YMwqIGCFaItavIiGpcdTaZuGC1YLuyAniA4sYR7hmwRC72xnCBPr8hlrGiqJrL00uKPjUGGG"
        merchantIdentifier="merchant.com.vehiclefleet.app" 
      >
        <Stack
          screenOptions={{
            headerStyle: {
              backgroundColor: "#101820",
            },
            headerTintColor: "#ffffff",
            headerTitleStyle: {
              fontWeight: "bold",
              fontSize: 24,
            },
            headerTitleAlign: "center",
            contentStyle: {
              backgroundColor: "#f4f6f9",
            },
            headerBackTitleVisible: true,
            headerBackTitle: "go back",
          }}
        >
          <Stack.Screen name="index" options={{ title: "Home" }} />
          <Stack.Screen name="auth" options={{ headerTitle: "Login" }} />
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen
            name="fleetDetails"
            options={{
              headerTitle: "Fleet Details",
              headerBackTitleVisible: false,
              headerBackTitle: "go back",
            }}
          />
          <Stack.Screen
            name="trip"
            options={{
              headerTitle: "Trip History",
              headerBackTitleVisible: false,
              headerBackTitle: "go back",
            }}
          />
        </Stack>
      </StripeProvider>
    </AuthProvider>
  );
};

export default RootLayout;

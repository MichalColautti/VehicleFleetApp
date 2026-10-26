import { Stack } from "expo-router";

const FleetsLayout = () => {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: "#101820" },
        headerTintColor: "#fff",
        headerTitleStyle: { fontWeight: "bold", fontSize: 20 },
        headerTitleAlign: "center",
        contentStyle: { backgroundColor: "#fff" },
      }}
    >
      <Stack.Screen name="[id]" options={{ headerShown: false}} />
    </Stack>
  );
};

export default FleetsLayout;

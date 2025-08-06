import { Stack } from "expo-router";

const RootLayout = () => {
  return <Stack 
    screenOptions={{
      headerStyle: {
        backgroundColor: '#101820',
      },
      headerTintColor: '#ffffff',
      headerTitleStyle: {
        fontWeight: 'bold',
        fontSize: 24,
      },
      contentStyle: {
        paddingHorizontal: 10,
        paddingTop: 10,
        backgroundColor: '#ffffff',
      }
    }}
  >;
    <Stack.Screen name="index" options={{ title: 'Home' }} />
  </Stack>
};

export default RootLayout;
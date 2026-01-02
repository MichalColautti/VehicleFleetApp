import ProfileIcon from "@/assets/icons/profile.svg";
import {
  getSubscriptionPlans,
  getUserSubscription,
  initializePayment,
  updateUserSubscription,
} from "@/services/subscriptionService";
import { useStripe } from "@stripe/stripe-react-native";
import { Stack, useRouter } from "expo-router";
import { getAuth, signOut } from "firebase/auth";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

const CLOSE_ICON = require("../../assets/images/close.png");

const ProfileScreen = () => {
  const auth = getAuth();
  const user = auth.currentUser;
  const router = useRouter();
  const { initPaymentSheet, presentPaymentSheet } = useStripe();

  const [plans, setPlans] = useState([]);
  const [loadingPlans, setLoadingPlans] = useState(true);

  const [modalVisible, setModalVisible] = useState(false);
  const [currentPlanId, setCurrentPlanId] = useState("basic");
  const [processing, setProcessing] = useState(false);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      router.replace("/");
    } catch (error) {
      console.error("Error signing out: ", error);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [fetchedPlans, userSubscription] = await Promise.all([
          getSubscriptionPlans(),
          getUserSubscription(user.uid),
        ]);
        setPlans(fetchedPlans);
        setCurrentPlanId(userSubscription);
      } catch (error) {
        Alert.alert("Error", "Failed to load subscription plans.");
      } finally {
        setLoadingPlans(false);
      }
    };

    fetchData();
  }, [user]);

  const currentPlan = plans.find((p) => p.id === currentPlanId) || plans[0];

  const handleUpgrade = async (plan) => {
    if (plan.id === currentPlanId) return;

    setProcessing(true);

    try {
      if (plan.amount === 0) {
        await updateUserSubscription(user.uid, plan.id);
        setCurrentPlanId(plan.id);
        setModalVisible(false);
        Alert.alert("Success", `Switched to ${plan.name} plan.`);
        setProcessing(false);
        return;
      }

      // Stripe Payment Flow
      const response = await initializePayment(plan.id);

      if (!response || !response.clientSecret) {
        console.error("Payment initialization failed:", response);
        Alert.alert("Error", "Error during initializing payment. ");
        setProcessing(false);
        return;
      }

      const { clientSecret, ephemeralKey, customer } = response;

      const { error: initError } = await initPaymentSheet({
        paymentIntentClientSecret: clientSecret,
        customerId: customer,
        customerEphemeralKeySecret: ephemeralKey,
        merchantDisplayName: "Vehicle Fleet App",
        returnURL: "vehiclefleetapp://stripe-redirect",
        defaultBillingDetails: {
          email: user?.email,
        },
      });

      if (initError) {
        Alert.alert("Error", initError.message);
        setProcessing(false);
        return;
      }

      const { error: paymentError } = await presentPaymentSheet();

      if (paymentError) {
        Alert.alert("Payment failed", paymentError.message);
      } else {
        await updateUserSubscription(user.uid, plan.id);

        setModalVisible(false);
        setCurrentPlanId(plan.id);
        Alert.alert("Success", `You are now subscribed to ${plan.name}!`);
      }
    } catch (error) {
      console.error(error);
      Alert.alert("Error", "Error during upgrading plan.");
    } finally {
      setProcessing(false);
    }
  };

  if (loadingPlans) {
    return (
      <View
        style={[
          styles.container,
          { justifyContent: "center", alignItems: "center" },
        ]}
      >
        <ActivityIndicator size="large" color="#007bff" />
      </View>
    );
  }

  if (!currentPlan) return null;

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

        <View
          style={[styles.currentPlanCard, { borderColor: currentPlan.color }]}
        >
          <View style={styles.planHeader}>
            <Text style={styles.planLabel}>Current Plan</Text>
            <View
              style={[styles.badge, { backgroundColor: currentPlan.color }]}
            >
              <Text style={styles.badgeText}>{currentPlan.name}</Text>
            </View>
          </View>

          <Text style={styles.planLimit}>{currentPlan.limitDescription}</Text>

          <TouchableOpacity
            style={[
              styles.upgradeButton,
              { backgroundColor: currentPlan.color },
            ]}
            onPress={() => setModalVisible(true)}
          >
            <Text style={styles.upgradeButtonText}>Change Plan</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.logoutButtonText}>Logout</Text>
        </TouchableOpacity>
      </View>

      {/* Subscription Plans Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Choose Subscription</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Image source={CLOSE_ICON} style={styles.closeIcon} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {plans.map((plan) => (
                <TouchableOpacity
                  key={plan.id}
                  style={[
                    styles.planOption,
                    currentPlanId === plan.id && styles.activePlanOption,
                  ]}
                  onPress={() => handleUpgrade(plan)}
                  disabled={processing || currentPlanId === plan.id}
                >
                  <View style={styles.optionHeader}>
                    <Text style={styles.optionName}>{plan.name}</Text>
                    <Text style={styles.optionPrice}>{plan.priceText}</Text>
                  </View>

                  <Text style={styles.optionLimit}>
                    {plan.limitDescription}
                  </Text>

                  {currentPlanId === plan.id && (
                    <Text style={styles.currentPlanLabel}>Current Plan</Text>
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>

            {processing && (
              <View style={styles.processingOverlay}>
                <ActivityIndicator size="large" color="#007bff" />
                <Text style={styles.processingText}>
                  Updating subscription...
                </Text>
              </View>
            )}
          </View>
        </View>
      </Modal>
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
    padding: 24,
    alignItems: "center",
  },
  iconContainer: {
    marginBottom: 20,
    marginTop: 20,
  },
  label: {
    fontSize: 14,
    color: "#666",
    marginBottom: 4,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  email: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 40,
    color: "#000",
  },
  currentPlanCard: {
    width: "100%",
    padding: 20,
    backgroundColor: "#f7f7f7ff",
    borderRadius: 16,
    borderWidth: 2,
    marginBottom: "auto",
  },
  planHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  planLabel: {
    fontSize: 16,
    color: "#aaa",
    fontWeight: "600",
  },
  badge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
  },
  badgeText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 12,
  },
  planLimit: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 20,
  },
  upgradeButton: {
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  upgradeButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  logoutButton: {
    backgroundColor: "red",
    paddingVertical: 12,
    borderRadius: 8,
    width: "100%",
    alignItems: "center",
    marginBottom: 50,
  },
  logoutButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    height: "85%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#000",
  },
  closeIcon: {
    width: 30,
    height: 30,
    resizeMode: "contain",
    marginTop: 2,
  },
  planOption: {
    borderWidth: 1,
    borderColor: "#aaa",
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    backgroundColor: "#fff",
  },
  activePlanOption: {
    borderColor: "green",
    backgroundColor: "#f0fff4",
  },
  optionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    marginBottom: 5,
  },
  optionName: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#222",
  },
  optionPrice: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#222",
  },
  period: {
    fontSize: 14,
    fontWeight: "normal",
    color: "#666",
  },
  optionLimit: {
    fontSize: 14,
    color: "#666",
    marginBottom: 10,
  },
  currentPlanLabel: {
    marginTop: 10,
    textAlign: "center",
    color: "#26cf4d",
    fontWeight: "bold",
    fontSize: 14,
  },
  processingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(255,255,255,0.9)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 10,
    borderRadius: 24,
  },
  processingText: {
    marginTop: 15,
    fontSize: 16,
    color: "#222",
    fontWeight: "600",
  },
});

export default ProfileScreen;

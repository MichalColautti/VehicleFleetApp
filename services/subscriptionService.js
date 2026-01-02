import { collection, doc, getDoc, getDocs, getFirestore, orderBy, query, setDoc } from "firebase/firestore";
import { getFunctions, httpsCallable } from "firebase/functions";

const db = getFirestore();
const functions = getFunctions();

export const getSubscriptionPlans = async () => {
  try {
    const plansRef = collection(db, "subscription_plans");
    const q = query(plansRef, orderBy("order", "asc")); 
    
    const querySnapshot = await getDocs(q);
    
    const plans = querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    return plans;
  } catch (error) {
    console.error("Error fetching subscription plans:", error);
    throw error;
  }
};

export const getUserSubscription = async (userId) => {
  try {
    const userRef = doc(db, "users", userId);
    const userSnap = await getDoc(userRef);

    if (userSnap.exists()) {
      const data = userSnap.data();
      return data.subscriptionPlan || "basic";
    }
    
    return "basic"; 
  } catch (error) {
    console.error("Error fetching user subscription:", error);
    return "basic"; 
  }
};

export const initializePayment = async (planId) => {
  try {
    const createPaymentIntent = httpsCallable(functions, 'initializePayment');
    const response = await createPaymentIntent({
      planId,
    });
    return response.data;
  } catch (error) {
    console.error("Error initializing payment:", error);
    throw error;
  }
};

export const updateUserSubscription = async (userId, planId) => {
  try {
    const userRef = doc(db, "users", userId);
    await setDoc(userRef, {
      subscriptionPlan: planId,
      subscriptionUpdatedAt: new Date()
    }, { merge: true });
  } catch (error) {
    console.error("Error updating user subscription:", error);
    throw error;
  }
};
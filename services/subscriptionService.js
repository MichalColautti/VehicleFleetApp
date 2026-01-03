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
      return {
        planId: data.subscriptionPlan || "basic",
        updatedAt: data.subscriptionUpdatedAt || null
      };
    }
    
    return { planId: "basic", updatedAt: null }; 
  } catch (error) {
    console.error("Error fetching user subscription:", error);
    return { planId: "basic", updatedAt: null }; 
  }
};

export const checkUserSubscriptionStatus = async (userId) => {
  try {
    const { planId, updatedAt } = await getUserSubscription(userId);
    
    const plans = await getSubscriptionPlans();
    const currentPlanDetails = plans.find(p => p.id === planId) || plans.find(p => p.id === 'basic');
    const basicPlanDetails = plans.find(p => p.id === 'basic');

    let isExpired = false;
    let daysLeft = 0;

    if (updatedAt) {
      const lastUpdate = updatedAt.toDate ? updatedAt.toDate() : new Date(updatedAt);
      const now = new Date();
      const diffTime = Math.abs(now - lastUpdate);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
      
      const validityPeriod = 30;
      daysLeft = validityPeriod - diffDays;

      if (daysLeft < 0) isExpired = true;
    } else {
      if (planId !== 'basic') isExpired = true;
    }

    if (planId === 'basic') {
        isExpired = false; 
        daysLeft = 30; 
    }

    const effectiveLimit = isExpired 
        ? (basicPlanDetails?.driverLimit || 3) 
        : (currentPlanDetails?.driverLimit || 3);

    return {
      isValid: !isExpired,
      isExpired,
      daysLeft,
      planId: isExpired ? 'basic' : planId,
      originalPlanId: planId,
      limit: effectiveLimit
    };

  } catch (error) {
    console.error("Error checking subscription status:", error);
    return { isValid: true, isExpired: false, limit: 3, planId: 'basic', daysLeft: 0 };
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
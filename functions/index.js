const functions = require("firebase-functions");
const admin = require("firebase-admin");

admin.initializeApp();
const paymentService = require("./payment");

exports.initializePayment = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError(
      "unauthenticated", 
      "You must be logged in to make a payment."
    );
  }

  const { planId } = data;
  const userEmail = context.auth.token.email;
  const userId = context.auth.uid;

  try {
    const result = await paymentService.createSubscriptionPayment(planId, userEmail, userId);
    return result;
    
  } catch (error) {
    throw new functions.https.HttpsError("internal", error.message);
  }
});
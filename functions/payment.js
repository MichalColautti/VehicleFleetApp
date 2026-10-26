const functions = require("firebase-functions");
const admin = require("firebase-admin");
const stripe = require("stripe")(functions.config().stripe.secret);

const db = admin.firestore();

exports.createSubscriptionPayment = async (planId, userEmail, userId) => {
  const planRef = db.collection("subscription_plans").doc(planId);
  const planSnap = await planRef.get();

  if (!planSnap.exists) {
    throw new Error("Invalid plan ID: Plan does not exist.");
  }

  const planData = planSnap.data();

  if (planData.amount === 0) {
    return { isFree: true };
  }

  try {
    const customers = await stripe.customers.list({ email: userEmail, limit: 1 });
    let customer = customers.data[0];

    if (!customer) {
      customer = await stripe.customers.create({
        email: userEmail,
        metadata: { firebaseUID: userId } 
      });
    }

    const ephemeralKey = await stripe.ephemeralKeys.create(
      { customer: customer.id },
      { apiVersion: '2022-11-15' }
    );

    const paymentIntent = await stripe.paymentIntents.create({
      amount: planData.amount,
      currency: planData.currency,
      customer: customer.id,
      automatic_payment_methods: { enabled: true },
      metadata: {
        planId: planId,
        userId: userId
      }
    });

    return {
      clientSecret: paymentIntent.client_secret,
      ephemeralKey: ephemeralKey.secret,
      customer: customer.id,
      isFree: false
    };

  } catch (error) {
    console.error("Stripe Error:", error);
    throw new Error(`Payment processing failed: ${error.message}`);
  }
};
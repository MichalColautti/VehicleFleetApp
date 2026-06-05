import { db } from "@/config/firebaseConfig";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  setDoc,
  where,
} from "firebase/firestore";

export const getUserIdByEmail = async (email) => {
  const usersQuery = query(
    collection(db, "users"),
    where("email", "==", email)
  );
  const usersSnap = await getDocs(usersQuery);

  if (usersSnap.empty) {
    return null;
  }

  return usersSnap.docs[0].id;
};

export const saveExpoPushToken = async (userId, token) => {
  try {
    await setDoc(doc(db, "users", userId), { expoPushToken: token }, { merge: true });
  } catch (error) {
    console.error("Error updating push token:", error);
  }
};

export const getUserEmailById = async (userId) => {
  const userRef = doc(db, "users", userId);
  const userSnap = await getDoc(userRef);

  if (userSnap.exists()) {
    return userSnap.data().email || null;
  }
  return null;
};

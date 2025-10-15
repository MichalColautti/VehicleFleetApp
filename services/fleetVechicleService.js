import { db } from "@/config/firebaseConfig";
import {
    addDoc,
    collection,
    doc,
    getDocs,
    query,
    updateDoc,
    where,
} from "firebase/firestore";

export const updateVechicleLocation = async (
  userId,
  fleetId,
  latitude,
  longitude,
  speed
) => {
  const membershipsSnap = await getDocs(
    query(
      collection(db, "fleet_memberships"),
      where("userId", "==", userId),
      where("fleetId", "==", fleetId),
      where("status", "==", "accepted")
    )
  );

  for (const membershipDoc of membershipsSnap.docs) {
    const membershipRef = doc(db, "fleet_memberships", membershipDoc.id);
    await updateDoc(membershipRef, {
      latitude,
      longitude,
      speed,
      updatedAt: new Date(),
    });

    await addDoc(collection(db, "fleet_location_history"), {
      fleetId,
      userId,
      latitude,
      longitude,
      speed,
      time: new Date(),
    });
  }
};

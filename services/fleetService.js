import { db } from "@/config/firebaseConfig";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  query,
  where,
} from "firebase/firestore";

export const createFleet = async (ownerId, fleetName) => {
  const fleetsRef = collection(db, "fleets");
  const newFleetRef = await addDoc(fleetsRef, {
    name: fleetName,
    ownerId,
  });
 
  const membershipsRef = collection(db, "fleet_memberships");
  await addDoc(membershipsRef, {
    fleetId: newFleetRef.id,
    userId: ownerId,
    roleId: "owner",
    status: "accepted",
  });

  return newFleetRef.id;
};

export const deleteFleet = async (fleetId) => {
  // Delete all members
  const membershipsSnap = await getDocs(
    query(collection(db, "fleet_memberships"), where("fleetId", "==", fleetId))
  );
  for (const docSnap of membershipsSnap.docs) {
    await deleteDoc(doc(db, "fleet_memberships", docSnap.id));
  }

  // Delete location history
  const locationSnap = await getDocs(
    query(
      collection(db, "fleet_location_history"),
      where("fleetId", "==", fleetId)
    )
  );
  for (const docSnap of locationSnap.docs) {
    await deleteDoc(doc(db, "fleet_location_history", docSnap.id));
  }

  // Delete the fleet
  await deleteDoc(doc(db, "fleets", fleetId));
};

export const getOwnedFleets = async (userId) => {
  const fleetsQuery = query(
    collection(db, "fleets"),
    where("ownerId", "==", userId)
  );
  const fleetsSnap = await getDocs(fleetsQuery);

  const fleets = [];
  for (const fleetDoc of fleetsSnap.docs) {
    fleets.push({ id: fleetDoc.id, ...fleetDoc.data() });
  }

  return fleets;
};

export const getUserFleets = async (userId) => {
  const membershipsQuery = query(
    collection(db, "fleet_memberships"),
    where("userId", "==", userId),
    where("status", "==", "accepted")
  );
  const membershipsSnap = await getDocs(membershipsQuery);

  const fleets = [];
  for (const membershipDoc of membershipsSnap.docs) {
    const { fleetId } = membershipDoc.data();
    const fleetRef = doc(db, "fleets", fleetId);
    const fleetSnap = await getDoc(fleetRef);

    if (fleetSnap.exists()) {
      fleets.push({
        id: fleetSnap.id,
        ...fleetSnap.data(),
        membershipId: membershipDoc.id,
      });
    }
  }

  return fleets;
};

export const getFleetById = async (fleetId) => {
  const fleetRef = doc(db, "fleets", fleetId);
  const fleetsSnap = await getDoc(fleetRef);
  return fleetsSnap.exists()
    ? { id: fleetsSnap.id, ...fleetsSnap.data() }
    : null;
};

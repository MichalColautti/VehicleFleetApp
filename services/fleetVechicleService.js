import { db } from "@/config/firebaseConfig";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
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

export const addVehicle = async (fleetId, name, registrationNumber) => {
  // console.log("fleetId:", fleetId);
  // console.log("name:", name);
  // console.log("registrationNumber:", registrationNumber);

  const vehiclesRef = collection(db, "vehicles");
  const newVehicle = await addDoc(vehiclesRef, {
    fleetId: fleetId,
    name: name,
    registrationNumber: registrationNumber,
  });
  return newVehicle.id;
};

export const getFleetVehicles = async (fleetId) => {
  const vehiclesSnap = await getDocs(
    query(collection(db, "vehicles"), where("fleetId", "==", fleetId))
  );

  return vehiclesSnap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
};

export const deleteVehicle = async (vehicleId) => {
  const vhicleRef = doc(db, "vehicles", vehicleId);
  await deleteDoc(vhicleRef);
};

export const getVehicleById = async (vehicleId) => {
  const vehicleRef = doc(db, "vehicles", vehicleId);
  const vehicleSnap = await getDoc(vehicleRef);
  return vehicleSnap.exists()
    ? { id: vehicleSnap.id, ...vehicleSnap.data() }
    : null;
};

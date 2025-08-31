import { db } from "@/config/firebaseConfig";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  query,
  setDoc,
  updateDoc,
  where,
} from "firebase/firestore";

export const createFleet = async (ownerId, fleetName) => {
  const fleetsRef = collection(db, "fleets");
  const newFleetRef = await addDoc(fleetsRef, {
    name: fleetName,
    ownerId,
  });
  return newFleetRef.id;
};

export const inviteUserToFleet = async (fleetId, invitedEmail, name) => {
  const membersCollectionRef = collection(db, "fleets", fleetId, "members");
  const invitedUserDocRef = doc(membersCollectionRef, invitedEmail);

  await setDoc(invitedUserDocRef, {
    name,
    email: invitedEmail,
    status: "pending",
  });
};

export const getUserFleetsWithMembers = async (ownerId) => {
  const fleetsQuery = query(
    collection(db, "fleets"),
    where("ownerId", "==", ownerId)
  );
  const snapshot = await getDocs(fleetsQuery);
  const fleets = [];

  for (const docSnap of snapshot.docs) {
    const fleet = { id: docSnap.id, ...docSnap.data(), members: [] };
    const membersSnap = await getDocs(
      collection(db, "fleets", docSnap.id, "members")
    );
    membersSnap.forEach((memberDoc) => {
      fleet.members.push({ id: memberDoc.id, ...memberDoc.data() });
    });
    fleets.push(fleet);
  }

  return fleets;
};

export const getPendingInvites = async (user) => {
  const fleets = await getDocs(collection(db, "fleets"));
  const pendingInvites = [];

  for (const fleetDoc of fleets.docs) {
    const membersSnap = await getDocs(
      collection(db, "fleets", fleetDoc.id, "members")
    );
    membersSnap.forEach((memberDoc) => {
      if (
        memberDoc.data().email === user.email &&
        memberDoc.data().status === "pending"
      ) {
        pendingInvites.push({
          fleetId: fleetDoc.id,
          fleetName: fleetDoc.data().name,
          member: memberDoc.data(),
        });
      }
    });
  }

  return pendingInvites;
};

export const acceptInvite = async (fleetId, user) => {
  const memberRef = doc(db, "fleets", fleetId, "members", user.email);

  await updateDoc(memberRef, {
    status: "accepted",
  });
 
  return true;
};

export const rejectInvite = async (fleetId, user) => {
  const memberRef = doc(db, "fleets", fleetId, "members", user.email);

  await deleteDoc(memberRef);

  return true;
};

export const updateVechicleLocation = async (email, latitude, longitude) => {
  if (!email) return;

  const fleetsSnapshot = await getDocs(collection(db, "fleets"));
  for (const fleetDoc of fleetsSnapshot.docs) {
    const memberRef = doc(db, "fleets", fleetDoc.id, "members", email);
    const memberSnap = await getDoc(memberRef);

    if (memberSnap.exists()) {
      await setDoc(memberRef, {
        latitude,
        longitude,
        updatedAt: new Date(),
      }, { merge: true });
    }
  }
};
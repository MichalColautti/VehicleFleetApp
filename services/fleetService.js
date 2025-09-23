import { db } from "@/config/firebaseConfig";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  query,
  updateDoc,
  where
} from "firebase/firestore";

export const getUserIdByEmail = async (email) => {
  const usersQuery = query(collection(db, "users"), where("email", "==", email));
  const usersSnap = await getDocs(usersQuery);

  if (usersSnap.empty) {
    return null;
  }

  return usersSnap.docs[0].id;
};

export const getUserEmailById = async (userId) => {
  const userRef = doc(db, "users", userId);
  const userSnap = await getDoc(userRef);

  if (userSnap.exists()) {
    return userSnap.data().email || null;
  }
  return null;
};

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
    query(collection(db, "fleet_location_history"), where("fleetId", "==", fleetId))
  );
  for (const docSnap of locationSnap.docs) {
    await deleteDoc(doc(db, "fleet_location_history", docSnap.id));
  }

  // Delete the fleet
  await deleteDoc(doc(db, "fleets", fleetId));
};

export const inviteUserToFleet = async (fleetId, userId, roleId) => {
  const membershipsRef = collection(db, "fleet_memberships");
  await addDoc(membershipsRef, {
    fleetId,
    userId,
    roleId,
    status: "pending",
  });
};

export const deleteFleetMember = async (membershipId) => {
  if (!membershipId) throw new Error("Membership ID is required");
  const membershipRef = doc(db, "fleet_memberships", membershipId);
  await deleteDoc(membershipRef);
};

export const getUserFleets = async (userId) => {
  const fleetsQuery = query(collection(db, "fleets"), where("ownerId", "==", userId));
  const fleetsSnap = await getDocs(fleetsQuery);

  const fleets = [];
  for (const fleetDoc of fleetsSnap.docs) {
    fleets.push({ id: fleetDoc.id, ...fleetDoc.data() });
  }

  return fleets;
};

export const getFleetMembers = async (fleetId) => {
  const membershipsSnap = await getDocs(
    query(
      collection(db, "fleet_memberships"),
      where("fleetId", "==", fleetId),
      where("status", "==", "accepted")
    )
  );

  const members = await Promise.all(
    membershipsSnap.docs.map(async (docSnap) => {
      const membership = { membershipId: docSnap.id, ...docSnap.data() };

      const userRef = doc(db, "users", membership.userId);
      const userSnap = await getDoc(userRef);

      return {
        ...membership,
        email: userSnap.exists() ? userSnap.data().email : null,
        name: userSnap.exists() ? userSnap.data().name || "Unnamed" : "Unknown user",
      };
    })
  );

  return members;
};

export const getFleetMembersIncludingPending = async (fleetId) => {
  const membershipsSnap = await getDocs(
    query(
      collection(db, "fleet_memberships"),
      where("fleetId", "==", fleetId),
    )
  );

  const members = await Promise.all(
    membershipsSnap.docs.map(async (docSnap) => {
      const membership = { membershipId: docSnap.id, ...docSnap.data() };

      const userRef = doc(db, "users", membership.userId);
      const userSnap = await getDoc(userRef);

      return {
        ...membership,
        email: userSnap.exists() ? userSnap.data().email : null,
        name: userSnap.exists() ? userSnap.data().name || "Unnamed" : "Unknown user",
      };
    })
  );

  return members;
};

export const getPendingInvites = async (userId) => {
  const membershipsSnap = await getDocs(
    query(
      collection(db, "fleet_memberships"),
      where("userId", "==", userId),
      where("status", "==", "pending")
    )
  );

  const invites = [];
  for (const membershipDoc of membershipsSnap.docs) {
    const fleetDoc = await getDoc(doc(db, "fleets", membershipDoc.data().fleetId));
    if (fleetDoc.exists()) {
      invites.push({
        membershipId: membershipDoc.id,
        fleetId: fleetDoc.id,
        fleetName: fleetDoc.data().name,
        roleId: membershipDoc.data().roleId,
      });
    }
  }

  return invites;
};

export const acceptInvite = async (membershipId) => {
  const membershipRef = doc(db, "fleet_memberships", membershipId);
  await updateDoc(membershipRef, { status: "accepted" });
};

export const rejectInvite = async (membershipId) => {
  const membershipRef = doc(db, "fleet_memberships", membershipId);
  await deleteDoc(membershipRef);
};

export const updateVechicleLocation = async (userId, latitude, longitude, speed) => {
  speed = speed * 3.6; // convert m/s to km/h
  
  const membershipsSnap = await getDocs(
    query(collection(db, "fleet_memberships"), where("userId", "==", userId), where("status", "==", "accepted"))
  );

  for (const membershipDoc of membershipsSnap.docs) {
    const { fleetId } = membershipDoc.data();

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

export const listenToFleetMembersLocations = (ownerId, callback) => {
 const fleetsQuery = query(collection(db, "fleets"), where("ownerId", "==", ownerId));

  const unsubscribes = [];

  getDocs(fleetsQuery).then((fleetsSnap) => {
    fleetsSnap.forEach((fleetDoc) => {
      const membershipsRef = query(
        collection(db, "fleet_memberships"),
        where("fleetId", "==", fleetDoc.id),
        where("status", "==", "accepted")
      );

      const unsubscribe = onSnapshot(membershipsRef, async (snapshot) => {
        const members = [];
        for (const docSnap of snapshot.docs) {
          const memberData = docSnap.data();
          members.push({ membershipId: docSnap.id, ...memberData });
        }
        callback(fleetDoc.id, members);
      });

      unsubscribes.push(unsubscribe);
    });
  });

  return () => unsubscribes.forEach((unsub) => unsub());
};

export const getMemberLocationHistory = async (fleetId, userId) => {
  const snapshot = await getDocs(
    query(collection(db, "fleet_location_history"), where("fleetId", "==", fleetId), where("userId", "==", userId))
  );

  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};
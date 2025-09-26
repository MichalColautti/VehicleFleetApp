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
  where,
} from "firebase/firestore";
import { getRoleById } from "./roleService";

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

export const getFleetsForUserWithPermission = async (userId, permission) => {
  const membershipsQuery = query(
    collection(db, "fleet_memberships"),
    where("userId", "==", userId),
    where("status", "==", "accepted")
  );
  const membershipsSnap = await getDocs(membershipsQuery);

  const fleets = [];
  for (const membershipDoc of membershipsSnap.docs) {
    const membership = membershipDoc.data();
    const fleetId = membership.fleetId;
    const role = await getRoleById(membership.roleId);

    if (role?.permissions?.includes(permission)) {
      const fleetRef = doc(db, "fleets", fleetId);
      const fleetSnap = await getDoc(fleetRef);
      if (fleetSnap.exists()) {
        fleets.push({
          id: fleetSnap.id,
          ...fleetSnap.data(),
          membershipId: membershipDoc.id,
          role: role ? { id: role.id, ...role } : null,
        });
      }
    }
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
        name: userSnap.exists()
          ? userSnap.data().name || "Unnamed"
          : "Unknown user",
      };
    })
  );

  return members;
};

export const getFleetMembersIncludingPending = async (fleetId) => {
  const membershipsSnap = await getDocs(
    query(collection(db, "fleet_memberships"), where("fleetId", "==", fleetId))
  );

  const members = await Promise.all(
    membershipsSnap.docs.map(async (docSnap) => {
      const membership = { membershipId: docSnap.id, ...docSnap.data() };

      const userRef = doc(db, "users", membership.userId);
      const userSnap = await getDoc(userRef);

      return {
        ...membership,
        email: userSnap.exists() ? userSnap.data().email : null,
        name: userSnap.exists()
          ? userSnap.data().name || "Unnamed"
          : "Unknown user",
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
    const fleetDoc = await getDoc(
      doc(db, "fleets", membershipDoc.data().fleetId)
    );
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

export const listenToFleetMembersLocations = (fleetId, callback) => {
  const membershipsQuery = query(
    collection(db, "fleet_memberships"),
    where("fleetId", "==", fleetId),
    where("status", "==", "accepted")
  );

  return onSnapshot(membershipsQuery, (snapshot) => {
    const members = snapshot.docs.map((docSnap) => ({
      membershipId: docSnap.id,
      fleetId,
      ...docSnap.data(),
    }));
    callback(fleetId, members);
  });
};

export const getMemberLocationHistory = async (fleetId, userId) => {
  const snapshot = await getDocs(
    query(
      collection(db, "fleet_location_history"),
      where("fleetId", "==", fleetId),
      where("userId", "==", userId)
    )
  );

  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
};

const defaultSpeeds = {
  motorway: 140,
  trunk: 120,
  primary: 90,
  secondary: 90,
  tertiary: 90,
  unclassified: 90,
  residential: 50,
  living_street: 20,
  service: 20,
  road: 50,
};

export const getSpeedLimit = async (lat, lon) => {
  const query = `
    [out:json];
    (
      way(around:20,${lat},${lon})["highway"];
    );
    out tags center;
  `;

  const url = `https://overpass.kumi.systems/api/interpreter`;

  try {
    const res = await fetch(url, { method: "POST", body: query });
    const data = await res.json();

    if (data.elements && data.elements.length > 0) {
      const firstRoad = data.elements[0];
      if (firstRoad.tags?.maxspeed) return firstRoad.tags.maxspeed;

      const highwayType = firstRoad.tags.highway;
      return defaultSpeeds[highwayType] || undefined;
    }

    return undefined;
  } catch (err) {
    console.error("Overpass error:", err);
    return undefined;
  }
};

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

import { getRoleById } from "./roleService";

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

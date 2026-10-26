import { db } from "@/config/firebaseConfig";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  updateDoc,
  where,
} from "firebase/firestore";

export const getRoles = async () => {
  const rolesRef = collection(db, "roles");
  const rolesSnap = await getDocs(rolesRef);
  const roles = rolesSnap.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  }));
  return roles;
};

export const getRolePermissions = async (roleId) => {
  const roleRef = doc(db, "roles", roleId);
  const roleSnap = await getDoc(roleRef);

  if (roleSnap.exists()) {
    return roleSnap.data().permissions || [];
  }
  return [];
};

export const hasPermissions = async (userId, fleetId, permission) => {
  const membershipsQuery = query(
    collection(db, "fleet_memberships"),
    where("userId", "==", userId),
    where("fleetId", "==", fleetId),
    where("status", "==", "accepted")
  );
  const membershipsSnap = await getDocs(membershipsQuery);

  if (membershipsSnap.empty) return false;

  const membership = membershipsSnap.docs[0].data();
  const role = await getRoleById(membership.roleId);

  return role?.permissions?.includes(permission);
};

export const getRoleById = async (roleId) => {
  const roleRef = doc(db, "roles", roleId);
  const roleSnap = await getDoc(roleRef);

  if (roleSnap.exists()) {
    return { id: roleSnap.id, ...roleSnap.data() };
  } else {
    return null;
  }
};

export const updateFleetMemberRole = async (membershipId, newRoleId) => {
  const membershipRef = doc(db, "fleet_memberships", membershipId);
  await updateDoc(membershipRef, { roleId: newRoleId });
};

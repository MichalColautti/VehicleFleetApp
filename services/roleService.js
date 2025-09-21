import { db } from "@/config/firebaseConfig";
import { collection, doc, getDoc, getDocs } from "firebase/firestore";

export const getRoles = async () => {
  const rolesRef = collection(db, "roles");
  const rolesSnap = await getDocs(rolesRef);
  const roles = rolesSnap.docs.map(doc => ({ 
    id: doc.id, 
    ...doc.data() 
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

export const hasPermission = async (roleId, permission) => {
  const permissions = await getRolePermissions(roleId);
  return permissions.includes(permission);
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
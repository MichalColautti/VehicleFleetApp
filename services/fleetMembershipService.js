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
import { getFleetById } from "./fleetService";
import { getRoleById } from "./roleService";

export const inviteUserToFleet = async (fleetId, userId, roleId) => {
  const notificationsRef = collection(db, "notifications");
  const fleet = await getFleetById(fleetId);
  const role = await getRoleById(roleId);
  const fleetName = fleet?.name || fleetId;
  const roleName = role?.name || roleId;

  await addDoc(notificationsRef, {
    type: "invite",
    userId,
    fleetId,
    roleId,
    timestamp: new Date(),
    message: `You have been invited to fleet "${fleetName}" as "${roleName}"`,
  });

  const userRef = doc(db, "users", userId);
  const userSnap = await getDoc(userRef);
  if (userSnap.exists()) {
    const token = userSnap.data().expoPushToken;
    if (token) {
      await sendPushNotification(
        token,
        "Fleet Invitation",
        `You have been invited to fleet "${fleetName}"`,
        { url: "/notifications" }
      );
    }
  }
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
  const memberIds = membershipsSnap.docs.map(
    (docSnap) => docSnap.data().userId
  );

  const members = await Promise.all(
    membershipsSnap.docs.map(async (docSnap) => {
      const membership = { membershipId: docSnap.id, ...docSnap.data() };

      const userRef = doc(db, "users", membership.userId);
      const userSnap = await getDoc(userRef);

      return {
        ...membership,
        status: membership.status,
        email: userSnap.exists() ? userSnap.data().email : null,
      };
    })
  );
  const notificationsSnap = await getDocs(
    query(
      collection(db, "notifications"),
      where("fleetId", "==", fleetId),
      where("type", "==", "invite")
    )
  );

  const invited = await Promise.all(
    notificationsSnap.docs
      .filter((docSnap) => !memberIds.includes(docSnap.data().userId))
      .map(async (docSnap) => {
        const notification = docSnap.data();
        const userRef = doc(db, "users", notification.userId);
        const userSnap = await getDoc(userRef);
        return {
          notificationId: docSnap.id,
          userId: notification.userId,
          status: "pending",
          email: userSnap.exists() ? userSnap.data().email : null,
        };
      })
  );

  return [...members, ...invited];
};

export const getPendingInvites = async (userId) => {
  const notificationsSnap = await getDocs(
    query(
      collection(db, "notifications"),
      where("userId", "==", userId),
      where("type", "==", "invite")
    )
  );

  const invites = [];
  for (const notificationDoc of notificationsSnap.docs) {
    const fleetDoc = await getDoc(
      doc(db, "fleets", notificationDoc.data().fleetId)
    );
    const notificationData = notificationDoc.data();
    if (fleetDoc.exists()) {
      invites.push({
        notificationId: notificationDoc.id,
        fleetId: fleetDoc.id,
        fleetName: fleetDoc.data().name,
        roleId: notificationDoc.data().roleId,
        message: notificationData.message,
        timestamp: notificationData.timestamp.toDate(),
      });
    }
  }

  return invites;
};

export const acceptInvite = async (notificationId, userId, fleetId, roleId) => {
  await addDoc(collection(db, "fleet_memberships"), {
    fleetId,
    userId,
    roleId,
    status: "accepted",
  });
  await deleteDoc(doc(db, "notifications", notificationId));
};

export const rejectInvite = async (notificationId) => {
  const notificationRef = doc(db, "notifications", notificationId);
  await deleteDoc(notificationRef);
};

export const notifySpeeding = async (fleetId, driverName, speed, limit) => {
  const fleet = await getFleetById(fleetId);
  const fleetName = fleet?.name || "Fleet";
  const members = await getFleetMembers(fleetId);

  for (const member of members) {
    const role = await getRoleById(member.roleId);
    if (role?.permissions?.includes("get_notified_speeding")) {
      const userRef = doc(db, "users", member.userId);
      const userSnap = await getDoc(userRef);
      if (userSnap.exists()) {
        const token = userSnap.data().expoPushToken;
        if (token) {
          await sendPushNotification(
            token,
            "Speed Alert",
            `Driver ${driverName} exceeded speed limit (${speed} km/h, limit: ${limit} km/h) in ${fleetName}`,
            { url: `/fleetDetails/${fleetId}` }
          );
        }
      }
    }
  }
};

async function sendPushNotification(expoPushToken, title, body, data = {}) {
  const message = {
    to: expoPushToken,
    sound: "default",
    title: title,
    body: body,
    data: data,
  };

  await fetch("https://exp.host/--/api/v2/push/send", {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Accept-encoding": "gzip, deflate",
      "Content-Type": "application/json",
    },
    body: JSON.stringify(message),
  });
}

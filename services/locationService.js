import { db } from "@/config/firebaseConfig";
import {
    collection,
    getDocs,
    onSnapshot,
    query,
    where,
} from "firebase/firestore";

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

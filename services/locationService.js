import { db } from "@/config/firebaseConfig";
import {
  addDoc,
  arrayUnion,
  collection,
  doc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  updateDoc,
  where,
} from "firebase/firestore";

export const listenToActiveTrips = (fleetId, callback) => {
  const tripQuery = query(
    collection(db, "trips"),
    where("fleetId", "==", fleetId),
    where("active", "==", true)
  );

  return onSnapshot(tripQuery, (snapshot) => {
    const activeTrips = snapshot.docs.map((docSnap) => ({
      tripId: docSnap.id,
      ...docSnap.data(),
    }));
    callback(activeTrips);
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

export const startTrip = async (
  userId,
  fleetId,
  vehicleId,
  latitude,
  longitude
) => {
  const tripsRef = collection(db, "trips");
  const newTrip = await addDoc(tripsRef, {
    userId,
    fleetId,
    vehicleId,
    startTime: new Date(),
    endTime: null,
    active: true,
    points: [
      {
        lat: latitude,
        lon: longitude,
        time: new Date(),
      },
    ],
  });
  return newTrip.id;
};

export const updateTripLocation = async (
  tripId,
  latitude,
  longitude,
  speed
) => {
  const tripRef = doc(db, "trips", tripId);
  await updateDoc(tripRef, {
    points: arrayUnion({
      lat: latitude,
      lon: longitude,
      speed,
      time: new Date(),
    }),
  });
};

export const endTrip = async (tripId, latitude, longitude) => {
  const tripRef = doc(db, "trips", tripId);
  await updateDoc(tripRef, {
    endTime: new Date(),
    active: false,
    lastPosition: { lat: latitude, lon: longitude },
  });
};

export const getTripsForUser = async (userId, fleetId) => {
  const tripQuery = query(
    collection(db, "trips"),
    where("userId", "==", userId),
    where("fleetId", "==", fleetId),
    orderBy("startTime", "desc")
  );

  const snapshot = await getDocs(tripQuery);
  return snapshot.docs.map((docSnap) => ({
    tripId: docSnap.id,
    ...docSnap.data(),
  }));
};

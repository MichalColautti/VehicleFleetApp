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
  serverTimestamp,
  updateDoc,
  where
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

export const subscribeToActiveTripLocation = (userId, fleetId, callback) => {
  const tripQuery = query(
    collection(db, "trips"),
    where("userId", "==", userId),
    where("fleetId", "==", fleetId),
    where("active", "==", true)
  );

  return onSnapshot(tripQuery, (snapshot) => {
    if (snapshot.empty) {
      callback(null);
      return;
    }

    const tripDoc = snapshot.docs[0];
    const tripRef = doc(db, "trips", tripDoc.id);

    return onSnapshot(tripRef, (docSnap) => {
      callback(docSnap.exists() ? docSnap.data().lastPosition : null);
    });
  });
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
    lastPosition: {
      latitude,
      longitude,
      timestamp: serverTimestamp(),
    },
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
  userId,
  speed
) => {
  if (tripId) {
    try {
      const tripRef = doc(db, "trips", tripId);
      await updateDoc(tripRef, {
        lastPosition: { latitude, longitude, timestamp: serverTimestamp() },
        points: arrayUnion({
          lat: latitude, lon: longitude, speed, time: new Date(),
        }),
      });
    } catch (error) {
      console.error(`Error updating trip history for trip ${tripId}:`, error);
    }
  }
};

export const endTrip = async (tripId, latitude, longitude) => {
  const tripRef = doc(db, "trips", tripId);
  await updateDoc(tripRef, {
    endTime: new Date(),
    active: false,
    lastPosition: { latitude, longitude, timestamp: serverTimestamp() },
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

export const getActiveTripForUser = async (userId, fleetId = null) => {
  const tripQuery = query(
    collection(db, "trips"),
    where("userId", "==", userId),
    ...(fleetId ? [where("fleetId", "==", fleetId)] : []),
    where("active", "==", true)
  );

  const snapshot = await getDocs(tripQuery);
  if (snapshot.empty) {
    return null;
  }

  const tripDoc = snapshot.docs[0];
  return { tripId: tripDoc.id, ...tripDoc.data() };
};

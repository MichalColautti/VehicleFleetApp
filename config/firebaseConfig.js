// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

import { getAuth } from "firebase/auth";

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyAzOmpA1ADHNH_n0ax3XNKhknmW5jpFQYs",
  authDomain: "vehiclefleet-9dbea.firebaseapp.com",
  projectId: "vehiclefleet-9dbea",
  storageBucket: "vehiclefleet-9dbea.firebasestorage.app",
  messagingSenderId: "409674983633",
  appId: "1:409674983633:web:0d6a60ad985f475b3bfdf0",
  measurementId: "G-5V7FWRGC5P"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

export const auth = getAuth(app)
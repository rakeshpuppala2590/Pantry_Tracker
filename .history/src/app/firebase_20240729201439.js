// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries
import { getFirestore } from "firebase/firestore";
// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyDkjQORGqryp8r3Ejt1kZkfFnxv3tLY5uA",
  authDomain: "pantry-b514e.firebaseapp.com",
  projectId: "pantry-b514e",
  storageBucket: "pantry-b514e.appspot.com",
  messagingSenderId: "599915364527",
  appId: "1:599915364527:web:3eae745d644ec52b83945a",
  measurementId: "G-GXZQ4N21RZ",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const db = getFirestore(app);

// Initialize Analytics if supported

if (typeof window !== "undefined") {
  isSupported().then((supported) => {
    if (supported) {
      analytics = getAnalytics(app);
    }
  });
}

export { db, analytics };

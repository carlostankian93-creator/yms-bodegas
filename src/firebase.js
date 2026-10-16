import { initializeApp } from "firebase/app";
import { getDatabase, ref, onValue, set } from "firebase/database";

const firebaseConfig = {
  apiKey: "AIzaSyAuyiZPAuEl02J1XNXDmKEccfrgieNwHEY",
  authDomain: "yms-mobile-location-center.firebaseapp.com",
  databaseURL: "https://yms-mobile-location-center-default-rtdb.firebaseio.com",
  projectId: "yms-mobile-location-center",
  storageBucket: "yms-mobile-location-center.firebasestorage.app",
  messagingSenderId: "726582145968",
  appId: "1:726582145968:web:787fe3d5a5366426b71c75"
};

const app = initializeApp(firebaseConfig);

export const db = getDatabase(app);
export { ref, onValue, set };

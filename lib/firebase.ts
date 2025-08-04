// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getStorage } from "@firebase/storage";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAoVgUM7qNDkJECfxCYVuFeChnWOI0qr9s",
  authDomain: "univault2.firebaseapp.com",
  projectId: "univault2",
  storageBucket: "univault2.firebasestorage.app",
  messagingSenderId: "275729894917",
  appId: "1:275729894917:web:e461e549d74da2edf4d66c",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const storage = getStorage(app);

import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore"; // 👈 Firestore 추가

const firebaseConfig = {
  apiKey: "AIzaSyDX5-BsPovT1tB0Un5ADwyOVYDKBvVALV4",
  authDomain: "muchuunoharu-b352b.firebaseapp.com",
  projectId: "muchuunoharu-b352b",
  storageBucket: "muchuunoharu-b352b.firebasestorage.app",
  messagingSenderId: "946711173731",
  appId: "1:946711173731:web:2039c7d68bab1653c6b656",
  measurementId: "G-SQ656C5LSW"
};

// Firebase 초기화
const app = initializeApp(firebaseConfig);

// App.jsx 등 다른 파일에서 가져다 쓸 수 있도록 Firestore DB 내보내기
export const db = getFirestore(app);

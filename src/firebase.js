// Firebase 초기화
// 아래 값들은 Firebase 콘솔 > 프로젝트 설정 > 내 앱(웹 앱) 에서 복사한 firebaseConfig를 그대로 넣거나,
// 환경변수(.env, Netlify 환경변수)로 관리하세요.
//
// Vite 프로젝트라면 .env 파일에 아래처럼 작성 (변수명 앞에 반드시 VITE_ 접두어 필요):
//   VITE_FIREBASE_API_KEY=...
//   VITE_FIREBASE_AUTH_DOMAIN=...
//   VITE_FIREBASE_PROJECT_ID=...
//   VITE_FIREBASE_STORAGE_BUCKET=...
//   VITE_FIREBASE_MESSAGING_SENDER_ID=...
//   VITE_FIREBASE_APP_ID=...
//
// Create React App(CRA) 프로젝트라면 접두어를 REACT_APP_ 로 바꾸고
// import.meta.env.VITE_... 대신 process.env.REACT_APP_... 을 사용하세요.

import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);

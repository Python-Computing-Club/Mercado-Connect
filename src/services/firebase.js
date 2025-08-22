// Importando funções do Firebase
import { initializeApp } from "firebase/app";

// Configurações do Firebase
const firebaseConfig = {
  apiKey: proccess.env.REACT_APP_FIREBASE_API_KEY,
  authDomain: proccess.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
  projectId: proccess.env.REACT_APP_FIREBASE_PROJECT_ID,
  storageBucket: proccess.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: proccess.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
  appId: proccess.env.REACT_APP_FIREBASE_APP_ID
};

// Iniciando o Firebase
const app = initializeApp(firebaseConfig);

// Exportando serviços que utilizamos
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth, GithubAuthProvider, OAuthProvider } from "firebase/auth";

// Configuration pour le projet GitHub
const githubFirebaseConfig = {
  apiKey: import.meta.env.VITE_GITHUB_FIREBASE_API_KEY,
  authDomain: "github-login-283f9.firebaseapp.com",
  projectId: "github-login-283f9",
  storageBucket: "github-login-283f9.firebasestorage.app",
  messagingSenderId: "916448422141",
  appId: "1:916448422141:web:5a685f451f0d5a8387b694"
};

// Configuration pour le projet Microsoft
const microsoftFirebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: "fir-a12fa.firebaseapp.com",
  projectId: "fir-a12fa",
  storageBucket: "fir-a12fa.firebasestorage.app",
  messagingSenderId: "274923726642",
  appId: "1:274923726642:web:1d96651f34f5a67f6a192b"
};

// Initialiser Firebase pour GitHub uniquement s'il n'existe pas
const githubApp = getApps().find(app => app.name === "GitHubApp") 
  || initializeApp(githubFirebaseConfig, "GitHubApp");

// Initialiser Firebase pour Microsoft uniquement s'il n'existe pas
const microsoftApp = getApps().find(app => app.name === "MicrosoftApp") 
  || initializeApp(microsoftFirebaseConfig, "MicrosoftApp");

// Authentification pour chaque projet
const githubAuth = getAuth(githubApp);
const microsoftAuth = getAuth(microsoftApp);

// Providers pour chaque service
const githubProvider = new GithubAuthProvider();
const microsoftProvider = new OAuthProvider("microsoft.com");

export { githubAuth, githubProvider, microsoftAuth, microsoftProvider };

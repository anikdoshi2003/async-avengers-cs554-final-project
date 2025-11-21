"use client";

import { createContext, useContext, useEffect, useState } from "react";
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  signInWithPopup,
  GoogleAuthProvider,
  sendPasswordResetEmail,
  confirmPasswordReset,
} from "firebase/auth";
import { auth } from "@/firebase/config";

const AuthContext = createContext(undefined);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const login = async (email, password) => {
    await signInWithEmailAndPassword(auth, email, password);
  };

  const signup = async (email, password) => {
    await createUserWithEmailAndPassword(auth, email, password);
  };

  const logout = async () => {
    await signOut(auth);
  };

  const signInWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    await signInWithPopup(auth, provider);
  };

  const resetPassword = async (email) => {
    // Configure where users should be redirected after resetting password
    const actionCodeSettings = {
      url: typeof window !== 'undefined' 
        ? `${window.location.origin}/reset-password`
        : 'http://localhost:3000/reset-password',
      handleCodeInApp: true, // Set to true to handle in our custom page
    };
    await sendPasswordResetEmail(auth, email, actionCodeSettings);
  };

  const confirmPasswordResetWithCode = async (oobCode, newPassword) => {
    await confirmPasswordReset(auth, oobCode, newPassword);
  };

  const value = {
    user,
    loading,
    login,
    signup,
    logout,
    signInWithGoogle,
    resetPassword,
    confirmPasswordResetWithCode,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}


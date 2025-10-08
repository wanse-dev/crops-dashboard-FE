import { onAuthStateChanged } from "firebase/auth";
import React, { useContext, useEffect, useState } from "react";
import { auth } from "../../firebase/firebase";

import type { UserData } from "../../types/UserData";
import type { AuthData } from "../../types/AuthData";

const AuthContext = React.createContext<AuthData | null>(null);

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }: any) => {
  const [currentUser, setCurrentUser] = useState<UserData | null>(null);
  const [userLoggedIn, setUserLoggedIn] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, initializeUser);
    return unsubscribe;
  }, []);

  const initializeUser = async (user: any) => {
    if (user) {
      setCurrentUser(user);
      setUserLoggedIn(true);
    } else {
      setCurrentUser(null);
      setUserLoggedIn(false);
    }
    setLoading(false);
  };

  const value = {
    currentUser,
    userLoggedIn,
    loading,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
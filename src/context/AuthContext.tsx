import React, { createContext, useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import type { IContextType, IUser, IUserDoc } from "../types";
import { getCurrentUser } from "../lib/appwrite/api";

export const INITIAL_USER: IUser = {
  id: "",
  name: "",
  username: "",
  email: "",
  imageUrl: "",
  bio: "",
};

const INITIAL_STATE: IContextType = {
  user: INITIAL_USER,
  isLoading: true,
  isAuthenticated: false,
  setUser: () => {},
  setIsAuthenticated: () => {},
  checkAuthUser: async () => false,
};

const AuthContext = createContext<IContextType>(INITIAL_STATE);

const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<IUser>(INITIAL_USER);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const navigate = useNavigate();

  const checkAuthUser = async () => {
    try {
      const currentAccount = await getCurrentUser();

      if (currentAccount) {
        const userDoc = currentAccount as IUserDoc; 

        setUser({
          id: userDoc.$id,
          name: userDoc.name ?? "",
          username: userDoc.username ?? "",
          email: userDoc.email ?? "",
          imageUrl: userDoc.imageUrl ?? "",
          bio: userDoc.bio ?? "",
        });

        setIsAuthenticated(true);
        return true;
      }

      setIsAuthenticated(false);
      return false;
    } catch (error) {
      console.log("Auth check failed:", error);
      setIsAuthenticated(false);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    checkAuthUser();
  }, []);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      navigate("/sign-in");
    }
  }, [isLoading, isAuthenticated, navigate]);

  const value: IContextType = {
    user,
    setUser,
    isLoading,
    isAuthenticated,
    setIsAuthenticated,
    checkAuthUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useUserContext = () => useContext(AuthContext);

export default AuthProvider;

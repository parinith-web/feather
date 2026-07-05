import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { auth } from "./firebase";
import { onAuthStateChanged } from "firebase/auth";
import { syncUser } from "./api/auth";
import { getMe } from "./api/user";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null); // Firebase user object
  const [profile, setProfile] = useState(null); // Backend Mongo user doc (plan, usage, historyCount...)
  const [loading, setLoading] = useState(true);
  const [profileLoading, setProfileLoading] = useState(false);

  // Re-fetches the backend profile (usage, plan, historyCount) without
  // touching Firebase auth state. Call this after a background-removal run,
  // a Paddle checkout, or on any screen that needs fresh numbers.
  const refreshProfile = useCallback(async () => {
    if (!auth.currentUser) return null;
    try {
      setProfileLoading(true);
      const freshProfile = await getMe();
      setProfile(freshProfile);
      return freshProfile;
    } catch (err) {
      console.error("Failed to refresh profile:", err);
      return null;
    } finally {
      setProfileLoading(false);
    }
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);

      if (currentUser) {
        try {
          // Creates the Mongo user record on first login, refreshes cached
          // profile fields on subsequent logins.
          const backendProfile = await syncUser();
          setProfile(backendProfile);
        } catch (err) {
          console.error("Failed to sync user with backend:", err);
          setProfile(null);
        }
      } else {
        setProfile(null);
      }

      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return (
    <AuthContext.Provider
      value={{ user, profile, loading, profileLoading, refreshProfile, setProfile }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);

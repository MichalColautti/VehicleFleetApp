import { auth, db } from "@/config/firebaseConfig";
import { createUserWithEmailAndPassword, onAuthStateChanged, signInWithEmailAndPassword, signOut } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { createContext, useContext, useEffect, useState } from "react";


const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, user => {
      console.log("Got user:", user);
      setUser(user || null);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const login = async (email,password) => {
    try {
      await signInWithEmailAndPassword(auth, email, password);
      return { success: true };
    } catch (error) {
      return {error: error.message};
    }
  }

  const register = async (email, password) => {
    try {
      await createUserWithEmailAndPassword(auth,email,password)

      const user = auth.currentUser;
    if (!user) throw new Error("User not found after registration");

    await setDoc(doc(db, "users", user.uid), {
      email: email,
    });

      return login(email, password);
    } catch (error) {
      return {error: error.message}
    }
  }

  const logout = async () => {
    try {
      await signOut(auth);
      setUser(null);
      return { success: true };
    } catch (error) {
      return {error: error.message};
    }
  }

  return (
    <AuthContext.Provider value={{ user, loading, register, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);

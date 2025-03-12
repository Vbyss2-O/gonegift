import React, { createContext, useContext, useEffect, useState } from 'react';
import { auth, db } from '../Auth/FirebaseConfig'; // Firebase configuration file
import { doc, getDoc } from 'firebase/firestore'; // Firestore methods

const AuthContext = createContext(null); // Provide a more accurate default context value

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true); // Loading state for initialization

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (user) {
        try {
          // Reference to the user's Firestore document
          const userDocRef = doc(db, 'users', user.uid);
          const userDoc = await getDoc(userDocRef);

          if (userDoc.exists()) {
            setCurrentUser({
              uid: user.uid,
              email: user.email,
              ...userDoc.data(), // Combine Firestore data with Firebase auth data
            });
          } else {
            console.warn('User document not found in Firestore.');
            setCurrentUser({
              uid: user.uid,
              email: user.email, // Default fallback if Firestore document is missing
            });
          }
        } catch (error) {
          console.error('Error fetching user data from Firestore:', error);
          setCurrentUser(null); // Clear user on error
        }
      } else {
        setCurrentUser(null); // Clear user if unauthenticated
      }
      setLoading(false); // End loading state
    });

    return () => unsubscribe(); // Cleanup subscription on component unmount
  }, []);

  if (loading) {
    return <div>Loading...</div>; // Display loading state during initialization
  }

  return (
    <AuthContext.Provider value={{ currentUser }}>
      {children}
    </AuthContext.Provider>
  );
};

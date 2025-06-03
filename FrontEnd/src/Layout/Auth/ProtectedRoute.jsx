// src/components/ProtectedRoute.jsx
import React, { useEffect, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { supabase } from "../Death/supabaseClient";

const ProtectedRoute = ({ children, redirectTo = "/login" }) => {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [userExists, setUserExists] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const checkSessionAndUser = async () => {
      try {
        setLoading(true);
        
        // Get current session
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          console.error("ProtectedRoute session error:", sessionError.message);
          setSession(null);
          setUserExists(false);
          setLoading(false);
          return;
        }

        if (!session) {
          console.log("No session found in ProtectedRoute");
          setSession(null);
          setUserExists(false);
          setLoading(false);
          return;
        }

        console.log("ProtectedRoute - Session found for user:", session.user.id);
        setSession(session);

        // Check if user exists in death_user table
        const { data: existingUser, error: fetchError } = await supabase
          .from("death_user")
          .select("*")
          .eq("user_idx", session.user.id)
          .single();

        if (fetchError && fetchError.code !== "PGRST116") {
          console.error("ProtectedRoute - Error fetching user:", fetchError);
          setUserExists(false);
          setLoading(false);
          return;
        }

        if (!existingUser) {
          console.log("ProtectedRoute - User not found in database");
          setUserExists(false);
          // Sign out the user since they don't exist in our database
          await supabase.auth.signOut();
          navigate("/login");
        } else {
          console.log("ProtectedRoute - User found in database:", existingUser.email);
          setUserExists(true);
        }

      } catch (error) {
        console.error("ProtectedRoute - Unexpected error:", error.message);
        setSession(null);
        setUserExists(false);
      } finally {
        setLoading(false);
      }
    };

    checkSessionAndUser();

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log("ProtectedRoute - Auth event:", event, "Session exists:", !!session);
      
      if (event === "SIGNED_IN" && session) {
        setSession(session);
        await checkSessionAndUser();
      } else if (event === "SIGNED_OUT") {
        setSession(null);
        setUserExists(false);
        setLoading(false);
        navigate(redirectTo);
      } else if (event === "TOKEN_REFRESHED" && session) {
        setSession(session);
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate, redirectTo]);

  // Show loading state
  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        fontSize: '18px',
        flexDirection: 'column'
      }}>
        <div>Loading...</div>
        <div style={{ fontSize: '14px', marginTop: '10px', color: '#666' }}>
          Checking authentication...
        </div>
      </div>
    );
  }

  // Redirect if no session or user doesn't exist in database
  if (!session || !userExists) {
    console.log("ProtectedRoute - Redirecting to login. Session:", !!session, "UserExists:", userExists);
    return <Navigate to={redirectTo} replace />;
  }

  // Render protected content
  return children;
};

export default ProtectedRoute;
import React, { useEffect, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { supabase } from "../Death/supabaseClient";

const ProtectedRoute = ({ children, redirectTo = "/login" }) => {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const checkSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error || !session) {
          console.error("ProtectedRoute session error:", error?.message);
          setSession(null);
        } else {
          setSession(session);
          const { data: existingUser, error: fetchError } = await supabase
            .from("death_user")
            .select("user_role") // Adjust if other fields needed
            .eq("user_idx", session.user.id) // Changed from user_id_x to user_idx
            .single();

          if (fetchError && fetchError.code !== "PGRST116") {
            console.error("Error fetching user data:", fetchError);
          }

          if (!existingUser) {
            navigate("/login");
          }
        }
      } catch (error) {
        console.error("Unexpected error in checkSession:", error.message);
        setSession(null);
      } finally {
        setLoading(false);
      }
    };

    checkSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log("ProtectedRoute auth event:", event, "Session:", session);
      setSession(session);
      if (event === "SIGNED_IN" && session) {
        checkSession();
      } else if (event === "SIGNED_OUT") {
        navigate(redirectTo);
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate, redirectTo]);

  if (loading) return <div>Loading...</div>;

  return session ? children : <Navigate to={redirectTo} replace />;
};

export default ProtectedRoute;
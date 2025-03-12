import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../Death/supabaseClient";
import axios from "axios";
import { v4 as uuidv4 } from "uuid";

const GoogleLoginPage = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const handleAuth = async () => {
      const { data: { user }, error } = await supabase.auth.getUser();
      if (error || !user) {
        console.log("No user logged in yet");
        return;
      }

      const { data: existingUser, error: fetchError } = await supabase
        .from("death_user")
        .select("user_role")
        .eq("user_idx", user.id)
        .single();

      if (fetchError && fetchError.code !== "PGRST116") {
        console.error("Error checking user:", fetchError);
        return;
      }

      if (existingUser) {
        navigate("/death-dashboard");
      } else {
        navigate("/primaryinfo");
      }
    };

    handleAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_IN" && session) {
        handleAuth();
      } else if (event === "SIGNED_OUT") {
        navigate("/login");
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const handleGoogleLogin = async () => {
    try {
      await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/primaryinfo`,
          scopes: "email profile",
        },
      });
    } catch (error) {
      console.error("Google login error:", error.message);
    }
  };

  return (
    <div style={styles.pageContainer}>
      <div style={styles.formContainer}>
        <div style={styles.card}>
          <h1 style={styles.heading}>Login to GoneGift</h1>
          <p style={styles.subHeading}>Begin your adventure with a quick Google login:</p>
          <button
            style={styles.button}
            onClick={handleGoogleLogin}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#357ABD")}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "#4285F4")}
          >
            Login with Google
          </button>
        </div>
      </div>
    </div>
  );
};

const styles = {
  pageContainer: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    minHeight: "100vh",
    background: "linear-gradient(135deg, #f4f7fc 0%, #e9ecef 100%)",
  },
  formContainer: {
    flex: 1,
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    padding: "20px",
  },
  card: {
    backgroundColor: "#ffffff",
    borderRadius: "15px",
    padding: "40px",
    boxShadow: "0 8px 16px rgba(0, 0, 0, 0.1)",
    maxWidth: "450px",
    width: "100%",
  },
  heading: {
    fontSize: "34px",
    fontWeight: "700",
    color: "#2c3e50",
    marginBottom: "15px",
  },
  subHeading: {
    fontSize: "18px",
    color: "#7f8c8d",
    marginBottom: "30px",
  },
  button: {
    padding: "14px 35px",
    fontSize: "16px",
    fontWeight: "500",
    color: "#fff",
    backgroundColor: "#4285F4",
    border: "none",
    borderRadius: "8px",
    cursor: "pointer",
    width: "100%",
  },
};

export default GoogleLoginPage;
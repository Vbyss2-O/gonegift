import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../Death/supabaseClient";

const GoogleLoginPage = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [loggingIn, setLoggingIn] = useState(false);

  // Handle post-login email check and navigation
  const handlePostLogin = async () => {
    try {
      setLoggingIn(true); // Keep UI in loading state during checks
      // Check if user is authenticated in Supabase
      const { data: { user }, error: userError } = await supabase.auth.getUser();

      if (userError || !user) {
        console.error("No user authenticated or error:", userError?.message);
        navigate("/login");
        return;
      }

      // Check if email exists in death_user table
      const { data: existingUser, error: fetchError } = await supabase
        .from("death_user")
        .select("user_role")
        .eq("email", user.email)
        .maybeSingle();

      if (fetchError) {
        console.error("Error checking death_user:", fetchError.message);
        navigate("/login");
        return;
      }

      if (existingUser) {
        console.log("Existing user found in death_user, redirecting to /death-dashboard");
        navigate("/death-dashboard");
        return;
      }

      // New user: upsert into death_user and redirect to /primaryinfo
      const { error: upsertError } = await supabase
        .from("death_user")
        .upsert(
          {
            user_idx: user.id,
            email: user.email,
            user_role: "general",
          },
          { onConflict: "email" }
        );

      if (upsertError) {
        console.error("Error upserting user:", upsertError.message);
        navigate("/login");
        return;
      }

      console.log("New user added, redirecting to /primaryinfo");
      navigate("/primaryinfo");
    } catch (err) {
      console.error("Error in post-login flow:", err.message);
      navigate("/login");
    } finally {
      setLoggingIn(false);
      setLoading(false);
    }
  };

  useEffect(() => {
    // Initial session check on page load
    const checkSession = async () => {
      try {
        const { data: { user }, error: userError } = await supabase.auth.getUser();

        if (userError || !user) {
          console.log("No user logged in");
          setLoading(false);
          return;
        }

        // Authenticated user found, run post-login logic
        await handlePostLogin();
      } catch (err) {
        console.error("Error checking session:", err.message);
        setLoading(false);
        navigate("/login");
      }
    };

    checkSession();

    // Listen for auth state changes (e.g., OAuth callback or sign-out)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_IN" && session) {
        console.log("User signed in, running post-login logic");
        handlePostLogin();
      } else if (event === "SIGNED_OUT") {
        console.log("User signed out, redirecting to /login");
        setLoading(false);
        navigate("/login");
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const handleGoogleLogin = async () => {
    setLoggingIn(true);
    try {
      await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/login`,
          scopes: "email profile",
        },
      });
      // Post-login logic is handled in useEffect via onAuthStateChange
    } catch (error) {
      console.error("Google login error:", error.message);
      setLoggingIn(false);
    }
  };

  return (
    <div style={styles.pageContainer}>
      <div style={styles.formContainer}>
        <div style={styles.card}>
          {loading || loggingIn ? (
            <div style={styles.spinnerContainer}>
              <div className="spinner"></div>
              <p style={styles.loadingText}>
                {loggingIn ? "Logging in..." : "Checking session..."}
              </p>
            </div>
          ) : (
            <>
              <h1 style={styles.heading}>Login to GoneGift</h1>
              <p style={styles.subHeading}>Begin your adventure with a quick Google login:</p>
              <button
                style={styles.button}
                onClick={handleGoogleLogin}
                disabled={loggingIn}
              >
                {loggingIn ? (
                  <div className="spinner-button"></div>
                ) : (
                  "Login with Google"
                )}
              </button>
            </>
          )}
        </div>
      </div>

      {/* Spinner Styles */}
      <style>
        {`
          .spinner {
            width: 50px;
            height: 50px;
            border: 5px solid rgba(0, 0, 0, 0.1);
            border-top: 5px solid #3498db;
            border-radius: 50%;
            animation: spin 1s linear infinite;
          }

          .spinner-button {
            width: 20px;
            height: 20px;
            border: 3px solid rgba(255, 255, 255, 0.3);
            border-top: 3px solid #fff;
            border-radius: 50%;
            animation: spin 1s linear infinite;
          }

          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}
      </style>
    </div>
  );
};

// Styles
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
    textAlign: "center",
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
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    gap: "10px",
  },
  spinnerContainer: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
  },
  loadingText: {
    marginTop: "10px",
    fontSize: "16px",
    color: "#3498db",
  },
};

export default GoogleLoginPage;
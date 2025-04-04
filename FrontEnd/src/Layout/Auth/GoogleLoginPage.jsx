import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../Death/supabaseClient";

const GoogleLoginPage = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [loggingIn, setLoggingIn] = useState(false);

  useEffect(() => {
    const handleAuth = async () => {
      try {
        const { data: { user }, error: userError } = await supabase.auth.getUser();

        if (userError || !user) {
          console.log("No user logged in yet");
          setLoading(false);
          return;
        }

        const { data: existingUser, error: fetchError } = await supabase
          .from("death_user")
          .select("user_role")
          .eq("email", user.email)
          .maybeSingle();

        if (fetchError) {
          console.error("Error checking user:", fetchError.message);
          setLoading(false);
          return;
        }

        if (!existingUser) {
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
            setLoading(false);
            return;
          }

          console.log("New user added successfully");
          navigate("/primaryinfo");
        } else {
          navigate("/death-dashboard");
        }
      } catch (err) {
        console.error("Error in auth flow:", err.message);
      } finally {
        setLoading(false);
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
    setLoggingIn(true);
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
    } finally {
      setLoggingIn(false);
    }
  };

  return (
    <div style={styles.pageContainer}>
      <div style={styles.formContainer}>
        <div style={styles.card}>
          {loading ? (
            <div style={styles.spinnerContainer}>
              <div className="spinner"></div>
              <p style={styles.loadingText}>Checking session...</p>
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

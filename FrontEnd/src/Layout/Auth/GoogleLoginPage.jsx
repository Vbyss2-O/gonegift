import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../Death/supabaseClient";
import "./GoogleLoginPage.css"; // Import your CSS styles
import { Link } from "react-router-dom";

const GoogleLoginPage = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [loggingIn, setLoggingIn] = useState(false);

  // Handle post-login email check and navigation
  const handlePostLogin = async () => {
    try {
      setLoggingIn(true); // keep UI in loading state during checks
      // Check if user is authenticated in Supabase
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        console.error("No user authenticated or error:", userError?.message);
        navigate("/login");
        return;
      }

      // check for fucking details got filled or not
      const { data: existingUser, error: fetchError } = await supabase
        .from("death_user")
        .select("user_role, first_name")
        .eq("email", user.email)
        .maybeSingle();

      if (fetchError) {
        console.error("Error checking death_user:", fetchError.message);
        navigate("/login");
        return;
      }

      if (existingUser) {
        // if user exists but has not filled primary info, redirect to /primaryinfo
        if (!existingUser.first_name || existingUser.first_name.trim() === "") {
          console.log(
            "User found but primary info not filled, redirecting to /primaryinfo"
          );
          navigate("/primaryinfo");
          return;
        }
        // user exists and has filled primary info, go to dashboard
        console.log(
          "Existing user found in death_user, redirecting to /death-dashboard"
        );
        navigate("/death-dashboard");
        return;
      }

      // New user: upsert into death_user and redirect to /primaryinfo
      const { error: upsertError } = await supabase.from("death_user").upsert(
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
        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser();

        if (userError || !user) {
          console.log("No user logged in");
          setLoading(false);
          return;
        }

        // authenticated user found, run post-login logic
        await handlePostLogin();
      } catch (err) {
        console.error("Error checking session:", err.message);
        setLoading(false);
        navigate("/login");
      }
    };

    checkSession();

    // listen for auth state changes (e.g., OAuth callback or sign-out)
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
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
      // post-login logic is handled in useEffect via onAuthStateChange
    } catch (error) {
      console.error("Google login error:", error.message);
      setLoggingIn(false);
    }
  };

  return (
    <div className="login-container">
      {/* Header */}
      <header className="header">
        <div className="header-content">
          <div className="logo">
            <h2>GoneGift</h2>
          </div>
          <nav className="nav">

            <Link to="/feathers">
              Features
            </Link>

            <Link to="/about">
              About
            </Link>
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="main-content">
        <div className="login-left">
          <div className="brand-section">
            <h1 className="brand-title">Welcome to GoneGift</h1>
            <p className="brand-subtitle">
              Preserve memories and create meaningful connections for your loved
              ones
            </p>
            <div className="features-list">
              <div className="feature-item">
                <div className="feature-icon">🎁</div>
                <div className="feature-text">
                  <h3>Digital Legacy</h3>
                  <p>Create lasting memories for future generations</p>
                </div>
              </div>
              <div className="feature-item">
                <div className="feature-icon">🔒</div>
                <div className="feature-text">
                  <h3>Secure & Private</h3>
                  <p>
                    Your memories are protected with enterprise-grade security
                    with End-to-End encryption
                  </p>
                </div>
              </div>
              <div className="feature-item">
                <div className="feature-icon">🚚</div>
                <div className="feature-text">
                  <h3>Timed Delivery</h3>
                  <p>
                    Schedule messages, gifts, or documents to be delivered after
                    your passing.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="login-right">
          <div className="login-card">
            {loading || loggingIn ? (
              <div className="loading-container">
                <div className="spinner"></div>
                <p className="loading-text">
                  {loggingIn ? "Authenticating..." : "Checking session..."}
                </p>
              </div>
            ) : (
              <>
                <div className="login-header">
                  <h1 className="login-title">Sign in to continue</h1>
                  <p className="login-subtitle">
                    Access your account and start creating meaningful memories
                  </p>
                </div>

                <div className="login-form">
                  <button
                    className="google-login-btn"
                    onClick={handleGoogleLogin}
                    disabled={loggingIn}
                  >
                    {loggingIn ? (
                      <div className="spinner-button"></div>
                    ) : (
                      <>
                        <svg
                          className="google-icon"
                          viewBox="0 0 24 24"
                          width="20"
                          height="20"
                        >
                          <path
                            fill="#4285F4"
                            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                          />
                          <path
                            fill="#34A853"
                            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                          />
                          <path
                            fill="#FBBC05"
                            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                          />
                          <path
                            fill="#EA4335"
                            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                          />
                        </svg>
                        Continue with Google
                      </>
                    )}
                  </button>

                  <div className="divider">
                    <span>or</span>
                  </div>

                  <div className="alternative-login">
                    <p className="alternative-text">
                      Don't have a Google account?{" "}
                      <a href="#contact">Contact Support</a>
                    </p>
                  </div>
                </div>

                <div className="trust-indicators"></div>
              </>
            )}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="footer">
        <div className="footer-content">
          <div className="footer-section">
            <h3>GoneGift</h3>
            <p style={{ color: "gray" }}>
              Creating meaningful connections beyond time
            </p>
            <div className="social-links"  style={{ display: "flex", gap: "0.75rem" }}>
              <a href="#" aria-label="Instagram">
                {/* Instagram SVG */}
                <svg width="24" height="24" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M7 2C4.243 2 2 4.243 2 7v10c0 2.757 2.243 5 5 5h10c2.757 0 5-2.243 5-5V7c0-2.757-2.243-5-5-5H7zm0 2h10c1.654 0 3 1.346 3 3v10c0 1.654-1.346 3-3 3H7c-1.654 0-3-1.346-3-3V7c0-1.654 1.346-3 3-3zm5 3a5 5 0 100 10 5 5 0 000-10zm0 2a3 3 0 110 6 3 3 0 010-6zm4.5-.5a1 1 0 100 2 1 1 0 000-2z" />
                </svg>
              </a>
              
              <a href="#" aria-label="LinkedIn">
                {/* LinkedIn SVG */}
                <svg width="24" height="24" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M4.98 3.5C4.98 4.88 3.86 6 2.5 6S0 4.88 0 3.5 1.12 1 2.5 1s2.48 1.12 2.48 2.5zM0 8h5v15H0V8zm7 0h4.6v2.2h.1c.64-1.2 2.2-2.5 4.4-2.5 4.7 0 5.6 3.1 5.6 7.1V23H17v-6.8c0-1.6 0-3.7-2.2-3.7-2.2 0-2.5 1.8-2.5 3.6V23H7V8z" />
                </svg>
              </a>
            </div>
          </div>

          <div className="footer-section">
            <h4>Product</h4>
            <ul>
              <li>
                <a href="/updateAndPlans">Updates & Plans</a>
              </li>
            </ul>
          </div>

          <div className="footer-section">
            <h4>Support</h4>
            <ul>
              <li>
                <a href="/help">Help Center</a>
              </li>
              <li>
                <a href="/userGuides">User Guides</a>
              </li>
              <li>
                <a href="/community">Community</a>
              </li>
            </ul>
          </div>

          <div className="footer-section">
            <h4>Legal</h4>
            <ul>
              <li>
                <a href="/privacy">Privacy Policy</a>
              </li>
            </ul>
          </div>
        </div>

        <div className="footer-bottom">
          <p>&copy; 2025 GoneGift. All rights reserved.</p>
          <p>Made with ❤️ for preserving memories</p>
        </div>
      </footer>

    </div>
  );
};

export default GoogleLoginPage;

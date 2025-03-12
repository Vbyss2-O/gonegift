import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "./supabaseClient";
import "./DeathDashboard.css";

const Dashboard = () => {
  const navigate = useNavigate();
  const [userData, setUserData] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const { data: { user }, error } = await supabase.auth.getUser();
        if (error || !user) {
          console.error("Error fetching user:", error?.message || "No user found");
          navigate("/login");
          return;
        }

        // Fetch user data from death_user
        const { data: existingUser, error: fetchError } = await supabase
          .from("death_user")
          .select("first_name, lastname, user_role")
          .eq("user_idx", user.id)
          .limit(1) // Ensure single row is returned
          .maybeSingle(); // Avoid error if no rows exist

        if (fetchError || !existingUser) {
          console.error("Error fetching user data:", fetchError || "User not found in death_user table");
          navigate("/login");
          return;
        }

        setUserData({
          userIdX: user.id,
          email: user.email,
          firstName: existingUser.first_name,
          lastname: existingUser.lastname,
        });
        setUserRole(existingUser.user_role);
      } catch (error) {
        console.error("Error in fetchUserData:", error.message);
        navigate("/login");
      } finally {
        setLoading(false);
      }
    };
    fetchUserData();
  }, [navigate]);

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      setUserData(null);
      setUserRole(null);
      navigate("/login");
    } catch (error) {
      console.error("Logout failed:", error.message);
    }
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div className="dashboard">
      <h1>Welcome, {userData?.firstName + " " + userData?.lastname || userData?.email}!</h1>
      
      <section className="quick-actions">
        {userRole === "general" && (
          <>
            <button onClick={() => navigate("/upload-file")}>Upload File</button>
            <button onClick={() => navigate("/create-delivery")}>Create Delivery</button>
            <button onClick={() => navigate("/beneficiaries")}>Beneficiary</button>
            <button onClick={() => navigate("/letter")}>Letter</button>
            <button onClick={() => navigate("/beneficiary-claim")}>Claim as Beneficiary</button>
          </>
        )}
        {userRole === "admin" && (
          <>
            <button onClick={() => navigate("/upload-file")}>Upload File</button>
            <button onClick={() => navigate("/create-delivery")}>Create Delivery</button>
            <button onClick={() => navigate("/beneficiaries")}>Beneficiary</button>
            <button onClick={() => navigate("/letter")}>Letter</button>
            <button onClick={() => navigate("/beneficiary-claim")}>Claim as Beneficiary</button>
            <button onClick={() => navigate("/admin")}>Admin Tools</button>
          </>
        )}
        <button onClick={handleLogout} className="logout-btn">Logout</button>
      </section>

      <section className="assets-overview">
        <p>To be continued...</p>
      </section>
    </div>
  );
};

export default Dashboard;

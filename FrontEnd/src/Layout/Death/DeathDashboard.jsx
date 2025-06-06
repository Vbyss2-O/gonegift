import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "./supabaseClient";
import "./DeathDashboard.css";
import { 
  FiUpload, 
  FiMail, 
  FiUsers, 
  FiFileText, 
  FiGift, 
  FiSettings, 
  FiLogOut, 
  FiGrid, 
  FiBox, 
  FiTrendingUp,
} from 'react-icons/fi';
import { FaRobot } from "react-icons/fa";

const Dashboard = () => {
  const navigate = useNavigate();
  const [userData, setUserData] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [loading, setLoading] = useState(true);
  const [countFile, setCountFile] = useState(null); 
  const [countBenificiary, setCountBenificiary] = useState(null);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const { data: { user }, error } = await supabase.auth.getUser();
        if (error || !user) {
          console.error("Error fetching user:", error?.message || "No user found");
          navigate("/login");
          return;
        }

        const { data: existingUser, error: fetchError } = await supabase
          .from("death_user")
          .select("first_name, lastname, user_role")
          .eq("user_idx", user.id)
          .limit(1)
          .maybeSingle();

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

  useEffect(() => {
    if (userData) { 
      fetch(`http://localhost:8080/api/deathusers/filesize/${userData.userIdX}`)
        .then((response) => response.text()) 
        .then((data) => {
          setCountFile(parseInt(data, 10)); 
        })
        .catch((error) => console.error("Error fetching file count:", error));
    }
  }, [userData]); 
  
  useEffect(() => {
    if (userData) { 
      fetch(`http://localhost:8080/api/deathusers/beneficiarysize/${userData.userIdX}`) 
        .then((response) => response.text()) 
        .then((datax) => {
          setCountBenificiary(parseInt(datax, 10)); 
        })
        .catch((error) => console.error("Error fetching beneficiary count:", error));
    }
  }, [userData]);

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

  // if (loading) return (
  //   <div className="loading-screen">
  //     <div className="loader"></div>
  //     <p>Loading your dashboard...</p>
  //   </div>
  // );

  const generalMenuItems = [
    { icon: <FiUpload size={24} />, text: "Upload File", path: "/upload-file" },
    { icon: <FiMail size={24} />, text: "Create Delivery", path: "/create-delivery" },
    { icon: <FiUsers size={24} />, text: "Beneficiary", path: "/beneficiaries" },
    { icon: <FiFileText size={24} />, text: "Letter", path: "/letter" },
    { icon: <FiGift size={24} />, text: "Claim as Beneficiary", path: "/beneficiary-claim" },
    { icon: <FaRobot size={24} />, text: "Visite Budddy", path: "/lifebuddy" },
  ];

  const adminMenuItems = [
    ...generalMenuItems,
    { icon: <FiSettings size={24} />, text: "Admin Tools", path: "/admin" },
  ];

  const menuItems = userRole === "admin" ? adminMenuItems : generalMenuItems;

  return (
    <div className="dashboard-container">
      <aside className="sidebar">
        <div className="sidebar-header">
          <FiGrid size={24} />
          <h2>GoneGift</h2>
        </div>
        
        <nav className="sidebar-menu">
          {menuItems.map((item, index) => (
            <button
              key={index}
              className="menu-item"
              onClick={() => navigate(item.path)}
            >
              {item.icon}
              <span>{item.text}</span>
            </button>
          ))}
        </nav>

        <button className="logout-button" onClick={handleLogout}>
          <FiLogOut size={20} />
          <span>Logout</span>
        </button>
      </aside>

      <main className="main-content">
        <header className="main-header">
          <div className="user-welcome">
            <h1>Welcome back, {userData?.firstName}!</h1>
            <p>{new Date().toLocaleDateString('en-US', { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}</p>
          </div>
          <div className="user-profile">
          </div>
        </header>

        <div className="stats-grid">
          <div 
            className="stat-card clickable" 
            onClick={() => navigate("/allFiles")}
            role="button"
            tabIndex={0}
          >
            <div className="stat-icon">
              <FiBox size={24} />
            </div>
            <div className="stat-info">
              <h3>Total Files</h3>
              <p>{countFile}</p>
            </div>
          </div>
          <div 
            className="stat-card clickable" 
            onClick={() => navigate("/allBenificiarys")}
            role="button"
            tabIndex={0}
          >
            <div className="stat-icon">
              <FiUsers size={24} />
            </div>
            <div className="stat-info">
              <h3>Beneficiaries</h3>
              <p>{countBenificiary}</p>
            </div>
          </div>
          <div 
            className="stat-card clickable"
            onClick={() => navigate("/pending-deliveries")}
            role="button"
            tabIndex={0}
          >
            <div className="stat-icon">
              <FiTrendingUp size={24} />
            </div>
            <div className="stat-info">
              <h3>Pending Deliveries</h3>
              <p>0</p>
            </div>
          </div>
        </div>

        <div className="dashboard-grid">
          {menuItems.map((item, index) => (
            <div 
              key={index} 
              className="dashboard-card" 
              onClick={() => navigate(item.path)}
            >
              <div className="card-icon">{item.icon}</div>
              <h3>{item.text}</h3>
            </div>
          ))}
        </div>

        {/* <div className="recent-activity">
          <br />
          <br />
          <br />
          <center><h2>Recent Activity</h2></center>
          <div className="activity-list">
            <center><p>No recent activity</p></center>
          </div>
        </div> */}
      </main>
    </div>
  );
};

export default Dashboard;
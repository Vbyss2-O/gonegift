import React, { useEffect, useState } from "react";
import axios from "axios";
import { supabase } from "./Death/supabaseClient"; // Adjust path if needed
import { v4 as uuidv4 } from "uuid";
import { useNavigate } from "react-router-dom";
import "./LifeBuddy.css"; // Import your CSS styles
import BackButton from "./components/BackButton"; // Import the BackButton component

const LifeBuddyDashboard = () => {
  const [userIdX, setUserIdX] = useState(null);
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [replyMessage, setReplyMessage] = useState("");
  const [replyStatus, setReplyStatus] = useState(null);
  const [userx, setUserX] = useState(null);
  const navigate = useNavigate();

  // Fetch userIdX and initial DeathUser data from Supabase and API on mount
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const {
          data: { user },
          error,
        } = await supabase.auth.getUser();
        if (error || !user) {
          setError("User not authenticated. Please log in.");
          return;
        }
        setUserIdX(user.id);

        // Fetch DeathUser data
        const userResponse = await axios.get(
          `${import.meta.env.VITE_API_URL}/api/deathusers/${user.id}`
        );
        setUserX(userResponse.data);

        fetchActivities(user.id);
      } catch (err) {
        setError("Failed to fetch user data. Please log in.");
        console.error(err);
      }
    };
    fetchUserData();
  }, []);

  // Fetch LifeBuddy activities for the user
  const fetchActivities = async (userId) => {
    if (!userId) return;
    setLoading(true);
    setError(null);
    try {
      const response = await axios.get(
        `${import.meta.env.VITE_API_URL}/lifebuddy/activities/${userId}`
      );
      setActivities(Array.isArray(response.data) ? response.data : []);
    } catch (err) {
      if (err.response && err.response.status === 204) {
        setActivities([]);
      } else {
        setError("Failed to load Buddy logs. Try again!");
        console.error(err);
      }
    } finally {
      setLoading(false);
    }
  };

  // Handle reply submission
  const handleReply = async () => {
    if (!userIdX || !replyMessage.trim()) {
      setReplyStatus("Please provide a reply message");
      return;
    }
    setReplyStatus(null);
    try {
      await axios.delete(`${import.meta.env.VITE_API_URL}/buddy/delete/${userIdX}`);

      console.log("Previous logs deleted successfully Thank You!");
    } catch (err) {
      console.error("Failed to delete previous logs:", err);
    }
    try {
      const token = uuidv4();
      const response = await axios.get(
        `${import.meta.env.VITE_API_URL}/buddy?userId=${userIdX}&token=${token}`
      );
      setReplyStatus(response.data);
      setReplyMessage("");
      fetchActivities(userIdX);
    } catch (err) {
      setReplyStatus("Failed to send reply. Try again!");
      console.error(err);
    }
    //delete prev logs now
    
  };

  async function goToInfoPage() {
    navigate("/buddyAbout");
  }

  // Update DeathUser when replyStatus is not null
  useEffect(() => {
    const updateDeathUser = async () => {
      if (!replyStatus || replyStatus.includes("Failed")) return;

      try {
        const userResponse = await axios.get(
          `${import.meta.env.VITE_API_URL}/api/deathusers/${userIdX}`
        );
        const currentUser = userResponse.data;
        const updatedUser = {
          ...currentUser,
          lastInteraction: new Date().toISOString(),
          attemptCount: 0, // Added as per requirement
        };

        await axios.post(`${import.meta.env.VITE_API_URL}/api/deathusers`, updatedUser, {
          headers: { "Content-Type": "application/json" },
        });
        setUserX(updatedUser); // Update userx after successful POST
        console.log("DeathUser updated successfully");
      } catch (err) {
        console.error("Failed to update DeathUser:", err);
        setError("Failed to update user data after reply.");
      }
    };

    updateDeathUser();
  }, [replyStatus, userIdX]);

  return (
    <>
      <BackButton />
    <div className="lifebuddy-dashboard">
     

      <center>
        <h1>Buddy's Dashboard</h1>
      </center>
      <button
        onClick={goToInfoPage}
        style={{ all: "unset", cursor: "pointer" }}
      >
        <img src="/about.png" alt="About icon" className="lifebuddy-about" />
      </button>

      <br />
      <center>
        <img
          src="https://thumbs.dreamstime.com/b/vector-funny-cartoon-red-friendly-robot-character-isolated-white-background-kids-d-toy-chat-bot-icon-logo-design-template-117144509.jpg?w=768"
          alt="LifeBuddy Icon"
          className="lifebuddy-icon"
        />
      </center>

      {error && <p className="error">{error}</p>}

      <div className="activity-log">
        <h2>Buddy Logs</h2>
        {activities.length === 0 && !loading && !error && (
          <p>No logs yet.Buddy’s waiting for your antics!</p>
        )}
        {loading ? (
          <p>Loading Buddy logs...</p>
        ) : (
          <ul>
            {activities.map((activity) => (
              <li
                key={activity.activityId}
                className={`log-item ${activity.action
                  .toLowerCase()
                  .replace(" ", "-")}`}
              >
                <strong>Buddy</strong> - {activity.action} I Am{" "}
                <strong>{userx ? activity.buddyStatus : "Loading..."}</strong>
                <br />
                <small>{new Date(activity.timestamp).toLocaleString()}</small>
                <br />
                <p>{activity.details}</p>
              </li>
            ))}
          </ul>
        )}
        <br />
      </div>

      <div className="reply-section">
        <h2>Reply to Buddy</h2>
        <textarea
          value={replyMessage}
          onChange={(e) => setReplyMessage(e.target.value)}
          placeholder="What’s your wildest story for Buddy?"
          rows="4"
          cols="50"
        />
        <button
          onClick={handleReply}
          disabled={!userIdX || !replyMessage.trim()}
          //make button text black
          style={{background:"green" ,color: "white" }}
        >
          Send Reply
        </button>
        {replyStatus && (
          <p className={replyStatus.includes("Failed") ? "error" : "success"}>
            {replyStatus}
          </p>
        )}
      </div>
    </div>
    </>
  );
};

export default LifeBuddyDashboard;

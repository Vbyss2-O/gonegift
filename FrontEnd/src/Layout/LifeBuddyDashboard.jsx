import React, { useEffect, useState } from "react";
import axios from "axios";
import { supabase } from "./Death/supabaseClient"; // Adjust path if needed
import { v4 as uuidv4 } from "uuid";

const LifeBuddyDashboard = () => {
  const [userIdX, setUserIdX] = useState(null);
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [replyMessage, setReplyMessage] = useState("");
  const [replyStatus, setReplyStatus] = useState(null);
  const [userx, setUserX] = useState(null);

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
          `http://localhost:8080/api/deathusers/${user.id}`
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
        `http://localhost:8080/lifebuddy/activities/${userId}`
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
      const token = uuidv4();
      const response = await axios.get(
        `http://localhost:8080/buddy?userId=${userIdX}&token=${token}`
      );
      setReplyStatus(response.data);
      setReplyMessage("");
      fetchActivities(userIdX);
    } catch (err) {
      setReplyStatus("Failed to send reply. Try again!");
      console.error(err);
    }
  };

  // Update DeathUser when replyStatus is not null
  useEffect(() => {
    const updateDeathUser = async () => {
      if (!replyStatus || replyStatus.includes("Failed")) return;

      try {
        const userResponse = await axios.get(
          `http://localhost:8080/api/deathusers/${userIdX}`
        );
        const currentUser = userResponse.data;
        const updatedUser = {
          ...currentUser,
          lastInteraction: new Date().toISOString(),
          attemptCount: 0, // Added as per requirement
        };

        await axios.post("http://localhost:8080/api/deathusers", updatedUser, {
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
    <div className="lifebuddy-dashboard">
      <style>{`
    .lifebuddy-dashboard {
      max-width: 800px;
      margin: 2rem auto;
      padding: 2.5rem;
      background: var(--bg-glass);
      border-radius: var(--radius-xl);
      box-shadow: var(--shadow-rainbow);
      backdrop-filter: var(--blur-light);
      border: 1px solid rgba(255, 255, 255, 0.2);
      position: relative;
      overflow: hidden;
      transition: var(--transition-spring);
    }

    .lifebuddy-dashboard::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 4px;
      background: var(--border-gradient);
      background-size: 200% 200%;
      animation: gradientMove 3s linear infinite;
    }

    .lifebuddy-icon {
      display: block;
      margin: 0 auto 2rem;
      border-radius: var(--radius-full);
      box-shadow: var(--shadow-glow);
      transition: var(--transition-spring);
    }

    .lifebuddy-icon:hover {
      transform: scale(1.05);
      box-shadow: var(--shadow-neon);
    }

    .activity-log {
      background: var(--bg-glass);
      padding: 1.5rem;
      border-radius: var(--radius-lg);
      box-shadow: var(--shadow-md);
      backdrop-filter: var(--blur-light);
      border: 1px solid rgba(255, 255, 255, 0.2);
    }

    .activity-log ul {
      list-style: none;
      padding: 0;
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    .log-item {
      padding: 1.25rem;
      border-radius: var(--radius-lg);
      background: var(--bg-glass);
      backdrop-filter: var(--blur-light);
      border: 1px solid rgba(255, 255, 255, 0.2);
      transition: var(--transition);
      position: relative;
      overflow: hidden;
    }

    .log-item:hover {
      transform: translateY(-2px);
      box-shadow: var(--shadow-md);
    }

    .log-item.sent-message {
      border-left: 4px solid var(--accent3);
      background: linear-gradient(135deg, rgba(16, 185, 129, 0.1), rgba(16, 185, 129, 0.05));
    }

    .log-item.marked-as-deceased {
      border-left: 4px solid var(--accent4);
      background: linear-gradient(135deg, rgba(239, 68, 68, 0.1), rgba(239, 68, 68, 0.05));
    }

    .reply-section {
      margin-top: 2rem;
      padding: 1.5rem;
      background: var(--bg-glass);
      border-radius: var(--radius-lg);
      box-shadow: var(--shadow-md);
      backdrop-filter: var(--blur-light);
      border: 1px solid rgba(255, 255, 255, 0.2);
    }

    .reply-section textarea {
      width: 100%;
      padding: 1rem 1.25rem;
      border-radius: var(--radius-lg);
      background: var(--bg-white);
      border: 1px solid var(--border-light);
      resize: vertical;
      min-height: 120px;
      font-size: 1rem;
      color: var(--text-primary);
      transition: var(--transition);
    }

    .reply-section textarea:focus {
      outline: none;
      border-color: var(--primary);
      box-shadow: var(--shadow-glow);
    }

    .reply-section button {
      margin-top: 1rem;
      padding: 1rem 2rem;
      background: linear-gradient(135deg, var(--primary), var(--secondary));
      color: var(--text-light);
      border: none;
      border-radius: var(--radius-lg);
      font-weight: 600;
      cursor: pointer;
      transition: var(--transition-spring);
      position: relative;
      overflow: hidden;
    }

    .reply-section button::before {
      content: '';
      position: absolute;
      top: 0;
      left: -100%;
      width: 100%;
      height: 100%;
      background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
      transition: var(--transition);
    }

    .reply-section button:hover:not(:disabled)::before {
      left: 100%;
    }

    .reply-section button:hover:not(:disabled) {
      transform: translateY(-2px);
      box-shadow: var(--shadow-xl);
    }

    .reply-section button:disabled {
      background: linear-gradient(135deg, var(--text-gray), #999);
      cursor: not-allowed;
      opacity: 0.7;
    }

    .error {
      color: var(--accent4);
      font-weight: 600;
      padding: 1rem;
      border-radius: var(--radius-lg);
      background: linear-gradient(135deg, rgba(239, 68, 68, 0.1), rgba(239, 68, 68, 0.05));
      margin-top: 1rem;
    }

    .success {
      color: var(--accent3);
      font-weight: 600;
      padding: 1rem;
      border-radius: var(--radius-lg);
      background: linear-gradient(135deg, rgba(16, 185, 129, 0.1), rgba(16, 185, 129, 0.05));
      margin-top: 1rem;
    }
    .lifebuddy-icon{
        width: 150px;
        height: 150px;
    }

    @media (max-width: 768px) {
      .lifebuddy-dashboard {
        margin: 1.5rem;
        padding: 2rem;
      }

      .reply-section button {
        width: 100%;
      }
    }

    @media (max-width: 480px) {
      .lifebuddy-dashboard {
        margin: 1rem;
        padding: 1.5rem;
      }

      .log-item {
        padding: 1rem;
      }
    }
  `}</style>

      <center><h1>Buddy's Dashboard</h1></center>
      //create one simple i logo where clicking that i should redirect to the LifeBuddy page
      <div>
        <a href="https://www.flaticon.com/free-icons/about" title="about icons">About icons created by Yogi Aprelliyanto - Flaticon</a>
      </div>

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
                <strong>{userx ? userx.buddyStatus : "Loading..."}</strong>
                <br />
                <small>{new Date(activity.timestamp).toLocaleString()}</small>
                <br />
                <p>{activity.details}</p>
              </li>
            ))}
          </ul>
        )}
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
  );
};

export default LifeBuddyDashboard;

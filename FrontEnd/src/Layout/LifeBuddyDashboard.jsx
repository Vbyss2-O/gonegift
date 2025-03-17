import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { supabase } from './Death/supabaseClient'; // Adjust path if needed
import { v4 as uuidv4 } from 'uuid';

const LifeBuddyDashboard = () => {
  const [userIdX, setUserIdX] = useState(null);
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [replyMessage, setReplyMessage] = useState('');
  const [replyStatus, setReplyStatus] = useState(null);
  const [userx, setUserX] = useState(null);

  // Fetch userIdX and initial DeathUser data from Supabase and API on mount
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const { data: { user }, error } = await supabase.auth.getUser();
        if (error || !user) {
          setError('User not authenticated. Please log in.');
          return;
        }
        setUserIdX(user.id);

        // Fetch DeathUser data
        const userResponse = await axios.get(`http://localhost:8080/api/deathusers/${user.id}`);
        setUserX(userResponse.data);

        fetchActivities(user.id);
      } catch (err) {
        setError('Failed to fetch user data. Please log in.');
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
      const response = await axios.get(`http://localhost:8080/lifebuddy/activities/${userId}`);
      setActivities(Array.isArray(response.data) ? response.data : []);
    } catch (err) {
      if (err.response && err.response.status === 204) {
        setActivities([]);
      } else {
        setError('Failed to load Buddy logs. Try again!');
        console.error(err);
      }
    } finally {
      setLoading(false);
    }
  };

  // Handle reply submission
  const handleReply = async () => {
    if (!userIdX || !replyMessage.trim()) {
      setReplyStatus('Please provide a reply message');
      return;
    }
    setReplyStatus(null);
    try {
      const token = uuidv4();
      const response = await axios.get(`http://localhost:8080/buddy?userId=${userIdX}&token=${token}`);
      setReplyStatus(response.data);
      setReplyMessage('');
      fetchActivities(userIdX);
    } catch (err) {
      setReplyStatus('Failed to send reply. Try again!');
      console.error(err);
    }
  };

  // Update DeathUser when replyStatus is not null
  useEffect(() => {
    const updateDeathUser = async () => {
      if (!replyStatus || replyStatus.includes('Failed')) return;

      try {
        const userResponse = await axios.get(`http://localhost:8080/api/deathusers/${userIdX}`);
        const currentUser = userResponse.data;
        const updatedUser = {
          ...currentUser,
          lastInteraction: new Date().toISOString(),
          attemptCount: 0 // Added as per requirement
        };

        await axios.post('http://localhost:8080/api/deathusers', updatedUser, {
          headers: { 'Content-Type': 'application/json' },
        });
        setUserX(updatedUser); // Update userx after successful POST
        console.log('DeathUser updated successfully');
      } catch (err) {
        console.error('Failed to update DeathUser:', err);
        setError('Failed to update user data after reply.');
      }
    };

    updateDeathUser();
  }, [replyStatus, userIdX]);

  return (
    <div className="lifebuddy-dashboard">
      <style>{`
        .lifebuddy-dashboard {
          max-width: 800px;
          margin: 20px auto;
          padding: 20px;
          background-color: #fff;
          border-radius: 8px;
          box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
          font-family: Arial, sans-serif;
        }
        .lifebuddy-icon {
          display: block;
          margin: 0 auto 20px;
          border-radius: 50%;
        }
        .activity-log ul {
          list-style: none;
          padding: 0;
        }
        .log-item {
          padding: 10px;
          margin-bottom: 10px;
          border: 1px solid #ddd;
          border-radius: 4px;
          background-color: #fafafa;
        }
        .log-item.sent-message {
          border-left: 4px solid #4CAF50;
        }
        .log-item.marked-as-deceased {
          border-left: 4px solid #f44336;
          background-color: #ffe6e6;
        }
        .reply-section {
          margin-top: 20px;
        }
        .reply-section textarea {
          width: 100%;
          padding: 10px;
          border: 1px solid #ccc;
          border-radius: 4px;
          resize: vertical;
        }
        .reply-section button {
          padding: 6px 12px;
          background-color: #4CAF50;
          color: white;
          border: none;
          border-radius: 4px;
          cursor: pointer;
        }
        .reply-section button:disabled {
          background-color: #cccccc;
          cursor: not-allowed;
        }
        .error {
          color: #f44336;
          font-weight: bold;
        }
        .success {
          color: #4CAF50;
          font-weight: bold;
        }
      `}</style>

      <h1>Buddy's Dashboard</h1>
      <img 
        src="https://via.placeholder.com/100?text=LifeBuddy" 
        alt="LifeBuddy" 
        className="lifebuddy-icon" 
      />

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
              <li key={activity.activityId} className={`log-item ${activity.action.toLowerCase().replace(' ', '-')}`}>
                <strong>Buddy</strong> - {activity.action} I Am <strong>{userx ? userx.buddyStatus : 'Loading...'}</strong>
                <br />
                <small>{new Date(activity.timestamp).toLocaleString()}</small><br />
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
        <button onClick={handleReply} disabled={!userIdX || !replyMessage.trim()}>
          Send Reply
        </button>
        {replyStatus && <p className={replyStatus.includes('Failed') ? 'error' : 'success'}>{replyStatus}</p>}
      </div>
    </div>
  );
};

export default LifeBuddyDashboard;
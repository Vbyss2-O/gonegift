import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "./supabaseClient";

const BeneficiaryList = () => {
  const navigate = useNavigate();
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [beneficiaries, setBeneficiaries] = useState([]);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const { data: { user }, error } = await supabase.auth.getUser();
        if (error || !user) {
          console.error("Error fetching user:", error?.message || "No user found");
          navigate("/login");
          return;
        }

        // Modified query to select the correct columns
        const { data: existingUser, error: fetchError } = await supabase
          .from("death_user")
          .select("first_name, lastname, user_role, user_idx")
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
          deathUserId: existingUser.user_idx // Using user_idx instead of id
        });

        // Use user_idx instead of id
        await fetchBeneficiaries(existingUser.user_idx);
      } catch (error) {
        console.error("Error in fetchUserData:", error.message);
        navigate("/login");
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [navigate]);

  const fetchBeneficiaries = async (userId) => {
    try {
      setError(null);
      const response = await fetch(`http://localhost:8080/api/deathusers/listOfBeneficiary/${userId}`);
      
      if (!response.ok) {
        if (response.status === 404) {
          setBeneficiaries([]);
          return;
        }
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch beneficiaries');
      }

      const data = await response.json();
      // Handle empty response
      if (!data) {
        setBeneficiaries([]);
        return;
      }

      // Ensure data is an array
      const beneficiaryArray = Array.isArray(data) ? data : [data];
      setBeneficiaries(beneficiaryArray);
    } catch (error) {
      console.error("Error fetching beneficiaries:", error);
      setError(error.message);
      setBeneficiaries([]);
    }
  };

  const removeBeneficiary = async (beneficiaryId) => {
    const confirmDelete = window.confirm("Are you sure you want to delete this beneficiary?");
    if (!confirmDelete) return;

    try {
      const response = await fetch(`http://localhost:8080/api/beneficiaries/${beneficiaryId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete beneficiary");
      }

      setBeneficiaries((prev) => prev.filter((ben) => ben.id !== beneficiaryId));
      // Refresh the list after deletion
      if (userData?.deathUserId) {
        await fetchBeneficiaries(userData.deathUserId);
      }
    } catch (error) {
      console.error("Error deleting beneficiary:", error);
      alert("Failed to delete beneficiary. Try again.");
    }
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div className="beneficiary-list-container">
      <h2>Welcome, {userData?.firstName} {userData?.lastname}</h2>
      <h3>Your Beneficiaries:</h3>
      
      {error && (
        <div className="error-message">
          Error: {error}
        </div>
      )}

      {beneficiaries.length === 0 ? (
        <p>No beneficiaries found.</p>
      ) : (
        <ul className="beneficiary-list">
          {beneficiaries.map((ben) => (
            <li key={ben.id} className="beneficiary-item">
              <div className="beneficiary-info">
                <strong>Name:</strong> {ben.name} <br />
                <strong>Email:</strong> {ben.email}
              </div>
              <button 
                onClick={() => removeBeneficiary(ben.id)}
                className="remove-button">
                Remove
              </button>
            </li>
          ))}
        </ul>
      )}

      <style jsx>{`
        .beneficiary-list-container {
          padding: 20px;
          max-width: 800px;
          margin: 0 auto;
        }
        .beneficiary-list {
          list-style: none;
          padding: 0;
        }
        .beneficiary-item {
          border: 1px solid #ddd;
          margin: 10px 0;
          padding: 15px;
          border-radius: 4px;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .beneficiary-info {
          flex: 1;
        }
        .remove-button {
          background-color: #ff4444;
          color: white;
          border: none;
          padding: 8px 16px;
          border-radius: 4px;
          cursor: pointer;
          transition: background-color 0.2s;
        }
        .remove-button:hover {
          background-color: #cc0000;
        }
        .error-message {
          color: #ff4444;
          padding: 10px;
          margin: 10px 0;
          border: 1px solid #ff4444;
          border-radius: 4px;
          background-color: #ffebee;
        }
      `}</style>
    </div>
  );
};

export default BeneficiaryList;
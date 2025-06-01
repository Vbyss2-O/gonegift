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
        const {
          data: { user },
          error,
        } = await supabase.auth.getUser();
        if (error || !user) {
          console.error(
            "Error fetching user:",
            error?.message || "No user found"
          );
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
          console.error(
            "Error fetching user data:",
            fetchError || "User not found in death_user table"
          );
          navigate("/login");
          return;
        }

        setUserData({
          userIdX: user.id,
          email: user.email,
          firstName: existingUser.first_name,
          lastname: existingUser.lastname,
          deathUserId: existingUser.user_idx, // Using user_idx instead of id
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
      const response = await fetch(
        `http://localhost:8080/api/deathusers/listOfBeneficiary/${userId}`
      );

      if (!response.ok) {
        if (response.status === 404) {
          setBeneficiaries([]);
          return;
        }
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to fetch beneficiaries");
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
      console.log(beneficiaries);
    } catch (error) {
      console.error("Error fetching beneficiaries:", error);
      setError(error.message);
      setBeneficiaries([]);
    }
  };

  const removeBeneficiary = async (beneficiaryId) => {
    const confirmDelete = window.confirm(
      "Are you sure you want to delete this beneficiary?"
    );
    if (!confirmDelete) return;

    try {
      const response = await fetch(
        `http://localhost:8080/api/beneficiaries/${beneficiaryId}`,
        {
          method: "DELETE",
        }
      );

      if (!response.ok) {
        throw new Error("Failed to delete beneficiary");
      }

      setBeneficiaries((prev) =>
        prev.filter((ben) => ben.id !== beneficiaryId)
      );
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
      <h2>
        Welcome, {userData?.firstName} {userData?.lastname}
      </h2>
      <h3>Your Beneficiaries:</h3>

      {error && <div className="error-message">Error: {error}</div>}

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
                className="remove-button"
              >
                Remove
              </button>
            </li>
          ))}
        </ul>
      )}

      <style jsx>{`
        .beneficiary-list-container {
          padding: 24px;
          max-width: 800px;
          margin: 40px auto 0 auto; /* Top margin added */
          background: var(--bg-glass, rgba(255, 255, 255, 0.05));
          border-radius: 16px;
          box-shadow: var(--shadow-rainbow, 0 4px 30px rgba(0, 0, 0, 0.1));
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255, 255, 255, 0.1);
        }

        .beneficiary-list {
          list-style: none;
          padding: 0;
          margin: 0;
        }

        .beneficiary-item {
          border: 1px solid rgba(255, 255, 255, 0.15);
          margin: 12px 0;
          padding: 16px;
          border-radius: 12px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          background-color: var(--bg-glass, #f9f9f9);
          box-shadow: var(--shadow-md, 0 2px 6px rgba(0, 0, 0, 0.05));
          transition: transform 0.2s ease, box-shadow 0.2s ease;
        }

        .beneficiary-item:hover {
          transform: translateY(-2px);
          box-shadow: var(--shadow-lg, 0 6px 12px rgba(0, 0, 0, 0.12));
        }

        .beneficiary-info {
          flex: 1;
          color: var(--text-primary, #2c3e50);
          font-size: 16px;
        }

        .remove-button {
          background-color: var(--accent5, #e74c3c);
          color: #fff;
          border: none;
          padding: 8px 16px;
          border-radius: 6px;
          font-weight: 500;
          cursor: pointer;
          transition: background-color 0.2s ease;
          font-size: 14px;
        }

        .remove-button:hover {
          background-color: #c0392b;
        }

        .error-message {
          color: var(--accent3, #e74c3c);
          padding: 12px;
          margin: 16px 0;
          border: 1px solid var(--accent3, #e74c3c);
          border-radius: 8px;
          background-color: rgba(231, 76, 60, 0.1);
          font-weight: 500;
        }

        @media (max-width: 600px) {
          .beneficiary-item {
            flex-direction: column;
            align-items: flex-start;
          }

          .remove-button {
            margin-top: 10px;
            align-self: flex-end;
          }
        }
      `}</style>
    </div>
  );
};

export default BeneficiaryList;

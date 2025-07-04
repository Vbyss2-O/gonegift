import React, { useState, useEffect } from "react";
import { supabase } from "./supabaseClient"; // Supabase client
import axios from "axios"; // For making HTTP requests
import "./BeneficiaryForm.css"; // Import your CSS styles
import BackButton from "../components/BackButton"; // Import the BackButton component

// Supabase configuration


const BeneficiaryForm = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);

  // Fetch current user data from Supabase
  useEffect(() => {
    const fetchCurrentUser = async () => {
      const { data: user, error } = await supabase.auth.getUser();
      if (error || !user?.user) {
        console.error("Error fetching user:", error);
        // Optionally redirect to login if user is not found
        // navigate("/login"); 
        return;
      }
      setCurrentUser({
        uid: user.user.id,
        email: user.user.email,
      });
    };
    fetchCurrentUser();
  }, []); // Empty dependency array means this runs once on mount

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!currentUser) {
      setMessage("You must be logged in to add a beneficiary.");
      return;
    }
    if (!name.trim() || !email.trim()) {
      setMessage("Beneficiary name and email cannot be empty.");
      return;
    }

    setLoading(true);
    setMessage(null); // Clear previous messages

    try {
      const response = await axios.post("http://localhost:8080/api/beneficiaries", {
        name,
        email,
        idOfUser: currentUser.uid,
        userx: { userIdX: currentUser.uid }, // Ensure this matches your backend DTO/entity
      });

      if (response.status === 200) {
        setMessage("Beneficiary successfully added!");
        setName(""); // Clear form fields
        setEmail("");
      } else {
        // Handle non-200 responses as errors
        throw new Error(`Failed to add beneficiary: Status ${response.status}`);
      }
    } catch (err) {
      console.error("Error submitting form:", err.response?.data || err.message);
      setMessage("An error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
    <BackButton />
    <div className="beneficiary-form-container">
      <h2 className="beneficiary-form-title">Add a Beneficiary</h2>
      <form onSubmit={handleSubmit}>
        <div className="beneficiary-form-input-group">
          <label htmlFor="name" className="beneficiary-form-label">Beneficiary Name</label>
          <input
            id="name"
            type="text"
            placeholder="Enter beneficiary name..."
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="beneficiary-form-input"
            required // Added required attribute for basic validation
          />
        </div>
        <div className="beneficiary-form-input-group">
          <label htmlFor="email" className="beneficiary-form-label">Beneficiary Email</label>
          <input
            id="email"
            type="email"
            placeholder="Enter beneficiary email..."
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="beneficiary-form-input"
            required // Added required attribute
          />
        </div>
        <br />
        <div style={{ textAlign: "center" }}> {/* Keeping inline style for text-align for simple alignment */}
          <button type="submit" disabled={loading} className="beneficiary-form-button">
            {loading ? "Adding..." : "Add Beneficiary"}
          </button>
        </div>
      </form>
      {message && (
        <p className={`beneficiary-form-message ${message.includes("successfully") ? "success" : "error"}`}>
          {message}
        </p>
      )}
    </div>
    </>
  );
};

export default BeneficiaryForm;

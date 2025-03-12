// import React, { useState, useEffect } from "react";
// import { auth, db } from "../Auth/FirebaseConfig"; // Import Firebase config
// import { doc, getDoc } from "firebase/firestore"; // Import Firestore methods
// import axios from "axios"; // Import axios for making HTTP requests

// const BeneficiaryForm = () => {
//   const [name, setName] = useState(""); // To capture beneficiary name
//   const [email, setEmail] = useState(""); // To capture beneficiary email
//   const [loading, setLoading] = useState(false); // For button state
//   const [message, setMessage] = useState(null); // To show feedback to the user
//   const [currentUser, setCurrentUser] = useState(null); // Current user state

//   useEffect(() => {
//     const fetchCurrentUser = async () => {
//       const user = auth.currentUser; // Get the current logged-in user
//       if (user) {
//         try {
//           const userDocRef = doc(db, "users", user.uid); // Reference to the Firestore user document
//           const userDoc = await getDoc(userDocRef);

//           if (userDoc.exists()) {
//             setCurrentUser({
//               uid: user.uid,
//               email: user.email,
//               ...userDoc.data(), // Include additional user data from Firestore
//             });
//           } else {
//             console.error("User document not found in Firestore.");
//             setCurrentUser({ uid: user.uid, email: user.email }); // Set fallback user data
//           }
//         } catch (error) {
//           console.error("Error fetching user data:", error);
//           setCurrentUser(null);
//         }
//       } else {
//         setCurrentUser(null); // No user is logged in
//       }
//     };

//     fetchCurrentUser();
//   }, []);

//   const handleSubmit = async () => {
//     if (!currentUser) {
//       setMessage("You must be logged in to add a beneficiary.");
//       return;
//     }

//     if (!name.trim() || !email.trim()) {
//       setMessage("Beneficiary name and email cannot be empty.");
//       return;
//     }

//     setLoading(true);
//     setMessage(null);

//     try {
//       const response = await axios.post("/api/beneficiaries", {
//         name,
//         email,
//         userId: currentUser.uid, // Associate the beneficiary with the current user
//       });

//       if (response.status === 201) {
//         console.log("Beneficiary created:", response.data);
//         setMessage("Beneficiary successfully added!");
//         setName(""); // Clear the form
//         setEmail(""); // Clear the form
//       } else {
//         console.error("Error adding beneficiary:", response.data);
//         setMessage("Failed to add the beneficiary. Please try again.");
//       }
//     } catch (err) {
//       console.error("Unexpected error:", err);
//       setMessage("An unexpected error occurred. Please try again.");
//     } finally {
//       setLoading(false);
//     }
//   };

//   if (currentUser === null) {
//     return <div>Loading user information...</div>; // Loading state for user data
//   }

//   return (
//     <div className="beneficiary-form">
//       <h2>Add a Beneficiary</h2>
//       <input
//         type="text"
//         placeholder="Enter beneficiary name..."
//         value={name}
//         onChange={(e) => setName(e.target.value)}
//         style={{
//           width: "100%",
//           padding: "10px",
//           fontSize: "16px",
//           border: "1px solid #ccc",
//           borderRadius: "4px",
//           marginBottom: "10px",
//         }}
//       />
//       <input
//         type="email"
//         placeholder="Enter beneficiary email..."
//         value={email}
//         onChange={(e) => setEmail(e.target.value)}
//         style={{
//           width: "100%",
//           padding: "10px",
//           fontSize: "16px",
//           border: "1px solid #ccc",
//           borderRadius: "4px",
//           marginBottom: "10px",
//         }}
//       />
//       <button
//         onClick={handleSubmit}
//         disabled={loading}
//         style={{
//           padding: "10px 20px",
//           fontSize: "16px",
//           backgroundColor: "#007bff",
//           color: "#fff",
//           border: "none",
//           borderRadius: "4px",
//           cursor: "pointer",
//           opacity: loading ? 0.7 : 1,
//         }}
//       >
//         {loading ? "Adding..." : "Add Beneficiary"}
//       </button>
//       {message && (
//         <p
//           style={{
//             marginTop: "10px",
//             color: message.startsWith("Failed") ? "red" : "green",
//           }}
//         >
//           {message}
//         </p>
//       )}
//     </div>
//   );
// };

// export default BeneficiaryForm;
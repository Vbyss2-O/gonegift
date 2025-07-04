import React from "react";
import "./HelpCenter.css";

const UserGuides = () => {
  return (
    <div className="userguides-container">
      <h1 className="userguides-title">
        User Guide
      </h1>

      <p className="userguides-desc">
        Welcome to GoneGift. This guide will help you get started and make the most of your account.
      </p>

      <ul className="userguides-list">
        <li>
          <strong>Create Your Account:</strong> Sign up securely and save your unique credentials. These are essential for encryption and should be kept private.
        </li>
        <li>
          <strong>Upload Memories:</strong> Add files, letters, and voice notes you want to preserve for your loved ones.
        </li>
        <li>
          <strong>Set Beneficiaries:</strong> Choose trusted people who will receive your content after your passing.
        </li>
        <li>
          <strong>Use Shared Spaces:</strong> Collaborate with family to build a collective archive of memories.
        </li>
        <li>
          <strong>Check Status:</strong> LifeBuddy monitors your activity and follows up over time to confirm you’re still active.
        </li>
        <li>
          <strong>Secure Delivery:</strong> When needed, your encrypted content will be released to beneficiaries safely.
        </li>
      </ul>

      <p className="userguides-contact">
        For more help, please contact our Support
      </p>
    </div>
  );
};

export default UserGuides;
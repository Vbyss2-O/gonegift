import React from "react";
import "./feather.css";

const GoneGiftFeatures = () => {
  return (
    <div className="gonegiftfeatures-container">
      <h1 className="gonegiftfeatures-title">GoneGift Key Features</h1>
      <ul className="gonegiftfeatures-list">
        <li>
          <strong>Secure Login with Encrypted Credentials</strong><br />
          On login, users receive a unique encrypted credential used for future content protection. This credential must be safely stored and shared only with trusted beneficiaries.
        </li>
        <li>
          <strong>Upload Files, Voice Notes, and Letters</strong><br />
          Users can upload documents, record voice messages, or write heartfelt letters to be delivered in the future.
        </li>
        <li>
          <strong>Add Trusted Beneficiaries</strong><br />
          Assign people who will receive your preserved content after your passing. Only beneficiaries with correct credentials can access it.
        </li>
        <li>
          <strong>Shared Space (Family Book)</strong><br />
          A collaborative space where multiple users can upload files. Ideal for preserving a shared family history or memory archive.
        </li>
        <li>
          <strong>LifeBuddy Reflex Agent</strong><br />
          An intelligent agent that monitors user activity. Based on inactivity or suspicious absence, it can initiate the content release process.
        </li>
        <li>
          <strong>End-to-End Encryption</strong><br />
          All content is encrypted on the client side. Only the intended beneficiary with the user’s shared credentials can decrypt and view it.
        </li>
        <li>
          <strong>Manual Claim by Beneficiary</strong><br />
          Beneficiaries can submit the shared credential on the claim portal to access content manually after the user's death.
        </li>
        <li>
          <strong>Timed Auto-Trigger Mechanism</strong><br />
          If the user does not respond for a defined time period , the system rechecks periodically. If no activity is detected, it automatically triggers the secure claim process.
        </li>
        <li>
          <strong>Monitoring Toggle</strong><br />
          At any time you can Toggle this button it will Pause or Restart the process of "Time Auto-Trigger"
        </li>
        <li>
          <strong>Secure Claim Portal with Countdown</strong><br />
          When triggered, the system sends a secure, secret-protected link to the beneficiary to access the portal within a limited time window.
        </li>
      </ul>
    </div>
  );
};

export default GoneGiftFeatures;
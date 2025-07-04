import React from "react";
import "./PrivacyPolicy.css";

const PrivacyPolicy = () => {
  return (
    <div className="privacypolicy-container">
      <h1 className="privacypolicy-title">
        Privacy Policy
      </h1>

      <p>
        At <strong>GoneGift</strong>, we respect your privacy and are committed to protecting your personal data. This policy explains what information we collect, how we use it, and your rights regarding your data.
      </p>

      <h2 className="privacypolicy-section-title">1. Information We Collect</h2>
      <p>We may collect the following information:</p>
      <ul className="privacypolicy-list">
        <li>Your name and email address when you create an account</li>
        <li>Encrypted files, messages, and other content you choose to store</li>
        <li>Information about your usage of our platform (such as logins and activity timestamps)</li>
        <li>Any beneficiary information you provide to manage your digital legacy</li>
      </ul>

      <h2 className="privacypolicy-section-title">2. How We Use Your Information</h2>
      <p>We use your data to:</p>
      <ul className="privacypolicy-list">
        <li>Provide and maintain your account</li>
        <li>Encrypt, store, and deliver your content securely</li>
        <li>Communicate with you about updates and important changes</li>
        <li>Improve our services and develop new features</li>
      </ul>

      <h2 className="privacypolicy-section-title">3. Security</h2>
      <p>
        We take security seriously. All files and messages are protected with end-to-end encryption. Only you (and any designated beneficiaries you authorize) have the keys needed to access your data.
      </p>

      <h2 className="privacypolicy-section-title">4. Sharing Your Data</h2>
      <p>
        We do not sell your data. We only share information:
      </p>
      <ul className="privacypolicy-list">
        <li>With your explicit consent</li>
        <li>With beneficiaries you have designated</li>
        <li>If required by law or to protect the rights and safety of GoneGift or others</li>
      </ul>

      <h2 className="privacypolicy-section-title">5. Cookies and Tracking</h2>
      <p>
        We currently do not use cookies for advertising or behavioral tracking. We may use minimal cookies or local storage to maintain your session and preferences. You can clear these in your browser settings.
      </p>

      <h2 className="privacypolicy-section-title">6. Your Rights</h2>
      <p>
        You have the right to:
      </p>
      <ul className="privacypolicy-list">
        <li>Access and review your personal data</li>
        <li>Correct or update information</li>
        <li>Request deletion of your account and data</li>
      </ul>
      

      <h2 className="privacypolicy-section-title">7. Changes to This Policy</h2>
      <p>
        We may update this Privacy Policy from time to time. We will notify you of any significant changes by email or through the platform.
      </p>

     

      <p className="privacypolicy-updated">
        Last updated: July 2025
      </p>
    </div>
  );
};

export default PrivacyPolicy;
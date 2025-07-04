import React from "react";
import "./UpdateAndPlan.css";

const UpdateAndPlans = () => {
  return (
    <div className="updatesplans-container">
      <h1 className="updatesplans-title">
        Update & Plans
      </h1>

      <p className="updatesplans-desc">
        At GoneGift, we are always working to improve and expand what we offer. Here are some of the upcoming plans and updates we are excited to share:
      </p>

      <ul className="updatesplans-list">
        <li>
          <strong>Will and Testament Integration:</strong> Collaboration with legal and notary services to support validated will creation and estate planning.
        </li>
        <li>
          <strong>White-Label Solutions:</strong> Tailored offerings for funeral homes, insurance providers, and legal firms.
        </li>
        <li>
          <strong>AR/VR Based Environment Space:</strong> Immersive environments where memories and messages can be experienced in virtual and augmented reality.
        </li>
      </ul>
    </div>
  );
};

export default UpdateAndPlans;
import BackButton from "../components/BackButton";

const LifeBuddyAbout = () => {
  return (
    <>
      <BackButton />
      <div className="lifebuddyabout-container">
        <h1 className="lifebuddyabout-title">What is LifeBuddy?</h1>
        <p className="lifebuddyabout-desc">
          <strong>LifeBuddy</strong> is a digital check-in system designed to monitor your well-being through periodic interactions. If you don't respond over time, your buddy status progresses through different stages to ensure you're okay.
        </p>

        <h2 className="lifebuddyabout-subtitle">How it Works:</h2>
        <ul className="lifebuddyabout-list">
          <li>
            <span className="lifebuddyabout-stage">CHILLING:</span> The default state. You're considered active. No alerts.
          </li>
          <li>
            <span className="lifebuddyabout-stage">CHILLING1:</span> After 20 days of no activity, LifeBuddy sends a first check-in message. If you don't respond, the system escalates.
          </li>
          <li>
            <span className="lifebuddyabout-stage">CURIOUS:</span> After 21 days of no activity and no response, another message is sent expressing concern.
          </li>
          <li>
            <span className="lifebuddyabout-stage">WORRIED:</span> After 22 days, LifeBuddy sends a stronger warning and checks again.
          </li>
          <li>
            <span className="lifebuddyabout-stage">GOODBYE:</span> After 23 days, LifeBuddy assumes something may have gone seriously wrong and sends a goodbye notification.
          </li>
          <li>
            <span className="lifebuddyabout-stage">Deceased Trigger:</span> If no activity even after the goodbye message and the system confirms no response, it marks you as deceased and triggers a digital death protocol.
          </li>
        </ul>

        <p className="lifebuddyabout-note">
          You can always reset your state to <span className="lifebuddyabout-stage">CHILLING</span> by interacting with LifeBuddy during any stage.
        </p>
      </div>
      <style>{`
        .lifebuddyabout-container {
          max-width: 650px;
          margin: 3rem auto;
          padding: 40px 28px;
          background: var(--bg-glass, rgba(255,255,255,0.8));
          border-radius: var(--radius-xl, 1.5rem);
          box-shadow: var(--shadow-rainbow, 0 5px 20px rgba(0,0,0,0.08));
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          border: 1px solid rgba(255,255,255,0.2);
          position: relative;
          text-align: left;
        }
        .lifebuddyabout-title {
          font-size: 2.2rem;
          font-weight: 700;
          margin-bottom: 1.2rem;
          background: linear-gradient(135deg, var(--primary, #a855f7), var(--secondary, #ec4899), var(--accent, #10b981));
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          text-shadow: 0 2px 4px rgba(0,0,0,0.08);
          text-align: center;
        }
        .lifebuddyabout-desc {
          font-size: 1.1rem;
          color: var(--text-primary, #333);
          margin-bottom: 2rem;
          text-align: center;
        }
        .lifebuddyabout-subtitle {
          font-size: 1.3rem;
          font-weight: 600;
          margin-bottom: 1rem;
          color: var(--primary, #a855f7);
        }
        .lifebuddyabout-list {
          list-style: disc inside;
          padding-left: 1.2rem;
          margin-bottom: 2rem;
        }
        .lifebuddyabout-list li {
          margin-bottom: 1.1rem;
          font-size: 1.05rem;
          color: #444;
          line-height: 1.6;
          background: rgba(168,85,247,0.04);
          border-radius: 0.7rem;
          padding: 0.7rem 1rem 0.7rem 0.7rem;
        }
        .lifebuddyabout-stage {
          font-weight: 700;
          color: var(--primary, #a855f7);
          letter-spacing: 0.5px;
        }
        .lifebuddyabout-note {
          margin-top: 2.5rem;
          font-style: italic;
          font-size: 1rem;
          color: #666;
          text-align: center;
          background: linear-gradient(90deg, #f3e8ff 0%, #fdf2f8 100%);
          border-radius: 1rem;
          padding: 1rem 1.5rem;
        }
        @media (max-width: 600px) {
          .lifebuddyabout-container {
            padding: 16px 4vw;
          }
          .lifebuddyabout-title {
            font-size: 1.3rem;
          }
          .lifebuddyabout-desc,
          .lifebuddyabout-list li,
          .lifebuddyabout-note {
            font-size: 0.97rem;
          }
        }
      `}</style>
    </>
  );
};

export default LifeBuddyAbout;
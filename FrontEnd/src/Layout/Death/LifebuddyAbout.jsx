const LifeBuddyAbout = () => {
  return (
    <div className="p-6 max-w-2xl mx-auto bg-white shadow-lg rounded-xl">
      <h1 className="text-2xl font-bold mb-4 text-center">What is LifeBuddy?</h1>
      <p className="mb-4">
        <strong>LifeBuddy</strong> is a digital check-in system designed to monitor your well-being through periodic interactions. If you don't respond over time, your buddy status progresses through different stages to ensure you're okay.
      </p>

      <h2 className="text-xl font-semibold mb-2">How it Works:</h2>
      <ul className="list-disc ml-6 space-y-2">
        <li>
          <strong>CHILLING:</strong> The default state. You're considered active. No alerts.
        </li>
        <li>
          <strong>CHILLING1:</strong> After 20 days of no activity, LifeBuddy sends a first check-in message. If you don't respond, the system escalates.
        </li>
        <li>
          <strong>CURIOUS:</strong> After 21 days of no activity and no response, another message is sent expressing concern.
        </li>
        <li>
          <strong>WORRIED:</strong> After 22 days, LifeBuddy sends a stronger warning and checks again.
        </li>
        <li>
          <strong>GOODBYE:</strong> After 23 days, LifeBuddy assumes something may have gone seriously wrong and sends a goodbye notification.
        </li>
        <li>
          <strong>Deceased Trigger:</strong> If no activity even after the goodbye message and the system confirms no response, it marks you as deceased and triggers a digital death protocol.
        </li>
      </ul>

      <p className="mt-6 italic text-sm text-gray-600">
        You can always reset your state to CHILLING by interacting with LifeBuddy during any stage.
      </p>
    </div>
  );
};

export default LifeBuddyAbout;

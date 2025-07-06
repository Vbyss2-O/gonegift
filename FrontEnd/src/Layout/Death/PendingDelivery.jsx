import BackButton from "../components/BackButton";
const PendingDelivery = () => {
    return (
        <>
        <BackButton />
        <center><div className="flex flex-col items-center justify-center h-screen bg-gray-100">
        <h1 className="text-2xl font-bold mb-4">Pending Delivery</h1>
        <p className="text-lg text-gray-700">Your delivery is on its way!</p>
        <p className="text-sm text-gray-500 mt-2">Please wait for further updates.</p>
        </div>
        </center>
        </>
    );
};
export default PendingDelivery;
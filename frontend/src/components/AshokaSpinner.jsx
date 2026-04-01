import ashokaChakra from "../assets/icons/ashoka-chakra.svg";

const loadingMessages = [
  "Shikayat dhoondh rahe hain...",
  "Aapka samadhan aa raha hai...",
  "City officer ko suchit kar rahe hain...",
];

const AshokaSpinner = ({ messageIndex = 0, size = 48, className = "" }) => {
  const safeIndex = messageIndex % loadingMessages.length;

  return (
    <div className={`flex flex-col items-center gap-3 ${className}`}>
      <img
        src={ashokaChakra}
        alt="Loading"
        className="chakra-spin"
        style={{ width: size, height: size }}
      />
      <p className="text-sm font-medium text-[#1A237E]">{loadingMessages[safeIndex]}</p>
    </div>
  );
};

export default AshokaSpinner;

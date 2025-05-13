import React, { useRef } from "react";
import ReCAPTCHA from "react-google-recaptcha";

function Recaptcha({ onChange, onExpired }) {
  const recaptchaRef = useRef(null);

  const handleExpired = () => {
    onExpired();
  };

  return (
    <div style={styles.recaptchaContainer}>
      <ReCAPTCHA
        ref={recaptchaRef}
        sitekey="6LeQYtgqAAAAAFGCH68E2ZixGjw4KraKpfRwJ6us"
        onChange={onChange}
        onExpired={handleExpired}
      />
    </div>
  );
}

export default Recaptcha;

// Styles for the reCAPTCHA container
const styles = {
  recaptchaContainer: {
    display: "flex",
    justifyContent: "center", // Center the reCAPTCHA horizontally
    margin: "5px 150px -14px", // Add margin for spacing
    transform: "scale(0.85)", // Scale down the reCAPTCHA if needed
    transformOrigin: "0 0", // Ensure scaling starts from the top-left corner
  },
};
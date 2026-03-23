import { Navigate } from "react-router-dom";

// Privacy policy content has been merged into the Terms of Service page
const PrivacyPolicy = () => {
  return <Navigate to="/terms" replace />;
};

export default PrivacyPolicy;

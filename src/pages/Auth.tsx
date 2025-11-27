import { AuthPage } from "@/components/AuthPage";
import { useNavigate } from "react-router-dom";

const Auth = () => {
  const navigate = useNavigate();

  const handleLogin = () => {
    navigate('/');
  };

  return <AuthPage onLogin={handleLogin} />;
};

export default Auth;

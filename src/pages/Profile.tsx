import { ProfileView } from "@/components/ProfileView";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";

const Profile = () => {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = () => {
    logout();
    navigate('/');
  };

  return <ProfileView onSignOut={handleSignOut} />;
};

export default Profile;

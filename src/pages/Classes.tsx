import { useAuth } from "@/contexts/AuthContext";
import { ClassesView } from "@/components/ClassesView";
import { useNavigate } from "react-router-dom";

const Classes = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const userType = user?.role || 'teacher';

  const handleClassSelect = (classId: string) => {
    navigate(`/class/${classId}`);
  };

  const handleNewClass = () => {
    navigate('/class/new');
  };

  const handleJoinClass = () => {
    navigate('/join-class');
  };

  return (
    <ClassesView
      userType={userType}
      onClassSelect={handleClassSelect}
      onNewClass={handleNewClass}
      onJoinClass={handleJoinClass}
    />
  );
};

export default Classes;

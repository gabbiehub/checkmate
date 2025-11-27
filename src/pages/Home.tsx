import { useAuth } from "@/contexts/AuthContext";
import { TeacherHome } from "@/components/TeacherHome";
import { StudentHome } from "@/components/StudentHome";
import { useNavigate } from "react-router-dom";

const Home = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const userType = user?.role || 'teacher';

  const handleClassSelect = (classId: string) => {
    navigate(`/class/${classId}`);
  };

  const handleNewClass = () => {
    navigate('/class/new');
  };

  const handleViewAllClasses = () => {
    navigate('/classes');
  };

  const handleJoinClass = () => {
    navigate('/join-class');
  };

  return userType === 'teacher' ? (
    <TeacherHome
      onClassSelect={handleClassSelect}
      onNewClass={handleNewClass}
      onViewAllClasses={handleViewAllClasses}
    />
  ) : (
    <StudentHome
      onClassSelect={handleClassSelect}
      onJoinClass={handleJoinClass}
    />
  );
};

export default Home;

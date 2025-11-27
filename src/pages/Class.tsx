import { useAuth } from "@/contexts/AuthContext";
import { ClassView } from "@/components/ClassView";
import { StudentClassView } from "@/components/StudentClassView";
import { useParams, useNavigate } from "react-router-dom";

const Class = () => {
  const { user } = useAuth();
  const { classId } = useParams<{ classId: string }>();
  const navigate = useNavigate();
  const userType = user?.role || 'teacher';

  const handleBack = () => {
    navigate('/');
  };

  if (!classId) {
    return null;
  }

  return userType === 'teacher' ? (
    <ClassView classId={classId} onBack={handleBack} />
  ) : (
    <StudentClassView classId={classId} onBack={handleBack} />
  );
};

export default Class;

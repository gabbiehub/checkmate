import { NewClassForm } from "@/components/NewClassForm";
import { useNavigate } from "react-router-dom";

const NewClass = () => {
  const navigate = useNavigate();

  const handleBack = () => {
    navigate('/classes');
  };

  const handleClassCreated = (classId: string) => {
    navigate(`/class/${classId}`);
  };

  return (
    <NewClassForm
      onBack={handleBack}
      onClassCreated={handleClassCreated}
    />
  );
};

export default NewClass;

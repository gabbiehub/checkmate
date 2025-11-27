import { useState } from "react";
import { JoinClassDialog } from "@/components/JoinClassDialog";
import { useNavigate } from "react-router-dom";

const JoinClass = () => {
  const navigate = useNavigate();
  const [open, setOpen] = useState(true);

  const handleClassJoined = (classId: string) => {
    navigate(`/class/${classId}`);
  };

  const handleOpenChange = (isOpen: boolean) => {
    setOpen(isOpen);
    if (!isOpen) {
      navigate(-1); // Go back to previous page
    }
  };

  return (
    <JoinClassDialog
      open={open}
      onOpenChange={handleOpenChange}
      onClassJoined={handleClassJoined}
    />
  );
};

export default JoinClass;

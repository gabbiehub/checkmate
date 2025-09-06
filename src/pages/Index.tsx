import { TeacherHome } from "@/components/TeacherHome";
import { ClassView } from "@/components/ClassView";
import { NewClassForm } from "@/components/NewClassForm";
import { CalendarView } from "@/components/CalendarView";
import { AnalyticsView } from "@/components/AnalyticsView";
import { ProfileView } from "@/components/ProfileView";
import { BottomNav } from "@/components/BottomNav";
import { useState } from "react";

const Index = () => {
  const [activeTab, setActiveTab] = useState("home");
  const [selectedClass, setSelectedClass] = useState<string | null>(null);
  const [showNewClassForm, setShowNewClassForm] = useState(false);

  const handleClassSelect = (classId: string) => {
    setSelectedClass(classId);
    setShowNewClassForm(false);
  };

  const handleBackToHome = () => {
    setSelectedClass(null);
    setActiveTab("home");
    setShowNewClassForm(false);
  };

  const handleNewClass = () => {
    setShowNewClassForm(true);
    setSelectedClass(null);
  };

  const handleBackFromNewClass = () => {
    setShowNewClassForm(false);
  };

  const handleClassCreated = (classId: string) => {
    setShowNewClassForm(false);
    setSelectedClass(classId);
  };

  const renderContent = () => {
    if (showNewClassForm) {
      return <NewClassForm onBack={handleBackFromNewClass} onClassCreated={handleClassCreated} />;
    }

    if (selectedClass) {
      return <ClassView classId={selectedClass} onBack={handleBackToHome} />;
    }

    switch (activeTab) {
      case "home":
        return <TeacherHome onClassSelect={handleClassSelect} onNewClass={handleNewClass} />;
      case "classes":
        return <div className="min-h-screen bg-background flex items-center justify-center pb-20">
          <p className="text-muted-foreground">Classes view coming soon...</p>
        </div>;
      case "calendar":
        return <CalendarView />;
      case "analytics":
        return <AnalyticsView />;
      case "profile":
        return <ProfileView />;
      default:
        return <TeacherHome onClassSelect={handleClassSelect} onNewClass={handleNewClass} />;
    }
  };

  return (
    <div className="relative">
      {renderContent()}
      {!selectedClass && !showNewClassForm && <BottomNav activeTab={activeTab} onTabChange={setActiveTab} />}
    </div>
  );
};

export default Index;

import { TeacherHome } from "@/components/TeacherHome";
import { BottomNav } from "@/components/BottomNav";
import { useState } from "react";

const Index = () => {
  const [activeTab, setActiveTab] = useState("home");

  const renderContent = () => {
    switch (activeTab) {
      case "home":
        return <TeacherHome />;
      case "classes":
        return <div className="min-h-screen bg-background flex items-center justify-center pb-20">
          <p className="text-muted-foreground">Classes view coming soon...</p>
        </div>;
      case "calendar":
        return <div className="min-h-screen bg-background flex items-center justify-center pb-20">
          <p className="text-muted-foreground">Calendar view coming soon...</p>
        </div>;
      case "analytics":
        return <div className="min-h-screen bg-background flex items-center justify-center pb-20">
          <p className="text-muted-foreground">Analytics view coming soon...</p>
        </div>;
      case "profile":
        return <div className="min-h-screen bg-background flex items-center justify-center pb-20">
          <p className="text-muted-foreground">Profile view coming soon...</p>
        </div>;
      default:
        return <TeacherHome />;
    }
  };

  return (
    <div className="relative">
      {renderContent()}
      <BottomNav activeTab={activeTab} onTabChange={setActiveTab} />
    </div>
  );
};

export default Index;

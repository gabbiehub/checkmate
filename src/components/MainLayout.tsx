import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { BottomNav } from "@/components/BottomNav";

const MainLayout = () => {
  const location = useLocation();
  const navigate = useNavigate();

  // Determine active tab from current path
  const getActiveTab = () => {
    if (location.pathname === '/' || location.pathname === '/home') return 'home';
    if (location.pathname.startsWith('/classes')) return 'classes';
    if (location.pathname.startsWith('/calendar')) return 'calendar';
    if (location.pathname.startsWith('/analytics')) return 'analytics';
    if (location.pathname.startsWith('/profile')) return 'profile';
    return 'home';
  };

  const handleTabChange = (tab: string) => {
    switch (tab) {
      case 'home':
        navigate('/');
        break;
      case 'classes':
        navigate('/classes');
        break;
      case 'calendar':
        navigate('/calendar');
        break;
      case 'analytics':
        navigate('/analytics');
        break;
      case 'profile':
        navigate('/profile');
        break;
    }
  };

  // Hide bottom nav on certain pages
  const hideBottomNav = location.pathname.startsWith('/class/') || 
                        location.pathname === '/auth' ||
                        location.pathname === '/join-class';

  return (
    <div className="relative">
      <Outlet />
      {!hideBottomNav && (
        <BottomNav 
          activeTab={getActiveTab()} 
          onTabChange={handleTabChange} 
        />
      )}
    </div>
  );
};

export default MainLayout;

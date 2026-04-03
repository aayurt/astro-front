import React from 'react';
import { Tabbar, TabbarLink } from 'konsta/react';
import { LayoutDashboard, Bot, Star, RefreshCw, User } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';

const BottomNav = () => {
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <Tabbar labels={true} icons={true} className="left-0 bottom-0 fixed w-full z-50 bg-white p-0">
      <TabbarLink
        active={location.pathname === '/dashboard'}
        onClick={() => navigate('/dashboard')}
        icon={<LayoutDashboard className="w-6 h-6" />}
        label="Dashboard"
      />
      <TabbarLink
        active={location.pathname === '/ai'}
        onClick={() => navigate('/ai')}
        icon={<Bot className="w-6 h-6" />}
        label="AI"
      />
      <TabbarLink
        active={location.pathname === '/birth-chart'}
        onClick={() => navigate('/birth-chart')}
        icon={<Star className="w-6 h-6" />}
        label="Chart"
      />
      <TabbarLink
        active={location.pathname === '/transit'}
        onClick={() => navigate('/transit')}
        icon={<RefreshCw className="w-6 h-6" />}
        label="Transit"
      />
      <TabbarLink
        active={location.pathname === '/profile'}
        onClick={() => navigate('/profile')}
        icon={<User className="w-6 h-6" />}
        label="Profile"
      />
    </Tabbar>
  );
};

export default BottomNav;

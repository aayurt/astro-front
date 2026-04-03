import React from 'react';
import { Outlet } from 'react-router-dom';
import BottomNav from './BottomNav';

const MainLayout = () => {
  return (
    <div className="flex flex-col h-screen overflow-hidden">
      <div className="flex-1 overflow-auto relative">
        <Outlet />
      </div>
      <div>
        <BottomNav />
      </div>
    </div>
  );
};

export default MainLayout;

import React from 'react';
import { useApp } from '../../context/AppContext';
import { CommunityHomeView } from './home/CommunityHomeView';
import { VolunteerHomeView } from './home/VolunteerHomeView';
import { AdminHomeView } from './home/AdminHomeView';

export const HomeScreen: React.FC = () => {
  const { userRole } = useApp();

  return (
    <div className="flex-1 w-full max-w-xl mx-auto px-4 pt-3 pb-6 space-y-4">
      {/* Render Role-Specific Divided Home Page */}
      {userRole === 'community' && <CommunityHomeView />}
      {userRole === 'volunteer' && <VolunteerHomeView />}
      {userRole === 'admin' && <AdminHomeView />}
    </div>
  );
};

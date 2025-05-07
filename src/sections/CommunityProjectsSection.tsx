import React, { useState } from 'react';
import { CommunityProjectsList } from '../components/CommunityProjectsList';
import { useAuth } from '../lib/auth'; // Import useAuth

const CommunityProjectsSection: React.FC = () => {
  const { user } = useAuth(); // Get user from auth context
  const [refreshKey, setRefreshKey] = useState(0);

  // const triggerRefresh = () => setRefreshKey(prev => prev + 1);

  if (!user) {
    // Optionally, handle the case where there's no user (e.g., show a message or redirect)
    return <p>Please log in to view community projects.</p>; 
  }

  return (
    <div>
      <CommunityProjectsList
        currentUserId={user.id} // Pass the user's ID
        refreshKey={refreshKey}
        // newProjectId={null} 
      />
    </div>
  );
};

export default CommunityProjectsSection;

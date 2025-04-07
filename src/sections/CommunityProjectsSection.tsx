import React, { useState } from 'react';
import { CommunityProjectsList } from '../components/CommunityProjectsList'; // Import the new list component

const CommunityProjectsSection: React.FC = () => {
  // refreshKey might be needed if there are actions outside the list that should trigger a refresh
  const [refreshKey, setRefreshKey] = useState(0);

  // In a real app, you might pass down a function to trigger refresh, e.g., after liking a project
  // const triggerRefresh = () => setRefreshKey(prev => prev + 1);

  return (
    <div>
      {/* You can add filters or other controls specific to the community view here if needed */}
      <CommunityProjectsList
        refreshKey={refreshKey}
        // newProjectId={null} // Pass if needed for highlighting specific projects
      />
    </div>
  );
};

export default CommunityProjectsSection;

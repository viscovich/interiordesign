import React from 'react';
import { ProjectsList } from '../components/ProjectsList';
import { User } from '@supabase/supabase-js';

interface ProjectsSectionProps {
  user: User;
  onModifyProject: (project: any) => void;
  refreshKey: number; // Add refreshKey prop
}

export default function ProjectsSection({
  user,
  onModifyProject,
  refreshKey // Destructure refreshKey
}: ProjectsSectionProps) {
  return (
    <section className="py-20">
      <div className="container max-w-8xl mx-auto px-4">
        <ProjectsList
          user={user}
          onModifyProject={onModifyProject}
          refreshKey={refreshKey} // Pass refreshKey down
        />
      </div>
    </section>
  );
}

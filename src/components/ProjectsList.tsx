import { useState, useEffect } from 'react';
import type { Project } from '../lib/projectsService.d';
import type { User } from '@supabase/supabase-js';
import { getProjectsByUser } from '../lib/projectsService';
import toast from 'react-hot-toast';

interface ProjectsListProps {
  user: User | null;
  onProjectSelect: (project: Project) => void;
}

export function ProjectsList({ user, onProjectSelect }: ProjectsListProps) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      setLoading(true);
      getProjectsByUser(user.id)
        .then(setProjects)
        .catch((error: Error) => {
          toast.error('Failed to load projects');
          console.error(error);
        })
        .finally(() => setLoading(false));
    }
  }, [user]);

  if (!user) {
    return <p>Please sign in to view your projects</p>;
  }

  if (loading) {
    return <p>Loading projects...</p>;
  }

  return (
    <div className="projects-list">
      {projects.length === 0 ? (
        <p>No projects found</p>
      ) : (
        <ul className="space-y-2">
          {projects.map((project) => (
            <li 
              key={project.id}
              className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer"
              onClick={() => onProjectSelect(project)}
            >
              <div className="flex justify-between">
                <span className="font-medium">{project.roomType} - {project.style}</span>
                <span className="text-gray-500 text-sm">
                  {new Date(project.createdAt).toLocaleDateString()}
                </span>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

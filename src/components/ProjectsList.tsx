import { useState, useEffect } from 'react';
import type { Project } from '../lib/projectsService.d';
import type { User } from '@supabase/supabase-js';
import { getProjectsByUser, deleteProject } from '../lib/projectsService';
import toast from 'react-hot-toast';
import { ProjectModal } from './ProjectModal';
import { TrashIcon, PencilSquareIcon } from '@heroicons/react/24/outline';

interface ProjectsListProps {
  user: User | null;
  onModifyProject: (project: Project) => void;
}

export function ProjectsList({ user, onModifyProject }: ProjectsListProps) {
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
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

  const handleDeleteProject = async (project: Project) => {
    if (!window.confirm('Are you sure you want to delete this project?')) {
      return;
    }

    try {
      // Delete from Supabase
      await deleteProject(project.id);
      
      // Update local state
      setProjects(projects.filter(p => p.id !== project.id));
      toast.success('Project metadata deleted (S3 cleanup pending)');
    } catch (error) {
      toast.error('Failed to delete project');
      console.error(error);
    }
  };

  return (
    <div className="projects-list">
      <h2 className="text-2xl font-bold mb-6">My Projects</h2>
      {projects.length === 0 ? (
        <p>No projects found</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {projects.map((project) => (
            <div
              key={project.id}
              className="relative p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleDeleteProject(project);
                }}
                className="absolute top-2 right-2 p-1 text-gray-400 hover:text-red-600 transition-colors z-10" // Adjusted padding/color
                aria-label="Delete project"
              >
                <TrashIcon className="w-5 h-5" />
              </button>
              {/* Add Modify Button - Placed correctly as sibling */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onModifyProject(project);
                }}
                className="absolute top-2 right-10 p-1 text-gray-400 hover:text-blue-600 transition-colors z-10" // Adjusted padding/color
                aria-label="Modify project"
              >
                <PencilSquareIcon className="w-5 h-5" />
              </button>
              {/* Main clickable area for viewing details */}
              <div
                className="cursor-pointer"
                onClick={() => setSelectedProject(project)}
              >
                <div className="flex flex-col space-y-2">
                  {project.generated_image_url && (
                    <img 
                      src={project.generated_image_url} 
                      alt={`Generated ${project.room_type}`}
                      className="w-full h-48 object-cover rounded-lg mb-2"
                    />
                  )}
                  <div className="space-y-1">
                    <h3 className="font-bold text-lg">{project.room_type}</h3>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-700">{project.style}</span>
                      <span className="text-gray-500 text-sm">
                        {project.created_at ? new Date(project.created_at).toLocaleDateString() : ''}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      <ProjectModal 
        project={selectedProject}
        onClose={() => setSelectedProject(null)}
      />
    </div>
  );
}

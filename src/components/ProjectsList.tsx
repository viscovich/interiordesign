import { useState, useEffect } from 'react';
import type { Project, PaginatedProjects } from '../lib/projectsService.d';
import type { User } from '@supabase/supabase-js';
import { getProjectsByUser, deleteProject } from '../lib/projectsService';
import toast from 'react-hot-toast';
import { ProjectModal } from './ProjectModal';
import { TrashIcon, PencilSquareIcon, EyeIcon } from '@heroicons/react/24/outline';

interface ProjectsListProps {
  user: User | null;
  onModifyProject: (project: Project) => void;
  refreshKey: number;
  newProjectId?: string | null;
}

export function ProjectsList({ user, onModifyProject, refreshKey, newProjectId }: ProjectsListProps) {
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [paginatedProjects, setPaginatedProjects] = useState<PaginatedProjects>({
    projects: [],
    total: 0,
    page: 1,
    perPage: 6
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      setLoading(true);
      getProjectsByUser(user.id, paginatedProjects.page, paginatedProjects.perPage)
        .then(projects => {
          setPaginatedProjects(projects);
          // Auto-open details for new project if it exists in the list
          if (newProjectId && projects.projects.some(p => p.id === newProjectId)) {
            const project = projects.projects.find(p => p.id === newProjectId);
            if (project) setSelectedProject(project);
          }
        })
        .catch((error: Error) => {
          toast.error('Failed to load projects');
          console.error(error);
        })
        .finally(() => setLoading(false));
    }
  }, [user, paginatedProjects.page, refreshKey, newProjectId]);

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
      console.log('Attempting to delete project:', project.id);
      await deleteProject(project.id);
      console.log('Delete successful, updating UI state');
      setPaginatedProjects(prev => ({
        ...prev,
        projects: prev.projects.filter(p => p.id !== project.id),
        total: prev.total - 1
      }));
      toast.success('Project deleted successfully');
    } catch (error) {
      console.error('Full delete error:', error);
      toast.error('Failed to delete project - see console for details');
    }
  };

  const handlePageChange = (newPage: number) => {
    setPaginatedProjects(prev => ({ ...prev, page: newPage }));
  };

  return (
    <div className="projects-list">
      <h2 className="text-2xl font-bold mb-6">My Projects</h2>
      {paginatedProjects.projects.length === 0 ? (
        <p>No projects found</p>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {paginatedProjects.projects.map((project) => (
              <div
                key={project.id}
                className="relative p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
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
                      <div className="flex justify-between items-center">
                        <h3 className="font-bold text-lg">{project.room_type}</h3>
                        <div className="flex space-x-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedProject(project);
                            }}
                            className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
                            aria-label="View project details"
                          >
                            <EyeIcon className="w-5 h-5" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onModifyProject(project);
                            }}
                            className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
                            aria-label="Modify project"
                          >
                            <PencilSquareIcon className="w-5 h-5" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteProject(project);
                            }}
                            className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                            aria-label="Delete project"
                          >
                            <TrashIcon className="w-5 h-5" />
                          </button>
                        </div>
                      </div>
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
          <div className="flex justify-center mt-6 gap-2">
            {Array.from({ length: Math.ceil(paginatedProjects.total / paginatedProjects.perPage) }, (_, i) => (
              <button
                key={i + 1}
                onClick={() => handlePageChange(i + 1)}
                className={`px-3 py-1 rounded ${paginatedProjects.page === i + 1 ? 'bg-black text-white' : 'bg-gray-200'}`}
              >
                {i + 1}
              </button>
            ))}
          </div>
        </>
      )}
      <ProjectModal 
        project={selectedProject}
        onClose={() => setSelectedProject(null)}
      />
    </div>
  );
}

import { useState, useEffect } from 'react';
import type { Project, PaginatedProjects } from '../lib/projectsService.d';
// Removed User import as it's not needed here
import { getAllProjects } from '../lib/projectsService'; // Import getAllProjects
import toast from 'react-hot-toast';
import { ProjectModal } from './ProjectModal';
import { EyeIcon } from '@heroicons/react/24/outline'; // Only EyeIcon needed

interface CommunityProjectsListProps {
  // Removed user and onModifyProject props
  refreshKey: number;
  newProjectId?: string | null; // Keep this for potential highlighting? Or remove? Let's keep for now.
}

export function CommunityProjectsList({ refreshKey, newProjectId }: CommunityProjectsListProps) {
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [paginatedProjects, setPaginatedProjects] = useState<PaginatedProjects>({
    projects: [],
    total: 0,
    page: 1,
    perPage: 6
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Removed user check
    setLoading(true);
    getAllProjects(paginatedProjects.page, paginatedProjects.perPage) // Call getAllProjects
      .then(projects => {
        setPaginatedProjects(projects);
        // Keep auto-open logic for potential future use or highlighting
        if (newProjectId && projects.projects.some(p => p.id === newProjectId)) {
          const project = projects.projects.find(p => p.id === newProjectId);
          if (project) setSelectedProject(project);
        }
      })
      .catch((error: Error) => {
        toast.error('Failed to load community projects'); // Updated error message
        console.error(error);
      })
      .finally(() => setLoading(false));
    // Removed user dependency
  }, [paginatedProjects.page, refreshKey, newProjectId]);

  // Removed user check for rendering
  // if (!user) {
  //   return <p>Please sign in to view your projects</p>;
  // }

  if (loading) {
    return <p>Loading community projects...</p>; // Updated loading message
  }

  // Removed handleDeleteProject function

  const handlePageChange = (newPage: number) => {
    setPaginatedProjects(prev => ({ ...prev, page: newPage }));
  };

  return (
    <div className="projects-list p-8"> {/* Added padding like UserObjectsManager */}
      <h2 className="text-2xl font-bold mb-6">Community Projects</h2> {/* Changed title */}
      {paginatedProjects.projects.length === 0 ? (
        <p>No community projects found</p> // Updated empty message
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
                          {/* View Button Only */}
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
                          {/* Removed Modify and Delete buttons */}
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
          {/* Pagination */}
          {paginatedProjects.total > paginatedProjects.perPage && (
             <div className="flex justify-center mt-6 gap-2">
               {Array.from({ length: Math.ceil(paginatedProjects.total / paginatedProjects.perPage) }, (_, i) => (
                 <button
                   key={i + 1}
                   onClick={() => handlePageChange(i + 1)}
                   className={`px-3 py-1 rounded ${paginatedProjects.page === i + 1 ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
                 >
                   {i + 1}
                 </button>
               ))}
             </div>
          )}
        </>
      )}
      {/* Project Modal remains the same */}
      <ProjectModal
        project={selectedProject}
        onClose={() => setSelectedProject(null)}
      />
    </div>
  );
}

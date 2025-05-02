import { useState, useEffect } from 'react';
import { ImageLoader } from './ImageLoader';
import type { Project, PaginatedProjects } from '../lib/projectsService.d';
import type { User } from '@supabase/supabase-js';
import { getProjectsByUser, deleteProject } from '../lib/projectsService';
import toast from 'react-hot-toast';
import { ProjectModal } from './ProjectModal';
// Import ArrowPathIcon for refresh
import { TrashIcon, PencilSquareIcon, PhotoIcon, ArrowDownTrayIcon, ArrowPathIcon } from '@heroicons/react/24/outline';
import ImageFullscreenModal from './ImageFullscreenModal';
import { ImageComparison } from './ImageComparison';

interface ProjectsListProps {
  user: User | null;
  onModifyProject: (project: Project) => void;
  refreshKey: number;
  newProjectId?: string | null;
}

export function ProjectsList({ user, onModifyProject, refreshKey, newProjectId }: ProjectsListProps) {
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [fullscreenImageUrl, setFullscreenImageUrl] = useState<string | null>(null);
  const [showComparison, setShowComparison] = useState(false);
  const [comparisonImages, setComparisonImages] = useState<{original: string; generated: string} | null>(null);
  const [paginatedProjects, setPaginatedProjects] = useState<PaginatedProjects>({
    projects: [],
    total: 0,
    page: 1,
    perPage: 6
  });
  const [loading, setLoading] = useState(false);
  const [internalRefreshKey, setInternalRefreshKey] = useState(0); // State for manual refresh

  const triggerRefresh = () => setInternalRefreshKey(prev => prev + 1); // Handler for refresh button

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
    // Add internalRefreshKey to dependencies
  }, [user, paginatedProjects.page, refreshKey, newProjectId, internalRefreshKey]);

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

  // Download image utility
  const handleDownloadImage = async (imageUrl: string, filename: string) => {
    try {
      // Try fetch as blob (works for same-origin or CORS-enabled)
      const response = await fetch(imageUrl, { mode: "cors" });
      if (!response.ok) throw new Error("Network error");
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = blobUrl;
      link.download = filename;
      link.style.display = "none";
      document.body.appendChild(link);
      link.click();
      setTimeout(() => {
        document.body.removeChild(link);
        window.URL.revokeObjectURL(blobUrl);
      }, 100);
    } catch (error) {
      // Fallback: open image in new tab for manual download
      window.open(imageUrl, "_blank", "noopener");
      toast("Immagine aperta in una nuova scheda per il download manuale.", { icon: "⬇️" });
    }
  };

  return (
    <div className="projects-list">
      <h2 className="text-2xl font-bold mb-6">My Projects</h2>
      {paginatedProjects.projects.length === 0 ? (
        <p>No projects found</p>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Replace the entire map callback content */}
            {paginatedProjects.projects.map((project) => (
              <div
                key={project.id}
                className="relative p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors flex flex-col" // Added flex flex-col
              >
                {/* Conditional Rendering based on status */}
                {project.stato_generazione === 'pending' ? (
                  <div className="w-full h-48 flex flex-col items-center justify-center border border-gray-200 rounded-lg bg-gray-50 text-center p-4 mb-2">
                    <p className="text-sm text-gray-600 mb-2">Generation in progress</p>
                    <button
                      onClick={(e) => { e.stopPropagation(); triggerRefresh(); }}
                      className="p-2 text-gray-500 hover:text-black transition-colors"
                      aria-label="Refresh status"
                    >
                      <ArrowPathIcon className="w-6 h-6" />
                    </button>
                  </div>
                ) : (
                  <ImageLoader
                    src={project.thumbnail_url || project.generated_image_url || ''}
                    alt={`Generated ${project.room_type}`}
                    className="w-full h-48 object-cover rounded-lg mb-2 cursor-pointer"
                    onClick={(e) => {
                      e.stopPropagation();
                      // Only allow fullscreen if image exists
                      if (project.generated_image_url || project.original_image_url) {
                        setFullscreenImageUrl(project.generated_image_url || project.original_image_url || '');
                      }
                    }}
                  />
                )}
                {/* Project details below image/placeholder */}
                <div
                  className="cursor-pointer mt-auto" // Added mt-auto to push details down
                  onClick={() => setSelectedProject(project)}
                >
                  <div className="space-y-1">
                    <div className="flex justify-between items-center">
                      <h3 className="font-bold text-lg">{project.room_type}</h3>
                      {/* Action Buttons */}
                      <div className="flex space-x-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setComparisonImages({
                              original: project.original_image_url || '',
                              generated: project.generated_image_url || ''
                            });
                            setShowComparison(true);
                          }}
                          className="p-1 text-gray-400 hover:text-green-600 transition-colors"
                          aria-label="Compare original and generated images"
                          // Disable compare if generated doesn't exist yet
                          disabled={!project.generated_image_url}
                        >
                          <PhotoIcon className="w-5 h-5" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDownloadImage(
                              project.generated_image_url || '',
                              `${project.room_type || 'project'}_generated.jpg`
                            );
                          }}
                          className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
                          aria-label="Download generated image"
                          disabled={!project.generated_image_url}
                        >
                          <ArrowDownTrayIcon className="w-5 h-5" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onModifyProject(project); // Opens modification modal
                          }}
                          className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
                          aria-label="Modify project"
                          // Disable modify if generation is pending? Or allow modification based on original? Let's allow it.
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
                    {/* Style and Date */}
                    <div className="flex justify-between items-center">
                      <span className="text-gray-700">{project.style}</span>
                      <span className="text-gray-500 text-sm">
                        {project.created_at ? new Date(project.created_at).toLocaleDateString() : ''}
                      </span>
                    </div>
                    {/* Optionally show error message if generation failed */}
                    {project.stato_generazione === 'failed' && (
                      <p className="text-xs text-red-500 mt-1 truncate" title={project.generation_error || 'Generation failed'}>
                        Error: {project.generation_error || 'Generation failed'}
                      </p>
                    )}
                  </div>
                </div>
              </div> // End of the main div for the project card
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
      {fullscreenImageUrl && (
        <ImageFullscreenModal
          imageUrl={fullscreenImageUrl}
          onClose={() => setFullscreenImageUrl(null)}
        />
      )}
      {showComparison && comparisonImages && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div className="relative w-full max-w-5xl">
            <button 
              onClick={() => setShowComparison(false)}
              className="absolute -top-10 right-0 text-white hover:text-gray-300"
            >
              ✕ Close
            </button>
            <ImageComparison 
              originalImage={comparisonImages.original}
              generatedImage={comparisonImages.generated}
              className="max-h-[90vh]"
            />
          </div>
        </div>
      )}
    </div>
  );
}

import type { Project } from '../lib/projectsService.d';

interface ProjectDetailsProps {
  project: Project;
  onBack: () => void;
}

export function ProjectDetails({ project, onBack }: ProjectDetailsProps) {

  return (
    <div className="project-details space-y-4">
      <button 
        onClick={onBack}
        className="text-blue-600 hover:text-blue-800 mb-4"
      >
        &larr; Back to projects
      </button>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div>
          <h2 className="text-2xl font-bold mb-2">Original Design</h2>
          <img 
            src={project.originalImageUrl} 
            alt="Original design" 
            className="rounded-lg shadow-md w-full"
          />
        </div>
        <div>
          <h2 className="text-2xl font-bold mb-2">Generated Design</h2>
          <img 
            src={project.generatedImageUrl} 
            alt="Generated design" 
            className="rounded-lg shadow-md w-full"
          />
        </div>
      </div>

      <div className="mt-6">
        <h3 className="text-xl font-semibold mb-2">Design Details</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-gray-600">Room Type</p>
            <p className="font-medium">{project.roomType}</p>
          </div>
          <div>
            <p className="text-gray-600">Style</p>
            <p className="font-medium">{project.style}</p>
          </div>
          <div>
            <p className="text-gray-600">Created</p>
            <p className="font-medium">
              {new Date(project.createdAt).toLocaleDateString()}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

import { useState } from 'react';

interface Project {
  id: string;
  name: string;
  description: string;
  createdAt: string;
  updatedAt: string;
}

export function ProjectDetails() {
  const [project, setProject] = useState<Project | null>(null);

  return (
    <div className="project-details">
      {project ? (
        <>
          <h2>{project.name}</h2>
          <p>{project.description}</p>
          <div className="project-meta">
            <span>Created: {new Date(project.createdAt).toLocaleDateString()}</span>
            <span>Updated: {new Date(project.updatedAt).toLocaleDateString()}</span>
          </div>
        </>
      ) : (
        <p>Select a project to view details</p>
      )}
    </div>
  );
}

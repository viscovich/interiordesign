import { useState } from 'react';

interface Project {
  id: string;
  name: string;
  createdAt: string;
}

export function ProjectsList() {
  const [projects, setProjects] = useState<Project[]>([]);

  return (
    <div className="projects-list">
      {projects.length === 0 ? (
        <p>No projects found</p>
      ) : (
        <ul>
          {projects.map((project) => (
            <li key={project.id}>
              {project.name} - {new Date(project.createdAt).toLocaleDateString()}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

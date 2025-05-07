// This file now acts as an aggregator for project-related services.
// It re-exports functions from more specific service files.

// Import and re-export all type definitions from projectsService.d
export * from './projectsService.d';

// Re-export functions from projectOperations.ts
export {
  getProjects,
  getProjectsByUser,
  getAllProjects,
  getCommunityProjects, // Add this line
  createProject,
  deleteProject
} from './projectOperations';

// Re-export functions from imageObjectService.ts
export {
  getImageObjects,
  saveImageObjects,
  saveDetectedObjects
} from './imageObjectService';

// Re-export functions from generationService.ts
export {
  regenerateImageWithSubstitution,
  createProjectForAsyncGeneration
} from './generationService';

// Re-export functions from userObjectsService.ts
// Note: getUserObjects and addUserObject were originally in this file
// but have been consolidated into userObjectsService.ts
export {
  getUserObjects,
  addUserObject,
  searchObjects, // Assuming this was intended to be accessible via projectsService too
  deleteUserObject
} from './userObjectsService';

// Any other shared utilities or constants related to projects could go here,
// but most logic has been moved to specialized files.

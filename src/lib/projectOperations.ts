import { supabase } from './supabase';
import type { PaginatedProjects, Project } from './projectsService.d';

export async function getProjects(): Promise<Project[] | null> {
  const { data, error } = await supabase
    .from('projects')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching projects:', error);
    throw error;
  }
  console.log('Fetched projects with fields:', data?.map(p => ({
    id: p.id,
    hasViewType: !!p.view_type,
    hasColorTone: !!p.color_tone
  })));
  return data;
}

export async function getProjectsByUser(userId: string, page: number = 1, perPage: number = 6): Promise<PaginatedProjects> {
  const from = (page - 1) * perPage;
  const to = from + perPage - 1;

  const { data, error, count } = await supabase
    .from('projects')
    .select('*', { count: 'exact' })
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .range(from, to);

  if (error) throw error;

  return {
    projects: data || [], // Ensure projects is always an array
    total: count || 0,
    page,
    perPage
  } as PaginatedProjects;
}

export const getAllProjects = async (page: number = 1, perPage: number = 6): Promise<PaginatedProjects> => {
  const from = (page - 1) * perPage;
  const to = from + perPage - 1;

  const { data, error, count } = await supabase
    .from('projects')
    .select('*', { count: 'exact' })
    // No user filter here
    .order('created_at', { ascending: false })
    .range(from, to);

  if (error) {
    console.error('Error fetching all projects:', error);
    throw error;
  }

  return {
    projects: data || [],
    total: count || 0,
    page,
    perPage
  };
};

export async function getCommunityProjects(currentUserId: string, page: number = 1, perPage: number = 6): Promise<PaginatedProjects> {
  const from = (page - 1) * perPage;
  const to = from + perPage - 1;

  const { data, error, count } = await supabase
    .from('projects')
    .select('*', { count: 'exact' })
    .neq('user_id', currentUserId) // Exclude projects by the current user
    .eq('stato_generazione', 'completed') // Only include completed projects
    .order('created_at', { ascending: false })
    .range(from, to);

  if (error) {
    console.error('Error fetching community projects:', error);
    throw error;
  }

  return {
    projects: data || [],
    total: count || 0,
    page,
    perPage
  };
}

export async function createProject(
  userId: string,
  originalImageUrl: string,
  generatedImageUrl: string,
  style: string,
  roomType: string,
  description: string | null = null,
  viewType: string | null = null,
  colorTone: string | null = null,
  thumbnailUrl: string,
  inputImageUrlForVariant?: string | null
): Promise<Project> {
  const urlToSaveAsOriginal = inputImageUrlForVariant ?? originalImageUrl;

  const { data, error } = await supabase
    .from('projects')
    .insert({
      user_id: userId,
      original_image_url: urlToSaveAsOriginal,
      generated_image_url: generatedImageUrl,
      style,
      room_type: roomType,
      description,
      view_type: viewType,
      color_tone: colorTone,
      thumbnail_url: thumbnailUrl
    })
    .select()
    .single();

  if (error) throw error;
  if (!data) throw new Error('Failed to create project: No data returned.'); // Ensure data is returned
  return data;
}

export async function deleteProject(projectId: string): Promise<void> {
  console.log('Deleting project:', projectId);
  
  const { data, error } = await supabase
    .from('projects')
    .delete()
    .eq('id', projectId)
    .select(); // Select to check if data was returned, though not strictly necessary for delete

  if (error) {
    console.error('Delete failed:', { projectId, error });
    throw error;
  }

  console.log('Delete result:', { 
    projectId, 
    deletedCount: data?.length || 0 
  });
}

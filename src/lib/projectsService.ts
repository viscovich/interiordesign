import { supabase } from './supabase';
import { ImageObject, UserObject, PaginatedProjects, Project } from './projectsService.d';
import { uploadImage } from './storage';
import { getNewGenerationPrompt, urlToInlineDataPart, generateObjectDescription } from './gemini';
import { useCredit } from './userService';

export const getAllProjects = async (
  page: number = 1, 
  perPage: number = 6,
  excludeUserId?: string
): Promise<PaginatedProjects> => {
  const from = (page - 1) * perPage;
  const to = from + perPage - 1;

  console.log(`[getAllProjects] Called with page: ${page}, perPage: ${perPage}, excludeUserId: ${excludeUserId}`);

  let queryBuilder = supabase
    .from('projects')
    .select('*', { count: 'exact' })
    .eq('stato_generazione', 'completed') // Filter for completed projects
    .order('created_at', { ascending: false });

  if (excludeUserId && typeof excludeUserId === 'string' && excludeUserId.length > 0) {
    console.log(`[getAllProjects] Applying filter: user_id NOT EQUAL TO ${excludeUserId}`);
    queryBuilder = queryBuilder.not('user_id', 'eq', excludeUserId);
  } else {
    console.log(`[getAllProjects] Not applying user exclusion filter. excludeUserId: ${excludeUserId}`);
  }

  const { data, error, count } = await queryBuilder.range(from, to);

  if (error) {
    console.error('[getAllProjects] Error fetching projects:', error);
    throw error;
  }

  return {
    projects: data || [],
    total: count || 0,
    page,
    perPage
  };
};

// Rest of the file remains unchanged

export interface Project {
  id: string;
  user_id: string;
  original_image_url: string;
  generated_image_url: string | null;
  style: string;
  room_type: string;
  description: string | null;
  view_type: string | null;
  color_tone: string | null;
  created_at: string;
  updated_at: string;
}

export interface PaginatedProjects {
  projects: Project[];
  total: number;
  page: number;
  perPage: number;
}

export interface UserObject {
  id: string; // Corresponds to UUID
  user_id: string; // Corresponds to UUID
  object_name: string; // Corresponds to TEXT
  object_type: string; // Corresponds to TEXT (e.g., 'Refrigerator', 'Chair')
  asset_url: string; // Corresponds to TEXT (URL)
  thumbnail_url?: string | null; // Corresponds to TEXT (URL), optional
  dimensions?: string | null; // Corresponds to TEXT, optional
  created_at: string; // Corresponds to TIMESTAMPTZ
}

export interface ImageObject {
  id: string; // Corresponds to UUID
  project_id: string; // Corresponds to UUID
  user_id: string; // Corresponds to UUID
  object_name: string; // Corresponds to TEXT (Name from Gemini)
  created_at: string; // Corresponds to TIMESTAMPTZ
}

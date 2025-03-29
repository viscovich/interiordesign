export interface Project {
  id: string;
  user_id: string;
  original_image_url: string;
  generated_image_url: string | null;
  style: string;
  room_type: string;
  created_at: string;
  updated_at: string;
}

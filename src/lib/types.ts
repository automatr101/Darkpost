// ─── Core Types ─────────────────────────────────────────────────────────────

export interface Category {
  id: string;
  slug: string;
  label: string;
  color_hex: string;
  sort_order: number;
  is_active: boolean;
}

export interface Profile {
  id: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  created_at: string;
}

export interface User {
  id: string;
  username: string;
  display_name: string | null;
  bio: string | null;
  avatar_url: string | null;
  created_at: string;
}

export interface Post {
  id: string;
  user_id: string | null; // null when is_anon=true in public API
  post_type: 'text' | 'voice';
  content: string | null;
  voice_url: string | null;
  waveform_data: number[] | null;
  duration_seconds: number | null;
  is_anon: boolean;
  category_id: string | null;
  screenshot_count: number;
  reply_count: number;
  view_count: number;
  likes_count?: number;
  dislikes_count?: number;
  created_at: string;
  deleted_at: string | null;
  // Joined fields
  alias?: string;
  is_mine?: boolean;
  category?: Category | null;
  user?: Pick<User, 'username' | 'display_name' | 'avatar_url'> | null;
}

export interface Reply {
  id: string;
  post_id: string;
  user_id: string;
  content: string;
  created_at: string;
  user?: Pick<User, 'username' | 'display_name' | 'avatar_url'>;
}

export interface ScreenshotUnlockResponse {
  replies: Reply[];
  burn_score: number;
  already_unlocked: boolean;
}

export interface FeedResponse {
  data: Post[];
  next_cursor: string | null;
}

export type SortMode = 'new' | 'trending';
export type PostTypeFilter = 'all' | 'text' | 'voice';

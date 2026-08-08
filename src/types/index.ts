export interface User {
  username: string;
  password_hash: string;
  email: string;
  role: 'user' | 'admin';
  is_member: boolean;
  member_expire: string | null;
  created_at: string;
}

export type PhotoMediaType = 'image' | 'video';

export interface PhotoImage {
  key: string;
  thumb_key: string;
  type?: PhotoMediaType;
}

export interface Photo {
  id: string;
  name: string;
  price: number;
  tags: string[];
  city: string;
  district: string;
  contact: string;
  link: string;
  album_id: string;
  images: PhotoImage[];
  cover_index: number;
  is_pinned: boolean;
  created_at: string;
}

export interface Album {
  id: string;
  name: string;
  description: string;
  cover_photo_id: string | null;
  created_at: string;
}

export interface DailyUsage {
  photo_views: number;
  contact_views: number;
}

export interface JwtPayload {
  username: string;
  role: 'user' | 'admin';
  is_member: boolean;
  exp: number;
}

export interface PhotoFilters {
  min_price?: number;
  max_price?: number;
  tags?: string[];
  city?: string;
  search?: string;
  album_id?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  has_more: boolean;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}

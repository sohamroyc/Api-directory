
export interface PublicApi {
  id: string;
  name: string;
  website: string;
  description: string;
  category: string;
  auth_required: boolean;
  source: string;
  created_at: string;
  ai_summary?: string;
}

export interface User {
  id: string;
  username: string;
  email: string;
  created_at: string;
}

export interface Favorite {
  user_id: string;
  api_id: string;
  created_at: string;
}

export type ViewState = 'landing' | 'login' | 'signup' | 'dashboard' | 'favorites';

export enum ApiCategory {
  ALL = 'All',
  DATA = 'Data & Analytics',
  AUTH = 'Auth & Identity',
  SOCIAL = 'Social Media',
  FINANCE = 'Finance',
  AI = 'Artificial Intelligence',
  DEVELOPER = 'Developer Tools',
  GEOLOCATION = 'Geolocation',
  ENTERTAINMENT = 'Entertainment',
  OTHERS = 'Others'
}

export interface DiscoveryResponse {
  apis: Omit<PublicApi, 'id' | 'created_at'>[];
  sources: { title: string; uri: string }[];
}

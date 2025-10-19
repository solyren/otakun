export interface Anime {
  id: string;
  title: string;
  slug: string;
  status?: 'ongoing' | 'completed' | 'upcoming';
  rating?: number;
  cover?: string;
}

export interface SamehadakuHomeItem {
  title: string;
  slug: string;
  image: string;
  last_episode: string;
}

export interface ScrapeResult {
  success: boolean;
  data?: unknown;
  error?: string;
}

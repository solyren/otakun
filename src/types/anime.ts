export interface Anime {
  id: string;
  title: string;
  slug: string;
  description?: string;
  imageUrl?: string;
  episodes?: number;
  status?: 'ongoing' | 'completed' | 'upcoming';
  genres?: string[];
  releaseDate?: string;
  rating?: number;
}

export interface ScrapeResult {
  success: boolean;
  data?: unknown;
  error?: string;
}

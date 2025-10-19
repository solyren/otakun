import stringSimilarity from 'string-similarity';

import type { Anime } from '../types/anime';
import logger from '../utils/logger';

interface JikanAnimeData {
  mal_id: number;
  title: string;
  url?: string;
  images?: {
    jpg?: {
      image_url?: string;
    };
  };
  image_url?: string;
  score?: number;
  status?: string;
  synopsis?: string;
  episodes?: number;
  genres?: {
    name: string;
  }[];
  aired?: {
    from?: string;
  };
}

export class JikanIntegrationService {
  private static readonly BASE_URL = 'https://api.jikan.moe/v4';

  // -- Normalize Slug --
  static normalizeSlug(slug: string): string {
    try {
      const url = new URL(slug);
      const pathParts = url.pathname.split('/').filter((part) => part !== '');
      if (pathParts.length > 0) {
        return pathParts[pathParts.length - 1].toLowerCase();
      }
    } catch {
      const pathParts = slug.split('/').filter((part) => part !== '');
      if (pathParts.length > 0) {
        return pathParts[pathParts.length - 1].toLowerCase();
      }
    }

    return slug.toLowerCase();
  }

  // -- Normalize Title --
  static normalizeTitle(title: string): string {
    return title
      .toLowerCase()
      .replace(/[^\\w\\s]/gi, '')
      .replace(/\\s+/g, ' ')
      .trim();
  }

  // -- Find Best Match --
  static findBestMatch(
    samehadakuTitle: string,
    jikanResults: Anime[]
  ): Anime | null {
    if (jikanResults.length === 0) {
      return null;
    }

    const normalizedSamehadakuTitle = this.normalizeTitle(samehadakuTitle);

    let bestMatch: Anime | null = null;
    let bestScore = 0;

    for (const jikanAnime of jikanResults) {
      const mainTitleScore = stringSimilarity.compareTwoStrings(
        normalizedSamehadakuTitle,
        this.normalizeTitle(jikanAnime.title)
      );

      let altTitleScore = 0;
      if (
        jikanAnime.title.toLowerCase().includes(normalizedSamehadakuTitle) ||
        normalizedSamehadakuTitle.includes(jikanAnime.title.toLowerCase())
      ) {
        altTitleScore = 0.8;
      }

      const score = Math.max(mainTitleScore, altTitleScore);

      if (score > bestScore && score > 0.6) {
        bestScore = score;
        bestMatch = jikanAnime;
      }
    }

    if (bestMatch) {
      logger.info(
        `Found match for "${samehadakuTitle}" with "${bestMatch.title}" (score: ${bestScore})`
      );
    } else {
      logger.info(`No good match found for "${samehadakuTitle}"`);
    }

    return bestMatch;
  }

  // -- Find Match By Slug --
  static findMatchBySlug(
    normalizedSamehadakuSlug: string,
    jikanResults: Anime[]
  ): Anime | null {
    if (jikanResults.length === 0) {
      return null;
    }

    return null;
  }

  // -- Update Integration Cache --
  static async updateIntegrationCache(
    samehadakuSlug: string,
    jikanAnime: Anime
  ): Promise<void> {
    logger.info(
      `Updating integration cache for ${samehadakuSlug} with Jikan ID ${jikanAnime.id}`
    );
  }

  // -- Process Jikan Response --
  private static processJikanResponse(data: unknown): Anime | null {
    if (data && data.data) {
      const animeData: JikanAnimeData = data.data;
      return {
        id: animeData.mal_id.toString(),
        title: animeData.title,
        slug: animeData.url ? this.extractSlugFromUrl(animeData.url) : '',
        status: this.mapStatus(animeData.status),
        rating: animeData.score,
        cover: animeData.images?.jpg?.image_url || animeData.image_url,
      };
    }
    return null;
  }

  // -- Get Anime By ID --
  static async getAnimeById(id: number): Promise<Anime | null> {
    try {
      await new Promise((resolve) => setTimeout(resolve, 100));

      const response = await fetch(
        `${JikanIntegrationService.BASE_URL}/anime/${id}`
      );

      if (!response.ok) {
        if (response.status === 404) {
          logger.warn(`Anime with ID ${id} not found in Jikan`);
          return null;
        }
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      const data = await response.json();
      return this.processJikanResponse(data);
    } catch (error) {
      logger.error(
        {
          error: error instanceof Error ? error.message : String(error),
          stack: error instanceof Error ? error.stack : undefined,
          id,
        },
        'Error fetching anime from Jikan by ID'
      );
      return null;
    }
  }

  // -- Search Anime By Title --
  static async searchAnimeByTitle(title: string): Promise<Anime[]> {
    try {
      await new Promise((resolve) => setTimeout(resolve, 100));

      const encodedTitle = encodeURIComponent(title);
      const response = await fetch(
        `${JikanIntegrationService.BASE_URL}/anime?q=${encodedTitle}`
      );

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      const data = await response.json();

      if (data && data.data && Array.isArray(data.data)) {
        return data.data.map((animeData: JikanAnimeData) => ({
          id: animeData.mal_id.toString(),
          title: animeData.title,
          slug: animeData.url ? this.extractSlugFromUrl(animeData.url) : '',
          status: this.mapStatus(animeData.status),
          rating: animeData.score,
          cover: animeData.images?.jpg?.image_url || animeData.image_url,
        }));
      }

      return [];
    } catch (error) {
      logger.error(
        {
          error: error instanceof Error ? error.message : String(error),
          stack: error instanceof Error ? error.stack : undefined,
          title,
        },
        'Error searching anime from Jikan by title'
      );
      return [];
    }
  }

  // -- Get Multiple Anime By ID --
  static async getMultipleAnimeById(ids: number[]): Promise<Anime[]> {
    try {
      const results: Anime[] = [];

      for (const id of ids) {
        const anime = await this.getAnimeById(id);
        if (anime) {
          results.push(anime);
        }

        await new Promise((resolve) => setTimeout(resolve, 100));
      }

      return results;
    } catch (error) {
      logger.error(
        {
          error: error instanceof Error ? error.message : String(error),
          stack: error instanceof Error ? error.stack : undefined,
          ids,
        },
        'Error fetching multiple anime from Jikan by IDs'
      );
      return [];
    }
  }

  // -- Search Anime By Normalized Slug --
  static async searchAnimeByNormalizedSlug(
    normalizedSlug: string
  ): Promise<Anime[]> {
    try {
      const titleQuery = normalizedSlug
        .replace(/-/g, ' ')
        .replace(/\\b\\w/g, (l) => l.toUpperCase());

      return await this.searchAnimeByTitle(titleQuery);
    } catch (error) {
      logger.error(
        {
          error: error instanceof Error ? error.message : String(error),
          stack: error instanceof Error ? error.stack : undefined,
          normalizedSlug,
        },
        'Error searching anime from Jikan by normalized slug'
      );
      return [];
    }
  }

  // -- Extract Slug From URL --
  private static extractSlugFromUrl(url: string): string {
    try {
      const urlObj = new URL(url);
      const pathParts = urlObj.pathname.split('/');
      if (pathParts.length > 2) {
        return pathParts[2];
      }
    } catch {
      return url;
    }
    return url;
  }

  // -- Map Status --
  private static mapStatus(
    jikanStatus: string
  ): 'ongoing' | 'completed' | 'upcoming' | undefined {
    if (!jikanStatus) return undefined;

    switch (jikanStatus.toLowerCase()) {
      case 'currently airing':
        return 'ongoing';
      case 'finished airing':
        return 'completed';
      case 'not yet aired':
        return 'upcoming';
      default:
        return undefined;
    }
  }
}

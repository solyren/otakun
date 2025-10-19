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

    // Ekstrak informasi season dari slug
    const seasonInfo = this.extractSeasonInfo(normalizedSamehadakuSlug);
    
    // Jika tidak ada informasi season tambahan, kembalikan hasil pertama
    if (!seasonInfo.hasSeason && !seasonInfo.hasPart && !seasonInfo.hasCour) {
      return jikanResults[0];
    }

    // Cari anime yang cocok dengan informasi season
    for (const jikanAnime of jikanResults) {
      if (this.isSeasonMatch(jikanAnime.title, seasonInfo)) {
        return jikanAnime;
      }
    }

    // Jika tidak ada yang cocok secara spesifik, coba pencocokan berdasarkan kemiripan
    // dengan prioritas pada judul yang mengandung informasi season
    let bestMatch: Anime | null = null;
    let bestScore = 0;

    for (const jikanAnime of jikanResults) {
      // Jika judul anime mengandung informasi season yang relevan
      if (this.hasSeasonKeyword(jikanAnime.title, seasonInfo)) {
        return jikanAnime; // Kembalikan langsung jika ditemukan kecocokan eksplisit
      }

      const similarityScore = stringSimilarity.compareTwoStrings(
        normalizedSamehadakuSlug.replace(/-/g, ' ').toLowerCase(),
        jikanAnime.title.toLowerCase()
      );

      if (similarityScore > bestScore) {
        bestScore = similarityScore;
        bestMatch = jikanAnime;
      }
    }

    return bestMatch;
  }

  // -- Extract Season Info --
  private static extractSeasonInfo(slug: string): {
    hasSeason: boolean;
    seasonNumber?: number;
    hasPart: boolean;
    partNumber?: number;
    hasCour: boolean;
    courNumber?: number;
    rawInfo: string;
  } {
    // Cek season (contoh: "season-2", "season2", "s2")
    const seasonRegex = /season[-]?(\d+)|s(\d+)/i;
    const seasonMatch = slug.match(seasonRegex);
    
    // Cek part (contoh: "part-2", "part2", "pt2")
    const partRegex = /part[-]?(\d+)|pt(\d+)/i;
    const partMatch = slug.match(partRegex);
    
    // Cek cour (contoh: "cour-2", "cour2", "2nd-cour")
    const courRegex = /(\d+)[stndrh]?\s*-?\s*cour|cour[-]?(\d+)/i;
    const courMatch = slug.match(courRegex);
    
    // Simpan informasi tambahan lainnya
    const rawInfo = slug.replace(/season-\d+|season\d+|s\d+|part-\d+|part\d+|pt\d+|\d+st-cour|\d+nd-cour|\d+rd-cour|\d+th-cour|cour-\d+|cour\d+/gi, '').trim();

    return {
      hasSeason: !!seasonMatch,
      seasonNumber: seasonMatch ? parseInt(seasonMatch[1] || seasonMatch[2]) : undefined,
      hasPart: !!partMatch,
      partNumber: partMatch ? parseInt(partMatch[1] || partMatch[2]) : undefined,
      hasCour: !!courMatch,
      courNumber: courMatch ? parseInt(courMatch[1] || courMatch[2]) : undefined,
      rawInfo: rawInfo,
    };
  }

  // -- Is Season Match --
  private static isSeasonMatch(title: string, seasonInfo: {
    hasSeason: boolean;
    seasonNumber?: number;
    hasPart: boolean;
    partNumber?: number;
    hasCour: boolean;
    courNumber?: number;
    rawInfo: string;
  }): boolean {
    const lowerTitle = title.toLowerCase();
    
    // Cek apakah title mengandung informasi season yang sesuai
    if (seasonInfo.hasSeason && seasonInfo.seasonNumber) {
      const seasonPatterns = [
        `season ${seasonInfo.seasonNumber}`,
        `s${seasonInfo.seasonNumber}`
      ];
      
      return seasonPatterns.some(pattern => lowerTitle.includes(pattern.toLowerCase()));
    }
    
    // Cek apakah title mengandung informasi part yang sesuai
    if (seasonInfo.hasPart && seasonInfo.partNumber) {
      const partPatterns = [
        `part ${seasonInfo.partNumber}`,
        `pt ${seasonInfo.partNumber}`
      ];
      
      return partPatterns.some(pattern => lowerTitle.includes(pattern.toLowerCase()));
    }
    
    // Cek apakah title mengandung informasi cour yang sesuai
    if (seasonInfo.hasCour && seasonInfo.courNumber) {
      const courPatterns = [
        `${seasonInfo.courNumber}st cour`,
        `${seasonInfo.courNumber}nd cour`,
        `${seasonInfo.courNumber}rd cour`,
        `${seasonInfo.courNumber}th cour`,
        `cour ${seasonInfo.courNumber}`
      ];
      
      return courPatterns.some(pattern => lowerTitle.includes(pattern.toLowerCase()));
    }
    
    // Tambahkan logika untuk menangani kasus khusus seperti "cour-2" yang mungkin cocok dengan "Part 2"
    if (seasonInfo.hasCour && seasonInfo.courNumber) {
      // Jika slug mengandung informasi cour (seperti "cour-2"), 
      // cek apakah title mengandung "Part" dengan nomor yang sama
      const partPatterns = [
        `part ${seasonInfo.courNumber}`,
        `pt ${seasonInfo.courNumber}`
      ];
      
      return partPatterns.some(pattern => lowerTitle.includes(pattern.toLowerCase()));
    }
    
    return false;
  }

  // -- Has Season Keyword --
  private static hasSeasonKeyword(title: string, seasonInfo: {
    hasSeason: boolean;
    seasonNumber?: number;
    hasPart: boolean;
    partNumber?: number;
    hasCour: boolean;
    courNumber?: number;
    rawInfo: string;
  }): boolean {
    const lowerTitle = title.toLowerCase();
    
    // Cek apakah title mengandung kata kunci season yang relevan
    if (seasonInfo.hasSeason && seasonInfo.seasonNumber) {
      return /\bseason\b|\bs\d+\b/.test(lowerTitle) && 
             (lowerTitle.includes(`season ${seasonInfo.seasonNumber}`) || 
              lowerTitle.includes(`s${seasonInfo.seasonNumber}`));
    }
    
    if (seasonInfo.hasPart && seasonInfo.partNumber) {
      return /\bpart\b|\bpt\b/.test(lowerTitle) &&
             (lowerTitle.includes(`part ${seasonInfo.partNumber}`) || 
              lowerTitle.includes(`pt ${seasonInfo.partNumber}`));
    }
    
    if (seasonInfo.hasCour && seasonInfo.courNumber) {
      // Cek pola cour
      const hasCourPattern = /\bcour\b/.test(lowerTitle) &&
             (lowerTitle.includes(`${seasonInfo.courNumber}st cour`) ||
              lowerTitle.includes(`${seasonInfo.courNumber}nd cour`) ||
              lowerTitle.includes(`${seasonInfo.courNumber}rd cour`) ||
              lowerTitle.includes(`${seasonInfo.courNumber}th cour`) ||
              lowerTitle.includes(`cour ${seasonInfo.courNumber}`));
      
      // Tambahkan pengecekan khusus untuk "Part" yang berkaitan dengan cour
      const hasRelatedPartPattern = /\bpart\b|\bpt\b/.test(lowerTitle) &&
             (lowerTitle.includes(`part ${seasonInfo.courNumber}`) || 
              lowerTitle.includes(`pt ${seasonInfo.courNumber}`));
      
      return hasCourPattern || hasRelatedPartPattern;
    }
    
    return false;
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

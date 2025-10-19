import { JikanIntegrationService } from '../services/jikanIntegrationService';
import { scrapeSamehadakuHome } from '../services/samehadakuScraperService';
import logger from '../utils/logger';

async function main() {
  // Ambil URL dari argumen command line
  const url = process.argv[2];
  
  if (!url) {
    logger.error('URL Samehadaku tidak diberikan. Gunakan: bun run equalize <url samehadaku>');
    process.exit(1);
  }

  logger.info(`Memproses URL: ${url}`);

  try {
    // Ambil slug dari URL
    const slug = JikanIntegrationService.normalizeSlug(url);
    logger.info(`Slug yang dinormalisasi: ${slug}`);

    // Cari data dari Jikan berdasarkan slug yang dinormalisasi
    const jikanResults = await JikanIntegrationService.searchAnimeByNormalizedSlug(slug);
    
    if (jikanResults.length > 0) {
      // Ambil ID dari hasil pertama (karena akan diurutkan berdasarkan kemiripan)
      const anime = jikanResults[0];
      console.log(`ID Jikan: ${anime.id}`);
      console.log(`Judul: ${anime.title}`);
      console.log(`Slug: ${anime.slug}`);
    } else {
      logger.warn(`Tidak ditemukan anime di Jikan untuk slug: ${slug}`);
      console.log('ID Jikan: null');
    }
  } catch (error) {
    logger.error(
      {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        url,
      },
      'Error saat memproses URL'
    );
    process.exit(1);
  }
}

main();
import { load } from 'cheerio';

import { SAMEHADAKU_BASE_URL } from '../config/app';
import type { SamehadakuHomeItem } from '../types/anime';
import logger from '../utils/logger';

// -- Scraping Function --
export async function scrapeSamehadakuHome(): Promise<SamehadakuHomeItem[]> {
  try {
    const response = await fetch(`${SAMEHADAKU_BASE_URL}/anime-terbaru/`);

    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }

    const html = await response.text();
    const $ = load(html);

    const animeList: SamehadakuHomeItem[] = [];

    $('.post-show ul li').each((index, element) => {
      const $element = $(element);

      const $titleLink = $element.find('.entry-title a');
      const title = $titleLink.text().trim();
      const slug = $titleLink.attr('href') || '';

      const image = $element.find('.thumb a img.npws').attr('src') || '';

      let last_episode = '';
      $element.find('i.dashicons-controls-play').each((idx, playIcon) => {
        const $playIcon = $(playIcon);
        const $nextAuthor = $playIcon.nextAll('author').first();
        if ($nextAuthor.length > 0) {
          last_episode = $nextAuthor.text().trim();
        }
      });

      if (title) {
        animeList.push({
          title,
          slug,
          image,
          last_episode,
        });
      }
    });

    logger.info(
      `Successfully scraped ${animeList.length} anime from samehadaku`
    );
    return animeList;
  } catch (error) {
    logger.error(
      {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      },
      'Error scraping samehadaku'
    );
    throw new Error('Failed to scrape samehadaku');
  }
}

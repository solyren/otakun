import { load } from 'cheerio';

import { SAMEHADAKU_BASE_URL } from '../config/app';
import type { SamehadakuHomeItem } from '../types/anime';
import logger from '../utils/logger';

// -- Scraping Functions --
export async function scrapeSamehadakuHome(
  maxPages: number = 1
): Promise<SamehadakuHomeItem[]> {
  const animeList: SamehadakuHomeItem[] = [];

  for (let page = 1; page <= maxPages; page++) {
    let url = `${SAMEHADAKU_BASE_URL}/anime-terbaru/`;
    if (page > 1) {
      url = `${SAMEHADAKU_BASE_URL}/anime-terbaru/page/${page}/`;
    }

    try {
      logger.info(`Scraping page ${page}: ${url}`);

      const response = await fetch(url);

      if (!response.ok) {
        logger.warn(`Failed to scrape page ${page}: HTTP ${response.status}`);
        continue;
      }

      const html = await response.text();
      const $ = load(html);

      let itemCount = 0;
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
          itemCount++;
        }
      });

      logger.info(`Successfully scraped ${itemCount} anime from page ${page}`);

      if (page < maxPages) {
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
    } catch (error) {
      logger.error(
        {
          error: error instanceof Error ? error.message : String(error),
          stack: error instanceof Error ? error.stack : undefined,
          page,
        },
        `Error scraping samehadaku page ${page}`
      );

      continue;
    }
  }

  logger.info(
    `Successfully scraped ${animeList.length} total anime from ${maxPages} pages`
  );
  return animeList;
}

export async function scrapeSamehadakuSlugs(
  maxPages: number = 1
): Promise<string[]> {
  const slugs: string[] = [];

  for (let page = 1; page <= maxPages; page++) {
    let url = `${SAMEHADAKU_BASE_URL}/anime-terbaru/`;
    if (page > 1) {
      url = `${SAMEHADAKU_BASE_URL}/anime-terbaru/page/${page}/`;
    }

    try {
      logger.info(`Scraping slugs from page ${page}: ${url}`);

      const response = await fetch(url);

      if (!response.ok) {
        logger.warn(
          `Failed to scrape slugs from page ${page}: HTTP ${response.status}`
        );
        continue;
      }

      const html = await response.text();
      const $ = load(html);

      let itemCount = 0;
      $('.post-show ul li').each((index, element) => {
        const $element = $(element);

        const $titleLink = $element.find('.entry-title a');
        const slug = $titleLink.attr('href');

        if (slug) {
          slugs.push(slug);
          itemCount++;
        }
      });

      logger.info(`Successfully scraped ${itemCount} slugs from page ${page}`);

      if (page < maxPages) {
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
    } catch (error) {
      logger.error(
        {
          error: error instanceof Error ? error.message : String(error),
          stack: error instanceof Error ? error.stack : undefined,
          page,
        },
        `Error scraping samehadaku slugs from page ${page}`
      );

      continue;
    }
  }

  logger.info(
    `Successfully scraped ${slugs.length} total slugs from ${maxPages} pages`
  );
  return slugs;
}

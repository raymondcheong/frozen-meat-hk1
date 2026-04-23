/**
 * Seafood News 新聞爬蟲
 * https://www.seafoodnews.com
 */

import axios from 'axios';
import * as cheerio from 'cheerio';

const BASE_URL = 'https://www.seafoodnews.com';

/**
 * 抓取 Seafood News 最新新聞
 */
export async function fetchSeafoodNews() {
  console.log('Fetching Seafood News...');
  
  try {
    const response = await axios.get(BASE_URL, {
      timeout: 30000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });
    
    const $ = cheerio.load(response.data);
    const articles = [];
    
    // 解析文章列表
    $('.post, article, .news-article').each((i, el) => {
      const title = $(el).find('h2, h3, .entry-title, .post-title').first().text().trim();
      const excerpt = $(el).find('.entry-summary, .excerpt, p').first().text().trim();
      const url = $(el).find('a').first().attr('href');
      const dateText = $(el).find('.entry-date, .date, time').first().text().trim();
      
      if (title && url) {
        articles.push({
          id: `sn-${Date.now()}-${i}`,
          title,
          excerpt: excerpt || title,
          source: 'Seafood News',
          sourceUrl: url.startsWith('http') ? url : `${BASE_URL}${url}`,
          category: 'seafood',
          publishDate: parseDate(dateText),
          scrapedAt: new Date().toISOString()
        });
      }
    });
    
    console.log(`✓ Fetched ${articles.length} articles from Seafood News`);
    return articles.slice(0, 5);
    
  } catch (error) {
    console.error('Error fetching Seafood News:', error.message);
    return [];
  }
}

function parseDate(dateText) {
  if (!dateText) return new Date().toISOString().split('T')[0];
  
  const date = new Date(dateText);
  if (!isNaN(date.getTime())) {
    return date.toISOString().split('T')[0];
  }
  
  return new Date().toISOString().split('T')[0];
}

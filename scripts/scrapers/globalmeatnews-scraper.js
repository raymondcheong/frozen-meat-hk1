/**
 * Global Meat News 新聞爬蟲
 * https://www.globalmeatnews.com
 */

import axios from 'axios';
import * as cheerio from 'cheerio';

const BASE_URL = 'https://www.globalmeatnews.com';

/**
 * 抓取 Global Meat News 最新新聞
 */
export async function fetchGlobalMeatNews() {
  console.log('Fetching Global Meat News...');
  
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
    $('.article-item, .news-item, .story-item').each((i, el) => {
      const title = $(el).find('h3, h4, .title, .headline').first().text().trim();
      const excerpt = $(el).find('.summary, .teaser, p').first().text().trim();
      const url = $(el).find('a').first().attr('href');
      const dateText = $(el).find('.date, .published').first().text().trim();
      
      if (title && url) {
        articles.push({
          id: `gmn-${Date.now()}-${i}`,
          title,
          excerpt: excerpt || title,
          source: 'Global Meat News',
          sourceUrl: url.startsWith('http') ? url : `${BASE_URL}${url}`,
          category: 'meat',
          publishDate: parseDate(dateText),
          scrapedAt: new Date().toISOString()
        });
      }
    });
    
    console.log(`✓ Fetched ${articles.length} articles from Global Meat News`);
    return articles.slice(0, 5);
    
  } catch (error) {
    console.error('Error fetching Global Meat News:', error.message);
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

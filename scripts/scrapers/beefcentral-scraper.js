/**
 * Beef Central 新聞爬蟲
 * https://www.beefcentral.com
 */

import axios from 'axios';
import * as cheerio from 'cheerio';

const BASE_URL = 'https://www.beefcentral.com';

/**
 * 抓取 Beef Central 最新新聞
 */
export async function fetchBeefCentralNews() {
  console.log('Fetching Beef Central news...');
  
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
    $('.post, article, .news-item').each((i, el) => {
      const title = $(el).find('h2, h3, .title, .entry-title').first().text().trim();
      const excerpt = $(el).find('.excerpt, .summary, p').first().text().trim();
      const url = $(el).find('a').first().attr('href');
      const dateText = $(el).find('.date, .published, time').first().text().trim();
      
      if (title && url) {
        articles.push({
          id: `bc-${Date.now()}-${i}`,
          title,
          excerpt: excerpt || title,
          source: 'Beef Central',
          sourceUrl: url.startsWith('http') ? url : `${BASE_URL}${url}`,
          category: 'meat',
          publishDate: parseDate(dateText),
          scrapedAt: new Date().toISOString()
        });
      }
    });
    
    console.log(`✓ Fetched ${articles.length} articles from Beef Central`);
    return articles.slice(0, 5); // 只取前5篇
    
  } catch (error) {
    console.error('Error fetching Beef Central:', error.message);
    return [];
  }
}

function parseDate(dateText) {
  if (!dateText) return new Date().toISOString().split('T')[0];
  
  // 嘗試解析各種日期格式
  const date = new Date(dateText);
  if (!isNaN(date.getTime())) {
    return date.toISOString().split('T')[0];
  }
  
  return new Date().toISOString().split('T')[0];
}

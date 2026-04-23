/**
 * 新聞爬蟲統一入口
 */

import { fetchBeefCentralNews } from './beefcentral-scraper.js';
import { fetchSeafoodSourceNews } from './seafoodsource-scraper.js';
import { fetchGlobalMeatNews } from './globalmeatnews-scraper.js';
import { fetchSeafoodNews } from './seafoodnews-scraper.js';

/**
 * 抓取所有新聞源
 */
export async function fetchAllNews() {
  console.log('=== Fetching all news sources ===');
  
  const results = await Promise.allSettled([
    fetchBeefCentralNews(),
    fetchSeafoodSourceNews(),
    fetchGlobalMeatNews(),
    fetchSeafoodNews()
  ]);
  
  const allArticles = [];
  
  results.forEach((result, index) => {
    const sources = ['Beef Central', 'SeafoodSource', 'Global Meat News', 'Seafood News'];
    if (result.status === 'fulfilled') {
      allArticles.push(...result.value);
      console.log(`✓ ${sources[index]}: ${result.value.length} articles`);
    } else {
      console.error(`✗ ${sources[index]}: ${result.reason.message}`);
    }
  });
  
  // 按日期排序（最新的在前）
  allArticles.sort((a, b) => new Date(b.publishDate) - new Date(a.publishDate));
  
  console.log(`=== Total: ${allArticles.length} articles ===`);
  return allArticles;
}

export {
  fetchBeefCentralNews,
  fetchSeafoodSourceNews,
  fetchGlobalMeatNews,
  fetchSeafoodNews
};

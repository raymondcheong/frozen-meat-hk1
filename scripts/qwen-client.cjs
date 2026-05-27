/**
 * 阿里雲百煉 DashScope · 千問聯網搜索客戶端
 * 文檔: https://help.aliyun.com/zh/model-studio/web-search
 */
const axios = require('axios');

const GENERATION_URL =
  'https://dashscope.aliyuncs.com/api/v1/services/aigc/text-generation/generation';

function getApiKey() {
  return process.env.DASHSCOPE_API_KEY || process.env.QWEN_API_KEY || '';
}

function getModel() {
  return process.env.QWEN_MODEL || 'qwen-plus';
}

/**
 * 調用千問（開啟聯網搜索）並返回 assistant 文本
 */
async function qwenChatWithSearch(messages, options = {}) {
  const apiKey = getApiKey();
  if (!apiKey) {
    throw new Error('未設置 DASHSCOPE_API_KEY 或 QWEN_API_KEY 環境變量');
  }

  const response = await axios.post(
    GENERATION_URL,
    {
      model: getModel(),
      input: { messages },
      parameters: {
        result_format: 'message',
        enable_search: true,
        search_options: {
          forced_search: options.forcedSearch !== false,
          enable_source: true,
          search_strategy: options.searchStrategy || 'turbo',
        },
        max_tokens: options.maxTokens || 4096,
        temperature: options.temperature ?? 0.3,
      },
    },
    {
      timeout: options.timeout || 120000,
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
    }
  );

  const data = response.data;
  if (data.code && data.code !== '200' && data.code !== 200) {
    throw new Error(data.message || `DashScope 錯誤: ${data.code}`);
  }

  const choice = data.output?.choices?.[0];
  const content = choice?.message?.content;
  if (!content) {
    throw new Error('千問未返回有效內容');
  }

  return {
    content,
    searchInfo: data.output?.search_info || choice?.message?.search_info || null,
    raw: data,
  };
}

module.exports = {
  qwenChatWithSearch,
  getApiKey,
  getModel,
};

/**
 * 從原文段落提煉繁中摘要（Node 版，與 src/lib/article-summary.ts 邏輯同步）
 */
const { stripHtml, translateOverseasText, hasChinese, latinRatio } = require('./overseas-zh-tw.cjs');

const BOILERPLATE =
  /^(the post|read more|click here|appeared first|photo:|image:|source:)/i;

function splitSentences(text) {
  return String(text)
    .replace(/\[[^\]]*]/g, ' ')
    .split(/(?<=[.!?。！？])\s+/)
    .map((s) => s.replace(/\s+/g, ' ').trim())
    .filter((s) => s.length > 12 && !BOILERPLATE.test(s) && !/^https?:\/\//i.test(s));
}

function isUsableSourceText(raw) {
  const t = stripHtml(raw);
  if (t.length < 24) return false;
  if (/width\s*=|<img|wp-content\/uploads/i.test(t)) return false;
  if (/^https?:\/\//i.test(t)) return false;
  return true;
}

function normalizeNumbers(text) {
  return text
    .replace(/([\d,]+)\s*-\s*tonne/gi, (_, n) => {
      const num = parseInt(String(n).replace(/,/g, ''), 10);
      if (num >= 10000) return `${num / 10000}萬公噸`;
      return `${n}公噸`;
    })
    .replace(/([\d,]+)\s*tonne/gi, (_, n) => {
      const num = parseInt(String(n).replace(/,/g, ''), 10);
      if (num >= 10000) return `${num / 10000}萬公噸`;
      return `${n}公噸`;
    })
    .replace(/([\d,]+)\s*tonnes/gi, (_, n) => {
      const num = parseInt(String(n).replace(/,/g, ''), 10);
      if (num >= 10000) return `${num / 10000}萬公噸`;
      return `${n}公噸`;
    });
}

function translateSentence(sentence) {
  if (hasChinese(sentence, 6)) return sentence.trim();
  return normalizeNumbers(translateOverseasText(sentence));
}

function distillArticleContent(raw, maxLen = 120) {
  const cleaned = stripHtml(raw).replace(/\s+/g, ' ').trim();
  if (!cleaned) return '';

  const sentences = splitSentences(cleaned);
  const chunks = sentences.length ? sentences : [cleaned];
  const translated = [];

  for (const s of chunks) {
    const line = translateSentence(s);
    if (line.length < 8) continue;
    if (latinRatio(line) > 0.35) continue;
    translated.push(line.replace(/[,.;]+$/, '').trim());
    if (translated.length >= 3) break;
  }

  let text = translated.join('，');
  if (!text) {
    text = translateSentence(cleaned);
  }

  text = text.replace(/\s+/g, '').replace(/，+/g, '，').replace(/^，|，$/g, '');
  if (text.length <= maxLen) {
    return text.endsWith('。') ? text : `${text.replace(/[，。]$/, '')}。`;
  }
  const cut = text.slice(0, maxLen).replace(/[，、；;,.]$/, '');
  return `${cut}…`;
}

module.exports = {
  splitSentences,
  isUsableSourceText,
  distillArticleContent,
};

import {
  stripHtml,
  translateOverseasText,
  hasChinese,
  latinRatio,
  type ArticleLikeForSummary,
} from './overseas-zh-tw';

const BOILERPLATE =
  /^(the post|read more|click here|appeared first|photo:|image:|source:)/i;

export function splitSentences(text: string): string[] {
  return String(text)
    .replace(/\[[^\]]*]/g, ' ')
    .split(/(?<=[.!?。！？])\s+/)
    .map((s) => s.replace(/\s+/g, ' ').trim())
    .filter((s) => s.length > 12 && !BOILERPLATE.test(s) && !/^https?:\/\//i.test(s));
}

export function isUsableSourceText(raw: string): boolean {
  const t = stripHtml(raw);
  if (t.length < 24) return false;
  if (/width\s*=|<img|wp-content\/uploads/i.test(t)) return false;
  if (/^https?:\/\//i.test(t)) return false;
  return true;
}

function normalizeNumbers(text: string): string {
  return text
    .replace(/([\d,]+)\s*-\s*tonne/gi, (_, n: string) => {
      const num = parseInt(n.replace(/,/g, ''), 10);
      if (num >= 10000) return `${num / 10000}萬公噸`;
      return `${n}公噸`;
    })
    .replace(/([\d,]+)\s*tonnes?/gi, (_, n: string) => {
      const num = parseInt(n.replace(/,/g, ''), 10);
      if (num >= 10000) return `${num / 10000}萬公噸`;
      return `${n}公噸`;
    });
}

function translateSentence(sentence: string): string {
  if (hasChinese(sentence, 6)) return sentence.trim();
  return normalizeNumbers(translateOverseasText(sentence));
}

/** 從原文（RSS 摘要或正文）提煉 1–3 句繁中摘要，不作升跌判斷 */
export function distillArticleContent(raw: string, maxLen = 120): string {
  const cleaned = stripHtml(raw).replace(/\s+/g, ' ').trim();
  if (!cleaned) return '';

  const sentences = splitSentences(cleaned);
  const chunks = sentences.length ? sentences : [cleaned];
  const translated: string[] = [];

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

export function pickArticleSourceText(article: {
  title: string;
  keyInfo: { briefReason?: string };
}): string {
  const brief = article.keyInfo?.briefReason ?? '';
  if (isUsableSourceText(brief)) return stripHtml(brief);
  return stripHtml(article.title);
}

export function buildArticleSummaryFromSource(
  article: ArticleLikeForSummary & { title: string; keyInfo: { briefReason?: string } },
  maxLen = 120
): string {
  const brief = article.keyInfo?.briefReason ?? '';
  const useTitleOnly = !isUsableSourceText(brief);
  const source = useTitleOnly ? stripHtml(article.title) : stripHtml(brief);
  let summary = distillArticleContent(source, maxLen);

  if (summary.length >= 10 && useTitleOnly) {
    summary = summary.startsWith('報道') ? summary : `報道指，${summary.replace(/^，/, '')}`;
  }

  if (summary.length >= 10) return summary;

  const product = article.keyInfo.products?.filter(Boolean).join('、') || '相關貨品';
  const region = article.keyInfo.regions?.filter(Boolean).slice(0, 2).join('、') || '海外';
  return `${region}的${product}相關報道。`;
}

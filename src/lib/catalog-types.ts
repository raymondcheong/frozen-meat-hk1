export type CatalogTag =
  | 'NEW'
  | 'HOT'
  | 'RESTOCK'
  | 'BESTSELLER'
  | 'PREORDER'
  | 'BASIC';

export interface CatalogProduct {
  code: string;
  name: string;
  category: string;
  images?: string[];
  specLines?: string[];
  priceLines?: string[];
  price?: string;
  leadTime?: string;
  factory?: string;
  packaging?: string;
  note?: string;
  desc?: string;
  available?: boolean;
  popularity?: number;
  releaseTs?: number;
  tags?: CatalogTag[];
  logistics?: { enabled?: boolean; live?: boolean };
}

export type CatalogSort = 'newest' | 'popular' | 'codeAsc' | 'codeDesc';

export const CATALOG_WHATSAPP = '+85294110350';

export const CATALOG_REMARK =
  '請點擊 WhatsApp 詢盤，並填寫客戶名稱、要貨數量、交期，對應 sales 復盤做實';

export const TAG_LABELS: Record<string, string> = {
  NEW: '新品',
  HOT: '熱門',
  RESTOCK: '補貨',
  BESTSELLER: '熱銷',
  PREORDER: '預購',
  BASIC: '基本款',
};

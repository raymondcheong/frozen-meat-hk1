import type { CatalogProduct } from '../lib/catalog-types';

/** 凍品水產期貨報價 — 資料來源 catalog-frozen */
export const CATALOG_PRODUCTS: CatalogProduct[] = [
  {
    code: 'CN-PK-001',
    name: '高峰四肉',
    images: ['images/高峰四肉.jpg'],
    category: '中國豬肉',
    specLines: ['高峰四肉3-4塊'],
    priceLines: [
      '500箱以上：$19.8/kg',
      '300箱以上：$20.2/kg',
      '100–300箱：$20.5/kg',
      '100箱以下：$20.8/kg',
    ],
    price:
      '500箱以上 $19.8/kg；300箱以上 $20.2/kg；100–300箱 $20.5/kg；100箱以下 $20.8/kg',
    leadTime: '5、6、7月',
    available: true,
    popularity: 90,
    tags: ['HOT'],
  },
  {
    code: 'CN-PK-004',
    name: '中國帶皮片骨腩（A級）',
    images: [
      'images/WhatsApp Image 2026-05-04 at 3.43.56 PM (1).jpeg',
      'images/WhatsApp Image 2026-05-04 at 3.43.56 PM.jpeg',
    ],
    category: '中國豬肉',
    specLines: ['厚度3–6CM，皮下膘1.5–2.5CM'],
    priceLines: ['$11.5/LB'],
    price: '$11.5/LB',
    leadTime: '5月中/下、6/7月',
    available: true,
    popularity: 85,
    tags: ['NEW'],
  },
  {
    code: 'VN-CF-001',
    name: '越南Dai Thanh鯰魚柳',
    images: ['images/VN-CF-001-catfish.png'],
    category: '越南水產',
    factory: 'Plant：DL 471',
    specLines: ['IQF/IWP Packing'],
    priceLines: ['7成：$7.2/lb', '8成：$8/lb', '10成：$10/lb'],
    price: '7成 $7.2/lb；8成 $8/lb；10成 $10/lb',
    packaging: 'IQF/IWP Packing',
    leadTime: '6月',
    note: '截盤時間：8/5/2026',
    available: true,
    popularity: 88,
    tags: ['HOT', 'PREORDER'],
  },
];

import PageHeader from '../components/PageHeader';
import MarketData from '../sections/MarketData';

export default function MarketPage() {
  return (
    <>
      <PageHeader
        eyebrow="五豐行 · 凍品水產部"
        title="市場數據"
        subtitle="香港官方豬價、內地肉價、國際期貨及海產參考"
      />
      <MarketData />
    </>
  );
}

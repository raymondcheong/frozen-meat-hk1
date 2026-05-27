interface PageHeaderProps {
  eyebrow?: string;
  title: string;
  subtitle?: string;
}

export default function PageHeader({ eyebrow, title, subtitle }: PageHeaderProps) {
  return (
    <section className="relative overflow-hidden">
      <div className="nfh-brand-gradient">
        <div className="nfh-container py-10 sm:py-12">
          {eyebrow ? (
            <p className="text-[#E8A317] text-lg font-semibold mb-2">{eyebrow}</p>
          ) : null}
          <h1 className="text-3xl sm:text-4xl font-bold text-white leading-tight">{title}</h1>
          {subtitle ? (
            <p className="text-white/90 text-lg sm:text-xl mt-3 leading-relaxed max-w-2xl">{subtitle}</p>
          ) : null}
        </div>
        <div className="h-1 nfh-gold-line" />
      </div>
    </section>
  );
}

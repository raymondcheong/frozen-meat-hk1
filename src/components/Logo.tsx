interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
  variant?: 'light' | 'dark';
  showSubtitle?: boolean;
}

const heights = {
  sm: 'h-10',
  md: 'h-14 sm:h-16',
  lg: 'h-20 sm:h-24',
};

export default function Logo({ size = 'md', variant = 'dark', showSubtitle = true }: LogoProps) {
  const subColor = variant === 'light' ? 'text-white/90' : 'text-[#1C1C1C]';

  return (
    <div className="flex items-center gap-3 sm:gap-4">
      <img
        src="/images/nfh-logo.png"
        alt="五豐行 NG FUNG HONG"
        className={`${heights[size]} w-auto object-contain shrink-0`}
      />
      {showSubtitle && (
        <p className={`text-lg sm:text-xl font-bold leading-tight ${subColor} hidden sm:block`}>
          凍肉海產資訊平台
        </p>
      )}
    </div>
  );
}

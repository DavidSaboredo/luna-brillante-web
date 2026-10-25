export default function LogoLuna({ size = 36 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" aria-hidden="true">
      <defs>
        <linearGradient id="luna" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#f7e9bd" />
          <stop offset="100%" stopColor="#d9cdf0" />
        </linearGradient>
      </defs>
      <path d="M30 6a18 18 0 1 0 12 30A15 15 0 1 1 30 6Z" fill="url(#luna)" stroke="#8e7cc3" strokeWidth="1.2" />
      <circle cx="38" cy="12" r="1.6" fill="#d98a9c" />
      <circle cx="43" cy="20" r="1" fill="#8e7cc3" />
      <path d="M34 4l.8 1.8L36.6 6.6l-1.8.8L34 9.2l-.8-1.8-1.8-.8 1.8-.8z" fill="#8e7cc3" />
    </svg>
  );
}

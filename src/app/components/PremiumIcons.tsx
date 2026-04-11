import { useId, type SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement>;
type CrownVariant = "plain" | "gold";

export function FilledFlameIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" {...props}>
      <path
        d="M14.44 2.75c.3 2.24-.33 3.82-1.98 5.53-1.06 1.11-1.47 1.93-1.47 3.05 0 1.28.69 2.14 1.72 2.14 1.41 0 2.44-1.29 2.44-3.34 0-.57-.07-1.14-.27-1.86 2.9 1.57 4.62 4.33 4.62 7.18 0 3.5-2.88 5.8-6.62 5.8-3.98 0-6.87-2.54-6.87-6.22 0-2.54 1.15-4.58 3.55-6.66 1.56-1.35 2.64-2.72 3.25-5.62.05-.23.29-.33.48-.2.67.44.98.91 1.15 1.2Z"
        fill="currentColor"
      />
      <path
        d="M12.01 13.2c1.39.86 2.12 2.01 2.12 3.27 0 1.54-1.06 2.66-2.57 2.66-1.59 0-2.72-1.16-2.72-2.77 0-1.17.6-2.13 1.94-3.16.35-.27.7-.57 1.03-1.12.05.46.1.77.2 1.12Z"
        fill="white"
        fillOpacity="0.28"
      />
    </svg>
  );
}

export function FilledMedalIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" {...props}>
      <path d="M8.1 2.5h3.14l1.22 4.24H9.32L8.1 2.5Zm4.66 0h3.14l-1.22 4.24h-3.14l1.22-4.24Z" fill="currentColor" fillOpacity="0.78" />
      <path
        d="M12 7.8c-4.03 0-7.05 2.88-7.05 6.83 0 4.01 3.08 6.87 7.05 6.87s7.05-2.86 7.05-6.87C19.05 10.68 16.03 7.8 12 7.8Z"
        fill="currentColor"
      />
      <path
        d="m12 10.35 1.06 2.15 2.37.34-1.72 1.67.41 2.36L12 15.75l-2.12 1.12.4-2.36-1.7-1.67 2.35-.34L12 10.35Z"
        fill="white"
        fillOpacity="0.92"
      />
    </svg>
  );
}

export function FilledCrownIcon({ variant = "plain", className, style, ...rest }: IconProps & { variant?: CrownVariant }) {
  const gradientId = useId();

  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className={className} style={style} {...rest}>
      <defs>
        <linearGradient id={gradientId} x1="4" y1="4" x2="19" y2="20" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#FFF4A8" />
          <stop offset="0.45" stopColor="#F7C948" />
          <stop offset="1" stopColor="#B7791F" />
        </linearGradient>
      </defs>
      <path
        d="M4.2 18.55 2.8 8.62c-.06-.41.39-.7.74-.48l4.19 2.69c.2.13.47.06.59-.15l2.76-5.3c.18-.35.69-.35.87 0l2.76 5.3c.12.21.39.28.59.15l4.19-2.69c.35-.22.8.07.74.48L19.8 18.55c-.06.46-.45.8-.92.8H5.12c-.47 0-.86-.34-.92-.8Z"
        fill={variant === "gold" ? `url(#${gradientId})` : "currentColor"}
      />
      <path d="M6.1 15.8h11.8v1.4H6.1v-1.4Z" fill="white" fillOpacity="0.28" />
      <circle cx="12" cy="8.3" r="0.95" fill="white" fillOpacity="0.85" />
      <circle cx="7.65" cy="10.85" r="0.78" fill="white" fillOpacity="0.75" />
      <circle cx="16.35" cy="10.85" r="0.78" fill="white" fillOpacity="0.75" />
    </svg>
  );
}
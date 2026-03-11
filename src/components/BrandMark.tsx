import { cn } from "../lib/utils";

interface BrandMarkProps {
  className?: string;
}

export function BrandMark({ className }: BrandMarkProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("w-4 h-4", className)}
      aria-hidden="true"
    >
      <rect x="2.5" y="4" width="5" height="16" rx="1.5" stroke="currentColor" strokeWidth="1.8" />
      <rect x="16.5" y="4" width="5" height="16" rx="1.5" stroke="currentColor" strokeWidth="1.8" />
      <path
        d="M7.5 8C10.5 8 13.5 8 16.5 8"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <path
        d="M7.5 12C10.5 12 13.5 12 16.5 12"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <path
        d="M7.5 16C10.5 16 13.5 16 16.5 16"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

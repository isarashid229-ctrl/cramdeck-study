import { cn } from "@/lib/utils";

type EagleCramLogoProps = {
  className?: string;
  iconClassName?: string;
  showText?: boolean;
  compact?: boolean;
  subtitle?: string;
};

export function EagleMark({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm",
        className
      )}
      aria-hidden="true"
    >
      <svg viewBox="0 0 64 64" className="h-7 w-7" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path
          d="M9 34.5C20.5 17.5 36.8 10.2 56 8c-5.4 4.3-8.6 8.8-9.6 13.4C41.8 22 38 23.7 35 26.5c4.2-.4 8.8.6 13.8 3.1-5.5 1.1-10 3.7-13.5 7.7-3.8 4.4-8.6 7-14.3 7.7 1.4-3.6 3.7-6.8 6.9-9.5C20.6 39 14.3 38.7 9 34.5Z"
          fill="currentColor"
        />
        <path
          d="M22.4 48.5c7.2-.7 12.9-3.8 17.1-9.2 2.9-3.8 6.4-6.1 10.5-6.9-2.2 6.9-6.4 12.6-12.5 17.1-4.7 3.4-9.7 5.4-15.1 6 1-2.3 1-4.6 0-7Z"
          fill="currentColor"
          opacity=".82"
        />
        <path d="M42.8 17.7 53 12.5l-5 8.3-5.2-3.1Z" fill="currentColor" opacity=".55" />
        <path d="M33 28.2c4.3-1 8.5-.5 12.6 1.5" stroke="currentColor" strokeWidth="3.4" strokeLinecap="round" opacity=".55" />
      </svg>
    </span>
  );
}

export function EagleCramLogo({
  className,
  iconClassName,
  showText = true,
  compact = false,
  subtitle,
}: EagleCramLogoProps) {
  return (
    <span className={cn("inline-flex items-center gap-3", className)}>
      <EagleMark className={iconClassName} />
      {showText && !compact && (
        <span className="min-w-0">
          <span className="block text-lg font-bold leading-tight">EagleCram</span>
          {subtitle && <span className="block truncate text-xs text-muted-foreground">{subtitle}</span>}
        </span>
      )}
    </span>
  );
}

import Image from "next/image";

/**
 * CHP Logo — Center for Health Psychology / UKRIDA
 *
 * Renders the brand logo. By default ("user" variant), it renders the user-side image logo.
 * If variant is "admin", it renders the legacy SVG logo.
 */
export function ChpLogo({
  size = 36,
  className = "",
  variant = "user",
}: {
  size?: number;
  className?: string;
  variant?: "user" | "admin";
}) {
  if (variant === "user") {
    return (
      <Image
        src="/images/user-chp-logo.png"
        alt="Center for Health Psychology Logo"
        width={size}
        height={size}
        className={className}
        style={{ flexShrink: 0, objectFit: "contain" }}
        priority
      />
    );
  }

  return (
    <Image
      src="/logo_chp_v2.png"
      alt="CHP Admin Logo"
      width={size}
      height={size}
      className={className}
      style={{ flexShrink: 0, objectFit: "contain" }}
      priority
    />
  );
}

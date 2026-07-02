function getInitials(name?: string | null, email?: string | null): string {
  const fromName =
    name
      ?.split(" ")
      .filter(Boolean)
      .map((part) => part[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() ?? "";

  if (fromName) return fromName;
  return email?.slice(0, 1).toUpperCase() ?? "?";
}

export function UserAvatar({
  name,
  email,
  image,
  size = "sm",
}: {
  name?: string | null;
  email?: string | null;
  image?: string | null;
  size?: "sm" | "md";
}) {
  const initials = getInitials(name, email);
  const sizeClass = size === "md" ? "size-10 text-sm" : "size-8 text-xs";

  return (
    <div
      className={`flex items-center justify-center overflow-hidden rounded-full border border-border bg-accent font-semibold text-foreground ${sizeClass}`}
    >
      {image ? (
        <img src={image} alt={name ?? email ?? ""} className="size-full object-cover" />
      ) : (
        initials
      )}
    </div>
  );
}

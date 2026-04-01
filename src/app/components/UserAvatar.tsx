import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { resolveUserAvatarUrl } from "../lib/user-directory";
import defaultAvatar from "../assets/default-avatar.svg";

type UserAvatarProps = {
  avatar?: string | null;
  label?: string | null;
  className?: string;
  fallbackClassName?: string;
};

function getInitials(label?: string | null) {
  const trimmed = (label ?? "").trim();
  if (!trimmed) return "?";

  const parts = trimmed.split(/\s+/).filter(Boolean);
  if (parts.length > 1) {
    return parts
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() ?? "")
      .join("");
  }

  return trimmed.slice(0, 2).toUpperCase();
}

export default function UserAvatar({ avatar, label, className, fallbackClassName }: UserAvatarProps) {
  const src = resolveUserAvatarUrl(avatar) || defaultAvatar;
  const alt = (label ?? "User").trim() || "User";

  return (
    <Avatar className={className}>
      <AvatarImage src={src} alt={alt} className="object-cover" />
      <AvatarFallback className={fallbackClassName}>{getInitials(label)}</AvatarFallback>
    </Avatar>
  );
}

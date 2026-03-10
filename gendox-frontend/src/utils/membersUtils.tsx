import React from "react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface UserTypeStatusEntry {
  title: string;
  color: string;
}

export interface MemberRoleStatusEntry {
  title: string;
}

export interface RenderClientAvatarUser {
  id?: string;
  email?: string;
  userName?: string;
}

// ─── Color palette ────────────────────────────────────────────────────────────

/** Maps a palette index → Tailwind bg/text pair used for avatar coloring. */
const colorOptions: string[] = [
  "bg-green-100 text-green-700",   // success
  "bg-red-100 text-red-700",       // error
  "bg-amber-100 text-amber-700",   // warning
  "bg-sky-100 text-sky-700",       // info
  "bg-violet-100 text-violet-700", // primary
  "bg-pink-100 text-pink-700",     // secondary
];

// ─── Constants ────────────────────────────────────────────────────────────────

export const userTypeStatus: Record<string, UserTypeStatusEntry> = {
  GENDOX_USER: { title: "User", color: "primary" },
  GENDOX_AGENT: { title: "AI Agent", color: "success" },
  UNKNOWN: { title: "Unknown", color: "error" },
  DISCORD_USER: { title: "Discord User", color: "warning" },
  GENDOX_SUPER_ADMIN: { title: "GENDOX_SUPER_ADMIN", color: "info" },
};

export const memberRoleStatus: Record<string, MemberRoleStatusEntry> = {
  ROLE_OWNER: { title: "Owner" },
  ROLE_ADMIN: { title: "Admin" },
  ROLE_READER: { title: "Read Only" },
  ROLE_EDITOR: { title: "Editor" },
  UNKNOWN: { title: "UNKNOWN" },
};

// ─── Utilities ────────────────────────────────────────────────────────────────

/** Escapes special RegExp characters in a string. */
export const escapeRegExp = (value: string): string =>
  value.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");

/** Produces a deterministic 32-bit integer hash for a string. */
const hashCode = (str: string): number => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0; // Convert to 32-bit integer
  }
  return hash;
};

// ─── Avatar renderer ──────────────────────────────────────────────────────────

/**
 * Renders a shadcn Avatar with deterministic coloring derived from
 * the user's unique value (id → email → userName → "default").
 */
export const renderClientAvatar = (user: RenderClientAvatarUser): React.ReactElement => {
  const uniqueValue = user.id ?? user.email ?? user.userName ?? "default";
  const colorIndex = Math.abs(hashCode(uniqueValue)) % colorOptions.length;
  const color = colorOptions[colorIndex];

  const displayName = user.userName ?? user.email ?? "U";
  const initial = displayName.charAt(0).toUpperCase();

  return (
    <Avatar className={cn("mr-3 h-8 w-8", color)}>
      <AvatarFallback className={cn("text-xs font-semibold", color)}>
        {initial}
      </AvatarFallback>
    </Avatar>
  );
};

// ─── Role helpers ─────────────────────────────────────────────────────────────

/** Maps a role key to the set of roles that role is permitted to assign. */
const allowedRolesMap: Record<string, string[]> = {
  ROLE_OWNER: ["ROLE_ADMIN", "ROLE_EDITOR", "ROLE_READER"],
  ROLE_ADMIN: ["ROLE_ADMIN", "ROLE_EDITOR", "ROLE_READER"],
  ROLE_EDITOR: ["ROLE_EDITOR", "ROLE_READER"],
  ROLE_READER: ["ROLE_READER"],
};

/** Returns the list of roles that the given `userRole` is allowed to assign. */
export const getAllowedRoles = (userRole: string | undefined): string[] =>
  (userRole && allowedRolesMap[userRole]) || [];

/** Numeric rank for each role — higher value means higher privilege. */
export const roleRankMap: Record<string, number> = {
  ROLE_OWNER: 4,
  ROLE_ADMIN: 3,
  ROLE_EDITOR: 2,
  ROLE_READER: 1,
  UNKNOWN: 0,
};

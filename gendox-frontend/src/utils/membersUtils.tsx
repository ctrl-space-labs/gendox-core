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
  icon: string;
}

export interface RenderClientAvatarUser {
  id?: string;
  email?: string;
  userName?: string;
}

// ─── Color palette ────────────────────────────────────────────────────────────

/** Maps a palette index → Tailwind bg/text pair used for the identicon tint. */
const colorOptions: Array<{ fg: string; bg: string; tailwind: string }> = [
  { fg: "#16a34a", bg: "#16a34a", tailwind: "bg-green-100 text-green-700" },   // success
  { fg: "#dc2626", bg: "#dc2626", tailwind: "bg-red-100 text-red-700" },       // error
  { fg: "#d97706", bg: "#d97706", tailwind: "bg-amber-100 text-amber-700" },   // warning
  { fg: "#0ea5e9", bg: "#0ea5e9", tailwind: "bg-sky-100 text-sky-700" },       // info
  { fg: "#7c3aed", bg: "#7c3aed", tailwind: "bg-violet-100 text-violet-700" }, // primary
  { fg: "#db2777", bg: "#db2777", tailwind: "bg-pink-100 text-pink-700" },     // secondary
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
  ROLE_OWNER: { title: "Owner", icon: "mdi:shield-account" },
  ROLE_ADMIN: { title: "Admin", icon: "mdi:shield-crown-outline" },
  ROLE_READER: { title: "Read Only", icon: "mdi:smart-card-reader-outline" },
  ROLE_EDITOR: { title: "Editor", icon: "mdi:pencil-outline" },
  UNKNOWN: { title: "UNKNOWN", icon: "mdi:account-question" },
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
 * Renders a shadcn Avatar with a deterministic identicon image derived from
 * the user's unique value (id → email → userName → "default").
 *
 * Replaces the MUI `CustomAvatar` usage; no longer requires `useTheme()`.
 */
export const renderClientAvatar = (user: RenderClientAvatarUser): React.ReactElement => {
  const uniqueValue = user.id ?? user.email ?? user.userName ?? "default";
  const colorIndex = Math.abs(hashCode(uniqueValue)) % colorOptions.length;
  const { tailwind } = colorOptions[colorIndex];

  const displayName = user.userName ?? user.email ?? "U";
  const initial = displayName.charAt(0).toUpperCase();

  return (
    <Avatar className={cn("mr-3 h-8 w-8", tailwind)}>
      <AvatarFallback className={cn("text-xs font-semibold", tailwind)}>
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

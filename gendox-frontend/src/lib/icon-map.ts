/**
 * Icon Mapping Reference: MUI/MDI → Lucide React
 *
 * This file serves as a reference for migrating icons from
 * @mui/icons-material, mdi-material-ui, and @iconify/react (mdi:*)
 * to lucide-react equivalents.
 *
 * Usage:
 *   import { Search, Plus, X } from "lucide-react"
 *   <Search className="h-4 w-4" />
 */

// @mui/icons-material → lucide-react mapping
export const muiToLucide = {
  // Navigation & Actions
  AccountTreeIcon: "GitBranch",          // or "Network"
  AddIcon: "Plus",
  AutoAwesomeIcon: "Sparkles",
  BlockIcon: "Ban",
  BuildCircleIcon: "Wrench",
  CancelIcon: "XCircle",
  ChatBubbleOutlineIcon: "MessageCircle",
  CheckCircleIcon: "CheckCircle",
  ClearIcon: "X",
  CloseIcon: "X",
  DeleteIcon: "Trash2",
  DeleteOutlineIcon: "Trash",
  DescriptionIcon: "FileText",
  DescriptionOutlinedIcon: "FileText",
  DocumentScannerIcon: "ScanText",
  DownloadIcon: "Download",
  DragIndicatorIcon: "GripVertical",
  EditIcon: "Pencil",
  ExpandLessIcon: "ChevronUp",
  ExpandMoreIcon: "ChevronDown",
  ErrorIcon: "CircleAlert",
  ErrorOutlineIcon: "AlertCircle",
  FullscreenExitIcon: "Minimize2",
  FullscreenIcon: "Maximize2",
  HelpOutlineIcon: "HelpCircle",
  InfoOutlinedIcon: "Info",
  LockIcon: "Lock",
  MoreVertIcon: "MoreVertical",
  PlayCircleOutlineIcon: "PlayCircle",
  RefreshIcon: "RefreshCw",
  ReplayIcon: "RotateCcw",
  RocketLaunchIcon: "Rocket",
  SaveIcon: "Save",
  SearchIcon: "Search",
  WarningIcon: "AlertTriangle",
  WarningAmberIcon: "AlertTriangle",
} as const

// mdi-material-ui → lucide-react mapping
export const mdiToLucide = {
  ArrowUp: "ArrowUp",
  BellOutline: "Bell",
  DotsVertical: "MoreVertical",
  Menu: "Menu",
  WeatherNight: "Moon",
  WeatherSunny: "Sun",
} as const

// @iconify/react mdi:* → lucide-react mapping
export const iconifyToLucide = {
  "mdi:account": "User",
  "mdi:account-group": "Users",
  "mdi:account-key-outline": "KeyRound",
  "mdi:account-outline": "UserRound",
  "mdi:account-plus-outline": "UserPlus",
  "mdi:account-question": "UserSearch",
  "mdi:arrow-down": "ArrowDown",
  "mdi:arrow-left-bold": "ArrowLeft",
  "mdi:arrow-right-thin": "ArrowRight",
  "mdi:brain": "Brain",
  "mdi:briefcase-variant-outline": "Briefcase",
  "mdi:calendar-clock": "CalendarClock",
  "mdi:chart-line": "TrendingUp",
  "mdi:check-decagram": "BadgeCheck",
  "mdi:clipboard-check-outline": "ClipboardCheck",
  "mdi:close": "X",
  "mdi:cloud-upload": "CloudUpload",
  "mdi:cog": "Settings",
  "mdi:cog-outline": "Settings",
  "mdi:content-copy": "Copy",
  "mdi:content-save-outline": "Save",
  "mdi:coolant-temperature": "Thermometer",
  "mdi:creation": "Sparkles",
  "mdi:curly-braces": "Braces",
  "mdi:delete": "Trash2",
  "mdi:delete-outline": "Trash",
  "mdi:domain": "Building2",
  "mdi:dots-vertical": "MoreVertical",
  "mdi:drag-horizontal-variant": "GripHorizontal",
  "mdi:email-send-outline": "MailOpen",
  "mdi:file": "File",
  "mdi:file-document": "FileText",
  "mdi:file-document-outline": "FileText",
  "mdi:file-pdf-box": "FileType2",
  "mdi:format-list-numbered": "ListOrdered",
  "mdi:gesture-tap-button": "MousePointerClick",
  "mdi:hammer-wrench": "Hammer",
  "mdi:information-outline": "Info",
  "mdi:magnify": "Search",
  "mdi:menu": "Menu",
  "mdi:menu-swap-outline": "ArrowLeftRight",
  "mdi:message": "MessageSquare",
  "mdi:open-in-new": "ExternalLink",
  "mdi:pencil-outline": "Pencil",
  "mdi:plus": "Plus",
  "mdi:refresh": "RefreshCw",
  "mdi:robot": "Bot",
  "mdi:scale-balance": "Scale",
  "mdi:search": "Search",
  "mdi:send": "Send",
  "mdi:settings": "Settings",
  "mdi:shield-account": "ShieldCheck",
  "mdi:shield-check-outline": "ShieldCheck",
  "mdi:shield-crown-outline": "Crown",
  "mdi:smart-card-reader-outline": "CreditCard",
  "mdi:subdirectory-arrow-left": "CornerDownLeft",
  "mdi:tab-plus": "FilePlus",
  "mdi:thermometer-lines": "Thermometer",
  "mdi:view-grid-outline": "LayoutGrid",
  "mdi:view-list-outline": "List",
  "mdi:web": "Globe",
  "mdi:window-close": "X",
} as const

export const CATEGORIES = ["Music", "Workshop", "Food", "Sports", "Kids"] as const;

// Event card designer. The API stores these ids; each client decides how to draw them.
export const CARD_THEMES = ["sunset", "ocean", "forest"] as const;
export type CardTheme = (typeof CARD_THEMES)[number];

export const STICKERS = ["music", "party", "heart", "star", "fire"] as const;
export type Sticker = (typeof STICKERS)[number];

export const MAX_STICKERS = 3;

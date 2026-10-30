export type Tier = 1 | 2 | 3 | 4 | 5;
export type Gender = "m" | "f";
export type Division = "D1" | "D2" | "D3" | "NAIA" | "JUCO";

export interface School {
  /** Stable slug used as the answer key. */
  id: string;
  /** Short canonical name shown in the dropdown, e.g. "Michigan". */
  name: string;
  /** Full institutional name, shown as the disambiguator. */
  fullName: string;
  /** Two-letter state code. */
  state: string;
  /** Extra accepted spellings: abbreviations, nicknames, mascots. */
  aliases: string[];
  /** Defaults to D1. Non-D1 schools exist only because an athlete needs them. */
  division?: Division;
}

export interface Athlete {
  id: string;
  name: string;
  /** Shown on the clue card, e.g. "Football", "Swimming". */
  sport: string;
  /** Not shown on the card; kept for curation and tier audits. */
  league?: string;
  /** Jersey number as displayed. Null for sports without numbers. */
  number: string | null;
  active: boolean;
  gender: Gender;
  /** Cross-sport difficulty used by Classic mode: 1 NFL/NBA stars ... 5 deep cuts. */
  tier: Tier;
  /** Within-sport fame used by sport modes: 1 household name ... 5 deep cut. */
  fame: Tier;
  /** Every school where the athlete competed. Any of them is a correct answer. */
  schools: string[];
}

export interface PuzzleItem {
  athlete: Athlete;
  /** Difficulty level 1-5 for this item (tier in Classic, fame bucket in sport modes). Drives points. */
  tier: Tier;
  /** 0-based position in the day's order. */
  position: number;
}

export type PuzzleKind = "daily" | "practice";

export interface Puzzle {
  id: string;
  kind: PuzzleKind;
  /** Game mode id, e.g. "classic" or "football". */
  mode: string;
  /** ET calendar date, YYYY-MM-DD. Daily only. */
  dateET?: string;
  /** 1-based puzzle number since launch. Daily only. */
  number?: number;
  items: PuzzleItem[];
}

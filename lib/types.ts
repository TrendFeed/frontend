export interface Comic {
  id: string;
  repoName: string;
  repoUrl: string;
  stars: number;
  language: string;
  panels: string[]; // Image URLs
  keyInsights: string[];
  isNew: boolean;
  likes: number;
  shares: number;
  comments: number;
  createdAt: string;
}

export interface UserPreferences {
  interests: string[]; // ["React", "Python", "Rust"]
  notifications: {
    dailyDigest: boolean;
    newTrending: boolean;
  };
  comicStyle: "manga" | "western" | "minimal";
}

export type TabType = "forYou" | "trending" | "saved";
export type SortType = "stars" | "recent" | "trending";
export type LanguageFilter = "all" | string;

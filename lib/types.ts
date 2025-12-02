export interface Comic {
  id: number;
  repoName: string;
  repoUrl: string;
  stars: number;
  language: string;
  panels: string[];
  keyInsights: string;
  isNew: boolean;
  likes: number;
  shares: number;
  comments: number;
  createdAt: string;
  savedAt?: string;
  title: string;
  category: string;
}

export interface PaginationInfo {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
}

export interface PaginatedResult<T> {
  data: T[];
  pagination: PaginationInfo;
}

export interface UserPreferences {
  interests: string[];
  notifications: {
    dailyDigest: boolean;
    newTrending: boolean;
    [key: string]: boolean;
  };
  comicStyle: "manga" | "western" | "minimal" | string;
}

export interface UserStats {
  savedComics: number;
  likedComics: number;
  commentsCount: number;
}

export interface UserProfile {
  uid: string;
  email: string;
  displayName?: string;
  photoURL?: string;
  preferences?: UserPreferences;
  stats?: UserStats;
  createdAt?: string;
  updatedAt?: string;
}

export type TabType = "forYou" | "trending" | "saved";
export type SortType = "stars" | "recent" | "trending";
export type LanguageFilter = "all" | string;

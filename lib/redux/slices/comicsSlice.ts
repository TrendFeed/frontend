import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import {
  Comic,
  TabType,
  SortType,
  LanguageFilter,
  PaginationInfo,
} from "@/lib/types";

interface ComicsState {
  comics: Comic[];
  activeTab: TabType;
  sortBy: SortType;
  languageFilter: LanguageFilter;
  searchQuery: string;
  loading: boolean;
  pagination: PaginationInfo | null;
  error: string | null;
}

const initialState: ComicsState = {
  comics: [],
  activeTab: "trending",
  sortBy: "trending",
  languageFilter: "all",
  searchQuery: "",
  loading: false,
  pagination: null,
  error: null,
};

const comicsSlice = createSlice({
  name: "comics",
  initialState,
  reducers: {
    setComics: (state, action: PayloadAction<Comic[]>) => {
      state.comics = action.payload;
    },
    setActiveTab: (state, action: PayloadAction<TabType>) => {
      state.activeTab = action.payload;
    },
    setSortBy: (state, action: PayloadAction<SortType>) => {
      state.sortBy = action.payload;
    },
    setLanguageFilter: (state, action: PayloadAction<LanguageFilter>) => {
      state.languageFilter = action.payload;
    },
    setSearchQuery: (state, action: PayloadAction<string>) => {
      state.searchQuery = action.payload;
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
    setPagination: (state, action: PayloadAction<PaginationInfo | null>) => {
      state.pagination = action.payload;
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
    updateComicMetrics: (
      state,
      action: PayloadAction<{ id: number; changes: Partial<Comic> }>
    ) => {
      const comic = state.comics.find((c) => c.id === action.payload.id);
      if (comic) {
        Object.assign(comic, action.payload.changes);
      }
    },
  },
});

export const {
  setComics,
  setActiveTab,
  setSortBy,
  setLanguageFilter,
  setSearchQuery,
  setLoading,
  setPagination,
  setError,
  updateComicMetrics,
} = comicsSlice.actions;

export default comicsSlice.reducer;

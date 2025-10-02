import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { Comic, TabType, SortType, LanguageFilter } from "@/lib/types";

interface ComicsState {
  comics: Comic[];
  activeTab: TabType;
  sortBy: SortType;
  languageFilter: LanguageFilter;
  searchQuery: string;
  loading: boolean;
}

const initialState: ComicsState = {
  comics: [],
  activeTab: "forYou",
  sortBy: "trending",
  languageFilter: "all",
  searchQuery: "",
  loading: false,
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
    toggleLike: (state, action: PayloadAction<string>) => {
      const comic = state.comics.find((c) => c.id === action.payload);
      if (comic) {
        comic.likes += 1;
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
  toggleLike,
} = comicsSlice.actions;

export default comicsSlice.reducer;

import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { UserPreferences, UserProfile } from "@/lib/types";

interface UserState {
  preferences: UserPreferences;
  savedComics: number[];
  likedComics: number[];
  isAuthenticated: boolean;
  profile: UserProfile | null;
}

const initialState: UserState = {
  preferences: {
    interests: [],
    notifications: {
      dailyDigest: true,
      newTrending: true,
    },
    comicStyle: "western",
  },
  savedComics: [],
  likedComics: [],
  isAuthenticated: false,
  profile: null,
};

const userSlice = createSlice({
  name: "user",
  initialState,
  reducers: {
    setPreferences: (state, action: PayloadAction<UserPreferences>) => {
      state.preferences = action.payload;
    },
    addInterest: (state, action: PayloadAction<string>) => {
      if (!state.preferences.interests.includes(action.payload)) {
        state.preferences.interests.push(action.payload);
      }
    },
    removeInterest: (state, action: PayloadAction<string>) => {
      state.preferences.interests = state.preferences.interests.filter(
        (interest) => interest !== action.payload
      );
    },
    setSavedComicIds: (state, action: PayloadAction<number[]>) => {
      state.savedComics = action.payload;
    },
    addSavedComicId: (state, action: PayloadAction<number>) => {
      if (!state.savedComics.includes(action.payload)) {
        state.savedComics.push(action.payload);
      }
    },
    removeSavedComicId: (state, action: PayloadAction<number>) => {
      state.savedComics = state.savedComics.filter((id) => id !== action.payload);
    },
    toggleLikedComic: (state, action: PayloadAction<number>) => {
      const index = state.likedComics.indexOf(action.payload);
      if (index > -1) {
        state.likedComics.splice(index, 1);
      } else {
        state.likedComics.push(action.payload);
      }
    },
    setAuthenticated: (state, action: PayloadAction<boolean>) => {
      state.isAuthenticated = action.payload;
    },
    setUserProfile: (state, action: PayloadAction<UserProfile | null>) => {
      state.profile = action.payload;
      if (action.payload?.preferences) {
        state.preferences = action.payload.preferences;
      }
    },
  },
});

export const {
  setPreferences,
  addInterest,
  removeInterest,
  setSavedComicIds,
  addSavedComicId,
  removeSavedComicId,
  toggleLikedComic,
  setAuthenticated,
  setUserProfile,
} = userSlice.actions;

export default userSlice.reducer;

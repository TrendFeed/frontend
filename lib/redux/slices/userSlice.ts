import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { UserPreferences } from "@/lib/types";

interface UserState {
  preferences: UserPreferences;
  savedComics: string[]; // Comic IDs
  likedComics: string[]; // Comic IDs
  isAuthenticated: boolean;
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
    toggleSavedComic: (state, action: PayloadAction<string>) => {
      const index = state.savedComics.indexOf(action.payload);
      if (index > -1) {
        state.savedComics.splice(index, 1);
      } else {
        state.savedComics.push(action.payload);
      }
    },
    toggleLikedComic: (state, action: PayloadAction<string>) => {
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
  },
});

export const {
  setPreferences,
  addInterest,
  removeInterest,
  toggleSavedComic,
  toggleLikedComic,
  setAuthenticated,
} = userSlice.actions;

export default userSlice.reducer;

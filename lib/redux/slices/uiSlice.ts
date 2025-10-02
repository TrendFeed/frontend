import { createSlice, PayloadAction } from "@reduxjs/toolkit";

interface UiState {
  shareModalOpen: boolean;
  shareModalComicId: string | null;
  notificationMessage: string | null;
  notificationType: "success" | "error" | "info" | null;
}

const initialState: UiState = {
  shareModalOpen: false,
  shareModalComicId: null,
  notificationMessage: null,
  notificationType: null,
};

const uiSlice = createSlice({
  name: "ui",
  initialState,
  reducers: {
    openShareModal: (state, action: PayloadAction<string>) => {
      state.shareModalOpen = true;
      state.shareModalComicId = action.payload;
    },
    closeShareModal: (state) => {
      state.shareModalOpen = false;
      state.shareModalComicId = null;
    },
    showNotification: (
      state,
      action: PayloadAction<{
        message: string;
        type: "success" | "error" | "info";
      }>
    ) => {
      state.notificationMessage = action.payload.message;
      state.notificationType = action.payload.type;
    },
    hideNotification: (state) => {
      state.notificationMessage = null;
      state.notificationType = null;
    },
  },
});

export const {
  openShareModal,
  closeShareModal,
  showNotification,
  hideNotification,
} = uiSlice.actions;

export default uiSlice.reducer;

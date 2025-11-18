import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { Comic } from "@/lib/types";

interface UiState {
  shareModalOpen: boolean;
  shareModalComic: Comic | null;
  newsletterModalOpen: boolean;
  notificationMessage: string | null;
  notificationType: "success" | "error" | "info" | null;
}

const initialState: UiState = {
  shareModalOpen: false,
  shareModalComic: null,
  newsletterModalOpen: false,
  notificationMessage: null,
  notificationType: null,
};

const uiSlice = createSlice({
  name: "ui",
  initialState,
  reducers: {
    openShareModal: (state, action: PayloadAction<Comic>) => {
      state.shareModalOpen = true;
      state.shareModalComic = action.payload;
    },
    closeShareModal: (state) => {
      state.shareModalOpen = false;
      state.shareModalComic = null;
    },
    openNewsletterModal: (state) => {
      state.newsletterModalOpen = true;
    },
    closeNewsletterModal: (state) => {
      state.newsletterModalOpen = false;
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
  openNewsletterModal,
  closeNewsletterModal,
  showNotification,
  hideNotification,
} = uiSlice.actions;

export default uiSlice.reducer;

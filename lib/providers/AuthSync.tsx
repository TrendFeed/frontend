"use client";

import { useEffect } from "react";
import { useAuth } from "@/lib/contexts/AuthContext";
import { useAppDispatch } from "@/lib/redux/hooks";
import {
  setAuthenticated,
  setSavedComicIds,
  setUserProfile,
} from "@/lib/redux/slices/userSlice";
import { getSavedComics, getUserProfile } from "@/lib/api/user";

export default function AuthSync() {
  const { user, loading } = useAuth();
  const dispatch = useAppDispatch();

  useEffect(() => {
    let cancelled = false;

    const syncUserData = async () => {
      if (!user) {
        dispatch(setAuthenticated(false));
        dispatch(setSavedComicIds([]));
        dispatch(setUserProfile(null));
        return;
      }

      dispatch(setAuthenticated(true));

      try {
        const [profile, savedComics] = await Promise.all([
          getUserProfile(),
          getSavedComics({ page: 1, limit: 100 }),
        ]);

        if (cancelled) {
          return;
        }

        dispatch(setUserProfile(profile));
        dispatch(setSavedComicIds(savedComics.data.map((comic) => comic.id)));
      } catch (error) {
        console.error("Failed to sync user data:", error);
      }
    };

    if (!loading) {
      void syncUserData();
    }

    return () => {
      cancelled = true;
    };
  }, [user, loading, dispatch]);

  return null;
}

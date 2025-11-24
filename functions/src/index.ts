// functions/src/index.ts
// GitHub 크롤 / 후보
export { ingest, crawl, candidates, crawlScheduled , dispatch, forceCandidate } from "./github";

export { seedComics } from "./seed";

// Comics API
export {
  getComics,
  getComicById,
  getNewComics,
  getComicsByLanguage,
  likeComic,
  shareComic,
} from "./comics";

// Newsletter API
export {
  newsletterSubscribe,
  newsletterConfirm,
  newsletterUnsubscribe,
} from "./newsletter";

export {
  postComicFromAI
} from "./ai"

export {
  verifyUserSession,
  getUserProfile,
  updateUserProfile,
  getSavedComics,
  saveUserComic,
  removeSavedComic,
} from "./user"

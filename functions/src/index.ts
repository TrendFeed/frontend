// functions/src/index.ts
// GitHub 크롤 / 후보
export { ingest, crawl, candidates, crawlScheduled } from "./github";

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
} from "./newsletter";
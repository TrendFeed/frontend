// functions/src/index.ts

// GitHub 크롤 / 후보
export { ingest, crawl, candidates, crawlScheduled } from "./github";

// Comics API
export {
  getComics,
  getComicById,
  getNewComics,
  getComicsByLanguage,
  likeComic,
  shareComic,
} from "./comics";

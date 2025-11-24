import { Comic } from "@/lib/types";

const now = new Date().toISOString();

const createPanelPaths = (folder: string, files: string[]) =>
  files.map((file) => `/mock/${folder}/${file}`);

const nextPanels = createPanelPaths("next", [
  "next1.png",
  "next2.png",
  "next3.png",
  "next4.png",
  "next5.webp",
  "next6.png",
  "next7.png",
]);

const langchainPanels = createPanelPaths("langchain-ai", [
  "langchain1.png",
  "langchain2.png",
  "langchain3.png",
  "langchain4.png",
  "langchain5.webp",
  "langchain6.png",
  "langchain7.webp",
  "langchain8.png",
]);

export const MOCK_COMICS: Comic[] = [
  {
    id: 101,
    repoName: "vercel/next.js",
    repoUrl: "https://github.com/vercel/next.js",
    stars: 124205,
    language: "TypeScript",
    panels: nextPanels,
    keyInsights: [
      "Next.js 15 introduces Partial Prerendering, letting devs mix static and dynamic islands without extra config.",
      "The new Turbopack dev server cuts cold-boot time in half for large monorepos.",
      "App Router adoption crossed 70% of the ecosystem last month, unlocking streaming UIs by default.",
    ],
    isNew: true,
    likes: 1840,
    shares: 512,
    comments: 76,
    createdAt: now,
  },
  {
    id: 202,
    repoName: "langchain-ai/langchain",
    repoUrl: "https://github.com/langchain-ai/langchain",
    stars: 72458,
    language: "Python",
    panels: langchainPanels,
    keyInsights: [
      "v0.3's Runnable interfaces unify graph, agent, and tools pipelines under one mental model.",
      "LangGraph now ships persistence primitives so conversations can pause/resume safely.",
      "The new templates catalog highlights ready-to-run AI agents for search, code, and operations teams.",
    ],
    isNew: false,
    likes: 1320,
    shares: 402,
    comments: 58,
    createdAt: now,
  },
];

export const findMockComicById = (id: number): Comic | null => {
  return MOCK_COMICS.find((comic) => comic.id === id) ?? null;
};

export const getMockComicsByLanguage = (language: string): Comic[] => {
  return MOCK_COMICS.filter(
    (comic) => comic.language.toLowerCase() === language.toLowerCase()
  );
};

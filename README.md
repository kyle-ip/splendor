# Splendor Guide

A web tutorial for Splendor, from beginner to advanced play. Includes layered lessons, interactive tools, and a rules reference. Ready to deploy on GitHub Pages.

## Features

- **Layered lessons**: Before you start → Basics → Intermediate → Advanced
- **Interactive tools**: Cost calculator, noble tracker, scenario quizzes, card valuation, post-game review template
- **Setup wizard**: Player-count–guided table setup
- **Learning progress**: Completed chapters saved in the browser
- **Appendix**: Rules FAQ and expansion module overview

## Local development

```bash
npm install
npm run dev
```

Then open: `http://localhost:5173/splendor-guide/`

## Build and preview

```bash
npm run build
npm run preview
```

## Deploy to GitHub Pages

1. Push this repository to GitHub
2. In the repo **Settings → Pages**, set Source to **GitHub Actions**
3. On push to `main` or `master`, `.github/workflows/deploy.yml` builds and deploys automatically
4. Site URL: `https://<username>.github.io/splendor-guide/`

If the repository name is not `splendor-guide`, update `base` in `vite.config.ts` and `basename` in `src/main.tsx` to match.

## Stack

Vite · React · TypeScript · Tailwind CSS · react-router-dom · react-markdown · gray-matter

## Layout

```
content/          # Lesson Markdown
src/
  components/     # Layout and shared UI
  features/       # Tools and quizzes
  pages/          # Route pages
  data/           # Nobles, quizzes, and other static data
  lib/            # Lessons, progress, gem helpers
```

## Suggested learning path

1. New players: Part 0 + Part 1 (~25 minutes) → play a physical game
2. Stronger win rate: Part 2 + tool practice
3. Competitive play: Part 3 + scenario quizzes + review template

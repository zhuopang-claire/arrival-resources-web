# Arrival Resources Web App

Arrival Resources is a lightweight web map and directory that helps users find welcoming services in Greater Boston.

- Switching between Map View and List View
- Print PDFs (from List View)
- Search and filtering by service tags, name, and locations

> This repository contains the **web frontend** (Next.js App Router). 

---

## Tech stack

- Next.js (App Router)
- React + TypeScript
- Mapbox GL via `react-map-gl`
- Tailwind CSS

---

## Getting started

### 1) Install dependencies

```bash
npm install
```

### 2) Configure environment variables

Create a file named `.env.local` in this folder (`arrival-resources-web/`) with:

```bash
NEXT_PUBLIC_MAPBOX_TOKEN=pk.your_mapbox_public_token_here
```

### 3) Run the dev server

```bash
npm run dev
```

Open `http://localhost:3000`.

---

## Data

The app reads a static JSON file from the public folder:

- `public/data/places_public.json`

---

## Common tasks

### Build

```bash
npm run build
npm start
```

### Lint

```bash
npm run lint
```

---

## Deployment

This project deploys cleanly to Vercel.

- Set `NEXT_PUBLIC_MAPBOX_TOKEN` in Vercel environment variables.
- Ensure any Mapbox token URL restrictions include your deployed domain.

---

## Citation

If you use this project in academic work, please cite it. A `CITATION.cff` file is included so GitHub can display the preferred citation.

## License

MIT License (c) 2026 Zhuo Pang.

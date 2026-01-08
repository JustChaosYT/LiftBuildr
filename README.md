# LiftBuildr

LiftBuildr — adaptive fitness mobile app MVP (Expo React Native).

Quick start

1. Install dependencies:
```bash
cd LiftBuildr
npm install
# or: yarn
```

2. Start the app (requires Expo CLI):
```bash
npx expo start
```

Server (optional, for sync)

1. Start the sync server (optional, runs on port 4000):
```bash
cd server
npm install
npm start
```

The client will attempt to talk to `http://localhost:4000` for push/pull sync if available.

Notes
- This scaffold provides core screens and a workout engine for the MVP.
- Implemented: Personal page, Create Workout, Workout logging, history, basic analytics/heatmap placeholder.
# LiftBuildr
# noisya

Noisy.A is a discord.js bot to communicate with Tachi's API.

### Features

#### Global
- Player card
- Leaderboards per game / per song / per difficulty
- Song information display
- Folder stats lookup

#### SOUND VOLTEX
- Kanji lookup on song information
- VF6 Utilities

#### beatmania IIDX
- BPI Integration

#### pop'n music
- Custom rating system for leaderboards

### Setup

- Install dependencies : `npm i`
- Create the internal SQLite database : `npm run init-db`
- Create a `data` folder and copy Tachi seeds and a SOUND VOLTEX `music_db.xml` to it.
- Copy the `config.sample.json` to `config.json` and fill it.
- Deploy slash commands : `npm run deploy-slash`

### Run

For development : `npm run start`.

You've got a few ways to host this :
- Create a systemd service with the correct node runtime, working directory and executables.
- Use pm2. Not tested, unsupported but should work without any issues.
- Clone the repo in a docker container, with the sqlite database mounted inside. You can also automatically regenerate the sqlite database by mounting the seeds and `music_db.xml`. While I probably won't release a dockerfile for this, it shouldn't be hard to do by extending from the [node docker images](https://hub.docker.com/_/node/).

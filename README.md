# noisya

Noisy.A is a discord.js bot to communicate with Tachi's API.

### Features

#### Global
- Player card
- Leaderboards per game / per song / per difficulty
- Song information display

#### SOUND VOLTEX
- Kanji lookup on song information
- VF6 Utilities

#### beatmania IIDX
- BPI Integration

### Setup

- Install dependencies : `npm i`
- Create the internal SQLite database : `npm run init-db`
- Create a `data` folder and copy Tachi seeds and a SOUND VOLTEX `music_db.xml` to it.
- Fetch metadata from zetaraku by running `npm run fetch-data`.
- Copy the `config.sample.json` to `config.json` and fill it.
- Deploy slash commands : `npm run deploy-slash`

### Run

For development : `npm run start`.


### Contributing

To add support for a game, one must :
- add a js file for said game in `games` and implement/stub all required functions (refer to other games)
- link that new game inside `constants/Games`
- add this game to every command where support is implemented
- add songlist resolver in `games/song-resolver.js`
- add game to `utils/unified-data-pull.sh` and/or `zetaraku-meta.json` if needed for automatic seeds and metadata update

A slash commands deployment is required when any modification to command metadata is done.
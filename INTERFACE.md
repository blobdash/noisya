# Game Implementation Interface

Game implementations follow an interface describing functions that will treat Tachi API data with the freedom to format extremely specific data from each game separately from each other.

Any file in `games` must follow this interface (or stub its functions) as they get called from any command via their exports. Below is a description of each function, why they exist and what they should do.

### Declaration

Inside `constants/Games.js`, add your game to the array :

```js
{
    name:"SOUND VOLTEX",
    value:"sdvx",
    icon: "icon",
    lbsize: lb_pagesize,
    func: sdvx
}
```

- `name` is the full name of the game, used in titles and various places.
- `value` is the internal name of the game on Tachi. It is also used as a unique value for command resolving and resolving game context.
- `icon` is the URL to the icon used in the footer for `/lb`, `/clb`, `/rclb` and `/recent`.
- `lbsize` is the maximum amount of lines per page in leaderboard commands. This should be tweaked depending on the amount of information per line to not exceed Discord's max embed field value size (being 1024 characters).
- `func` contains the imported functions specific to that game, declared in `games`. This must be `require`'d at the top of the file, and passed to your game's declaration.

Any extremely specific data (e.g. versions, dans...) should not be added here. They should be declared inside your `games/<game>.js`.

### /chart

```js
game.func.songInfo(songData, emb, game)

// songData : song data response from Tachi API (includes both song doc and chart doc)
// emb : embed object to feed
// game : current game. may be unused but needed for games where context alone can't decide precisely game data (e.g. iidx-sp/iidx-dp commands both call iidx.js)
```

This function feeds any metadata to the embed object. This is also used to enrich these metadata by calling external services (e.g. adding chart viewers like textage.cc for IIDX embeds).

Example (iidx-sp) :
- sets embed title to Artist - Title (requested playtype)
- adds an embed field for Genre and source version
- adds a list of charts (difficulty/numerical level/tierlist/max EX), along with their textage chart view when found

### /profile

```js
game.func.populateProfile(prfl, profile)

// prfl : embed object for profiles
// profile : profile response from Tachi API
```

This function feeds any metadata to the prfl embed object.

Example (iidx-sp) :
- Adds game specific data like :
    - KTLamp
    - BPI
    - Dan, with custom formatting
    - etc...

NB : Embed title and image attached are set outside of this function generically. These do not need to be implemented inside the game's declaration. They can, however, be overrided from this function if necessary.

### /lb

```js
game.func.leaderboardFeeder(response, lines, player)

// response : current player's profile response from Tachi API
// lines : lines array to be fed
// player : current player's username
```

This function stores metadata to be used later for each player's line in a profile leaderboard.

Example (iidx-sp) :
- Stores ktLamp, BPI, username and preformatted dan for player inside `lines`

```js
game.func.lineSorter(lines)

// lines : lines array to be sorted
```

This function is how lines are sorted for leaderboards. This affects how rankings are processed, and must be implemented to sort by the game's chosen rating. It is required that what you sort by is stored pre emptively in the `lines` object through `leaderboardFeeder`, even if you don't plan on displaying it to the user.

Example (iidx-sp) : lines get sorted by `ktLamp`.

```js
game.func.leaderboardFormat(lines, standing)

// lines : previously fed lines object from leaderboardFeeder
// standing : current line's standing
```

This function must return a single string containing every line to be displayed by the command.

Received is a pre sliced lines array with only the relevant lines to be formatted (based on requested leaderboard page) and started standing.

Example (iidx-sp) :
- for each line
    - increase standing
    - add a new line to buffer with current line's player data
- if buffer is empty, current page is empty.

### /clb and /rclb

```js
game.func.chartLeaderboardFeeder(response, lines, player)

// response : current player's score response from Tachi API
// lines : lines array to be fed
// player : current player's username
```

This function stores metadata to be used later for each player's line in a score leaderboard. Similar to /lb's feeder, except this one is specifically for game-specific score metadata.

Example (iidx-sp) :
- Stores score, grade, player username and pre formatted cleartype inside `lines`

```js
game.func.chartLeaderboardFormat(lines, standing)

// lines : previously fed lines object from chartLeaderboardFeeder
// standing : current line's standing
```

This function must return a single string containing every line to be displayed by the command.

This is almost exactly the same as the leaderboardFormat method, but with game-specific score formatting.

Example (iidx-sp) :
- for each line
    - increase standing
    - add a new line to buffer with current line's score data
- if buffer is empty, current page is empty.

```js
game.func.setCover(songData, chartData, emb)

// songData : song document
// chartData : chart document
// emb : embed to insert cover into
```

Generic function to set a song's cover into an embed. Takes a song and chart document to cover most cases for cover matching.

```js
game.func.resolveTierList(chart)

// chart : chart to get the tierlist meta for
```
Optional, stubbed for most games (return an empty string).

Example (iidx-sp) :
- returns formatted `nc tier / hc tier / exhc tier`

### /recent

```js
game.func.formatPlayInfo(play, emb)

// play : play data from Tachi API
// emb : embed to feed
```

This function returns the formatted current play data. To avoid edge cases, song and chart metadata must be resolved inside this function instead of outside.

While this function is (at the time of writing) only used for recents, it is intended to be kept without a "recent" context. In future commands, this should be able to be used for any play formatting.

Example (iidx-sp) :
- finds song then chart corresponding to play
- sets cover inside of embed
- formats BP/CB information
- returns a formatted string with artist, title, difficutly, numerical level, formatted tierlist metadata, grade, lamp, score, bp, cb and computed grade differential.

const { tachi_api, tachi_cdn } = require('../config.json');

module.exports = class Tachi {
    constructor() {
        this.baseUrl = tachi_api;
        this.cdn = tachi_cdn;
    }

    async getPlayerProfile(userid, game, playtype) {
        const response = await fetch(`${this.baseUrl}/api/v1/users/${userid}/games/${game}/${playtype}`);
        return await response.json();
    }

    async getUserProfile(userid) {
        const response = await fetch(`${this.baseUrl}/api/v1/users/${userid}`);
        return await response.json();
    }

    async resolveUserPfp(userid) {
        const response = await fetch(`${this.baseUrl}/api/v1/users/${userid}`);
        const parsed = await response.json();
        return `${this.cdn}/users/${parsed.body.id}/pfp-${parsed.body.customPfpLocation}`;
    }

    async getSongInfo(game, playtype, songId) {
        const response = await fetch(`${this.baseUrl}/api/v1/games/${game}/${playtype}/songs/${songId}`);
        return await response.json();
    }

    getProfileUrl(username, game, playtype) {
        return `${this.baseUrl}/u/${username}/games/${game}/${playtype}`;
    }

    async getUserSessions(userid, game, playtype) {
        const response = await fetch(`${this.baseUrl}/api/v1/users/${userid}/games/${game}/${playtype}/sessions?search=`);
        return await response.json();
    }
    
    async getScoreOnChartForPlayer(userid, game, playtype, chart) {
        const response = await fetch(`${this.baseUrl}/api/v1/users/${userid}/games/${game}/${playtype}/pbs/${chart}`);
        return await response.json();
    }

    async getUserGames(userid) {
        const response = await fetch(`${this.baseUrl}/api/v1/users/${userid}/game-stats`);
        return await response.json();
    }
}
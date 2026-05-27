const { tachi_api, tachi_cdn } = require('../config.json');

module.exports = class Tachi {
    constructor() {
        this.baseUrl = tachi_api;
        this.cdn = tachi_cdn;
    }

    async getPlayerProfile(userid, game) {
        const response = await fetch(`${this.baseUrl}/api/v1/users/${userid}/games/${game}`);
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

    async getSongInfo(game, songId) {
        const response = await fetch(`${this.baseUrl}/api/v1/games/${game}/songs/${songId}`);
        return await response.json();
    }

    getProfileUrl(username, game) {
        return `${this.baseUrl}/u/${username}/games/${game}`;
    }

    async getUserSessions(userid, game) {
        const response = await fetch(`${this.baseUrl}/api/v1/users/${userid}/games/${game}/sessions?search=`);
        return await response.json();
    }
    
    async getScoreOnChartForPlayer(userid, game, chart) {
        const response = await fetch(`${this.baseUrl}/api/v1/users/${userid}/games/${game}/pbs/${chart}`);
        return await response.json();
    }

    async getUserGames(userid) {
        const response = await fetch(`${this.baseUrl}/api/v1/users/${userid}/game-profiles`);
        return await response.json();
    }
}
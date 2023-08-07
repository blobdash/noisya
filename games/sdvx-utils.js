module.exports = {
    parseDan(dan) {
        if(dan === undefined) return 'n/a';
        if(dan.startsWith('DAN_')) {
            return dan.replaceAll('DAN_', 'SL');
        } else if(dan === 'INF') {
            return 'SL ∞';
        } else {
            return ' -- ';
        }
    },
    populateSdvxProfile(prfl, profile) {
        prfl.addFields(
            { name: "VF6", value: profile.body.gameStats.ratings.VF6.toFixed(3) },
            { name: "Dan", value: module.exports.parseDan(profile.body.gameStats.classes.dan) },
            { name: "Playcount", value: profile.body.totalScores+"" },
            { name: "Joue depuis", value: new Date(profile.body.firstScore.timeAchieved).toLocaleString() },
            { name: "Rang sur Tachi", value: `#${profile.body.rankingData.VF6.ranking}/${profile.body.rankingData.VF6.outOf}`}
        )
    }
}
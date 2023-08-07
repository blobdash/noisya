module.exports = {
    parseDan(dan) {
        if(dan === undefined) return 'n/a';
        if(dan.startsWith('DAN_')) {
            return dan.replaceAll('DAN_', '');
        } else {
            return '-';
        }
    },
    populateIidxProfile(prfl, profile) {
        prfl.addFields(
            { name: "KTLamp Rating", value: profile.body.gameStats.ratings.ktLampRating.toFixed(2) },
            { name: "BPI", value: profile.body.gameStats.ratings.BPI == null ? "-" : profile.body.gameStats.ratings.BPI.toFixed(2) },
            { name: "Dan", value: module.exports.parseDan(profile.body.gameStats.classes.dan) },
            { name: "Playcount", value: profile.body.totalScores+"" },
            { name: "Joue depuis", value: new Date(profile.body.firstScore.timeAchieved).toLocaleString() }
        )
    }
}
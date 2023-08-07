module.exports = {
    populatePopnProfile(prfl, profile) {
        prfl.addFields(
            { name: "Naive Class", value: profile.body.gameStats.ratings.naiveClassPoints.toFixed(2) },
            { name: "Rank", value: profile.body.gameStats.classes.class },
            { name: "Playcount", value: profile.body.totalScores+"" },
            { name: "Joue depuis", value: new Date(profile.body.firstScore.timeAchieved).toLocaleString() }
        )
    }
}
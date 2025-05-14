const sqlite = require('sqlite3').verbose();

module.exports = {
    async setLink(username, userid) {
        const db = new sqlite.Database("./users.db");
        db.run("INSERT INTO users VALUES (?, ?) ON CONFLICT(userid) DO UPDATE SET username = ?", [userid, username, username]);
        db.close();
    },
    async getLink(userid) {
        return new Promise((resolve, reject) => {
            const db = new sqlite.Database("./users.db");
            db.get(`SELECT * FROM users WHERE userid = ?`, userid, (error, row) => {
                if(error) {
                    return reject(error);
                }
                return resolve(row);
            })
        })
    },
    async getUserList() {
        return new Promise((resolve, reject) => {
            const db = new sqlite.Database("./users.db");
            db.all(`SELECT username FROM users WHERE hidden = 0`, (error, row) => {
                if(error) {
                    return reject(error);
                }
                return resolve(row);
            })
        })
    }
}
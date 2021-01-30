const fs = require("fs");

if (!fs.existsSync("./db.json")) {
    fs.writeFileSync("./db.json", JSON.stringify({}));
}

const LocalDatabase = {
    Get(key) {
        let db = JSON.parse(fs.readFileSync("./db.json")) || {};

        return db[key] || null;
    },
    Set(key, value) {
        let db = JSON.parse(fs.readFileSync("./db.json")) || {};

        db[key] = value;

        fs.writeFileSync("./db.json", JSON.stringify(db));
    }
};

module.exports = LocalDatabase;

const express = require("express");
const fs = require("fs");
const cors = require("cors");

const app = express();
app.use(express.json());
app.use(cors());

const FILE = "players.json";

// --------------------
// LOAD / SAVE
// --------------------
function load() {
    if (!fs.existsSync(FILE)) return {};
    return JSON.parse(fs.readFileSync(FILE));
}

function save(data) {
    fs.writeFileSync(FILE, JSON.stringify(data, null, 2));
}

// --------------------
// GET PLAYERS (frontend)
// --------------------
app.get("/players", (req, res) => {
    res.json(load());
});

// --------------------
// SET TIER (Discord bot)
// --------------------
app.post("/set", (req, res) => {
    const { player, kit, rank } = req.body;

    if (!player || !kit || !rank) {
        return res.json({ success: false, error: "Missing fields" });
    }

    const validKits = ["sword", "axe", "spearMace", "elytraMace", "crystal"];
    const validRanks = ["HT1", "HT2", "HT3", "LT1", "LT2", "LT3"];

    if (!validKits.includes(kit)) {
        return res.json({ success: false, error: "Invalid kit" });
    }

    if (!validRanks.includes(rank)) {
        return res.json({ success: false, error: "Invalid rank" });
    }

    let data = load();

    if (!data[player]) {
        data[player] = {
            sword: null,
            axe: null,
            spearMace: null,
            elytraMace: null,
            crystal: null
        };
    }

    data[player][kit] = rank;

    save(data);

    res.json({
        success: true,
        message: "Updated",
        player,
        kit,
        rank
    });
});

// --------------------
// START SERVER
// --------------------
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log("Server running on port " + PORT));

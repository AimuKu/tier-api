const express = require("express");
const fs = require("fs");
const cors = require("cors");

const app = express();
app.use(express.json());
app.use(cors());

const FILE = "players.json";

// =====================
// FILE HELPERS
// =====================
function load() {
    try {
        if (!fs.existsSync(FILE)) {
            fs.writeFileSync(FILE, "{}");
            return {};
        }

        const raw = fs.readFileSync(FILE, "utf8");
        return JSON.parse(raw || "{}");
    } catch (err) {
        console.error("LOAD ERROR:", err);
        return {};
    }
}

function save(data) {
    try {
        fs.writeFileSync(FILE, JSON.stringify(data, null, 2));
    } catch (err) {
        console.error("SAVE ERROR:", err);
    }
}

// =====================
// GET PLAYERS
// =====================
app.get("/players", (req, res) => {
    const data = load();

    // normalize structure (VERY IMPORTANT FIX)
    for (const key in data) {
        data[key] = {
            sword: null,
            axe: null,
            spearMace: null,
            elytraMace: null,
            crystal: null,
            ...data[key]
        };
    }

    res.json(data);
});

// =====================
// SET PLAYER KIT
// =====================
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

    const data = load();

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
        player,
        kit,
        rank
    });
});

// =====================
// REMOVE PLAYER
// =====================
app.post("/remove", (req, res) => {
    const { player } = req.body;

    if (!player) {
        return res.json({ success: false, error: "Missing player" });
    }

    const data = load();

    if (!data[player]) {
        return res.json({ success: false, error: "Player not found" });
    }

    delete data[player];

    save(data);

    res.json({
        success: true,
        player
    });
});

// =====================
// HEALTH CHECK
// =====================
app.get("/", (req, res) => {
    res.send("SonarMC Tier API running ^^");
});

// =====================
// START
// =====================
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log("Server running on port " + PORT);
});

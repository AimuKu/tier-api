const express = require("express");
const fs = require("fs");
const cors = require("cors");

const app = express();
app.use(express.json());
app.use(cors());

const FILE = "players.json";

function load() {
    if (!fs.existsSync(FILE)) return {};
    return JSON.parse(fs.readFileSync(FILE, "utf8"));
}

function save(data) {
    fs.writeFileSync(FILE, JSON.stringify(data, null, 2));
}

function findPlayerKey(data, name) {
    if (!name) return null;
    if (data[name]) return name;

    const lower = name.toLowerCase();
    return Object.keys(data).find(key => key.toLowerCase() === lower) || null;
}

const VALID_KITS = ["sword", "axe", "spearMace", "elytraMace", "crystal"];
const VALID_RANKS = ["HT1", "HT2", "HT3", "LT1", "LT2", "LT3"];

function setTier(player, kit, rank) {
    if (!player || !kit || !rank) {
        return { success: false, error: "Missing fields" };
    }

    if (!VALID_KITS.includes(kit)) {
        return { success: false, error: "Invalid kit" };
    }

    if (!VALID_RANKS.includes(rank)) {
        return { success: false, error: "Invalid rank" };
    }

    const data = load();
    const key = findPlayerKey(data, player) || player;

    if (!data[key]) {
        data[key] = {
            sword: null,
            axe: null,
            spearMace: null,
            elytraMace: null,
            crystal: null
        };
    }

    data[key][kit] = rank;
    save(data);

    return {
        success: true,
        message: "Updated",
        player: key,
        kit,
        rank
    };
}

function removeTierPlayer(player) {
    if (!player) {
        return { success: false, error: "Missing player" };
    }

    const data = load();
    const key = findPlayerKey(data, player);

    if (!key) {
        return { success: false, error: "Player not found" };
    }

    delete data[key];
    save(data);

    return {
        success: true,
        message: "Player removed",
        player: key
    };
}

app.get("/players", (req, res) => {
    res.json(load());
});

app.get("/health", (req, res) => {
    res.json({ ok: true });
});

// Discord bot + older clients
app.post("/update", (req, res) => {
    const { player, kit, rank } = req.body;
    res.json(setTier(player, kit, rank));
});

// Alternate name used in some frontend docs
app.post("/set", (req, res) => {
    const { player, kit, rank } = req.body;
    res.json(setTier(player, kit, rank));
});

app.post("/remove", (req, res) => {
    const { player } = req.body;
    res.json(removeTierPlayer(player));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log("Server running on port " + PORT));

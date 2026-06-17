const express = require("express");
const fs = require("fs");
const cors = require("cors");
const crypto = require("crypto");

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
// TOKEN STORE
// (in-memory, resets on redeploy — that's fine)
// =====================

const validTokens = new Set();

// =====================
// AUTH MIDDLEWARE
// =====================

function requireAuth(req, res, next) {
    const token = req.headers["x-admin-token"];
    if (!token || !validTokens.has(token)) {
        return res.status(401).json({ success: false, error: "Unauthorized" });
    }
    next();
}

// =====================
// HEALTH CHECK
// =====================

app.get("/", (req, res) => {
    res.send("SonarMC Tier API is running ^^");
});

// =====================
// LOGIN
// =====================

app.post("/login", (req, res) => {
    const { password } = req.body;

    const correct = process.env.ADMIN_PASSWORD;

    if (!correct) {
        return res.status(500).json({ success: false, error: "ADMIN_PASSWORD not set on server." });
    }

    if (password !== correct) {
        return res.status(401).json({ success: false, error: "Wrong password." });
    }

    // Generate a random token
    const token = crypto.randomBytes(32).toString("hex");
    validTokens.add(token);

    return res.json({ success: true, token });
});

// =====================
// LOGOUT
// =====================

app.post("/logout", requireAuth, (req, res) => {
    const token = req.headers["x-admin-token"];
    validTokens.delete(token);
    res.json({ success: true });
});

// =====================
// GET PLAYERS
// =====================

app.get("/players", (req, res) => {
    try {
        res.setHeader("Content-Type", "application/json");
        res.json(load());
    } catch (err) {
        res.status(500).json({});
    }
});

// =====================
// SET PLAYER (protected)
// =====================

app.post("/set", requireAuth, (req, res) => {
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

    return res.json({ success: true, message: "Updated", player, kit, rank });
});

// =====================
// REMOVE PLAYER (protected)
// =====================

app.post("/remove", requireAuth, (req, res) => {
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

    return res.json({ success: true, message: "Removed", player });
});

// =====================
// START SERVER
// =====================

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log("Server running on port " + PORT);
});

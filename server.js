const express = require("express");
const fs = require("fs");
const cors = require("cors");

const app = express();
app.use(express.json());
app.use(cors());

const FILE = "players.json";

// Load data
function load() {
    if (!fs.existsSync(FILE)) return {};
    return JSON.parse(fs.readFileSync(FILE));
}

// Save data
function save(data) {
    fs.writeFileSync(FILE, JSON.stringify(data, null, 2));
}

// GET all players (website uses this)
app.get("/players", (req, res) => {
    res.json(load());
});

// UPDATE player (Skript uses this)
app.post("/update", (req, res) => {
    const { player, kit, rank } = req.body;

    let data = load();

    if (!data[player]) data[player] = {};

    data[player][kit] = rank;

    save(data);

    res.json({ success: true });
});

// IMPORTANT FOR RENDER
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log("Server running on port " + PORT));

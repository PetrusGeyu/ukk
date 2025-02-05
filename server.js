require("dotenv").config();
const express = require("express");
const cors = require("cors");
const { Pool } = require("pg");

const app = express();
const PORT = process.env.PORT || 8080;

// Koneksi ke PostgreSQL di Railway
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false, // Diperlukan untuk Railway
    },
});

// Middleware
app.use(cors());
app.use(express.json());

// ✅ Route: Mendapatkan semua todo
app.get("/todos", async (req, res) => {
    try {
        const result = await pool.query("SELECT * FROM todos ORDER BY id ASC");
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: "Terjadi kesalahan server" });
    }
});

// ✅ Route: Menambahkan todo baru
app.post("/todos", async (req, res) => {
    try {
        const { title, priority } = req.body;
        const result = await pool.query(
            "INSERT INTO todos (title, priority) VALUES ($1, $2) RETURNING *",
            [title, priority || "Medium"]
        );
        res.json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: "Terjadi kesalahan server" });
    }
});

// ✅ Route: Mengupdate status & title todo
app.put("/todos/:id", async (req, res, next) => {
    try {
        const { id } = req.params;
        const { title, priority } = req.body;

        const result = await pool.query(
            "UPDATE todos SET title = $1, priority = $2 WHERE id = $3 RETURNING *",
            [title, priority, id]
        );

        if (result.rowCount === 0) {
            return res.status(404).json({ error: "Todo tidak ditemukan" });
        }

        res.json(result.rows[0]);
    } catch (err) {
        next(err);
    }
});

// ✅ Route: Menghapus todo
app.delete("/todos/:id", async (req, res) => {
    const { id } = req.params;
    await pool.query("DELETE FROM todos WHERE id = $1", [id]);
    res.json({ message: "Todo berhasil dihapus" });
});

// Jalankan server
app.listen(PORT, () => console.log(`Server berjalan di port ${PORT}`));

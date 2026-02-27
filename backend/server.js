import dotenv from "dotenv";
dotenv.config();

import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import mongoose from "mongoose";
import cors from "cors";

const app = express();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PORT = process.env.PORT || 3000;

// CORS configuration
const allowedOrigins = [
    "http://localhost:5173",
    "http://localhost:3000",
    // Add your production domain here when you have it
];

app.use(cors({
    origin: function (origin, callback) {
        // Allow requests with no origin (like mobile apps or curl requests)
        if (!origin) return callback(null, true);
        if (allowedOrigins.indexOf(origin) !== -1 || process.env.NODE_ENV === "production") {
            return callback(null, true);
        } else {
            return callback(new Error("Not allowed by CORS"));
        }
    }
}));

app.use(express.json());

// Serve static files from the React app
app.use(express.static(path.join(__dirname, "../frontend/dist")));

// ------------------
// MongoDB Connection
// ------------------
const MONGO_URI = process.env.MONGO_URI;

if (!MONGO_URI) {
    console.error("FATAL ERROR: MONGO_URI is not defined in .env file");
    process.exit(1);
}

mongoose.connect(MONGO_URI)
    .then(() => console.log("MongoDB Atlas Connected"))
    .catch(err => {
        console.error("MongoDB connection error:", err);
        process.exit(1);
    });

// ------------------
// Schema & Model
// ------------------
const noteSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        trim: true
    },
    content: {
        type: String,
        required: true,
        trim: true
    }
}, { timestamps: true });

const Note = mongoose.model("Note", noteSchema);

// ------------------
// ROUTES
// ------------------

// API READ ALL
app.get("/api/notes", async (req, res) => {
    try {
        const notes = await Note.find().sort({ createdAt: -1 });
        res.json(notes);
    } catch (error) {
        res.status(500).json({ message: "Server error" });
    }
});

// API CREATE
app.post("/api/notes", async (req, res) => {
    try {
        const { title, content } = req.body;

        if (!title || !title.trim() || !content || !content.trim()) {
            return res.status(400).json({ message: "Title and Content are required" });
        }

        const newNote = await Note.create({
            title: title.trim(),
            content: content.trim()
        });

        res.status(201).json(newNote);

    } catch (error) {
        res.status(500).json({ message: "Server error" });
    }
});

// API UPDATE
app.put("/api/notes/:id", async (req, res) => {
    try {
        const { title, content } = req.body;

        const note = await Note.findById(req.params.id);
        if (!note) {
            return res.status(404).json({ message: "Note not found" });
        }

        if (title !== undefined) {
            if (!title.trim()) {
                return res.status(400).json({ message: "Title cannot be empty" });
            }
            note.title = title.trim();
        }

        if (content !== undefined) {
            if (!content.trim()) {
                return res.status(400).json({ message: "Content cannot be empty" });
            }
            note.content = content.trim();
        }

        await note.save();
        res.json(note);

    } catch (error) {
        res.status(400).json({ message: "Invalid ID" });
    }
});

// API DELETE
app.delete("/api/notes/:id", async (req, res) => {
    try {
        const deleted = await Note.findByIdAndDelete(req.params.id);

        if (!deleted) {
            return res.status(404).json({ message: "Note not found" });
        }

        res.json({ message: "Deleted successfully" });

    } catch (error) {
        res.status(400).json({ message: "Invalid ID" });
    }
});

// Catch-all route to serve React's index.html
// Using a regex constant to avoid path-to-regexp parsing issues in Express 5
app.get(/^(?!\/api).+/, (req, res) => {
    res.sendFile(path.join(__dirname, "../frontend/dist", "index.html"));
});

// ------------------
// SERVER START
// ------------------

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

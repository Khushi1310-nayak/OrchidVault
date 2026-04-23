import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import admin from "firebase-admin";
import path from "path";
import http from "http";
import fs from "fs";
import { createServer as createViteServer } from "vite";

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(cors());
  app.use(express.json());

  // Initialize Firebase Admin with explicit projectId to verify tokens correctly
  try {
    if (admin.apps.length === 0) {
      const configPath = path.resolve(process.cwd(), "firebase-applet-config.json");
      let projectId;
      if (fs.existsSync(configPath)) {
        const config = JSON.parse(fs.readFileSync(configPath, "utf-8"));
        projectId = config.projectId;
      }
      admin.initializeApp({
        projectId: projectId
      });
    }
  } catch (e) {
    console.error("Firebase admin init error:", e);
  }

  // Connect MongoDB if env variable exists, otherwise log error and skip so Vite still runs
  if (process.env.MONGO_URI) {
    try {
      await mongoose.connect(process.env.MONGO_URI);
      console.log("MongoDB connected");
    } catch (e) {
      console.error("MongoDB connection error:", e);
      // Fallback
    }
  } else {
    console.warn("MONGO_URI not found in env. Cannot connect to MongoDB database.");
  }


  // --- MODELS ---
  const userSchema = new mongoose.Schema({
    uid: { type: String, required: true, unique: true },
    email: String,
    name: String,
    avatar: String,
    settings: {
      theme: { type: String, default: "dark" },
      accent: { type: String, default: "#8870A3" },
      notifications: { type: Boolean, default: true },
    },
  });
  const User = mongoose.models.User || mongoose.model<any>("User", userSchema);

  const folderSchema = new mongoose.Schema({
    userId: String,
    name: String,
    files: [{ name: String, url: String, color: String }],
    isDeleted: { type: Boolean, default: false },
  });
  const Folder = mongoose.models.Folder || mongoose.model<any>("Folder", folderSchema);

  const albumSchema = new mongoose.Schema({
    userId: String,
    title: String,
    description: String,
    cover: String,
    songs: [{ title: String, url: String }],
    isDeleted: { type: Boolean, default: false },
  });
  const Album = mongoose.models.Album || mongoose.model<any>("Album", albumSchema);

  const trashSchema = new mongoose.Schema({
    userId: String,
    type: String,
    data: Object,
    deletedAt: Date,
  });
  const Trash = mongoose.models.Trash || mongoose.model<any>("Trash", trashSchema);

  const activitySchema = new mongoose.Schema({
    userId: String,
    date: String,
    studyTime: { type: Number, default: 0 },
    musicTime: { type: Number, default: 0 },
    filesAdded: { type: Number, default: 0 },
    foldersCreated: { type: Number, default: 0 },
  });
  const Activity = mongoose.models.Activity || mongoose.model<any>("Activity", activitySchema);

  // --- MIDDLEWARE ---
  const verifyToken = async (req: any, res: any, next: any) => {
    const token = req.headers.authorization?.split("Bearer ")[1];
    if (!token) return res.status(401).json({ error: "Unauthorized" });

    try {
      const decoded = await admin.auth().verifyIdToken(token);
      req.user = decoded;
      next();
    } catch (err: any) {
      console.error("Token verification failed:", err.message);
      res.status(401).json({ error: "Invalid token" });
    }
  };

  // --- ROUTES ---
  app.get("/api/user", verifyToken, async (req: any, res: any) => {
    try {
      let user = await User.findOne({ uid: req.user.uid });
      if (!user) {
        user = await User.create({ 
          uid: req.user.uid, 
          email: req.user.email,
          name: req.user.name || req.user.email?.split('@')[0] || 'Sanctuary User'
        });
      }
      res.json(user);
    } catch (err) {
      console.error("Error in GET /api/user:", err);
      res.status(500).json({ error: "Server error" });
    }
  });

  app.post("/api/user", verifyToken, async (req: any, res: any) => {
    const { uid, email, name, picture } = req.user;
    try {
      let user = await User.findOne({ uid });
      if (!user) {
        user = await User.create({ 
          uid, 
          email, 
          name: name || email?.split('@')[0] || 'Sanctuary User',
          avatar: picture || ''
        });
      }
      res.json(user);
    } catch (err) {
      console.error("Error in POST /api/user:", err);
      res.status(500).json({ error: "Server error" });
    }
  });

  app.put("/api/user/profile", verifyToken, async (req: any, res: any) => {
    try {
      const user = await User.findOneAndUpdate(
        { uid: req.user.uid },
        { $set: req.body },
        { new: true, upsert: true }
      );
      res.json(user);
    } catch (err) {
      res.status(500).json({ error: "Server error" });
    }
  });

  app.delete("/api/user", verifyToken, async (req: any, res: any) => {
    try {
      await User.findOneAndDelete({ uid: req.user.uid });
      // Cleanup other data belonging to user
      await Folder.deleteMany({ userId: req.user.uid });
      await Album.deleteMany({ userId: req.user.uid });
      await Trash.deleteMany({ userId: req.user.uid });
      await Activity.deleteMany({ userId: req.user.uid });
      res.json({ message: 'User data deleted' });
    } catch (err) {
      res.status(500).json({ error: "Server error" });
    }
  });

  app.put("/api/user/settings", verifyToken, async (req: any, res: any) => {
    try {
      const user = await User.findOneAndUpdate(
        { uid: req.user.uid },
        { $set: { settings: req.body } },
        { new: true, upsert: true }
      );
      res.json(user);
    } catch (err) {
      res.status(500).json({ error: "Server error" });
    }
  });

  // Folders
  app.post("/api/folders", verifyToken, async (req: any, res: any) => {
    const folder = await Folder.create({ userId: req.user.uid, name: req.body.name, color: req.body.color });
    res.json(folder);
  });

  app.get("/api/folders", verifyToken, async (req: any, res: any) => {
    const folders = await Folder.find({ userId: req.user.uid, isDeleted: false });
    res.json(folders);
  });

  app.post("/api/folders/:id/file", verifyToken, async (req: any, res: any) => {
    const folder = await Folder.findById(req.params.id);
    if (!folder) return res.status(404).send();
    folder.files.push(req.body);
    await folder.save();
    res.json(folder);
  });

  app.delete("/api/folders/:id/file/:fileId", verifyToken, async (req: any, res: any) => {
    const folder = await Folder.findById(req.params.id);
    if (!folder) return res.status(404).send();
    folder.files = folder.files.filter((f: any) => f._id.toString() !== req.params.fileId);
    await folder.save();
    res.json(folder);
  });

  app.patch("/api/folders/:id/file/:fileId", verifyToken, async (req: any, res: any) => {
    const folder = await Folder.findById(req.params.id);
    if (!folder) return res.status(404).send();
    const file = folder.files.find((f: any) => f._id.toString() === req.params.fileId);
    if (!file) return res.status(404).send();
    if (req.body.name) file.name = req.body.name;
    if (req.body.color) file.color = req.body.color;
    await folder.save();
    res.json(folder);
  });

  app.delete("/api/folders/:id", verifyToken, async (req: any, res: any) => {
    const folder = await Folder.findById(req.params.id);
    if (!folder || folder.isDeleted) return res.status(404).json({ error: "Folder not found or already deleted" });
    
    // Check if entry already exists in trash to avoid duplication
    const existsInTrash = await Trash.findOne({ userId: req.user.uid, "data._id": folder._id });
    if (!existsInTrash) {
      await Trash.create({ userId: req.user.uid, type: "folder", data: folder, deletedAt: new Date() });
    }
    
    folder.isDeleted = true;
    await folder.save();
    res.json({ message: "Moved to trash" });
  });

  // Albums
  app.post("/api/albums", verifyToken, async (req: any, res: any) => {
    const album = await Album.create({ userId: req.user.uid, ...req.body });
    res.json(album);
  });

  app.get("/api/albums", verifyToken, async (req: any, res: any) => {
    const albums = await Album.find({ userId: req.user.uid, isDeleted: false });
    res.json(albums);
  });

  app.post("/api/albums/:id/song", verifyToken, async (req: any, res: any) => {
    const album = await Album.findById(req.params.id);
    if (!album) return res.status(404).send();
    album.songs.push(req.body);
    await album.save();
    res.json(album);
  });

  app.delete("/api/albums/:id/song/:songId", verifyToken, async (req: any, res: any) => {
    const album = await Album.findById(req.params.id);
    if (!album) return res.status(404).send();
    album.songs = album.songs.filter((s: any) => s._id.toString() !== req.params.songId);
    await album.save();
    res.json(album);
  });

  app.patch("/api/albums/:id/song/:songId", verifyToken, async (req: any, res: any) => {
    const album = await Album.findById(req.params.id);
    if (!album) return res.status(404).send();
    const song = album.songs.find((s: any) => s._id.toString() === req.params.songId);
    if (!song) return res.status(404).send();
    if (req.body.title) song.title = req.body.title;
    await album.save();
    res.json(album);
  });

  app.delete("/api/albums/:id", verifyToken, async (req: any, res: any) => {
    const album = await Album.findById(req.params.id);
    if (!album || album.isDeleted) return res.status(404).json({ error: "Album not found or already deleted" });
    
    const existsInTrash = await Trash.findOne({ userId: req.user.uid, "data._id": album._id });
    if (!existsInTrash) {
      await Trash.create({ userId: req.user.uid, type: "album", data: album, deletedAt: new Date() });
    }
    
    album.isDeleted = true;
    await album.save();
    res.json({ message: "Moved to trash" });
  });

  // Trash
  app.get("/api/trash", verifyToken, async (req: any, res: any) => {
    const items = await Trash.find({ userId: req.user.uid });
    res.json(items);
  });

  app.delete("/api/trash/all", verifyToken, async (req: any, res: any) => {
    const items = await Trash.find({ userId: req.user.uid });
    for (const item of items) {
      if (item.type === 'folder') await Folder.deleteOne({ _id: item.data._id });
      if (item.type === 'album') await Album.deleteOne({ _id: item.data._id });
    }
    await Trash.deleteMany({ userId: req.user.uid });
    res.json({ message: 'Trash emptied' });
  });

  app.post("/api/trash/restore-all", verifyToken, async (req: any, res: any) => {
    const items = await Trash.find({ userId: req.user.uid });
    for (const item of items) {
      if (item.type === 'folder') await Folder.findOneAndUpdate({ _id: item.data._id }, { isDeleted: false });
      if (item.type === 'album') await Album.findOneAndUpdate({ _id: item.data._id }, { isDeleted: false });
    }
    await Trash.deleteMany({ userId: req.user.uid });
    res.json({ message: 'All items restored' });
  });

  app.get("/api/db-health", async (req, res) => {
    const status = mongoose.connection.readyState;
    const states = ["disconnected", "connected", "connecting", "disconnecting"];
    res.json({ 
      status: states[status], 
      connected: status === 1,
      mongodb_uri_exists: !!process.env.MONGO_URI 
    });
  });

  app.post("/api/trash/restore/:id", verifyToken, async (req: any, res: any) => {
    const item = await Trash.findById(req.params.id);
    if (!item) return res.status(404).send();
    if (item.type === "folder") {
      await Folder.findOneAndUpdate({ _id: item.data._id }, { isDeleted: false }, { upsert: true });
    }
    if (item.type === "album") {
      await Album.findOneAndUpdate({ _id: item.data._id }, { isDeleted: false }, { upsert: true });
    }
    await item.deleteOne();
    res.json({ message: "Restored" });
  });

  app.delete("/api/trash/:id", verifyToken, async (req: any, res: any) => {
    const item = await Trash.findById(req.params.id);
    if (!item) return res.status(404).send();
    // permanently delete the original document too
    if (item.type === 'folder') await Folder.deleteOne({ _id: item.data._id });
    if (item.type === 'album') await Album.deleteOne({ _id: item.data._id });
    await item.deleteOne();
    res.json({ message: "Deleted permanently" });
  });

  // Activity
  app.get("/api/activity", verifyToken, async (req: any, res: any) => {
    const activities = await Activity.find({ userId: req.user.uid }).sort({ date: 1 }).limit(14);
    res.json(activities);
  });

  app.post("/api/activity", verifyToken, async (req: any, res: any) => {
    const today = new Date().toISOString().split('T')[0];
    const update: any = { $inc: {} };
    if (req.body.studyTime) update.$inc.studyTime = req.body.studyTime;
    if (req.body.musicTime) update.$inc.musicTime = req.body.musicTime;
    if (req.body.filesAdded) update.$inc.filesAdded = req.body.filesAdded;
    if (req.body.foldersCreated) update.$inc.foldersCreated = req.body.foldersCreated;
    
    // In case there's no update
    if (Object.keys(update.$inc).length === 0) {
      return res.json({ message: "No activity to update" });
    }

    const activity = await Activity.findOneAndUpdate(
      { userId: req.user.uid, date: req.body.date || today },
      update,
      { new: true, upsert: true }
    );
    res.json(activity);
  });

  // --- VITE FRONTEND MIDDLEWARE ---
  let server;
  if (process.env.NODE_ENV !== "production") {
    server = http.createServer(app);
    const vite = await createViteServer({
      server: { 
        middlewareMode: true,
        hmr: process.env.DISABLE_HMR !== 'true' ? { server } : false
      },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    // Production build serves dist
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*all', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
    server = http.createServer(app);
  }

  server.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();

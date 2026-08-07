// src/server/db.ts
import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

// Fallback in-memory storage for serverless platforms like Vercel
const memoryDrives = new Map<string, any>();
const memoryUsers = new Map<string, any>();

let db: any = null;

try {
  // Use /tmp directory for Vercel writable access if needed
  const dbDir = process.env.VERCEL ? '/tmp' : process.cwd();
  const dbPath = path.join(dbDir, 'sqlite.db');
  db = new Database(dbPath);

  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      name TEXT NOT NULL,
      avatar TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS drives (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      provider TEXT NOT NULL,
      name TEXT NOT NULL,
      email TEXT NOT NULL,
      total_space INTEGER NOT NULL,
      used_space INTEGER NOT NULL,
      access_token TEXT NOT NULL,
      refresh_token TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users (id)
    );
  `);
} catch (err) {
  console.warn('SQLite storage disabled or read-only, switching to serverless memory fallback:', err);
}

export const getDb = () => db;

// Helper DB operations with fallback support
export const dbOps = {
  getUserByEmail: (email: string) => {
    if (db) {
      return db.prepare('SELECT * FROM users WHERE email = ?').get(email);
    }
    return Array.from(memoryUsers.values()).find((u) => u.email === email);
  },
  createUser: (user: any) => {
    if (db) {
      db.prepare('INSERT INTO users (id, email, password, name, avatar) VALUES (?, ?, ?, ?, ?)').run(
        user.id, user.email, user.password, user.name, user.avatar || null
      );
    } else {
      memoryUsers.set(user.id, user);
    }
  },
  getDrivesByUserId: (userId: string) => {
    if (db) {
      return db.prepare('SELECT * FROM drives WHERE user_id = ?').all(userId);
    }
    return Array.from(memoryDrives.values()).filter((d) => d.user_id === userId);
  },
  saveDrive: (drive: any) => {
    if (db) {
      const existing = db.prepare('SELECT id FROM drives WHERE id = ?').get(drive.id);
      if (existing) {
        db.prepare(
          'UPDATE drives SET access_token = ?, refresh_token = ?, used_space = ?, total_space = ? WHERE id = ?'
        ).run(drive.access_token, drive.refresh_token, drive.used_space, drive.total_space, drive.id);
      } else {
        db.prepare(
          'INSERT INTO drives (id, user_id, provider, name, email, total_space, used_space, access_token, refresh_token) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)'
        ).run(
          drive.id, drive.user_id, drive.provider, drive.name, drive.email,
          drive.total_space, drive.used_space, drive.access_token, drive.refresh_token
        );
      }
    } else {
      memoryDrives.set(drive.id, drive);
    }
  }
};


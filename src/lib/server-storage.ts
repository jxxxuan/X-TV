import fs from 'node:fs';
import path from 'node:path';

export interface PlayRecord {
  title: string;
  source_name: string;
  cover: string;
  year?: string;
  index: number;
  total_episodes: number;
  play_time: number;
  total_time: number;
  save_time: number;
  search_title?: string;
}

export interface Favorite {
  source_name: string;
  total_episodes: number;
  title: string;
  year?: string;
  cover?: string;
  save_time: number;
  search_title?: string;
  origin?: 'vod' | 'live';
}

export interface SkipConfig {
  source: string;
  id: string;
  skip_start: number;
  skip_end: number;
}

interface IServerStorage {
  getPlayRecord(username: string, key: string): Promise<PlayRecord | null>;
  savePlayRecord(username: string, key: string, record: PlayRecord): Promise<void>;
  getAllPlayRecords(username: string): Promise<Record<string, PlayRecord>>;
  deletePlayRecord(username: string, key?: string): Promise<void>;

  getFavorite(username: string, key: string): Promise<Favorite | null>;
  saveFavorite(username: string, key: string, fav: Favorite): Promise<void>;
  getAllFavorites(username: string): Promise<Record<string, Favorite>>;
  deleteFavorite(username: string, key?: string): Promise<void>;

  getSkipConfig(username: string, source: string, id: string): Promise<SkipConfig | null>;
  getAllSkipConfigs(username: string): Promise<SkipConfig[]>;
  saveSkipConfig(username: string, source: string, id: string, skipStart: number, skipEnd: number): Promise<void>;
  deleteSkipConfig(username: string, source: string, id: string): Promise<void>;
}

// ---------------------------------------------------------------------------
// SQLite 实现（基于 Node 22/24 内置 node:sqlite）
// ---------------------------------------------------------------------------
class SqliteStorage implements IServerStorage {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private db: any;

  constructor(dbPath: string) {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { DatabaseSync } = require('node:sqlite');
    const dir = path.dirname(dbPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    this.db = new DatabaseSync(dbPath);
    this.initTables();
  }

  private initTables() {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS play_records (
        username TEXT NOT NULL,
        storage_key TEXT NOT NULL,
        data TEXT NOT NULL,
        updated_at INTEGER NOT NULL,
        PRIMARY KEY (username, storage_key)
      );
      CREATE TABLE IF NOT EXISTS favorites (
        username TEXT NOT NULL,
        storage_key TEXT NOT NULL,
        data TEXT NOT NULL,
        updated_at INTEGER NOT NULL,
        PRIMARY KEY (username, storage_key)
      );
      CREATE TABLE IF NOT EXISTS skip_configs (
        username TEXT NOT NULL,
        source TEXT NOT NULL,
        vod_id TEXT NOT NULL,
        skip_start REAL NOT NULL DEFAULT 0,
        skip_end REAL NOT NULL DEFAULT 0,
        updated_at INTEGER NOT NULL,
        PRIMARY KEY (username, source, vod_id)
      );
    `);
  }

  async getPlayRecord(username: string, key: string): Promise<PlayRecord | null> {
    const stmt = this.db.prepare(
      'SELECT data FROM play_records WHERE username = ? AND storage_key = ?'
    );
    const row = stmt.get(username, key) as { data: string } | undefined;
    if (!row) return null;
    try {
      return JSON.parse(row.data) as PlayRecord;
    } catch {
      return null;
    }
  }

  async savePlayRecord(username: string, key: string, record: PlayRecord): Promise<void> {
    const stmt = this.db.prepare(`
      INSERT INTO play_records (username, storage_key, data, updated_at)
      VALUES (?, ?, ?, ?)
      ON CONFLICT(username, storage_key) DO UPDATE SET
        data = excluded.data,
        updated_at = excluded.updated_at
    `);
    stmt.run(username, key, JSON.stringify(record), record.save_time || Date.now());
  }

  async getAllPlayRecords(username: string): Promise<Record<string, PlayRecord>> {
    const stmt = this.db.prepare(
      'SELECT storage_key, data FROM play_records WHERE username = ? ORDER BY updated_at DESC'
    );
    const rows = stmt.all(username) as { storage_key: string; data: string }[];
    const result: Record<string, PlayRecord> = {};
    for (const r of rows) {
      try {
        result[r.storage_key] = JSON.parse(r.data);
      } catch {
        // ignore malformed
      }
    }
    return result;
  }

  async deletePlayRecord(username: string, key?: string): Promise<void> {
    if (key) {
      const stmt = this.db.prepare(
        'DELETE FROM play_records WHERE username = ? AND storage_key = ?'
      );
      stmt.run(username, key);
    } else {
      const stmt = this.db.prepare('DELETE FROM play_records WHERE username = ?');
      stmt.run(username);
    }
  }

  async getFavorite(username: string, key: string): Promise<Favorite | null> {
    const stmt = this.db.prepare(
      'SELECT data FROM favorites WHERE username = ? AND storage_key = ?'
    );
    const row = stmt.get(username, key) as { data: string } | undefined;
    if (!row) return null;
    try {
      return JSON.parse(row.data) as Favorite;
    } catch {
      return null;
    }
  }

  async saveFavorite(username: string, key: string, fav: Favorite): Promise<void> {
    const stmt = this.db.prepare(`
      INSERT INTO favorites (username, storage_key, data, updated_at)
      VALUES (?, ?, ?, ?)
      ON CONFLICT(username, storage_key) DO UPDATE SET
        data = excluded.data,
        updated_at = excluded.updated_at
    `);
    stmt.run(username, key, JSON.stringify(fav), fav.save_time || Date.now());
  }

  async getAllFavorites(username: string): Promise<Record<string, Favorite>> {
    const stmt = this.db.prepare(
      'SELECT storage_key, data FROM favorites WHERE username = ? ORDER BY updated_at DESC'
    );
    const rows = stmt.all(username) as { storage_key: string; data: string }[];
    const result: Record<string, Favorite> = {};
    for (const r of rows) {
      try {
        result[r.storage_key] = JSON.parse(r.data);
      } catch {
        // ignore malformed
      }
    }
    return result;
  }

  async deleteFavorite(username: string, key?: string): Promise<void> {
    if (key) {
      const stmt = this.db.prepare(
        'DELETE FROM favorites WHERE username = ? AND storage_key = ?'
      );
      stmt.run(username, key);
    } else {
      const stmt = this.db.prepare('DELETE FROM favorites WHERE username = ?');
      stmt.run(username);
    }
  }

  async getSkipConfig(username: string, source: string, id: string): Promise<SkipConfig | null> {
    const stmt = this.db.prepare(
      'SELECT source, vod_id, skip_start, skip_end FROM skip_configs WHERE username = ? AND source = ? AND vod_id = ?'
    );
    const row = stmt.get(username, source, id) as
      | { source: string; vod_id: string; skip_start: number; skip_end: number }
      | undefined;
    if (!row) return null;
    return {
      source: row.source,
      id: row.vod_id,
      skip_start: Number(row.skip_start) || 0,
      skip_end: Number(row.skip_end) || 0,
    };
  }

  async getAllSkipConfigs(username: string): Promise<SkipConfig[]> {
    const stmt = this.db.prepare(
      'SELECT source, vod_id, skip_start, skip_end FROM skip_configs WHERE username = ?'
    );
    const rows = stmt.all(username) as {
      source: string;
      vod_id: string;
      skip_start: number;
      skip_end: number;
    }[];
    return rows.map((r) => ({
      source: r.source,
      id: r.vod_id,
      skip_start: Number(r.skip_start) || 0,
      skip_end: Number(r.skip_end) || 0,
    }));
  }

  async saveSkipConfig(
    username: string,
    source: string,
    id: string,
    skipStart: number,
    skipEnd: number
  ): Promise<void> {
    const stmt = this.db.prepare(`
      INSERT INTO skip_configs (username, source, vod_id, skip_start, skip_end, updated_at)
      VALUES (?, ?, ?, ?, ?, ?)
      ON CONFLICT(username, source, vod_id) DO UPDATE SET
        skip_start = excluded.skip_start,
        skip_end = excluded.skip_end,
        updated_at = excluded.updated_at
    `);
    stmt.run(username, source, id, skipStart, skipEnd, Date.now());
  }

  async deleteSkipConfig(username: string, source: string, id: string): Promise<void> {
    const stmt = this.db.prepare(
      'DELETE FROM skip_configs WHERE username = ? AND source = ? AND vod_id = ?'
    );
    stmt.run(username, source, id);
  }
}

// ---------------------------------------------------------------------------
// JSON 文件/内存备份实现（当运行环境无 SQLite 时兜底）
// ---------------------------------------------------------------------------
interface StoreData {
  playRecords: Record<string, Record<string, PlayRecord>>; // username -> key -> record
  favorites: Record<string, Record<string, Favorite>>; // username -> key -> favorite
  skipConfigs: Record<string, Record<string, SkipConfig>>; // username -> `${source}+${id}` -> skip
}

class JsonFileStorage implements IServerStorage {
  private filePath: string;
  private data: StoreData = { playRecords: {}, favorites: {}, skipConfigs: {} };
  private saveTimeout: NodeJS.Timeout | null = null;

  constructor(filePath: string) {
    this.filePath = filePath;
    this.load();
  }

  private load() {
    try {
      if (fs.existsSync(this.filePath)) {
        const raw = fs.readFileSync(this.filePath, 'utf-8');
        this.data = JSON.parse(raw);
      }
    } catch {
      this.data = { playRecords: {}, favorites: {}, skipConfigs: {} };
    }
  }

  private scheduleSave() {
    if (this.saveTimeout) return;
    this.saveTimeout = setTimeout(() => {
      this.saveTimeout = null;
      try {
        const dir = path.dirname(this.filePath);
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        const tmp = `${this.filePath}.tmp`;
        fs.writeFileSync(tmp, JSON.stringify(this.data, null, 2), 'utf-8');
        fs.renameSync(tmp, this.filePath);
      } catch {
        // ignore save error
      }
    }, 100);
  }

  async getPlayRecord(username: string, key: string): Promise<PlayRecord | null> {
    return this.data.playRecords[username]?.[key] || null;
  }

  async savePlayRecord(username: string, key: string, record: PlayRecord): Promise<void> {
    if (!this.data.playRecords[username]) this.data.playRecords[username] = {};
    this.data.playRecords[username][key] = record;
    this.scheduleSave();
  }

  async getAllPlayRecords(username: string): Promise<Record<string, PlayRecord>> {
    return this.data.playRecords[username] || {};
  }

  async deletePlayRecord(username: string, key?: string): Promise<void> {
    if (!this.data.playRecords[username]) return;
    if (key) {
      delete this.data.playRecords[username][key];
    } else {
      this.data.playRecords[username] = {};
    }
    this.scheduleSave();
  }

  async getFavorite(username: string, key: string): Promise<Favorite | null> {
    return this.data.favorites[username]?.[key] || null;
  }

  async saveFavorite(username: string, key: string, fav: Favorite): Promise<void> {
    if (!this.data.favorites[username]) this.data.favorites[username] = {};
    this.data.favorites[username][key] = fav;
    this.scheduleSave();
  }

  async getAllFavorites(username: string): Promise<Record<string, Favorite>> {
    return this.data.favorites[username] || {};
  }

  async deleteFavorite(username: string, key?: string): Promise<void> {
    if (!this.data.favorites[username]) return;
    if (key) {
      delete this.data.favorites[username][key];
    } else {
      this.data.favorites[username] = {};
    }
    this.scheduleSave();
  }

  async getSkipConfig(username: string, source: string, id: string): Promise<SkipConfig | null> {
    const k = `${source}+${id}`;
    return this.data.skipConfigs[username]?.[k] || null;
  }

  async getAllSkipConfigs(username: string): Promise<SkipConfig[]> {
    return Object.values(this.data.skipConfigs[username] || {});
  }

  async saveSkipConfig(
    username: string,
    source: string,
    id: string,
    skipStart: number,
    skipEnd: number
  ): Promise<void> {
    if (!this.data.skipConfigs[username]) this.data.skipConfigs[username] = {};
    const k = `${source}+${id}`;
    this.data.skipConfigs[username][k] = { source, id, skip_start: skipStart, skip_end: skipEnd };
    this.scheduleSave();
  }

  async deleteSkipConfig(username: string, source: string, id: string): Promise<void> {
    if (!this.data.skipConfigs[username]) return;
    const k = `${source}+${id}`;
    delete this.data.skipConfigs[username][k];
    this.scheduleSave();
  }
}

// ---------------------------------------------------------------------------
// 工厂与单例
// ---------------------------------------------------------------------------
let instance: IServerStorage | null = null;

export function getServerStorage(): IServerStorage {
  if (instance) return instance;

  const dbPath = process.env.SQLITE_DB_PATH || path.join(process.cwd(), 'data', 'xtv.sqlite');
  try {
    // 优先尝试内置 node:sqlite
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    require('node:sqlite');
    instance = new SqliteStorage(dbPath);
    return instance;
  } catch {
    // 降级为 JSON 文件存储
    const jsonPath = path.join(process.cwd(), 'data', 'xtv-store.json');
    instance = new JsonFileStorage(jsonPath);
    return instance;
  }
}

import { describe, it, expect, beforeEach } from 'vitest';
import { getServerStorage } from './server-storage';

describe('server-storage', () => {
  const storage = getServerStorage();
  const testUser = `test_user_${Date.now()}`;

  beforeEach(async () => {
    await storage.deletePlayRecord(testUser);
    await storage.deleteFavorite(testUser);
  });

  it('saves, retrieves, and deletes play records', async () => {
    const key = 'test_source+12345';
    const record = {
      title: '测试影片',
      source_name: '测试源',
      cover: 'https://example.com/pic.jpg',
      index: 1,
      total_episodes: 10,
      play_time: 120,
      total_time: 2400,
      save_time: Date.now(),
    };

    await storage.savePlayRecord(testUser, key, record);

    const fetched = await storage.getPlayRecord(testUser, key);
    expect(fetched).not.toBeNull();
    expect(fetched?.title).toBe('测试影片');
    expect(fetched?.play_time).toBe(120);

    const all = await storage.getAllPlayRecords(testUser);
    expect(all[key]).toBeDefined();
    expect(all[key].title).toBe('测试影片');

    await storage.deletePlayRecord(testUser, key);
    const afterDelete = await storage.getPlayRecord(testUser, key);
    expect(afterDelete).toBeNull();
  });

  it('saves and retrieves favorites', async () => {
    const key = 'test_source+999';
    const fav = {
      source_name: '测试源',
      total_episodes: 24,
      title: '测试动漫',
      save_time: Date.now(),
    };

    await storage.saveFavorite(testUser, key, fav);
    const fetched = await storage.getFavorite(testUser, key);
    expect(fetched?.title).toBe('测试动漫');

    await storage.deleteFavorite(testUser, key);
    const afterDelete = await storage.getFavorite(testUser, key);
    expect(afterDelete).toBeNull();
  });

  it('saves and retrieves skip configs', async () => {
    await storage.saveSkipConfig(testUser, 'source1', 'vod1', 90, 120);
    const cfg = await storage.getSkipConfig(testUser, 'source1', 'vod1');
    expect(cfg).not.toBeNull();
    expect(cfg?.skip_start).toBe(90);
    expect(cfg?.skip_end).toBe(120);

    const all = await storage.getAllSkipConfigs(testUser);
    expect(all.some((c) => c.source === 'source1' && c.id === 'vod1')).toBe(true);

    await storage.deleteSkipConfig(testUser, 'source1', 'vod1');
    const afterDelete = await storage.getSkipConfig(testUser, 'source1', 'vod1');
    expect(afterDelete).toBeNull();
  });
});

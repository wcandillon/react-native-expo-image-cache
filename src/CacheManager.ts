// @flow
import * as _ from "lodash";
import * as FileSystem from "expo-file-system";
import SHA1 from "crypto-js/sha1";

export interface DownloadOptions {
  md5?: boolean;
  headers?: { [name: string]: string };
}

const BASE_DIR = `${FileSystem.cacheDirectory}expo-image-cache/`;

export class CacheEntry {
  uri: string;

  options: DownloadOptions;

  cacheKey: string;

  constructor(uri: string, options: DownloadOptions, cacheKey: string) {
    this.uri = uri;
    this.options = options;
    this.cacheKey = cacheKey;
  }

  async getPath(): Promise<string | undefined> {
    const { uri, options, cacheKey } = this;
    const { path, exists, tmpPath } = await getCacheEntry(cacheKey);
    if (exists) {
      return path;
    }
    const result = await FileSystem.createDownloadResumable(uri, tmpPath, options).downloadAsync();
    // If the image download failed, we don't cache anything
    if (result && result.status !== 200) {
      return undefined;
    }
    await FileSystem.moveAsync({ from: tmpPath, to: path });
    return path;
  }
}

export default class CacheManager {
  static entries: { [uri: string]: CacheEntry } = {};

  static get(uri: string, options: DownloadOptions, cacheKey: string): CacheEntry {
    if (!CacheManager.entries[cacheKey]) {
      CacheManager.entries[cacheKey] = new CacheEntry(uri, options, cacheKey);
    }
    return CacheManager.entries[cacheKey];
  }

  static async clearCache(): Promise<void> {
    await FileSystem.deleteAsync(BASE_DIR, { idempotent: true });
    await FileSystem.makeDirectoryAsync(BASE_DIR);
  }

  static async getCacheSize(): Promise<number> {
    const result = await FileSystem.getInfoAsync(BASE_DIR);
    if (!result.exists) {
      throw new Error(`${BASE_DIR} not found`);
    }
    return result.size;
  }
}

const getCacheEntry = async (cacheKey: string): Promise<{ exists: boolean; path: string; tmpPath: string }> => {
  const filename = cacheKey.substring(
    cacheKey.lastIndexOf("/"),
    cacheKey.indexOf("?") === -1 ? cacheKey.length : cacheKey.indexOf("?")
  );
  const ext = filename.indexOf(".") === -1 ? ".jpg" : filename.substring(filename.lastIndexOf("."));
  const sha = SHA1(cacheKey);
  const path = `${BASE_DIR}${sha}${ext}`;
  const tmpPath = `${BASE_DIR}${sha}-${_.uniqueId()}${ext}`;
  // TODO: maybe we don't have to do this every time
  try {
    await FileSystem.makeDirectoryAsync(BASE_DIR);
  } catch (e) {
    // do nothing
  }
  const info = await FileSystem.getInfoAsync(path);
  const { exists } = info;
  return { exists, path, tmpPath };
};

// @flow
import * as _ from "lodash";
import {FileSystem} from "expo";
import SHA1 from "crypto-js/sha1";

let _baseDir = `${FileSystem.cacheDirectory}expo-image-cache/`;
const getBaseDir = (): string => _baseDir;
// TODO maybe some checks are needed, like :
//   - will we be able to create the directory if does not exists ?
//   - the string is a correct local uri (file://...) ?
export const setBaseDir = (baseDir: string): string => _baseDir = baseDir;

export class CacheEntry {

    uri: string
    path: string;

    constructor(uri: string) {
        this.uri = uri;
    }
    async createBaseDir() {
      const BASE_DIR = getBaseDir();
      const { exists, isDirectory } = Expo.FileSystem.getInfoAsync(BASE_DIR);
      if(!exists){
        await FileSystem.makeDirectoryAsync(BASE_DIR, {intermediates: true});
      }
    }

    async getPath(): Promise<?string> {
        const {uri} = this;
        const {path, exists, tmpPath} = await getCacheEntry(uri);
        if (exists) {
            return path;
        }

        this.createBaseDir();
        await FileSystem.downloadAsync(uri, tmpPath);
        await FileSystem.moveAsync({ from: tmpPath, to: path });
        return path;
    }
}

export default class CacheManager {

    static entries: { [uri: string]: CacheEntry } = {};

    static get(uri: string): CacheEntry {
        if (!CacheManager.entries[uri]) {
            CacheManager.entries[uri] = new CacheEntry(uri);
        }
        return CacheManager.entries[uri];
    }

    static async clearCache(): Promise<void> {
        const BASE_DIR = getBaseDir();
        await FileSystem.deleteAsync(BASE_DIR, { idempotent: true });
        await FileSystem.makeDirectoryAsync(BASE_DIR);
    }
}

const getCacheKey = (uri: string): { [key: string]: string, [ext: string]: string } => {
    const filename = uri.substring(uri.lastIndexOf("/"), uri.indexOf("?") === -1 ? uri.length : uri.indexOf("?"));
    const ext = filename.indexOf(".") === -1 ? ".jpg" : filename.substring(filename.lastIndexOf("."));
    return {key: SHA1(uri), ext};
};

/**
 * As we can now set an uri that is not in the cacheDirectory,
 * we need to be able to delete files.
 */
export const removeCacheEntry = async (uri: string): Promise => {
    const {ext, key} = getCacheKey(uri);
    return FileSystem.deleteAsync(
        `${getBaseDir()}${key}${ext}`,
        {idempotent: true}
    );
};

const getCacheEntry = async (uri: string): Promise<{ exists: boolean, path: string, tmpPath: string }> => {
    const BASE_DIR = getBaseDir();
    const {ext, key} = getCacheKey(uri);
    const path = `${BASE_DIR}${key}${ext}`;
    const tmpPath = `${BASE_DIR}${key}-${_.uniqueId()}${ext}`;
    // TODO: maybe we don't have to do this every time
    try {
        await FileSystem.makeDirectoryAsync(BASE_DIR);
    } catch (e) {
        // do nothing
    }
    const info = await FileSystem.getInfoAsync(path);
    const {exists} = info;
    return { exists, path, tmpPath };
};

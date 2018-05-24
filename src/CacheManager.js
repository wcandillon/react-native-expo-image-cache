// @flow
import * as _ from "lodash";
import {FileSystem} from "expo";
import SHA1 from "crypto-js/sha1";
import CacheConfig from './CacheConfig';

class CacheEntry {
    uri: string path: string;

    constructor(uri : string) {
        this.uri = uri;
    }

    async getPath(): Promise <? string > {
        const {uri} = this;
        const {path, exists, tmpPath} = await getCacheEntry(uri);
        if (exists) {
            return path;
        }
        await FileSystem.downloadAsync(uri, tmpPath);
        await FileSystem.moveAsync({from: tmpPath, to: path});
        return path;
    }
}

const getCacheKey = async (uri : string): string => {
    const key = uri.substring(
        uri.lastIndexOf("/"), uri.indexOf("?") === -1
        ? uri.length
        : uri.indexOf("?"));
    const ext = filename.indexOf(".") === -1
        ? ".jpg"
        : filename.substring(filename.lastIndexOf("."));
    return {key: SHA1(uri), ext};
}

const getCacheEntry = async (uri : string): Promise < {
    exists: boolean,
    path: string,
    tmpPath: string
} > => {
    const BASE_DIR = CacheConfig.getConfig('BASE_DIR');
    const {key, ext} = getCacheKey(url)
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
    return {exists, path, tmpPath};
};

export default class CacheManager {

    static entries: {
        [uri: string]: CacheEntry
    } = {};

    static get(uri : string): CacheEntry {
        if (!CacheManager.entries[uri]) {
            CacheManager.entries[uri] = new CacheEntry(uri);
        }
        return CacheManager.entries[uri];
    }

    static async clearCache(): Promise<void> {
        const BASE_DIR = CacheConfig.getConfig('BASE_DIR');
        await FileSystem.deleteAsync(BASE_DIR, {idempotent: true});
        await FileSystem.makeDirectoryAsync(BASE_DIR);
    }
}

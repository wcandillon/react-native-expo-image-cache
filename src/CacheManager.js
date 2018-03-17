// @flow
import {FileSystem} from "expo";
import SHA1 from "crypto-js/sha1";

type Listener = string => mixed;

export default class CacheManager {

    static listeners: { [uri: string]: Listener[] } = {};

    static async cache(uri: string, listener: Listener): Promise<void> {
        const {path, exists} = await getCacheEntry(uri);
        if (isDownloading(uri)) {
            addListener(uri, listener);
        } else if (exists) {
            listener(path);
        } else {
            addListener(uri, listener);
            try {
                await FileSystem.downloadAsync(uri, path);
                notifyAll(uri, path);
            } catch (e) {
                notifyAll(uri, uri);
            }
            unsubscribe(uri);
        }
    }

    static async clearCache(): Promise<void> {
        await FileSystem.deleteAsync(BASE_DIR, { idempotent: true });
        await FileSystem.makeDirectoryAsync(BASE_DIR);
    }
}

const unsubscribe = (uri: string) => delete CacheManager.listeners[uri];

const notifyAll = (uri: string, path: string) => CacheManager.listeners[uri].forEach(listener => listener(path));

const addListener = (uri: string, listener: Listener) => {
    if (!CacheManager.listeners[uri]) {
        CacheManager.listeners[uri] = [];
    }
    CacheManager.listeners[uri].push(listener);
};

const isDownloading = (uri: string): boolean => CacheManager.listeners[uri] !== undefined;

const BASE_DIR = `${FileSystem.cacheDirectory}expo-image-cache/`;

const getCacheEntry = async (uri): Promise<{ exists: boolean, path: string }> => {
    const filename = uri.substring(uri.lastIndexOf("/"), uri.indexOf("?") === -1 ? uri.length : uri.indexOf("?"));
    const ext = filename.indexOf(".") === -1 ? ".jpg" : filename.substring(filename.lastIndexOf("."));
    const path = BASE_DIR + SHA1(uri) + ext;
    // TODO: maybe we don't have to do this every time
    try {
        await FileSystem.makeDirectoryAsync(BASE_DIR);
    } catch (e) {
        // do nothing
    }
    const info = await FileSystem.getInfoAsync(path);
    const {exists} = info;
    return { exists, path };
};

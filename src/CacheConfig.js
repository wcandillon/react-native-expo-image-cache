import {FileSystem} from "expo";

const config = {
  BASE_DIR: `${FileSystem.cacheDirectory}expo-image-cache/`,
}

export const getConfig = (key: string): string => `${config[key]}`;
export const setConfig = (key: string, value: string): string => config[`${key}`] = value;

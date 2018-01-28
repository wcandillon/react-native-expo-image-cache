# React Native Image Cache and Progressive Loading

React Native image cache and progressive loading for iOS and Android. Based on Expo Kit.

This is a component used in the [React Native Elements](https://react-native.shop/#elements) and the [React Native Fiber](https://react-native.shop/#fiber) starter kits.

[![CircleCI](https://circleci.com/gh/wcandillon/react-native-expo-image-cache.svg?style=svg)](https://circleci.com/gh/wcandillon/react-native-expo-image-cache)
[![npm version](https://badge.fury.io/js/react-native-expo-image-cache.svg)](https://badge.fury.io/js/react-native-expo-image-cache)

<img src="https://firebasestorage.googleapis.com/v0/b/react-native-e.appspot.com/o/2018-01-28%2017_36_46.gif?alt=media&token=6afaef74-454d-4c04-85ab-be410d0b225b" />

## Installation

This package has a peer dependency with React, React Native, and Expo.

```
yarn add react-native-expo-image-cache
```

## Usage

### <Image>

```js
import {Image} from "react-native-expo-image-cache";

const preview = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==";
const uri = "https://firebasestorage.googleapis.com/v0/b/react-native-e.appspot.com/o/b47b03a1e22e3f1fd884b5252de1e64a06a14126.png?alt=media&token=d636c423-3d94-440f-90c1-57c4de921641";
<Image style={{ height: 100, width: 100 }} {...{preview, uri}} />
```

### CacheManager

Get the local image from a remote URI

```
import {CacheManager} from "react-native-expo-image-cache";

const {uri} = this.props;
CacheManager.cache(uri, newURI => this.setState({ uri: newURI }));
```

// @flow
import * as _ from "lodash";
import * as React from "react";
import {Image as RNImage, Animated, StyleSheet, View, Platform} from "react-native";
import {BlurView} from "expo";
import {type StyleObj} from "react-native/Libraries/StyleSheet/StyleSheetTypes";
import type {ImageSourcePropType} from "react-native/Libraries/Image/ImageSourcePropType";

import CacheManager from "./CacheManager";

type ImageProps = {
    style?: StyleObj,
    renderDefault?: StyleObj => React.Node,
    preview?: ImageSourcePropType,
    uri: string,
    render: (ImageSourcePropType, StyleObj, boolean) => React.Node
};

type ImageState = {
    uri: string,
    intensity: Animated.Value
};

export default class Image extends React.Component<ImageProps, ImageState> {

    static defaultProps = {
        render: (source: ImageSourcePropType, style: StyleObj, isPreview: boolean) => (
            <RNImage blurRadius={(isPreview && Platform.OS === "android") ? 0.5 : 0} {...{source, style}} />
        )
    };

    style: StyleObj;
    subscribedToCache = true;

    load(props: ImageProps) {
        const {uri, style} = props;
        this.style = [
            StyleSheet.absoluteFill,
            _.transform(
                _.pickBy(StyleSheet.flatten(style), (value, key) => propsToCopy.indexOf(key) !== -1),
                // $FlowFixMe
                (result, value, key) => Object.assign(result, { [key]: (value - (style.borderWidth || 0)) })
            )
        ];
        if (uri) {
            CacheManager.cache(uri, this.setURI);
        }
    }

    componentWillMount() {
        const intensity = new Animated.Value(100);
        this.setState({ intensity });
        this.load(this.props);
    }

    componentWillReceiveProps(props: ImageProps) {
        this.load(props);
    }

    setURI = (uri: string) => {
        if (this.subscribedToCache) {
            this.setState({ uri });
        }
    };

    componentDidUpdate(prevProps: ImageProps, prevState: ImageState) {
        const {preview} = this.props;
        const {uri, intensity} = this.state;
        if (uri && preview && uri !== preview && prevState.uri === undefined) {
            Animated.timing(intensity, { duration: 300, toValue: 0, useNativeDriver: true }).start();
        }
    }

    componentWillUnmount() {
        this.subscribedToCache = false;
    }

    render(): React.Node {
        const {style: computedStyle} = this;
        const {preview, style, render, renderDefault} = this.props;
        const {uri, intensity} = this.state;
        const hasPreview = !!preview;
        const hasURI = !!uri;
        const isImageReady = uri && uri !== preview;
        const opacity = intensity.interpolate({
            inputRange: [0, 100],
            outputRange: [0, 0.5]
        });
        return (
            <View {...{style}}>
                {
                    (!hasPreview && !hasURI && renderDefault) && renderDefault(computedStyle)
                }
                {
                    hasPreview && !isImageReady && render({ uri: preview }, computedStyle, true)
                }
                {
                    isImageReady && render({ uri }, computedStyle, false)
                }
                {
                    hasPreview && Platform.OS === "ios" && (
                        <AnimatedBlurView tint="dark" style={computedStyle} {...{intensity}} />
                    )
                }
                {
                    hasPreview && Platform.OS === "android" && (
                        <Animated.View style={[computedStyle, { backgroundColor: black, opacity }]} />
                    )
                }
            </View>
        );
    }
}

const black = "black";
const propsToCopy = [
    "borderRadius", "borderBottomLeftRadius", "borderBottomRightRadius", "borderTopLeftRadius", "borderTopRightRadius"
];
const AnimatedBlurView = Animated.createAnimatedComponent(BlurView);

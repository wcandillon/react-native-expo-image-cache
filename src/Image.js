// @flow
import * as _ from "lodash";
import * as React from "react";
import {Image as RNImage, Animated, StyleSheet, View, Platform} from "react-native";
import {BlurView} from "expo";
import {type ImageStyle} from "react-native/Libraries/StyleSheet/StyleSheetTypes";
import type {ImageSourcePropType} from "react-native/Libraries/Image/ImageSourcePropType";

import CacheManager from "./CacheManager";

type ImageProps = {
    style?: ImageStyle,
    defaultSource?: ImageSourcePropType,
    preview?: ImageSourcePropType,
    source: ImageSourcePropType,
    transitionDuration?: number,
    tint?: "dark" | "light"
};

type ImageState = {
    source: ?ImageSourcePropType,
    intensity: Animated.Value
};

export default class Image extends React.Component<ImageProps, ImageState> {

    mounted = true;

    static defaultProps = {
        transitionDuration: 300,
        tint: "dark"
    };

    state = {
        source: undefined,
        intensity: new Animated.Value(100)
    };

    async load(source: ImageSourcePropType): Promise<void> {
        const {uri, headers} = source;
        if (uri) {
            const path = await CacheManager.get(uri, headers).getPath();
            if (this.mounted) {
                this.setState({
                    source: {
                        ...source,
                        uri: path
                    }
                });
            }
        }
    }

    componentDidMount() {
        this.load(this.props.source);
    }

    componentDidUpdate(prevProps: ImageProps, prevState: ImageState) {
        const {preview, transitionDuration} = this.props;
        const {source, intensity} = this.state;
        if (this.props.source !== prevProps.source) {
            this.load(this.props.source);
        } else if (source && preview && prevState.source === undefined) {
            Animated.timing(intensity, {
                duration: transitionDuration,
                toValue: 0,
                useNativeDriver: Platform.OS === "android"
            }).start();
        }
    }

    componentWillUnmount() {
        this.mounted = false;
    }

    render(): React.Node {
        const {preview, style, defaultSource, tint, ...otherProps} = this.props;
        delete otherProps.source;
        const {source, intensity} = this.state;
        const hasDefaultSource = !!defaultSource;
        const hasPreview = !!preview;
        const isImageReady = !!source;
        const opacity = intensity.interpolate({
            inputRange: [0, 100],
            outputRange: [0, 0.5]
        });
        const computedStyle = [
            StyleSheet.absoluteFill,
            _.transform(
                _.pickBy(StyleSheet.flatten(style), (value, key) => propsToCopy.indexOf(key) !== -1),
                // $FlowFixMe
                (result, value, key) => Object.assign(result, { [key]: (value - (style.borderWidth || 0)) })
            )
        ];
        return (
            <View {...{style}}>
                {
                    (hasDefaultSource && !hasPreview && !isImageReady) && (
                        <RNImage
                            source={defaultSource}
                            style={computedStyle}
                            {...otherProps}
                        />
                    )
                }
                {
                    hasPreview && (
                        <RNImage
                            source={preview}
                            resizeMode="cover"
                            style={computedStyle}
                            blurRadius={Platform.OS === "android" ? 0.5 : 0}
                        />
                    )
                }
                {
                    isImageReady && (
                        <RNImage
                            source={source}
                            style={computedStyle}
                            {...otherProps}
                        />
                    )
                }
                {
                    hasPreview && Platform.OS === "ios" && (
                        <AnimatedBlurView style={computedStyle} {...{intensity, tint}} />
                    )
                }
                {
                    hasPreview && Platform.OS === "android" && (
                        <Animated.View
                            style={[computedStyle, { backgroundColor: tint === "dark" ? black : white, opacity }]}
                        />
                    )
                }
            </View>
        );
    }
}

const black = "black";
const white = "white";
const propsToCopy = [
    "borderRadius", "borderBottomLeftRadius", "borderBottomRightRadius", "borderTopLeftRadius", "borderTopRightRadius"
];
const AnimatedBlurView = Animated.createAnimatedComponent(BlurView);

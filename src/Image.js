// @flow
import * as _ from "lodash";
import * as React from "react";
import {Image as RNImage, Animated, StyleSheet, View, Platform, PropTypes} from "react-native";
import {BlurView} from "expo";
import {type ImageStyle} from "react-native/Libraries/StyleSheet/StyleSheetTypes";
import type {ImageSourcePropType} from "react-native/Libraries/Image/ImageSourcePropType";

import CacheManager from "./CacheManager";

type ImageProps = {
    style?: ImageStyle,
    defaultSource?: ImageSourcePropType,
    preview?: ImageSourcePropType,
    uri: string
};

type ImageState = {
    uri: ?string,
    intensity: Animated.Value
};

export default class Image extends React.Component<ImageProps, ImageState> {

    mounted = true;

    static defaultProps = {
      transitionDuration: 300,
      tint: 'dark',
    }

    state = {
        uri: undefined,
        intensity: new Animated.Value(100)
    };

    async load({uri}: ImageProps): Promise<void> {
        if (uri) {
            const path = await CacheManager.get(uri).getPath();
            if (this.mounted) {
                this.setState({ uri: path });
            }
        }
    }

    componentDidMount() {
        this.load(this.props);
    }

    componentDidUpdate(prevProps: ImageProps, prevState: ImageState) {
        const {preview, transitionDuration} = this.props;
        const {uri, intensity} = this.state;
        if (this.props.uri !== prevProps.uri) {
            this.load(this.props);
        } else if (uri && preview && prevState.uri === undefined) {
            Animated
                .timing(intensity, {
                  duration: transitionDuration,
                  toValue: 0,
                  useNativeDriver: Platform.OS === "android"
                })
                .start();
        }
    }

    componentWillUnmount() {
        this.mounted = false;
    }

    render(): React.Node {
        const {preview, style, defaultSource, tint, ...otherProps} = this.props;
        const {uri, intensity} = this.state;
        const hasDefaultSource = !!defaultSource;
        const hasPreview = !!preview;
        const isImageReady = !!uri;
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
                            source={{ uri }}
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

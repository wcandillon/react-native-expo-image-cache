// @flow
import * as _ from "lodash";
import * as React from "react";
import {Image as RNImage, Animated, StyleSheet, View, Platform} from "react-native";
import {BlurView} from "expo";
import {type StyleObj} from "react-native/Libraries/StyleSheet/StyleSheetTypes";
import typeof {ImageSourcePropType} from "react-native/Libraries/Image/ImageSourcePropType";

import CacheManager from "./CacheManager";

type ImageProps = {
    style?: StyleObj,
    defaultSource?: string | ImageSourcePropType,
    preview?: string | ImageSourcePropType,
    uri: string
};

type ImageState = {
    uri: string,
    intensity: Animated.Value
};

function imageSourceHandling(source: string | ImageSourcePropType): ImageSourcePropType {
    if (Object.prototype.toString.call(source) === "[object String]") {
        return { uri: source };
    }
    return source;
}

export default class Image extends React.Component<ImageProps, ImageState> {

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
        const {defaultSource, preview, style, ...otherProps} = this.props;
        const {uri, intensity} = this.state;
        const hasDefaultSource = !!defaultSource;
        const hasPreview = !!preview;
        const hasURI = !!uri;
        const opacity = intensity.interpolate({
            inputRange: [0, 100],
            outputRange: [0, 0.5]
        });
        return (
            <View {...{style}}>
                {
                    (hasDefaultSource && !hasPreview && !hasURI) && (
                        <RNImage
                            source={imageSourceHandling(defaultSource)}
                            style={computedStyle}
                            {...otherProps}
                        />
                    )
                }
                {
                    hasPreview && (
                        <RNImage
                            source={imageSourceHandling(preview)}
                            resizeMode="cover"
                            style={computedStyle}
                            blurRadius={Platform.OS === "android" ? 0.5 : 0}
                        />
                    )
                }
                {
                    (uri && uri !== preview) && (
                        <RNImage
                            source={{ uri }}
                            style={computedStyle}
                            {...otherProps}
                        />
                    )
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

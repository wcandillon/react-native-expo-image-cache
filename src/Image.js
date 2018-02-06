// @flow
import autobind from "autobind-decorator";
import pickBy from "lodash.pickby";
import * as React from "react";
import {Image as RNImage, Animated, StyleSheet, View, Platform} from "react-native";
import {BlurView} from "expo";
import {type StyleObj} from "react-native/Libraries/StyleSheet/StyleSheetTypes";

import CacheManager from "./CacheManager";

type ImageProps = {
    style?: StyleObj,
    preview?: string,
    uri: string
};

type ImageState = {
    uri: string,
    intensity: Animated.Value
};

export default class Image extends React.Component<ImageProps, ImageState> {

    style: StyleObj;
    mounted = false;

    load(props: ImageProps) {
        const {uri, style} = props;
        this.style = [
            StyleSheet.absoluteFill,
            pickBy(StyleSheet.flatten(style), (value, key) => propsToCopy.indexOf(key) !== -1)
        ];
        CacheManager.cache(uri, this.setURI);
    }

    componentWillMount() {
        const intensity = new Animated.Value(100);
        this.mounted = true;
        this.setState({ intensity });
        this.load(this.props);
    }

    componentWillReceiveProps(props: ImageProps) {
        this.load(props);
    }

    componentWillUnmount() {
        this.mounted = false;
    }

    @autobind
    onLoadEnd() {
        if (this.mounted) {
            const {preview} = this.props;
            if (preview) {
                const intensity = new Animated.Value(100);
                this.setState({ intensity });
                Animated.timing(intensity, { duration: 300, toValue: 0, useNativeDriver: true }).start();
            }
        }
    }

    @autobind
    setURI(uri: string) {
        if (this.mounted) {
            this.setState({ uri });
        }
    }

    render(): React.Node {
        const {style: computedStyle} = this;
        const {preview, style} = this.props;
        const {uri, intensity} = this.state;
        const hasPreview = !!preview;
        const opacity = intensity.interpolate({
            inputRange: [0, 100],
            outputRange: [0, 1]
        });
        return (
            <View {...{style}}>
                {
                    hasPreview && (
                        <RNImage
                            source={{ uri: preview }}
                            resizeMode="cover"
                            style={computedStyle}
                        />
                    )
                }
                {
                    (uri && uri !== preview) && (
                        <RNImage
                            source={{ uri }}
                            resizeMode="cover"
                            style={computedStyle}
                            onLoadEnd={this.onLoadEnd}
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
                        <Animated.View style={[computedStyle, { backgroundColor: "rgba(0, 0, 0, 0.5)", opacity }]} />
                    )
                }
            </View>
        );
    }
}

const propsToCopy = [
    "borderRadius", "borderBottomLeftRadius", "borderBottomRightRadius", "borderTopLeftRadius", "borderTopRightRadius"
];

const AnimatedBlurView = Animated.createAnimatedComponent(BlurView);

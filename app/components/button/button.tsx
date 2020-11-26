import * as React from "react"
import { ActivityIndicator, TouchableOpacity, View, ViewStyle } from "react-native"
import { Text } from "../text/text"
import { viewPresets, textPresets } from "./button.presets"
import { ButtonProps } from "./button.props"
import { mergeAll, flatten } from "ramda"
import { color } from "../../theme"

const ACTIVITY_INDICATOR: ViewStyle = {
  position: 'absolute',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  backgroundColor: '#fffa',
  justifyContent: 'center',
  alignItems: 'center'
}

/**
 * For your text displaying needs.
 *
 * This component is a HOC over the built-in React Native one.
 */
export function Button(props: ButtonProps) {
  // grab the props
  const {
    preset = "primary",
    tx,
    text,
    loading,
    style: styleOverride,
    textStyle: textStyleOverride,
    children,
    ...rest
  } = props

  const viewStyle = mergeAll(flatten([viewPresets[preset] || viewPresets.primary, styleOverride]))
  const textStyle = mergeAll(
    flatten([textPresets[preset] || textPresets.primary, textStyleOverride]),
  )

  const content = children || <Text tx={tx} text={text} style={textStyle} />

  const getActiveOpacity = () => {
    if (rest.onPress) {
      if (preset === 'link') return 0.2
      return 0.5
    }
    return 1
  }

  return (
    <TouchableOpacity
      activeOpacity={getActiveOpacity()}
      disabled={loading}
      style={viewStyle}
      {...rest}
    >
      {content}

      {loading ? (
        <View style={ACTIVITY_INDICATOR}>
          <ActivityIndicator color={color.palette.greyDarker} />
        </View>
      ) : null}
    </TouchableOpacity>
  )
}

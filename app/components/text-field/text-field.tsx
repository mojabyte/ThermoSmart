import React from "react"
import { View, TextInput, TextStyle, ViewStyle } from "react-native"
import { TextInputMask } from "react-native-masked-text"
import { color, spacing, typography } from "../../theme"
import { translate } from "../../i18n"
import { Text } from "../text/text"
import { TextFieldProps } from "./text-field.props"
import { mergeAll, flatten } from "ramda"

// the base styling for the container
const CONTAINER: ViewStyle = {
  paddingVertical: spacing[2],
}

// the base styling for the TextInput
const INPUT: TextStyle = {
  fontFamily: typography.primary,
  color: color.text,
  minHeight: 44,
  fontSize: 18,
  borderRadius: 4,
  backgroundColor: color.palette.black,
  borderWidth: 1
}

// currently we have no presets, but that changes quickly when you build your app.
const PRESETS: { [name: string]: ViewStyle } = {
  default: {}
}

const enhance = (style, styleOverride) => {
  return mergeAll(flatten([style, styleOverride]))
}

/**
 * A component which has a label and an input together.
 */
export function TextField(props: TextFieldProps) {
  const {
    type,
    placeholderTx,
    placeholder,
    labelTx,
    label,
    errorTx,
    error,
    preset = "default",
    style: styleOverride,
    inputStyle: inputStyleOverride,
    forwardedRef,
    ...rest
  } = props
  let containerStyle: ViewStyle = { ...CONTAINER, ...PRESETS[preset] }
  containerStyle = enhance(containerStyle, styleOverride)

  let inputStyle: TextStyle = {
    ...INPUT,
    ...{
      borderColor: errorTx || error ? color.error : color.palette.black
    }
  }
  inputStyle = enhance(inputStyle, inputStyleOverride)
  const actualPlaceholder = placeholderTx ? translate(placeholderTx) : placeholder

  const TextInputComponent = type ? TextInputMask : TextInput

  return (
    <View style={containerStyle}>
      <Text preset="fieldLabel" tx={labelTx} text={label} />
      <TextInputComponent
        type={type}
        placeholder={actualPlaceholder}
        placeholderTextColor={color.palette.grey}
        underlineColorAndroid={color.transparent}
        {...rest}
        style={inputStyle}
        ref={forwardedRef}
      />
      <Text preset="fieldError" tx={errorTx} text={error} />
    </View>
  )
}

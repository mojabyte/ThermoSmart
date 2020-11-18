import * as React from "react"
import { TouchableOpacity, View, ViewStyle } from "react-native"
import { Text } from "../text/text"
import { viewPresets, textPresets } from "./listItem.presets"
import { ListItemProps } from "./listItem.props"
import { mergeAll, flatten } from "ramda"
import { color, spacing } from "../../theme"

/**
 * For your text displaying needs.
 *
 * This component is a HOC over the built-in React Native one.
 */
export function ListItem(props: ListItemProps) {
  // grab the props
  const {
    preset = "primary",
    titleTx,
    titleText,
    detailsTx,
    detailsText,
    valueText,
    style: styleOverride,
    textStyle: textStyleOverride,
    children,
    ...rest
  } = props

  const viewStyle = mergeAll(flatten([viewPresets[preset] || viewPresets.primary, styleOverride]))
  const textStyle = mergeAll(
    flatten([textPresets[preset] || textPresets.primary, textStyleOverride]),
  )

  const CONTAINER: ViewStyle = {
    flexDirection: 'row',
    justifyContent: 'space-between'
  }

  const content = children || <Text text={valueText} style={textStyle} />

  return (
    <TouchableOpacity style={viewStyle} {...rest}>
      <View style={CONTAINER}>
        <View>
          <Text tx={titleTx} text={titleText} style={textStyle} />
          <Text tx={detailsTx} text={detailsText} style={textStyle} />
        </View>
        {content}
      </View>
    </TouchableOpacity>
  )
}

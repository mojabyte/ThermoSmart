import * as React from "react"
import { TextStyle, TouchableOpacity, View, ViewStyle } from "react-native"
import { Icon } from "../icon/icon"
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
    rightIcon,
    leftIcon,
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
    flexDirection: 'row'
  }

  const MAIN: ViewStyle = {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between'
  }

  const DETAILS: TextStyle = {
    color: color.palette.grey,
    paddingHorizontal: spacing[3],
    fontSize: 12
  }

  const VALUE: TextStyle = {
    color: color.palette.greyDarker,
    paddingHorizontal: spacing[3]
  }

  const ICON: TextStyle = {
    paddingHorizontal: spacing[2],
    justifyContent: 'center'
  }

  const content = children || <Text text={valueText} style={VALUE} />

  return (
    <TouchableOpacity style={viewStyle} {...rest}>
      <View style={CONTAINER}>
        {leftIcon ? <Icon name={leftIcon} size={20} containerStyle={ICON} /> : null}
        <View style={MAIN}>
          <View>
            <Text tx={titleTx} text={titleText} style={textStyle} />
            { (detailsTx || detailsText) ? (
              <Text tx={detailsTx} text={detailsText} style={DETAILS} />
            ) : null }
          </View>
          {content}
        </View>
        {rightIcon ? <Icon name={rightIcon} size={20} containerStyle={ICON} /> : null}
      </View>
    </TouchableOpacity>
  )
}

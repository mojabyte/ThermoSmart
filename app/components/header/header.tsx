import React from "react"
import { View, ViewStyle, TextStyle } from "react-native"
import { HeaderProps } from "./header.props"
import { Button } from "../button/button"
import { Text } from "../text/text"
import { Icon } from "../icon/icon"
import { viewPresets, textPresets, iconPresets } from "./header.presets"
import { spacing } from "../../theme"
import { translate } from "../../i18n/"
import { flatten, mergeAll } from "ramda"

const TITLE_MIDDLE: ViewStyle = { flex: 1, justifyContent: "center" }
const SIDE_BUTTONS: ViewStyle = { width: 80, flexDirection: 'row', alignItems: "center" }
const LEFT: ViewStyle = { justifyContent: 'flex-start' }
const RIGHT: ViewStyle = { justifyContent: 'flex-end' }
const SIDE_TEXT: TextStyle = { fontSize: 12, lineHeight: 18, paddingHorizontal: spacing[1] }

const HIT_SLOP = { top: 20, left: 20, right: 20, bottom: 20 }

/**
 * Header that appears on many screens. Will hold navigation buttons and screen title.
 */
export function Header(props: HeaderProps) {
  const {
    preset = 'secondary',
    onLeftPress,
    onRightPress,
    leftIcon,
    rightIcon,
    leftTx,
    leftText,
    rightTx,
    rightText,
    headerText,
    headerTx,
    style,
    titleStyle,
  } = props
  const header = headerText || (headerTx && translate(headerTx)) || ""

  const viewStyle = mergeAll(flatten([viewPresets[preset] || viewPresets.primary, style]))
  const textStyle = mergeAll(
    flatten([textPresets[preset] || textPresets.primary, titleStyle]),
  )

  return (
    <View style={{ ...viewStyle, ...style }}>
      {leftIcon ? (
        <Button preset="link" onPress={onLeftPress} hitSlop={HIT_SLOP} style={[SIDE_BUTTONS, LEFT]}>
          <Icon name={leftIcon} size={18} color={iconPresets[preset]} />
          <Text tx={leftTx} text={leftText} style={SIDE_TEXT} />
        </Button>
      ) : (
        <View style={[SIDE_BUTTONS, LEFT]} />
      )}
      <View style={TITLE_MIDDLE}>
        <Text style={{ ...textStyle, ...titleStyle }} text={header} />
      </View>
      {rightIcon ? (
        <Button preset="link" onPress={onRightPress} hitSlop={HIT_SLOP} style={[SIDE_BUTTONS, RIGHT]}>
          <Text tx={rightTx} text={rightText} style={SIDE_TEXT} />
          <Icon name={rightIcon} size={18} color={iconPresets[preset]} />
        </Button>
      ) : (
        <View style={[SIDE_BUTTONS, RIGHT]} />
      )}
    </View>
  )
}

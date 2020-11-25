import React from "react"
import { View, ViewStyle, TextStyle } from "react-native"
import { HeaderProps } from "./header.props"
import { Button } from "../button/button"
import { Text } from "../text/text"
import { Icon } from "../icon/icon"
import { spacing } from "../../theme"
import { translate } from "../../i18n/"

// static styles
const ROOT: ViewStyle = {
  flexDirection: "row",
  paddingHorizontal: spacing[4],
  alignItems: "center",
  paddingTop: spacing[5],
  paddingBottom: spacing[5],
  justifyContent: "flex-start",
}
const TITLE: TextStyle = { textAlign: "center" }
const TITLE_MIDDLE: ViewStyle = { flex: 1, justifyContent: "center" }
const SIDE_BUTTONS: ViewStyle = { width: 75, flexDirection: 'row', alignItems: "center" }
const LEFT: ViewStyle = { justifyContent: 'flex-start' }
const RIGHT: ViewStyle = { justifyContent: 'flex-end' }
const SIDE_TEXT: TextStyle = { fontSize: 10, lineHeight: 14, paddingHorizontal: spacing[2] }

const HIT_SLOP = { top: 20, left: 20, right: 20, bottom: 20 }

/**
 * Header that appears on many screens. Will hold navigation buttons and screen title.
 */
export function Header(props: HeaderProps) {
  const {
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

  return (
    <View style={{ ...ROOT, ...style }}>
      {leftIcon ? (
        <Button preset="link" onPress={onLeftPress} hitSlop={HIT_SLOP} style={[SIDE_BUTTONS, LEFT]}>
          <Icon name={leftIcon} />
          <Text tx={leftTx} text={leftText} style={SIDE_TEXT} />
        </Button>
      ) : (
        <View style={[SIDE_BUTTONS, LEFT]} />
      )}
      <View style={TITLE_MIDDLE}>
        <Text style={{ ...TITLE, ...titleStyle }} text={header} />
      </View>
      {rightIcon ? (
        <Button preset="link" onPress={onRightPress} hitSlop={HIT_SLOP} style={[SIDE_BUTTONS, RIGHT]}>
          { (rightTx || rightText) ? (
            <Text tx={rightTx} text={rightText} style={SIDE_TEXT} />
          ) : null}
          <Icon name={rightIcon} />
        </Button>
      ) : (
        <View style={[SIDE_BUTTONS, RIGHT]} />
      )}
    </View>
  )
}

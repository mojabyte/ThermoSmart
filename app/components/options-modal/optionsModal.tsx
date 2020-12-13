import * as React from "react"
import { View, ViewStyle } from "react-native"
import Modal from 'react-native-modal'
import { Text } from "../text/text"
import { Button } from "../button/button"
import { Icon } from "../icon/icon"
import { ListItem } from "../list-item/listItem"
import { modalPresets, viewPresets, textPresets } from "./optionsModal.presets"
import { OptionsModalProps } from "./optionsModal.props"
import { mergeAll, flatten } from "ramda"
import { translate } from "../../i18n"
import { color, spacing } from "../../theme"

const CONTENT_ITEM: ViewStyle = {
  paddingVertical: spacing[4]
}

export function OptionsModal(props: OptionsModalProps) {
  const {
    preset = "primary",
    titleTx,
    titleText,
    titleIcon,
    isVisible = false,
    onClose = () => null,
    onConfirm = () => null,
    style: styleOverride,
    textStyle: textStyleOverride,
    content = [],
    ...rest
  } = props

  const modalStyle = modalPresets[preset]
  const viewStyle = mergeAll(flatten([viewPresets[preset] || viewPresets.primary, styleOverride]))
  const textStyle = mergeAll(
    flatten([textPresets[preset] || textPresets.primary, textStyleOverride]),
  )

  const title = titleText || (titleTx && translate(titleTx)) || ""

  return (
    <Modal
      isVisible={isVisible}
      onBackdropPress={onClose}
      onSwipeComplete={onClose}
      onBackButtonPress={onClose}
      // swipeDirection={['down']}
      hideModalContentWhileAnimating
      backdropTransitionOutTiming={0}
      animationIn="fadeIn"
      animationOut="fadeOut"
      style={modalStyle}
      {...rest}
    >
      <View style={viewStyle}>
        <View style={{ margin: spacing[3], flexDirection: 'row' }}>
          { titleIcon && <Icon name={titleIcon} size={20} /> }
          <Text text={title} style={textStyle} />
        </View>
        <View style={{ margin: spacing[3] }}>
          {content.map((item) => (
            <ListItem
              key={`${item.title}-${item.icon}`}
              titleTx={item.title}
              leftIcon={item.icon}
              onPress={item.onPress}
              style={CONTENT_ITEM}
            />
          ))}
        </View>
      </View>
    </Modal>
  )
}

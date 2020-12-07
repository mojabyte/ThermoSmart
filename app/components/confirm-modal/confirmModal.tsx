import * as React from "react"
import { View } from "react-native"
import Modal from 'react-native-modal'
import { Text } from "../text/text"
import { Button } from "../button/button"
import { Icon } from "../icon/icon"
import { modalPresets, viewPresets, textPresets } from "./confirmModal.presets"
import { ConfirmModalProps } from "./confirmModal.props"
import { mergeAll, flatten } from "ramda"
import { translate } from "../../i18n"
import { spacing } from "../../theme"

/**
 * For your text displaying needs.
 *
 * This component is a HOC over the built-in React Native one.
 */
export function ConfirmModal(props: ConfirmModalProps) {
  // grab the props
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
    children,
    ...rest
  } = props

  const modalStyle = modalPresets[preset]
  const viewStyle = mergeAll(flatten([viewPresets[preset] || viewPresets.primary, styleOverride]))
  const textStyle = mergeAll(
    flatten([textPresets[preset] || textPresets.primary, textStyleOverride]),
  )

  const content = children || null

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
      style={modalStyle}
      {...rest}
    >
      <View style={viewStyle}>
        <View style={{ margin: spacing[3], flexDirection: 'row' }}>
          { titleIcon && <Icon name={titleIcon} size={20} /> }
          <Text text={title} style={textStyle} />
        </View>
        <View style={{ margin: spacing[3] }}>
          {content}
        </View>

        <View style={{ flexDirection: 'row', justifyContent: 'flex-end' }}>
          <Button preset="link" tx="common.cancel" onPress={onClose} style={{ flex: 1, marginHorizontal: spacing[2], alignItems: 'center' }} />
          <Button tx="common.apply" onPress={onConfirm} style={{ flex: 1, marginHorizontal: spacing[2] }} />
        </View>
      </View>
    </Modal>
  )
}

import * as React from "react"
import { View } from "react-native"
import Modal from 'react-native-modal'
import { Text } from "../text/text"
import { Button } from "../button/button"
import { modalPresets, viewPresets, textPresets } from "./confirmModal.presets"
import { ConfirmModalProps } from "./confirmModal.props"
import { mergeAll, flatten } from "ramda"

/**
 * For your text displaying needs.
 *
 * This component is a HOC over the built-in React Native one.
 */
export function ConfirmModal(props: ConfirmModalProps) {
  // grab the props
  const {
    preset = "primary",
    tx,
    title,
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

  return (
    <Modal
      isVisible={isVisible}
      onBackdropPress={onClose}
      onSwipeComplete={onClose}
      onBackButtonPress={onClose}
      swipeDirection={['down']}
      hideModalContentWhileAnimating
      backdropTransitionOutTiming={0}
      style={modalStyle}
      {...rest}
    >
      <View style={viewStyle}>
        <View style={{ marginVertical: 10 }}>
          <Text text={title} style={textStyle} />
        </View>
        <View style={{ margin: 10 }}>
          {content}
        </View>

        <View style={{ flexDirection: 'row', justifyContent: 'space-evenly'}}>
          <Button text="Cancel" onPress={onClose} />
          <Button text="Apply" onPress={onConfirm} />
        </View>
      </View>
    </Modal>
  )
}

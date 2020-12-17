import * as React from "react"
import { ActivityIndicator, TextStyle, View, ViewStyle } from "react-native"
import Modal from 'react-native-modal'
import { Text } from "../text/text"
import { Button } from "../button/button"
import { Icon } from "../icon/icon"
import { modalPresets, viewPresets, textPresets } from "./confirmModal.presets"
import { ConfirmModalProps } from "./confirmModal.props"
import { mergeAll, flatten } from "ramda"
import { translate } from "../../i18n"
import { color, spacing } from "../../theme"

/**
 * For your text displaying needs.
 *
 * This component is a HOC over the built-in React Native one.
 */
export function ConfirmModal(props: ConfirmModalProps): React.ReactElement {
  // grab the props
  const {
    preset = "primary",
    titleTx,
    titleText,
    titleIcon,
    leftTitleTx,
    leftTitleText,
    leftIcon,
    loading,
    onLeftPress = () => null,
    isVisible = false,
    onInit = () => null,
    onClose = () => null,
    onConfirm = () => null,
    style: styleOverride,
    textStyle: textStyleOverride,
    children,
    ...rest
  } = props

  const HEADER: ViewStyle = {
    margin: spacing[3],
    flexDirection: 'row',
    justifyContent: 'space-between'
  }

  const TITLE_CONTAINER: ViewStyle = {
    flexDirection: 'row'
  }

  const HEADER_END: ViewStyle = {
    flexDirection: 'row',
    alignItems: 'center'
  }

  const LEFT_TITLE: TextStyle = {
    fontSize: 12,
    paddingHorizontal: spacing[1]
  }

  const LOADING: ViewStyle = {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#fffa',
    justifyContent: 'center',
    alignItems: 'center'
  }

  const BUTTONS_CONTAINER: ViewStyle = {
    flexDirection: 'row',
    justifyContent: 'flex-end'
  }

  const CANCEL_BUTTON: ViewStyle = {
    flex: 1,
    marginHorizontal: spacing[2],
    alignItems: 'center',
    borderColor: color.palette.green,
    borderWidth: 1
  }

  const APPLY_BUTTON: ViewStyle = {
    flex: 1,
    marginHorizontal: spacing[2]
  }

  const modalStyle = modalPresets[preset]
  const viewStyle = mergeAll(flatten([viewPresets[preset] || viewPresets.primary, styleOverride]))
  const textStyle = mergeAll(
    flatten([textPresets[preset] || textPresets.primary, textStyleOverride]),
  )

  const content = children || null

  const title = titleText || (titleTx && translate(titleTx)) || ""
  const leftTitle = leftTitleText || (leftTitleTx && translate(leftTitleTx))

  const init = React.useRef(onInit)
  React.useEffect(() => {
    init.current = onInit
  }, [onInit])

  React.useEffect(() => {
    if (isVisible && !loading) init.current()
  }, [isVisible, loading])

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
        <View style={HEADER}>
          <View style={TITLE_CONTAINER}>
            { titleIcon && <Icon name={titleIcon} size={20} /> }
            <Text text={title} style={textStyle} />
          </View>

          <Button
            preset="link"
            onPress={onLeftPress}
            disabled={loading}
            style={HEADER_END}
          >
            { leftTitle && <Text text={leftTitle} style={LEFT_TITLE} /> }
            { leftIcon && <Icon name={leftIcon} size={16} /> }
          </Button>
        </View>

        <View style={{ margin: spacing[3] }}>
          {content}

          {loading && (
            <View style={LOADING}>
              <ActivityIndicator color={color.palette.greyDarker} />
            </View>
          )}
        </View>

        <View style={BUTTONS_CONTAINER}>
          <Button preset="link" tx="common.cancel" onPress={onClose} style={CANCEL_BUTTON} />
          <Button tx="common.apply" onPress={onConfirm} disabled={loading} style={APPLY_BUTTON} />
        </View>
      </View>
    </Modal>
  )
}

import { ViewStyle, TextStyle } from "react-native"
import { ModalProps } from "react-native-modal"
import { ConfirmModalPresetNames } from "./confirmModal.presets"

export interface ConfirmModalProps extends ModalProps {
  /**
   * Text which is looked up via i18n.
   */
  titleTx?: string

  /**
   * The title to display if not using `tx` or nested components.
   */
  titleText?: string

  /**
   * The icon to display before title.
   */
  titleIcon?: string

  /**
   * The state of modal visibility
   */
  isVisible: boolean

  /**
   * The function called when modal be closed
   */
  onClose?: () => void

  /**
   * The function called on confirm button pressed
   */
  onConfirm?: () => void

  /**
   * An optional style override useful for padding & margin.
   */
  style?: ViewStyle | ViewStyle[]

  /**
   * An optional style override useful for the button text.
   */
  textStyle?: TextStyle | TextStyle[]

  /**
   * One of the different types of text presets.
   */
  preset?: ConfirmModalPresetNames

  /**
   * One of the different types of text presets.
   */
  children: React.ReactNode
}

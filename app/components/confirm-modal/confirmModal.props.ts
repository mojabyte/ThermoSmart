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
   * Text which is looked up via i18n.
   */
  leftTitleTx?: string

  /**
   * The title to display if not using `tx` or nested components.
   */
  leftTitleText?: string

  /**
   * The icon to display before title.
   */
  leftIcon?: string

  /**
   * The icon to display before title.
   */
  loading?: boolean

  /**
   * The icon to display before title.
   */
  onLeftPress?: () => void

  /**
   * The state of modal visibility
   */
  isVisible: boolean

  /**
   * The function called when modal initialized and after loading is finished
   */
  onInit?: () => void

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

import { ViewStyle, TextStyle, TouchableOpacityProps } from "react-native"
import { ConfirmModalPresetNames } from "./confirmModal.presets"

export interface ConfirmModalProps extends TouchableOpacityProps {
  /**
   * Text which is looked up via i18n.
   */
  tx?: string

  /**
   * The title to display if not using `tx` or nested components.
   */
  title?: string

  /**
   * The state of modal visibility
   */
  isVisible?: boolean

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
  children?: React.ReactNode
}

import { TextInputProps, TextStyle, ViewStyle } from "react-native"
import { TextInputMaskOptionProp, TextInputMaskTypeProp } from "react-native-masked-text"

export interface TextFieldProps extends TextInputProps {
  /**
   * Text-input-mask props
   */
  type?: TextInputMaskTypeProp;
  options?: TextInputMaskOptionProp

  /**
   * The placeholder i18n key.
   */
  placeholderTx?: string

  /**
   * The Placeholder text if no placeholderTx is provided.
   */
  placeholder?: string

  /**
   * The label i18n key.
   */
  labelTx?: string

  /**
   * The label text if no labelTx is provided.
   */
  label?: string

  /**
   * The error text i18n key.
   */
  errorTx?: string

  /**
   * The error text if no errorTx is provided.
   */
  error?: string

  /**
   * Optional container style overrides useful for margins & padding.
   */
  style?: ViewStyle | ViewStyle[]

  /**
   * Optional style overrides for the input.
   */
  inputStyle?: TextStyle | TextStyle[]

  /**
   * Various look & feels.
   */
  preset?: "default"

  forwardedRef?: any
}

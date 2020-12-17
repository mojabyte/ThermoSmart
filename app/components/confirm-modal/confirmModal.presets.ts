import { ViewStyle, TextStyle } from "react-native"
import { color, spacing } from "../../theme"

/**
 * All text will start off looking like this.
 */
const BASE_VIEW: ViewStyle = {
  paddingVertical: spacing[3],
  paddingHorizontal: spacing[2],
  borderTopLeftRadius: 10,
  borderTopRightRadius: 10,
  overflow: 'hidden'
}

const BASE_TEXT: TextStyle = {
  paddingHorizontal: spacing[3],
}

/**
 * All the variations of text styling within the app.
 *
 * You want to customize these to whatever you need in your app.
 */
export const modalPresets = {
  primary: {
    justifyContent: 'flex-end',
    margin: 0
  }
}
export const viewPresets = {
  /**
   * A smaller piece of secondary information.
   */
  primary: { ...BASE_VIEW, backgroundColor: color.background } as ViewStyle,
}

export const textPresets = {
  primary: {
    ...BASE_TEXT,
    fontSize: 14,
    color: color.text,
    fontWeight: "bold"
  } as TextStyle
}

/**
 * A list of preset names.
 */
export type ConfirmModalPresetNames = keyof typeof viewPresets

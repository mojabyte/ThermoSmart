import { ViewStyle, TextStyle } from "react-native"
import { color, spacing, typography } from "../../theme"

/**
 * All text will start off looking like this.
 */
const BASE_VIEW: ViewStyle = {
  flexDirection: "row",
  paddingHorizontal: spacing[4],
  alignItems: "center",
  paddingTop: spacing[5],
  paddingBottom: spacing[5],
  justifyContent: "flex-start",
}

const BASE_TEXT: TextStyle = {
  fontSize: 14,
  fontWeight: "bold",
  textAlign: "center"
}

/**
 * All the variations of text styling within the app.
 *
 * You want to customize these to whatever you need in your app.
 */
export const viewPresets = {
  /**
   * A smaller piece of secondary information.
   */
  primary: { ...BASE_VIEW, backgroundColor: color.primary, elevation: 2 } as ViewStyle,

  secondary: { ...BASE_VIEW, backgroundColor: color.transparent } as ViewStyle,

}

export const textPresets = {
  primary: {
    ...BASE_TEXT,
    color: color.palette.white,
    fontFamily: typography.primary,
    lineHeight: 15,
    letterSpacing: 1.5,
  } as TextStyle,

  secondary: {
    ...BASE_TEXT,
    color: color.text,
  } as TextStyle,
}

export const iconPresets = {
  primary: color.palette.white,

  secondary: color.palette.greyDarker,
}

/**
 * A list of preset names.
 */
export type HeaderPresetNames = keyof typeof viewPresets

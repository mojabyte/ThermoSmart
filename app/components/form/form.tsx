import * as React from "react"
import { ScrollView, View, ViewStyle } from "react-native"
import { FormProps } from "./form.props"
import { mergeAll, flatten } from "ramda"
import { spacing } from "../../theme"

const ROOT: ViewStyle = {
  flex: 1,
  justifyContent: 'space-between',
  elevation: 3,
  margin: spacing[1],
  marginHorizontal: spacing[3]
}

const INPUTS_CONTAINER: ViewStyle = {
  padding: spacing[2],
  marginBottom: spacing[3]
}

/**
 * A container component of rows of forms and submit button
 */
export function Form(props: FormProps): JSX.Element {
  return (
    <View style={mergeAll(flatten([ROOT, props.style]))}>
      <ScrollView contentContainerStyle={INPUTS_CONTAINER}>
        {props.children}
      </ScrollView>
      {props.submitButton}
    </View>
  )
}

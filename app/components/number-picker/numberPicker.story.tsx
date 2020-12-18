/* eslint-disable react-native/no-inline-styles */
/* eslint-disable react-native/no-color-literals */

import * as React from "react"
import { storiesOf } from "@storybook/react-native"
import { StoryScreen, Story, UseCase } from "../../../storybook/views"
import { Text, Form } from ".."
import { color } from "../../theme/color"
import { ViewStyle } from "react-native"

declare let module

const TEXT_STYLE_OVERRIDE = {
  color: color.storybookTextColor,
}
const arrayStyle: ViewStyle[] = [{ borderWidth: 5 }, { borderColor: "#32cd32" }]

storiesOf("Form", module)
  .addDecorator((fn) => <StoryScreen>{fn()}</StoryScreen>)
  .add("Assembled", () => (
    <Story>
      <UseCase
        text="Fully Assembled"
        usage="FormRow has many parts designed to fit together.  Here is what it looks like all assembled."
      >
        <Form preset="top">
          <Text preset="fieldLabel" style={TEXT_STYLE_OVERRIDE}>
            Hello! I am at the top
          </Text>
        </Form>
      </UseCase>
    </Story>
  ))
  .add("Presets", () => (
    <Story>
      <UseCase text="top" usage="The top of a form.">
        <Form preset="top">
          <Text style={TEXT_STYLE_OVERRIDE}>Curved borders at the top.</Text>
          <Text style={TEXT_STYLE_OVERRIDE}>Nothing below</Text>
        </Form>
      </UseCase>
    </Story>
  ))
  .add("Styling", () => (
    <Story>
      <UseCase text="Style array" usage="Form row with an array of styles">
        <Form preset="soloStraight" style={arrayStyle}>
          <Text style={TEXT_STYLE_OVERRIDE}>Array style.</Text>
        </Form>
      </UseCase>
    </Story>
  ))

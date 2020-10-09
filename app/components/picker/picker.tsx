import React, { useState } from 'react'
import {
  View,
  Text,
  Animated,
  Easing,
  TouchableNativeFeedback,
  TouchableWithoutFeedback,
  ViewStyle
  // BackHandler
} from 'react-native'
import Icon from 'react-native-vector-icons/MaterialCommunityIcons'
import { PickerProps } from './picker.props'
import { color } from "../../theme"

const MENU_OPTIONS_MAX_HEIGHT = 320

const CONTAINER: ViewStyle = {
  flex: 1,
  overflow: 'hidden'
}
const TOUCHABLE: ViewStyle = {
  zIndex: 1
}
const TRIGGER_CONTAINER: ViewStyle = {
  backgroundColor: color.primaryDarker,
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'space-around',
  zIndex: 2
}
const styles = {
  triggerChildrenContainer: {
    flex: 1
  },
  iconContainerStyle: {
    position: 'absolute',
    right: '7%'
  },
  iconStyle: {
    alignSelf: 'center',
    color: '#fff'
  },
  contentContainer: {
    flex: 1
  },
  backdropStyle: {
    backgroundColor: '#0007',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0
  },
  optionsContainerStyle: {
    backgroundColor: color.primary,
    width: '100%',
    maxHeight: MENU_OPTIONS_MAX_HEIGHT,
    position: 'absolute',
    top: 0,
    elevation: 0
  },
  optionsContentContainerStyle: {
    paddingVertical: 10
  },
  optionStyle: {
    paddingVertical: 10
  },
  optionTextStyle: {
    color: '#fff',
    paddingHorizontal: 10,
    paddingVertical: 10
  }
}

export function Picker(props: PickerProps) {
  const {
    children,
    triggerComponent,
    renderOptionComponent,
    items,
    onItemSelect,
    icon,
    style
  } = props

  // TODO: Separate states
  const [state, setState] = useState({
    isMenuOpen: false,
    backdropOpacity: new Animated.Value(0),
    menuTranslateY: new Animated.Value(-MENU_OPTIONS_MAX_HEIGHT),
    iconScaleY: new Animated.Value(1)
  })

  const openMenuAnimation = Animated.parallel([
    Animated.timing(state.backdropOpacity, {
      toValue: 1,
      duration: 200,
      easing: Easing.inOut(Easing.ease),
      useNativeDriver: true
    }),
    Animated.timing(state.menuTranslateY, {
      toValue: 0,
      duration: 200,
      easing: Easing.inOut(Easing.ease),
      useNativeDriver: true
    }),
    Animated.timing(state.iconScaleY, {
      toValue: -1,
      duration: 200,
      easing: Easing.inOut(Easing.cubic),
      useNativeDriver: true
    })
  ]);

  const closeMenuAnimation = Animated.parallel([
    Animated.timing(state.backdropOpacity, {
      toValue: 0,
      duration: 200,
      easing: Easing.inOut(Easing.ease),
      useNativeDriver: true
    }),
    Animated.timing(state.menuTranslateY, {
      toValue: -MENU_OPTIONS_MAX_HEIGHT,
      duration: 200,
      easing: Easing.inOut(Easing.ease),
      useNativeDriver: true
    }),
    Animated.timing(state.iconScaleY, {
      toValue: 1,
      duration: 200,
      easing: Easing.inOut(Easing.cubic),
      useNativeDriver: true
    })
  ])

  const openMenu = () => {
    setState({ ...state, isMenuOpen: true });
    openMenuAnimation.start()
  }

  const closeMenu = () => closeMenuAnimation.start(
    () => setState({ ...state, isMenuOpen: false })
  )

  // TODO: Handle back button press to close menu

  // useEffect(() => {
  //     if (state.isMenuOpen) {
  //         BackHandler.addEventListener('hardwareBackPress', handleBackPress);
  //     } else {
  //         BackHandler.removeEventListener('hardwareBackPress', handleBackPress);
  //     }
  // });

  // const handleBackPress = () => {
  //     closeMenu();
  //     return true;
  // };

  const empty = items.length < 1

  return (
    <View style={CONTAINER}>
      <TouchableNativeFeedback
        hitSlop={{ top: 30, left: 30, bottom: 10, right: 30 }}
        onPress={state.isMenuOpen ? closeMenu : openMenu}
        disabled={empty}
        style={TOUCHABLE}
        useForeground
      >
        <View
          style={[
            TRIGGER_CONTAINER,
            style,
            { elevation: state.isMenuOpen ? 2 : 0 }
          ]}
        >
          <View style={styles.triggerChildrenContainer}>
            {triggerComponent}
          </View>

          { !empty
            ? <Animated.View
              style={[
                styles.iconContainerStyle,
                { transform: [{ scaleY: state.iconScaleY }] }
              ]}
            >
              <Icon
                name={icon || 'chevron-down'}
                size={25}
                color="white"
              />
            </Animated.View> : null
          }
        </View>
      </TouchableNativeFeedback>

      <View style={styles.contentContainer}>
        {children}

        { state.isMenuOpen
          ? <TouchableWithoutFeedback
            onPress={closeMenu}
          >
            <Animated.View
              style={[
                styles.backdropStyle,
                { opacity: state.backdropOpacity }
              ]}
            />
          </TouchableWithoutFeedback>
          : null
        }

        { state.isMenuOpen
          ? <Animated.ScrollView
            style={[
              styles.optionsContainerStyle,
              { transform: [{ translateY: state.menuTranslateY }] }
            ]}
            contentContainerStyle={styles.optionsContentContainerStyle}
          >
            {items.map(
              (item, index: number) => (
                <TouchableNativeFeedback
                  onPress={() => {
                    closeMenu()
                    onItemSelect(item.value)
                  }}
                  key={item.value}
                  useForeground
                >
                  { renderOptionComponent?.(item, index) ||
                    <View style={styles.optionStyle}>
                      <Text style={styles.optionTextStyle}>
                        {item.label}
                      </Text>
                    </View>
                  }
                </TouchableNativeFeedback>
              )
            )}
          </Animated.ScrollView>
          : null
        }
      </View>
    </View>
  )
}

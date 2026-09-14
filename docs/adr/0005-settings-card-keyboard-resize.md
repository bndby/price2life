# Settings is a stack card so the keyboard resizes the window

Native-stack `presentation: 'modal'` on Android hosts Settings in a transparent modal that does not receive `adjustResize`, so the IME overlays Date of Birth and Item Price instead of shrinking the window. Settings is a `card` with `slide_from_right`; the first-launch trap is unchanged. Expo `softwareKeyboardLayoutMode` stays `"resize"`, plus RN `KeyboardAvoidingView` without a new native module.

**Considered Options**: keep the modal sheet and add `react-native-keyboard-controller` (отклонено: лишний нативный модуль, а modal всё равно плохо дружит с IME); `adjustPan` (отклонено: шапка уезжает, внутреннего скролла нет).

**Consequences**: Converter полностью скрыт, пока открыт Settings — это не полупрозрачный sheet. В шапке стрелка назад вместо крестика.

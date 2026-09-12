import createIconSet from "@expo/vector-icons/createIconSet";

// Exact glyphs from the installed MaterialCommunityIcons font; avoid shipping the full name catalog.
export default createIconSet({
  "eye-outline": 984784,
  "lightbulb-outline": 983862,
  "hands-pray": 984441,
  "book-account-outline": 988078,
  "book-open-page-variant-outline": 988630
}, "material-community", require("@expo/vector-icons/build/vendor/react-native-vector-icons/Fonts/MaterialCommunityIcons.ttf"));

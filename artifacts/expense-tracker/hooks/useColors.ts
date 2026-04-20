import colors from "@/constants/colors";
import { useTheme } from "@/context/ThemeContext";

/**
 * Returns the design tokens for the current color scheme.
 *
 * Dark mode is controlled by ThemeContext (user toggle + AsyncStorage persistence),
 * not by the system color scheme. This lets the in-app toggle work reliably on
 * all platforms without depending on the OS appearance setting.
 */
export function useColors() {
  const { isDark } = useTheme();
  const palette = isDark ? colors.dark : colors.light;
  return { ...palette, radius: colors.radius };
}

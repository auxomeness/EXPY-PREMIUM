const COLOR_MODE_EVENT = "expy:color-mode-updated";
export const COLOR_MODE_STORAGE_KEY = "expy_dark_mode";
export const DEFAULT_ACCENT_HUE = 221;

const THEME_OVERRIDE_PROPERTIES = [
  "--primary",
  "--primary-foreground",
  "--accent",
  "--accent-foreground",
  "--ring",
  "--sidebar-primary",
  "--sidebar-primary-foreground",
  "--floating-nav-active-bg",
  "--floating-nav-active-foreground",
  "--floating-fab-bg",
  "--floating-fab-foreground",
] as const;

type RgbColor = {
  r: number;
  g: number;
  b: number;
};

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function expandShortHex(hex: string) {
  return hex
    .split("")
    .map((character) => `${character}${character}`)
    .join("");
}

export function normalizeAccentHex(value: string | null | undefined) {
  if (!value) {
    return null;
  }

  const trimmedValue = value.trim();
  if (trimmedValue.length === 0) {
    return null;
  }

  const normalizedValue = trimmedValue.startsWith("#") ? trimmedValue.slice(1) : trimmedValue;
  if (!/^(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(normalizedValue)) {
    return null;
  }

  const fullHex = normalizedValue.length === 3 ? expandShortHex(normalizedValue) : normalizedValue;
  return `#${fullHex.toLowerCase()}`;
}

function hexToRgb(hex: string): RgbColor {
  const normalizedHex = normalizeAccentHex(hex);
  if (!normalizedHex) {
    return { r: 3, g: 2, b: 19 };
  }

  const value = normalizedHex.slice(1);
  return {
    r: Number.parseInt(value.slice(0, 2), 16),
    g: Number.parseInt(value.slice(2, 4), 16),
    b: Number.parseInt(value.slice(4, 6), 16),
  };
}

function rgbToHex({ r, g, b }: RgbColor) {
  return `#${[r, g, b]
    .map((channel) => clamp(Math.round(channel), 0, 255).toString(16).padStart(2, "0"))
    .join("")}`;
}

function rgbToHsl({ r, g, b }: RgbColor) {
  const red = r / 255;
  const green = g / 255;
  const blue = b / 255;
  const max = Math.max(red, green, blue);
  const min = Math.min(red, green, blue);
  const lightness = (max + min) / 2;
  const delta = max - min;

  if (delta === 0) {
    return { h: DEFAULT_ACCENT_HUE, s: 0, l: lightness };
  }

  const saturation =
    lightness > 0.5 ? delta / (2 - max - min) : delta / (max + min);

  let hue = 0;
  switch (max) {
    case red:
      hue = (green - blue) / delta + (green < blue ? 6 : 0);
      break;
    case green:
      hue = (blue - red) / delta + 2;
      break;
    default:
      hue = (red - green) / delta + 4;
      break;
  }

  return {
    h: hue * 60,
    s: saturation,
    l: lightness,
  };
}

function hueToRgbChannel(p: number, q: number, t: number) {
  let nextT = t;

  if (nextT < 0) {
    nextT += 1;
  }
  if (nextT > 1) {
    nextT -= 1;
  }
  if (nextT < 1 / 6) {
    return p + (q - p) * 6 * nextT;
  }
  if (nextT < 1 / 2) {
    return q;
  }
  if (nextT < 2 / 3) {
    return p + (q - p) * (2 / 3 - nextT) * 6;
  }

  return p;
}

function hslToRgb(hue: number, saturation: number, lightness: number): RgbColor {
  const normalizedHue = ((hue % 360) + 360) % 360 / 360;
  const nextSaturation = clamp(saturation, 0, 1);
  const nextLightness = clamp(lightness, 0, 1);

  if (nextSaturation === 0) {
    const channel = Math.round(nextLightness * 255);
    return { r: channel, g: channel, b: channel };
  }

  const q =
    nextLightness < 0.5
      ? nextLightness * (1 + nextSaturation)
      : nextLightness + nextSaturation - nextLightness * nextSaturation;
  const p = 2 * nextLightness - q;

  return {
    r: Math.round(hueToRgbChannel(p, q, normalizedHue + 1 / 3) * 255),
    g: Math.round(hueToRgbChannel(p, q, normalizedHue) * 255),
    b: Math.round(hueToRgbChannel(p, q, normalizedHue - 1 / 3) * 255),
  };
}

function mixRgb(base: RgbColor, target: RgbColor, amount: number): RgbColor {
  const mixAmount = clamp(amount, 0, 1);
  const baseAmount = 1 - mixAmount;

  return {
    r: Math.round(base.r * baseAmount + target.r * mixAmount),
    g: Math.round(base.g * baseAmount + target.g * mixAmount),
    b: Math.round(base.b * baseAmount + target.b * mixAmount),
  };
}

function rgbaString(color: RgbColor, alpha: number) {
  return `rgba(${color.r}, ${color.g}, ${color.b}, ${clamp(alpha, 0, 1).toFixed(2)})`;
}

function getContrastForeground(color: RgbColor) {
  const luminance = (0.299 * color.r + 0.587 * color.g + 0.114 * color.b) / 255;
  return luminance > 0.62 ? "#09090d" : "#ffffff";
}

function getAccentThemeVariables(accentHex: string, darkMode: boolean) {
  const baseColor = hexToRgb(accentHex);
  const white = { r: 255, g: 255, b: 255 };
  const black = { r: 9, g: 9, b: 13 };

  if (darkMode) {
    const primary = mixRgb(baseColor, white, 0.12);
    const accentSurface = mixRgb(baseColor, { r: 18, g: 19, b: 26 }, 0.8);

    return {
      "--primary": rgbToHex(primary),
      "--primary-foreground": getContrastForeground(primary),
      "--accent": rgbToHex(accentSurface),
      "--accent-foreground": getContrastForeground(accentSurface),
      "--ring": rgbaString(primary, 0.42),
      "--sidebar-primary": rgbToHex(primary),
      "--sidebar-primary-foreground": getContrastForeground(primary),
      "--floating-nav-active-bg": rgbaString(primary, 0.94),
      "--floating-nav-active-foreground": getContrastForeground(primary),
      "--floating-fab-bg": rgbaString(primary, 0.94),
      "--floating-fab-foreground": getContrastForeground(primary),
    };
  }

  const primary = mixRgb(baseColor, black, 0.04);
  const accentSurface = mixRgb(baseColor, white, 0.88);

  return {
    "--primary": rgbToHex(primary),
    "--primary-foreground": getContrastForeground(primary),
    "--accent": rgbToHex(accentSurface),
    "--accent-foreground": getContrastForeground(accentSurface),
    "--ring": rgbaString(primary, 0.3),
    "--sidebar-primary": rgbToHex(primary),
    "--sidebar-primary-foreground": getContrastForeground(primary),
    "--floating-nav-active-bg": rgbaString(primary, 0.95),
    "--floating-nav-active-foreground": getContrastForeground(primary),
    "--floating-fab-bg": rgbaString(primary, 0.95),
    "--floating-fab-foreground": getContrastForeground(primary),
  };
}

function resetAccentTheme() {
  if (typeof document === "undefined") {
    return;
  }

  for (const property of THEME_OVERRIDE_PROPERTIES) {
    document.documentElement.style.removeProperty(property);
  }
}

export function getAccentHexFromHue(hue: number) {
  return rgbToHex(hslToRgb(hue, 0.78, 0.52));
}

export function getAccentHueFromHex(hex: string) {
  const normalizedHex = normalizeAccentHex(hex);
  if (!normalizedHex) {
    return DEFAULT_ACCENT_HUE;
  }

  const { h, s } = rgbToHsl(hexToRgb(normalizedHex));
  return s < 0.08 ? DEFAULT_ACCENT_HUE : Math.round(h);
}

export function applyAccentTheme(accentHex: string | null | undefined, darkMode = isDarkModeEnabled()) {
  if (typeof document === "undefined") {
    return;
  }

  const normalizedHex = normalizeAccentHex(accentHex);
  if (!normalizedHex) {
    resetAccentTheme();
    return;
  }

  const themeVariables = getAccentThemeVariables(normalizedHex, darkMode);
  for (const [property, value] of Object.entries(themeVariables)) {
    document.documentElement.style.setProperty(property, value);
  }
}

export function isDarkModeEnabled() {
  return localStorage.getItem(COLOR_MODE_STORAGE_KEY) === "true";
}

export function applyColorMode(nextDarkMode: boolean) {
  localStorage.setItem(COLOR_MODE_STORAGE_KEY, String(nextDarkMode));
  document.documentElement.classList.toggle("dark", nextDarkMode);
  window.dispatchEvent(new CustomEvent(COLOR_MODE_EVENT, { detail: { isDarkMode: nextDarkMode } }));
}

export function subscribeToColorMode(onChange: (isDarkMode: boolean) => void) {
  const handleChange = (event: Event) => {
    const customEvent = event as CustomEvent<{ isDarkMode?: boolean }>;
    onChange(customEvent.detail?.isDarkMode ?? isDarkModeEnabled());
  };

  const handleStorage = (event: StorageEvent) => {
    if (event.key === COLOR_MODE_STORAGE_KEY) {
      onChange(isDarkModeEnabled());
    }
  };

  window.addEventListener(COLOR_MODE_EVENT, handleChange);
  window.addEventListener("storage", handleStorage);

  return () => {
    window.removeEventListener(COLOR_MODE_EVENT, handleChange);
    window.removeEventListener("storage", handleStorage);
  };
}
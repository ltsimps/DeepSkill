export type ThemeColor = {
  light: string;
  dark: string;
};

export type ThemeConfig = {
  name: string;
  colors: {
    primary: ThemeColor;
    secondary: ThemeColor;
    background: ThemeColor;
    foreground: ThemeColor;
    muted: ThemeColor;
    accent: ThemeColor;
  };
};

export const defaultTheme: ThemeConfig = {
  name: "Default",
  colors: {
    primary: {
      light: "201 96% 32%",
      dark: "201 96% 32%",
    },
    secondary: {
      light: "210 40% 96.1%",
      dark: "217.2 32.6% 17.5%",
    },
    background: {
      light: "0 0% 100%",
      dark: "222.2 84% 4.9%",
    },
    foreground: {
      light: "222.2 84% 4.9%",
      dark: "210 40% 98%",
    },
    muted: {
      light: "210 40% 96.1%",
      dark: "217.2 32.6% 17.5%",
    },
    accent: {
      light: "210 40% 96.1%",
      dark: "217.2 32.6% 17.5%",
    },
  },
};

export const oceanTheme: ThemeConfig = {
  name: "Ocean",
  colors: {
    primary: {
      light: "199 89% 48%",
      dark: "199 89% 48%",
    },
    secondary: {
      light: "200 98% 39%",
      dark: "200 98% 39%",
    },
    background: {
      light: "0 0% 100%",
      dark: "200 50% 3%",
    },
    foreground: {
      light: "200 50% 3%",
      dark: "0 0% 100%",
    },
    muted: {
      light: "200 40% 96%",
      dark: "200 40% 10%",
    },
    accent: {
      light: "199 89% 48%",
      dark: "199 89% 48%",
    },
  },
};

export const forestTheme: ThemeConfig = {
  name: "Forest",
  colors: {
    primary: {
      light: "142 72% 29%",
      dark: "142 72% 29%",
    },
    secondary: {
      light: "138 50% 96%",
      dark: "138 30% 10%",
    },
    background: {
      light: "0 0% 100%",
      dark: "146 30% 7%",
    },
    foreground: {
      light: "146 30% 7%",
      dark: "0 0% 100%",
    },
    muted: {
      light: "138 50% 96%",
      dark: "138 30% 10%",
    },
    accent: {
      light: "142 72% 29%",
      dark: "142 72% 29%",
    },
  },
};

export const themes = [defaultTheme, oceanTheme, forestTheme];

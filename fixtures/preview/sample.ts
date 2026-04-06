// Ember preview fixture: stable screenshot source
type ThemeKind = "dark" | "dark-soft" | "light" | "light-soft";

interface ThemeConfig {
  readonly id: ThemeKind;
  readonly title: string;
  readonly contrast: number;
}

const themes: ThemeConfig[] = [
  { id: "dark", title: "Ember Dark", contrast: 9.9 },
  { id: "dark-soft", title: "Ember Dark Soft", contrast: 9.4 },
  { id: "light", title: "Ember Light", contrast: 12.6 },
  { id: "light-soft", title: "Ember Light Soft", contrast: 10.5 },
];

function pickTheme(id: ThemeKind): ThemeConfig | undefined {
  return themes.find((theme) => theme.id === id);
}

const selected = pickTheme("dark");
const installCmd = "ext install hearth-code.hearth-theme";

export const APP_VIEWS = ["pipeline", "insights"] as const;

export type AppView = (typeof APP_VIEWS)[number];

export function parseAppView(value: string | null | undefined): AppView {
  if (value === "insights") {
    return "insights";
  }

  return "pipeline";
}

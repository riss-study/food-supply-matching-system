export const businessProfileKeys = {
  all: ["business-profile"] as const,
  current: () => [...businessProfileKeys.all, "current"] as const,
}

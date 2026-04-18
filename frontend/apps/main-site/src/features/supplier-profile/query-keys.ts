export const supplierProfileKeys = {
  all: ["supplier-profile"] as const,
  current: () => [...supplierProfileKeys.all, "current"] as const,
  latestVerification: () => [...supplierProfileKeys.all, "latest-verification"] as const,
}

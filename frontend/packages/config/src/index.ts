export const APP_NAME = "food-supply-matching"
export const DEFAULT_PAGE_SIZE = 20

/**
 * 공급자 카테고리 마스터 리스트 (SSOT).
 * 의뢰 등록 · 공급자 프로필 · 탐색 필터 · 기타 모든 곳에서 이 목록을 참조한다.
 * 라벨은 i18n `common:supplierCategory.${code}` 에서 조회.
 */
export const SUPPLIER_CATEGORY_CODES = [
  "snack",
  "beverage",
  "sauce",
  "bakery",
  "dairy",
  "health",
  "frozen",
  "other",
] as const

export type SupplierCategoryCode = typeof SUPPLIER_CATEGORY_CODES[number]

/**
 * 원료 규정 (SSOT).
 * 라벨: `common:rawMaterialRule.${code}`
 */
export const RAW_MATERIAL_RULES = [
  "requester_provided",
  "supplier_provided",
] as const

export type RawMaterialRule = typeof RAW_MATERIAL_RULES[number]

/**
 * 포장 요구사항 (SSOT).
 * 라벨: `common:packagingRequirement.${code}`
 */
export const PACKAGING_REQUIREMENTS = [
  "private_label",
  "bulk",
  "none",
] as const

export type PackagingRequirement = typeof PACKAGING_REQUIREMENTS[number]

/**
 * 인증 요구사항 코드 (SSOT).
 * 백엔드는 String[] 허용. 현재는 UI 에서 단일 선택, 추후 다중/기타 옵션 확장 예정.
 * 라벨: `common:certification.${code}`
 */
export const CERTIFICATION_CODES = [
  "HACCP",
  "ISO22000",
  "FSSC22000",
  "ORGANIC",
  "HALAL",
  "KOSHER",
] as const

export type CertificationCode = typeof CERTIFICATION_CODES[number]

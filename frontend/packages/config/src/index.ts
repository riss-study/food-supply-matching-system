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

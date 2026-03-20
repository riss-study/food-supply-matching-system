import { useQuery } from "@tanstack/react-query"
import { getSupplierCategories, getSupplierRegions } from "../api/discovery-api"

export function useSupplierCategories() {
  return useQuery({ queryKey: ["supplier-categories"], queryFn: getSupplierCategories })
}

export function useSupplierRegions() {
  return useQuery({ queryKey: ["supplier-regions"], queryFn: getSupplierRegions })
}

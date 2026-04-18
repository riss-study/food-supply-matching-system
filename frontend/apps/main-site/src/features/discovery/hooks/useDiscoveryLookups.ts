import { useQuery } from "@tanstack/react-query"
import { getSupplierCategories, getSupplierRegions } from "../api/discovery-api"
import { discoveryKeys } from "../query-keys"

export function useSupplierCategories() {
  return useQuery({ queryKey: discoveryKeys.categories(), queryFn: getSupplierCategories })
}

export function useSupplierRegions() {
  return useQuery({ queryKey: discoveryKeys.regions(), queryFn: getSupplierRegions })
}

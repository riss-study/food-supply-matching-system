import { useMutation, useQueryClient } from "@tanstack/react-query"
import { supplierRequestKeys } from "../../supplier-requests/query-keys"
import { publishRequest } from "../api/request-api"
import { requestKeys } from "../query-keys"

export function usePublishRequest() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: publishRequest,
    onSuccess: (_, requestId) => {
      queryClient.invalidateQueries({ queryKey: requestKeys.detail(requestId) })
      queryClient.invalidateQueries({ queryKey: requestKeys.lists() })
      queryClient.invalidateQueries({ queryKey: supplierRequestKeys.feeds() })
    },
  })
}

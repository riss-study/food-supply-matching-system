import { useTranslation } from "react-i18next"
import type { RequestDetail, UpdateRequestRequest } from "@fsm/types"
import { useUpdateRequest } from "../hooks/useUpdateRequest"
import { RequestForm, fromRequestDetail, type RequestFormValues } from "./RequestForm"

interface Props {
  request: RequestDetail
  onSaved: () => void
  onError: (message: string) => void
  onCancel?: () => void
}

export function RequestEditForm({ request, onSaved, onError, onCancel }: Props) {
  const { t } = useTranslation("request-management")
  const updateMutation = useUpdateRequest()

  const handleSubmit = (values: RequestFormValues) => {
    const update: UpdateRequestRequest = {
      title: values.title,
      desiredVolume: values.desiredVolume.trim(),
      targetPriceRange:
        values.targetPriceMin || values.targetPriceMax
          ? {
              ...(values.targetPriceMin ? { min: values.targetPriceMin } : {}),
              ...(values.targetPriceMax ? { max: values.targetPriceMax } : {}),
            }
          : undefined,
      certificationRequirement:
        values.certifications.length > 0 ? values.certifications : undefined,
      rawMaterialRule: values.rawMaterialRule || undefined,
      packagingRequirement: values.packagingRequirement || undefined,
      deliveryRequirement: values.deliveryRequirement || undefined,
      notes: values.notes || undefined,
    }

    updateMutation.mutate(
      { requestId: request.requestId, request: update },
      {
        onSuccess: onSaved,
        onError: () => onError(t("edit.saveError")),
      },
    )
  }

  return (
    <RequestForm
      mode="edit"
      initialValues={fromRequestDetail(request)}
      onSubmit={handleSubmit}
      onCancel={onCancel}
      isSubmitting={updateMutation.isPending}
    />
  )
}

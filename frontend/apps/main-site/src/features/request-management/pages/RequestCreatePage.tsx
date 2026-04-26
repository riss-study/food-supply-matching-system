import { useNavigate, useSearchParams } from "react-router-dom"
import { useTranslation } from "react-i18next"
import type { CreateRequestRequest } from "@fsm/types"
import { useCreateRequest } from "../hooks/useCreateRequest"
import { RequestForm, emptyRequestValues, type RequestFormValues } from "../components/RequestForm"

export function RequestCreatePage() {
  const { t } = useTranslation("request-management")
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const createMutation = useCreateRequest()

  const targetSupplierIdFromUrl = searchParams.get("targetSupplierId")
  const targetSupplierNameFromUrl = searchParams.get("targetSupplierName")
  const hasPrefilledSupplier = Boolean(targetSupplierIdFromUrl && targetSupplierNameFromUrl)

  const initialValues = emptyRequestValues({
    mode: hasPrefilledSupplier ? "targeted" : "public",
    targetSupplierIds: targetSupplierIdFromUrl ? [targetSupplierIdFromUrl] : [],
  })

  const handleSubmit = (values: RequestFormValues) => {
    const requestData: CreateRequestRequest = {
      mode: values.mode,
      title: values.title,
      category: values.category,
      desiredVolume: values.desiredVolume.trim(),
      ...(values.targetPriceMin || values.targetPriceMax
        ? {
            targetPriceRange: {
              ...(values.targetPriceMin ? { min: values.targetPriceMin } : {}),
              ...(values.targetPriceMax ? { max: values.targetPriceMax } : {}),
            },
          }
        : {}),
      ...(values.certifications.length > 0
        ? { certificationRequirement: values.certifications }
        : {}),
      ...(values.rawMaterialRule ? { rawMaterialRule: values.rawMaterialRule } : {}),
      ...(values.packagingRequirement ? { packagingRequirement: values.packagingRequirement } : {}),
      ...(values.deliveryRequirement ? { deliveryRequirement: values.deliveryRequirement } : {}),
      ...(values.notes ? { notes: values.notes } : {}),
      ...(values.mode === "targeted" ? { targetSupplierIds: values.targetSupplierIds } : {}),
    }

    createMutation.mutate(requestData, {
      onSuccess: () => {
        navigate("/requests")
      },
    })
  }

  return (
    <div className="page">
      <div className="page-header">
        <div className="page-header-text">
          <h1>{t("create.title")}</h1>
          <p>{t("create.description")}</p>
        </div>
      </div>

      <RequestForm
        mode="create"
        initialValues={initialValues}
        onSubmit={handleSubmit}
        onCancel={() => navigate("/requests")}
        isSubmitting={createMutation.isPending}
        submitError={createMutation.isError ? t("create.submitError") : null}
        prefilledSupplierName={hasPrefilledSupplier ? targetSupplierNameFromUrl : null}
      />
    </div>
  )
}

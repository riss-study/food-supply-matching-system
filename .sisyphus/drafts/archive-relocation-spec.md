# Archive Relocation Spec

> 상태: Draft
> 목적: retired Phase 1 design 문서를 archive 폴더로 옮길 때의 정확한 대상 경로를 고정

---

## 1. Target Folder

권장 archive 경로:

```text
.sisyphus/archive/design/phase1/
```

---

## 2. Files To Move

다음 문서를 위 archive 경로로 이동했다.

- `.sisyphus/archive/design/phase1/phase1-design-baseline.md`
- `.sisyphus/archive/design/phase1/phase1-information-architecture-and-flows.md`
- `.sisyphus/archive/design/phase1/phase1-permissions-and-state-model.md`
- `.sisyphus/archive/design/phase1/phase1-domain-and-data-model.md`
- `.sisyphus/archive/design/phase1/phase1-api-and-validation-spec.md`
- `.sisyphus/archive/design/phase1/phase1-acceptance-scenarios-and-backlog.md`

---

## 3. Post-Move State

이동 후 기준 문서 세트는 아래만 본다.

- `.sisyphus/drafts/system-architecture.md`
- `.sisyphus/drafts/data-model.md`
- `.sisyphus/drafts/api-spec.md`
- `.sisyphus/drafts/backend-guide.md`
- `.sisyphus/drafts/frontend-guide.md`
- `.sisyphus/drafts/design-system.md`
- `.sisyphus/drafts/acceptance-scenarios-and-backlog.md`

archive 경로 아래 문서는 기록 보존용으로만 취급한다.

---

## 4. Follow-up After Move

- 새 draft 세트를 기준 문서로 안내하는 entry guide/README 성격 문서가 있으면 나중에 archive 경로를 반영한다.
- archive 문서는 새 기준 문서와 충돌할 때 절대 우선권을 갖지 않는다.

---

## 5. Execution Note

이 문서는 planner 기준의 이동 명세였고, 현재 실제 이동까지 완료되었다.

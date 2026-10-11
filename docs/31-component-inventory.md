# 세 제품 전체 UI 코드 목록

`node tools/component-registry.mjs --write`로 생성합니다. 실제 작업 폴더를 읽으며 제품 코드는 변경하지 않습니다.

공용 부품의 역할표는 [29번 기록부](29-component-registry.md), 규칙 원본은 [component-rules.json](../source/component-rules.json), 운영 방법은 [30번 문서](30-component-governance.md)입니다.

이 목록은 정적 코드 목록입니다. 역할표에 등록한 부품 외의 분류는 이름과 경로에서 추론합니다. 전체 부품의 규칙 준수나 공통화 완료를 뜻하지 않습니다. 업무 부품의 디자인 검토와 실제 렌더링 확인은 남아 있습니다.

| 제품 | UI 모듈·스타일 | 컴포넌트 선언 | 생성 아이콘 모듈 | 역할 등록 부품 | 배포 조각 | qd 클래스 참조 모듈 | 공통 연결 근거 없는 모듈 |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Q-Atelier | 711 | 1153 | 143 | 87 | 21 | 70 | 623 |
| Q-Maison | 1107 | 1355 | 156 | 94 | 21 | 367 | 637 |
| Q-Carnet | 161 | 272 | 19 | 32 | 15 | 91 | 56 |

선언 수에는 함수, 래퍼, 별칭과 파일 내부 부품이 포함됩니다. 파일별 상세 클래스, CSS 변수, 원시 컨트롤, 인라인 스타일 수, import 경로는 [JSON 목록](../dist/q-design.components.json)에 있습니다.

연결 표기의 뜻: `canonical-copy`는 원본과 대조하는 배포 파일, `qd-class-reference`는 공통 클래스 이름 참조, `imports-canonical-module`은 공통 파일로 이어지는 import, `product-local`은 이 두 근거가 없는 제품 소유 파일입니다. 전역 CSS 상속이나 아뜰리에 자체 토큰 사용도 마지막 범주일 수 있습니다. 스타일 위반 판정이 아닙니다. import 경로는 앱 진입점 중 하나에 연결됐다는 뜻이며 모든 화면에서 실행된다는 뜻은 아닙니다.

## Q-Atelier

| 파일 | 컴포넌트와 규칙 분류 | 연결 근거 |
| --- | --- | --- |
| [app/(app)/admin/activity/page.tsx](../../Q-Atelier/app/(app)/admin/activity/page.tsx) | `ActivityStatsPage` (screen, 추론), `KpiNote` (composition, 추론) | product-local |
| [app/(app)/admin/ai-control/_tabs/EvalRuns.tsx](../../Q-Atelier/app/(app)/admin/ai-control/_tabs/EvalRuns.tsx) | `EvalRunsTab` (navigation, 추론) | product-local |
| [app/(app)/admin/ai-control/_tabs/Failures.tsx](../../Q-Atelier/app/(app)/admin/ai-control/_tabs/Failures.tsx) | `FailuresTab` (navigation, 추론) | product-local |
| [app/(app)/admin/ai-control/_tabs/Models.tsx](../../Q-Atelier/app/(app)/admin/ai-control/_tabs/Models.tsx) | `historyPhoneRow` (data-display, 추론), `ModelsTab` (navigation, 추론), `rolePhoneRow` (data-display, 추론) | product-local |
| [app/(app)/admin/ai-control/_tabs/Overview.tsx](../../Q-Atelier/app/(app)/admin/ai-control/_tabs/Overview.tsx) | `OverviewTab` (navigation, 추론) | product-local |
| [app/(app)/admin/ai-control/_tabs/Usage.tsx](../../Q-Atelier/app/(app)/admin/ai-control/_tabs/Usage.tsx) | `UsageTab` (navigation, 추론) | product-local |
| [app/(app)/admin/ai-control/page.tsx](../../Q-Atelier/app/(app)/admin/ai-control/page.tsx) | `AiControlPage` (screen, 추론) | product-local |
| [app/(app)/admin/ai-models/page.tsx](../../Q-Atelier/app/(app)/admin/ai-models/page.tsx) | `AiModelsMoved` (composition, 추론) | product-local |
| [app/(app)/admin/alias-queue/page.tsx](../../Q-Atelier/app/(app)/admin/alias-queue/page.tsx) | `AliasQueuePage` (screen, 추론), `phoneRow` (data-display, 추론) | product-local |
| [app/(app)/admin/core-accuracy/page.tsx](../../Q-Atelier/app/(app)/admin/core-accuracy/page.tsx) | `CoreAccuracyPage` (screen, 추론), `VersionStat` (data-display, 추론) | product-local |
| [app/(app)/admin/default-templates/page.tsx](../../Q-Atelier/app/(app)/admin/default-templates/page.tsx) | `DefaultTemplatesPage` (screen, 추론), `docsetTag` (data-display, 추론), `downloadFile` (composition, 추론), `fileTag` (data-display, 추론), `phoneRow` (data-display, 추론), `rowActions` (action, 추론) | product-local |
| [app/(app)/admin/docset-library/page.tsx](../../Q-Atelier/app/(app)/admin/docset-library/page.tsx) | `AdminDocsetLibraryPage` (screen, 추론) | product-local |
| [app/(app)/admin/engine-assumptions/page.tsx](../../Q-Atelier/app/(app)/admin/engine-assumptions/page.tsx) | `EngineAssumptionsPage` (screen, 추론), `MetricStat` (data-display, 추론) | product-local |
| [app/(app)/admin/eval-sets/[id]/review/page.tsx](../../Q-Atelier/app/(app)/admin/eval-sets/%5Bid%5D/review/page.tsx) | `CaseCard` (composition, 추론), `EvalSetReviewPage` (screen, 추론) | qd-class-reference |
| [app/(app)/admin/eval-sets/page.tsx](../../Q-Atelier/app/(app)/admin/eval-sets/page.tsx) | `actions` (action, 추론), `EvalSetsPage` (screen, 추론), `phoneRow` (data-display, 추론) | qd-class-reference |
| [app/(app)/admin/expert-invites/invite-manager.tsx](../../Q-Atelier/app/(app)/admin/expert-invites/invite-manager.tsx) | `InviteCard` (composition, 추론), `InviteManager` (composition, 추론), `NewInviteForm` (composition, 추론) | product-local |
| [app/(app)/admin/expert-invites/page.tsx](../../Q-Atelier/app/(app)/admin/expert-invites/page.tsx) | `ExpertInvitesAdminPage` (screen, 추론) | product-local |
| [app/(app)/admin/experts/page.tsx](../../Q-Atelier/app/(app)/admin/experts/page.tsx) | `ExpertAdminPage` (screen, 추론), `ExpertCard` (composition, 추론), `ExpertScoreSummary` (data-display, 추론), `Leaderboard` (composition, 추론), `MiniScoreRow` (data-display, 추론), `scoreCol` (composition, 추론) | product-local |
| [app/(app)/admin/knowledge/page.tsx](../../Q-Atelier/app/(app)/admin/knowledge/page.tsx) | `KnowledgePage` (screen, 추론), `TemplateDownload` (composition, 추론) | qd-class-reference |
| [app/(app)/admin/layout.tsx](../../Q-Atelier/app/(app)/admin/layout.tsx) | `AdminLayout` (layout, 추론) | product-local |
| [app/(app)/admin/mfds-diagnostics/page.tsx](../../Q-Atelier/app/(app)/admin/mfds-diagnostics/page.tsx) | `KV` (composition, 추론), `MfdsDiagnosticsPage` (screen, 추론) | product-local |
| [app/(app)/admin/multi-view/page.tsx](../../Q-Atelier/app/(app)/admin/multi-view/page.tsx) | `MultiViewPage` (screen, 추론), `PerspectiveColumn` (composition, 추론) | product-local |
| [app/(app)/admin/page.tsx](../../Q-Atelier/app/(app)/admin/page.tsx) | `AdminHomePage` (screen, 추론) | product-local |
| [app/(app)/admin/permissions-matrix/page.tsx](../../Q-Atelier/app/(app)/admin/permissions-matrix/page.tsx) | `DocPermissionsSection` (layout, 추론), `MatrixSection` (layout, 추론), `MobileNavSection` (layout, 추론), `PermissionsMatrixPage` (screen, 추론), `RoleSummary` (data-display, 추론) | qd-class-reference |
| [app/(app)/admin/q-match-training/page.tsx](../../Q-Atelier/app/(app)/admin/q-match-training/page.tsx) | `downloadBulkTemplateCsv` (composition, 추론), `downloadBulkTemplateXlsx` (composition, 추론), `MfdsAutoFillRow` (data-display, 추론), `QMatchTrainingPage` (screen, 추론) | product-local |
| [app/(app)/admin/qmatch-quiz/page.tsx](../../Q-Atelier/app/(app)/admin/qmatch-quiz/page.tsx) | `QmatchQuizPage` (screen, 추론) | product-local |
| [app/(app)/admin/rule-table/page.tsx](../../Q-Atelier/app/(app)/admin/rule-table/page.tsx) | `cellPhoneRow` (data-display, 추론), `marketPhoneRow` (data-display, 추론), `RiskChip` (composition, 추론), `rulePhoneRow` (data-display, 추론), `RuleTablePage` (screen, 추론), `whyOf` (composition, 추론) | qd-class-reference |
| [app/(app)/admin/screening/page.tsx](../../Q-Atelier/app/(app)/admin/screening/page.tsx) | `AdminScreeningPage` (screen, 추론), `AssessmentList` (data-display, 추론), `editorOf` (composition, 추론), `MemberList` (data-display, 추론), `ProductList` (data-display, 추론), `ResearchList` (data-display, 추론) | product-local |
| [app/(app)/admin/subscriptions/page.tsx](../../Q-Atelier/app/(app)/admin/subscriptions/page.tsx) | `CardHeader` (layout, 추론), `ExecutiveGrantSection` (layout, 추론), `HistoryMiniChart` (chart, 추론), `MetricCell` (composition, 추론), `MetricChip` (composition, 추론), `NumberInput` (field, 추론), `OrgCard` (composition, 추론), `SectionLabel` (field, 추론), `SubscriptionsAdminPage` (screen, 추론), `SubscriptionsList` (data-display, 추론), `UsageMetricGroup` (composition, 추론) | qd-class-reference |
| [app/(app)/admin/users/buttons.tsx](../../Q-Atelier/app/(app)/admin/users/buttons.tsx) | `ApproveRejectButtons` (composition, 추론) | product-local |
| [app/(app)/admin/users/page.tsx](../../Q-Atelier/app/(app)/admin/users/page.tsx) | `AdminUsersPage` (screen, 추론) | product-local |
| [app/(app)/admin/users/users-table-client.tsx](../../Q-Atelier/app/(app)/admin/users/users-table-client.tsx) | `UsersTableClient` (composition, 추론) | product-local |
| [app/(app)/admin/validation-evidence/page.tsx](../../Q-Atelier/app/(app)/admin/validation-evidence/page.tsx) | `datasetPhoneRow` (data-display, 추론), `download` (composition, 추론), `draftPhoneRow` (data-display, 추론), `KV` (composition, 추론), `Mark` (composition, 추론), `recordPhoneRow` (data-display, 추론), `Stat` (data-display, 추론), `ValidationEvidencePage` (screen, 추론) | product-local |
| [app/(app)/admin/vigilance/page.tsx](../../Q-Atelier/app/(app)/admin/vigilance/page.tsx) | `VigilancePage` (screen, 추론) | qd-class-reference |
| [app/(app)/approve/client.tsx](../../Q-Atelier/app/(app)/approve/client.tsx) | `InboxHead` (composition, 추론), `MobileApprovalClient` (composition, 추론) | qd-class-reference |
| [app/(app)/approve/page.tsx](../../Q-Atelier/app/(app)/approve/page.tsx) | `ApprovePage` (screen, 추론) | product-local |
| [app/(app)/assessments/[code]/page.tsx](../../Q-Atelier/app/(app)/assessments/%5Bcode%5D/page.tsx) | `AssessmentDetailPage` (screen, 추론), `ReevalDiffBanner` (feedback, 추론), `ResultBody` (composition, 추론), `ReviewsBlock` (composition, 추론), `ReviewStatusNotice` (feedback, 추론) | product-local |
| [app/(app)/assessments/assessments-client.tsx](../../Q-Atelier/app/(app)/assessments/assessments-client.tsx) | `AssessmentsClient` (composition, 추론), `AssessTabBtn` (composition, 추론), `ColHeader` (composition, 추론), `exportCsv` (composition, 추론), `highlight` (composition, 추론), `Lbl` (field, 추론), `Row` (data-display, 추론) | product-local |
| [app/(app)/assessments/loading.tsx](../../Q-Atelier/app/(app)/assessments/loading.tsx) | `AssessmentsLoading` (feedback, 추론) | product-local |
| [app/(app)/assessments/new/layout.tsx](../../Q-Atelier/app/(app)/assessments/new/layout.tsx) | `NewAssessmentLayout` (layout, 추론) | product-local |
| [app/(app)/assessments/new/page.tsx](../../Q-Atelier/app/(app)/assessments/new/page.tsx) | `NewAssessmentPage` (screen, 추론), `SectionHead` (composition, 추론) | qd-class-reference |
| [app/(app)/assessments/page.tsx](../../Q-Atelier/app/(app)/assessments/page.tsx) | `AssessmentsPage` (screen, 추론) | product-local |
| [app/(app)/audit-readiness/page.tsx](../../Q-Atelier/app/(app)/audit-readiness/page.tsx) | `AuditReadinessPage` (screen, 추론), `CountChip` (composition, 추론) | product-local |
| [app/(app)/audit/export-button.tsx](../../Q-Atelier/app/(app)/audit/export-button.tsx) | `AuditExportButton` (action, 추론) | product-local |
| [app/(app)/audit/filter-bar.tsx](../../Q-Atelier/app/(app)/audit/filter-bar.tsx) | `AuditFilterBar` (composition, 추론) | qd-class-reference |
| [app/(app)/audit/page.tsx](../../Q-Atelier/app/(app)/audit/page.tsx) | `AuditPage` (screen, 추론) | product-local |
| [app/(app)/audits/[id]/client.tsx](../../Q-Atelier/app/(app)/audits/%5Bid%5D/client.tsx) | `AuditDetailClient` (composition, 추론), `FindingModal` (overlay, 추론) | product-local |
| [app/(app)/audits/[id]/page.tsx](../../Q-Atelier/app/(app)/audits/%5Bid%5D/page.tsx) | `AuditDetailPage` (screen, 추론) | product-local |
| [app/(app)/audits/[id]/print/[kind]/page.tsx](../../Q-Atelier/app/(app)/audits/%5Bid%5D/print/%5Bkind%5D/page.tsx) | `AuditSheetPrintPage` (document, 추론) | product-local |
| [app/(app)/audits/new/client.tsx](../../Q-Atelier/app/(app)/audits/new/client.tsx) | `AuditNewClient` (composition, 추론) | product-local |
| [app/(app)/audits/new/page.tsx](../../Q-Atelier/app/(app)/audits/new/page.tsx) | `AuditNewPage` (screen, 추론) | product-local |
| [app/(app)/audits/page.tsx](../../Q-Atelier/app/(app)/audits/page.tsx) | `AuditsPage` (screen, 추론) | product-local |
| [app/(app)/authorized-reps/[id]/client.tsx](../../Q-Atelier/app/(app)/authorized-reps/%5Bid%5D/client.tsx) | `ArDetailClient` (composition, 추론) | product-local |
| [app/(app)/authorized-reps/[id]/page.tsx](../../Q-Atelier/app/(app)/authorized-reps/%5Bid%5D/page.tsx) | `ArDetailPage` (screen, 추론) | product-local |
| [app/(app)/authorized-reps/new/client.tsx](../../Q-Atelier/app/(app)/authorized-reps/new/client.tsx) | `NewArClient` (composition, 추론) | product-local |
| [app/(app)/authorized-reps/new/page.tsx](../../Q-Atelier/app/(app)/authorized-reps/new/page.tsx) | `NewArPage` (screen, 추론) | product-local |
| [app/(app)/authorized-reps/page.tsx](../../Q-Atelier/app/(app)/authorized-reps/page.tsx) | `AuthorizedRepsPage` (screen, 추론) | product-local |
| [app/(app)/calendar/page.tsx](../../Q-Atelier/app/(app)/calendar/page.tsx) | `CalendarPage` (screen, 추론) | product-local |
| [app/(app)/calibration/[id]/page.tsx](../../Q-Atelier/app/(app)/calibration/%5Bid%5D/page.tsx) | `CalibrationDetailPage` (screen, 추론) | product-local |
| [app/(app)/calibration/layout.tsx](../../Q-Atelier/app/(app)/calibration/layout.tsx) | `CalibrationLayout` (layout, 추론) | product-local |
| [app/(app)/calibration/page.tsx](../../Q-Atelier/app/(app)/calibration/page.tsx) | `CalibrationPage` (screen, 추론), `downloadSampleCsv` (composition, 추론), `downloadSampleXlsx` (composition, 추론) | product-local |
| [app/(app)/calibration/suggestions/page.tsx](../../Q-Atelier/app/(app)/calibration/suggestions/page.tsx) | `SuggestionsPage` (screen, 추론) | product-local |
| [app/(app)/capa/[id]/client.tsx](../../Q-Atelier/app/(app)/capa/%5Bid%5D/client.tsx) | `CapaDetailClient` (composition, 추론) | qd-class-reference |
| [app/(app)/capa/[id]/page.tsx](../../Q-Atelier/app/(app)/capa/%5Bid%5D/page.tsx) | `CapaDetailPage` (screen, 추론) | product-local |
| [app/(app)/capa/[id]/print/[which]/page.tsx](../../Q-Atelier/app/(app)/capa/%5Bid%5D/print/%5Bwhich%5D/page.tsx) | `CapaSheetPrintPage` (document, 추론) | product-local |
| [app/(app)/capa/new/client.tsx](../../Q-Atelier/app/(app)/capa/new/client.tsx) | `CapaNewClient` (composition, 추론), `KindButton` (action, 추론) | product-local |
| [app/(app)/capa/new/page.tsx](../../Q-Atelier/app/(app)/capa/new/page.tsx) | `CapaNewPage` (screen, 추론) | product-local |
| [app/(app)/capa/page.tsx](../../Q-Atelier/app/(app)/capa/page.tsx) | `CapaListPage` (screen, 추론) | product-local |
| [app/(app)/cleanroom/[id]/client.tsx](../../Q-Atelier/app/(app)/cleanroom/%5Bid%5D/client.tsx) | `CleanroomDetailClient` (composition, 추론) | product-local |
| [app/(app)/cleanroom/[id]/page.tsx](../../Q-Atelier/app/(app)/cleanroom/%5Bid%5D/page.tsx) | `CleanroomDetailPage` (screen, 추론) | product-local |
| [app/(app)/cleanroom/new/client.tsx](../../Q-Atelier/app/(app)/cleanroom/new/client.tsx) | `NewCleanroomClient` (composition, 추론) | product-local |
| [app/(app)/cleanroom/new/page.tsx](../../Q-Atelier/app/(app)/cleanroom/new/page.tsx) | `NewCleanroomPage` (screen, 추론) | product-local |
| [app/(app)/cleanroom/page.tsx](../../Q-Atelier/app/(app)/cleanroom/page.tsx) | `CleanroomPage` (screen, 추론) | product-local |
| [app/(app)/clinical-evaluations/[id]/client.tsx](../../Q-Atelier/app/(app)/clinical-evaluations/%5Bid%5D/client.tsx) | `CerDetailClient` (composition, 추론), `PanelTitle` (composition, 추론) | product-local |
| [app/(app)/clinical-evaluations/[id]/page.tsx](../../Q-Atelier/app/(app)/clinical-evaluations/%5Bid%5D/page.tsx) | `CerDetailPage` (screen, 추론) | product-local |
| [app/(app)/clinical-evaluations/new/client.tsx](../../Q-Atelier/app/(app)/clinical-evaluations/new/client.tsx) | `NewCerClient` (composition, 추론), `PanelTitle` (composition, 추론) | product-local |
| [app/(app)/clinical-evaluations/new/page.tsx](../../Q-Atelier/app/(app)/clinical-evaluations/new/page.tsx) | `NewCerPage` (screen, 추론) | product-local |
| [app/(app)/clinical-evaluations/page.tsx](../../Q-Atelier/app/(app)/clinical-evaluations/page.tsx) | `ClinicalEvaluationsPage` (screen, 추론) | product-local |
| [app/(app)/complaints/[id]/client.tsx](../../Q-Atelier/app/(app)/complaints/%5Bid%5D/client.tsx) | `ComplaintDetailClient` (composition, 추론) | product-local |
| [app/(app)/complaints/[id]/page.tsx](../../Q-Atelier/app/(app)/complaints/%5Bid%5D/page.tsx) | `ComplaintDetailPage` (screen, 추론) | product-local |
| [app/(app)/complaints/[id]/print/investigation/page.tsx](../../Q-Atelier/app/(app)/complaints/%5Bid%5D/print/investigation/page.tsx) | `InvestigationPrintPage` (document, 추론) | product-local |
| [app/(app)/complaints/new/client.tsx](../../Q-Atelier/app/(app)/complaints/new/client.tsx) | `ComplaintsNewClient` (composition, 추론) | product-local |
| [app/(app)/complaints/new/page.tsx](../../Q-Atelier/app/(app)/complaints/new/page.tsx) | `ComplaintNewPage` (screen, 추론) | product-local |
| [app/(app)/complaints/page.tsx](../../Q-Atelier/app/(app)/complaints/page.tsx) | `ComplaintsListPage` (screen, 추론) | product-local |
| [app/(app)/contracts/[id]/page.tsx](../../Q-Atelier/app/(app)/contracts/%5Bid%5D/page.tsx) | `ContractDetailPage` (screen, 추론) | product-local |
| [app/(app)/contracts/page.tsx](../../Q-Atelier/app/(app)/contracts/page.tsx) | `ContractsPage` (screen, 추론) | product-local |
| [app/(app)/customer-property/[id]/page.tsx](../../Q-Atelier/app/(app)/customer-property/%5Bid%5D/page.tsx) | `CustomerPropertyDetailPage` (screen, 추론) | product-local |
| [app/(app)/customer-property/page.tsx](../../Q-Atelier/app/(app)/customer-property/page.tsx) | `CustomerPropertyPage` (screen, 추론) | product-local |
| [app/(app)/dashboard/loading.tsx](../../Q-Atelier/app/(app)/dashboard/loading.tsx) | `DashboardLoading` (feedback, 추론) | product-local |
| [app/(app)/dashboard/page.tsx](../../Q-Atelier/app/(app)/dashboard/page.tsx) | `DashboardPage` (screen, 추론) | qd-class-reference |
| [app/(app)/design-trace/client.tsx](../../Q-Atelier/app/(app)/design-trace/client.tsx) | `GapBadges` (data-display, 추론), `TraceClient` (composition, 추론) | qd-class-reference |
| [app/(app)/design-trace/page.tsx](../../Q-Atelier/app/(app)/design-trace/page.tsx) | `Page` (screen, 추론) | product-local |
| [app/(app)/device-licenses/[id]/client.tsx](../../Q-Atelier/app/(app)/device-licenses/%5Bid%5D/client.tsx) | `downloadCertificateSecure` (composition, 추론), `LicenseDetailClient` (composition, 추론) | qd-class-reference |
| [app/(app)/device-licenses/[id]/page.tsx](../../Q-Atelier/app/(app)/device-licenses/%5Bid%5D/page.tsx) | `LicenseDetailPage` (screen, 추론) | product-local |
| [app/(app)/device-licenses/new/client.tsx](../../Q-Atelier/app/(app)/device-licenses/new/client.tsx) | `NewLicenseClient` (composition, 추론) | product-local |
| [app/(app)/device-licenses/new/page.tsx](../../Q-Atelier/app/(app)/device-licenses/new/page.tsx) | `NewLicensePage` (screen, 추론) | product-local |
| [app/(app)/device-licenses/page.tsx](../../Q-Atelier/app/(app)/device-licenses/page.tsx) | `DeviceLicensesPage` (screen, 추론) | product-local |
| [app/(app)/equipment/[id]/client.tsx](../../Q-Atelier/app/(app)/equipment/%5Bid%5D/client.tsx) | `EquipmentDetailClient` (composition, 추론), `readRow` (data-display, 추론) | product-local |
| [app/(app)/equipment/[id]/page.tsx](../../Q-Atelier/app/(app)/equipment/%5Bid%5D/page.tsx) | `EquipmentDetailPage` (screen, 추론) | product-local |
| [app/(app)/equipment/new/client.tsx](../../Q-Atelier/app/(app)/equipment/new/client.tsx) | `NewEquipmentClient` (composition, 추론) | product-local |
| [app/(app)/equipment/new/page.tsx](../../Q-Atelier/app/(app)/equipment/new/page.tsx) | `NewEquipmentPage` (screen, 추론) | product-local |
| [app/(app)/equipment/page.tsx](../../Q-Atelier/app/(app)/equipment/page.tsx) | `EquipmentPage` (screen, 추론) | product-local |
| [app/(app)/eu-mdr/[id]/client.tsx](../../Q-Atelier/app/(app)/eu-mdr/%5Bid%5D/client.tsx) | `EuMdrDetailClient` (composition, 추론) | product-local |
| [app/(app)/eu-mdr/[id]/page.tsx](../../Q-Atelier/app/(app)/eu-mdr/%5Bid%5D/page.tsx) | `EuMdrDetailPage` (screen, 추론) | product-local |
| [app/(app)/eu-mdr/new/client.tsx](../../Q-Atelier/app/(app)/eu-mdr/new/client.tsx) | `NewEuMdrClient` (composition, 추론) | product-local |
| [app/(app)/eu-mdr/new/page.tsx](../../Q-Atelier/app/(app)/eu-mdr/new/page.tsx) | `NewEuMdrPage` (screen, 추론) | product-local |
| [app/(app)/eu-mdr/page.tsx](../../Q-Atelier/app/(app)/eu-mdr/page.tsx) | `EuMdrPage` (screen, 추론) | product-local |
| [app/(app)/experts/page.tsx](../../Q-Atelier/app/(app)/experts/page.tsx) | `ExpertsPage` (screen, 추론) | product-local |
| [app/(app)/family-link/page.tsx](../../Q-Atelier/app/(app)/family-link/page.tsx) | `FamilyLinkPage` (screen, 추론) | product-local |
| [app/(app)/fda-510k/[id]/client.tsx](../../Q-Atelier/app/(app)/fda-510k/%5Bid%5D/client.tsx) | `Fda510kDetailClient` (composition, 추론) | product-local |
| [app/(app)/fda-510k/[id]/page.tsx](../../Q-Atelier/app/(app)/fda-510k/%5Bid%5D/page.tsx) | `Fda510kDetailPage` (screen, 추론) | product-local |
| [app/(app)/fda-510k/new/client.tsx](../../Q-Atelier/app/(app)/fda-510k/new/client.tsx) | `NewFda510kClient` (composition, 추론) | qd-class-reference |
| [app/(app)/fda-510k/new/page.tsx](../../Q-Atelier/app/(app)/fda-510k/new/page.tsx) | `NewFda510kPage` (screen, 추론) | product-local |
| [app/(app)/fda-510k/page.tsx](../../Q-Atelier/app/(app)/fda-510k/page.tsx) | `Fda510kPage` (screen, 추론) | product-local |
| [app/(app)/feedback/[id]/client.tsx](../../Q-Atelier/app/(app)/feedback/%5Bid%5D/client.tsx) | `FeedbackDetailClient` (composition, 추론) | product-local |
| [app/(app)/feedback/[id]/page.tsx](../../Q-Atelier/app/(app)/feedback/%5Bid%5D/page.tsx) | `Page` (screen, 추론) | product-local |
| [app/(app)/feedback/new/client.tsx](../../Q-Atelier/app/(app)/feedback/new/client.tsx) | `FeedbackNewClient` (composition, 추론) | product-local |
| [app/(app)/feedback/new/page.tsx](../../Q-Atelier/app/(app)/feedback/new/page.tsx) | `Page` (screen, 추론) | product-local |
| [app/(app)/feedback/page.tsx](../../Q-Atelier/app/(app)/feedback/page.tsx) | `FeedbackPage` (screen, 추론) | product-local |
| [app/(app)/glossary/page.tsx](../../Q-Atelier/app/(app)/glossary/page.tsx) | `GlossaryPage` (screen, 추론) | product-local |
| [app/(app)/inbox/[id]/page.tsx](../../Q-Atelier/app/(app)/inbox/%5Bid%5D/page.tsx) | `InboxDetailPage` (screen, 추론) | product-local |
| [app/(app)/inbox/loading.tsx](../../Q-Atelier/app/(app)/inbox/loading.tsx) | `InboxLoading` (feedback, 추론) | product-local |
| [app/(app)/inbox/page.tsx](../../Q-Atelier/app/(app)/inbox/page.tsx) | `AssignmentCard` (composition, 추론), `InboxPage` (screen, 추론) | product-local |
| [app/(app)/layout.tsx](../../Q-Atelier/app/(app)/layout.tsx) | `AppLayout` (layout, 추론) | imports-canonical-module |
| [app/(app)/letter-to-file/[id]/client.tsx](../../Q-Atelier/app/(app)/letter-to-file/%5Bid%5D/client.tsx) | `LtfDetailClient` (composition, 추론) | product-local |
| [app/(app)/letter-to-file/[id]/page.tsx](../../Q-Atelier/app/(app)/letter-to-file/%5Bid%5D/page.tsx) | `LtfDetailPage` (screen, 추론) | product-local |
| [app/(app)/letter-to-file/new/client.tsx](../../Q-Atelier/app/(app)/letter-to-file/new/client.tsx) | `NewLtfClient` (composition, 추론) | product-local |
| [app/(app)/letter-to-file/new/page.tsx](../../Q-Atelier/app/(app)/letter-to-file/new/page.tsx) | `NewLtfPage` (screen, 추론) | product-local |
| [app/(app)/letter-to-file/page.tsx](../../Q-Atelier/app/(app)/letter-to-file/page.tsx) | `LetterToFilePage` (screen, 추론) | product-local |
| [app/(app)/lots/[id]/client.tsx](../../Q-Atelier/app/(app)/lots/%5Bid%5D/client.tsx) | `LotDetailClient` (composition, 추론) | product-local |
| [app/(app)/lots/[id]/page.tsx](../../Q-Atelier/app/(app)/lots/%5Bid%5D/page.tsx) | `LotDetailPage` (screen, 추론) | product-local |
| [app/(app)/lots/new/client.tsx](../../Q-Atelier/app/(app)/lots/new/client.tsx) | `NewLotClient` (composition, 추론) | product-local |
| [app/(app)/lots/new/page.tsx](../../Q-Atelier/app/(app)/lots/new/page.tsx) | `NewLotPage` (screen, 추론) | product-local |
| [app/(app)/lots/page.tsx](../../Q-Atelier/app/(app)/lots/page.tsx) | `LotsPage` (screen, 추론) | product-local |
| [app/(app)/m/approve/page.tsx](../../Q-Atelier/app/(app)/m/approve/page.tsx) | `LegacyFieldApprovePage` (screen, 추론) | product-local |
| [app/(app)/m/field-ui.tsx](../../Q-Atelier/app/(app)/m/field-ui.tsx) | `ChoiceGroup` (composition, 추론), `FieldDenied` (composition, 추론), `FieldHeader` (composition, 추론), `FieldHomeLink` (composition, 추론), `FieldLabel` (field, 추론), `FieldNotice` (feedback, 추론), `FieldRow` (field, 추론), `FieldScreen` (screen, 추론), `NumDisplay` (composition, 추론), `NumPad` (composition, 추론), `PickList` (data-display, 추론), `PrimaryButton` (action, 추론), `ScanField` (field, 추론), `SecondaryButton` (action, 추론), `StickyActionBar` (action, 추론) | qd-class-reference |
| [app/(app)/m/guard.tsx](../../Q-Atelier/app/(app)/m/guard.tsx) | `fieldGate` (provider, 추론) | product-local |
| [app/(app)/m/lot/client.tsx](../../Q-Atelier/app/(app)/m/lot/client.tsx) | `LotClient` (composition, 추론) | product-local |
| [app/(app)/m/lot/page.tsx](../../Q-Atelier/app/(app)/m/lot/page.tsx) | `LotFieldPage` (screen, 추론) | product-local |
| [app/(app)/m/nc/client.tsx](../../Q-Atelier/app/(app)/m/nc/client.tsx) | `NcClient` (composition, 추론), `NcForm` (composition, 추론) | product-local |
| [app/(app)/m/nc/page.tsx](../../Q-Atelier/app/(app)/m/nc/page.tsx) | `NcFieldPage` (screen, 추론) | product-local |
| [app/(app)/m/page.tsx](../../Q-Atelier/app/(app)/m/page.tsx) | `ActionGroup` (composition, 추론), `FieldModeHubPage` (screen, 추론) | product-local |
| [app/(app)/m/process/client.tsx](../../Q-Atelier/app/(app)/m/process/client.tsx) | `ProcessClient` (composition, 추론) | product-local |
| [app/(app)/m/process/page.tsx](../../Q-Atelier/app/(app)/m/process/page.tsx) | `ProcessFieldPage` (screen, 추론) | product-local |
| [app/(app)/m/receiving/client.tsx](../../Q-Atelier/app/(app)/m/receiving/client.tsx) | `PlanCell` (composition, 추론), `ReceivingClient` (composition, 추론) | product-local |
| [app/(app)/m/receiving/page.tsx](../../Q-Atelier/app/(app)/m/receiving/page.tsx) | `ReceivingPage` (screen, 추론) | product-local |
| [app/(app)/m/release/page.tsx](../../Q-Atelier/app/(app)/m/release/page.tsx) | `ReleaseGuidePage` (screen, 추론) | product-local |
| [app/(app)/management-reviews/[id]/client.tsx](../../Q-Atelier/app/(app)/management-reviews/%5Bid%5D/client.tsx) | `MrDetailClient` (composition, 추론) | qd-class-reference |
| [app/(app)/management-reviews/[id]/page.tsx](../../Q-Atelier/app/(app)/management-reviews/%5Bid%5D/page.tsx) | `MrDetailPage` (screen, 추론) | product-local |
| [app/(app)/management-reviews/[id]/print/[kind]/page.tsx](../../Q-Atelier/app/(app)/management-reviews/%5Bid%5D/print/%5Bkind%5D/page.tsx) | `ReviewSheetPrintPage` (document, 추론) | product-local |
| [app/(app)/management-reviews/new/client.tsx](../../Q-Atelier/app/(app)/management-reviews/new/client.tsx) | `NewMrClient` (composition, 추론) | qd-class-reference |
| [app/(app)/management-reviews/new/page.tsx](../../Q-Atelier/app/(app)/management-reviews/new/page.tsx) | `NewMrPage` (screen, 추론) | product-local |
| [app/(app)/management-reviews/page.tsx](../../Q-Atelier/app/(app)/management-reviews/page.tsx) | `ManagementReviewsPage` (screen, 추론) | product-local |
| [app/(app)/messages/page.tsx](../../Q-Atelier/app/(app)/messages/page.tsx) | `downloadAttachment` (composition, 추론), `MessagesPage` (screen, 추론) | qd-class-reference |
| [app/(app)/my-actions/page.tsx](../../Q-Atelier/app/(app)/my-actions/page.tsx) | `MyActionsPage` (screen, 추론) | product-local |
| [app/(app)/nmpa/[id]/client.tsx](../../Q-Atelier/app/(app)/nmpa/%5Bid%5D/client.tsx) | `NmpaDetailClient` (composition, 추론) | product-local |
| [app/(app)/nmpa/[id]/page.tsx](../../Q-Atelier/app/(app)/nmpa/%5Bid%5D/page.tsx) | `NmpaDetailPage` (screen, 추론) | product-local |
| [app/(app)/nmpa/new/client.tsx](../../Q-Atelier/app/(app)/nmpa/new/client.tsx) | `NewNmpaClient` (composition, 추론) | product-local |
| [app/(app)/nmpa/new/page.tsx](../../Q-Atelier/app/(app)/nmpa/new/page.tsx) | `NewNmpaPage` (screen, 추론) | product-local |
| [app/(app)/nmpa/page.tsx](../../Q-Atelier/app/(app)/nmpa/page.tsx) | `NmpaPage` (screen, 추론) | product-local |
| [app/(app)/nonconformances/[id]/client.tsx](../../Q-Atelier/app/(app)/nonconformances/%5Bid%5D/client.tsx) | `NCDetailClient` (composition, 추론) | product-local |
| [app/(app)/nonconformances/[id]/dispositions-section.tsx](../../Q-Atelier/app/(app)/nonconformances/%5Bid%5D/dispositions-section.tsx) | `NcDispositionsSection` (layout, 추론) | product-local |
| [app/(app)/nonconformances/[id]/impact-section.tsx](../../Q-Atelier/app/(app)/nonconformances/%5Bid%5D/impact-section.tsx) | `NcImpactSection` (layout, 추론) | product-local |
| [app/(app)/nonconformances/[id]/page.tsx](../../Q-Atelier/app/(app)/nonconformances/%5Bid%5D/page.tsx) | `Page` (screen, 추론) | product-local |
| [app/(app)/nonconformances/new/client.tsx](../../Q-Atelier/app/(app)/nonconformances/new/client.tsx) | `NCNewClient` (composition, 추론) | qd-class-reference |
| [app/(app)/nonconformances/new/page.tsx](../../Q-Atelier/app/(app)/nonconformances/new/page.tsx) | `Page` (screen, 추론) | product-local |
| [app/(app)/nonconformances/page.tsx](../../Q-Atelier/app/(app)/nonconformances/page.tsx) | `NCListPage` (screen, 추론) | product-local |
| [app/(app)/notifications/loading.tsx](../../Q-Atelier/app/(app)/notifications/loading.tsx) | `NotificationsLoading` (feedback, 추론) | product-local |
| [app/(app)/notifications/page.tsx](../../Q-Atelier/app/(app)/notifications/page.tsx) | `NotificationsPage` (screen, 추론) | product-local |
| [app/(app)/pmda/[id]/client.tsx](../../Q-Atelier/app/(app)/pmda/%5Bid%5D/client.tsx) | `PmdaDetailClient` (composition, 추론) | product-local |
| [app/(app)/pmda/[id]/page.tsx](../../Q-Atelier/app/(app)/pmda/%5Bid%5D/page.tsx) | `PmdaDetailPage` (screen, 추론) | product-local |
| [app/(app)/pmda/new/client.tsx](../../Q-Atelier/app/(app)/pmda/new/client.tsx) | `NewPmdaClient` (composition, 추론) | product-local |
| [app/(app)/pmda/new/page.tsx](../../Q-Atelier/app/(app)/pmda/new/page.tsx) | `NewPmdaPage` (screen, 추론) | product-local |
| [app/(app)/pmda/page.tsx](../../Q-Atelier/app/(app)/pmda/page.tsx) | `PmdaPage` (screen, 추론) | product-local |
| [app/(app)/pms/[id]/client.tsx](../../Q-Atelier/app/(app)/pms/%5Bid%5D/client.tsx) | `PmsDetailClient` (composition, 추론) | product-local |
| [app/(app)/pms/[id]/page.tsx](../../Q-Atelier/app/(app)/pms/%5Bid%5D/page.tsx) | `PmsDetailPage` (screen, 추론) | product-local |
| [app/(app)/pms/new/client.tsx](../../Q-Atelier/app/(app)/pms/new/client.tsx) | `NewPmsClient` (composition, 추론) | product-local |
| [app/(app)/pms/new/page.tsx](../../Q-Atelier/app/(app)/pms/new/page.tsx) | `NewPmsPage` (screen, 추론) | product-local |
| [app/(app)/pms/page.tsx](../../Q-Atelier/app/(app)/pms/page.tsx) | `PmsPage` (screen, 추론) | product-local |
| [app/(app)/process-templates/[id]/page.tsx](../../Q-Atelier/app/(app)/process-templates/%5Bid%5D/page.tsx) | `ProcessTemplateDetailPage` (screen, 추론) | product-local |
| [app/(app)/process-templates/form.tsx](../../Q-Atelier/app/(app)/process-templates/form.tsx) | `ProcessTemplateForm` (composition, 추론) | product-local |
| [app/(app)/process-templates/new/page.tsx](../../Q-Atelier/app/(app)/process-templates/new/page.tsx) | `NewProcessTemplatePage` (screen, 추론) | product-local |
| [app/(app)/process-templates/page.tsx](../../Q-Atelier/app/(app)/process-templates/page.tsx) | `ProcessTemplatesPage` (screen, 추론) | product-local |
| [app/(app)/process-validations/[id]/page.tsx](../../Q-Atelier/app/(app)/process-validations/%5Bid%5D/page.tsx) | `ProcessValidationDetailPage` (screen, 추론) | product-local |
| [app/(app)/process-validations/form.tsx](../../Q-Atelier/app/(app)/process-validations/form.tsx) | `ProcessValidationForm` (composition, 추론) | product-local |
| [app/(app)/process-validations/new/page.tsx](../../Q-Atelier/app/(app)/process-validations/new/page.tsx) | `NewProcessValidationPage` (screen, 추론) | product-local |
| [app/(app)/process-validations/page.tsx](../../Q-Atelier/app/(app)/process-validations/page.tsx) | `ProcessValidationsPage` (screen, 추론) | product-local |
| [app/(app)/production-equipment/[id]/page.tsx](../../Q-Atelier/app/(app)/production-equipment/%5Bid%5D/page.tsx) | `ProductionEquipmentDetailPage` (screen, 추론) | product-local |
| [app/(app)/production-equipment/form.tsx](../../Q-Atelier/app/(app)/production-equipment/form.tsx) | `ProductionEquipmentForm` (composition, 추론) | product-local |
| [app/(app)/production-equipment/new/page.tsx](../../Q-Atelier/app/(app)/production-equipment/new/page.tsx) | `NewProductionEquipmentPage` (screen, 추론) | product-local |
| [app/(app)/production-equipment/page.tsx](../../Q-Atelier/app/(app)/production-equipment/page.tsx) | `ProductionEquipmentPage` (screen, 추론) | product-local |
| [app/(app)/products/client.tsx](../../Q-Atelier/app/(app)/products/client.tsx) | `ProductsClient` (composition, 추론) | imports-canonical-module |
| [app/(app)/products/page.tsx](../../Q-Atelier/app/(app)/products/page.tsx) | `ProductsPage` (screen, 추론) | imports-canonical-module |
| [app/(app)/qa/page.tsx](../../Q-Atelier/app/(app)/qa/page.tsx) | `QAPage` (screen, 추론) | product-local |
| [app/(app)/qa/qa-workspace-client.tsx](../../Q-Atelier/app/(app)/qa/qa-workspace-client.tsx) | `QAWorkspaceClient` (composition, 추론), `QmsDocsTab` (navigation, 추론), `ReviewsTab` (navigation, 추론) | product-local |
| [app/(app)/qms-documents/client.tsx](../../Q-Atelier/app/(app)/qms-documents/client.tsx) | `CreateDocModal` (overlay, 추론), `CustomDocCard` (composition, 추론), `DocRowCard` (composition, 추론), `HierarchyMap` (composition, 추론), `MapRow` (data-display, 추론), `QmsDocumentsClient` (composition, 추론) | qd-class-reference |
| [app/(app)/qms-documents/page.tsx](../../Q-Atelier/app/(app)/qms-documents/page.tsx) | `QmsDocumentsPage` (screen, 추론) | qd-class-reference |
| [app/(app)/quality-objectives/[id]/client.tsx](../../Q-Atelier/app/(app)/quality-objectives/%5Bid%5D/client.tsx) | `Meta` (composition, 추론), `QoDetailClient` (composition, 추론) | product-local |
| [app/(app)/quality-objectives/[id]/page.tsx](../../Q-Atelier/app/(app)/quality-objectives/%5Bid%5D/page.tsx) | `Page` (screen, 추론) | product-local |
| [app/(app)/quality-objectives/new/client.tsx](../../Q-Atelier/app/(app)/quality-objectives/new/client.tsx) | `QoNewClient` (composition, 추론) | product-local |
| [app/(app)/quality-objectives/new/page.tsx](../../Q-Atelier/app/(app)/quality-objectives/new/page.tsx) | `Page` (screen, 추론) | product-local |
| [app/(app)/quality-objectives/page.tsx](../../Q-Atelier/app/(app)/quality-objectives/page.tsx) | `QualityObjectivesPage` (screen, 추론) | product-local |
| [app/(app)/ra/page.tsx](../../Q-Atelier/app/(app)/ra/page.tsx) | `RAPage` (screen, 추론) | product-local |
| [app/(app)/ra/ra-workspace-client.tsx](../../Q-Atelier/app/(app)/ra/ra-workspace-client.tsx) | `PostApprovalProductCard` (composition, 추론), `PostApprovalTab` (navigation, 추론), `PreApprovalTab` (navigation, 추론), `RAWorkspaceClient` (composition, 추론) | product-local |
| [app/(app)/recalls/[id]/client.tsx](../../Q-Atelier/app/(app)/recalls/%5Bid%5D/client.tsx) | `RecallDetailClient` (composition, 추론) | product-local |
| [app/(app)/recalls/[id]/page.tsx](../../Q-Atelier/app/(app)/recalls/%5Bid%5D/page.tsx) | `Page` (screen, 추론) | product-local |
| [app/(app)/recalls/new/client.tsx](../../Q-Atelier/app/(app)/recalls/new/client.tsx) | `RecallNewClient` (composition, 추론) | product-local |
| [app/(app)/recalls/new/page.tsx](../../Q-Atelier/app/(app)/recalls/new/page.tsx) | `Page` (screen, 추론) | product-local |
| [app/(app)/recalls/page.tsx](../../Q-Atelier/app/(app)/recalls/page.tsx) | `RecallsPage` (screen, 추론) | product-local |
| [app/(app)/regulatory-calendar/page.tsx](../../Q-Atelier/app/(app)/regulatory-calendar/page.tsx) | `RegulatoryCalendarPage` (screen, 추론) | product-local |
| [app/(app)/reimbursement/client.tsx](../../Q-Atelier/app/(app)/reimbursement/client.tsx) | `ReimbursementSearch` (composition, 추론) | product-local |
| [app/(app)/reimbursement/page.tsx](../../Q-Atelier/app/(app)/reimbursement/page.tsx) | `ReimbursementPage` (screen, 추론) | product-local |
| [app/(app)/research/[code]/changes/page.tsx](../../Q-Atelier/app/(app)/research/%5Bcode%5D/changes/page.tsx) | `ChangesPage` (screen, 추론) | product-local |
| [app/(app)/research/[code]/compliance/page.tsx](../../Q-Atelier/app/(app)/research/%5Bcode%5D/compliance/page.tsx) | `CompliancePage` (screen, 추론) | product-local |
| [app/(app)/research/[code]/design-requirements/page.tsx](../../Q-Atelier/app/(app)/research/%5Bcode%5D/design-requirements/page.tsx) | `DesignRequirementsPage` (screen, 추론) | product-local |
| [app/(app)/research/[code]/layout.tsx](../../Q-Atelier/app/(app)/research/%5Bcode%5D/layout.tsx) | `ResearchLayout` (layout, 추론) | product-local |
| [app/(app)/research/[code]/page.tsx](../../Q-Atelier/app/(app)/research/%5Bcode%5D/page.tsx) | `BackwardsPlanner` (composition, 추론), `GraduateProjectAction` (action, 추론), `Icon` (icon, 추론), `RdDocumentFlowPanel` (composition, 추론), `RegulatoryRoadmap` (composition, 추론), `RequirementsDashboard` (composition, 추론), `ResearchHomePage` (screen, 추론), `StageProgressionAction` (action, 추론), `StageRevertAction` (action, 추론) | product-local |
| [app/(app)/research/[code]/profile/page.tsx](../../Q-Atelier/app/(app)/research/%5Bcode%5D/profile/page.tsx) | `ItemClassificationPreview` (composition, 추론), `MetaField` (field, 추론), `ProductProfileWizard` (composition, 추론), `ProfilePage` (screen, 추론) | product-local |
| [app/(app)/research/[code]/reviews/page.tsx](../../Q-Atelier/app/(app)/research/%5Bcode%5D/reviews/page.tsx) | `ReviewsPage` (screen, 추론) | qd-class-reference |
| [app/(app)/research/[code]/risks/page.tsx](../../Q-Atelier/app/(app)/research/%5Bcode%5D/risks/page.tsx) | `ResearchRisksPage` (screen, 추론), `SectionLabel` (field, 추론) | product-local |
| [app/(app)/research/[code]/settings/page.tsx](../../Q-Atelier/app/(app)/research/%5Bcode%5D/settings/page.tsx) | `ResearchSettingsPage` (screen, 추론) | product-local |
| [app/(app)/research/[code]/timeline/page.tsx](../../Q-Atelier/app/(app)/research/%5Bcode%5D/timeline/page.tsx) | `DeprecatedTimelinePage` (screen, 추론) | product-local |
| [app/(app)/research/[code]/work/page.tsx](../../Q-Atelier/app/(app)/research/%5Bcode%5D/work/page.tsx) | `DeprecatedWorkPage` (screen, 추론) | product-local |
| [app/(app)/research/loading.tsx](../../Q-Atelier/app/(app)/research/loading.tsx) | `ResearchLoading` (feedback, 추론) | product-local |
| [app/(app)/research/new/layout.tsx](../../Q-Atelier/app/(app)/research/new/layout.tsx) | `NewResearchLayout` (layout, 추론) | product-local |
| [app/(app)/research/new/page.tsx](../../Q-Atelier/app/(app)/research/new/page.tsx) | `NewResearchPage` (screen, 추론) | qd-class-reference |
| [app/(app)/research/page.tsx](../../Q-Atelier/app/(app)/research/page.tsx) | `ResearchPage` (screen, 추론) | product-local |
| [app/(app)/research/research-client.tsx](../../Q-Atelier/app/(app)/research/research-client.tsx) | `ResearchClient` (composition, 추론), `ResearchTabBtn` (composition, 추론) | product-local |
| [app/(app)/research/review/page.tsx](../../Q-Atelier/app/(app)/research/review/page.tsx) | `RdReviewPage` (screen, 추론) | product-local |
| [app/(app)/settings/compliance/compliance-manager.tsx](../../Q-Atelier/app/(app)/settings/compliance/compliance-manager.tsx) | `ClauseBar` (composition, 추론), `ClauseItems` (composition, 추론), `ClauseTab` (navigation, 추론), `ComplianceDetail` (composition, 추론), `ComplianceManager` (composition, 추론), `GapReport` (composition, 추론), `ItemBlock` (composition, 추론), `MetricCard` (composition, 추론), `ScoreOverview` (composition, 추론) | qd-class-reference |
| [app/(app)/settings/compliance/page.tsx](../../Q-Atelier/app/(app)/settings/compliance/page.tsx) | `CompliancePage` (screen, 추론) | product-local |
| [app/(app)/settings/exchange/page.tsx](../../Q-Atelier/app/(app)/settings/exchange/page.tsx) | `ExchangePage` (screen, 추론) | product-local |
| [app/(app)/settings/export/ExportPanel.tsx](../../Q-Atelier/app/(app)/settings/export/ExportPanel.tsx) | `ExportPanel` (composition, 추론) | product-local |
| [app/(app)/settings/export/page.tsx](../../Q-Atelier/app/(app)/settings/export/page.tsx) | `OrgExportPage` (screen, 추론) | product-local |
| [app/(app)/settings/members/member-admin-client.tsx](../../Q-Atelier/app/(app)/settings/members/member-admin-client.tsx) | `ArchivedMembers` (composition, 추론), `InviteMemberForm` (composition, 추론), `MemberRowActions` (action, 추론) | product-local |
| [app/(app)/settings/members/owner-member-editor.tsx](../../Q-Atelier/app/(app)/settings/members/owner-member-editor.tsx) | `OwnerMemberEditor` (field, 추론) | qd-class-reference |
| [app/(app)/settings/members/page.tsx](../../Q-Atelier/app/(app)/settings/members/page.tsx) | `SettingsMembersPage` (screen, 추론) | product-local |
| [app/(app)/settings/members/role-assignee-select.tsx](../../Q-Atelier/app/(app)/settings/members/role-assignee-select.tsx) | `RoleAssigneeSelect` (field, 추론) | product-local |
| [app/(app)/settings/members/solo-mode-toggle.tsx](../../Q-Atelier/app/(app)/settings/members/solo-mode-toggle.tsx) | `SoloModeToggle` (choice, 추론) | product-local |
| [app/(app)/settings/page.tsx](../../Q-Atelier/app/(app)/settings/page.tsx) | `EmailNotifyCard` (composition, 추론), `InfoTriggerCard` (composition, 추론), `MyAccountBlock` (composition, 추론), `NoviceModeCard` (composition, 추론), `RdNotifyEmailsField` (field, 추론), `SettingsPage` (screen, 추론) | qd-class-reference |
| [app/(app)/settings/passkeys/page.tsx](../../Q-Atelier/app/(app)/settings/passkeys/page.tsx) | `PasskeysPage` (screen, 추론) | product-local |
| [app/(app)/settings/templates/page.tsx](../../Q-Atelier/app/(app)/settings/templates/page.tsx) | `TemplatesSettingsPage` (screen, 추론) | product-local |
| [app/(app)/settings/templates/template-manager.tsx](../../Q-Atelier/app/(app)/settings/templates/template-manager.tsx) | `CatalogItemBlock` (composition, 추론), `downloadFile` (composition, 추론), `EditPanel` (composition, 추론), `MetaField` (field, 추론), `NewTemplateForm` (composition, 추론), `TemplateManager` (composition, 추론), `TemplateRow` (data-display, 추론) | product-local |
| [app/(app)/settings/usage/PlanMarketCheckout.tsx](../../Q-Atelier/app/(app)/settings/usage/PlanMarketCheckout.tsx) | `CardLabel` (field, 추론), `PlanMarketCheckout` (composition, 추론), `Row` (data-display, 추론) | product-local |
| [app/(app)/settings/usage/page.tsx](../../Q-Atelier/app/(app)/settings/usage/page.tsx) | `CoreCard` (composition, 추론), `FaqRow` (data-display, 추론), `HistoryChart` (chart, 추론), `MetricCard` (composition, 추론), `MetricRow` (data-display, 추론), `UsagePage` (screen, 추론), `UsageStat` (data-display, 추론) | product-local |
| [app/(app)/standards/[id]/client.tsx](../../Q-Atelier/app/(app)/standards/%5Bid%5D/client.tsx) | `StandardDetailClient` (composition, 추론) | product-local |
| [app/(app)/standards/[id]/page.tsx](../../Q-Atelier/app/(app)/standards/%5Bid%5D/page.tsx) | `StandardDetailPage` (screen, 추론) | product-local |
| [app/(app)/standards/new/client.tsx](../../Q-Atelier/app/(app)/standards/new/client.tsx) | `NewStandardClient` (composition, 추론) | qd-class-reference |
| [app/(app)/standards/new/page.tsx](../../Q-Atelier/app/(app)/standards/new/page.tsx) | `NewStandardPage` (screen, 추론) | product-local |
| [app/(app)/standards/page.tsx](../../Q-Atelier/app/(app)/standards/page.tsx) | `StandardsPage` (screen, 추론) | product-local |
| [app/(app)/sterilization/[id]/client.tsx](../../Q-Atelier/app/(app)/sterilization/%5Bid%5D/client.tsx) | `SterDetailClient` (composition, 추론) | product-local |
| [app/(app)/sterilization/[id]/page.tsx](../../Q-Atelier/app/(app)/sterilization/%5Bid%5D/page.tsx) | `SterDetailPage` (screen, 추론) | product-local |
| [app/(app)/sterilization/new/client.tsx](../../Q-Atelier/app/(app)/sterilization/new/client.tsx) | `NewSterClient` (composition, 추론) | qd-class-reference |
| [app/(app)/sterilization/new/page.tsx](../../Q-Atelier/app/(app)/sterilization/new/page.tsx) | `NewSterPage` (screen, 추론) | product-local |
| [app/(app)/sterilization/page.tsx](../../Q-Atelier/app/(app)/sterilization/page.tsx) | `SterilizationPage` (screen, 추론) | product-local |
| [app/(app)/suppliers/[id]/client.tsx](../../Q-Atelier/app/(app)/suppliers/%5Bid%5D/client.tsx) | `Chip` (composition, 추론), `SupplierDetailClient` (composition, 추론) | product-local |
| [app/(app)/suppliers/[id]/page.tsx](../../Q-Atelier/app/(app)/suppliers/%5Bid%5D/page.tsx) | `SupplierDetailPage` (screen, 추론) | product-local |
| [app/(app)/suppliers/client.tsx](../../Q-Atelier/app/(app)/suppliers/client.tsx) | `SuppliersClient` (composition, 추론) | product-local |
| [app/(app)/suppliers/new/page.tsx](../../Q-Atelier/app/(app)/suppliers/new/page.tsx) | `SuppliersNewRedirect` (composition, 추론) | product-local |
| [app/(app)/suppliers/page.tsx](../../Q-Atelier/app/(app)/suppliers/page.tsx) | `Page` (screen, 추론) | product-local |
| [app/(app)/training/courses/[id]/log/client.tsx](../../Q-Atelier/app/(app)/training/courses/%5Bid%5D/log/client.tsx) | `CourseLogClient` (composition, 추론) | qd-class-reference |
| [app/(app)/training/courses/[id]/log/page.tsx](../../Q-Atelier/app/(app)/training/courses/%5Bid%5D/log/page.tsx) | `CourseLogPage` (screen, 추론) | product-local |
| [app/(app)/training/courses/new/client.tsx](../../Q-Atelier/app/(app)/training/courses/new/client.tsx) | `CourseNewClient` (composition, 추론) | product-local |
| [app/(app)/training/courses/new/page.tsx](../../Q-Atelier/app/(app)/training/courses/new/page.tsx) | `CourseNewPage` (screen, 추론) | product-local |
| [app/(app)/training/page.tsx](../../Q-Atelier/app/(app)/training/page.tsx) | `KpiItem` (composition, 추론), `TrainingPage` (screen, 추론) | product-local |
| [app/(app)/training/records/[id]/page.tsx](../../Q-Atelier/app/(app)/training/records/%5Bid%5D/page.tsx) | `TrainingRecordPage` (screen, 추론) | product-local |
| [app/(app)/udi/[id]/client.tsx](../../Q-Atelier/app/(app)/udi/%5Bid%5D/client.tsx) | `UdiDetailClient` (composition, 추론) | product-local |
| [app/(app)/udi/[id]/page.tsx](../../Q-Atelier/app/(app)/udi/%5Bid%5D/page.tsx) | `UdiDetailPage` (screen, 추론) | product-local |
| [app/(app)/udi/new/client.tsx](../../Q-Atelier/app/(app)/udi/new/client.tsx) | `CarrierLabel` (field, 추론), `CarrierLine` (composition, 추론), `NewUdiClient` (composition, 추론) | qd-class-reference |
| [app/(app)/udi/new/page.tsx](../../Q-Atelier/app/(app)/udi/new/page.tsx) | `NewUdiPage` (screen, 추론) | product-local |
| [app/(app)/udi/page.tsx](../../Q-Atelier/app/(app)/udi/page.tsx) | `UdiPage` (screen, 추론) | product-local |
| [app/(app)/vigilance/[id]/client.tsx](../../Q-Atelier/app/(app)/vigilance/%5Bid%5D/client.tsx) | `VigilanceDetailClient` (composition, 추론) | product-local |
| [app/(app)/vigilance/[id]/page.tsx](../../Q-Atelier/app/(app)/vigilance/%5Bid%5D/page.tsx) | `VigilanceDetailPage` (screen, 추론) | product-local |
| [app/(app)/vigilance/new/client.tsx](../../Q-Atelier/app/(app)/vigilance/new/client.tsx) | `NewVigilanceClient` (composition, 추론), `SideCard` (composition, 추론) | product-local |
| [app/(app)/vigilance/new/page.tsx](../../Q-Atelier/app/(app)/vigilance/new/page.tsx) | `NewVigilancePage` (screen, 추론) | product-local |
| [app/(app)/vigilance/page.tsx](../../Q-Atelier/app/(app)/vigilance/page.tsx) | `VigilancePage` (screen, 추론) | product-local |
| [app/(auth)/forgot-password/page.tsx](../../Q-Atelier/app/(auth)/forgot-password/page.tsx) | `ForgotPasswordPage` (screen, 추론) | product-local |
| [app/(auth)/login/page.tsx](../../Q-Atelier/app/(auth)/login/page.tsx) | `BannerBox` (composition, 추론), `FieldHint` (composition, 추론), `KstClock` (composition, 추론), `LoginForm` (composition, 추론), `LoginPage` (screen, 추론), `OrgPreviewBanner` (feedback, 추론), `PasswordStrengthBar` (composition, 추론), `SocialLinks` (composition, 추론), `TabBtn` (composition, 추론) | imports-canonical-module |
| [app/(public)/(drafts)/business-info/page.tsx](../../Q-Atelier/app/(public)/(drafts)/business-info/page.tsx) | `BusinessInfoPage` (screen, 추론) | product-local |
| [app/(public)/(drafts)/layout.tsx](../../Q-Atelier/app/(public)/(drafts)/layout.tsx) | `LegalDraftsLayout` (layout, 추론) | product-local |
| [app/(public)/(drafts)/privacy/page.tsx](../../Q-Atelier/app/(public)/(drafts)/privacy/page.tsx) | `PrivacyPage` (screen, 추론) | product-local |
| [app/(public)/(drafts)/terms/page.tsx](../../Q-Atelier/app/(public)/(drafts)/terms/page.tsx) | `TermsPage` (screen, 추론) | product-local |
| [app/(public)/layout.tsx](../../Q-Atelier/app/(public)/layout.tsx) | `PublicLegalLayout` (layout, 추론) | product-local |
| [app/(public)/open-source/page.tsx](../../Q-Atelier/app/(public)/open-source/page.tsx) | `OpenSourcePage` (screen, 추론) | product-local |
| [app/auth/reset/page.tsx](../../Q-Atelier/app/auth/reset/page.tsx) | `ResetForm` (composition, 추론), `ResetPage` (screen, 추론) | product-local |
| [app/experts/expert-theme.css](../../Q-Atelier/app/experts/expert-theme.css) | 스타일 기반 규칙 | product-local |
| [app/experts/farewell/page.tsx](../../Q-Atelier/app/experts/farewell/page.tsx) | `ExpertFarewellPage` (screen, 추론) | product-local |
| [app/experts/inbox/[id]/page.tsx](../../Q-Atelier/app/experts/inbox/%5Bid%5D/page.tsx) | `ExpertInboxDetailPage` (screen, 추론), `Row` (data-display, 추론) | product-local |
| [app/experts/inbox/bottom-nav.tsx](../../Q-Atelier/app/experts/inbox/bottom-nav.tsx) | `ExpertBottomNav` (navigation, 추론) | product-local |
| [app/experts/inbox/layout.tsx](../../Q-Atelier/app/experts/inbox/layout.tsx) | `ExpertInboxLayout` (layout, 추론) | product-local |
| [app/experts/inbox/page.tsx](../../Q-Atelier/app/experts/inbox/page.tsx) | `AssignmentCard` (composition, 추론), `ExpertInboxPage` (screen, 추론) | product-local |
| [app/experts/inbox/user-menu.tsx](../../Q-Atelier/app/experts/inbox/user-menu.tsx) | `ExpertUserMenu` (navigation, 추론) | product-local |
| [app/experts/layout.tsx](../../Q-Atelier/app/experts/layout.tsx) | `ExpertRootLayout` (layout, 추론) | product-local |
| [app/experts/portal/_access-shell.tsx](../../Q-Atelier/app/experts/portal/_access-shell.tsx) | `AccessShell` (layout, 추론) | product-local |
| [app/experts/portal/_wordmark.tsx](../../Q-Atelier/app/experts/portal/_wordmark.tsx) | `Wordmark` (identity, 추론) | product-local |
| [app/experts/portal/forgot/page.tsx](../../Q-Atelier/app/experts/portal/forgot/page.tsx) | `ExpertForgotPage` (screen, 추론) | product-local |
| [app/experts/portal/layout.tsx](../../Q-Atelier/app/experts/portal/layout.tsx) | `PortalLayout` (layout, 추론) | product-local |
| [app/experts/portal/login/page.tsx](../../Q-Atelier/app/experts/portal/login/page.tsx) | `ExpertLoginInner` (composition, 추론), `ExpertLoginPage` (screen, 추론) | product-local |
| [app/experts/portal/page.tsx](../../Q-Atelier/app/experts/portal/page.tsx) | `ExpertPortalLanding` (composition, 추론), `InvalidInvite` (composition, 추론), `PrivateAccess` (composition, 추론), `WelcomeScreen` (screen, 추론) | product-local |
| [app/experts/portal/pending/page.tsx](../../Q-Atelier/app/experts/portal/pending/page.tsx) | `ExpertPendingPage` (screen, 추론) | product-local |
| [app/experts/portal/reset/page.tsx](../../Q-Atelier/app/experts/portal/reset/page.tsx) | `ExpertResetPage` (screen, 추론) | product-local |
| [app/experts/portal/signup/page.tsx](../../Q-Atelier/app/experts/portal/signup/page.tsx) | `ExpertSignupInner` (composition, 추론), `ExpertSignupPage` (screen, 추론) | product-local |
| [app/experts/settings/danger-zone.tsx](../../Q-Atelier/app/experts/settings/danger-zone.tsx) | `ExpertDangerZone` (composition, 추론) | product-local |
| [app/experts/settings/layout.tsx](../../Q-Atelier/app/experts/settings/layout.tsx) | `ExpertSettingsLayout` (layout, 추론) | product-local |
| [app/experts/settings/page.tsx](../../Q-Atelier/app/experts/settings/page.tsx) | `ExpertSettingsPage` (screen, 추론) | product-local |
| [app/experts/settings/profile-form.tsx](../../Q-Atelier/app/experts/settings/profile-form.tsx) | `Field` (field, 추론), `ProfileForm` (composition, 추론), `Spacer` (composition, 추론) | product-local |
| [app/fonts.css](../../Q-Atelier/app/fonts.css) | 스타일 기반 규칙 | product-local |
| [app/global-error.tsx](../../Q-Atelier/app/global-error.tsx) | `GlobalError` (feedback, 추론) | imports-canonical-module |
| [app/globals.css](../../Q-Atelier/app/globals.css) | 스타일 기반 규칙 | imports-canonical-module |
| [app/layout.tsx](../../Q-Atelier/app/layout.tsx) | `RootLayout` (layout, 추론) | imports-canonical-module |
| [app/not-found.tsx](../../Q-Atelier/app/not-found.tsx) | `NotFound` (composition, 추론) | product-local |
| [app/onboarding/page.tsx](../../Q-Atelier/app/onboarding/page.tsx) | `IntroScreen` (screen, 추론), `OnboardingPage` (screen, 추론) | product-local |
| [app/onboarding/qms-setup/client.tsx](../../Q-Atelier/app/onboarding/qms-setup/client.tsx) | `QmsSetupClient` (composition, 추론) | product-local |
| [app/onboarding/qms-setup/page.tsx](../../Q-Atelier/app/onboarding/qms-setup/page.tsx) | `QmsSetupPage` (screen, 추론) | product-local |
| [app/page.tsx](../../Q-Atelier/app/page.tsx) | `Home` (screen, 추론) | product-local |
| [app/pending-approval/page.tsx](../../Q-Atelier/app/pending-approval/page.tsx) | `PendingApprovalPage` (screen, 추론) | product-local |
| [app/q-design.components.css](../../Q-Atelier/app/q-design.components.css) | 스타일 기반 규칙 | canonical-copy |
| [app/q-design.foundation.css](../../Q-Atelier/app/q-design.foundation.css) | 스타일 기반 규칙 | canonical-copy |
| [app/q-design.palette.css](../../Q-Atelier/app/q-design.palette.css) | 스타일 기반 규칙 | canonical-copy |
| [app/q-design.workspace.css](../../Q-Atelier/app/q-design.workspace.css) | 스타일 기반 규칙 | canonical-copy |
| [components/AIQuickAccessFab.tsx](../../Q-Atelier/components/AIQuickAccessFab.tsx) | `AiHelperButton` (action, 추론), `AIQuickAccessFab` (composition, 추론), `IfuClassifyDrawer` (overlay, 추론), `QuickApproveDrawer` (overlay, 추론) | product-local |
| [components/AdminHubTabs.tsx](../../Q-Atelier/components/AdminHubTabs.tsx) | `AdminHubTabs` (navigation, 추론) | product-local |
| [components/AdminLayoutShell.tsx](../../Q-Atelier/components/AdminLayoutShell.tsx) | `AdminLayoutShell` (layout, 추론) | product-local |
| [components/AdminPhoneLanding.tsx](../../Q-Atelier/components/AdminPhoneLanding.tsx) | `AdminPhoneLanding` (composition, 추론) | product-local |
| [components/AiDraftAssist.tsx](../../Q-Atelier/components/AiDraftAssist.tsx) | `AiDraftAssist` (composition, 추론) | product-local |
| [components/AiHelperButton.tsx](../../Q-Atelier/components/AiHelperButton.tsx) | `AiHelperButton` (action, 추론), `AskPanel` (composition, 추론), `TabBtn` (composition, 추론) | qd-class-reference |
| [components/AppPushSync.tsx](../../Q-Atelier/components/AppPushSync.tsx) | `AppPushSync` (composition, 추론) | product-local |
| [components/AppWindowTitle.tsx](../../Q-Atelier/components/AppWindowTitle.tsx) | `AppWindowTitle` (provider, 추론) | canonical-copy |
| [components/ApprovalChainEditor.tsx](../../Q-Atelier/components/ApprovalChainEditor.tsx) | `ApprovalChainEditor` (field, 추론), `chip` (composition, 추론), `chips` (composition, 추론), `deptTabs` (navigation, 추론), `plainChip` (composition, 추론) | product-local |
| [components/ApprovalDocFile.tsx](../../Q-Atelier/components/ApprovalDocFile.tsx) | `ApprovalDocFile` (composition, 추론) | product-local |
| [components/ApprovalRoute.tsx](../../Q-Atelier/components/ApprovalRoute.tsx) | `ApprovalRoute` (stages), `RouteNode` (stages) | product-local |
| [components/ApprovedAdvisoryList.tsx](../../Q-Atelier/components/ApprovedAdvisoryList.tsx) | `ApprovedAdvisoryList` (data-display, 추론) | product-local |
| [components/AssessmentDocApprovalPanel.tsx](../../Q-Atelier/components/AssessmentDocApprovalPanel.tsx) | `AssessmentDocApprovalPanel` (composition, 추론) | qd-class-reference |
| [components/AssessmentPreviewPanel.tsx](../../Q-Atelier/components/AssessmentPreviewPanel.tsx) | `AssessmentPreviewPanel` (composition, 추론), `KpiCell` (composition, 추론), `PreviewSummary` (data-display, 추론), `SummaryItem` (composition, 추론) | product-local |
| [components/AssigneeDialog.tsx](../../Q-Atelier/components/AssigneeDialog.tsx) | `AssigneeDialog` (overlay, 추론) | product-local |
| [components/AttachmentManager.tsx](../../Q-Atelier/components/AttachmentManager.tsx) | `AttachmentManager` (composition, 추론), `AttachmentRow` (data-display, 추론), `handleSecureDownload` (composition, 추론) | qd-class-reference |
| [components/AuditReadinessWidget.tsx](../../Q-Atelier/components/AuditReadinessWidget.tsx) | `AuditReadinessWidget` (composition, 추론) | product-local |
| [components/AuthThemeToggle.tsx](../../Q-Atelier/components/AuthThemeToggle.tsx) | `AuthThemeToggle` (choice, 추론) | product-local |
| [components/Avatar.tsx](../../Q-Atelier/components/Avatar.tsx) | `Avatar` (avatar) | product-local |
| [components/AvatarUploader.tsx](../../Q-Atelier/components/AvatarUploader.tsx) | `AvatarUploader` (composition, 추론), `toSquareJpeg` (composition, 추론) | product-local |
| [components/BackButton.tsx](../../Q-Atelier/components/BackButton.tsx) | `BackButton` (text-action) | qd-class-reference |
| [components/BackwardsPlanner.tsx](../../Q-Atelier/components/BackwardsPlanner.tsx) | `BackwardsPlanner` (composition, 추론), `SuggestionLabel` (field, 추론) | product-local |
| [components/BarcodeScanButton.tsx](../../Q-Atelier/components/BarcodeScanButton.tsx) | `BarcodeScanButton` (action, 추론) | product-local |
| [components/CalibrationExportButton.tsx](../../Q-Atelier/components/CalibrationExportButton.tsx) | `CalibrationExportButton` (action, 추론), `exportCsv` (composition, 추론) | product-local |
| [components/CalibrationSuggestButton.tsx](../../Q-Atelier/components/CalibrationSuggestButton.tsx) | `CalibrationSuggestButton` (action, 추론) | product-local |
| [components/CancelAssessmentButton.tsx](../../Q-Atelier/components/CancelAssessmentButton.tsx) | `CancelAssessmentButton` (action, 추론) | qd-class-reference |
| [components/ChangeImpactDecisionTree.tsx](../../Q-Atelier/components/ChangeImpactDecisionTree.tsx) | `ChangeImpactDecisionTree` (composition, 추론), `ConclusionView` (composition, 추론), `QuestionView` (composition, 추론) | product-local |
| [components/ChangeLicenseButton.tsx](../../Q-Atelier/components/ChangeLicenseButton.tsx) | `ChangeLicenseButton` (action, 추론) | product-local |
| [components/ChangeReasonPanel.tsx](../../Q-Atelier/components/ChangeReasonPanel.tsx) | `ChangeReasonPanel` (composition, 추론) | product-local |
| [components/ChangeRequestInbox.tsx](../../Q-Atelier/components/ChangeRequestInbox.tsx) | `ChangeRequestInbox` (composition, 추론) | qd-class-reference |
| [components/Coachmark.tsx](../../Q-Atelier/components/Coachmark.tsx) | `Coachmark` (tooltip-info) | qd-class-reference |
| [components/Confirm.tsx](../../Q-Atelier/components/Confirm.tsx) | `ConfirmProvider` (modal), `Dialog` (overlay, 추론) | qd-class-reference |
| [components/DangerZone.tsx](../../Q-Atelier/components/DangerZone.tsx) | `DangerZone` (form-section) | product-local |
| [components/DeleteAssessmentButton.tsx](../../Q-Atelier/components/DeleteAssessmentButton.tsx) | `DeleteAssessmentButton` (action, 추론) | product-local |
| [components/DeleteResearchProjectButton.tsx](../../Q-Atelier/components/DeleteResearchProjectButton.tsx) | `DeleteResearchProjectButton` (action, 추론) | product-local |
| [components/DepartmentBadge.tsx](../../Q-Atelier/components/DepartmentBadge.tsx) | `DepartmentBadge` (data-display, 추론) | product-local |
| [components/DesignChangeRequestButton.tsx](../../Q-Atelier/components/DesignChangeRequestButton.tsx) | `DesignChangeRequestButton` (action, 추론) | qd-class-reference |
| [components/DesignReviewPanel.tsx](../../Q-Atelier/components/DesignReviewPanel.tsx) | `DesignReviewPanel` (composition, 추론), `FldRow` (field, 추론), `MeetingCard` (composition, 추론), `MeetingForm` (composition, 추론), `MetaField` (field, 추론) | product-local |
| [components/DocChecklistPanel.tsx](../../Q-Atelier/components/DocChecklistPanel.tsx) | `DocChecklistPanel` (composition, 추론), `UploadDocxBtn` (composition, 추론) | product-local |
| [components/DocCommentThread.tsx](../../Q-Atelier/components/DocCommentThread.tsx) | `DocCommentThread` (composition, 추론) | qd-class-reference |
| [components/DocContentViewer.tsx](../../Q-Atelier/components/DocContentViewer.tsx) | `DocContentViewer` (composition, 추론) | product-local |
| [components/DocOwnerTag.tsx](../../Q-Atelier/components/DocOwnerTag.tsx) | `DeptName` (composition, 추론), `DocOwnerTag` (data-display, 추론), `MicroLabel` (field, 추론) | product-local |
| [components/DocumentApprovalPanel.tsx](../../Q-Atelier/components/DocumentApprovalPanel.tsx) | `DocumentApprovalPanel` (composition, 추론) | product-local |
| [components/DocumentArtifactPanel.tsx](../../Q-Atelier/components/DocumentArtifactPanel.tsx) | `ArtifactApproveBtn` (composition, 추론), `ArtifactDocCard` (composition, 추론), `DirectStatusBtn` (composition, 추론), `DocumentArtifactPanel` (composition, 추론), `RevertBtn` (composition, 추론), `StatusBtn` (composition, 추론), `UploadDocxBtn` (composition, 추론) | qd-class-reference |
| [components/DocumentDownloadButtons.tsx](../../Q-Atelier/components/DocumentDownloadButtons.tsx) | `DownloadBlankBtn` (composition, 추론), `DownloadFileBtn` (composition, 추론), `saveBlob` (composition, 추론) | product-local |
| [components/EntranceRibbon.tsx](../../Q-Atelier/components/EntranceRibbon.tsx) | 모듈 단위 검토 | imports-canonical-module |
| [components/ExecutionCompletePanel.tsx](../../Q-Atelier/components/ExecutionCompletePanel.tsx) | `ExecutionCompletePanel` (composition, 추론) | product-local |
| [components/ExpertNotificationsPanel.tsx](../../Q-Atelier/components/ExpertNotificationsPanel.tsx) | `ExpertNotificationsPanel` (composition, 추론) | product-local |
| [components/ExpertOpinionSummary.tsx](../../Q-Atelier/components/ExpertOpinionSummary.tsx) | `AreaComments` (composition, 추론), `Body` (composition, 추론), `ExpertOpinionSummary` (data-display, 추론), `RecList` (data-display, 추론), `Recommendations` (composition, 추론), `RegOverride` (composition, 추론), `RiskOverride` (composition, 추론), `SubLabel` (field, 추론) | product-local |
| [components/ExpertScorePanel.tsx](../../Q-Atelier/components/ExpertScorePanel.tsx) | `ExpertScorePanel` (composition, 추론), `ScoreBar` (composition, 추론), `StarInput` (field, 추론) | qd-class-reference |
| [components/FieldModeBanner.tsx](../../Q-Atelier/components/FieldModeBanner.tsx) | `FieldModeBanner` (feedback, 추론) | product-local |
| [components/FieldPhotoGallery.tsx](../../Q-Atelier/components/FieldPhotoGallery.tsx) | `FieldPhotoGallery` (composition, 추론) | product-local |
| [components/FieldPhotoPicker.tsx](../../Q-Atelier/components/FieldPhotoPicker.tsx) | `FieldPhotoPicker` (field, 추론) | product-local |
| [components/FilePickButton.tsx](../../Q-Atelier/components/FilePickButton.tsx) | `FilePickButton` (file-input) | product-local |
| [components/FinalDecisionPanel.tsx](../../Q-Atelier/components/FinalDecisionPanel.tsx) | `DecisionButton` (action, 추론), `FinalDecisionPanel` (composition, 추론) | qd-class-reference |
| [components/FinalJudgmentPanel.tsx](../../Q-Atelier/components/FinalJudgmentPanel.tsx) | `FinalJudgmentPanel` (composition, 추론), `JudgmentSection` (layout, 추론), `WeightsBar` (composition, 추론) | product-local |
| [components/FormNote.tsx](../../Q-Atelier/components/FormNote.tsx) | `FormNote` (composition, 추론) | product-local |
| [components/GlobalSearch.tsx](../../Q-Atelier/components/GlobalSearch.tsx) | `GlobalSearch` (modal) | qd-class-reference |
| [components/GlossaryPanel.tsx](../../Q-Atelier/components/GlossaryPanel.tsx) | `GlossaryPanel` (composition, 추론), `GlossaryRow` (data-display, 추론) | product-local |
| [components/GlossaryTooltip.tsx](../../Q-Atelier/components/GlossaryTooltip.tsx) | `Term` (composition, 추론), `TooltipPanel` (composition, 추론) | product-local |
| [components/GraduateProjectAction.tsx](../../Q-Atelier/components/GraduateProjectAction.tsx) | `GraduateProjectAction` (action, 추론) | product-local |
| [components/GraduatedProductRaNudge.tsx](../../Q-Atelier/components/GraduatedProductRaNudge.tsx) | `GraduatedProductRaNudge` (composition, 추론) | product-local |
| [components/HubModuleGrid.tsx](../../Q-Atelier/components/HubModuleGrid.tsx) | `HubModuleGrid` (layout, 추론) | product-local |
| [components/IfuClassifyDrawer.tsx](../../Q-Atelier/components/IfuClassifyDrawer.tsx) | `IfuClassifyDrawer` (overlay, 추론), `Label` (field, 추론) | qd-class-reference |
| [components/InquiryButton.tsx](../../Q-Atelier/components/InquiryButton.tsx) | `InquiryButton` (action, 추론) | qd-class-reference |
| [components/InstallAppPrompt.tsx](../../Q-Atelier/components/InstallAppPrompt.tsx) | `InstallAppPrompt` (composition, 추론) | product-local |
| [components/InternalReviewQueue.tsx](../../Q-Atelier/components/InternalReviewQueue.tsx) | `InternalReviewQueue` (composition, 추론), `QueueCard` (composition, 추론) | product-local |
| [components/ItemClassificationPreview.tsx](../../Q-Atelier/components/ItemClassificationPreview.tsx) | `AlternativeRow` (data-display, 추론), `ConfidenceBadge` (data-display, 추론), `ExtendedCandidates` (composition, 추론), `GradeMetaRow` (data-display, 추론), `InputHintPanel` (composition, 추론), `ItemClassificationPreview` (composition, 추론), `ManualEntryForm` (composition, 추론), `ResultBody` (composition, 추론), `Spinner` (composition, 추론), `VerdictPanel` (composition, 추론) | product-local |
| [components/KeywordReviewModal.tsx](../../Q-Atelier/components/KeywordReviewModal.tsx) | `KeywordReviewModal` (overlay, 추론) | product-local |
| [components/LastModifiedBadge.tsx](../../Q-Atelier/components/LastModifiedBadge.tsx) | `LastModifiedBadge` (data-display, 추론) | product-local |
| [components/LastModifiedBatchProvider.tsx](../../Q-Atelier/components/LastModifiedBatchProvider.tsx) | `LastModifiedBatchProvider` (provider, 추론) | product-local |
| [components/ListBackLink.tsx](../../Q-Atelier/components/ListBackLink.tsx) | `ListBackLink` (composition, 추론) | product-local |
| [components/ListPager.tsx](../../Q-Atelier/components/ListPager.tsx) | `ListPager` (pagination) | product-local |
| [components/ListToolbar.tsx](../../Q-Atelier/components/ListToolbar.tsx) | `ListToolbar` (list-toolbar) | product-local |
| [components/Logo.tsx](../../Q-Atelier/components/Logo.tsx) | `Logo` (identity, 추론), `LogoMark` (composition, 추론) | product-local |
| [components/LogoutButton.tsx](../../Q-Atelier/components/LogoutButton.tsx) | `LogoutButton` (action, 추론) | product-local |
| [components/MarketAccessWidget.tsx](../../Q-Atelier/components/MarketAccessWidget.tsx) | `MarketAccessWidget` (composition, 추론) | product-local |
| [components/MarketLockedNotice.tsx](../../Q-Atelier/components/MarketLockedNotice.tsx) | `MarketLockedNotice` (feedback, 추론) | product-local |
| [components/MatchedRulesList.tsx](../../Q-Atelier/components/MatchedRulesList.tsx) | `DetailRow` (data-display, 추론), `MatchedRulesList` (data-display, 추론), `MetaPill` (composition, 추론), `TriggerList` (data-display, 추론) | product-local |
| [components/MaterialRequestNotice.tsx](../../Q-Atelier/components/MaterialRequestNotice.tsx) | `MaterialRequestNotice` (feedback, 추론) | product-local |
| [components/MedqraftTemplateListClient.tsx](../../Q-Atelier/components/MedqraftTemplateListClient.tsx) | `download` (composition, 추론), `MedqraftTemplateListClient` (composition, 추론) | product-local |
| [components/MedqraftTemplateSummary.tsx](../../Q-Atelier/components/MedqraftTemplateSummary.tsx) | `MedqraftTemplateSummary` (data-display, 추론) | product-local |
| [components/MemberPicker.tsx](../../Q-Atelier/components/MemberPicker.tsx) | `MemberPicker` (check-toggle) | qd-class-reference |
| [components/MetricRows.tsx](../../Q-Atelier/components/MetricRows.tsx) | `MetricRows` (composition, 추론) | product-local |
| [components/MobileBottomNav.tsx](../../Q-Atelier/components/MobileBottomNav.tsx) | `MobileBottomNav` (navigation, 추론) | product-local |
| [components/ModuleActivateButton.tsx](../../Q-Atelier/components/ModuleActivateButton.tsx) | `ModuleActivateButton` (action, 추론) | product-local |
| [components/ModuleLockedNotice.tsx](../../Q-Atelier/components/ModuleLockedNotice.tsx) | `ModuleLockedNotice` (feedback, 추론) | product-local |
| [components/MyActionItems.tsx](../../Q-Atelier/components/MyActionItems.tsx) | `MyActionItems` (composition, 추론) | product-local |
| [components/MyActionsViews.tsx](../../Q-Atelier/components/MyActionsViews.tsx) | `ItemList` (data-display, 추론), `MyActionsViews` (composition, 추론) | product-local |
| [components/NotificationBell.tsx](../../Q-Atelier/components/NotificationBell.tsx) | `NotificationBell` (composition, 추론) | imports-canonical-module |
| [components/NotificationQuickReply.tsx](../../Q-Atelier/components/NotificationQuickReply.tsx) | `NotificationQuickReply` (composition, 추론) | qd-class-reference |
| [components/OpinionForm.tsx](../../Q-Atelier/components/OpinionForm.tsx) | `ChoiceRow` (data-display, 추론), `CompletedView` (composition, 추론), `ItemList` (data-display, 추론), `NumberedSection` (layout, 추론), `OpinionForm` (composition, 추론), `Pill` (composition, 추론), `ReadSection` (layout, 추론), `RecommendedList` (data-display, 추론), `SubLabel` (field, 추론) | qd-class-reference |
| [components/OwnerProductWorkflow.tsx](../../Q-Atelier/components/OwnerProductWorkflow.tsx) | `ActionRequiredSection` (layout, 추론), `CompactAssessmentLine` (composition, 추론), `HeroPipeline` (composition, 추론), `OwnerProductWorkflow` (composition, 추론), `ProductCard` (composition, 추론) | product-local |
| [components/OwnerResearchPipeline.tsx](../../Q-Atelier/components/OwnerResearchPipeline.tsx) | `OwnerResearchPipeline` (composition, 추론) | product-local |
| [components/OwnerResearchPipelineClient.tsx](../../Q-Atelier/components/OwnerResearchPipelineClient.tsx) | `FlowCard` (composition, 추론), `OwnerResearchPipelineClient` (composition, 추론), `StagePill` (composition, 추론), `StagePopup` (composition, 추론) | product-local |
| [components/PageGuide.tsx](../../Q-Atelier/components/PageGuide.tsx) | `GuideBody` (composition, 추론), `GuideSection` (layout, 추론), `PageGuide` (composition, 추론) | product-local |
| [components/PageTabs.tsx](../../Q-Atelier/components/PageTabs.tsx) | `PageTabs` (tabs) | qd-class-reference |
| [components/PageTransition.tsx](../../Q-Atelier/components/PageTransition.tsx) | `PageTransition` (composition, 추론) | product-local |
| [components/PageWidgetBoard.tsx](../../Q-Atelier/components/PageWidgetBoard.tsx) | `PageWidgetBoard` (composition, 추론) | product-local |
| [components/ParentLotsEditor.tsx](../../Q-Atelier/components/ParentLotsEditor.tsx) | `ParentLotsEditor` (field, 추론) | qd-class-reference |
| [components/PasskeyCard.tsx](../../Q-Atelier/components/PasskeyCard.tsx) | `note` (composition, 추론), `PasskeyCard` (composition, 추론) | product-local |
| [components/PasskeyDrawerLink.tsx](../../Q-Atelier/components/PasskeyDrawerLink.tsx) | `PasskeyDrawerLink` (composition, 추론) | product-local |
| [components/PasskeyOffer.tsx](../../Q-Atelier/components/PasskeyOffer.tsx) | `PasskeyOffer` (composition, 추론) | product-local |
| [components/PendingResearchDocs.tsx](../../Q-Atelier/components/PendingResearchDocs.tsx) | `PendingResearchDocs` (composition, 추론) | product-local |
| [components/PersonPickField.tsx](../../Q-Atelier/components/PersonPickField.tsx) | `PersonPickField` (field, 추론) | product-local |
| [components/PhoneModeGate.tsx](../../Q-Atelier/components/PhoneModeGate.tsx) | `PhoneModeGate` (provider, 추론), `PhoneOnlyNotice` (feedback, 추론) | product-local |
| [components/ProductPickField.tsx](../../Q-Atelier/components/ProductPickField.tsx) | `ProductLinkField` (field, 추론), `ProductPickField` (field, 추론) | product-local |
| [components/ProductProfileWizard.tsx](../../Q-Atelier/components/ProductProfileWizard.tsx) | `ClinicalDecisionHelper` (composition, 추론), `HelperBlock` (composition, 추론), `ProductProfileWizard` (composition, 추론), `Question` (composition, 추론), `RadioGrid` (layout, 추론) | qd-class-reference |
| [components/ProductionYieldPanel.tsx](../../Q-Atelier/components/ProductionYieldPanel.tsx) | `ProductionYieldPanel` (composition, 추론) | product-local |
| [components/ProjectComplianceScore.tsx](../../Q-Atelier/components/ProjectComplianceScore.tsx) | `ChecksList` (data-display, 추론), `ProjectComplianceScore` (composition, 추론) | product-local |
| [components/PullToRefresh.tsx](../../Q-Atelier/components/PullToRefresh.tsx) | `PullToRefresh` (composition, 추론) | product-local |
| [components/PushSubscribeButton.tsx](../../Q-Atelier/components/PushSubscribeButton.tsx) | `AppPushToggle` (choice, 추론), `PushSubscribeButton` (action, 추론) | product-local |
| [components/QmsLinkedProcedureModal.tsx](../../Q-Atelier/components/QmsLinkedProcedureModal.tsx) | `QmsLinkedProcedureModal` (overlay, 추론) | product-local |
| [components/QmsStatusWidget.tsx](../../Q-Atelier/components/QmsStatusWidget.tsx) | `QmsStatusWidget` (composition, 추론) | product-local |
| [components/QuickApproveDrawer.tsx](../../Q-Atelier/components/QuickApproveDrawer.tsx) | `QuickApproveDrawer` (overlay, 추론) | product-local |
| [components/RaProgressPanel.tsx](../../Q-Atelier/components/RaProgressPanel.tsx) | `RaProgressPanel` (composition, 추론) | product-local |
| [components/RaStatusNotice.tsx](../../Q-Atelier/components/RaStatusNotice.tsx) | `RaStatusNotice` (feedback, 추론), `ResearchFlowButton` (action, 추론) | product-local |
| [components/RdDocumentFlowPanel.tsx](../../Q-Atelier/components/RdDocumentFlowPanel.tsx) | `CatalogStageDocCard` (composition, 추론), `DeleteDocBtn` (composition, 추론), `DirectInProgressBtn` (composition, 추론), `DirectStatusBtn` (composition, 추론), `RdDocumentFlowPanel` (composition, 추론), `RevertStatusBtn` (composition, 추론), `StatusBtn` (composition, 추론), `UploadDocxBtn` (composition, 추론) | qd-class-reference |
| [components/ReadOnlyNote.tsx](../../Q-Atelier/components/ReadOnlyNote.tsx) | `ReadOnlyNote` (composition, 추론) | product-local |
| [components/RealtimeNotifications.tsx](../../Q-Atelier/components/RealtimeNotifications.tsx) | `RealtimeNotifications` (composition, 추론) | product-local |
| [components/ReevaluateButton.tsx](../../Q-Atelier/components/ReevaluateButton.tsx) | `ReevaluateButton` (action, 추론) | product-local |
| [components/ReferenceSection.tsx](../../Q-Atelier/components/ReferenceSection.tsx) | `ReferenceSection` (layout, 추론) | product-local |
| [components/RegisterSection.tsx](../../Q-Atelier/components/RegisterSection.tsx) | `Register` (composition, 추론) | product-local |
| [components/RegulatoryChangesPanel.tsx](../../Q-Atelier/components/RegulatoryChangesPanel.tsx) | `RegulatoryChangesPanel` (composition, 추론) | product-local |
| [components/RegulatoryDeadlinesWidget.tsx](../../Q-Atelier/components/RegulatoryDeadlinesWidget.tsx) | `RegulatoryDeadlinesWidget` (composition, 추론) | product-local |
| [components/RegulatoryPipelineWidget.tsx](../../Q-Atelier/components/RegulatoryPipelineWidget.tsx) | `RegulatoryPipelineWidget` (composition, 추론) | product-local |
| [components/RegulatoryRoadmap.tsx](../../Q-Atelier/components/RegulatoryRoadmap.tsx) | `RegulatoryRoadmap` (composition, 추론) | product-local |
| [components/RegulatoryWatchWidget.tsx](../../Q-Atelier/components/RegulatoryWatchWidget.tsx) | `RegulatoryWatchWidget` (composition, 추론) | product-local |
| [components/ReleaseChecklist.tsx](../../Q-Atelier/components/ReleaseChecklist.tsx) | `ReleaseChecklist` (data-display, 추론) | product-local |
| [components/ReleaseSignPanel.tsx](../../Q-Atelier/components/ReleaseSignPanel.tsx) | `ReleaseSignPanel` (composition, 추론) | product-local |
| [components/RequestReviewButton.tsx](../../Q-Atelier/components/RequestReviewButton.tsx) | `RequestReviewButton` (action, 추론), `RequestReviewModal` (overlay, 추론), `Step` (composition, 추론) | qd-class-reference |
| [components/RequirementsDashboard.tsx](../../Q-Atelier/components/RequirementsDashboard.tsx) | `CollapsibleSection` (layout, 추론), `DocRow` (data-display, 추론), `DocsByCategory` (composition, 추론), `DocsFilterAndList` (data-display, 추론), `MetricCard` (composition, 추론), `RecommendedDocRow` (data-display, 추론), `RegulatoryCard` (composition, 추론), `RelatedDocGroup` (composition, 추론), `RequirementsDashboard` (composition, 추론), `StagePill` (composition, 추론), `StatusIcon` (icon, 추론), `SummaryCards` (composition, 추론), `TestPlanSection` (layout, 추론) | product-local |
| [components/ResearchChangeRequestsPanel.tsx](../../Q-Atelier/components/ResearchChangeRequestsPanel.tsx) | `CRCard` (composition, 추론), `CrMeetingRow` (data-display, 추론), `ImpactBox` (composition, 추론), `ImpactScopeSection` (layout, 추론), `NewCRForm` (composition, 추론), `ResearchChangeRequestsPanel` (composition, 추론), `ReviewForm` (composition, 추론), `ReviewRow` (data-display, 추론), `SubLabel` (field, 추론) | product-local |
| [components/ResearchEntryBanner.tsx](../../Q-Atelier/components/ResearchEntryBanner.tsx) | `ResearchEntryBanner` (feedback, 추론) | product-local |
| [components/ResearchTabNav.tsx](../../Q-Atelier/components/ResearchTabNav.tsx) | `ResearchTabNav` (navigation, 추론) | product-local |
| [components/RevisionRowExpandable.tsx](../../Q-Atelier/components/RevisionRowExpandable.tsx) | `FlowChart` (chart, 추론), `RevisionRowExpandable` (composition, 추론) | product-local |
| [components/RibbonBackground.tsx](../../Q-Atelier/components/RibbonBackground.tsx) | 모듈 단위 검토 | imports-canonical-module |
| [components/RoleProjectCard.tsx](../../Q-Atelier/components/RoleProjectCard.tsx) | `RoleProjectCard` (composition, 추론) | product-local |
| [components/RoleReviewPanel.tsx](../../Q-Atelier/components/RoleReviewPanel.tsx) | `ResponseForm` (composition, 추론), `ReviewForm` (composition, 추론), `RoleReviewPanel` (composition, 추론), `RoleStatusCard` (composition, 추론) | qd-class-reference |
| [components/RoleWorkspaceKpis.tsx](../../Q-Atelier/components/RoleWorkspaceKpis.tsx) | `RoleWorkspaceKpis` (composition, 추론) | product-local |
| [components/RuleEngineBadge.tsx](../../Q-Atelier/components/RuleEngineBadge.tsx) | `RuleEngineBadge` (data-display, 추론) | product-local |
| [components/ServiceWorkerRegister.tsx](../../Q-Atelier/components/ServiceWorkerRegister.tsx) | `ServiceWorkerRegister` (composition, 추론) | product-local |
| [components/SessionExpiryGate.tsx](../../Q-Atelier/components/SessionExpiryGate.tsx) | `SessionExpiryGate` (provider, 추론) | product-local |
| [components/SessionIdleMonitor.tsx](../../Q-Atelier/components/SessionIdleMonitor.tsx) | `SessionIdleMonitor` (composition, 추론) | product-local |
| [components/Sidebar.tsx](../../Q-Atelier/components/Sidebar.tsx) | `ChevronIcon` (icon, 추론), `CollapsibleNavGroup` (navigation, 추론), `MenuIcon` (icon, 추론), `NavLink` (navigation, 추론), `renderWorkspaceLink` (navigation, 추론), `SectionHeader` (navigation, 추론), `Sidebar` (navigation, 추론), `SidebarBody` (navigation, 추론), `WorkspaceNavGroup` (navigation, 추론) | product-local |
| [components/SignOutEverywhere.tsx](../../Q-Atelier/components/SignOutEverywhere.tsx) | `SignOutEverywhere` (composition, 추론) | product-local |
| [components/Skeleton.tsx](../../Q-Atelier/components/Skeleton.tsx) | `Skeleton` (loading) | qd-class-reference |
| [components/SoloModeStepGuide.tsx](../../Q-Atelier/components/SoloModeStepGuide.tsx) | `SoloModeStepGuide` (composition, 추론) | product-local |
| [components/StageProgressionAction.tsx](../../Q-Atelier/components/StageProgressionAction.tsx) | `PrereqRow` (data-display, 추론), `StageProgressionAction` (action, 추론), `WaiveDRModal` (overlay, 추론) | qd-class-reference |
| [components/StageRevertAction.tsx](../../Q-Atelier/components/StageRevertAction.tsx) | `StageRevertAction` (action, 추론) | qd-class-reference |
| [components/StageTrack.tsx](../../Q-Atelier/components/StageTrack.tsx) | `StageTrack` (stages) | product-local |
| [components/StatusChangeSection.tsx](../../Q-Atelier/components/StatusChangeSection.tsx) | `StatusChangeSection` (layout, 추론) | product-local |
| [components/StickyFocusGuard.tsx](../../Q-Atelier/components/StickyFocusGuard.tsx) | `StickyFocusGuard` (provider, 추론) | canonical-copy |
| [components/StudioNote.tsx](../../Q-Atelier/components/StudioNote.tsx) | `StudioNote` (composition, 추론) | product-local |
| [components/SubmissionSectionChecklist.tsx](../../Q-Atelier/components/SubmissionSectionChecklist.tsx) | `SubmissionSectionChecklist` (data-display, 추론) | product-local |
| [components/SubmissionTrackingPanel.tsx](../../Q-Atelier/components/SubmissionTrackingPanel.tsx) | `EditPanel` (composition, 추론), `NewSubmissionForm` (composition, 추론), `SubmissionCard` (composition, 추론), `SubmissionTrackingPanel` (composition, 추론), `SupplementForm` (composition, 추론), `SupplementRow` (data-display, 추론) | product-local |
| [components/SubscriptionIndicator.tsx](../../Q-Atelier/components/SubscriptionIndicator.tsx) | `CoreRow` (data-display, 추론), `MetricRow` (data-display, 추론), `Row` (data-display, 추론), `SubscriptionIndicator` (composition, 추론) | product-local |
| [components/SuggestSelect.tsx](../../Q-Atelier/components/SuggestSelect.tsx) | `SuggestSelect` (field, 추론) | product-local |
| [components/SuggestionDetailModal.tsx](../../Q-Atelier/components/SuggestionDetailModal.tsx) | `Chip` (composition, 추론), `Field` (field, 추론), `KV` (composition, 추론), `RiskLadder` (composition, 추론), `SectionLabel` (field, 추론), `Stat` (data-display, 추론), `SuggestionDetailModal` (overlay, 추론) | product-local |
| [components/SupplementRequestButton.tsx](../../Q-Atelier/components/SupplementRequestButton.tsx) | `SupplementRequestButton` (action, 추론) | qd-class-reference |
| [components/TeamActivityFeed.tsx](../../Q-Atelier/components/TeamActivityFeed.tsx) | `TeamActivityFeed` (composition, 추론) | product-local |
| [components/TextAction.tsx](../../Q-Atelier/components/TextAction.tsx) | `TextAction` (text-action), `TextLinkAction` (text-action) | qd-class-reference |
| [components/TimeSeriesChart.tsx](../../Q-Atelier/components/TimeSeriesChart.tsx) | `TimeSeriesChart` (chart, 추론) | qd-class-reference |
| [components/Toast.tsx](../../Q-Atelier/components/Toast.tsx) | `ToastBubble` (composition, 추론), `ToastProvider` (toast), `Viewport` (composition, 추론) | qd-class-reference |
| [components/TodayQueue.tsx](../../Q-Atelier/components/TodayQueue.tsx) | `TodayQueue` (composition, 추론) | product-local |
| [components/TopHeaderBand.tsx](../../Q-Atelier/components/TopHeaderBand.tsx) | `TopHeaderBand` (composition, 추론) | product-local |
| [components/TopProgressBar.tsx](../../Q-Atelier/components/TopProgressBar.tsx) | `TopProgressBar` (navigation, 추론) | canonical-copy |
| [components/TruncatedNote.tsx](../../Q-Atelier/components/TruncatedNote.tsx) | `TruncatedNote` (composition, 추론) | product-local |
| [components/VaultUnlockGate.tsx](../../Q-Atelier/components/VaultUnlockGate.tsx) | `VaultGateCard` (composition, 추론), `VaultKeySetupForm` (composition, 추론), `VaultUnlockForm` (composition, 추론), `VaultUnlockGate` (provider, 추론) | product-local |
| [components/WelcomeFlow.tsx](../../Q-Atelier/components/WelcomeFlow.tsx) | `Step` (composition, 추론), `WelcomeFlow` (composition, 추론) | product-local |
| [components/WriteGate.tsx](../../Q-Atelier/components/WriteGate.tsx) | `WriteGate` (provider, 추론) | product-local |
| [components/admin/ConditionRulesPanel.tsx](../../Q-Atelier/components/admin/ConditionRulesPanel.tsx) | `ConditionRulesPanel` (composition, 추론), `rulePhoneRow` (data-display, 추론) | product-local |
| [components/admin/CspReportsPanel.tsx](../../Q-Atelier/components/admin/CspReportsPanel.tsx) | `CspReportsPanel` (composition, 추론) | product-local |
| [components/admin/DocsetActivateSheet.tsx](../../Q-Atelier/components/admin/DocsetActivateSheet.tsx) | `ChangeBody` (composition, 추론), `DocList` (data-display, 추론), `DocsetActivateSheet` (composition, 추론) | product-local |
| [components/admin/DocsetCheckPanel.tsx](../../Q-Atelier/components/admin/DocsetCheckPanel.tsx) | `CheckResult` (composition, 추론), `DocsetCheckPanel` (composition, 추론), `ProblemList` (data-display, 추론), `VerdictTag` (data-display, 추론) | product-local |
| [components/admin/DocsetEditionsPanel.tsx](../../Q-Atelier/components/admin/DocsetEditionsPanel.tsx) | `DocsetEditionsPanel` (composition, 추론), `EditionRow` (data-display, 추론) | product-local |
| [components/admin/DocsetStructurePanel.tsx](../../Q-Atelier/components/admin/DocsetStructurePanel.tsx) | `atomPhoneRow` (data-display, 추론), `DocsetStructurePanel` (composition, 추론) | product-local |
| [components/admin/DocsetStructureParts.tsx](../../Q-Atelier/components/admin/DocsetStructureParts.tsx) | `AtomPlacement` (composition, 추론), `HierarchyGuide` (composition, 추론), `LedgerRow` (data-display, 추론), `levelName` (composition, 추론), `ProcComposition` (composition, 추론) | product-local |
| [components/admin/MemberHandoverDialog.tsx](../../Q-Atelier/components/admin/MemberHandoverDialog.tsx) | `MemberHandoverDialog` (overlay, 추론) | product-local |
| [components/admin/MemberRoleEditor.tsx](../../Q-Atelier/components/admin/MemberRoleEditor.tsx) | `MemberRoleEditor` (field, 추론) | product-local |
| [components/admin/MfdsPermitDossierPanel.tsx](../../Q-Atelier/components/admin/MfdsPermitDossierPanel.tsx) | `MfdsPermitDossierPanel` (composition, 추론), `Row` (data-display, 추론) | product-local |
| [components/admin/OrgEditPanel.tsx](../../Q-Atelier/components/admin/OrgEditPanel.tsx) | `OrgEditPanel` (composition, 추론) | product-local |
| [components/admin/ServiceStatusPanel.tsx](../../Q-Atelier/components/admin/ServiceStatusPanel.tsx) | `ServiceStatusPanel` (composition, 추론) | product-local |
| [components/admin/TransferMemberDialog.tsx](../../Q-Atelier/components/admin/TransferMemberDialog.tsx) | `TransferMemberDialog` (overlay, 추론) | qd-class-reference |
| [components/calendar/CalendarClient.tsx](../../Q-Atelier/components/calendar/CalendarClient.tsx) | `CalendarClient` (composition, 추론), `MonthNavBtn` (composition, 추론) | product-local |
| [components/calendar/MeetingComposeDialog.tsx](../../Q-Atelier/components/calendar/MeetingComposeDialog.tsx) | `MeetingComposeDialog` (overlay, 추론), `SectionDivider` (composition, 추론) | qd-class-reference |
| [components/calendar/MeetingDetailPanel.tsx](../../Q-Atelier/components/calendar/MeetingDetailPanel.tsx) | `MeetingDetailPanel` (composition, 추론), `ResponseBtn` (composition, 추론), `ResponseStatus` (composition, 추론) | product-local |
| [components/capa/CapaPrintView.tsx](../../Q-Atelier/components/capa/CapaPrintView.tsx) | `CapaPrintView` (document, 추론) | product-local |
| [components/capa/CapaSheetsPanel.tsx](../../Q-Atelier/components/capa/CapaSheetsPanel.tsx) | `CapaSheetsPanel` (composition, 추론), `field` (field, 추론) | product-local |
| [components/complaints/ComplaintInvestigationPanel.tsx](../../Q-Atelier/components/complaints/ComplaintInvestigationPanel.tsx) | `ComplaintInvestigationPanel` (composition, 추론), `read` (composition, 추론), `sel` (field, 추론), `txt` (field, 추론) | product-local |
| [components/complaints/InvestigationPrintView.tsx](../../Q-Atelier/components/complaints/InvestigationPrintView.tsx) | `InvestigationPrintView` (document, 추론) | product-local |
| [components/contracts/ContractPanels.tsx](../../Q-Atelier/components/contracts/ContractPanels.tsx) | `ContractChanges` (composition, 추론), `ContractLists` (composition, 추론), `ContractReviewRecord` (composition, 추론) | product-local |
| [components/customer-property/CustomerPropertyPanels.tsx](../../Q-Atelier/components/customer-property/CustomerPropertyPanels.tsx) | `CustomerPropertyList` (data-display, 추론), `CustomerPropertyRecord` (composition, 추론), `CustomerPropertyRecords` (composition, 추론) | product-local |
| [components/dashboard/ClinicalDashboardView.tsx](../../Q-Atelier/components/dashboard/ClinicalDashboardView.tsx) | `clinicalDashboardBlocks` (composition, 추론) | product-local |
| [components/dashboard/CustomizableWidgetBoard.tsx](../../Q-Atelier/components/dashboard/CustomizableWidgetBoard.tsx) | `CtrlBtn` (composition, 추론), `CustomizableWidgetBoard` (composition, 추론) | product-local |
| [components/dashboard/ExecDashboardView.tsx](../../Q-Atelier/components/dashboard/ExecDashboardView.tsx) | `execDashboardBlocks` (composition, 추론) | product-local |
| [components/dashboard/GettingStartedChecklist.tsx](../../Q-Atelier/components/dashboard/GettingStartedChecklist.tsx) | `GettingStartedChecklist` (data-display, 추론) | product-local |
| [components/dashboard/MedQraftAdminView.tsx](../../Q-Atelier/components/dashboard/MedQraftAdminView.tsx) | `MedQraftAdminView` (composition, 추론) | product-local |
| [components/dashboard/ProductionDashboardView.tsx](../../Q-Atelier/components/dashboard/ProductionDashboardView.tsx) | `productionDashboardBlocks` (composition, 추론), `WorkRow` (data-display, 추론) | product-local |
| [components/dashboard/QADashboardView.tsx](../../Q-Atelier/components/dashboard/QADashboardView.tsx) | `qaDashboardBlocks` (composition, 추론) | product-local |
| [components/dashboard/RADashboardView.tsx](../../Q-Atelier/components/dashboard/RADashboardView.tsx) | `raDashboardBlocks` (composition, 추론) | product-local |
| [components/dashboard/RDDashboardView.tsx](../../Q-Atelier/components/dashboard/RDDashboardView.tsx) | `rdDashboardBlocks` (composition, 추론) | product-local |
| [components/dashboard/widgets.tsx](../../Q-Atelier/components/dashboard/widgets.tsx) | `AdminToolCard` (composition, 추론), `KpiItemList` (data-display, 추론), `OrgBreakdownList` (data-display, 추론), `orgSubColumns` (composition, 추론), `OrgSubTable` (data-display, 추론), `RecentList` (data-display, 추론) | product-local |
| [components/device-licenses/LicenseSubmissionDocsPanel.tsx](../../Q-Atelier/components/device-licenses/LicenseSubmissionDocsPanel.tsx) | `DeleteDocBtn` (composition, 추론), `LicenseSubmissionDocsPanel` (composition, 추론), `StatusSelect` (field, 추론), `UploadDocxBtn` (composition, 추론) | qd-class-reference |
| [components/equipment/EquipmentCalibrationsPanel.tsx](../../Q-Atelier/components/equipment/EquipmentCalibrationsPanel.tsx) | `EquipmentCalibrationsPanel` (composition, 추론) | product-local |
| [components/equipment/EquipmentEventsPanel.tsx](../../Q-Atelier/components/equipment/EquipmentEventsPanel.tsx) | `EquipmentEventsPanel` (composition, 추론) | product-local |
| [components/exchange/ExchangePanel.tsx](../../Q-Atelier/components/exchange/ExchangePanel.tsx) | `download` (composition, 추론), `ExchangePanel` (composition, 추론) | product-local |
| [components/exchange/LinkPanel.tsx](../../Q-Atelier/components/exchange/LinkPanel.tsx) | `LinkPanel` (composition, 추론), `LotResult` (composition, 추론), `phoneRow` (data-display, 추론) | product-local |
| [components/expert/BrandLogo.tsx](../../Q-Atelier/components/expert/BrandLogo.tsx) | `BrandLogo` (identity, 추론) | product-local |
| [components/expert/ExpertShell.tsx](../../Q-Atelier/components/expert/ExpertShell.tsx) | `ExpertShell` (layout, 추론) | product-local |
| [components/expert/Field.tsx](../../Q-Atelier/components/expert/Field.tsx) | `Field` (field, 추론) | product-local |
| [components/expert/HangulTracking.tsx](../../Q-Atelier/components/expert/HangulTracking.tsx) | `HangulTracking` (composition, 추론) | product-local |
| [components/expert/OpinionRecap.tsx](../../Q-Atelier/components/expert/OpinionRecap.tsx) | `OpinionRecap` (composition, 추론) | product-local |
| [components/expert/PortalFooter.tsx](../../Q-Atelier/components/expert/PortalFooter.tsx) | `PortalFooter` (composition, 추론) | product-local |
| [components/item-classification/MfdsRegisteredProducts.tsx](../../Q-Atelier/components/item-classification/MfdsRegisteredProducts.tsx) | `MfdsRegisteredProducts` (composition, 추론) | product-local |
| [components/products/ProductServicePanel.tsx](../../Q-Atelier/components/products/ProductServicePanel.tsx) | `ProductServicePanel` (composition, 추론) | product-local |
| [components/q-design-icons/Activity.tsx](../../Q-Atelier/components/q-design-icons/Activity.tsx) | `Activity` (icon, 추론) | product-local |
| [components/q-design-icons/AlertCircle.tsx](../../Q-Atelier/components/q-design-icons/AlertCircle.tsx) | `AlertCircle` (icon, 추론) | product-local |
| [components/q-design-icons/AlertOctagon.tsx](../../Q-Atelier/components/q-design-icons/AlertOctagon.tsx) | `AlertOctagon` (icon, 추론) | product-local |
| [components/q-design-icons/AlertTriangle.tsx](../../Q-Atelier/components/q-design-icons/AlertTriangle.tsx) | `AlertTriangle` (icon, 추론) | product-local |
| [components/q-design-icons/Archive.tsx](../../Q-Atelier/components/q-design-icons/Archive.tsx) | `Archive` (icon, 추론) | product-local |
| [components/q-design-icons/ArrowDown.tsx](../../Q-Atelier/components/q-design-icons/ArrowDown.tsx) | `ArrowDown` (icon, 추론) | product-local |
| [components/q-design-icons/ArrowLeft.tsx](../../Q-Atelier/components/q-design-icons/ArrowLeft.tsx) | `ArrowLeft` (icon, 추론) | product-local |
| [components/q-design-icons/ArrowRight.tsx](../../Q-Atelier/components/q-design-icons/ArrowRight.tsx) | `ArrowRight` (icon, 추론) | product-local |
| [components/q-design-icons/ArrowUp.tsx](../../Q-Atelier/components/q-design-icons/ArrowUp.tsx) | `ArrowUp` (icon, 추론) | product-local |
| [components/q-design-icons/ArrowUpRight.tsx](../../Q-Atelier/components/q-design-icons/ArrowUpRight.tsx) | `ArrowUpRight` (icon, 추론) | product-local |
| [components/q-design-icons/Award.tsx](../../Q-Atelier/components/q-design-icons/Award.tsx) | `Award` (icon, 추론) | product-local |
| [components/q-design-icons/BadgeCheck.tsx](../../Q-Atelier/components/q-design-icons/BadgeCheck.tsx) | `BadgeCheck` (icon, 추론) | product-local |
| [components/q-design-icons/Ban.tsx](../../Q-Atelier/components/q-design-icons/Ban.tsx) | `Ban` (icon, 추론) | product-local |
| [components/q-design-icons/Banknote.tsx](../../Q-Atelier/components/q-design-icons/Banknote.tsx) | `Banknote` (icon, 추론) | product-local |
| [components/q-design-icons/BarChart3.tsx](../../Q-Atelier/components/q-design-icons/BarChart3.tsx) | `BarChart3` (icon, 추론) | product-local |
| [components/q-design-icons/Beaker.tsx](../../Q-Atelier/components/q-design-icons/Beaker.tsx) | `Beaker` (icon, 추론) | product-local |
| [components/q-design-icons/Bell.tsx](../../Q-Atelier/components/q-design-icons/Bell.tsx) | `Bell` (icon, 추론) | product-local |
| [components/q-design-icons/BellOff.tsx](../../Q-Atelier/components/q-design-icons/BellOff.tsx) | `BellOff` (icon, 추론) | product-local |
| [components/q-design-icons/Biohazard.tsx](../../Q-Atelier/components/q-design-icons/Biohazard.tsx) | `Biohazard` (icon, 추론) | product-local |
| [components/q-design-icons/BookMarked.tsx](../../Q-Atelier/components/q-design-icons/BookMarked.tsx) | `BookMarked` (icon, 추론) | product-local |
| [components/q-design-icons/BookOpen.tsx](../../Q-Atelier/components/q-design-icons/BookOpen.tsx) | `BookOpen` (icon, 추론) | product-local |
| [components/q-design-icons/BookText.tsx](../../Q-Atelier/components/q-design-icons/BookText.tsx) | `BookText` (icon, 추론) | product-local |
| [components/q-design-icons/Boxes.tsx](../../Q-Atelier/components/q-design-icons/Boxes.tsx) | `Boxes` (icon, 추론) | product-local |
| [components/q-design-icons/Building2.tsx](../../Q-Atelier/components/q-design-icons/Building2.tsx) | `Building2` (icon, 추론) | product-local |
| [components/q-design-icons/Calendar.tsx](../../Q-Atelier/components/q-design-icons/Calendar.tsx) | `Calendar` (icon, 추론) | product-local |
| [components/q-design-icons/CalendarClock.tsx](../../Q-Atelier/components/q-design-icons/CalendarClock.tsx) | `CalendarClock` (icon, 추론) | product-local |
| [components/q-design-icons/CalendarPlus.tsx](../../Q-Atelier/components/q-design-icons/CalendarPlus.tsx) | `CalendarPlus` (icon, 추론) | product-local |
| [components/q-design-icons/Camera.tsx](../../Q-Atelier/components/q-design-icons/Camera.tsx) | `Camera` (icon, 추론) | product-local |
| [components/q-design-icons/Check.tsx](../../Q-Atelier/components/q-design-icons/Check.tsx) | `Check` (icon, 추론) | product-local |
| [components/q-design-icons/CheckCircle.tsx](../../Q-Atelier/components/q-design-icons/CheckCircle.tsx) | `CheckCircle` (icon, 추론) | product-local |
| [components/q-design-icons/CheckCircle2.tsx](../../Q-Atelier/components/q-design-icons/CheckCircle2.tsx) | `CheckCircle2` (icon, 추론) | product-local |
| [components/q-design-icons/ChevronDown.tsx](../../Q-Atelier/components/q-design-icons/ChevronDown.tsx) | `ChevronDown` (icon, 추론) | product-local |
| [components/q-design-icons/ChevronLeft.tsx](../../Q-Atelier/components/q-design-icons/ChevronLeft.tsx) | `ChevronLeft` (icon, 추론) | product-local |
| [components/q-design-icons/ChevronRight.tsx](../../Q-Atelier/components/q-design-icons/ChevronRight.tsx) | `ChevronRight` (icon, 추론) | product-local |
| [components/q-design-icons/ChevronUp.tsx](../../Q-Atelier/components/q-design-icons/ChevronUp.tsx) | `ChevronUp` (icon, 추론) | product-local |
| [components/q-design-icons/Circle.tsx](../../Q-Atelier/components/q-design-icons/Circle.tsx) | `Circle` (icon, 추론) | product-local |
| [components/q-design-icons/CircleDashed.tsx](../../Q-Atelier/components/q-design-icons/CircleDashed.tsx) | `CircleDashed` (icon, 추론) | product-local |
| [components/q-design-icons/CircleSlash.tsx](../../Q-Atelier/components/q-design-icons/CircleSlash.tsx) | `CircleSlash` (icon, 추론) | product-local |
| [components/q-design-icons/ClipboardCheck.tsx](../../Q-Atelier/components/q-design-icons/ClipboardCheck.tsx) | `ClipboardCheck` (icon, 추론) | product-local |
| [components/q-design-icons/ClipboardList.tsx](../../Q-Atelier/components/q-design-icons/ClipboardList.tsx) | `ClipboardList` (icon, 추론) | product-local |
| [components/q-design-icons/Clock.tsx](../../Q-Atelier/components/q-design-icons/Clock.tsx) | `Clock` (icon, 추론) | product-local |
| [components/q-design-icons/Cog.tsx](../../Q-Atelier/components/q-design-icons/Cog.tsx) | `Cog` (icon, 추론) | product-local |
| [components/q-design-icons/Copy.tsx](../../Q-Atelier/components/q-design-icons/Copy.tsx) | `Copy` (icon, 추론) | product-local |
| [components/q-design-icons/Download.tsx](../../Q-Atelier/components/q-design-icons/Download.tsx) | `Download` (icon, 추론) | product-local |
| [components/q-design-icons/ExternalLink.tsx](../../Q-Atelier/components/q-design-icons/ExternalLink.tsx) | `ExternalLink` (icon, 추론) | product-local |
| [components/q-design-icons/Eye.tsx](../../Q-Atelier/components/q-design-icons/Eye.tsx) | `Eye` (icon, 추론) | product-local |
| [components/q-design-icons/EyeOff.tsx](../../Q-Atelier/components/q-design-icons/EyeOff.tsx) | `EyeOff` (icon, 추론) | product-local |
| [components/q-design-icons/Factory.tsx](../../Q-Atelier/components/q-design-icons/Factory.tsx) | `Factory` (icon, 추론) | product-local |
| [components/q-design-icons/FileCheck.tsx](../../Q-Atelier/components/q-design-icons/FileCheck.tsx) | `FileCheck` (icon, 추론) | product-local |
| [components/q-design-icons/FileCheck2.tsx](../../Q-Atelier/components/q-design-icons/FileCheck2.tsx) | `FileCheck2` (icon, 추론) | product-local |
| [components/q-design-icons/FileClock.tsx](../../Q-Atelier/components/q-design-icons/FileClock.tsx) | `FileClock` (icon, 추론) | product-local |
| [components/q-design-icons/FileDown.tsx](../../Q-Atelier/components/q-design-icons/FileDown.tsx) | `FileDown` (icon, 추론) | product-local |
| [components/q-design-icons/FileQuestion.tsx](../../Q-Atelier/components/q-design-icons/FileQuestion.tsx) | `FileQuestion` (icon, 추론) | product-local |
| [components/q-design-icons/FileSearch.tsx](../../Q-Atelier/components/q-design-icons/FileSearch.tsx) | `FileSearch` (icon, 추론) | product-local |
| [components/q-design-icons/FileText.tsx](../../Q-Atelier/components/q-design-icons/FileText.tsx) | `FileText` (icon, 추론) | product-local |
| [components/q-design-icons/FileWarning.tsx](../../Q-Atelier/components/q-design-icons/FileWarning.tsx) | `FileWarning` (icon, 추론) | product-local |
| [components/q-design-icons/Filter.tsx](../../Q-Atelier/components/q-design-icons/Filter.tsx) | `Filter` (icon, 추론) | product-local |
| [components/q-design-icons/Fingerprint.tsx](../../Q-Atelier/components/q-design-icons/Fingerprint.tsx) | `Fingerprint` (icon, 추론) | product-local |
| [components/q-design-icons/FlaskConical.tsx](../../Q-Atelier/components/q-design-icons/FlaskConical.tsx) | `FlaskConical` (icon, 추론) | product-local |
| [components/q-design-icons/Gauge.tsx](../../Q-Atelier/components/q-design-icons/Gauge.tsx) | `Gauge` (icon, 추론) | product-local |
| [components/q-design-icons/GitBranch.tsx](../../Q-Atelier/components/q-design-icons/GitBranch.tsx) | `GitBranch` (icon, 추론) | product-local |
| [components/q-design-icons/GitPullRequest.tsx](../../Q-Atelier/components/q-design-icons/GitPullRequest.tsx) | `GitPullRequest` (icon, 추론) | product-local |
| [components/q-design-icons/GitPullRequestArrow.tsx](../../Q-Atelier/components/q-design-icons/GitPullRequestArrow.tsx) | `GitPullRequestArrow` (icon, 추론) | product-local |
| [components/q-design-icons/Globe.tsx](../../Q-Atelier/components/q-design-icons/Globe.tsx) | `Globe` (icon, 추론) | product-local |
| [components/q-design-icons/GraduationCap.tsx](../../Q-Atelier/components/q-design-icons/GraduationCap.tsx) | `GraduationCap` (icon, 추론) | product-local |
| [components/q-design-icons/GripVertical.tsx](../../Q-Atelier/components/q-design-icons/GripVertical.tsx) | `GripVertical` (icon, 추론) | product-local |
| [components/q-design-icons/Handshake.tsx](../../Q-Atelier/components/q-design-icons/Handshake.tsx) | `Handshake` (icon, 추론) | product-local |
| [components/q-design-icons/HardHat.tsx](../../Q-Atelier/components/q-design-icons/HardHat.tsx) | `HardHat` (icon, 추론) | product-local |
| [components/q-design-icons/HelpCircle.tsx](../../Q-Atelier/components/q-design-icons/HelpCircle.tsx) | `HelpCircle` (icon, 추론) | product-local |
| [components/q-design-icons/History.tsx](../../Q-Atelier/components/q-design-icons/History.tsx) | `History` (icon, 추론) | product-local |
| [components/q-design-icons/Home.tsx](../../Q-Atelier/components/q-design-icons/Home.tsx) | `Home` (icon, 추론) | product-local |
| [components/q-design-icons/Image.tsx](../../Q-Atelier/components/q-design-icons/Image.tsx) | `Image` (icon, 추론) | product-local |
| [components/q-design-icons/ImageOff.tsx](../../Q-Atelier/components/q-design-icons/ImageOff.tsx) | `ImageOff` (icon, 추론) | product-local |
| [components/q-design-icons/Inbox.tsx](../../Q-Atelier/components/q-design-icons/Inbox.tsx) | `Inbox` (icon, 추론) | product-local |
| [components/q-design-icons/Info.tsx](../../Q-Atelier/components/q-design-icons/Info.tsx) | `Info` (icon, 추론) | product-local |
| [components/q-design-icons/KeyRound.tsx](../../Q-Atelier/components/q-design-icons/KeyRound.tsx) | `KeyRound` (icon, 추론) | product-local |
| [components/q-design-icons/Landmark.tsx](../../Q-Atelier/components/q-design-icons/Landmark.tsx) | `Landmark` (icon, 추론) | product-local |
| [components/q-design-icons/LayoutDashboard.tsx](../../Q-Atelier/components/q-design-icons/LayoutDashboard.tsx) | `LayoutDashboard` (icon, 추론) | product-local |
| [components/q-design-icons/Lightbulb.tsx](../../Q-Atelier/components/q-design-icons/Lightbulb.tsx) | `Lightbulb` (icon, 추론) | product-local |
| [components/q-design-icons/Link2.tsx](../../Q-Atelier/components/q-design-icons/Link2.tsx) | `Link2` (icon, 추론) | product-local |
| [components/q-design-icons/ListChecks.tsx](../../Q-Atelier/components/q-design-icons/ListChecks.tsx) | `ListChecks` (icon, 추론) | product-local |
| [components/q-design-icons/Loader2.tsx](../../Q-Atelier/components/q-design-icons/Loader2.tsx) | `Loader2` (icon, 추론) | product-local |
| [components/q-design-icons/Lock.tsx](../../Q-Atelier/components/q-design-icons/Lock.tsx) | `Lock` (icon, 추론) | product-local |
| [components/q-design-icons/Mail.tsx](../../Q-Atelier/components/q-design-icons/Mail.tsx) | `Mail` (icon, 추론) | product-local |
| [components/q-design-icons/MapPin.tsx](../../Q-Atelier/components/q-design-icons/MapPin.tsx) | `MapPin` (icon, 추론) | product-local |
| [components/q-design-icons/Megaphone.tsx](../../Q-Atelier/components/q-design-icons/Megaphone.tsx) | `Megaphone` (icon, 추론) | product-local |
| [components/q-design-icons/Menu.tsx](../../Q-Atelier/components/q-design-icons/Menu.tsx) | `Menu` (icon, 추론) | product-local |
| [components/q-design-icons/MessageCircle.tsx](../../Q-Atelier/components/q-design-icons/MessageCircle.tsx) | `MessageCircle` (icon, 추론) | product-local |
| [components/q-design-icons/MessageSquare.tsx](../../Q-Atelier/components/q-design-icons/MessageSquare.tsx) | `MessageSquare` (icon, 추론) | product-local |
| [components/q-design-icons/MessageSquareWarning.tsx](../../Q-Atelier/components/q-design-icons/MessageSquareWarning.tsx) | `MessageSquareWarning` (icon, 추론) | product-local |
| [components/q-design-icons/MessagesSquare.tsx](../../Q-Atelier/components/q-design-icons/MessagesSquare.tsx) | `MessagesSquare` (icon, 추론) | product-local |
| [components/q-design-icons/Minus.tsx](../../Q-Atelier/components/q-design-icons/Minus.tsx) | `Minus` (icon, 추론) | product-local |
| [components/q-design-icons/MinusCircle.tsx](../../Q-Atelier/components/q-design-icons/MinusCircle.tsx) | `MinusCircle` (icon, 추론) | product-local |
| [components/q-design-icons/Monitor.tsx](../../Q-Atelier/components/q-design-icons/Monitor.tsx) | `Monitor` (icon, 추론) | product-local |
| [components/q-design-icons/Moon.tsx](../../Q-Atelier/components/q-design-icons/Moon.tsx) | `Moon` (icon, 추론) | product-local |
| [components/q-design-icons/MoreHorizontal.tsx](../../Q-Atelier/components/q-design-icons/MoreHorizontal.tsx) | `MoreHorizontal` (icon, 추론) | product-local |
| [components/q-design-icons/Network.tsx](../../Q-Atelier/components/q-design-icons/Network.tsx) | `Network` (icon, 추론) | product-local |
| [components/q-design-icons/Package.tsx](../../Q-Atelier/components/q-design-icons/Package.tsx) | `Package` (icon, 추론) | product-local |
| [components/q-design-icons/PackageCheck.tsx](../../Q-Atelier/components/q-design-icons/PackageCheck.tsx) | `PackageCheck` (icon, 추론) | product-local |
| [components/q-design-icons/PackageX.tsx](../../Q-Atelier/components/q-design-icons/PackageX.tsx) | `PackageX` (icon, 추론) | product-local |
| [components/q-design-icons/Paperclip.tsx](../../Q-Atelier/components/q-design-icons/Paperclip.tsx) | `Paperclip` (icon, 추론) | product-local |
| [components/q-design-icons/PenLine.tsx](../../Q-Atelier/components/q-design-icons/PenLine.tsx) | `PenLine` (icon, 추론) | product-local |
| [components/q-design-icons/Plus.tsx](../../Q-Atelier/components/q-design-icons/Plus.tsx) | `Plus` (icon, 추론) | product-local |
| [components/q-design-icons/RefreshCcw.tsx](../../Q-Atelier/components/q-design-icons/RefreshCcw.tsx) | `RefreshCcw` (icon, 추론) | product-local |
| [components/q-design-icons/RefreshCw.tsx](../../Q-Atelier/components/q-design-icons/RefreshCw.tsx) | `RefreshCw` (icon, 추론) | product-local |
| [components/q-design-icons/Reply.tsx](../../Q-Atelier/components/q-design-icons/Reply.tsx) | `Reply` (icon, 추론) | product-local |
| [components/q-design-icons/RotateCcw.tsx](../../Q-Atelier/components/q-design-icons/RotateCcw.tsx) | `RotateCcw` (icon, 추론) | product-local |
| [components/q-design-icons/Ruler.tsx](../../Q-Atelier/components/q-design-icons/Ruler.tsx) | `Ruler` (icon, 추론) | product-local |
| [components/q-design-icons/Scale.tsx](../../Q-Atelier/components/q-design-icons/Scale.tsx) | `Scale` (icon, 추론) | product-local |
| [components/q-design-icons/ScanBarcode.tsx](../../Q-Atelier/components/q-design-icons/ScanBarcode.tsx) | `ScanBarcode` (icon, 추론) | product-local |
| [components/q-design-icons/ScanSearch.tsx](../../Q-Atelier/components/q-design-icons/ScanSearch.tsx) | `ScanSearch` (icon, 추론) | product-local |
| [components/q-design-icons/ScrollText.tsx](../../Q-Atelier/components/q-design-icons/ScrollText.tsx) | `ScrollText` (icon, 추론) | product-local |
| [components/q-design-icons/Search.tsx](../../Q-Atelier/components/q-design-icons/Search.tsx) | `Search` (icon, 추론) | product-local |
| [components/q-design-icons/Send.tsx](../../Q-Atelier/components/q-design-icons/Send.tsx) | `Send` (icon, 추론) | product-local |
| [components/q-design-icons/Settings.tsx](../../Q-Atelier/components/q-design-icons/Settings.tsx) | `Settings` (icon, 추론) | product-local |
| [components/q-design-icons/Shield.tsx](../../Q-Atelier/components/q-design-icons/Shield.tsx) | `Shield` (icon, 추론) | product-local |
| [components/q-design-icons/ShieldAlert.tsx](../../Q-Atelier/components/q-design-icons/ShieldAlert.tsx) | `ShieldAlert` (icon, 추론) | product-local |
| [components/q-design-icons/ShieldCheck.tsx](../../Q-Atelier/components/q-design-icons/ShieldCheck.tsx) | `ShieldCheck` (icon, 추론) | product-local |
| [components/q-design-icons/Signature.tsx](../../Q-Atelier/components/q-design-icons/Signature.tsx) | `Signature` (icon, 추론) | product-local |
| [components/q-design-icons/Siren.tsx](../../Q-Atelier/components/q-design-icons/Siren.tsx) | `Siren` (icon, 추론) | product-local |
| [components/q-design-icons/SkipForward.tsx](../../Q-Atelier/components/q-design-icons/SkipForward.tsx) | `SkipForward` (icon, 추론) | product-local |
| [components/q-design-icons/SlidersHorizontal.tsx](../../Q-Atelier/components/q-design-icons/SlidersHorizontal.tsx) | `SlidersHorizontal` (icon, 추론) | product-local |
| [components/q-design-icons/Smartphone.tsx](../../Q-Atelier/components/q-design-icons/Smartphone.tsx) | `Smartphone` (icon, 추론) | product-local |
| [components/q-design-icons/Sparkles.tsx](../../Q-Atelier/components/q-design-icons/Sparkles.tsx) | `Sparkles` (icon, 추론) | product-local |
| [components/q-design-icons/Stamp.tsx](../../Q-Atelier/components/q-design-icons/Stamp.tsx) | `Stamp` (icon, 추론) | product-local |
| [components/q-design-icons/Stethoscope.tsx](../../Q-Atelier/components/q-design-icons/Stethoscope.tsx) | `Stethoscope` (icon, 추론) | product-local |
| [components/q-design-icons/Sun.tsx](../../Q-Atelier/components/q-design-icons/Sun.tsx) | `Sun` (icon, 추론) | product-local |
| [components/q-design-icons/Target.tsx](../../Q-Atelier/components/q-design-icons/Target.tsx) | `Target` (icon, 추론) | product-local |
| [components/q-design-icons/ThumbsDown.tsx](../../Q-Atelier/components/q-design-icons/ThumbsDown.tsx) | `ThumbsDown` (icon, 추론) | product-local |
| [components/q-design-icons/ThumbsUp.tsx](../../Q-Atelier/components/q-design-icons/ThumbsUp.tsx) | `ThumbsUp` (icon, 추론) | product-local |
| [components/q-design-icons/Trash2.tsx](../../Q-Atelier/components/q-design-icons/Trash2.tsx) | `Trash2` (icon, 추론) | product-local |
| [components/q-design-icons/TriangleAlert.tsx](../../Q-Atelier/components/q-design-icons/TriangleAlert.tsx) | `TriangleAlert` (icon, 추론) | product-local |
| [components/q-design-icons/Truck.tsx](../../Q-Atelier/components/q-design-icons/Truck.tsx) | `Truck` (icon, 추론) | product-local |
| [components/q-design-icons/Undo2.tsx](../../Q-Atelier/components/q-design-icons/Undo2.tsx) | `Undo2` (icon, 추론) | product-local |
| [components/q-design-icons/Upload.tsx](../../Q-Atelier/components/q-design-icons/Upload.tsx) | `Upload` (icon, 추론) | product-local |
| [components/q-design-icons/User.tsx](../../Q-Atelier/components/q-design-icons/User.tsx) | `User` (icon, 추론) | product-local |
| [components/q-design-icons/UserCheck.tsx](../../Q-Atelier/components/q-design-icons/UserCheck.tsx) | `UserCheck` (icon, 추론) | product-local |
| [components/q-design-icons/Users.tsx](../../Q-Atelier/components/q-design-icons/Users.tsx) | `Users` (icon, 추론) | product-local |
| [components/q-design-icons/Wind.tsx](../../Q-Atelier/components/q-design-icons/Wind.tsx) | `Wind` (icon, 추론) | product-local |
| [components/q-design-icons/Wrench.tsx](../../Q-Atelier/components/q-design-icons/Wrench.tsx) | `Wrench` (icon, 추론) | product-local |
| [components/q-design-icons/X.tsx](../../Q-Atelier/components/q-design-icons/X.tsx) | `X` (icon, 추론) | product-local |
| [components/q-design-icons/XCircle.tsx](../../Q-Atelier/components/q-design-icons/XCircle.tsx) | `XCircle` (icon, 추론) | product-local |
| [components/q-design-icons/_icon.tsx](../../Q-Atelier/components/q-design-icons/_icon.tsx) | `createIcon` (icon, 추론), `Icon` (icon, 추론) | qd-class-reference |
| [components/qms/ComputerSystemsPanel.tsx](../../Q-Atelier/components/qms/ComputerSystemsPanel.tsx) | `ComputerSystemsPanel` (composition, 추론) | product-local |
| [components/qms/DefaultDocsPanel.tsx](../../Q-Atelier/components/qms/DefaultDocsPanel.tsx) | `actions` (action, 추론), `DefaultDocsPanel` (composition, 추론), `formPhoneRow` (data-display, 추론), `procPhoneRow` (data-display, 추론) | qd-class-reference |
| [components/qms/PaperTools.tsx](../../Q-Atelier/components/qms/PaperTools.tsx) | `PaperTools` (composition, 추론), `PrintAction` (action, 추론) | product-local |
| [components/qms/ParentSheets.tsx](../../Q-Atelier/components/qms/ParentSheets.tsx) | `ParentSheets` (composition, 추론) | product-local |
| [components/qms/RecordControlPanel.tsx](../../Q-Atelier/components/qms/RecordControlPanel.tsx) | `RecordControlPanel` (composition, 추론) | product-local |
| [components/qms/SheetEditor.tsx](../../Q-Atelier/components/qms/SheetEditor.tsx) | `fieldInput` (field, 추론), `SheetEditor` (field, 추론) | product-local |
| [components/qms/SheetFlowBar.tsx](../../Q-Atelier/components/qms/SheetFlowBar.tsx) | `SheetFlowBar` (composition, 추론), `SheetStatusTag` (data-display, 추론) | product-local |
| [components/qms/SheetPaper.tsx](../../Q-Atelier/components/qms/SheetPaper.tsx) | `SheetPaper` (composition, 추론) | product-local |
| [components/qms/SheetPeopleField.tsx](../../Q-Atelier/components/qms/SheetPeopleField.tsx) | `SheetPeopleField` (field, 추론) | product-local |
| [components/qms/SheetPrintView.tsx](../../Q-Atelier/components/qms/SheetPrintView.tsx) | `SheetPrintView` (document, 추론) | product-local |
| [components/qms/sheet-paper.css](../../Q-Atelier/components/qms/sheet-paper.css) | 스타일 기반 규칙 | product-local |
| [components/recalls/RecallConsigneesPanel.tsx](../../Q-Atelier/components/recalls/RecallConsigneesPanel.tsx) | `RecallConsigneesPanel` (composition, 추론) | product-local |
| [components/recalls/RecallRecordFields.tsx](../../Q-Atelier/components/recalls/RecallRecordFields.tsx) | `GroupCard` (composition, 추론), `RecallRecordFields` (composition, 추론) | product-local |
| [components/research/DesignTransferPanel.tsx](../../Q-Atelier/components/research/DesignTransferPanel.tsx) | `DesignTransferPanel` (composition, 추론) | product-local |
| [components/research/DhfIndexPanel.tsx](../../Q-Atelier/components/research/DhfIndexPanel.tsx) | `DhfIndexPanel` (composition, 추론) | product-local |
| [components/suppliers/QaAgreementReview.tsx](../../Q-Atelier/components/suppliers/QaAgreementReview.tsx) | `QaAgreementReview` (composition, 추론) | product-local |
| [components/suppliers/SupplierDocsPanel.tsx](../../Q-Atelier/components/suppliers/SupplierDocsPanel.tsx) | `secureDownload` (composition, 추론), `SupplierDocsPanel` (composition, 추론) | product-local |
| [components/suppliers/SupplierEvalPanel.tsx](../../Q-Atelier/components/suppliers/SupplierEvalPanel.tsx) | `SupplierEvalPanel` (composition, 추론) | product-local |
| [components/suppliers/SupplierItemsPanel.tsx](../../Q-Atelier/components/suppliers/SupplierItemsPanel.tsx) | `SupplierItemsPanel` (composition, 추론) | product-local |
| [components/suppliers/SupplierShipmentsPanel.tsx](../../Q-Atelier/components/suppliers/SupplierShipmentsPanel.tsx) | `SupplierShipmentsPanel` (composition, 추론) | product-local |
| [components/training/CompetencePanel.tsx](../../Q-Atelier/components/training/CompetencePanel.tsx) | `CompetencePanel` (composition, 추론) | product-local |
| [lib/design/components.tsx](../../Q-Atelier/lib/design/components.tsx) | `Alert` (feedback), `Btn` (action), `Bx` (container), `Card` (kpi, container), `CardFigure` (record-row), `CardRow` (record-row), `CardRows` (record-row), `CardTitle` (section-title), `Checkbox` (check-toggle), `Collapse` (disclosure-motion), `DataTable` (data-table), `DetailRow` (record-row), `DistributionBars` (progress), `Div` (separator), `Drawer` (drawer), `EmptyState` (empty), `En` (text-semantic), `EntityCardHeader` (page-head), `EntityRow` (record-row), `Field` (field), `FilterChip` (choice-chip), `FldError` (field), `FldRow` (field), `FormActions` (form-section), `FormSection` (form-section), `Grid` (container), `IconBtn` (action), `In` (text-input), `InfoBox` (feedback), `InfoDot` (tooltip-info), `InlineStrong` (text-semantic), `KPI` (kpi), `KpiGrid` (kpi), `Lbl` (field), `LegalNote` (feedback), `LoadingState` (loading), `Modal` (modal), `NextStep` (feedback), `PageHd` (page-head), `Panel` (container), `PhoneSwap` (data-table), `ProgressBar` (progress), `ProgressRing` (progress), `Reveal` (disclosure-motion), `RiskPill` (badge), `ScrollTable` (data-table), `Section` (form-section), `SectionCard` (container), `SectionProgressCard` (progress), `SectionTitle` (section-title), `SectionTitleInfo` (section-title), `Sel` (select), `Skeleton` (loading), `SkeletonPanel` (loading), `Spinner` (composition, 추론), `StageTimeline` (stages), `StageTimelineItem` (composition, 추론), `Stat` (kpi), `StatGrid` (kpi), `SubmitFailureSummary` (feedback), `Switch` (check-toggle), `Tag` (badge), `TooltipBody` (tooltip-info), `TooltipDivider` (tooltip-info), `TooltipNote` (tooltip-info), `TooltipRow` (tooltip-info), `Txt` (textarea), `WorkspaceTab` (tabs) | qd-class-reference |
| [lib/design/hangul-text.tsx](../../Q-Atelier/lib/design/hangul-text.tsx) | `RowMeta` (composition, 추론) | product-local |
| [lib/design/q-design-backgrounds.tsx](../../Q-Atelier/lib/design/q-design-backgrounds.tsx) | `EntranceRibbon` (composition, 추론), `RibbonBackground` (composition, 추론) | canonical-copy |
| [lib/design/segmented-choice.tsx](../../Q-Atelier/lib/design/segmented-choice.tsx) | `ChoiceCheck` (choice-chip), `ChoiceChip` (choice-chip), `SegmentedChoice` (choice-chip) | qd-class-reference |
| [lib/design/theme-provider.tsx](../../Q-Atelier/lib/design/theme-provider.tsx) | `ThemeProvider` (provider, 추론) | product-local |
| [lib/docset-library/client.ts](../../Q-Atelier/lib/docset-library/client.ts) | `saveBlob` (composition, 추론) | product-local |
| [lib/hooks/useBreakpoints.ts](../../Q-Atelier/lib/hooks/useBreakpoints.ts) | `BreakpointsFirstGuess` (provider, 추론) | product-local |
| [lib/novice-mode.tsx](../../Q-Atelier/lib/novice-mode.tsx) | `NoviceModeProvider` (provider, 추론) | product-local |
| [lib/qms/download-qms-doc.ts](../../Q-Atelier/lib/qms/download-qms-doc.ts) | `downloadQmsDoc` (composition, 추론) | product-local |
| [lib/research/comment-markdown.tsx](../../Q-Atelier/lib/research/comment-markdown.tsx) | `renderCommentMarkdown` (composition, 추론) | product-local |
| [lib/vault/vault-context.tsx](../../Q-Atelier/lib/vault/vault-context.tsx) | `VaultProvider` (provider, 추론), `VaultUnlockModal` (overlay, 추론) | product-local |

## Q-Maison

| 파일 | 컴포넌트와 규칙 분류 | 연결 근거 |
| --- | --- | --- |
| [app/(app)/account/copy-request-button.tsx](../../Q-Works/app/(app)/account/copy-request-button.tsx) | `CopyRequestButton` (action, 추론) | product-local |
| [app/(app)/account/loading.tsx](../../Q-Works/app/(app)/account/loading.tsx) | `Loading` (feedback, 추론) | product-local |
| [app/(app)/account/my-access.tsx](../../Q-Works/app/(app)/account/my-access.tsx) | `MyAccess` (composition, 추론), `Row` (data-display, 추론) | qd-class-reference |
| [app/(app)/account/page.tsx](../../Q-Works/app/(app)/account/page.tsx) | `AccessTab` (navigation, 추론), `AccountPage` (screen, 추론), `ProfileTab` (navigation, 추론) | qd-class-reference |
| [app/(app)/account/password-form.tsx](../../Q-Works/app/(app)/account/password-form.tsx) | `PasswordForm` (composition, 추론) | product-local |
| [app/(app)/account/profile-form.tsx](../../Q-Works/app/(app)/account/profile-form.tsx) | `ProfileForm` (composition, 추론) | product-local |
| [app/(app)/account/signature-form.tsx](../../Q-Works/app/(app)/account/signature-form.tsx) | `SignatureForm` (composition, 추론) | product-local |
| [app/(app)/account/withdraw-section.tsx](../../Q-Works/app/(app)/account/withdraw-section.tsx) | `WithdrawSection` (layout, 추론) | qd-class-reference |
| [app/(app)/ai-chat/answer-markdown.tsx](../../Q-Works/app/(app)/ai-chat/answer-markdown.tsx) | `AnswerMarkdown` (composition, 추론) | product-local |
| [app/(app)/ai-chat/chat-client.tsx](../../Q-Works/app/(app)/ai-chat/chat-client.tsx) | `ChatClient` (composition, 추론) | qd-class-reference |
| [app/(app)/ai-chat/loading.tsx](../../Q-Works/app/(app)/ai-chat/loading.tsx) | `Loading` (feedback, 추론) | product-local |
| [app/(app)/ai-chat/page.tsx](../../Q-Works/app/(app)/ai-chat/page.tsx) | `AiChatPage` (screen, 추론) | product-local |
| [app/(app)/audit-simulation/loading.tsx](../../Q-Works/app/(app)/audit-simulation/loading.tsx) | `Loading` (feedback, 추론) | product-local |
| [app/(app)/audit-simulation/page.tsx](../../Q-Works/app/(app)/audit-simulation/page.tsx) | `AuditSimulationPage` (screen, 추론), `CheckCard` (composition, 추론), `ClauseFolder` (composition, 추론), `EvidenceDocs` (composition, 추론), `SectionTally` (composition, 추론), `SharedChecks` (composition, 추론), `Tally` (composition, 추론), `VerdictBadge` (data-display, 추론) | qd-class-reference |
| [app/(app)/audit-simulation/verdict-breakdown.tsx](../../Q-Works/app/(app)/audit-simulation/verdict-breakdown.tsx) | `VerdictBreakdown` (composition, 추론) | qd-class-reference |
| [app/(app)/audits/[id]/audit-detail-client.tsx](../../Q-Works/app/(app)/audits/%5Bid%5D/audit-detail-client.tsx) | `AuditDetailClient` (composition, 추론), `FindingsSection` (layout, 추론) | qd-class-reference |
| [app/(app)/audits/[id]/checklist/loading.tsx](../../Q-Works/app/(app)/audits/%5Bid%5D/checklist/loading.tsx) | `Loading` (feedback, 추론) | product-local |
| [app/(app)/audits/[id]/checklist/page.tsx](../../Q-Works/app/(app)/audits/%5Bid%5D/checklist/page.tsx) | `AuditChecklistPage` (screen, 추론) | imports-canonical-module |
| [app/(app)/audits/[id]/checklist/print/page.tsx](../../Q-Works/app/(app)/audits/%5Bid%5D/checklist/print/page.tsx) | `Page` (document, 추론) | imports-canonical-module |
| [app/(app)/audits/[id]/delete-audit-button.tsx](../../Q-Works/app/(app)/audits/%5Bid%5D/delete-audit-button.tsx) | `DeleteAuditButton` (action, 추론) | product-local |
| [app/(app)/audits/[id]/loading.tsx](../../Q-Works/app/(app)/audits/%5Bid%5D/loading.tsx) | `Loading` (feedback, 추론) | product-local |
| [app/(app)/audits/[id]/page.tsx](../../Q-Works/app/(app)/audits/%5Bid%5D/page.tsx) | `AuditDetailPage` (screen, 추론) | imports-canonical-module |
| [app/(app)/audits/[id]/print/page.tsx](../../Q-Works/app/(app)/audits/%5Bid%5D/print/page.tsx) | `Page` (document, 추론) | imports-canonical-module |
| [app/(app)/audits/[id]/report/loading.tsx](../../Q-Works/app/(app)/audits/%5Bid%5D/report/loading.tsx) | `Loading` (feedback, 추론) | product-local |
| [app/(app)/audits/[id]/report/page.tsx](../../Q-Works/app/(app)/audits/%5Bid%5D/report/page.tsx) | `AuditReportPage` (screen, 추론) | imports-canonical-module |
| [app/(app)/audits/[id]/report/print/page.tsx](../../Q-Works/app/(app)/audits/%5Bid%5D/report/print/page.tsx) | `Page` (document, 추론) | imports-canonical-module |
| [app/(app)/audits/approval-ui.tsx](../../Q-Works/app/(app)/audits/approval-ui.tsx) | `AuditApprovalButtons` (composition, 추론), `AuditApprovalFlow` (composition, 추론) | qd-class-reference |
| [app/(app)/audits/audit-sheets.tsx](../../Q-Works/app/(app)/audits/audit-sheets.tsx) | `AuditChecklistSheet` (composition, 추론), `AuditPlanSheet` (composition, 추론), `AuditReportSheet` (document, 추론), `ChecklistTable` (data-display, 추론) | imports-canonical-module |
| [app/(app)/audits/audit-stats.tsx](../../Q-Works/app/(app)/audits/audit-stats.tsx) | `AuditStats` (data-display, 추론) | product-local |
| [app/(app)/audits/body-form.tsx](../../Q-Works/app/(app)/audits/body-form.tsx) | `AuditBodyForm` (composition, 추론) | qd-class-reference |
| [app/(app)/audits/checklist-form.tsx](../../Q-Works/app/(app)/audits/checklist-form.tsx) | `AuditChecklistForm` (composition, 추론) | qd-class-reference |
| [app/(app)/audits/loading.tsx](../../Q-Works/app/(app)/audits/loading.tsx) | `Loading` (feedback, 추론) | product-local |
| [app/(app)/audits/new/page.tsx](../../Q-Works/app/(app)/audits/new/page.tsx) | `NewAuditPage` (screen, 추론) | product-local |
| [app/(app)/audits/page.tsx](../../Q-Works/app/(app)/audits/page.tsx) | `AuditsPage` (screen, 추론) | qd-class-reference |
| [app/(app)/audits/sheet-flow.tsx](../../Q-Works/app/(app)/audits/sheet-flow.tsx) | `AuditSheetDeleteButton` (action, 추론), `AuditSheetFlow` (composition, 추론), `makeButton` (action, 추론) | product-local |
| [app/(app)/audits/sheet-header.tsx](../../Q-Works/app/(app)/audits/sheet-header.tsx) | `AuditSheetApproval` (composition, 추론) | product-local |
| [app/(app)/capa/approval-ui.tsx](../../Q-Works/app/(app)/capa/approval-ui.tsx) | `CapaApprovalButtons` (composition, 추론), `CapaApprovalFlow` (composition, 추론) | qd-class-reference |
| [app/(app)/capa/capa-sheets.tsx](../../Q-Works/app/(app)/capa/capa-sheets.tsx) | `CapaChecklistSheet` (composition, 추론), `CapaPlanSheet` (composition, 추론), `CapaReportSheet` (document, 추론) | imports-canonical-module |
| [app/(app)/capa/checklist-form.tsx](../../Q-Works/app/(app)/capa/checklist-form.tsx) | `CapaChecklistForm` (composition, 추론) | qd-class-reference |
| [app/(app)/capa/loading.tsx](../../Q-Works/app/(app)/capa/loading.tsx) | `Loading` (feedback, 추론) | product-local |
| [app/(app)/capa/new/loading.tsx](../../Q-Works/app/(app)/capa/new/loading.tsx) | `Loading` (feedback, 추론) | product-local |
| [app/(app)/capa/new/page.tsx](../../Q-Works/app/(app)/capa/new/page.tsx) | `NewCapaPlanPage` (screen, 추론) | product-local |
| [app/(app)/capa/page.tsx](../../Q-Works/app/(app)/capa/page.tsx) | `CapaPage` (screen, 추론) | qd-class-reference |
| [app/(app)/capa/plan-form.tsx](../../Q-Works/app/(app)/capa/plan-form.tsx) | `CapaPlanForm` (composition, 추론) | qd-class-reference |
| [app/(app)/capa/plans/[id]/checklist/page.tsx](../../Q-Works/app/(app)/capa/plans/%5Bid%5D/checklist/page.tsx) | `CapaChecklistPage` (screen, 추론) | imports-canonical-module |
| [app/(app)/capa/plans/[id]/checklist/print/page.tsx](../../Q-Works/app/(app)/capa/plans/%5Bid%5D/checklist/print/page.tsx) | `CapaChecklistPrintPage` (document, 추론) | imports-canonical-module |
| [app/(app)/capa/plans/[id]/page.tsx](../../Q-Works/app/(app)/capa/plans/%5Bid%5D/page.tsx) | `CapaPlanDetailPage` (screen, 추론) | imports-canonical-module |
| [app/(app)/capa/plans/[id]/print/page.tsx](../../Q-Works/app/(app)/capa/plans/%5Bid%5D/print/page.tsx) | `CapaPlanPrintPage` (document, 추론) | imports-canonical-module |
| [app/(app)/capa/plans/[id]/report/page.tsx](../../Q-Works/app/(app)/capa/plans/%5Bid%5D/report/page.tsx) | `CapaReportPage` (screen, 추론) | imports-canonical-module |
| [app/(app)/capa/plans/[id]/report/print/page.tsx](../../Q-Works/app/(app)/capa/plans/%5Bid%5D/report/print/page.tsx) | `CapaReportPrintPage` (document, 추론) | imports-canonical-module |
| [app/(app)/capa/report-form.tsx](../../Q-Works/app/(app)/capa/report-form.tsx) | `CapaReportForm` (composition, 추론) | qd-class-reference |
| [app/(app)/capa/sheet-flow.tsx](../../Q-Works/app/(app)/capa/sheet-flow.tsx) | `CapaSheetFlow` (composition, 추론), `makeButton` (action, 추론) | product-local |
| [app/(app)/capa/sheet-header-fields.tsx](../../Q-Works/app/(app)/capa/sheet-header-fields.tsx) | `CapaHeaderFields` (composition, 추론), `CapaMeasureChecks` (composition, 추론) | qd-class-reference |
| [app/(app)/capa/sheet-links.tsx](../../Q-Works/app/(app)/capa/sheet-links.tsx) | `CapaDeleteButton` (action, 추론) | product-local |
| [app/(app)/capa/source-doc-picker.tsx](../../Q-Works/app/(app)/capa/source-doc-picker.tsx) | `CapaSourceDocPicker` (field, 추론) | product-local |
| [app/(app)/change-initial-password/form.tsx](../../Q-Works/app/(app)/change-initial-password/form.tsx) | `ChangePasswordForm` (composition, 추론) | product-local |
| [app/(app)/change-initial-password/page.tsx](../../Q-Works/app/(app)/change-initial-password/page.tsx) | `ChangeInitialPasswordPage` (screen, 추론) | product-local |
| [app/(app)/change-requests/[id]/approval-buttons.tsx](../../Q-Works/app/(app)/change-requests/%5Bid%5D/approval-buttons.tsx) | `ChangeApprovalButtons` (composition, 추론) | qd-class-reference |
| [app/(app)/change-requests/[id]/approval-flow.tsx](../../Q-Works/app/(app)/change-requests/%5Bid%5D/approval-flow.tsx) | `ChangeApprovalFlow` (composition, 추론) | product-local |
| [app/(app)/change-requests/[id]/change-attachments.tsx](../../Q-Works/app/(app)/change-requests/%5Bid%5D/change-attachments.tsx) | `ChangeAttachments` (composition, 추론) | qd-class-reference |
| [app/(app)/change-requests/[id]/cr-detail-client.tsx](../../Q-Works/app/(app)/change-requests/%5Bid%5D/cr-detail-client.tsx) | `CrDetailClient` (composition, 추론) | qd-class-reference |
| [app/(app)/change-requests/[id]/delete-cr-button.tsx](../../Q-Works/app/(app)/change-requests/%5Bid%5D/delete-cr-button.tsx) | `DeleteCrButton` (action, 추론) | product-local |
| [app/(app)/change-requests/[id]/examine/examine-form.tsx](../../Q-Works/app/(app)/change-requests/%5Bid%5D/examine/examine-form.tsx) | `ExamineForm` (composition, 추론) | qd-class-reference |
| [app/(app)/change-requests/[id]/examine/page.tsx](../../Q-Works/app/(app)/change-requests/%5Bid%5D/examine/page.tsx) | `ChangeExaminePage` (screen, 추론) | imports-canonical-module |
| [app/(app)/change-requests/[id]/examine/print/page.tsx](../../Q-Works/app/(app)/change-requests/%5Bid%5D/examine/print/page.tsx) | `ChangeExaminePrintPage` (document, 추론) | imports-canonical-module |
| [app/(app)/change-requests/[id]/form-section.tsx](../../Q-Works/app/(app)/change-requests/%5Bid%5D/form-section.tsx) | `FormSection` (layout, 추론) | qd-class-reference |
| [app/(app)/change-requests/[id]/form-tables.tsx](../../Q-Works/app/(app)/change-requests/%5Bid%5D/form-tables.tsx) | `RowsTable` (data-display, 추론), `YesNoTable` (data-display, 추론) | qd-class-reference |
| [app/(app)/change-requests/[id]/loading.tsx](../../Q-Works/app/(app)/change-requests/%5Bid%5D/loading.tsx) | `Loading` (feedback, 추론) | product-local |
| [app/(app)/change-requests/[id]/next-sheets.tsx](../../Q-Works/app/(app)/change-requests/%5Bid%5D/next-sheets.tsx) | `NextSheets` (composition, 추론), `SheetCard` (composition, 추론) | qd-class-reference |
| [app/(app)/change-requests/[id]/page.tsx](../../Q-Works/app/(app)/change-requests/%5Bid%5D/page.tsx) | `CrDetailPage` (screen, 추론) | imports-canonical-module |
| [app/(app)/change-requests/[id]/print/page.tsx](../../Q-Works/app/(app)/change-requests/%5Bid%5D/print/page.tsx) | `ChangeRequestPrintPage` (document, 추론) | imports-canonical-module |
| [app/(app)/change-requests/[id]/report/page.tsx](../../Q-Works/app/(app)/change-requests/%5Bid%5D/report/page.tsx) | `ChangeReportPage` (screen, 추론) | imports-canonical-module |
| [app/(app)/change-requests/[id]/report/print/page.tsx](../../Q-Works/app/(app)/change-requests/%5Bid%5D/report/print/page.tsx) | `ChangeReportPrintPage` (document, 추론) | imports-canonical-module |
| [app/(app)/change-requests/[id]/report/report-form.tsx](../../Q-Works/app/(app)/change-requests/%5Bid%5D/report/report-form.tsx) | `ReportForm` (composition, 추론), `textRows` (composition, 추론) | product-local |
| [app/(app)/change-requests/[id]/request-form-card.tsx](../../Q-Works/app/(app)/change-requests/%5Bid%5D/request-form-card.tsx) | `CrRequestFormCard` (composition, 추론), `Section` (layout, 추론) | qd-class-reference |
| [app/(app)/change-requests/[id]/sheet-flow.tsx](../../Q-Works/app/(app)/change-requests/%5Bid%5D/sheet-flow.tsx) | `ChangeSheetFlow` (composition, 추론) | product-local |
| [app/(app)/change-requests/change-sheets.tsx](../../Q-Works/app/(app)/change-requests/change-sheets.tsx) | `ChangeExamineSheet` (composition, 추론), `ChangeReportSheet` (document, 추론), `ChangeRequestSheet` (composition, 추론) | imports-canonical-module |
| [app/(app)/change-requests/filter-bar.tsx](../../Q-Works/app/(app)/change-requests/filter-bar.tsx) | `ChangeFilterBar` (composition, 추론) | qd-class-reference |
| [app/(app)/change-requests/loading.tsx](../../Q-Works/app/(app)/change-requests/loading.tsx) | `Loading` (feedback, 추론) | product-local |
| [app/(app)/change-requests/new/loading.tsx](../../Q-Works/app/(app)/change-requests/new/loading.tsx) | `Loading` (feedback, 추론) | product-local |
| [app/(app)/change-requests/new/new-cr-form.tsx](../../Q-Works/app/(app)/change-requests/new/new-cr-form.tsx) | `NewCrForm` (composition, 추론), `Section` (layout, 추론) | qd-class-reference |
| [app/(app)/change-requests/new/page.tsx](../../Q-Works/app/(app)/change-requests/new/page.tsx) | `NewCrPage` (screen, 추론) | product-local |
| [app/(app)/change-requests/page.tsx](../../Q-Works/app/(app)/change-requests/page.tsx) | `ChangeRequestsPage` (screen, 추론) | product-local |
| [app/(app)/change-requests/sheets-section.tsx](../../Q-Works/app/(app)/change-requests/sheets-section.tsx) | `ChangeSheetsSection` (layout, 추론) | qd-class-reference |
| [app/(app)/complaints/[id]/approval-flow.tsx](../../Q-Works/app/(app)/complaints/%5Bid%5D/approval-flow.tsx) | `ComplaintApprovalFlow` (composition, 추론) | qd-class-reference |
| [app/(app)/complaints/[id]/complaint-actions.tsx](../../Q-Works/app/(app)/complaints/%5Bid%5D/complaint-actions.tsx) | `ComplaintActions` (action, 추론) | qd-class-reference |
| [app/(app)/complaints/[id]/complaint-photo-panel.tsx](../../Q-Works/app/(app)/complaints/%5Bid%5D/complaint-photo-panel.tsx) | `ComplaintPhotoPanel` (composition, 추론) | qd-class-reference |
| [app/(app)/complaints/[id]/complaint-report-panel.tsx](../../Q-Works/app/(app)/complaints/%5Bid%5D/complaint-report-panel.tsx) | `ComplaintReportPanel` (composition, 추론), `Row` (data-display, 추론) | qd-class-reference |
| [app/(app)/complaints/[id]/complaint-sheet.tsx](../../Q-Works/app/(app)/complaints/%5Bid%5D/complaint-sheet.tsx) | `ComplaintSheet` (document, 추론), `L` (document, 추론) | imports-canonical-module |
| [app/(app)/complaints/[id]/delete-complaint-button.tsx](../../Q-Works/app/(app)/complaints/%5Bid%5D/delete-complaint-button.tsx) | `DeleteComplaintButton` (action, 추론) | product-local |
| [app/(app)/complaints/[id]/loading.tsx](../../Q-Works/app/(app)/complaints/%5Bid%5D/loading.tsx) | `Loading` (feedback, 추론) | product-local |
| [app/(app)/complaints/[id]/page.tsx](../../Q-Works/app/(app)/complaints/%5Bid%5D/page.tsx) | `ComplaintDetailPage` (screen, 추론) | qd-class-reference |
| [app/(app)/complaints/[id]/print/page.tsx](../../Q-Works/app/(app)/complaints/%5Bid%5D/print/page.tsx) | `ComplaintPrintPage` (document, 추론) | imports-canonical-module |
| [app/(app)/complaints/complaint-report-form.tsx](../../Q-Works/app/(app)/complaints/complaint-report-form.tsx) | `CheckChip` (composition, 추론), `CheckGroup` (composition, 추론), `ComplaintReportForm` (composition, 추론) | qd-class-reference |
| [app/(app)/complaints/loading.tsx](../../Q-Works/app/(app)/complaints/loading.tsx) | `Loading` (feedback, 추론) | product-local |
| [app/(app)/complaints/new/loading.tsx](../../Q-Works/app/(app)/complaints/new/loading.tsx) | `Loading` (feedback, 추론) | product-local |
| [app/(app)/complaints/new/page.tsx](../../Q-Works/app/(app)/complaints/new/page.tsx) | `NewComplaintPage` (screen, 추론) | product-local |
| [app/(app)/complaints/page.tsx](../../Q-Works/app/(app)/complaints/page.tsx) | `ComplaintsPage` (screen, 추론) | qd-class-reference |
| [app/(app)/concessions/[id]/loading.tsx](../../Q-Works/app/(app)/concessions/%5Bid%5D/loading.tsx) | `Loading` (feedback, 추론) | product-local |
| [app/(app)/concessions/[id]/page.tsx](../../Q-Works/app/(app)/concessions/%5Bid%5D/page.tsx) | `ConcessionRequestPage` (screen, 추론) | imports-canonical-module |
| [app/(app)/concessions/[id]/print/loading.tsx](../../Q-Works/app/(app)/concessions/%5Bid%5D/print/loading.tsx) | `Loading` (feedback, 추론) | product-local |
| [app/(app)/concessions/[id]/print/page.tsx](../../Q-Works/app/(app)/concessions/%5Bid%5D/print/page.tsx) | `ConcessionRequestPrintPage` (document, 추론) | imports-canonical-module |
| [app/(app)/concessions/[id]/report/loading.tsx](../../Q-Works/app/(app)/concessions/%5Bid%5D/report/loading.tsx) | `Loading` (feedback, 추론) | product-local |
| [app/(app)/concessions/[id]/report/page.tsx](../../Q-Works/app/(app)/concessions/%5Bid%5D/report/page.tsx) | `ConcessionReportPage` (screen, 추론) | imports-canonical-module |
| [app/(app)/concessions/[id]/report/print/loading.tsx](../../Q-Works/app/(app)/concessions/%5Bid%5D/report/print/loading.tsx) | `Loading` (feedback, 추론) | product-local |
| [app/(app)/concessions/[id]/report/print/page.tsx](../../Q-Works/app/(app)/concessions/%5Bid%5D/report/print/page.tsx) | `ConcessionReportPrintPage` (document, 추론) | imports-canonical-module |
| [app/(app)/concessions/approval-ui.tsx](../../Q-Works/app/(app)/concessions/approval-ui.tsx) | `ConcessionApprovalActions` (action, 추론), `ConcessionApprovalFlow` (composition, 추론) | qd-class-reference |
| [app/(app)/concessions/concession-flow.tsx](../../Q-Works/app/(app)/concessions/concession-flow.tsx) | `ConcessionDocFlow` (composition, 추론) | product-local |
| [app/(app)/concessions/concession-sheets.tsx](../../Q-Works/app/(app)/concessions/concession-sheets.tsx) | `ConcessionReportSheet` (document, 추론), `ConcessionRequestSheet` (composition, 추론), `ItemTable` (data-display, 추론), `ReasonTable` (data-display, 추론) | imports-canonical-module |
| [app/(app)/concessions/delete-sheet-button.tsx](../../Q-Works/app/(app)/concessions/delete-sheet-button.tsx) | `DeleteConcessionSheetButton` (action, 추론) | product-local |
| [app/(app)/concessions/loading.tsx](../../Q-Works/app/(app)/concessions/loading.tsx) | `Loading` (feedback, 추론) | product-local |
| [app/(app)/concessions/new/loading.tsx](../../Q-Works/app/(app)/concessions/new/loading.tsx) | `Loading` (feedback, 추론) | product-local |
| [app/(app)/concessions/new/page.tsx](../../Q-Works/app/(app)/concessions/new/page.tsx) | `NewConcessionPage` (screen, 추론) | qd-class-reference |
| [app/(app)/concessions/page.tsx](../../Q-Works/app/(app)/concessions/page.tsx) | `ConcessionsPage` (screen, 추론) | qd-class-reference |
| [app/(app)/concessions/report-form.tsx](../../Q-Works/app/(app)/concessions/report-form.tsx) | `ConcessionReportForm` (composition, 추론) | qd-class-reference |
| [app/(app)/concessions/request-form.tsx](../../Q-Works/app/(app)/concessions/request-form.tsx) | `ConcessionRequestForm` (composition, 추론), `deptSelect` (field, 추론), `pick` (composition, 추론) | qd-class-reference |
| [app/(app)/concessions/work-panel.tsx](../../Q-Works/app/(app)/concessions/work-panel.tsx) | `ConcessionWorkPanel` (composition, 추론) | qd-class-reference |
| [app/(app)/context/context-sections.tsx](../../Q-Works/app/(app)/context/context-sections.tsx) | `ContextSections` (composition, 추론), `GroupRow` (data-display, 추론), `IssueSection` (layout, 추론), `PartySection` (layout, 추론), `ResultCount` (composition, 추론), `SearchBox` (composition, 추론), `SortTh` (composition, 추론) | qd-class-reference |
| [app/(app)/context/loading.tsx](../../Q-Works/app/(app)/context/loading.tsx) | `Loading` (feedback, 추론) | product-local |
| [app/(app)/context/page.tsx](../../Q-Works/app/(app)/context/page.tsx) | `ContextPage` (screen, 추론) | product-local |
| [app/(app)/contracts/[id]/decide-panel.tsx](../../Q-Works/app/(app)/contracts/%5Bid%5D/decide-panel.tsx) | `ContractDecidePanel` (composition, 추론) | qd-class-reference |
| [app/(app)/contracts/[id]/delete-contract-button.tsx](../../Q-Works/app/(app)/contracts/%5Bid%5D/delete-contract-button.tsx) | `DeleteContractButton` (action, 추론) | product-local |
| [app/(app)/contracts/[id]/edit/loading.tsx](../../Q-Works/app/(app)/contracts/%5Bid%5D/edit/loading.tsx) | `Loading` (feedback, 추론) | product-local |
| [app/(app)/contracts/[id]/edit/page.tsx](../../Q-Works/app/(app)/contracts/%5Bid%5D/edit/page.tsx) | `EditContractReviewPage` (screen, 추론) | product-local |
| [app/(app)/contracts/[id]/link-supplier.tsx](../../Q-Works/app/(app)/contracts/%5Bid%5D/link-supplier.tsx) | `LinkSupplierPanel` (composition, 추론) | product-local |
| [app/(app)/contracts/[id]/loading.tsx](../../Q-Works/app/(app)/contracts/%5Bid%5D/loading.tsx) | `Loading` (feedback, 추론) | product-local |
| [app/(app)/contracts/[id]/page.tsx](../../Q-Works/app/(app)/contracts/%5Bid%5D/page.tsx) | `Block` (composition, 추론), `ContractReviewDetailPage` (screen, 추론) | qd-class-reference |
| [app/(app)/contracts/[id]/print/[kind]/page.tsx](../../Q-Works/app/(app)/contracts/%5Bid%5D/print/%5Bkind%5D/page.tsx) | `ContractPrintPage` (document, 추론) | imports-canonical-module |
| [app/(app)/contracts/[id]/supplier-evaluation-link.tsx](../../Q-Works/app/(app)/contracts/%5Bid%5D/supplier-evaluation-link.tsx) | `SupplierEvaluationLink` (composition, 추론) | product-local |
| [app/(app)/contracts/approval-buttons.tsx](../../Q-Works/app/(app)/contracts/approval-buttons.tsx) | `ContractApprovalButtons` (composition, 추론) | qd-class-reference |
| [app/(app)/contracts/approval-flow.tsx](../../Q-Works/app/(app)/contracts/approval-flow.tsx) | `ContractApprovalFlow` (composition, 추론) | product-local |
| [app/(app)/contracts/contract-form.tsx](../../Q-Works/app/(app)/contracts/contract-form.tsx) | `ContractForm` (composition, 추론) | qd-class-reference |
| [app/(app)/contracts/contract-sheet.tsx](../../Q-Works/app/(app)/contracts/contract-sheet.tsx) | `ContractSheet` (document, 추론) | imports-canonical-module |
| [app/(app)/contracts/loading.tsx](../../Q-Works/app/(app)/contracts/loading.tsx) | `Loading` (feedback, 추론) | product-local |
| [app/(app)/contracts/new/loading.tsx](../../Q-Works/app/(app)/contracts/new/loading.tsx) | `Loading` (feedback, 추론) | product-local |
| [app/(app)/contracts/new/page.tsx](../../Q-Works/app/(app)/contracts/new/page.tsx) | `NewContractReviewPage` (screen, 추론) | product-local |
| [app/(app)/contracts/page.tsx](../../Q-Works/app/(app)/contracts/page.tsx) | `ContractsPage` (screen, 추론) | product-local |
| [app/(app)/contracts/reviews-section.tsx](../../Q-Works/app/(app)/contracts/reviews-section.tsx) | `ContractReviewsSection` (layout, 추론) | qd-class-reference |
| [app/(app)/customer/loading.tsx](../../Q-Works/app/(app)/customer/loading.tsx) | `Loading` (feedback, 추론) | product-local |
| [app/(app)/customer/page.tsx](../../Q-Works/app/(app)/customer/page.tsx) | `CustomerPage` (screen, 추론) | product-local |
| [app/(app)/customer/surveys/[id]/edit/loading.tsx](../../Q-Works/app/(app)/customer/surveys/%5Bid%5D/edit/loading.tsx) | `Loading` (feedback, 추론) | product-local |
| [app/(app)/customer/surveys/[id]/edit/page.tsx](../../Q-Works/app/(app)/customer/surveys/%5Bid%5D/edit/page.tsx) | `EditSurveyPage` (screen, 추론) | product-local |
| [app/(app)/customer/surveys/[id]/loading.tsx](../../Q-Works/app/(app)/customer/surveys/%5Bid%5D/loading.tsx) | `Loading` (feedback, 추론) | product-local |
| [app/(app)/customer/surveys/[id]/page.tsx](../../Q-Works/app/(app)/customer/surveys/%5Bid%5D/page.tsx) | `SurveyDetailPage` (screen, 추론) | qd-class-reference |
| [app/(app)/customer/surveys/new/loading.tsx](../../Q-Works/app/(app)/customer/surveys/new/loading.tsx) | `Loading` (feedback, 추론) | product-local |
| [app/(app)/customer/surveys/new/new-survey-form.tsx](../../Q-Works/app/(app)/customer/surveys/new/new-survey-form.tsx) | `NewSurveyForm` (composition, 추론) | product-local |
| [app/(app)/customer/surveys/new/page.tsx](../../Q-Works/app/(app)/customer/surveys/new/page.tsx) | `NewSurveyPage` (screen, 추론) | product-local |
| [app/(app)/dashboard/calendar-event-dialog.tsx](../../Q-Works/app/(app)/dashboard/calendar-event-dialog.tsx) | `DetailContent` (composition, 추론), `EventForm` (composition, 추론), `EventPill` (composition, 추론), `NewEventButton` (action, 추론) | product-local |
| [app/(app)/dashboard/calendar-hover-card.tsx](../../Q-Works/app/(app)/dashboard/calendar-hover-card.tsx) | `CalendarHoverCard` (composition, 추론) | product-local |
| [app/(app)/dashboard/day-dialog.tsx](../../Q-Works/app/(app)/dashboard/day-dialog.tsx) | `DayDialog` (overlay, 추론), `EventRow` (data-display, 추론) | qd-class-reference |
| [app/(app)/dashboard/dept-chips.tsx](../../Q-Works/app/(app)/dashboard/dept-chips.tsx) | `DeptChips` (composition, 추론) | product-local |
| [app/(app)/dashboard/loading.tsx](../../Q-Works/app/(app)/dashboard/loading.tsx) | `Loading` (feedback, 추론) | product-local |
| [app/(app)/dashboard/page.tsx](../../Q-Works/app/(app)/dashboard/page.tsx) | `DashboardPage` (screen, 추론) | qd-class-reference |
| [app/(app)/dashboard/schedule-calendar.tsx](../../Q-Works/app/(app)/dashboard/schedule-calendar.tsx) | `DayGrid` (layout, 추론), `MonthGrid` (layout, 추론), `Pill` (composition, 추론), `ScheduleCalendar` (field, 추론), `WeekGrid` (layout, 추론) | product-local |
| [app/(app)/design/[id]/doc-flow.tsx](../../Q-Works/app/(app)/design/%5Bid%5D/doc-flow.tsx) | `DesignDocFlow` (composition, 추론) | qd-class-reference |
| [app/(app)/design/[id]/loading.tsx](../../Q-Works/app/(app)/design/%5Bid%5D/loading.tsx) | `Loading` (feedback, 추론) | product-local |
| [app/(app)/design/[id]/page.tsx](../../Q-Works/app/(app)/design/%5Bid%5D/page.tsx) | `Block` (composition, 추론), `DesignProjectDetailPage` (screen, 추론), `Field` (field, 추론) | qd-class-reference |
| [app/(app)/design/[id]/plan-editor.tsx](../../Q-Works/app/(app)/design/%5Bid%5D/plan-editor.tsx) | `DesignPlanEditor` (field, 추론) | qd-class-reference |
| [app/(app)/design/[id]/stage-editor.tsx](../../Q-Works/app/(app)/design/%5Bid%5D/stage-editor.tsx) | `checkTable` (data-display, 추론), `DesignStageEditor` (field, 추론) | qd-class-reference |
| [app/(app)/design/[id]/stage-panel.tsx](../../Q-Works/app/(app)/design/%5Bid%5D/stage-panel.tsx) | `DesignStagePanel` (composition, 추론) | qd-class-reference |
| [app/(app)/design/approval-ui.tsx](../../Q-Works/app/(app)/design/approval-ui.tsx) | `DesignProposalButtons` (composition, 추론), `DesignProposalFlow` (composition, 추론) | qd-class-reference |
| [app/(app)/design/changes/[id]/decide-panel.tsx](../../Q-Works/app/(app)/design/changes/%5Bid%5D/decide-panel.tsx) | `DesignChangeDecidePanel` (composition, 추론) | qd-class-reference |
| [app/(app)/design/changes/[id]/loading.tsx](../../Q-Works/app/(app)/design/changes/%5Bid%5D/loading.tsx) | `Loading` (feedback, 추론) | product-local |
| [app/(app)/design/changes/[id]/page.tsx](../../Q-Works/app/(app)/design/changes/%5Bid%5D/page.tsx) | `DesignChangeDetailPage` (screen, 추론) | qd-class-reference |
| [app/(app)/design/changes/change-form.tsx](../../Q-Works/app/(app)/design/changes/change-form.tsx) | `DesignChangeForm` (composition, 추론) | qd-class-reference |
| [app/(app)/design/changes/changes-section.tsx](../../Q-Works/app/(app)/design/changes/changes-section.tsx) | `DesignChangesSection` (layout, 추론) | qd-class-reference |
| [app/(app)/design/changes/loading.tsx](../../Q-Works/app/(app)/design/changes/loading.tsx) | `Loading` (feedback, 추론) | product-local |
| [app/(app)/design/changes/new/page.tsx](../../Q-Works/app/(app)/design/changes/new/page.tsx) | `NewDesignChangePage` (screen, 추론) | product-local |
| [app/(app)/design/changes/page.tsx](../../Q-Works/app/(app)/design/changes/page.tsx) | `DesignChangesPage` (screen, 추론) | product-local |
| [app/(app)/design/loading.tsx](../../Q-Works/app/(app)/design/loading.tsx) | `Loading` (feedback, 추론) | product-local |
| [app/(app)/design/new/loading.tsx](../../Q-Works/app/(app)/design/new/loading.tsx) | `Loading` (feedback, 추론) | product-local |
| [app/(app)/design/new/page.tsx](../../Q-Works/app/(app)/design/new/page.tsx) | `NewDesignProjectPage` (screen, 추론) | product-local |
| [app/(app)/design/page.tsx](../../Q-Works/app/(app)/design/page.tsx) | `DesignPage` (screen, 추론) | qd-class-reference |
| [app/(app)/design/programs/[id]/delete-program-button.tsx](../../Q-Works/app/(app)/design/programs/%5Bid%5D/delete-program-button.tsx) | `DeleteProgramButton` (action, 추론) | product-local |
| [app/(app)/design/programs/[id]/edit/page.tsx](../../Q-Works/app/(app)/design/programs/%5Bid%5D/edit/page.tsx) | `EditRndProgramPage` (screen, 추론) | product-local |
| [app/(app)/design/programs/[id]/page.tsx](../../Q-Works/app/(app)/design/programs/%5Bid%5D/page.tsx) | `Line` (composition, 추론), `RndProgramDetailPage` (screen, 추론) | qd-class-reference |
| [app/(app)/design/programs/new/page.tsx](../../Q-Works/app/(app)/design/programs/new/page.tsx) | `NewRndProgramPage` (screen, 추론) | product-local |
| [app/(app)/design/programs/page.tsx](../../Q-Works/app/(app)/design/programs/page.tsx) | `RndProgramsPage` (screen, 추론) | product-local |
| [app/(app)/design/programs/program-form.tsx](../../Q-Works/app/(app)/design/programs/program-form.tsx) | `RndProgramForm` (composition, 추론) | qd-class-reference |
| [app/(app)/design/programs/programs-section.tsx](../../Q-Works/app/(app)/design/programs/programs-section.tsx) | `RndProgramsSection` (layout, 추론) | qd-class-reference |
| [app/(app)/design/proposal-approval.tsx](../../Q-Works/app/(app)/design/proposal-approval.tsx) | `DesignProposalApproval` (composition, 추론) | product-local |
| [app/(app)/design/proposal-form.tsx](../../Q-Works/app/(app)/design/proposal-form.tsx) | `DesignProposalForm` (composition, 추론) | qd-class-reference |
| [app/(app)/document-dispatch/[id]/loading.tsx](../../Q-Works/app/(app)/document-dispatch/%5Bid%5D/loading.tsx) | `Loading` (feedback, 추론) | product-local |
| [app/(app)/document-dispatch/[id]/page.tsx](../../Q-Works/app/(app)/document-dispatch/%5Bid%5D/page.tsx) | `DispatchRequestPage` (screen, 추론), `F` (composition, 추론), `RequestView` (composition, 추론) | qd-class-reference |
| [app/(app)/document-dispatch/[id]/print/loading.tsx](../../Q-Works/app/(app)/document-dispatch/%5Bid%5D/print/loading.tsx) | `Loading` (feedback, 추론) | product-local |
| [app/(app)/document-dispatch/[id]/print/page.tsx](../../Q-Works/app/(app)/document-dispatch/%5Bid%5D/print/page.tsx) | `DispatchRequestPrintPage` (document, 추론) | imports-canonical-module |
| [app/(app)/document-dispatch/[id]/report/page.tsx](../../Q-Works/app/(app)/document-dispatch/%5Bid%5D/report/page.tsx) | `DispatchReportPage` (screen, 추론), `ReportView` (composition, 추론) | qd-class-reference |
| [app/(app)/document-dispatch/[id]/report/print/loading.tsx](../../Q-Works/app/(app)/document-dispatch/%5Bid%5D/report/print/loading.tsx) | `Loading` (feedback, 추론) | product-local |
| [app/(app)/document-dispatch/[id]/report/print/page.tsx](../../Q-Works/app/(app)/document-dispatch/%5Bid%5D/report/print/page.tsx) | `DispatchReportPrintPage` (document, 추론) | imports-canonical-module |
| [app/(app)/document-dispatch/approval-ui.tsx](../../Q-Works/app/(app)/document-dispatch/approval-ui.tsx) | `DispatchApprovalActions` (action, 추론), `DispatchApprovalFlow` (composition, 추론) | qd-class-reference |
| [app/(app)/document-dispatch/delete-sheet-button.tsx](../../Q-Works/app/(app)/document-dispatch/delete-sheet-button.tsx) | `DeleteDispatchSheetButton` (action, 추론) | product-local |
| [app/(app)/document-dispatch/dispatch-sheets.tsx](../../Q-Works/app/(app)/document-dispatch/dispatch-sheets.tsx) | `DispatchReportSheet` (document, 추론), `DispatchRequestSheet` (composition, 추론) | imports-canonical-module |
| [app/(app)/document-dispatch/ledger-panel.tsx](../../Q-Works/app/(app)/document-dispatch/ledger-panel.tsx) | `DispatchLedgerPanel` (composition, 추론) | qd-class-reference |
| [app/(app)/document-dispatch/loading.tsx](../../Q-Works/app/(app)/document-dispatch/loading.tsx) | `Loading` (feedback, 추론) | product-local |
| [app/(app)/document-dispatch/new/loading.tsx](../../Q-Works/app/(app)/document-dispatch/new/loading.tsx) | `Loading` (feedback, 추론) | product-local |
| [app/(app)/document-dispatch/new/page.tsx](../../Q-Works/app/(app)/document-dispatch/new/page.tsx) | `NewDispatchRequestPage` (screen, 추론) | product-local |
| [app/(app)/document-dispatch/page.tsx](../../Q-Works/app/(app)/document-dispatch/page.tsx) | `DocumentDispatchPage` (screen, 추론) | qd-class-reference |
| [app/(app)/document-dispatch/report-form.tsx](../../Q-Works/app/(app)/document-dispatch/report-form.tsx) | `DispatchReportForm` (composition, 추론) | qd-class-reference |
| [app/(app)/document-dispatch/request-form.tsx](../../Q-Works/app/(app)/document-dispatch/request-form.tsx) | `DispatchRequestForm` (composition, 추론) | qd-class-reference |
| [app/(app)/documents/[id]/acknowledgement-panel.tsx](../../Q-Works/app/(app)/documents/%5Bid%5D/acknowledgement-panel.tsx) | `AcknowledgementPanel` (composition, 추론) | qd-class-reference |
| [app/(app)/documents/[id]/approval-chain-card.tsx](../../Q-Works/app/(app)/documents/%5Bid%5D/approval-chain-card.tsx) | `ApprovalChainCard` (composition, 추론) | qd-class-reference |
| [app/(app)/documents/[id]/approval-panel.tsx](../../Q-Works/app/(app)/documents/%5Bid%5D/approval-panel.tsx) | `ApprovalPanel` (composition, 추론), `ChainProgress` (feedback, 추론) | qd-class-reference |
| [app/(app)/documents/[id]/attachments-panel.tsx](../../Q-Works/app/(app)/documents/%5Bid%5D/attachments-panel.tsx) | `AttachmentsPanel` (composition, 추론) | qd-class-reference |
| [app/(app)/documents/[id]/compare/page.tsx](../../Q-Works/app/(app)/documents/%5Bid%5D/compare/page.tsx) | `CompareRevisionsPage` (screen, 추론) | qd-class-reference |
| [app/(app)/documents/[id]/delete-document-button.tsx](../../Q-Works/app/(app)/documents/%5Bid%5D/delete-document-button.tsx) | `DeleteDocumentButton` (action, 추론) | product-local |
| [app/(app)/documents/[id]/document-clause-field.tsx](../../Q-Works/app/(app)/documents/%5Bid%5D/document-clause-field.tsx) | `DocumentClauseField` (field, 추론) | qd-class-reference |
| [app/(app)/documents/[id]/document-department-field.tsx](../../Q-Works/app/(app)/documents/%5Bid%5D/document-department-field.tsx) | `DocumentDepartmentField` (field, 추론) | qd-class-reference |
| [app/(app)/documents/[id]/document-form-binding-field.tsx](../../Q-Works/app/(app)/documents/%5Bid%5D/document-form-binding-field.tsx) | `DocumentFormBindingField` (field, 추론) | qd-class-reference |
| [app/(app)/documents/[id]/document-lifecycle-field.tsx](../../Q-Works/app/(app)/documents/%5Bid%5D/document-lifecycle-field.tsx) | `DocumentLifecycleField` (field, 추론), `LifecycleReadRow` (data-display, 추론) | qd-class-reference |
| [app/(app)/documents/[id]/document-module-field.tsx](../../Q-Works/app/(app)/documents/%5Bid%5D/document-module-field.tsx) | `DocumentModuleField` (field, 추론) | qd-class-reference |
| [app/(app)/documents/[id]/loading.tsx](../../Q-Works/app/(app)/documents/%5Bid%5D/loading.tsx) | `Loading` (feedback, 추론) | product-local |
| [app/(app)/documents/[id]/meta-field-group.tsx](../../Q-Works/app/(app)/documents/%5Bid%5D/meta-field-group.tsx) | `MetaFieldGroup` (composition, 추론) | qd-class-reference |
| [app/(app)/documents/[id]/page.tsx](../../Q-Works/app/(app)/documents/%5Bid%5D/page.tsx) | `DocumentDetailPage` (screen, 추론), `MetaRow` (data-display, 추론) | qd-class-reference |
| [app/(app)/documents/[id]/print/page.tsx](../../Q-Works/app/(app)/documents/%5Bid%5D/print/page.tsx) | `PrintPage` (document, 추론), `renderNode` (document, 추론) | imports-canonical-module |
| [app/(app)/documents/[id]/print/print-button.tsx](../../Q-Works/app/(app)/documents/%5Bid%5D/print/print-button.tsx) | `PrintButton` (action, 추론) | product-local |
| [app/(app)/documents/[id]/relationships-panel.tsx](../../Q-Works/app/(app)/documents/%5Bid%5D/relationships-panel.tsx) | `RelationsBlock` (composition, 추론), `RelationshipsPanel` (composition, 추론) | qd-class-reference |
| [app/(app)/documents/distribution/[id]/dispose-button.tsx](../../Q-Works/app/(app)/documents/distribution/%5Bid%5D/dispose-button.tsx) | `DisposeButton` (action, 추론) | product-local |
| [app/(app)/documents/distribution/[id]/loading.tsx](../../Q-Works/app/(app)/documents/distribution/%5Bid%5D/loading.tsx) | `Loading` (feedback, 추론) | product-local |
| [app/(app)/documents/distribution/[id]/page.tsx](../../Q-Works/app/(app)/documents/distribution/%5Bid%5D/page.tsx) | `Line` (composition, 추론), `TransferDetailPage` (screen, 추론) | product-local |
| [app/(app)/documents/distribution/[id]/status-panel.tsx](../../Q-Works/app/(app)/documents/distribution/%5Bid%5D/status-panel.tsx) | `TransferStatusPanel` (composition, 추론) | qd-class-reference |
| [app/(app)/documents/distribution/[id]/transfer-edit-form.tsx](../../Q-Works/app/(app)/documents/distribution/%5Bid%5D/transfer-edit-form.tsx) | `TransferEditForm` (composition, 추론) | product-local |
| [app/(app)/documents/distribution/disposal-form.tsx](../../Q-Works/app/(app)/documents/distribution/disposal-form.tsx) | `DisposalForm` (composition, 추론) | qd-class-reference |
| [app/(app)/documents/distribution/disposals/[id]/disposal-edit-form.tsx](../../Q-Works/app/(app)/documents/distribution/disposals/%5Bid%5D/disposal-edit-form.tsx) | `DisposalEditForm` (composition, 추론) | product-local |
| [app/(app)/documents/distribution/disposals/[id]/loading.tsx](../../Q-Works/app/(app)/documents/distribution/disposals/%5Bid%5D/loading.tsx) | `Loading` (feedback, 추론) | product-local |
| [app/(app)/documents/distribution/disposals/[id]/page.tsx](../../Q-Works/app/(app)/documents/distribution/disposals/%5Bid%5D/page.tsx) | `DisposalDetailPage` (screen, 추론), `Line` (composition, 추론) | product-local |
| [app/(app)/documents/distribution/disposals/[id]/revoke-button.tsx](../../Q-Works/app/(app)/documents/distribution/disposals/%5Bid%5D/revoke-button.tsx) | `RevokeDisposalButton` (action, 추론) | product-local |
| [app/(app)/documents/distribution/import/import-panel.tsx](../../Q-Works/app/(app)/documents/distribution/import/import-panel.tsx) | `TransferImportPanel` (composition, 추론) | qd-class-reference |
| [app/(app)/documents/distribution/import/loading.tsx](../../Q-Works/app/(app)/documents/distribution/import/loading.tsx) | `Loading` (feedback, 추론) | product-local |
| [app/(app)/documents/distribution/import/page.tsx](../../Q-Works/app/(app)/documents/distribution/import/page.tsx) | `TransferImportPage` (screen, 추론) | product-local |
| [app/(app)/documents/distribution/page.tsx](../../Q-Works/app/(app)/documents/distribution/page.tsx) | `DistributionPage` (screen, 추론) | qd-class-reference |
| [app/(app)/documents/distribution/transfer-form.tsx](../../Q-Works/app/(app)/documents/distribution/transfer-form.tsx) | `TransferForm` (composition, 추론) | qd-class-reference |
| [app/(app)/documents/documents-list.tsx](../../Q-Works/app/(app)/documents/documents-list.tsx) | `DocumentsList` (data-display, 추론) | qd-class-reference |
| [app/(app)/documents/external/[id]/attachments-panel.tsx](../../Q-Works/app/(app)/documents/external/%5Bid%5D/attachments-panel.tsx) | `ExternalDocAttachmentsPanel` (composition, 추론) | qd-class-reference |
| [app/(app)/documents/external/[id]/delete-external-doc-button.tsx](../../Q-Works/app/(app)/documents/external/%5Bid%5D/delete-external-doc-button.tsx) | `DeleteExternalDocButton` (action, 추론) | product-local |
| [app/(app)/documents/external/[id]/edit/loading.tsx](../../Q-Works/app/(app)/documents/external/%5Bid%5D/edit/loading.tsx) | `Loading` (feedback, 추론) | product-local |
| [app/(app)/documents/external/[id]/edit/page.tsx](../../Q-Works/app/(app)/documents/external/%5Bid%5D/edit/page.tsx) | `EditExternalDocPage` (screen, 추론) | product-local |
| [app/(app)/documents/external/[id]/loading.tsx](../../Q-Works/app/(app)/documents/external/%5Bid%5D/loading.tsx) | `Loading` (feedback, 추론) | product-local |
| [app/(app)/documents/external/[id]/page.tsx](../../Q-Works/app/(app)/documents/external/%5Bid%5D/page.tsx) | `ExternalDocDetailPage` (screen, 추론), `Field` (field, 추론) | qd-class-reference |
| [app/(app)/documents/external/[id]/review-history.tsx](../../Q-Works/app/(app)/documents/external/%5Bid%5D/review-history.tsx) | `ExternalReviewHistory` (composition, 추론) | qd-class-reference |
| [app/(app)/documents/external/[id]/review-panel.tsx](../../Q-Works/app/(app)/documents/external/%5Bid%5D/review-panel.tsx) | `ExternalReviewPanel` (composition, 추론) | qd-class-reference |
| [app/(app)/documents/external/external-form.tsx](../../Q-Works/app/(app)/documents/external/external-form.tsx) | `ExternalDocForm` (composition, 추론) | qd-class-reference |
| [app/(app)/documents/external/new/loading.tsx](../../Q-Works/app/(app)/documents/external/new/loading.tsx) | `Loading` (feedback, 추론) | product-local |
| [app/(app)/documents/external/new/page.tsx](../../Q-Works/app/(app)/documents/external/new/page.tsx) | `NewExternalDocPage` (screen, 추론) | product-local |
| [app/(app)/documents/external/page.tsx](../../Q-Works/app/(app)/documents/external/page.tsx) | `ExternalDocsPage` (screen, 추론), `Sortable` (data-display, 추론) | qd-class-reference |
| [app/(app)/documents/forms/page.tsx](../../Q-Works/app/(app)/documents/forms/page.tsx) | `FormRow` (data-display, 추론), `FormsLibraryPage` (screen, 추론) | qd-class-reference |
| [app/(app)/documents/loading.tsx](../../Q-Works/app/(app)/documents/loading.tsx) | `Loading` (feedback, 추론) | product-local |
| [app/(app)/documents/new/loading.tsx](../../Q-Works/app/(app)/documents/new/loading.tsx) | `Loading` (feedback, 추론) | product-local |
| [app/(app)/documents/new/new-document-form.tsx](../../Q-Works/app/(app)/documents/new/new-document-form.tsx) | `NewDocumentForm` (composition, 추론) | qd-class-reference |
| [app/(app)/documents/new/page.tsx](../../Q-Works/app/(app)/documents/new/page.tsx) | `NewDocumentPage` (screen, 추론) | product-local |
| [app/(app)/documents/page.tsx](../../Q-Works/app/(app)/documents/page.tsx) | `DocumentsPage` (screen, 추론) | product-local |
| [app/(app)/documents/registers/loading.tsx](../../Q-Works/app/(app)/documents/registers/loading.tsx) | `Loading` (feedback, 추론) | product-local |
| [app/(app)/documents/registers/page.tsx](../../Q-Works/app/(app)/documents/registers/page.tsx) | `DocumentRegistersPage` (screen, 추론) | qd-class-reference |
| [app/(app)/documents/tree/document-hierarchy-tree.tsx](../../Q-Works/app/(app)/documents/tree/document-hierarchy-tree.tsx) | `DocumentHierarchyTree` (composition, 추론), `TreeNode` (composition, 추론) | product-local |
| [app/(app)/documents/tree/loading.tsx](../../Q-Works/app/(app)/documents/tree/loading.tsx) | `Loading` (feedback, 추론) | product-local |
| [app/(app)/documents/tree/page.tsx](../../Q-Works/app/(app)/documents/tree/page.tsx) | `DocumentsTreePage` (screen, 추론) | qd-class-reference |
| [app/(app)/drawings/[id]/delete-drawing-button.tsx](../../Q-Works/app/(app)/drawings/%5Bid%5D/delete-drawing-button.tsx) | `DeleteDrawingButton` (action, 추론) | product-local |
| [app/(app)/drawings/[id]/drawing-approval.tsx](../../Q-Works/app/(app)/drawings/%5Bid%5D/drawing-approval.tsx) | `DrawingApprovalActions` (action, 추론), `DrawingApprovalFlow` (composition, 추론) | qd-class-reference |
| [app/(app)/drawings/[id]/drawing-attachments.tsx](../../Q-Works/app/(app)/drawings/%5Bid%5D/drawing-attachments.tsx) | `AttachmentBox` (composition, 추론), `DrawingAttachments` (composition, 추론) | qd-class-reference |
| [app/(app)/drawings/[id]/drawing-panel.tsx](../../Q-Works/app/(app)/drawings/%5Bid%5D/drawing-panel.tsx) | `DrawingPanel` (composition, 추론) | qd-class-reference |
| [app/(app)/drawings/[id]/edit/page.tsx](../../Q-Works/app/(app)/drawings/%5Bid%5D/edit/page.tsx) | `EditDrawingPage` (screen, 추론) | product-local |
| [app/(app)/drawings/[id]/loading.tsx](../../Q-Works/app/(app)/drawings/%5Bid%5D/loading.tsx) | `Loading` (feedback, 추론) | product-local |
| [app/(app)/drawings/[id]/page.tsx](../../Q-Works/app/(app)/drawings/%5Bid%5D/page.tsx) | `DrawingDetailPage` (screen, 추론), `Field` (field, 추론) | qd-class-reference |
| [app/(app)/drawings/[id]/print/page.tsx](../../Q-Works/app/(app)/drawings/%5Bid%5D/print/page.tsx) | `DrawingPrintPage` (document, 추론) | imports-canonical-module |
| [app/(app)/drawings/drawing-form.tsx](../../Q-Works/app/(app)/drawings/drawing-form.tsx) | `DrawingForm` (composition, 추론), `PickBox` (composition, 추론) | qd-class-reference |
| [app/(app)/drawings/drawing-sheet.tsx](../../Q-Works/app/(app)/drawings/drawing-sheet.tsx) | `DrawingSheet` (document, 추론), `Sign` (document, 추론) | imports-canonical-module |
| [app/(app)/drawings/loading.tsx](../../Q-Works/app/(app)/drawings/loading.tsx) | `Loading` (feedback, 추론) | product-local |
| [app/(app)/drawings/new/page.tsx](../../Q-Works/app/(app)/drawings/new/page.tsx) | `NewDrawingPage` (screen, 추론) | product-local |
| [app/(app)/drawings/page.tsx](../../Q-Works/app/(app)/drawings/page.tsx) | `DrawingsPage` (screen, 추론) | qd-class-reference |
| [app/(app)/drawings/release-register.tsx](../../Q-Works/app/(app)/drawings/release-register.tsx) | `loadDrawingReleaseRegister` (composition, 추론), `sign` (composition, 추론) | qd-class-reference |
| [app/(app)/environmental/aspects/new/new-aspect-form.tsx](../../Q-Works/app/(app)/environmental/aspects/new/new-aspect-form.tsx) | `NewAspectForm` (composition, 추론) | qd-class-reference |
| [app/(app)/environmental/aspects/new/page.tsx](../../Q-Works/app/(app)/environmental/aspects/new/page.tsx) | `NewAspectPage` (screen, 추론) | product-local |
| [app/(app)/environmental/legal/new/new-legal-form.tsx](../../Q-Works/app/(app)/environmental/legal/new/new-legal-form.tsx) | `NewLegalForm` (composition, 추론) | product-local |
| [app/(app)/environmental/legal/new/page.tsx](../../Q-Works/app/(app)/environmental/legal/new/page.tsx) | `NewLegalPage` (screen, 추론) | product-local |
| [app/(app)/environmental/page.tsx](../../Q-Works/app/(app)/environmental/page.tsx) | `EnvironmentalPage` (screen, 추론) | qd-class-reference |
| [app/(app)/equipment/[id]/calibration-panel.tsx](../../Q-Works/app/(app)/equipment/%5Bid%5D/calibration-panel.tsx) | `CalibrationPanel` (composition, 추론) | qd-class-reference |
| [app/(app)/equipment/[id]/delete-equipment-button.tsx](../../Q-Works/app/(app)/equipment/%5Bid%5D/delete-equipment-button.tsx) | `DeleteEquipmentButton` (action, 추론) | product-local |
| [app/(app)/equipment/[id]/edit/page.tsx](../../Q-Works/app/(app)/equipment/%5Bid%5D/edit/page.tsx) | `EditEquipmentPage` (screen, 추론) | product-local |
| [app/(app)/equipment/[id]/loading.tsx](../../Q-Works/app/(app)/equipment/%5Bid%5D/loading.tsx) | `Loading` (feedback, 추론) | product-local |
| [app/(app)/equipment/[id]/page.tsx](../../Q-Works/app/(app)/equipment/%5Bid%5D/page.tsx) | `EquipmentDetailPage` (screen, 추론) | qd-class-reference |
| [app/(app)/equipment/equipment-form.tsx](../../Q-Works/app/(app)/equipment/equipment-form.tsx) | `EquipmentForm` (composition, 추론) | product-local |
| [app/(app)/equipment/loading.tsx](../../Q-Works/app/(app)/equipment/loading.tsx) | `Loading` (feedback, 추론) | product-local |
| [app/(app)/equipment/new/loading.tsx](../../Q-Works/app/(app)/equipment/new/loading.tsx) | `Loading` (feedback, 추론) | product-local |
| [app/(app)/equipment/new/page.tsx](../../Q-Works/app/(app)/equipment/new/page.tsx) | `NewEquipmentPage` (screen, 추론) | product-local |
| [app/(app)/equipment/page.tsx](../../Q-Works/app/(app)/equipment/page.tsx) | `EquipmentPage` (screen, 추론) | qd-class-reference |
| [app/(app)/factory/loading.tsx](../../Q-Works/app/(app)/factory/loading.tsx) | `Loading` (feedback, 추론) | product-local |
| [app/(app)/factory/page.tsx](../../Q-Works/app/(app)/factory/page.tsx) | `FactoryPage` (screen, 추론), `OeeBlock` (composition, 추론) | qd-class-reference |
| [app/(app)/help/loading.tsx](../../Q-Works/app/(app)/help/loading.tsx) | `Loading` (feedback, 추론) | product-local |
| [app/(app)/help/page.tsx](../../Q-Works/app/(app)/help/page.tsx) | `HelpBlock` (composition, 추론), `HelpPage` (screen, 추론), `renderInline` (composition, 추론) | qd-class-reference |
| [app/(app)/improvements/[id]/delete-improvement-button.tsx](../../Q-Works/app/(app)/improvements/%5Bid%5D/delete-improvement-button.tsx) | `DeleteImprovementButton` (action, 추론) | product-local |
| [app/(app)/improvements/[id]/edit/loading.tsx](../../Q-Works/app/(app)/improvements/%5Bid%5D/edit/loading.tsx) | `Loading` (feedback, 추론) | product-local |
| [app/(app)/improvements/[id]/edit/page.tsx](../../Q-Works/app/(app)/improvements/%5Bid%5D/edit/page.tsx) | `EditImprovementPage` (screen, 추론) | product-local |
| [app/(app)/improvements/[id]/improvement-panel.tsx](../../Q-Works/app/(app)/improvements/%5Bid%5D/improvement-panel.tsx) | `ImprovementProgressPanel` (composition, 추론), `ImprovementReviewPanel` (composition, 추론) | qd-class-reference |
| [app/(app)/improvements/[id]/loading.tsx](../../Q-Works/app/(app)/improvements/%5Bid%5D/loading.tsx) | `Loading` (feedback, 추론) | product-local |
| [app/(app)/improvements/[id]/page.tsx](../../Q-Works/app/(app)/improvements/%5Bid%5D/page.tsx) | `Block` (composition, 추론), `Cell` (composition, 추론), `ImprovementDetailPage` (screen, 추론) | qd-class-reference |
| [app/(app)/improvements/[id]/print/page.tsx](../../Q-Works/app/(app)/improvements/%5Bid%5D/print/page.tsx) | `ImprovementPrintPage` (document, 추론) | imports-canonical-module |
| [app/(app)/improvements/[id]/report/page.tsx](../../Q-Works/app/(app)/improvements/%5Bid%5D/report/page.tsx) | `ImprovementReportPage` (screen, 추론) | imports-canonical-module |
| [app/(app)/improvements/[id]/report/print/page.tsx](../../Q-Works/app/(app)/improvements/%5Bid%5D/report/print/page.tsx) | `ImprovementReportPrintPage` (document, 추론) | imports-canonical-module |
| [app/(app)/improvements/[id]/report/report-form.tsx](../../Q-Works/app/(app)/improvements/%5Bid%5D/report/report-form.tsx) | `ImprovementReportForm` (composition, 추론) | qd-class-reference |
| [app/(app)/improvements/approval-buttons.tsx](../../Q-Works/app/(app)/improvements/approval-buttons.tsx) | `ImprovementApprovalButtons` (composition, 추론) | qd-class-reference |
| [app/(app)/improvements/approval-flow.tsx](../../Q-Works/app/(app)/improvements/approval-flow.tsx) | `ImprovementApprovalFlow` (composition, 추론) | product-local |
| [app/(app)/improvements/improvement-attachments.tsx](../../Q-Works/app/(app)/improvements/improvement-attachments.tsx) | `ImprovementAttachments` (composition, 추론) | qd-class-reference |
| [app/(app)/improvements/improvement-form.tsx](../../Q-Works/app/(app)/improvements/improvement-form.tsx) | `ImprovementForm` (composition, 추론) | qd-class-reference |
| [app/(app)/improvements/improvement-sheet.tsx](../../Q-Works/app/(app)/improvements/improvement-sheet.tsx) | `ImprovementSheet` (document, 추론) | imports-canonical-module |
| [app/(app)/improvements/loading.tsx](../../Q-Works/app/(app)/improvements/loading.tsx) | `Loading` (feedback, 추론) | product-local |
| [app/(app)/improvements/new/loading.tsx](../../Q-Works/app/(app)/improvements/new/loading.tsx) | `Loading` (feedback, 추론) | product-local |
| [app/(app)/improvements/new/page.tsx](../../Q-Works/app/(app)/improvements/new/page.tsx) | `NewImprovementPage` (screen, 추론) | product-local |
| [app/(app)/improvements/page.tsx](../../Q-Works/app/(app)/improvements/page.tsx) | `ImprovementsPage` (screen, 추론) | qd-class-reference |
| [app/(app)/improvements/register-summary.tsx](../../Q-Works/app/(app)/improvements/register-summary.tsx) | `ImprovementRegisterSummary` (data-display, 추론) | product-local |
| [app/(app)/improvements/report-sheet-view.tsx](../../Q-Works/app/(app)/improvements/report-sheet-view.tsx) | `ImprovementReportSheet` (document, 추론) | imports-canonical-module |
| [app/(app)/inbound/[id]/delete-inbound-button.tsx](../../Q-Works/app/(app)/inbound/%5Bid%5D/delete-inbound-button.tsx) | `DeleteInboundButton` (action, 추론) | product-local |
| [app/(app)/inbound/[id]/edit/page.tsx](../../Q-Works/app/(app)/inbound/%5Bid%5D/edit/page.tsx) | `EditInboundPage` (screen, 추론) | product-local |
| [app/(app)/inbound/[id]/escalate-to-complaint-dialog.tsx](../../Q-Works/app/(app)/inbound/%5Bid%5D/escalate-to-complaint-dialog.tsx) | `EscalateToComplaintDialog` (overlay, 추론) | product-local |
| [app/(app)/inbound/[id]/loading.tsx](../../Q-Works/app/(app)/inbound/%5Bid%5D/loading.tsx) | `Loading` (feedback, 추론) | product-local |
| [app/(app)/inbound/[id]/page.tsx](../../Q-Works/app/(app)/inbound/%5Bid%5D/page.tsx) | `InboundDetailPage` (screen, 추론), `Line` (composition, 추론) | qd-class-reference |
| [app/(app)/inbound/[id]/photo-gallery.tsx](../../Q-Works/app/(app)/inbound/%5Bid%5D/photo-gallery.tsx) | `InboundPhotoGallery` (composition, 추론) | product-local |
| [app/(app)/inbound/import/import-panel.tsx](../../Q-Works/app/(app)/inbound/import/import-panel.tsx) | `InboundImportPanel` (composition, 추론) | qd-class-reference |
| [app/(app)/inbound/import/loading.tsx](../../Q-Works/app/(app)/inbound/import/loading.tsx) | `Loading` (feedback, 추론) | product-local |
| [app/(app)/inbound/import/page.tsx](../../Q-Works/app/(app)/inbound/import/page.tsx) | `InboundImportPage` (screen, 추론) | product-local |
| [app/(app)/inbound/inbound-form.tsx](../../Q-Works/app/(app)/inbound/inbound-form.tsx) | `InboundForm` (composition, 추론) | qd-class-reference |
| [app/(app)/inbound/loading.tsx](../../Q-Works/app/(app)/inbound/loading.tsx) | `Loading` (feedback, 추론) | product-local |
| [app/(app)/inbound/new/loading.tsx](../../Q-Works/app/(app)/inbound/new/loading.tsx) | `Loading` (feedback, 추론) | product-local |
| [app/(app)/inbound/new/page.tsx](../../Q-Works/app/(app)/inbound/new/page.tsx) | `NewInboundPage` (screen, 추론) | product-local |
| [app/(app)/inbound/page.tsx](../../Q-Works/app/(app)/inbound/page.tsx) | `InboundPage` (screen, 추론) | qd-class-reference |
| [app/(app)/inbound/photo-field.tsx](../../Q-Works/app/(app)/inbound/photo-field.tsx) | `InboundPhotoField` (field, 추론) | qd-class-reference |
| [app/(app)/inspections/[id]/assign-panel.tsx](../../Q-Works/app/(app)/inspections/%5Bid%5D/assign-panel.tsx) | `InspectionAssignPanel` (composition, 추론) | qd-class-reference |
| [app/(app)/inspections/[id]/delete-inspection-button.tsx](../../Q-Works/app/(app)/inspections/%5Bid%5D/delete-inspection-button.tsx) | `DeleteInspectionButton` (action, 추론) | product-local |
| [app/(app)/inspections/[id]/judge-panel.tsx](../../Q-Works/app/(app)/inspections/%5Bid%5D/judge-panel.tsx) | `InspectionJudgePanel` (composition, 추론) | qd-class-reference |
| [app/(app)/inspections/[id]/link-panel.tsx](../../Q-Works/app/(app)/inspections/%5Bid%5D/link-panel.tsx) | `InspectionLinkPanel` (composition, 추론) | qd-class-reference |
| [app/(app)/inspections/[id]/loading.tsx](../../Q-Works/app/(app)/inspections/%5Bid%5D/loading.tsx) | `Loading` (feedback, 추론) | product-local |
| [app/(app)/inspections/[id]/page.tsx](../../Q-Works/app/(app)/inspections/%5Bid%5D/page.tsx) | `Field` (field, 추론), `InspectionDetailPage` (screen, 추론) | qd-class-reference |
| [app/(app)/inspections/[id]/print/page.tsx](../../Q-Works/app/(app)/inspections/%5Bid%5D/print/page.tsx) | `InspectionPrintPage` (document, 추론) | imports-canonical-module |
| [app/(app)/inspections/[id]/sampling-panel.tsx](../../Q-Works/app/(app)/inspections/%5Bid%5D/sampling-panel.tsx) | `InspectionSamplingPanel` (composition, 추론), `Stat` (data-display, 추론) | qd-class-reference |
| [app/(app)/inspections/final/loading.tsx](../../Q-Works/app/(app)/inspections/final/loading.tsx) | `Loading` (feedback, 추론) | product-local |
| [app/(app)/inspections/final/page.tsx](../../Q-Works/app/(app)/inspections/final/page.tsx) | `FinalInspectionPage` (screen, 추론) | product-local |
| [app/(app)/inspections/history-table.tsx](../../Q-Works/app/(app)/inspections/history-table.tsx) | `HistoryTable` (data-display, 추론), `Th` (composition, 추론) | qd-class-reference |
| [app/(app)/inspections/incoming/loading.tsx](../../Q-Works/app/(app)/inspections/incoming/loading.tsx) | `Loading` (feedback, 추론) | product-local |
| [app/(app)/inspections/incoming/page.tsx](../../Q-Works/app/(app)/inspections/incoming/page.tsx) | `IncomingInspectionPage` (screen, 추론) | product-local |
| [app/(app)/inspections/inspect-dialog.tsx](../../Q-Works/app/(app)/inspections/inspect-dialog.tsx) | `InspectDialog` (overlay, 추론), `Stat` (data-display, 추론) | qd-class-reference |
| [app/(app)/inspections/loading.tsx](../../Q-Works/app/(app)/inspections/loading.tsx) | `Loading` (feedback, 추론) | product-local |
| [app/(app)/inspections/new/loading.tsx](../../Q-Works/app/(app)/inspections/new/loading.tsx) | `Loading` (feedback, 추론) | product-local |
| [app/(app)/inspections/new/new-inspection-form.tsx](../../Q-Works/app/(app)/inspections/new/new-inspection-form.tsx) | `NewInspectionForm` (composition, 추론) | qd-class-reference |
| [app/(app)/inspections/new/page.tsx](../../Q-Works/app/(app)/inspections/new/page.tsx) | `NewInspectionPage` (screen, 추론) | product-local |
| [app/(app)/inspections/page.tsx](../../Q-Works/app/(app)/inspections/page.tsx) | `InspectionsPage` (screen, 추론) | qd-class-reference |
| [app/(app)/inspections/print/loading.tsx](../../Q-Works/app/(app)/inspections/print/loading.tsx) | `Loading` (feedback, 추론) | product-local |
| [app/(app)/inspections/print/page.tsx](../../Q-Works/app/(app)/inspections/print/page.tsx) | `F` (document, 추론), `InspectionPrintPage` (document, 추론), `TblId` (document, 추론) | qd-class-reference |
| [app/(app)/inspections/process/loading.tsx](../../Q-Works/app/(app)/inspections/process/loading.tsx) | `Loading` (feedback, 추론) | product-local |
| [app/(app)/inspections/process/page.tsx](../../Q-Works/app/(app)/inspections/process/page.tsx) | `ProcessInspectionPage` (screen, 추론) | product-local |
| [app/(app)/inspections/queue-screen.tsx](../../Q-Works/app/(app)/inspections/queue-screen.tsx) | `InspectionQueueScreen` (screen, 추론) | qd-class-reference |
| [app/(app)/inspections/queue-table.tsx](../../Q-Works/app/(app)/inspections/queue-table.tsx) | `InspectionQueueTable` (data-display, 추론), `Th` (composition, 추론) | qd-class-reference |
| [app/(app)/inspections/sample-matrix.tsx](../../Q-Works/app/(app)/inspections/sample-matrix.tsx) | `SampleMatrix` (composition, 추론) | product-local |
| [app/(app)/inventory/loading.tsx](../../Q-Works/app/(app)/inventory/loading.tsx) | `Loading` (feedback, 추론) | product-local |
| [app/(app)/inventory/moves/loading.tsx](../../Q-Works/app/(app)/inventory/moves/loading.tsx) | `Loading` (feedback, 추론) | product-local |
| [app/(app)/inventory/moves/page.tsx](../../Q-Works/app/(app)/inventory/moves/page.tsx) | `InventoryMovesPage` (screen, 추론) | qd-class-reference |
| [app/(app)/inventory/new/loading.tsx](../../Q-Works/app/(app)/inventory/new/loading.tsx) | `Loading` (feedback, 추론) | product-local |
| [app/(app)/inventory/new/new-movement-form.tsx](../../Q-Works/app/(app)/inventory/new/new-movement-form.tsx) | `NewMovementForm` (composition, 추론) | qd-class-reference |
| [app/(app)/inventory/new/page.tsx](../../Q-Works/app/(app)/inventory/new/page.tsx) | `NewMovementPage` (screen, 추론) | product-local |
| [app/(app)/inventory/page.tsx](../../Q-Works/app/(app)/inventory/page.tsx) | `InventoryPage` (screen, 추론) | qd-class-reference |
| [app/(app)/knowledge/[id]/delete-knowledge-button.tsx](../../Q-Works/app/(app)/knowledge/%5Bid%5D/delete-knowledge-button.tsx) | `DeleteKnowledgeButton` (action, 추론) | product-local |
| [app/(app)/knowledge/[id]/loading.tsx](../../Q-Works/app/(app)/knowledge/%5Bid%5D/loading.tsx) | `Loading` (feedback, 추론) | product-local |
| [app/(app)/knowledge/[id]/page.tsx](../../Q-Works/app/(app)/knowledge/%5Bid%5D/page.tsx) | `KnowledgeDetailPage` (screen, 추론) | product-local |
| [app/(app)/knowledge/knowledge-attachments.tsx](../../Q-Works/app/(app)/knowledge/knowledge-attachments.tsx) | `KnowledgeAttachments` (composition, 추론) | qd-class-reference |
| [app/(app)/knowledge/knowledge-form.tsx](../../Q-Works/app/(app)/knowledge/knowledge-form.tsx) | `KnowledgeForm` (composition, 추론) | qd-class-reference |
| [app/(app)/knowledge/loading.tsx](../../Q-Works/app/(app)/knowledge/loading.tsx) | `Loading` (feedback, 추론) | product-local |
| [app/(app)/knowledge/new/loading.tsx](../../Q-Works/app/(app)/knowledge/new/loading.tsx) | `Loading` (feedback, 추론) | product-local |
| [app/(app)/knowledge/new/page.tsx](../../Q-Works/app/(app)/knowledge/new/page.tsx) | `NewKnowledgePage` (screen, 추론) | product-local |
| [app/(app)/knowledge/page.tsx](../../Q-Works/app/(app)/knowledge/page.tsx) | `KnowledgePage` (screen, 추론) | qd-class-reference |
| [app/(app)/kpi/[id]/delete-kpi-button.tsx](../../Q-Works/app/(app)/kpi/%5Bid%5D/delete-kpi-button.tsx) | `DeleteKpiButton` (action, 추론) | product-local |
| [app/(app)/kpi/[id]/edit/loading.tsx](../../Q-Works/app/(app)/kpi/%5Bid%5D/edit/loading.tsx) | `Loading` (feedback, 추론) | product-local |
| [app/(app)/kpi/[id]/edit/page.tsx](../../Q-Works/app/(app)/kpi/%5Bid%5D/edit/page.tsx) | `EditKpiPage` (screen, 추론) | product-local |
| [app/(app)/kpi/[id]/loading.tsx](../../Q-Works/app/(app)/kpi/%5Bid%5D/loading.tsx) | `Loading` (feedback, 추론) | product-local |
| [app/(app)/kpi/[id]/objective-panel.tsx](../../Q-Works/app/(app)/kpi/%5Bid%5D/objective-panel.tsx) | `KpiObjectivePanel` (composition, 추론) | qd-class-reference |
| [app/(app)/kpi/[id]/page.tsx](../../Q-Works/app/(app)/kpi/%5Bid%5D/page.tsx) | `KpiDetailPage` (screen, 추론), `ObjField` (field, 추론) | qd-class-reference |
| [app/(app)/kpi/[id]/period-chart.tsx](../../Q-Works/app/(app)/kpi/%5Bid%5D/period-chart.tsx) | `KpiPeriodChart` (chart, 추론) | qd-class-reference |
| [app/(app)/kpi/[id]/print/page.tsx](../../Q-Works/app/(app)/kpi/%5Bid%5D/print/page.tsx) | `KpiPrintPage` (document, 추론) | imports-canonical-module |
| [app/(app)/kpi/[id]/tier-legend.tsx](../../Q-Works/app/(app)/kpi/%5Bid%5D/tier-legend.tsx) | `KpiTierLegend` (composition, 추론) | product-local |
| [app/(app)/kpi/[id]/trend-chart.tsx](../../Q-Works/app/(app)/kpi/%5Bid%5D/trend-chart.tsx) | `KpiTrendChart` (chart, 추론) | qd-class-reference |
| [app/(app)/kpi/[id]/value-history.tsx](../../Q-Works/app/(app)/kpi/%5Bid%5D/value-history.tsx) | `KpiValueHistory` (composition, 추론) | product-local |
| [app/(app)/kpi/[id]/value-panel.tsx](../../Q-Works/app/(app)/kpi/%5Bid%5D/value-panel.tsx) | `KpiValuePanel` (composition, 추론) | qd-class-reference |
| [app/(app)/kpi/evaluations/[id]/checklist/loading.tsx](../../Q-Works/app/(app)/kpi/evaluations/%5Bid%5D/checklist/loading.tsx) | `Loading` (feedback, 추론) | product-local |
| [app/(app)/kpi/evaluations/[id]/checklist/page.tsx](../../Q-Works/app/(app)/kpi/evaluations/%5Bid%5D/checklist/page.tsx) | `ChecklistPage` (screen, 추론) | imports-canonical-module |
| [app/(app)/kpi/evaluations/[id]/checklist/print/loading.tsx](../../Q-Works/app/(app)/kpi/evaluations/%5Bid%5D/checklist/print/loading.tsx) | `Loading` (feedback, 추론) | product-local |
| [app/(app)/kpi/evaluations/[id]/checklist/print/page.tsx](../../Q-Works/app/(app)/kpi/evaluations/%5Bid%5D/checklist/print/page.tsx) | `MonitoringChecklistPrintPage` (document, 추론) | imports-canonical-module |
| [app/(app)/kpi/evaluations/[id]/delete-plan-button.tsx](../../Q-Works/app/(app)/kpi/evaluations/%5Bid%5D/delete-plan-button.tsx) | `DeletePlanButton` (action, 추론) | product-local |
| [app/(app)/kpi/evaluations/[id]/loading.tsx](../../Q-Works/app/(app)/kpi/evaluations/%5Bid%5D/loading.tsx) | `Loading` (feedback, 추론) | product-local |
| [app/(app)/kpi/evaluations/[id]/page.tsx](../../Q-Works/app/(app)/kpi/evaluations/%5Bid%5D/page.tsx) | `MonitoringPlanPage` (screen, 추론) | imports-canonical-module |
| [app/(app)/kpi/evaluations/[id]/print/page.tsx](../../Q-Works/app/(app)/kpi/evaluations/%5Bid%5D/print/page.tsx) | `MonitoringPlanPrintPage` (document, 추론) | imports-canonical-module |
| [app/(app)/kpi/evaluations/[id]/report/page.tsx](../../Q-Works/app/(app)/kpi/evaluations/%5Bid%5D/report/page.tsx) | `MonitoringReportPage` (screen, 추론) | imports-canonical-module |
| [app/(app)/kpi/evaluations/[id]/report/print/page.tsx](../../Q-Works/app/(app)/kpi/evaluations/%5Bid%5D/report/print/page.tsx) | `MonitoringReportPrintPage` (document, 추론) | imports-canonical-module |
| [app/(app)/kpi/evaluations/approval-buttons.tsx](../../Q-Works/app/(app)/kpi/evaluations/approval-buttons.tsx) | `MonitoringApprovalButtons` (composition, 추론) | qd-class-reference |
| [app/(app)/kpi/evaluations/approval-flow.tsx](../../Q-Works/app/(app)/kpi/evaluations/approval-flow.tsx) | `MonitoringApprovalFlow` (composition, 추론) | product-local |
| [app/(app)/kpi/evaluations/checklist-form.tsx](../../Q-Works/app/(app)/kpi/evaluations/checklist-form.tsx) | `ChecklistForm` (composition, 추론), `CustomItemsTable` (data-display, 추론), `VerdictSummaryTable` (data-display, 추론) | qd-class-reference |
| [app/(app)/kpi/evaluations/checklist-sheet.tsx](../../Q-Works/app/(app)/kpi/evaluations/checklist-sheet.tsx) | `MonitoringChecklistSheet` (document, 추론) | imports-canonical-module |
| [app/(app)/kpi/evaluations/evaluation-list.tsx](../../Q-Works/app/(app)/kpi/evaluations/evaluation-list.tsx) | `MonitoringEvaluationList` (data-display, 추론) | qd-class-reference |
| [app/(app)/kpi/evaluations/loading.tsx](../../Q-Works/app/(app)/kpi/evaluations/loading.tsx) | `Loading` (feedback, 추론) | product-local |
| [app/(app)/kpi/evaluations/monitoring-sheets.tsx](../../Q-Works/app/(app)/kpi/evaluations/monitoring-sheets.tsx) | `MonitoringPlanSheet` (composition, 추론), `MonitoringReportSheet` (document, 추론) | imports-canonical-module |
| [app/(app)/kpi/evaluations/new/loading.tsx](../../Q-Works/app/(app)/kpi/evaluations/new/loading.tsx) | `Loading` (feedback, 추론) | product-local |
| [app/(app)/kpi/evaluations/new/page.tsx](../../Q-Works/app/(app)/kpi/evaluations/new/page.tsx) | `NewMonitoringPlanPage` (screen, 추론) | product-local |
| [app/(app)/kpi/evaluations/next-sheets.tsx](../../Q-Works/app/(app)/kpi/evaluations/next-sheets.tsx) | `Card` (layout, 추론), `NextSheets` (composition, 추론) | product-local |
| [app/(app)/kpi/evaluations/page.tsx](../../Q-Works/app/(app)/kpi/evaluations/page.tsx) | `MonitoringEvaluationsPage` (screen, 추론) | product-local |
| [app/(app)/kpi/evaluations/plan-form.tsx](../../Q-Works/app/(app)/kpi/evaluations/plan-form.tsx) | `MonitoringPlanForm` (composition, 추론) | qd-class-reference |
| [app/(app)/kpi/evaluations/report-form.tsx](../../Q-Works/app/(app)/kpi/evaluations/report-form.tsx) | `MonitoringReportForm` (composition, 추론) | qd-class-reference |
| [app/(app)/kpi/evaluations/sheet-flow.tsx](../../Q-Works/app/(app)/kpi/evaluations/sheet-flow.tsx) | `MonitoringSheetFlow` (composition, 추론) | product-local |
| [app/(app)/kpi/evaluations/sheet-header-fields.tsx](../../Q-Works/app/(app)/kpi/evaluations/sheet-header-fields.tsx) | `SheetHeaderFields` (composition, 추론) | qd-class-reference |
| [app/(app)/kpi/evaluations/start-next-sheet-button.tsx](../../Q-Works/app/(app)/kpi/evaluations/start-next-sheet-button.tsx) | `StartNextSheetButton` (action, 추론) | product-local |
| [app/(app)/kpi/evaluations/start-plan-buttons.tsx](../../Q-Works/app/(app)/kpi/evaluations/start-plan-buttons.tsx) | `StartPlanButton` (action, 추론) | product-local |
| [app/(app)/kpi/loading.tsx](../../Q-Works/app/(app)/kpi/loading.tsx) | `Loading` (feedback, 추론) | product-local |
| [app/(app)/kpi/new/loading.tsx](../../Q-Works/app/(app)/kpi/new/loading.tsx) | `Loading` (feedback, 추론) | product-local |
| [app/(app)/kpi/new/new-kpi-form.tsx](../../Q-Works/app/(app)/kpi/new/new-kpi-form.tsx) | `NewKpiForm` (composition, 추론) | qd-class-reference |
| [app/(app)/kpi/new/page.tsx](../../Q-Works/app/(app)/kpi/new/page.tsx) | `NewKpiPage` (screen, 추론) | product-local |
| [app/(app)/kpi/page.tsx](../../Q-Works/app/(app)/kpi/page.tsx) | `KpiPage` (screen, 추론) | product-local |
| [app/(app)/layout.tsx](../../Q-Works/app/(app)/layout.tsx) | `AppLayout` (layout, 추론) | imports-canonical-module |
| [app/(app)/meetings/[id]/delete-meeting-button.tsx](../../Q-Works/app/(app)/meetings/%5Bid%5D/delete-meeting-button.tsx) | `DeleteMeetingButton` (action, 추론) | product-local |
| [app/(app)/meetings/[id]/loading.tsx](../../Q-Works/app/(app)/meetings/%5Bid%5D/loading.tsx) | `Loading` (feedback, 추론) | product-local |
| [app/(app)/meetings/[id]/meeting-approval-actions.tsx](../../Q-Works/app/(app)/meetings/%5Bid%5D/meeting-approval-actions.tsx) | `MeetingApprovalActions` (action, 추론) | qd-class-reference |
| [app/(app)/meetings/[id]/meeting-approval-flow.tsx](../../Q-Works/app/(app)/meetings/%5Bid%5D/meeting-approval-flow.tsx) | `MeetingApprovalFlow` (composition, 추론) | product-local |
| [app/(app)/meetings/[id]/meeting-attendance.tsx](../../Q-Works/app/(app)/meetings/%5Bid%5D/meeting-attendance.tsx) | `MeetingAttendance` (composition, 추론) | product-local |
| [app/(app)/meetings/[id]/meeting-sheet.tsx](../../Q-Works/app/(app)/meetings/%5Bid%5D/meeting-sheet.tsx) | `MeetingSheet` (document, 추론), `secCell` (document, 추론) | imports-canonical-module |
| [app/(app)/meetings/[id]/page.tsx](../../Q-Works/app/(app)/meetings/%5Bid%5D/page.tsx) | `MeetingDetailPage` (screen, 추론) | imports-canonical-module |
| [app/(app)/meetings/[id]/print/page.tsx](../../Q-Works/app/(app)/meetings/%5Bid%5D/print/page.tsx) | `MeetingPrintPage` (document, 추론) | imports-canonical-module |
| [app/(app)/meetings/loading.tsx](../../Q-Works/app/(app)/meetings/loading.tsx) | `Loading` (feedback, 추론) | product-local |
| [app/(app)/meetings/meeting-form.tsx](../../Q-Works/app/(app)/meetings/meeting-form.tsx) | `MeetingForm` (composition, 추론) | qd-class-reference |
| [app/(app)/meetings/new/loading.tsx](../../Q-Works/app/(app)/meetings/new/loading.tsx) | `Loading` (feedback, 추론) | product-local |
| [app/(app)/meetings/new/page.tsx](../../Q-Works/app/(app)/meetings/new/page.tsx) | `NewMeetingPage` (screen, 추론) | product-local |
| [app/(app)/meetings/page.tsx](../../Q-Works/app/(app)/meetings/page.tsx) | `MeetingsPage` (screen, 추론) | qd-class-reference |
| [app/(app)/my-tasks/inbox-filter-bar.tsx](../../Q-Works/app/(app)/my-tasks/inbox-filter-bar.tsx) | `InboxFilterBar` (composition, 추론) | qd-class-reference |
| [app/(app)/my-tasks/loading.tsx](../../Q-Works/app/(app)/my-tasks/loading.tsx) | `Loading` (feedback, 추론) | product-local |
| [app/(app)/my-tasks/page.tsx](../../Q-Works/app/(app)/my-tasks/page.tsx) | `MyTasksPage` (screen, 추론) | qd-class-reference |
| [app/(app)/nc/[id]/approval-flow.tsx](../../Q-Works/app/(app)/nc/%5Bid%5D/approval-flow.tsx) | `NcApprovalFlow` (composition, 추론) | qd-class-reference |
| [app/(app)/nc/[id]/delete-nc-button.tsx](../../Q-Works/app/(app)/nc/%5Bid%5D/delete-nc-button.tsx) | `DeleteNcButton` (action, 추론) | product-local |
| [app/(app)/nc/[id]/loading.tsx](../../Q-Works/app/(app)/nc/%5Bid%5D/loading.tsx) | `Loading` (feedback, 추론) | product-local |
| [app/(app)/nc/[id]/nc-actions.tsx](../../Q-Works/app/(app)/nc/%5Bid%5D/nc-actions.tsx) | `NcActions` (action, 추론) | qd-class-reference |
| [app/(app)/nc/[id]/page.tsx](../../Q-Works/app/(app)/nc/%5Bid%5D/page.tsx) | `MetaRow` (data-display, 추론), `NcDetailPage` (screen, 추론) | qd-class-reference |
| [app/(app)/nc/[id]/print/[kind]/page.tsx](../../Q-Works/app/(app)/nc/%5Bid%5D/print/%5Bkind%5D/page.tsx) | `NcReportPrintPage` (document, 추론) | imports-canonical-module |
| [app/(app)/nc/loading.tsx](../../Q-Works/app/(app)/nc/loading.tsx) | `Loading` (feedback, 추론) | product-local |
| [app/(app)/nc/new/loading.tsx](../../Q-Works/app/(app)/nc/new/loading.tsx) | `Loading` (feedback, 추론) | product-local |
| [app/(app)/nc/new/new-nc-form.tsx](../../Q-Works/app/(app)/nc/new/new-nc-form.tsx) | `NewNcForm` (composition, 추론) | qd-class-reference |
| [app/(app)/nc/new/page.tsx](../../Q-Works/app/(app)/nc/new/page.tsx) | `NewNcPage` (screen, 추론) | product-local |
| [app/(app)/nc/page.tsx](../../Q-Works/app/(app)/nc/page.tsx) | `NcPage` (screen, 추론) | qd-class-reference |
| [app/(app)/notices/[id]/delete-notice-button.tsx](../../Q-Works/app/(app)/notices/%5Bid%5D/delete-notice-button.tsx) | `DeleteNoticeButton` (action, 추론) | product-local |
| [app/(app)/notices/[id]/edit/loading.tsx](../../Q-Works/app/(app)/notices/%5Bid%5D/edit/loading.tsx) | `Loading` (feedback, 추론) | product-local |
| [app/(app)/notices/[id]/edit/page.tsx](../../Q-Works/app/(app)/notices/%5Bid%5D/edit/page.tsx) | `EditNoticePage` (screen, 추론) | product-local |
| [app/(app)/notices/[id]/loading.tsx](../../Q-Works/app/(app)/notices/%5Bid%5D/loading.tsx) | `Loading` (feedback, 추론) | product-local |
| [app/(app)/notices/[id]/notice-attachments.tsx](../../Q-Works/app/(app)/notices/%5Bid%5D/notice-attachments.tsx) | `NoticeAttachments` (composition, 추론) | qd-class-reference |
| [app/(app)/notices/[id]/page.tsx](../../Q-Works/app/(app)/notices/%5Bid%5D/page.tsx) | `NoticeDetailPage` (screen, 추론) | product-local |
| [app/(app)/notices/loading.tsx](../../Q-Works/app/(app)/notices/loading.tsx) | `Loading` (feedback, 추론) | product-local |
| [app/(app)/notices/new/loading.tsx](../../Q-Works/app/(app)/notices/new/loading.tsx) | `Loading` (feedback, 추론) | product-local |
| [app/(app)/notices/new/page.tsx](../../Q-Works/app/(app)/notices/new/page.tsx) | `NewNoticePage` (screen, 추론) | product-local |
| [app/(app)/notices/notice-form.tsx](../../Q-Works/app/(app)/notices/notice-form.tsx) | `NoticeForm` (composition, 추론) | qd-class-reference |
| [app/(app)/notices/page.tsx](../../Q-Works/app/(app)/notices/page.tsx) | `NoticesPage` (screen, 추론) | qd-class-reference |
| [app/(app)/notifications/loading.tsx](../../Q-Works/app/(app)/notifications/loading.tsx) | `Loading` (feedback, 추론) | product-local |
| [app/(app)/notifications/notification-row.tsx](../../Q-Works/app/(app)/notifications/notification-row.tsx) | `MarkAllReadButton` (action, 추론), `NotificationRow` (data-display, 추론) | product-local |
| [app/(app)/notifications/page.tsx](../../Q-Works/app/(app)/notifications/page.tsx) | `NotificationsPage` (screen, 추론) | product-local |
| [app/(app)/objectives/[id]/edit/loading.tsx](../../Q-Works/app/(app)/objectives/%5Bid%5D/edit/loading.tsx) | `Loading` (feedback, 추론) | product-local |
| [app/(app)/objectives/[id]/edit/page.tsx](../../Q-Works/app/(app)/objectives/%5Bid%5D/edit/page.tsx) | `EditObjectiveRedirect` (composition, 추론) | product-local |
| [app/(app)/objectives/[id]/loading.tsx](../../Q-Works/app/(app)/objectives/%5Bid%5D/loading.tsx) | `Loading` (feedback, 추론) | product-local |
| [app/(app)/objectives/[id]/page.tsx](../../Q-Works/app/(app)/objectives/%5Bid%5D/page.tsx) | `ObjectiveDetailRedirect` (composition, 추론) | product-local |
| [app/(app)/objectives/loading.tsx](../../Q-Works/app/(app)/objectives/loading.tsx) | `Loading` (feedback, 추론) | product-local |
| [app/(app)/objectives/new/loading.tsx](../../Q-Works/app/(app)/objectives/new/loading.tsx) | `Loading` (feedback, 추론) | product-local |
| [app/(app)/objectives/new/page.tsx](../../Q-Works/app/(app)/objectives/new/page.tsx) | `NewObjectiveRedirect` (composition, 추론) | product-local |
| [app/(app)/objectives/page.tsx](../../Q-Works/app/(app)/objectives/page.tsx) | `ObjectivesPage` (screen, 추론) | qd-class-reference |
| [app/(app)/objectives/policy-panel.tsx](../../Q-Works/app/(app)/objectives/policy-panel.tsx) | `meta` (composition, 추론), `QualityPolicyPanel` (composition, 추론) | qd-class-reference |
| [app/(app)/org-chart/loading.tsx](../../Q-Works/app/(app)/org-chart/loading.tsx) | `Loading` (feedback, 추론) | product-local |
| [app/(app)/org-chart/org-chart-view.tsx](../../Q-Works/app/(app)/org-chart/org-chart-view.tsx) | `Branch` (composition, 추론), `CreateUnitDialog` (overlay, 추론), `EditUnitDialog` (overlay, 추론), `OrgChartView` (composition, 추론), `UnitNode` (composition, 추론) | qd-class-reference |
| [app/(app)/org-chart/page.tsx](../../Q-Works/app/(app)/org-chart/page.tsx) | `OrgChartPage` (screen, 추론) | product-local |
| [app/(app)/planning/loading.tsx](../../Q-Works/app/(app)/planning/loading.tsx) | `Loading` (feedback, 추론) | product-local |
| [app/(app)/planning/page.tsx](../../Q-Works/app/(app)/planning/page.tsx) | `PlanningPage` (screen, 추론) | product-local |
| [app/(app)/production/[id]/delete-production-button.tsx](../../Q-Works/app/(app)/production/%5Bid%5D/delete-production-button.tsx) | `DeleteProductionButton` (action, 추론) | product-local |
| [app/(app)/production/[id]/loading.tsx](../../Q-Works/app/(app)/production/%5Bid%5D/loading.tsx) | `Loading` (feedback, 추론) | product-local |
| [app/(app)/production/[id]/page.tsx](../../Q-Works/app/(app)/production/%5Bid%5D/page.tsx) | `Field` (field, 추론), `ProductionDetailPage` (screen, 추론) | qd-class-reference |
| [app/(app)/production/[id]/production-panel.tsx](../../Q-Works/app/(app)/production/%5Bid%5D/production-panel.tsx) | `ProductionPanel` (composition, 추론) | qd-class-reference |
| [app/(app)/production/loading.tsx](../../Q-Works/app/(app)/production/loading.tsx) | `Loading` (feedback, 추론) | product-local |
| [app/(app)/production/new/loading.tsx](../../Q-Works/app/(app)/production/new/loading.tsx) | `Loading` (feedback, 추론) | product-local |
| [app/(app)/production/new/new-production-form.tsx](../../Q-Works/app/(app)/production/new/new-production-form.tsx) | `NewProductionForm` (composition, 추론) | qd-class-reference |
| [app/(app)/production/new/page.tsx](../../Q-Works/app/(app)/production/new/page.tsx) | `NewProductionPage` (screen, 추론) | product-local |
| [app/(app)/production/page.tsx](../../Q-Works/app/(app)/production/page.tsx) | `ProductionPage` (screen, 추론) | qd-class-reference |
| [app/(app)/production/print/loading.tsx](../../Q-Works/app/(app)/production/print/loading.tsx) | `Loading` (feedback, 추론) | product-local |
| [app/(app)/production/print/page.tsx](../../Q-Works/app/(app)/production/print/page.tsx) | `F` (document, 추론), `ProductionPrintPage` (document, 추론), `TblId` (document, 추론) | qd-class-reference |
| [app/(app)/production/yield/loading.tsx](../../Q-Works/app/(app)/production/yield/loading.tsx) | `Loading` (feedback, 추론) | product-local |
| [app/(app)/production/yield/page.tsx](../../Q-Works/app/(app)/production/yield/page.tsx) | `ProductionYieldPage` (screen, 추론) | qd-class-reference |
| [app/(app)/purchasing/[id]/delete-purchase-button.tsx](../../Q-Works/app/(app)/purchasing/%5Bid%5D/delete-purchase-button.tsx) | `DeletePurchaseButton` (action, 추론) | product-local |
| [app/(app)/purchasing/[id]/edit/loading.tsx](../../Q-Works/app/(app)/purchasing/%5Bid%5D/edit/loading.tsx) | `Loading` (feedback, 추론) | product-local |
| [app/(app)/purchasing/[id]/edit/page.tsx](../../Q-Works/app/(app)/purchasing/%5Bid%5D/edit/page.tsx) | `EditPurchaseRequestPage` (screen, 추론) | product-local |
| [app/(app)/purchasing/[id]/loading.tsx](../../Q-Works/app/(app)/purchasing/%5Bid%5D/loading.tsx) | `Loading` (feedback, 추론) | product-local |
| [app/(app)/purchasing/[id]/page.tsx](../../Q-Works/app/(app)/purchasing/%5Bid%5D/page.tsx) | `Field` (field, 추론), `PurchaseRequestDetailPage` (screen, 추론) | qd-class-reference |
| [app/(app)/purchasing/[id]/print/loading.tsx](../../Q-Works/app/(app)/purchasing/%5Bid%5D/print/loading.tsx) | `Loading` (feedback, 추론) | product-local |
| [app/(app)/purchasing/[id]/print/page.tsx](../../Q-Works/app/(app)/purchasing/%5Bid%5D/print/page.tsx) | `PurchaseRequestPrintPage` (document, 추론) | imports-canonical-module |
| [app/(app)/purchasing/[id]/progress-panel.tsx](../../Q-Works/app/(app)/purchasing/%5Bid%5D/progress-panel.tsx) | `PurchaseProgressPanel` (composition, 추론) | qd-class-reference |
| [app/(app)/purchasing/[id]/request-quotes.tsx](../../Q-Works/app/(app)/purchasing/%5Bid%5D/request-quotes.tsx) | `RequestQuotes` (composition, 추론) | qd-class-reference |
| [app/(app)/purchasing/analysis/loading.tsx](../../Q-Works/app/(app)/purchasing/analysis/loading.tsx) | `Loading` (feedback, 추론) | product-local |
| [app/(app)/purchasing/analysis/page.tsx](../../Q-Works/app/(app)/purchasing/analysis/page.tsx) | `PurchaseAnalysisPage` (screen, 추론) | qd-class-reference |
| [app/(app)/purchasing/loading.tsx](../../Q-Works/app/(app)/purchasing/loading.tsx) | `Loading` (feedback, 추론) | product-local |
| [app/(app)/purchasing/new/loading.tsx](../../Q-Works/app/(app)/purchasing/new/loading.tsx) | `Loading` (feedback, 추론) | product-local |
| [app/(app)/purchasing/new/page.tsx](../../Q-Works/app/(app)/purchasing/new/page.tsx) | `NewPurchaseRequestPage` (screen, 추론) | product-local |
| [app/(app)/purchasing/orders-register.tsx](../../Q-Works/app/(app)/purchasing/orders-register.tsx) | `loadOrdersRegister` (composition, 추론) | qd-class-reference |
| [app/(app)/purchasing/orders/[id]/loading.tsx](../../Q-Works/app/(app)/purchasing/orders/%5Bid%5D/loading.tsx) | `Loading` (feedback, 추론) | product-local |
| [app/(app)/purchasing/orders/[id]/page.tsx](../../Q-Works/app/(app)/purchasing/orders/%5Bid%5D/page.tsx) | `PurchaseOrderPage` (screen, 추론) | imports-canonical-module |
| [app/(app)/purchasing/orders/[id]/print/loading.tsx](../../Q-Works/app/(app)/purchasing/orders/%5Bid%5D/print/loading.tsx) | `Loading` (feedback, 추론) | product-local |
| [app/(app)/purchasing/orders/[id]/print/page.tsx](../../Q-Works/app/(app)/purchasing/orders/%5Bid%5D/print/page.tsx) | `PurchaseOrderPrintPage` (document, 추론) | imports-canonical-module |
| [app/(app)/purchasing/orders/new/loading.tsx](../../Q-Works/app/(app)/purchasing/orders/new/loading.tsx) | `Loading` (feedback, 추론) | product-local |
| [app/(app)/purchasing/orders/new/page.tsx](../../Q-Works/app/(app)/purchasing/orders/new/page.tsx) | `NewOrderPage` (screen, 추론) | product-local |
| [app/(app)/purchasing/orders/order-approval.tsx](../../Q-Works/app/(app)/purchasing/orders/order-approval.tsx) | `OrderApprovalActions` (action, 추론), `OrderApprovalFlow` (composition, 추론) | qd-class-reference |
| [app/(app)/purchasing/orders/order-delete-button.tsx](../../Q-Works/app/(app)/purchasing/orders/order-delete-button.tsx) | `DeleteOrderButton` (action, 추론) | product-local |
| [app/(app)/purchasing/orders/order-form.tsx](../../Q-Works/app/(app)/purchasing/orders/order-form.tsx) | `PartyFields` (composition, 추론), `PurchaseOrderForm` (composition, 추론) | qd-class-reference |
| [app/(app)/purchasing/orders/order-sheet.tsx](../../Q-Works/app/(app)/purchasing/orders/order-sheet.tsx) | `OrderSheet` (document, 추론), `party` (document, 추론) | imports-canonical-module |
| [app/(app)/purchasing/page.tsx](../../Q-Works/app/(app)/purchasing/page.tsx) | `PurchasingPage` (screen, 추론) | qd-class-reference |
| [app/(app)/purchasing/purchase-form.tsx](../../Q-Works/app/(app)/purchasing/purchase-form.tsx) | `PurchaseRequestForm` (composition, 추론) | qd-class-reference |
| [app/(app)/purchasing/quote-file-panel.tsx](../../Q-Works/app/(app)/purchasing/quote-file-panel.tsx) | `QuoteFilePanel` (composition, 추론) | qd-class-reference |
| [app/(app)/purchasing/quote-form.tsx](../../Q-Works/app/(app)/purchasing/quote-form.tsx) | `PurchaseQuoteForm` (composition, 추론) | qd-class-reference |
| [app/(app)/purchasing/quote-items-table.tsx](../../Q-Works/app/(app)/purchasing/quote-items-table.tsx) | `QuoteItemsTable` (data-display, 추론) | qd-class-reference |
| [app/(app)/purchasing/quotes-delete-button.tsx](../../Q-Works/app/(app)/purchasing/quotes-delete-button.tsx) | `DeleteQuoteButton` (action, 추론) | product-local |
| [app/(app)/purchasing/quotes-register.tsx](../../Q-Works/app/(app)/purchasing/quotes-register.tsx) | `loadQuotesRegister` (composition, 추론) | qd-class-reference |
| [app/(app)/purchasing/quotes/[id]/loading.tsx](../../Q-Works/app/(app)/purchasing/quotes/%5Bid%5D/loading.tsx) | `Loading` (feedback, 추론) | product-local |
| [app/(app)/purchasing/quotes/[id]/page.tsx](../../Q-Works/app/(app)/purchasing/quotes/%5Bid%5D/page.tsx) | `F` (composition, 추론), `QuoteItemsView` (composition, 추론), `QuotePage` (screen, 추론) | qd-class-reference |
| [app/(app)/purchasing/quotes/new/loading.tsx](../../Q-Works/app/(app)/purchasing/quotes/new/loading.tsx) | `Loading` (feedback, 추론) | product-local |
| [app/(app)/purchasing/quotes/new/page.tsx](../../Q-Works/app/(app)/purchasing/quotes/new/page.tsx) | `NewQuotePage` (screen, 추론) | product-local |
| [app/(app)/purchasing/request-sheet.tsx](../../Q-Works/app/(app)/purchasing/request-sheet.tsx) | `RequestSheet` (document, 추론) | imports-canonical-module |
| [app/(app)/purchasing/specs/[id]/delete-spec-button.tsx](../../Q-Works/app/(app)/purchasing/specs/%5Bid%5D/delete-spec-button.tsx) | `DeleteSpecButton` (action, 추론) | product-local |
| [app/(app)/purchasing/specs/[id]/loading.tsx](../../Q-Works/app/(app)/purchasing/specs/%5Bid%5D/loading.tsx) | `Loading` (feedback, 추론) | product-local |
| [app/(app)/purchasing/specs/[id]/page.tsx](../../Q-Works/app/(app)/purchasing/specs/%5Bid%5D/page.tsx) | `F` (composition, 추론), `InspectionCriteria` (composition, 추론), `PurchaseSpecDetailPage` (screen, 추론), `SpecView` (composition, 추론) | qd-class-reference |
| [app/(app)/purchasing/specs/[id]/print/loading.tsx](../../Q-Works/app/(app)/purchasing/specs/%5Bid%5D/print/loading.tsx) | `Loading` (feedback, 추론) | product-local |
| [app/(app)/purchasing/specs/[id]/print/page.tsx](../../Q-Works/app/(app)/purchasing/specs/%5Bid%5D/print/page.tsx) | `PurchaseSpecPrintPage` (document, 추론) | imports-canonical-module |
| [app/(app)/purchasing/specs/loading.tsx](../../Q-Works/app/(app)/purchasing/specs/loading.tsx) | `Loading` (feedback, 추론) | product-local |
| [app/(app)/purchasing/specs/new/loading.tsx](../../Q-Works/app/(app)/purchasing/specs/new/loading.tsx) | `Loading` (feedback, 추론) | product-local |
| [app/(app)/purchasing/specs/new/page.tsx](../../Q-Works/app/(app)/purchasing/specs/new/page.tsx) | `NewPurchaseSpecPage` (screen, 추론) | product-local |
| [app/(app)/purchasing/specs/page.tsx](../../Q-Works/app/(app)/purchasing/specs/page.tsx) | `PurchaseSpecsPage` (screen, 추론) | qd-class-reference |
| [app/(app)/purchasing/specs/spec-approval.tsx](../../Q-Works/app/(app)/purchasing/specs/spec-approval.tsx) | `SpecApprovalActions` (action, 추론), `SpecApprovalFlow` (composition, 추론) | qd-class-reference |
| [app/(app)/purchasing/specs/spec-form.tsx](../../Q-Works/app/(app)/purchasing/specs/spec-form.tsx) | `RadioRow` (data-display, 추론), `SpecForm` (composition, 추론) | qd-class-reference |
| [app/(app)/purchasing/specs/spec-sheet.tsx](../../Q-Works/app/(app)/purchasing/specs/spec-sheet.tsx) | `Label` (field, 추론), `SpecSheet` (document, 추론) | imports-canonical-module |
| [app/(app)/qc-charts/[id]/loading.tsx](../../Q-Works/app/(app)/qc-charts/%5Bid%5D/loading.tsx) | `Loading` (feedback, 추론) | product-local |
| [app/(app)/qc-charts/[id]/page.tsx](../../Q-Works/app/(app)/qc-charts/%5Bid%5D/page.tsx) | `QcChartDetailPage` (screen, 추론) | qd-class-reference |
| [app/(app)/qc-charts/loading.tsx](../../Q-Works/app/(app)/qc-charts/loading.tsx) | `Loading` (feedback, 추론) | product-local |
| [app/(app)/qc-charts/new/loading.tsx](../../Q-Works/app/(app)/qc-charts/new/loading.tsx) | `Loading` (feedback, 추론) | product-local |
| [app/(app)/qc-charts/new/page.tsx](../../Q-Works/app/(app)/qc-charts/new/page.tsx) | `NewQcChartPage` (screen, 추론) | product-local |
| [app/(app)/qc-charts/page.tsx](../../Q-Works/app/(app)/qc-charts/page.tsx) | `QcChartsPage` (screen, 추론) | qd-class-reference |
| [app/(app)/qc-charts/qc-chart-form.tsx](../../Q-Works/app/(app)/qc-charts/qc-chart-form.tsx) | `QcChartForm` (composition, 추론) | qd-class-reference |
| [app/(app)/recalls/[id]/loading.tsx](../../Q-Works/app/(app)/recalls/%5Bid%5D/loading.tsx) | `Loading` (feedback, 추론) | product-local |
| [app/(app)/recalls/[id]/notice/loading.tsx](../../Q-Works/app/(app)/recalls/%5Bid%5D/notice/loading.tsx) | `Loading` (feedback, 추론) | product-local |
| [app/(app)/recalls/[id]/notice/page.tsx](../../Q-Works/app/(app)/recalls/%5Bid%5D/notice/page.tsx) | `RecallNoticePage` (screen, 추론) | qd-class-reference |
| [app/(app)/recalls/[id]/notice/print/loading.tsx](../../Q-Works/app/(app)/recalls/%5Bid%5D/notice/print/loading.tsx) | `Loading` (feedback, 추론) | product-local |
| [app/(app)/recalls/[id]/notice/print/page.tsx](../../Q-Works/app/(app)/recalls/%5Bid%5D/notice/print/page.tsx) | `RecallNoticePrintPage` (document, 추론) | imports-canonical-module |
| [app/(app)/recalls/[id]/page.tsx](../../Q-Works/app/(app)/recalls/%5Bid%5D/page.tsx) | `RecallReviewPage` (screen, 추론) | imports-canonical-module |
| [app/(app)/recalls/[id]/print/loading.tsx](../../Q-Works/app/(app)/recalls/%5Bid%5D/print/loading.tsx) | `Loading` (feedback, 추론) | product-local |
| [app/(app)/recalls/[id]/print/page.tsx](../../Q-Works/app/(app)/recalls/%5Bid%5D/print/page.tsx) | `RecallReviewPrintPage` (document, 추론) | imports-canonical-module |
| [app/(app)/recalls/[id]/report/loading.tsx](../../Q-Works/app/(app)/recalls/%5Bid%5D/report/loading.tsx) | `Loading` (feedback, 추론) | product-local |
| [app/(app)/recalls/[id]/report/page.tsx](../../Q-Works/app/(app)/recalls/%5Bid%5D/report/page.tsx) | `RecallReportPage` (screen, 추론) | imports-canonical-module |
| [app/(app)/recalls/[id]/report/print/loading.tsx](../../Q-Works/app/(app)/recalls/%5Bid%5D/report/print/loading.tsx) | `Loading` (feedback, 추론) | product-local |
| [app/(app)/recalls/[id]/report/print/page.tsx](../../Q-Works/app/(app)/recalls/%5Bid%5D/report/print/page.tsx) | `RecallReportPrintPage` (document, 추론) | imports-canonical-module |
| [app/(app)/recalls/approval-ui.tsx](../../Q-Works/app/(app)/recalls/approval-ui.tsx) | `RecallApprovalActions` (action, 추론), `RecallApprovalFlow` (composition, 추론) | qd-class-reference |
| [app/(app)/recalls/delete-sheet-button.tsx](../../Q-Works/app/(app)/recalls/delete-sheet-button.tsx) | `DeleteRecallSheetButton` (action, 추론) | product-local |
| [app/(app)/recalls/loading.tsx](../../Q-Works/app/(app)/recalls/loading.tsx) | `Loading` (feedback, 추론) | product-local |
| [app/(app)/recalls/new/loading.tsx](../../Q-Works/app/(app)/recalls/new/loading.tsx) | `Loading` (feedback, 추론) | product-local |
| [app/(app)/recalls/new/page.tsx](../../Q-Works/app/(app)/recalls/new/page.tsx) | `NewRecallPage` (screen, 추론) | product-local |
| [app/(app)/recalls/notice-form.tsx](../../Q-Works/app/(app)/recalls/notice-form.tsx) | `DistributeNoticeCard` (composition, 추론), `RecallNoticeForm` (composition, 추론) | qd-class-reference |
| [app/(app)/recalls/page.tsx](../../Q-Works/app/(app)/recalls/page.tsx) | `RecallsPage` (screen, 추론) | qd-class-reference |
| [app/(app)/recalls/recall-flow.tsx](../../Q-Works/app/(app)/recalls/recall-flow.tsx) | `RecallDocFlow` (composition, 추론) | product-local |
| [app/(app)/recalls/recall-sheets.tsx](../../Q-Works/app/(app)/recalls/recall-sheets.tsx) | `ReasonTable` (data-display, 추론), `RecallNoticeSheet` (composition, 추론), `RecallReportSheet` (document, 추론), `RecallReviewSheet` (composition, 추론), `SubNote` (composition, 추론), `TargetTable` (data-display, 추론) | imports-canonical-module |
| [app/(app)/recalls/recovery-panel.tsx](../../Q-Works/app/(app)/recalls/recovery-panel.tsx) | `Qty` (composition, 추론), `RecallRecoveryPanel` (composition, 추론) | qd-class-reference |
| [app/(app)/recalls/report-form.tsx](../../Q-Works/app/(app)/recalls/report-form.tsx) | `RecallReportForm` (composition, 추론) | qd-class-reference |
| [app/(app)/recalls/review-form.tsx](../../Q-Works/app/(app)/recalls/review-form.tsx) | `RecallReviewForm` (composition, 추론) | qd-class-reference |
| [app/(app)/returns/[id]/advance-step-button.tsx](../../Q-Works/app/(app)/returns/%5Bid%5D/advance-step-button.tsx) | `AdvanceStepButton` (action, 추론) | product-local |
| [app/(app)/returns/[id]/delete-return-button.tsx](../../Q-Works/app/(app)/returns/%5Bid%5D/delete-return-button.tsx) | `DeleteReturnButton` (action, 추론) | product-local |
| [app/(app)/returns/[id]/edit/page.tsx](../../Q-Works/app/(app)/returns/%5Bid%5D/edit/page.tsx) | `EditReturnPage` (screen, 추론) | product-local |
| [app/(app)/returns/[id]/escalate-dialog.tsx](../../Q-Works/app/(app)/returns/%5Bid%5D/escalate-dialog.tsx) | `EscalateReturnDialog` (overlay, 추론) | product-local |
| [app/(app)/returns/[id]/loading.tsx](../../Q-Works/app/(app)/returns/%5Bid%5D/loading.tsx) | `Loading` (feedback, 추론) | product-local |
| [app/(app)/returns/[id]/page.tsx](../../Q-Works/app/(app)/returns/%5Bid%5D/page.tsx) | `Field` (field, 추론), `ReturnDetailPage` (screen, 추론) | qd-class-reference |
| [app/(app)/returns/[id]/withdraw-button.tsx](../../Q-Works/app/(app)/returns/%5Bid%5D/withdraw-button.tsx) | `WithdrawReturnButton` (action, 추론) | product-local |
| [app/(app)/returns/import/import-panel.tsx](../../Q-Works/app/(app)/returns/import/import-panel.tsx) | `ReturnsImportPanel` (composition, 추론) | qd-class-reference |
| [app/(app)/returns/import/loading.tsx](../../Q-Works/app/(app)/returns/import/loading.tsx) | `Loading` (feedback, 추론) | product-local |
| [app/(app)/returns/import/page.tsx](../../Q-Works/app/(app)/returns/import/page.tsx) | `ReturnsImportPage` (screen, 추론) | product-local |
| [app/(app)/returns/loading.tsx](../../Q-Works/app/(app)/returns/loading.tsx) | `Loading` (feedback, 추론) | product-local |
| [app/(app)/returns/new/csv-template-button.tsx](../../Q-Works/app/(app)/returns/new/csv-template-button.tsx) | `CsvTemplateButton` (action, 추론) | product-local |
| [app/(app)/returns/new/loading.tsx](../../Q-Works/app/(app)/returns/new/loading.tsx) | `Loading` (feedback, 추론) | product-local |
| [app/(app)/returns/new/page.tsx](../../Q-Works/app/(app)/returns/new/page.tsx) | `NewReturnPage` (screen, 추론) | product-local |
| [app/(app)/returns/page.tsx](../../Q-Works/app/(app)/returns/page.tsx) | `ReturnsPage` (screen, 추론) | qd-class-reference |
| [app/(app)/returns/print/loading.tsx](../../Q-Works/app/(app)/returns/print/loading.tsx) | `Loading` (feedback, 추론) | product-local |
| [app/(app)/returns/print/page.tsx](../../Q-Works/app/(app)/returns/print/page.tsx) | `ReturnsPrintPage` (document, 추론) | imports-canonical-module |
| [app/(app)/returns/return-form.tsx](../../Q-Works/app/(app)/returns/return-form.tsx) | `ReturnForm` (composition, 추론) | qd-class-reference |
| [app/(app)/returns/returns-table.tsx](../../Q-Works/app/(app)/returns/returns-table.tsx) | `Clamp` (composition, 추론), `ReturnsTable` (data-display, 추론), `Th` (composition, 추론) | qd-class-reference |
| [app/(app)/reviews/agenda-form.tsx](../../Q-Works/app/(app)/reviews/agenda-form.tsx) | `ReviewAgendaForm` (composition, 추론) | qd-class-reference |
| [app/(app)/reviews/agendas/[id]/minutes/page.tsx](../../Q-Works/app/(app)/reviews/agendas/%5Bid%5D/minutes/page.tsx) | `ReviewMinutesPage` (screen, 추론) | imports-canonical-module |
| [app/(app)/reviews/agendas/[id]/minutes/print/page.tsx](../../Q-Works/app/(app)/reviews/agendas/%5Bid%5D/minutes/print/page.tsx) | `Page` (document, 추론) | imports-canonical-module |
| [app/(app)/reviews/agendas/[id]/page.tsx](../../Q-Works/app/(app)/reviews/agendas/%5Bid%5D/page.tsx) | `ReviewAgendaPage` (screen, 추론) | imports-canonical-module |
| [app/(app)/reviews/agendas/[id]/print/page.tsx](../../Q-Works/app/(app)/reviews/agendas/%5Bid%5D/print/page.tsx) | `Page` (document, 추론) | imports-canonical-module |
| [app/(app)/reviews/agendas/[id]/report/page.tsx](../../Q-Works/app/(app)/reviews/agendas/%5Bid%5D/report/page.tsx) | `ReviewReportPage` (screen, 추론) | imports-canonical-module |
| [app/(app)/reviews/agendas/[id]/report/print/page.tsx](../../Q-Works/app/(app)/reviews/agendas/%5Bid%5D/report/print/page.tsx) | `Page` (document, 추론) | imports-canonical-module |
| [app/(app)/reviews/agendas/new/page.tsx](../../Q-Works/app/(app)/reviews/agendas/new/page.tsx) | `NewReviewAgendaPage` (screen, 추론) | product-local |
| [app/(app)/reviews/approval-ui.tsx](../../Q-Works/app/(app)/reviews/approval-ui.tsx) | `ReviewApprovalButtons` (composition, 추론), `ReviewApprovalFlow` (composition, 추론) | qd-class-reference |
| [app/(app)/reviews/attendance.tsx](../../Q-Works/app/(app)/reviews/attendance.tsx) | `ReviewAttendance` (composition, 추론) | product-local |
| [app/(app)/reviews/input-items.tsx](../../Q-Works/app/(app)/reviews/input-items.tsx) | `ReviewInputItems` (composition, 추론) | qd-class-reference |
| [app/(app)/reviews/loading.tsx](../../Q-Works/app/(app)/reviews/loading.tsx) | `Loading` (feedback, 추론) | product-local |
| [app/(app)/reviews/minutes-form.tsx](../../Q-Works/app/(app)/reviews/minutes-form.tsx) | `ReviewMinutesForm` (composition, 추론) | qd-class-reference |
| [app/(app)/reviews/page.tsx](../../Q-Works/app/(app)/reviews/page.tsx) | `ReviewsPage` (screen, 추론) | qd-class-reference |
| [app/(app)/reviews/report-form.tsx](../../Q-Works/app/(app)/reviews/report-form.tsx) | `ReviewReportForm` (composition, 추론) | qd-class-reference |
| [app/(app)/reviews/review-sheets.tsx](../../Q-Works/app/(app)/reviews/review-sheets.tsx) | `ParticipantsTable` (data-display, 추론), `ReviewAgendaSheet` (composition, 추론), `ReviewMinutesSheet` (composition, 추론), `ReviewReportSheet` (document, 추론) | imports-canonical-module |
| [app/(app)/reviews/sheet-flow.tsx](../../Q-Works/app/(app)/reviews/sheet-flow.tsx) | `makeButton` (action, 추론), `ReviewSheetDeleteButton` (action, 추론), `ReviewSheetFlow` (composition, 추론) | product-local |
| [app/(app)/risks/[id]/delete-risk-button.tsx](../../Q-Works/app/(app)/risks/%5Bid%5D/delete-risk-button.tsx) | `DeleteRiskButton` (action, 추론) | product-local |
| [app/(app)/risks/[id]/loading.tsx](../../Q-Works/app/(app)/risks/%5Bid%5D/loading.tsx) | `Loading` (feedback, 추론) | product-local |
| [app/(app)/risks/[id]/page.tsx](../../Q-Works/app/(app)/risks/%5Bid%5D/page.tsx) | `RiskDetailPage` (screen, 추론) | product-local |
| [app/(app)/risks/[id]/print/[kind]/page.tsx](../../Q-Works/app/(app)/risks/%5Bid%5D/print/%5Bkind%5D/page.tsx) | `Grade` (document, 추론), `RiskFormPrintPage` (document, 추론) | imports-canonical-module |
| [app/(app)/risks/[id]/risk-approval-panel.tsx](../../Q-Works/app/(app)/risks/%5Bid%5D/risk-approval-panel.tsx) | `RiskApprovalPanel` (composition, 추론) | qd-class-reference |
| [app/(app)/risks/[id]/risk-basic-info.tsx](../../Q-Works/app/(app)/risks/%5Bid%5D/risk-basic-info.tsx) | `RiskBasicInfo` (composition, 추론) | qd-class-reference |
| [app/(app)/risks/[id]/risk-detail-client.tsx](../../Q-Works/app/(app)/risks/%5Bid%5D/risk-detail-client.tsx) | `RiskDetailClient` (composition, 추론) | qd-class-reference |
| [app/(app)/risks/import/import-panel.tsx](../../Q-Works/app/(app)/risks/import/import-panel.tsx) | `RiskImportPanel` (composition, 추론) | qd-class-reference |
| [app/(app)/risks/import/loading.tsx](../../Q-Works/app/(app)/risks/import/loading.tsx) | `Loading` (feedback, 추론) | product-local |
| [app/(app)/risks/import/page.tsx](../../Q-Works/app/(app)/risks/import/page.tsx) | `RiskImportPage` (screen, 추론) | product-local |
| [app/(app)/risks/loading.tsx](../../Q-Works/app/(app)/risks/loading.tsx) | `Loading` (feedback, 추론) | product-local |
| [app/(app)/risks/new/loading.tsx](../../Q-Works/app/(app)/risks/new/loading.tsx) | `Loading` (feedback, 추론) | product-local |
| [app/(app)/risks/new/new-risk-form.tsx](../../Q-Works/app/(app)/risks/new/new-risk-form.tsx) | `NewRiskForm` (composition, 추론) | qd-class-reference |
| [app/(app)/risks/new/page.tsx](../../Q-Works/app/(app)/risks/new/page.tsx) | `NewRiskPage` (screen, 추론) | product-local |
| [app/(app)/risks/page.tsx](../../Q-Works/app/(app)/risks/page.tsx) | `RisksPage` (screen, 추론), `SortHead` (composition, 추론) | qd-class-reference |
| [app/(app)/risks/print/loading.tsx](../../Q-Works/app/(app)/risks/print/loading.tsx) | `Loading` (feedback, 추론) | product-local |
| [app/(app)/risks/print/page.tsx](../../Q-Works/app/(app)/risks/print/page.tsx) | `cell` (document, 추론), `PrintRiskMatrix` (document, 추론), `RiskRegisterPrintPage` (document, 추론) | qd-class-reference |
| [app/(app)/safety/[id]/action-panel.tsx](../../Q-Works/app/(app)/safety/%5Bid%5D/action-panel.tsx) | `EnvActionPanel` (composition, 추론) | qd-class-reference |
| [app/(app)/safety/[id]/loading.tsx](../../Q-Works/app/(app)/safety/%5Bid%5D/loading.tsx) | `Loading` (feedback, 추론) | product-local |
| [app/(app)/safety/[id]/page.tsx](../../Q-Works/app/(app)/safety/%5Bid%5D/page.tsx) | `EnvironmentCheckDetailPage` (screen, 추론) | qd-class-reference |
| [app/(app)/safety/areas/areas-editor.tsx](../../Q-Works/app/(app)/safety/areas/areas-editor.tsx) | `WorkAreasEditor` (field, 추론) | qd-class-reference |
| [app/(app)/safety/areas/loading.tsx](../../Q-Works/app/(app)/safety/areas/loading.tsx) | `Loading` (feedback, 추론) | product-local |
| [app/(app)/safety/areas/page.tsx](../../Q-Works/app/(app)/safety/areas/page.tsx) | `WorkAreasPage` (screen, 추론) | product-local |
| [app/(app)/safety/incidents/[id]/close-panel.tsx](../../Q-Works/app/(app)/safety/incidents/%5Bid%5D/close-panel.tsx) | `IncidentClosePanel` (composition, 추론) | qd-class-reference |
| [app/(app)/safety/incidents/[id]/loading.tsx](../../Q-Works/app/(app)/safety/incidents/%5Bid%5D/loading.tsx) | `Loading` (feedback, 추론) | product-local |
| [app/(app)/safety/incidents/[id]/page.tsx](../../Q-Works/app/(app)/safety/incidents/%5Bid%5D/page.tsx) | `Block` (composition, 추론), `IncidentDetailPage` (screen, 추론) | qd-class-reference |
| [app/(app)/safety/incidents/check/loading.tsx](../../Q-Works/app/(app)/safety/incidents/check/loading.tsx) | `Loading` (feedback, 추론) | product-local |
| [app/(app)/safety/incidents/check/page.tsx](../../Q-Works/app/(app)/safety/incidents/check/page.tsx) | `SafetyCheckSheetPage` (screen, 추론) | qd-class-reference |
| [app/(app)/safety/incidents/check/safety-grid.tsx](../../Q-Works/app/(app)/safety/incidents/check/safety-grid.tsx) | `DayRow` (data-display, 추론), `SafetyCheckGrid` (layout, 추론) | product-local |
| [app/(app)/safety/incidents/checks-tab.tsx](../../Q-Works/app/(app)/safety/incidents/checks-tab.tsx) | `ChecksTab` (navigation, 추론) | qd-class-reference |
| [app/(app)/safety/incidents/incident-form.tsx](../../Q-Works/app/(app)/safety/incidents/incident-form.tsx) | `IncidentForm` (composition, 추론) | qd-class-reference |
| [app/(app)/safety/incidents/incidents-tab.tsx](../../Q-Works/app/(app)/safety/incidents/incidents-tab.tsx) | `IncidentsTab` (navigation, 추론) | qd-class-reference |
| [app/(app)/safety/incidents/loading.tsx](../../Q-Works/app/(app)/safety/incidents/loading.tsx) | `Loading` (feedback, 추론) | product-local |
| [app/(app)/safety/incidents/new/loading.tsx](../../Q-Works/app/(app)/safety/incidents/new/loading.tsx) | `Loading` (feedback, 추론) | product-local |
| [app/(app)/safety/incidents/new/page.tsx](../../Q-Works/app/(app)/safety/incidents/new/page.tsx) | `NewIncidentPage` (screen, 추론) | product-local |
| [app/(app)/safety/incidents/page.tsx](../../Q-Works/app/(app)/safety/incidents/page.tsx) | `SafetyHealthPage` (screen, 추론) | product-local |
| [app/(app)/safety/loading.tsx](../../Q-Works/app/(app)/safety/loading.tsx) | `Loading` (feedback, 추론) | product-local |
| [app/(app)/safety/monthly/month-approval.tsx](../../Q-Works/app/(app)/safety/monthly/month-approval.tsx) | `EnvMonthApproval` (composition, 추론) | qd-class-reference |
| [app/(app)/safety/monthly/month-grid.tsx](../../Q-Works/app/(app)/safety/monthly/month-grid.tsx) | `cell` (composition, 추론), `EnvMonthGrid` (layout, 추론), `Rows` (composition, 추론) | product-local |
| [app/(app)/safety/monthly/page.tsx](../../Q-Works/app/(app)/safety/monthly/page.tsx) | `EnvMonthlyPage` (screen, 추론) | qd-class-reference |
| [app/(app)/safety/new/loading.tsx](../../Q-Works/app/(app)/safety/new/loading.tsx) | `Loading` (feedback, 추론) | product-local |
| [app/(app)/safety/new/page.tsx](../../Q-Works/app/(app)/safety/new/page.tsx) | `LegacyNewEnvironmentCheckPage` (screen, 추론) | product-local |
| [app/(app)/safety/page.tsx](../../Q-Works/app/(app)/safety/page.tsx) | `SafetyPage` (screen, 추론) | qd-class-reference |
| [app/(app)/search/page.tsx](../../Q-Works/app/(app)/search/page.tsx) | `SearchPage` (screen, 추론) | qd-class-reference |
| [app/(app)/settings/app-download/app-download-panel.tsx](../../Q-Works/app/(app)/settings/app-download/app-download-panel.tsx) | `AppDownloadPanel` (composition, 추론), `ChromeSteps` (composition, 추론), `InstructionList` (data-display, 추론), `IosSteps` (composition, 추론) | product-local |
| [app/(app)/settings/app-download/loading.tsx](../../Q-Works/app/(app)/settings/app-download/loading.tsx) | `Loading` (feedback, 추론) | product-local |
| [app/(app)/settings/app-download/page.tsx](../../Q-Works/app/(app)/settings/app-download/page.tsx) | `AppDownloadPage` (screen, 추론) | product-local |
| [app/(app)/settings/audit-logs/[id]/loading.tsx](../../Q-Works/app/(app)/settings/audit-logs/%5Bid%5D/loading.tsx) | `Loading` (feedback, 추론) | product-local |
| [app/(app)/settings/audit-logs/[id]/page.tsx](../../Q-Works/app/(app)/settings/audit-logs/%5Bid%5D/page.tsx) | `AuditLogDetailPage` (screen, 추론), `ChangeItem` (composition, 추론), `ChangeList` (data-display, 추론), `Line` (composition, 추론), `Pair` (composition, 추론) | qd-class-reference |
| [app/(app)/settings/audit-logs/loading.tsx](../../Q-Works/app/(app)/settings/audit-logs/loading.tsx) | `Loading` (feedback, 추론) | product-local |
| [app/(app)/settings/audit-logs/page.tsx](../../Q-Works/app/(app)/settings/audit-logs/page.tsx) | `AuditLogsPage` (screen, 추론) | qd-class-reference |
| [app/(app)/settings/clauses/guidance-editor.tsx](../../Q-Works/app/(app)/settings/clauses/guidance-editor.tsx) | `GuidanceEditor` (field, 추론), `Head` (composition, 추론), `Tab` (navigation, 추론) | qd-class-reference |
| [app/(app)/settings/clauses/loading.tsx](../../Q-Works/app/(app)/settings/clauses/loading.tsx) | `Loading` (feedback, 추론) | product-local |
| [app/(app)/settings/clauses/page.tsx](../../Q-Works/app/(app)/settings/clauses/page.tsx) | `ClausesPage` (screen, 추론), `renderRow` (data-display, 추론) | qd-class-reference |
| [app/(app)/settings/company/company-form.tsx](../../Q-Works/app/(app)/settings/company/company-form.tsx) | `CompanyForm` (composition, 추론) | qd-class-reference |
| [app/(app)/settings/company/loading.tsx](../../Q-Works/app/(app)/settings/company/loading.tsx) | `Loading` (feedback, 추론) | product-local |
| [app/(app)/settings/company/page.tsx](../../Q-Works/app/(app)/settings/company/page.tsx) | `CompanySettingsPage` (screen, 추론) | product-local |
| [app/(app)/settings/exchange/exchange-panel.tsx](../../Q-Works/app/(app)/settings/exchange/exchange-panel.tsx) | `download` (composition, 추론), `ExchangePanel` (composition, 추론) | qd-class-reference |
| [app/(app)/settings/exchange/page.tsx](../../Q-Works/app/(app)/settings/exchange/page.tsx) | `ExchangePage` (screen, 추론) | qd-class-reference |
| [app/(app)/settings/holidays/holidays-client.tsx](../../Q-Works/app/(app)/settings/holidays/holidays-client.tsx) | `HolidaysClient` (composition, 추론) | qd-class-reference |
| [app/(app)/settings/holidays/page.tsx](../../Q-Works/app/(app)/settings/holidays/page.tsx) | `HolidaysSettingsPage` (screen, 추론) | qd-class-reference |
| [app/(app)/settings/invitations/delete-btn.tsx](../../Q-Works/app/(app)/settings/invitations/delete-btn.tsx) | `DeleteInvitationBtnClient` (composition, 추론) | product-local |
| [app/(app)/settings/invitations/invitations-client.tsx](../../Q-Works/app/(app)/settings/invitations/invitations-client.tsx) | `InvitationsClient` (composition, 추론) | qd-class-reference |
| [app/(app)/settings/invitations/loading.tsx](../../Q-Works/app/(app)/settings/invitations/loading.tsx) | `Loading` (feedback, 추론) | product-local |
| [app/(app)/settings/invitations/notes-cell.tsx](../../Q-Works/app/(app)/settings/invitations/notes-cell.tsx) | `InvitationNotesCell` (composition, 추론) | product-local |
| [app/(app)/settings/invitations/page.tsx](../../Q-Works/app/(app)/settings/invitations/page.tsx) | `InvitationsPage` (screen, 추론), `RevokeButton` (action, 추론) | qd-class-reference |
| [app/(app)/settings/invitations/revoke-btn.tsx](../../Q-Works/app/(app)/settings/invitations/revoke-btn.tsx) | `RevokeBtnClient` (composition, 추론) | product-local |
| [app/(app)/settings/menu-access/loading.tsx](../../Q-Works/app/(app)/settings/menu-access/loading.tsx) | `Loading` (feedback, 추론) | product-local |
| [app/(app)/settings/menu-access/page.tsx](../../Q-Works/app/(app)/settings/menu-access/page.tsx) | `MenuAccessMovedPage` (screen, 추론) | product-local |
| [app/(app)/settings/roles/access-header.tsx](../../Q-Works/app/(app)/settings/roles/access-header.tsx) | `AccessHeader` (composition, 추론) | qd-class-reference |
| [app/(app)/settings/roles/grades/grades-client.tsx](../../Q-Works/app/(app)/settings/roles/grades/grades-client.tsx) | `UserGradesClient` (composition, 추론) | qd-class-reference |
| [app/(app)/settings/roles/grades/loading.tsx](../../Q-Works/app/(app)/settings/roles/grades/loading.tsx) | `Loading` (feedback, 추론) | product-local |
| [app/(app)/settings/roles/grades/page.tsx](../../Q-Works/app/(app)/settings/roles/grades/page.tsx) | `UserGradesPage` (screen, 추론) | product-local |
| [app/(app)/settings/roles/loading.tsx](../../Q-Works/app/(app)/settings/roles/loading.tsx) | `Loading` (feedback, 추론) | product-local |
| [app/(app)/settings/roles/menus/access-editors.tsx](../../Q-Works/app/(app)/settings/roles/menus/access-editors.tsx) | `DepartmentMenuEditor` (field, 추론), `ResetToDefaultButton` (action, 추론), `UserMenuEditor` (field, 추론) | product-local |
| [app/(app)/settings/roles/menus/department-matrix.tsx](../../Q-Works/app/(app)/settings/roles/menus/department-matrix.tsx) | `DepartmentMatrix` (composition, 추론) | qd-class-reference |
| [app/(app)/settings/roles/menus/loading.tsx](../../Q-Works/app/(app)/settings/roles/menus/loading.tsx) | `Loading` (feedback, 추론) | product-local |
| [app/(app)/settings/roles/menus/menu-level-grid.tsx](../../Q-Works/app/(app)/settings/roles/menus/menu-level-grid.tsx) | `MenuLevelGrid` (layout, 추론) | qd-class-reference |
| [app/(app)/settings/roles/menus/page.tsx](../../Q-Works/app/(app)/settings/roles/menus/page.tsx) | `MenuAccessPage` (screen, 추론) | qd-class-reference |
| [app/(app)/settings/roles/menus/user-departments-editor.tsx](../../Q-Works/app/(app)/settings/roles/menus/user-departments-editor.tsx) | `UserDepartmentsEditor` (field, 추론) | product-local |
| [app/(app)/settings/roles/page.tsx](../../Q-Works/app/(app)/settings/roles/page.tsx) | `RolesSettingsPage` (screen, 추론) | qd-class-reference |
| [app/(app)/settings/roles/permission-matrix.tsx](../../Q-Works/app/(app)/settings/roles/permission-matrix.tsx) | `PermissionMatrix` (composition, 추론), `renderMatrix` (composition, 추론) | qd-class-reference |
| [app/(app)/settings/roles/users/assign-client.tsx](../../Q-Works/app/(app)/settings/roles/users/assign-client.tsx) | `UserRoleAssignClient` (composition, 추론) | qd-class-reference |
| [app/(app)/settings/roles/users/loading.tsx](../../Q-Works/app/(app)/settings/roles/users/loading.tsx) | `Loading` (feedback, 추론) | product-local |
| [app/(app)/settings/roles/users/page.tsx](../../Q-Works/app/(app)/settings/roles/users/page.tsx) | `UsersRolesPage` (screen, 추론) | product-local |
| [app/(app)/shipping/[id]/checks-panel.tsx](../../Q-Works/app/(app)/shipping/%5Bid%5D/checks-panel.tsx) | `ShipmentChecksPanel` (composition, 추론) | qd-class-reference |
| [app/(app)/shipping/[id]/decide-panel.tsx](../../Q-Works/app/(app)/shipping/%5Bid%5D/decide-panel.tsx) | `ShipmentDecidePanel` (composition, 추론) | qd-class-reference |
| [app/(app)/shipping/[id]/delete-shipment-button.tsx](../../Q-Works/app/(app)/shipping/%5Bid%5D/delete-shipment-button.tsx) | `DeleteShipmentButton` (action, 추론) | product-local |
| [app/(app)/shipping/[id]/loading.tsx](../../Q-Works/app/(app)/shipping/%5Bid%5D/loading.tsx) | `Loading` (feedback, 추론) | product-local |
| [app/(app)/shipping/[id]/page.tsx](../../Q-Works/app/(app)/shipping/%5Bid%5D/page.tsx) | `CheckRow` (data-display, 추론), `ShipmentDetailPage` (screen, 추론) | qd-class-reference |
| [app/(app)/shipping/[id]/print/page.tsx](../../Q-Works/app/(app)/shipping/%5Bid%5D/print/page.tsx) | `ShipmentPrintPage` (document, 추론) | imports-canonical-module |
| [app/(app)/shipping/[id]/shipment-approval.tsx](../../Q-Works/app/(app)/shipping/%5Bid%5D/shipment-approval.tsx) | `ShipmentApproval` (composition, 추론) | qd-class-reference |
| [app/(app)/shipping/[id]/warehouse-panel.tsx](../../Q-Works/app/(app)/shipping/%5Bid%5D/warehouse-panel.tsx) | `ShipmentWarehousePanel` (composition, 추론) | qd-class-reference |
| [app/(app)/shipping/loading.tsx](../../Q-Works/app/(app)/shipping/loading.tsx) | `Loading` (feedback, 추론) | product-local |
| [app/(app)/shipping/new/loading.tsx](../../Q-Works/app/(app)/shipping/new/loading.tsx) | `Loading` (feedback, 추론) | product-local |
| [app/(app)/shipping/new/new-shipment-form.tsx](../../Q-Works/app/(app)/shipping/new/new-shipment-form.tsx) | `FormSection` (layout, 추론), `NewShipmentForm` (composition, 추론) | qd-class-reference |
| [app/(app)/shipping/new/page.tsx](../../Q-Works/app/(app)/shipping/new/page.tsx) | `NewShipmentPage` (screen, 추론) | product-local |
| [app/(app)/shipping/page.tsx](../../Q-Works/app/(app)/shipping/page.tsx) | `ShippingPage` (screen, 추론) | qd-class-reference |
| [app/(app)/shipping/shipment-sheet.tsx](../../Q-Works/app/(app)/shipping/shipment-sheet.tsx) | `Guide` (document, 추론), `SectionHead` (document, 추론), `ShipmentSheet` (document, 추론) | imports-canonical-module |
| [app/(app)/specs/[id]/barcode-detail-actions.tsx](../../Q-Works/app/(app)/specs/%5Bid%5D/barcode-detail-actions.tsx) | `BarcodeDeleteButton` (action, 추론), `BarcodeDetailActions` (action, 추론) | product-local |
| [app/(app)/specs/[id]/edit/loading.tsx](../../Q-Works/app/(app)/specs/%5Bid%5D/edit/loading.tsx) | `Loading` (feedback, 추론) | product-local |
| [app/(app)/specs/[id]/edit/page.tsx](../../Q-Works/app/(app)/specs/%5Bid%5D/edit/page.tsx) | `EditBarcodePage` (screen, 추론) | product-local |
| [app/(app)/specs/[id]/loading.tsx](../../Q-Works/app/(app)/specs/%5Bid%5D/loading.tsx) | `Loading` (feedback, 추론) | product-local |
| [app/(app)/specs/[id]/page.tsx](../../Q-Works/app/(app)/specs/%5Bid%5D/page.tsx) | `BarcodeDetailPage` (screen, 추론), `Row` (data-display, 추론) | qd-class-reference |
| [app/(app)/specs/barcode-form.tsx](../../Q-Works/app/(app)/specs/barcode-form.tsx) | `BarcodeForm` (composition, 추론) | qd-class-reference |
| [app/(app)/specs/barcode-row-actions.tsx](../../Q-Works/app/(app)/specs/barcode-row-actions.tsx) | `BarcodeRowActions` (action, 추론) | product-local |
| [app/(app)/specs/loading.tsx](../../Q-Works/app/(app)/specs/loading.tsx) | `Loading` (feedback, 추론) | product-local |
| [app/(app)/specs/new/page.tsx](../../Q-Works/app/(app)/specs/new/page.tsx) | `NewBarcodePage` (screen, 추론) | product-local |
| [app/(app)/specs/page.tsx](../../Q-Works/app/(app)/specs/page.tsx) | `ProductSpecsPage` (screen, 추론), `Sortable` (data-display, 추론) | qd-class-reference |
| [app/(app)/store/[id]/delete-sale-button.tsx](../../Q-Works/app/(app)/store/%5Bid%5D/delete-sale-button.tsx) | `DeleteSaleButton` (action, 추론) | product-local |
| [app/(app)/store/[id]/loading.tsx](../../Q-Works/app/(app)/store/%5Bid%5D/loading.tsx) | `Loading` (feedback, 추론) | product-local |
| [app/(app)/store/[id]/page.tsx](../../Q-Works/app/(app)/store/%5Bid%5D/page.tsx) | `Field` (field, 추론), `StoreSaleDetailPage` (screen, 추론) | qd-class-reference |
| [app/(app)/store/[id]/status-panel.tsx](../../Q-Works/app/(app)/store/%5Bid%5D/status-panel.tsx) | `StoreStatusPanel` (composition, 추론) | qd-class-reference |
| [app/(app)/store/loading.tsx](../../Q-Works/app/(app)/store/loading.tsx) | `Loading` (feedback, 추론) | product-local |
| [app/(app)/store/new/loading.tsx](../../Q-Works/app/(app)/store/new/loading.tsx) | `Loading` (feedback, 추론) | product-local |
| [app/(app)/store/new/page.tsx](../../Q-Works/app/(app)/store/new/page.tsx) | `NewStoreSalePage` (screen, 추론) | product-local |
| [app/(app)/store/page.tsx](../../Q-Works/app/(app)/store/page.tsx) | `StorePage` (screen, 추론) | qd-class-reference |
| [app/(app)/store/sale-items-table.tsx](../../Q-Works/app/(app)/store/sale-items-table.tsx) | `SaleItemsTable` (data-display, 추론) | qd-class-reference |
| [app/(app)/store/store-form.tsx](../../Q-Works/app/(app)/store/store-form.tsx) | `StoreSaleForm` (composition, 추론) | qd-class-reference |
| [app/(app)/suppliers/[id]/attachments-panel.tsx](../../Q-Works/app/(app)/suppliers/%5Bid%5D/attachments-panel.tsx) | `SupplierAttachmentsPanel` (composition, 추론) | qd-class-reference |
| [app/(app)/suppliers/[id]/delete-supplier-button.tsx](../../Q-Works/app/(app)/suppliers/%5Bid%5D/delete-supplier-button.tsx) | `DeleteSupplierButton` (action, 추론) | product-local |
| [app/(app)/suppliers/[id]/evaluate-panel.tsx](../../Q-Works/app/(app)/suppliers/%5Bid%5D/evaluate-panel.tsx) | `SupplierEvaluatePanel` (composition, 추론) | qd-class-reference |
| [app/(app)/suppliers/[id]/loading.tsx](../../Q-Works/app/(app)/suppliers/%5Bid%5D/loading.tsx) | `Loading` (feedback, 추론) | product-local |
| [app/(app)/suppliers/[id]/page.tsx](../../Q-Works/app/(app)/suppliers/%5Bid%5D/page.tsx) | `SupplierDetailPage` (screen, 추론) | qd-class-reference |
| [app/(app)/suppliers/import/import-panel.tsx](../../Q-Works/app/(app)/suppliers/import/import-panel.tsx) | `handleTemplate` (composition, 추론), `SupplierImportPanel` (composition, 추론) | qd-class-reference |
| [app/(app)/suppliers/import/loading.tsx](../../Q-Works/app/(app)/suppliers/import/loading.tsx) | `Loading` (feedback, 추론) | product-local |
| [app/(app)/suppliers/import/page.tsx](../../Q-Works/app/(app)/suppliers/import/page.tsx) | `SupplierImportPage` (screen, 추론) | product-local |
| [app/(app)/suppliers/ledger-section.tsx](../../Q-Works/app/(app)/suppliers/ledger-section.tsx) | `SupplierLedgerSection` (layout, 추론) | qd-class-reference |
| [app/(app)/suppliers/loading.tsx](../../Q-Works/app/(app)/suppliers/loading.tsx) | `Loading` (feedback, 추론) | product-local |
| [app/(app)/suppliers/new/loading.tsx](../../Q-Works/app/(app)/suppliers/new/loading.tsx) | `Loading` (feedback, 추론) | product-local |
| [app/(app)/suppliers/new/new-supplier-form.tsx](../../Q-Works/app/(app)/suppliers/new/new-supplier-form.tsx) | `FilePick` (composition, 추론), `NewSupplierForm` (composition, 추론) | product-local |
| [app/(app)/suppliers/new/page.tsx](../../Q-Works/app/(app)/suppliers/new/page.tsx) | `NewSupplierPage` (screen, 추론) | product-local |
| [app/(app)/suppliers/page.tsx](../../Q-Works/app/(app)/suppliers/page.tsx) | `SuppliersPage` (screen, 추론) | product-local |
| [app/(app)/suppliers/reports/[id]/delete-report-button.tsx](../../Q-Works/app/(app)/suppliers/reports/%5Bid%5D/delete-report-button.tsx) | `DeleteReportButton` (action, 추론) | product-local |
| [app/(app)/suppliers/reports/[id]/edit/loading.tsx](../../Q-Works/app/(app)/suppliers/reports/%5Bid%5D/edit/loading.tsx) | `Loading` (feedback, 추론) | product-local |
| [app/(app)/suppliers/reports/[id]/edit/page.tsx](../../Q-Works/app/(app)/suppliers/reports/%5Bid%5D/edit/page.tsx) | `EditEvalReportPage` (screen, 추론) | product-local |
| [app/(app)/suppliers/reports/[id]/loading.tsx](../../Q-Works/app/(app)/suppliers/reports/%5Bid%5D/loading.tsx) | `Loading` (feedback, 추론) | product-local |
| [app/(app)/suppliers/reports/[id]/page.tsx](../../Q-Works/app/(app)/suppliers/reports/%5Bid%5D/page.tsx) | `EvalReportDetailPage` (screen, 추론) | qd-class-reference |
| [app/(app)/suppliers/reports/[id]/print/page.tsx](../../Q-Works/app/(app)/suppliers/reports/%5Bid%5D/print/page.tsx) | `EvalReportPrintPage` (document, 추론) | imports-canonical-module |
| [app/(app)/suppliers/reports/approval-buttons.tsx](../../Q-Works/app/(app)/suppliers/reports/approval-buttons.tsx) | `EvalReportApprovalButtons` (composition, 추론) | qd-class-reference |
| [app/(app)/suppliers/reports/approval-flow.tsx](../../Q-Works/app/(app)/suppliers/reports/approval-flow.tsx) | `EvalReportApprovalFlow` (composition, 추론) | product-local |
| [app/(app)/suppliers/reports/criteria-note.tsx](../../Q-Works/app/(app)/suppliers/reports/criteria-note.tsx) | `EvalCriteriaNote` (composition, 추론) | qd-class-reference |
| [app/(app)/suppliers/reports/eval-report-form.tsx](../../Q-Works/app/(app)/suppliers/reports/eval-report-form.tsx) | `EvalReportForm` (composition, 추론) | qd-class-reference |
| [app/(app)/suppliers/reports/eval-report-sheet.tsx](../../Q-Works/app/(app)/suppliers/reports/eval-report-sheet.tsx) | `EvalReportSheet` (document, 추론), `ScoreTable` (document, 추론) | imports-canonical-module |
| [app/(app)/suppliers/reports/new/loading.tsx](../../Q-Works/app/(app)/suppliers/reports/new/loading.tsx) | `Loading` (feedback, 추론) | product-local |
| [app/(app)/suppliers/reports/new/page.tsx](../../Q-Works/app/(app)/suppliers/reports/new/page.tsx) | `NewEvalReportPage` (screen, 추론) | product-local |
| [app/(app)/suppliers/reports/reports-section.tsx](../../Q-Works/app/(app)/suppliers/reports/reports-section.tsx) | `EvalReportsSection` (layout, 추론) | qd-class-reference |
| [app/(app)/traceability/[id]/loading.tsx](../../Q-Works/app/(app)/traceability/%5Bid%5D/loading.tsx) | `Loading` (feedback, 추론) | product-local |
| [app/(app)/traceability/[id]/page.tsx](../../Q-Works/app/(app)/traceability/%5Bid%5D/page.tsx) | `ItemCodeDetailPage` (screen, 추론) | product-local |
| [app/(app)/traceability/import/import-panel.tsx](../../Q-Works/app/(app)/traceability/import/import-panel.tsx) | `ItemCodeImportPanel` (composition, 추론) | qd-class-reference |
| [app/(app)/traceability/import/loading.tsx](../../Q-Works/app/(app)/traceability/import/loading.tsx) | `Loading` (feedback, 추론) | product-local |
| [app/(app)/traceability/import/page.tsx](../../Q-Works/app/(app)/traceability/import/page.tsx) | `ItemCodeImportPage` (screen, 추론) | product-local |
| [app/(app)/traceability/item-code-form.tsx](../../Q-Works/app/(app)/traceability/item-code-form.tsx) | `ItemCodeForm` (composition, 추론) | qd-class-reference |
| [app/(app)/traceability/loading.tsx](../../Q-Works/app/(app)/traceability/loading.tsx) | `Loading` (feedback, 추론) | product-local |
| [app/(app)/traceability/lot/loading.tsx](../../Q-Works/app/(app)/traceability/lot/loading.tsx) | `Loading` (feedback, 추론) | product-local |
| [app/(app)/traceability/lot/page.tsx](../../Q-Works/app/(app)/traceability/lot/page.tsx) | `LotTracePage` (screen, 추론), `TracePanel` (composition, 추론), `TraceProductionTable` (data-display, 추론) | qd-class-reference |
| [app/(app)/traceability/new/loading.tsx](../../Q-Works/app/(app)/traceability/new/loading.tsx) | `Loading` (feedback, 추론) | product-local |
| [app/(app)/traceability/new/page.tsx](../../Q-Works/app/(app)/traceability/new/page.tsx) | `NewItemCodePage` (screen, 추론) | product-local |
| [app/(app)/traceability/page.tsx](../../Q-Works/app/(app)/traceability/page.tsx) | `TraceabilityPage` (screen, 추론) | qd-class-reference |
| [app/(app)/traceability/print/loading.tsx](../../Q-Works/app/(app)/traceability/print/loading.tsx) | `Loading` (feedback, 추론) | product-local |
| [app/(app)/traceability/print/page.tsx](../../Q-Works/app/(app)/traceability/print/page.tsx) | `ItemCodeClassificationPrintPage` (document, 추론) | imports-canonical-module |
| [app/(app)/training/[id]/edit/loading.tsx](../../Q-Works/app/(app)/training/%5Bid%5D/edit/loading.tsx) | `Loading` (feedback, 추론) | product-local |
| [app/(app)/training/[id]/edit/page.tsx](../../Q-Works/app/(app)/training/%5Bid%5D/edit/page.tsx) | `EditTrainingPage` (screen, 추론) | product-local |
| [app/(app)/training/[id]/loading.tsx](../../Q-Works/app/(app)/training/%5Bid%5D/loading.tsx) | `Loading` (feedback, 추론) | product-local |
| [app/(app)/training/[id]/page.tsx](../../Q-Works/app/(app)/training/%5Bid%5D/page.tsx) | `TrainingDetailPage` (screen, 추론) | qd-class-reference |
| [app/(app)/training/approval-ui.tsx](../../Q-Works/app/(app)/training/approval-ui.tsx) | `TrainingApprovalButtons` (composition, 추론), `TrainingApprovalFlow` (composition, 추론) | qd-class-reference |
| [app/(app)/training/assessment-revoke-button.tsx](../../Q-Works/app/(app)/training/assessment-revoke-button.tsx) | `AssessmentRevokeButton` (action, 추론) | product-local |
| [app/(app)/training/auditor-grant-form.tsx](../../Q-Works/app/(app)/training/auditor-grant-form.tsx) | `QualificationGrantForm` (composition, 추론) | product-local |
| [app/(app)/training/auditor-revoke-button.tsx](../../Q-Works/app/(app)/training/auditor-revoke-button.tsx) | `AuditorRevokeButton` (action, 추론) | product-local |
| [app/(app)/training/body-form.tsx](../../Q-Works/app/(app)/training/body-form.tsx) | `checkRow` (data-display, 추론), `TrainingBodyForm` (composition, 추론) | qd-class-reference |
| [app/(app)/training/competency-delete-button.tsx](../../Q-Works/app/(app)/training/competency-delete-button.tsx) | `CompetencyDeleteButton` (action, 추론) | product-local |
| [app/(app)/training/competency-forms.tsx](../../Q-Works/app/(app)/training/competency-forms.tsx) | `CompetencyAssessForm` (composition, 추론), `CompetencyCreateForm` (composition, 추론), `CompetencyDefForm` (composition, 추론), `CompetencyEditForm` (composition, 추론) | product-local |
| [app/(app)/training/competency-header-actions.tsx](../../Q-Works/app/(app)/training/competency-header-actions.tsx) | `CompetencyHeaderActions` (action, 추론) | product-local |
| [app/(app)/training/competency-register.tsx](../../Q-Works/app/(app)/training/competency-register.tsx) | `CompetencyRegister` (composition, 추론) | qd-class-reference |
| [app/(app)/training/loading.tsx](../../Q-Works/app/(app)/training/loading.tsx) | `Loading` (feedback, 추론) | product-local |
| [app/(app)/training/new/loading.tsx](../../Q-Works/app/(app)/training/new/loading.tsx) | `Loading` (feedback, 추론) | product-local |
| [app/(app)/training/new/page.tsx](../../Q-Works/app/(app)/training/new/page.tsx) | `NewTrainingPage` (screen, 추론) | product-local |
| [app/(app)/training/page.tsx](../../Q-Works/app/(app)/training/page.tsx) | `TrainingPage` (screen, 추론) | qd-class-reference |
| [app/(app)/training/plans/[id]/loading.tsx](../../Q-Works/app/(app)/training/plans/%5Bid%5D/loading.tsx) | `Loading` (feedback, 추론) | product-local |
| [app/(app)/training/plans/[id]/page.tsx](../../Q-Works/app/(app)/training/plans/%5Bid%5D/page.tsx) | `TrainingPlanPage` (screen, 추론) | imports-canonical-module |
| [app/(app)/training/plans/[id]/print/page.tsx](../../Q-Works/app/(app)/training/plans/%5Bid%5D/print/page.tsx) | `Page` (document, 추론) | imports-canonical-module |
| [app/(app)/training/plans/[id]/report/loading.tsx](../../Q-Works/app/(app)/training/plans/%5Bid%5D/report/loading.tsx) | `Loading` (feedback, 추론) | product-local |
| [app/(app)/training/plans/[id]/report/page.tsx](../../Q-Works/app/(app)/training/plans/%5Bid%5D/report/page.tsx) | `TrainingReportPage` (screen, 추론) | imports-canonical-module |
| [app/(app)/training/plans/[id]/report/print/page.tsx](../../Q-Works/app/(app)/training/plans/%5Bid%5D/report/print/page.tsx) | `Page` (document, 추론) | imports-canonical-module |
| [app/(app)/training/plans/new/new-plan-form.tsx](../../Q-Works/app/(app)/training/plans/new/new-plan-form.tsx) | `NewTrainingPlanForm` (composition, 추론) | product-local |
| [app/(app)/training/plans/new/page.tsx](../../Q-Works/app/(app)/training/plans/new/page.tsx) | `NewTrainingPlanPage` (screen, 추론) | product-local |
| [app/(app)/training/record/loading.tsx](../../Q-Works/app/(app)/training/record/loading.tsx) | `Loading` (feedback, 추론) | product-local |
| [app/(app)/training/record/page.tsx](../../Q-Works/app/(app)/training/record/page.tsx) | `RecordTrainingPage` (screen, 추론) | product-local |
| [app/(app)/training/record/record-form.tsx](../../Q-Works/app/(app)/training/record/record-form.tsx) | `RecordTrainingForm` (composition, 추론) | qd-class-reference |
| [app/(app)/training/sheet-flow.tsx](../../Q-Works/app/(app)/training/sheet-flow.tsx) | `TrainingSheetDeleteButton` (action, 추론), `TrainingSheetFlow` (composition, 추론) | product-local |
| [app/(app)/training/sheet-header.tsx](../../Q-Works/app/(app)/training/sheet-header.tsx) | `TrainingSheetApproval` (composition, 추론) | product-local |
| [app/(app)/training/training-doc-list.tsx](../../Q-Works/app/(app)/training/training-doc-list.tsx) | `StatusPill` (composition, 추론), `TrainingDocList` (data-display, 추론) | qd-class-reference |
| [app/(app)/training/training-form.tsx](../../Q-Works/app/(app)/training/training-form.tsx) | `TrainingForm` (composition, 추론) | qd-class-reference |
| [app/(app)/training/training-row-actions.tsx](../../Q-Works/app/(app)/training/training-row-actions.tsx) | `TrainingRowActions` (action, 추론) | product-local |
| [app/(app)/training/training-sheets.tsx](../../Q-Works/app/(app)/training/training-sheets.tsx) | `TrainingSheet` (composition, 추론) | imports-canonical-module |
| [app/(app)/warehouses/[id]/edit/page.tsx](../../Q-Works/app/(app)/warehouses/%5Bid%5D/edit/page.tsx) | `WarehouseEditPage` (screen, 추론) | product-local |
| [app/(app)/warehouses/[id]/loading.tsx](../../Q-Works/app/(app)/warehouses/%5Bid%5D/loading.tsx) | `Loading` (feedback, 추론) | product-local |
| [app/(app)/warehouses/[id]/page.tsx](../../Q-Works/app/(app)/warehouses/%5Bid%5D/page.tsx) | `WarehouseDetailPage` (screen, 추론) | qd-class-reference |
| [app/(app)/warehouses/[id]/warehouse-items-panel.tsx](../../Q-Works/app/(app)/warehouses/%5Bid%5D/warehouse-items-panel.tsx) | `WarehouseItemsPanel` (composition, 추론) | qd-class-reference |
| [app/(app)/warehouses/loading.tsx](../../Q-Works/app/(app)/warehouses/loading.tsx) | `Loading` (feedback, 추론) | product-local |
| [app/(app)/warehouses/new/loading.tsx](../../Q-Works/app/(app)/warehouses/new/loading.tsx) | `Loading` (feedback, 추론) | product-local |
| [app/(app)/warehouses/new/page.tsx](../../Q-Works/app/(app)/warehouses/new/page.tsx) | `NewWarehousePage` (screen, 추론) | product-local |
| [app/(app)/warehouses/page.tsx](../../Q-Works/app/(app)/warehouses/page.tsx) | `WarehousesPage` (screen, 추론) | qd-class-reference |
| [app/(app)/warehouses/warehouse-form.tsx](../../Q-Works/app/(app)/warehouses/warehouse-form.tsx) | `WarehouseForm` (composition, 추론) | qd-class-reference |
| [app/(auth)/forgot-password/forgot-password-form.tsx](../../Q-Works/app/(auth)/forgot-password/forgot-password-form.tsx) | `ForgotPasswordForm` (composition, 추론) | product-local |
| [app/(auth)/forgot-password/page.tsx](../../Q-Works/app/(auth)/forgot-password/page.tsx) | `ForgotPasswordPage` (screen, 추론) | product-local |
| [app/(auth)/layout.tsx](../../Q-Works/app/(auth)/layout.tsx) | `AuthLayout` (layout, 추론) | product-local |
| [app/(auth)/login/login-form.tsx](../../Q-Works/app/(auth)/login/login-form.tsx) | `LoginForm` (composition, 추론) | qd-class-reference |
| [app/(auth)/login/page.tsx](../../Q-Works/app/(auth)/login/page.tsx) | `LoginPage` (screen, 추론) | product-local |
| [app/(auth)/login/saved-account-list.tsx](../../Q-Works/app/(auth)/login/saved-account-list.tsx) | `SavedAccountList` (data-display, 추론) | qd-class-reference |
| [app/(auth)/reset-password/page.tsx](../../Q-Works/app/(auth)/reset-password/page.tsx) | `ResetPasswordPage` (screen, 추론) | product-local |
| [app/(auth)/reset-password/reset-password-form.tsx](../../Q-Works/app/(auth)/reset-password/reset-password-form.tsx) | `ResetPasswordForm` (composition, 추론) | product-local |
| [app/(auth)/signup/page.tsx](../../Q-Works/app/(auth)/signup/page.tsx) | `SignupPage` (screen, 추론) | product-local |
| [app/(auth)/signup/signup-form.tsx](../../Q-Works/app/(auth)/signup/signup-form.tsx) | `SignupForm` (composition, 추론) | product-local |
| [app/(floor)/floor/floor-client.tsx](../../Q-Works/app/(floor)/floor/floor-client.tsx) | `BackButton` (action, 추론), `FloorClient` (composition, 추론), `Keypad` (composition, 추론), `Modal` (overlay, 추론), `PathChip` (composition, 추론) | qd-class-reference |
| [app/(floor)/floor/manage/manage-client.tsx](../../Q-Works/app/(floor)/floor/manage/manage-client.tsx) | `FinishSummary` (data-display, 추론), `ManageClient` (composition, 추론), `PlannedQty` (composition, 추론), `RecordSummary` (data-display, 추론), `ResultQty` (composition, 추론) | qd-class-reference |
| [app/(floor)/floor/manage/page.tsx](../../Q-Works/app/(floor)/floor/manage/page.tsx) | `FloorManagePage` (screen, 추론) | product-local |
| [app/(floor)/floor/page.tsx](../../Q-Works/app/(floor)/floor/page.tsx) | `FloorPage` (screen, 추론) | product-local |
| [app/(floor)/layout.tsx](../../Q-Works/app/(floor)/layout.tsx) | `FloorLayout` (layout, 추론) | product-local |
| [app/(legal)/layout.tsx](../../Q-Works/app/(legal)/layout.tsx) | `LegalLayout` (layout, 추론) | product-local |
| [app/(legal)/privacy/page.tsx](../../Q-Works/app/(legal)/privacy/page.tsx) | `PrivacyPage` (screen, 추론) | product-local |
| [app/(legal)/terms/page.tsx](../../Q-Works/app/(legal)/terms/page.tsx) | `TermsPage` (screen, 추론) | product-local |
| [app/error.tsx](../../Q-Works/app/error.tsx) | `ErrorBoundary` (provider, 추론) | product-local |
| [app/globals.css](../../Q-Works/app/globals.css) | 스타일 기반 규칙 | imports-canonical-module |
| [app/layout.tsx](../../Q-Works/app/layout.tsx) | `RootLayout` (layout, 추론) | imports-canonical-module |
| [app/not-found.tsx](../../Q-Works/app/not-found.tsx) | `NotFound` (composition, 추론) | product-local |
| [app/page.tsx](../../Q-Works/app/page.tsx) | `RootPage` (screen, 추론) | product-local |
| [app/q-design.components.css](../../Q-Works/app/q-design.components.css) | 스타일 기반 규칙 | canonical-copy |
| [app/q-design.foundation.css](../../Q-Works/app/q-design.foundation.css) | 스타일 기반 규칙 | canonical-copy |
| [app/q-design.list.css](../../Q-Works/app/q-design.list.css) | 스타일 기반 규칙 | canonical-copy |
| [app/q-design.nav.css](../../Q-Works/app/q-design.nav.css) | 스타일 기반 규칙 | canonical-copy |
| [app/q-design.palette.css](../../Q-Works/app/q-design.palette.css) | 스타일 기반 규칙 | canonical-copy |
| [app/q-design.print.css](../../Q-Works/app/q-design.print.css) | 스타일 기반 규칙 | canonical-copy |
| [app/q-design.screen.css](../../Q-Works/app/q-design.screen.css) | 스타일 기반 규칙 | canonical-copy |
| [app/q-design.workspace.css](../../Q-Works/app/q-design.workspace.css) | 스타일 기반 규칙 | canonical-copy |
| [components/approvals/approval-line-picker.tsx](../../Q-Works/components/approvals/approval-line-picker.tsx) | `ApprovalLinePicker` (field, 추론), `Seat` (field, 추론) | qd-class-reference |
| [components/auth/auth-card.tsx](../../Q-Works/components/auth/auth-card.tsx) | `AuthCard` (composition, 추론) | product-local |
| [components/auth/kst-clock.tsx](../../Q-Works/components/auth/kst-clock.tsx) | `KstClock` (composition, 추론) | product-local |
| [components/auth/ribbon-background.tsx](../../Q-Works/components/auth/ribbon-background.tsx) | `RibbonBackground` (composition, 추론) | product-local |
| [components/capa/capa-link-button.tsx](../../Q-Works/components/capa/capa-link-button.tsx) | `CapaLinkButton` (action, 추론) | product-local |
| [components/clauses/guidance-view.tsx](../../Q-Works/components/clauses/guidance-view.tsx) | `Block` (composition, 추론), `GuidanceView` (composition, 추론), `Items` (composition, 추론), `Text` (composition, 추론) | product-local |
| [components/documents/approval-chain-editor.tsx](../../Q-Works/components/documents/approval-chain-editor.tsx) | `ApprovalChainEditor` (field, 추론) | qd-class-reference |
| [components/documents/document-preview-modal.tsx](../../Q-Works/components/documents/document-preview-modal.tsx) | `DocumentPreviewModal` (overlay, 추론), `FallbackBody` (composition, 추론) | qd-class-reference |
| [components/documents/form-actions.tsx](../../Q-Works/components/documents/form-actions.tsx) | `FormActions` (action, 추론) | product-local |
| [components/documents/module-basis-line.tsx](../../Q-Works/components/documents/module-basis-line.tsx) | `ModuleBasisLine` (composition, 추론) | product-local |
| [components/documents/module-doc-links.tsx](../../Q-Works/components/documents/module-doc-links.tsx) | `ModuleDocLinks` (composition, 추론) | product-local |
| [components/documents/module-docs-button.tsx](../../Q-Works/components/documents/module-docs-button.tsx) | `ModuleDocsButton` (action, 추론) | product-local |
| [components/documents/new-document-trigger.tsx](../../Q-Works/components/documents/new-document-trigger.tsx) | `NewDocumentTrigger` (composition, 추론) | product-local |
| [components/documents/parent-document-picker.tsx](../../Q-Works/components/documents/parent-document-picker.tsx) | `ParentDocumentPicker` (field, 추론) | product-local |
| [components/inspections/inspection-overview.tsx](../../Q-Works/components/inspections/inspection-overview.tsx) | `Cell` (composition, 추론), `InspectionOverview` (composition, 추론), `InspectionOverviewStats` (data-display, 추론) | product-local |
| [components/kpi/classification-summary.tsx](../../Q-Works/components/kpi/classification-summary.tsx) | `ClassificationSummary` (data-display, 추론) | qd-class-reference |
| [components/kpi/kpi-card.tsx](../../Q-Works/components/kpi/kpi-card.tsx) | `KpiCard` (composition, 추론) | product-local |
| [components/kpi/monitoring-all-button.tsx](../../Q-Works/components/kpi/monitoring-all-button.tsx) | `MonitoringAllButton` (action, 추론) | product-local |
| [components/kpi/monitoring-board.tsx](../../Q-Works/components/kpi/monitoring-board.tsx) | `MonitoringBoard` (composition, 추론) | qd-class-reference |
| [components/kpi/monitoring-create-button.tsx](../../Q-Works/components/kpi/monitoring-create-button.tsx) | `MonitoringCreateButton` (action, 추론) | product-local |
| [components/kpi/monitoring-filter-bar.tsx](../../Q-Works/components/kpi/monitoring-filter-bar.tsx) | `MonitoringFilterBar` (composition, 추론) | qd-class-reference |
| [components/kpi/monitoring-section.tsx](../../Q-Works/components/kpi/monitoring-section.tsx) | `MonitoringSection` (layout, 추론) | product-local |
| [components/kpi/monitoring-stats.tsx](../../Q-Works/components/kpi/monitoring-stats.tsx) | `MonitoringStats` (data-display, 추론) | product-local |
| [components/layout/command-palette.tsx](../../Q-Works/components/layout/command-palette.tsx) | `CommandPalette` (composition, 추론) | qd-class-reference |
| [components/layout/main-band.tsx](../../Q-Works/components/layout/main-band.tsx) | `MainBand` (composition, 추론) | qd-class-reference |
| [components/layout/mobile-sidebar.tsx](../../Q-Works/components/layout/mobile-sidebar.tsx) | `MobileSidebar` (navigation, 추론) | qd-class-reference |
| [components/layout/password-change-shell.tsx](../../Q-Works/components/layout/password-change-shell.tsx) | `PasswordChangeShell` (layout, 추론) | qd-class-reference |
| [components/layout/rail-foot.tsx](../../Q-Works/components/layout/rail-foot.tsx) | `AccountSwitch` (choice, 추론), `LogoutButton` (action, 추론), `RailFoot` (composition, 추론) | qd-class-reference |
| [components/layout/rail-search.tsx](../../Q-Works/components/layout/rail-search.tsx) | `RailSearch` (composition, 추론) | qd-class-reference |
| [components/layout/sidebar-nav.tsx](../../Q-Works/components/layout/sidebar-nav.tsx) | `renderItem` (navigation, 추론), `renderMoveMenu` (navigation, 추론), `SidebarNav` (navigation, 추론) | qd-class-reference |
| [components/layout/sidebar.tsx](../../Q-Works/components/layout/sidebar.tsx) | `Sidebar` (navigation, 추론) | qd-class-reference |
| [components/passkey-banner.tsx](../../Q-Works/components/passkey-banner.tsx) | `PasskeyBanner` (feedback, 추론) | product-local |
| [components/passkey-offer.tsx](../../Q-Works/components/passkey-offer.tsx) | `PasskeyOffer` (composition, 추론) | qd-class-reference |
| [components/passkey-section.tsx](../../Q-Works/components/passkey-section.tsx) | `PasskeySection` (layout, 추론) | qd-class-reference |
| [components/planning/planning-stats.tsx](../../Q-Works/components/planning/planning-stats.tsx) | `PlanningStats` (data-display, 추론) | product-local |
| [components/print/company-mark.tsx](../../Q-Works/components/print/company-mark.tsx) | `CompanyMark` (document, 추론) | product-local |
| [components/print/concurrent-slash.tsx](../../Q-Works/components/print/concurrent-slash.tsx) | `ConcurrentSlash` (document, 추론) | product-local |
| [components/print/equipment-block.tsx](../../Q-Works/components/print/equipment-block.tsx) | `EquipmentBlock` (document, 추론) | product-local |
| [components/print/print-link.tsx](../../Q-Works/components/print/print-link.tsx) | `PrintLink` (document, 추론) | qd-class-reference |
| [components/print/print-sheet-footer.tsx](../../Q-Works/components/print/print-sheet-footer.tsx) | `PrintSheetFooter` (document, 추론) | product-local |
| [components/print/print-styles.tsx](../../Q-Works/components/print/print-styles.tsx) | `PrintStyles` (document, 추론) | canonical-copy |
| [components/print/report-sheet.tsx](../../Q-Works/components/print/report-sheet.tsx) | `FieldValue` (document, 추론), `L` (document, 추론), `ReportSheet` (document, 추론) | imports-canonical-module |
| [components/print/sheet-pagination.tsx](../../Q-Works/components/print/sheet-pagination.tsx) | `pxPerMm` (document, 추론), `SheetPagination` (navigation, 추론) | product-local |
| [components/print/signature-block.tsx](../../Q-Works/components/print/signature-block.tsx) | `SignatureBlock` (document, 추론) | product-local |
| [components/print/signature-mark.tsx](../../Q-Works/components/print/signature-mark.tsx) | `SignatureMark` (document, 추론) | product-local |
| [components/production/process-flow.tsx](../../Q-Works/components/production/process-flow.tsx) | `ProcessFlow` (composition, 추론) | qd-class-reference |
| [components/q-design-icons/Activity.tsx](../../Q-Works/components/q-design-icons/Activity.tsx) | `Activity` (icon, 추론) | product-local |
| [components/q-design-icons/AlertOctagon.tsx](../../Q-Works/components/q-design-icons/AlertOctagon.tsx) | `AlertOctagon` (icon, 추론) | product-local |
| [components/q-design-icons/AlertTriangle.tsx](../../Q-Works/components/q-design-icons/AlertTriangle.tsx) | `AlertTriangle` (icon, 추론) | product-local |
| [components/q-design-icons/Archive.tsx](../../Q-Works/components/q-design-icons/Archive.tsx) | `Archive` (icon, 추론) | product-local |
| [components/q-design-icons/ArrowDown.tsx](../../Q-Works/components/q-design-icons/ArrowDown.tsx) | `ArrowDown` (icon, 추론) | product-local |
| [components/q-design-icons/ArrowLeft.tsx](../../Q-Works/components/q-design-icons/ArrowLeft.tsx) | `ArrowLeft` (icon, 추론) | product-local |
| [components/q-design-icons/ArrowLeftRight.tsx](../../Q-Works/components/q-design-icons/ArrowLeftRight.tsx) | `ArrowLeftRight` (icon, 추론) | product-local |
| [components/q-design-icons/ArrowRight.tsx](../../Q-Works/components/q-design-icons/ArrowRight.tsx) | `ArrowRight` (icon, 추론) | product-local |
| [components/q-design-icons/ArrowRightCircle.tsx](../../Q-Works/components/q-design-icons/ArrowRightCircle.tsx) | `ArrowRightCircle` (icon, 추론) | product-local |
| [components/q-design-icons/ArrowUp.tsx](../../Q-Works/components/q-design-icons/ArrowUp.tsx) | `ArrowUp` (icon, 추론) | product-local |
| [components/q-design-icons/ArrowUpCircle.tsx](../../Q-Works/components/q-design-icons/ArrowUpCircle.tsx) | `ArrowUpCircle` (icon, 추론) | product-local |
| [components/q-design-icons/BadgeCheck.tsx](../../Q-Works/components/q-design-icons/BadgeCheck.tsx) | `BadgeCheck` (icon, 추론) | product-local |
| [components/q-design-icons/BarChart3.tsx](../../Q-Works/components/q-design-icons/BarChart3.tsx) | `BarChart3` (icon, 추론) | product-local |
| [components/q-design-icons/Barcode.tsx](../../Q-Works/components/q-design-icons/Barcode.tsx) | `Barcode` (icon, 추론) | product-local |
| [components/q-design-icons/Bell.tsx](../../Q-Works/components/q-design-icons/Bell.tsx) | `Bell` (icon, 추론) | product-local |
| [components/q-design-icons/BellRing.tsx](../../Q-Works/components/q-design-icons/BellRing.tsx) | `BellRing` (icon, 추론) | product-local |
| [components/q-design-icons/BookMarked.tsx](../../Q-Works/components/q-design-icons/BookMarked.tsx) | `BookMarked` (icon, 추론) | product-local |
| [components/q-design-icons/BookOpen.tsx](../../Q-Works/components/q-design-icons/BookOpen.tsx) | `BookOpen` (icon, 추론) | product-local |
| [components/q-design-icons/BookText.tsx](../../Q-Works/components/q-design-icons/BookText.tsx) | `BookText` (icon, 추론) | product-local |
| [components/q-design-icons/Boxes.tsx](../../Q-Works/components/q-design-icons/Boxes.tsx) | `Boxes` (icon, 추론) | product-local |
| [components/q-design-icons/Building2.tsx](../../Q-Works/components/q-design-icons/Building2.tsx) | `Building2` (icon, 추론) | product-local |
| [components/q-design-icons/Calendar.tsx](../../Q-Works/components/q-design-icons/Calendar.tsx) | `Calendar` (icon, 추론) | product-local |
| [components/q-design-icons/CalendarDays.tsx](../../Q-Works/components/q-design-icons/CalendarDays.tsx) | `CalendarDays` (icon, 추론) | product-local |
| [components/q-design-icons/CalendarPlus.tsx](../../Q-Works/components/q-design-icons/CalendarPlus.tsx) | `CalendarPlus` (icon, 추론) | product-local |
| [components/q-design-icons/CalendarRange.tsx](../../Q-Works/components/q-design-icons/CalendarRange.tsx) | `CalendarRange` (icon, 추론) | product-local |
| [components/q-design-icons/Check.tsx](../../Q-Works/components/q-design-icons/Check.tsx) | `Check` (icon, 추론) | product-local |
| [components/q-design-icons/CheckCheck.tsx](../../Q-Works/components/q-design-icons/CheckCheck.tsx) | `CheckCheck` (icon, 추론) | product-local |
| [components/q-design-icons/CheckCircle2.tsx](../../Q-Works/components/q-design-icons/CheckCircle2.tsx) | `CheckCircle2` (icon, 추론) | product-local |
| [components/q-design-icons/ChevronDown.tsx](../../Q-Works/components/q-design-icons/ChevronDown.tsx) | `ChevronDown` (icon, 추론) | product-local |
| [components/q-design-icons/ChevronLeft.tsx](../../Q-Works/components/q-design-icons/ChevronLeft.tsx) | `ChevronLeft` (icon, 추론) | product-local |
| [components/q-design-icons/ChevronRight.tsx](../../Q-Works/components/q-design-icons/ChevronRight.tsx) | `ChevronRight` (icon, 추론) | product-local |
| [components/q-design-icons/ChevronsLeft.tsx](../../Q-Works/components/q-design-icons/ChevronsLeft.tsx) | `ChevronsLeft` (icon, 추론) | product-local |
| [components/q-design-icons/ChevronsRight.tsx](../../Q-Works/components/q-design-icons/ChevronsRight.tsx) | `ChevronsRight` (icon, 추론) | product-local |
| [components/q-design-icons/ChevronsUpDown.tsx](../../Q-Works/components/q-design-icons/ChevronsUpDown.tsx) | `ChevronsUpDown` (icon, 추론) | product-local |
| [components/q-design-icons/Chrome.tsx](../../Q-Works/components/q-design-icons/Chrome.tsx) | `Chrome` (icon, 추론) | product-local |
| [components/q-design-icons/Circle.tsx](../../Q-Works/components/q-design-icons/Circle.tsx) | `Circle` (icon, 추론) | product-local |
| [components/q-design-icons/ClipboardCheck.tsx](../../Q-Works/components/q-design-icons/ClipboardCheck.tsx) | `ClipboardCheck` (icon, 추론) | product-local |
| [components/q-design-icons/ClipboardList.tsx](../../Q-Works/components/q-design-icons/ClipboardList.tsx) | `ClipboardList` (icon, 추론) | product-local |
| [components/q-design-icons/Compass.tsx](../../Q-Works/components/q-design-icons/Compass.tsx) | `Compass` (icon, 추론) | product-local |
| [components/q-design-icons/Copy.tsx](../../Q-Works/components/q-design-icons/Copy.tsx) | `Copy` (icon, 추론) | product-local |
| [components/q-design-icons/CornerDownLeft.tsx](../../Q-Works/components/q-design-icons/CornerDownLeft.tsx) | `CornerDownLeft` (icon, 추론) | product-local |
| [components/q-design-icons/Cpu.tsx](../../Q-Works/components/q-design-icons/Cpu.tsx) | `Cpu` (icon, 추론) | product-local |
| [components/q-design-icons/Delete.tsx](../../Q-Works/components/q-design-icons/Delete.tsx) | `Delete` (icon, 추론) | product-local |
| [components/q-design-icons/Download.tsx](../../Q-Works/components/q-design-icons/Download.tsx) | `Download` (icon, 추론) | product-local |
| [components/q-design-icons/Eraser.tsx](../../Q-Works/components/q-design-icons/Eraser.tsx) | `Eraser` (icon, 추론) | product-local |
| [components/q-design-icons/ExternalLink.tsx](../../Q-Works/components/q-design-icons/ExternalLink.tsx) | `ExternalLink` (icon, 추론) | product-local |
| [components/q-design-icons/Eye.tsx](../../Q-Works/components/q-design-icons/Eye.tsx) | `Eye` (icon, 추론) | product-local |
| [components/q-design-icons/EyeOff.tsx](../../Q-Works/components/q-design-icons/EyeOff.tsx) | `EyeOff` (icon, 추론) | product-local |
| [components/q-design-icons/Factory.tsx](../../Q-Works/components/q-design-icons/Factory.tsx) | `Factory` (icon, 추론) | product-local |
| [components/q-design-icons/FileCheck2.tsx](../../Q-Works/components/q-design-icons/FileCheck2.tsx) | `FileCheck2` (icon, 추론) | product-local |
| [components/q-design-icons/FileDown.tsx](../../Q-Works/components/q-design-icons/FileDown.tsx) | `FileDown` (icon, 추론) | product-local |
| [components/q-design-icons/FileJson.tsx](../../Q-Works/components/q-design-icons/FileJson.tsx) | `FileJson` (icon, 추론) | product-local |
| [components/q-design-icons/FileQuestion.tsx](../../Q-Works/components/q-design-icons/FileQuestion.tsx) | `FileQuestion` (icon, 추론) | product-local |
| [components/q-design-icons/FileSignature.tsx](../../Q-Works/components/q-design-icons/FileSignature.tsx) | `FileSignature` (icon, 추론) | product-local |
| [components/q-design-icons/FileSpreadsheet.tsx](../../Q-Works/components/q-design-icons/FileSpreadsheet.tsx) | `FileSpreadsheet` (icon, 추론) | product-local |
| [components/q-design-icons/FileText.tsx](../../Q-Works/components/q-design-icons/FileText.tsx) | `FileText` (icon, 추론) | product-local |
| [components/q-design-icons/FileUp.tsx](../../Q-Works/components/q-design-icons/FileUp.tsx) | `FileUp` (icon, 추론) | product-local |
| [components/q-design-icons/Files.tsx](../../Q-Works/components/q-design-icons/Files.tsx) | `Files` (icon, 추론) | product-local |
| [components/q-design-icons/Fingerprint.tsx](../../Q-Works/components/q-design-icons/Fingerprint.tsx) | `Fingerprint` (icon, 추론) | product-local |
| [components/q-design-icons/FlaskConical.tsx](../../Q-Works/components/q-design-icons/FlaskConical.tsx) | `FlaskConical` (icon, 추론) | product-local |
| [components/q-design-icons/Folder.tsx](../../Q-Works/components/q-design-icons/Folder.tsx) | `Folder` (icon, 추론) | product-local |
| [components/q-design-icons/FolderPlus.tsx](../../Q-Works/components/q-design-icons/FolderPlus.tsx) | `FolderPlus` (icon, 추론) | product-local |
| [components/q-design-icons/Gauge.tsx](../../Q-Works/components/q-design-icons/Gauge.tsx) | `Gauge` (icon, 추론) | product-local |
| [components/q-design-icons/Gavel.tsx](../../Q-Works/components/q-design-icons/Gavel.tsx) | `Gavel` (icon, 추론) | product-local |
| [components/q-design-icons/GitBranch.tsx](../../Q-Works/components/q-design-icons/GitBranch.tsx) | `GitBranch` (icon, 추론) | product-local |
| [components/q-design-icons/GitPullRequest.tsx](../../Q-Works/components/q-design-icons/GitPullRequest.tsx) | `GitPullRequest` (icon, 추론) | product-local |
| [components/q-design-icons/GraduationCap.tsx](../../Q-Works/components/q-design-icons/GraduationCap.tsx) | `GraduationCap` (icon, 추론) | product-local |
| [components/q-design-icons/HardHat.tsx](../../Q-Works/components/q-design-icons/HardHat.tsx) | `HardHat` (icon, 추론) | product-local |
| [components/q-design-icons/HelpCircle.tsx](../../Q-Works/components/q-design-icons/HelpCircle.tsx) | `HelpCircle` (icon, 추론) | product-local |
| [components/q-design-icons/History.tsx](../../Q-Works/components/q-design-icons/History.tsx) | `History` (icon, 추론) | product-local |
| [components/q-design-icons/Image.tsx](../../Q-Works/components/q-design-icons/Image.tsx) | `Image` (icon, 추론) | product-local |
| [components/q-design-icons/ImagePlus.tsx](../../Q-Works/components/q-design-icons/ImagePlus.tsx) | `ImagePlus` (icon, 추론) | product-local |
| [components/q-design-icons/Inbox.tsx](../../Q-Works/components/q-design-icons/Inbox.tsx) | `Inbox` (icon, 추론) | product-local |
| [components/q-design-icons/Info.tsx](../../Q-Works/components/q-design-icons/Info.tsx) | `Info` (icon, 추론) | product-local |
| [components/q-design-icons/KeyRound.tsx](../../Q-Works/components/q-design-icons/KeyRound.tsx) | `KeyRound` (icon, 추론) | product-local |
| [components/q-design-icons/LayoutDashboard.tsx](../../Q-Works/components/q-design-icons/LayoutDashboard.tsx) | `LayoutDashboard` (icon, 추론) | product-local |
| [components/q-design-icons/LayoutGrid.tsx](../../Q-Works/components/q-design-icons/LayoutGrid.tsx) | `LayoutGrid` (icon, 추론) | product-local |
| [components/q-design-icons/Leaf.tsx](../../Q-Works/components/q-design-icons/Leaf.tsx) | `Leaf` (icon, 추론) | product-local |
| [components/q-design-icons/LifeBuoy.tsx](../../Q-Works/components/q-design-icons/LifeBuoy.tsx) | `LifeBuoy` (icon, 추론) | product-local |
| [components/q-design-icons/Lightbulb.tsx](../../Q-Works/components/q-design-icons/Lightbulb.tsx) | `Lightbulb` (icon, 추론) | product-local |
| [components/q-design-icons/Link2.tsx](../../Q-Works/components/q-design-icons/Link2.tsx) | `Link2` (icon, 추론) | product-local |
| [components/q-design-icons/Loader2.tsx](../../Q-Works/components/q-design-icons/Loader2.tsx) | `Loader2` (icon, 추론) | product-local |
| [components/q-design-icons/Lock.tsx](../../Q-Works/components/q-design-icons/Lock.tsx) | `Lock` (icon, 추론) | product-local |
| [components/q-design-icons/LockOpen.tsx](../../Q-Works/components/q-design-icons/LockOpen.tsx) | `LockOpen` (icon, 추론) | product-local |
| [components/q-design-icons/Mail.tsx](../../Q-Works/components/q-design-icons/Mail.tsx) | `Mail` (icon, 추론) | product-local |
| [components/q-design-icons/MapPin.tsx](../../Q-Works/components/q-design-icons/MapPin.tsx) | `MapPin` (icon, 추론) | product-local |
| [components/q-design-icons/Megaphone.tsx](../../Q-Works/components/q-design-icons/Megaphone.tsx) | `Megaphone` (icon, 추론) | product-local |
| [components/q-design-icons/Menu.tsx](../../Q-Works/components/q-design-icons/Menu.tsx) | `Menu` (icon, 추론) | product-local |
| [components/q-design-icons/MessageCircleQuestion.tsx](../../Q-Works/components/q-design-icons/MessageCircleQuestion.tsx) | `MessageCircleQuestion` (icon, 추론) | product-local |
| [components/q-design-icons/MessageSquare.tsx](../../Q-Works/components/q-design-icons/MessageSquare.tsx) | `MessageSquare` (icon, 추론) | product-local |
| [components/q-design-icons/Minus.tsx](../../Q-Works/components/q-design-icons/Minus.tsx) | `Minus` (icon, 추론) | product-local |
| [components/q-design-icons/Monitor.tsx](../../Q-Works/components/q-design-icons/Monitor.tsx) | `Monitor` (icon, 추론) | product-local |
| [components/q-design-icons/Moon.tsx](../../Q-Works/components/q-design-icons/Moon.tsx) | `Moon` (icon, 추론) | product-local |
| [components/q-design-icons/Network.tsx](../../Q-Works/components/q-design-icons/Network.tsx) | `Network` (icon, 추론) | product-local |
| [components/q-design-icons/NotebookPen.tsx](../../Q-Works/components/q-design-icons/NotebookPen.tsx) | `NotebookPen` (icon, 추론) | product-local |
| [components/q-design-icons/PackageCheck.tsx](../../Q-Works/components/q-design-icons/PackageCheck.tsx) | `PackageCheck` (icon, 추론) | product-local |
| [components/q-design-icons/PackageOpen.tsx](../../Q-Works/components/q-design-icons/PackageOpen.tsx) | `PackageOpen` (icon, 추론) | product-local |
| [components/q-design-icons/PackagePlus.tsx](../../Q-Works/components/q-design-icons/PackagePlus.tsx) | `PackagePlus` (icon, 추론) | product-local |
| [components/q-design-icons/PackageSearch.tsx](../../Q-Works/components/q-design-icons/PackageSearch.tsx) | `PackageSearch` (icon, 추론) | product-local |
| [components/q-design-icons/PackageX.tsx](../../Q-Works/components/q-design-icons/PackageX.tsx) | `PackageX` (icon, 추론) | product-local |
| [components/q-design-icons/PanelsTopLeft.tsx](../../Q-Works/components/q-design-icons/PanelsTopLeft.tsx) | `PanelsTopLeft` (icon, 추론) | product-local |
| [components/q-design-icons/Paperclip.tsx](../../Q-Works/components/q-design-icons/Paperclip.tsx) | `Paperclip` (icon, 추론) | product-local |
| [components/q-design-icons/PenLine.tsx](../../Q-Works/components/q-design-icons/PenLine.tsx) | `PenLine` (icon, 추론) | product-local |
| [components/q-design-icons/Pencil.tsx](../../Q-Works/components/q-design-icons/Pencil.tsx) | `Pencil` (icon, 추론) | product-local |
| [components/q-design-icons/Phone.tsx](../../Q-Works/components/q-design-icons/Phone.tsx) | `Phone` (icon, 추론) | product-local |
| [components/q-design-icons/PhoneIncoming.tsx](../../Q-Works/components/q-design-icons/PhoneIncoming.tsx) | `PhoneIncoming` (icon, 추론) | product-local |
| [components/q-design-icons/Pin.tsx](../../Q-Works/components/q-design-icons/Pin.tsx) | `Pin` (icon, 추론) | product-local |
| [components/q-design-icons/PlayCircle.tsx](../../Q-Works/components/q-design-icons/PlayCircle.tsx) | `PlayCircle` (icon, 추론) | product-local |
| [components/q-design-icons/Plus.tsx](../../Q-Works/components/q-design-icons/Plus.tsx) | `Plus` (icon, 추론) | product-local |
| [components/q-design-icons/Printer.tsx](../../Q-Works/components/q-design-icons/Printer.tsx) | `Printer` (icon, 추론) | product-local |
| [components/q-design-icons/Rocket.tsx](../../Q-Works/components/q-design-icons/Rocket.tsx) | `Rocket` (icon, 추론) | product-local |
| [components/q-design-icons/RotateCcw.tsx](../../Q-Works/components/q-design-icons/RotateCcw.tsx) | `RotateCcw` (icon, 추론) | product-local |
| [components/q-design-icons/Ruler.tsx](../../Q-Works/components/q-design-icons/Ruler.tsx) | `Ruler` (icon, 추론) | product-local |
| [components/q-design-icons/Save.tsx](../../Q-Works/components/q-design-icons/Save.tsx) | `Save` (icon, 추론) | product-local |
| [components/q-design-icons/Scale.tsx](../../Q-Works/components/q-design-icons/Scale.tsx) | `Scale` (icon, 추론) | product-local |
| [components/q-design-icons/ScanSearch.tsx](../../Q-Works/components/q-design-icons/ScanSearch.tsx) | `ScanSearch` (icon, 추론) | product-local |
| [components/q-design-icons/ScrollText.tsx](../../Q-Works/components/q-design-icons/ScrollText.tsx) | `ScrollText` (icon, 추론) | product-local |
| [components/q-design-icons/Search.tsx](../../Q-Works/components/q-design-icons/Search.tsx) | `Search` (icon, 추론) | product-local |
| [components/q-design-icons/SearchCheck.tsx](../../Q-Works/components/q-design-icons/SearchCheck.tsx) | `SearchCheck` (icon, 추론) | product-local |
| [components/q-design-icons/Send.tsx](../../Q-Works/components/q-design-icons/Send.tsx) | `Send` (icon, 추론) | product-local |
| [components/q-design-icons/Settings.tsx](../../Q-Works/components/q-design-icons/Settings.tsx) | `Settings` (icon, 추론) | product-local |
| [components/q-design-icons/Settings2.tsx](../../Q-Works/components/q-design-icons/Settings2.tsx) | `Settings2` (icon, 추론) | product-local |
| [components/q-design-icons/Share.tsx](../../Q-Works/components/q-design-icons/Share.tsx) | `Share` (icon, 추론) | product-local |
| [components/q-design-icons/Share2.tsx](../../Q-Works/components/q-design-icons/Share2.tsx) | `Share2` (icon, 추론) | product-local |
| [components/q-design-icons/ShieldAlert.tsx](../../Q-Works/components/q-design-icons/ShieldAlert.tsx) | `ShieldAlert` (icon, 추론) | product-local |
| [components/q-design-icons/ShieldCheck.tsx](../../Q-Works/components/q-design-icons/ShieldCheck.tsx) | `ShieldCheck` (icon, 추론) | product-local |
| [components/q-design-icons/ShieldOff.tsx](../../Q-Works/components/q-design-icons/ShieldOff.tsx) | `ShieldOff` (icon, 추론) | product-local |
| [components/q-design-icons/ShoppingCart.tsx](../../Q-Works/components/q-design-icons/ShoppingCart.tsx) | `ShoppingCart` (icon, 추론) | product-local |
| [components/q-design-icons/SlidersHorizontal.tsx](../../Q-Works/components/q-design-icons/SlidersHorizontal.tsx) | `SlidersHorizontal` (icon, 추론) | product-local |
| [components/q-design-icons/Smartphone.tsx](../../Q-Works/components/q-design-icons/Smartphone.tsx) | `Smartphone` (icon, 추론) | product-local |
| [components/q-design-icons/Smile.tsx](../../Q-Works/components/q-design-icons/Smile.tsx) | `Smile` (icon, 추론) | product-local |
| [components/q-design-icons/Sparkles.tsx](../../Q-Works/components/q-design-icons/Sparkles.tsx) | `Sparkles` (icon, 추론) | product-local |
| [components/q-design-icons/Stamp.tsx](../../Q-Works/components/q-design-icons/Stamp.tsx) | `Stamp` (icon, 추론) | product-local |
| [components/q-design-icons/Star.tsx](../../Q-Works/components/q-design-icons/Star.tsx) | `Star` (icon, 추론) | product-local |
| [components/q-design-icons/Store.tsx](../../Q-Works/components/q-design-icons/Store.tsx) | `Store` (icon, 추론) | product-local |
| [components/q-design-icons/Sun.tsx](../../Q-Works/components/q-design-icons/Sun.tsx) | `Sun` (icon, 추론) | product-local |
| [components/q-design-icons/TabletSmartphone.tsx](../../Q-Works/components/q-design-icons/TabletSmartphone.tsx) | `TabletSmartphone` (icon, 추론) | product-local |
| [components/q-design-icons/Tag.tsx](../../Q-Works/components/q-design-icons/Tag.tsx) | `Tag` (icon, 추론) | product-local |
| [components/q-design-icons/Tags.tsx](../../Q-Works/components/q-design-icons/Tags.tsx) | `Tags` (icon, 추론) | product-local |
| [components/q-design-icons/Target.tsx](../../Q-Works/components/q-design-icons/Target.tsx) | `Target` (icon, 추론) | product-local |
| [components/q-design-icons/Trash2.tsx](../../Q-Works/components/q-design-icons/Trash2.tsx) | `Trash2` (icon, 추론) | product-local |
| [components/q-design-icons/TrendingUp.tsx](../../Q-Works/components/q-design-icons/TrendingUp.tsx) | `TrendingUp` (icon, 추론) | product-local |
| [components/q-design-icons/TriangleAlert.tsx](../../Q-Works/components/q-design-icons/TriangleAlert.tsx) | `TriangleAlert` (icon, 추론) | product-local |
| [components/q-design-icons/Truck.tsx](../../Q-Works/components/q-design-icons/Truck.tsx) | `Truck` (icon, 추론) | product-local |
| [components/q-design-icons/Undo2.tsx](../../Q-Works/components/q-design-icons/Undo2.tsx) | `Undo2` (icon, 추론) | product-local |
| [components/q-design-icons/Upload.tsx](../../Q-Works/components/q-design-icons/Upload.tsx) | `Upload` (icon, 추론) | product-local |
| [components/q-design-icons/User2.tsx](../../Q-Works/components/q-design-icons/User2.tsx) | `User2` (icon, 추론) | product-local |
| [components/q-design-icons/UserCheck.tsx](../../Q-Works/components/q-design-icons/UserCheck.tsx) | `UserCheck` (icon, 추론) | product-local |
| [components/q-design-icons/UserCog.tsx](../../Q-Works/components/q-design-icons/UserCog.tsx) | `UserCog` (icon, 추론) | product-local |
| [components/q-design-icons/UserPlus.tsx](../../Q-Works/components/q-design-icons/UserPlus.tsx) | `UserPlus` (icon, 추론) | product-local |
| [components/q-design-icons/Users.tsx](../../Q-Works/components/q-design-icons/Users.tsx) | `Users` (icon, 추론) | product-local |
| [components/q-design-icons/Warehouse.tsx](../../Q-Works/components/q-design-icons/Warehouse.tsx) | `Warehouse` (icon, 추론) | product-local |
| [components/q-design-icons/Wrench.tsx](../../Q-Works/components/q-design-icons/Wrench.tsx) | `Wrench` (icon, 추론) | product-local |
| [components/q-design-icons/X.tsx](../../Q-Works/components/q-design-icons/X.tsx) | `X` (icon, 추론) | product-local |
| [components/q-design-icons/XCircle.tsx](../../Q-Works/components/q-design-icons/XCircle.tsx) | `XCircle` (icon, 추론) | product-local |
| [components/q-design-icons/_icon.tsx](../../Q-Works/components/q-design-icons/_icon.tsx) | `createIcon` (icon, 추론), `Icon` (icon, 추론) | qd-class-reference |
| [components/reviews/evidence-panel.tsx](../../Q-Works/components/reviews/evidence-panel.tsx) | `EvidencePanel` (composition, 추론) | product-local |
| [components/risks/risk-matrix.tsx](../../Q-Works/components/risks/risk-matrix.tsx) | `RiskLevelLegend` (composition, 추론), `RiskMatrix` (composition, 추론) | product-local |
| [components/shared/access-denied-banner.tsx](../../Q-Works/components/shared/access-denied-banner.tsx) | `AccessDeniedBanner` (feedback) | qd-class-reference |
| [components/shared/app-window-title.tsx](../../Q-Works/components/shared/app-window-title.tsx) | `AppWindowTitle` (provider, 추론) | canonical-copy |
| [components/shared/approval-flow.tsx](../../Q-Works/components/shared/approval-flow.tsx) | `ApprovalFlow` (stages) | qd-class-reference |
| [components/shared/approval-header.tsx](../../Q-Works/components/shared/approval-header.tsx) | `ApprovalHeader` (page-head) | product-local |
| [components/shared/attendance-list.tsx](../../Q-Works/components/shared/attendance-list.tsx) | `AttendanceList` (data-display, 추론) | qd-class-reference |
| [components/shared/attendee-picker.tsx](../../Q-Works/components/shared/attendee-picker.tsx) | `AttendeePicker` (field, 추론) | qd-class-reference |
| [components/shared/badge.tsx](../../Q-Works/components/shared/badge.tsx) | `Badge` (badge), `BadgeRaw` (badge) | qd-class-reference |
| [components/shared/batch-save-bar.tsx](../../Q-Works/components/shared/batch-save-bar.tsx) | `BatchSaveBar` (form-section), `ChangedMark` (feedback) | product-local |
| [components/shared/brand-logo.tsx](../../Q-Works/components/shared/brand-logo.tsx) | `BrandLogo` (identity, 추론) | product-local |
| [components/shared/clause-tree.tsx](../../Q-Works/components/shared/clause-tree.tsx) | `ClauseTree` (tree-navigation), `TreeRowNode` (composition, 추론) | product-local |
| [components/shared/confirm-judgment-dialog.tsx](../../Q-Works/components/shared/confirm-judgment-dialog.tsx) | `ConfirmJudgmentDialog` (modal) | qd-class-reference |
| [components/shared/count-card.tsx](../../Q-Works/components/shared/count-card.tsx) | `CountCard` (kpi) | product-local |
| [components/shared/date-range-filter.tsx](../../Q-Works/components/shared/date-range-filter.tsx) | `DateRangeFilter` (date, list-toolbar) | product-local |
| [components/shared/delete-seat-provider.tsx](../../Q-Works/components/shared/delete-seat-provider.tsx) | `DeleteSeatProvider` (provider, 추론) | product-local |
| [components/shared/delete-with-reason-dialog.tsx](../../Q-Works/components/shared/delete-with-reason-dialog.tsx) | `DeleteWithReasonDialog` (modal) | qd-class-reference |
| [components/shared/detail-field.tsx](../../Q-Works/components/shared/detail-field.tsx) | `DetailField` (record-row) | product-local |
| [components/shared/doc-badges.tsx](../../Q-Works/components/shared/doc-badges.tsx) | `LevelBadge` (badge), `StatusBadge` (badge) | product-local |
| [components/shared/editable-card.tsx](../../Q-Works/components/shared/editable-card.tsx) | `EditableCard` (form-section) | qd-class-reference |
| [components/shared/empty-state.tsx](../../Q-Works/components/shared/empty-state.tsx) | `EmptyState` (empty) | qd-class-reference |
| [components/shared/export-csv-button.tsx](../../Q-Works/components/shared/export-csv-button.tsx) | `ExportCsvButton` (action, 추론) | product-local |
| [components/shared/filter-chip.tsx](../../Q-Works/components/shared/filter-chip.tsx) | `FilterChip` (choice-chip) | qd-class-reference |
| [components/shared/form-dialog.tsx](../../Q-Works/components/shared/form-dialog.tsx) | `FormDialog` (modal) | qd-class-reference |
| [components/shared/import-kit.tsx](../../Q-Works/components/shared/import-kit.tsx) | `bulk` (composition, 추론), `ImportActionCell` (record-row), `ImportCommitBar` (form-section), `ImportFilePicker` (file-input), `ImportRules` (form-section), `ImportSummary` (feedback) | qd-class-reference |
| [components/shared/install-pwa.tsx](../../Q-Works/components/shared/install-pwa.tsx) | `InstallPwa` (toast) | qd-class-reference |
| [components/shared/linked-doc-card.tsx](../../Q-Works/components/shared/linked-doc-card.tsx) | `LinkedDocCard` (record-row), `LinkedDocRow` (record-row), `Row` (data-display, 추론) | qd-class-reference |
| [components/shared/list-filter-select.tsx](../../Q-Works/components/shared/list-filter-select.tsx) | `ListFilterSelect` (list-toolbar) | product-local |
| [components/shared/list-load-failed.tsx](../../Q-Works/components/shared/list-load-failed.tsx) | `ListLoadFailed` (feedback) | product-local |
| [components/shared/list-search.tsx](../../Q-Works/components/shared/list-search.tsx) | `ListSearch` (list-toolbar) | qd-class-reference |
| [components/shared/list-stats.tsx](../../Q-Works/components/shared/list-stats.tsx) | `ListStats` (data-display, 추론) | product-local |
| [components/shared/missing-hint.tsx](../../Q-Works/components/shared/missing-hint.tsx) | `MissingHint` (feedback) | qd-class-reference |
| [components/shared/nc-capa-badges.tsx](../../Q-Works/components/shared/nc-capa-badges.tsx) | `NcSeverityBadge` (badge), `NcStatusBadge` (badge) | qd-class-reference |
| [components/shared/new-record-panel.tsx](../../Q-Works/components/shared/new-record-panel.tsx) | `NewRecordPanel` (form-section) | qd-class-reference |
| [components/shared/page-head.tsx](../../Q-Works/components/shared/page-head.tsx) | `PageHead` (page-head) | qd-class-reference |
| [components/shared/page-help.tsx](../../Q-Works/components/shared/page-help.tsx) | `PageHelp` (drawer, tooltip-info) | qd-class-reference |
| [components/shared/page-skeleton.tsx](../../Q-Works/components/shared/page-skeleton.tsx) | `BoardSkeleton` (loading), `CardGridSkeleton` (loading), `DetailSkeleton` (loading), `Filters` (feedback, 추론), `FormSkeleton` (loading), `ListSkeleton` (loading), `SkeletonHead` (loading), `Tabs` (navigation, 추론), `TreeSkeleton` (loading) | qd-class-reference |
| [components/shared/pagination.tsx](../../Q-Works/components/shared/pagination.tsx) | `ListPagination` (pagination), `PageSizeSelect` (list-toolbar, pagination), `Step` (navigation, 추론) | qd-class-reference |
| [components/shared/print-light.tsx](../../Q-Works/components/shared/print-light.tsx) | `PrintLight` (provider, 추론) | canonical-copy |
| [components/shared/qr-code.tsx](../../Q-Works/components/shared/qr-code.tsx) | `QrCode` (document, 추론) | product-local |
| [components/shared/record-foot.tsx](../../Q-Works/components/shared/record-foot.tsx) | `RecordFoot` (record-row) | product-local |
| [components/shared/revision-diff.tsx](../../Q-Works/components/shared/revision-diff.tsx) | `RevisionDiff` (document-diff) | product-local |
| [components/shared/rows-editor.tsx](../../Q-Works/components/shared/rows-editor.tsx) | `RowsEditor` (form-section) | product-local |
| [components/shared/sort-header-button.tsx](../../Q-Works/components/shared/sort-header-button.tsx) | `SortHeaderButton` (data-table) | qd-class-reference |
| [components/shared/sort-header.tsx](../../Q-Works/components/shared/sort-header.tsx) | `SortHeader` (data-table) | qd-class-reference |
| [components/shared/sortable-head.tsx](../../Q-Works/components/shared/sortable-head.tsx) | `makeSortHead` (navigation, 추론) | product-local |
| [components/shared/stat-block.tsx](../../Q-Works/components/shared/stat-block.tsx) | `StatBlock` (kpi), `StatRow` (kpi) | qd-class-reference |
| [components/shared/step-progress.tsx](../../Q-Works/components/shared/step-progress.tsx) | `Rail` (composition, 추론), `StepProgress` (stages) | qd-class-reference |
| [components/shared/sticky-focus-guard.tsx](../../Q-Works/components/shared/sticky-focus-guard.tsx) | `StickyFocusGuard` (provider, 추론) | canonical-copy |
| [components/shared/theme-provider.tsx](../../Q-Works/components/shared/theme-provider.tsx) | `ThemeBootstrap` (provider, 추론) | product-local |
| [components/shared/theme-toggle.tsx](../../Q-Works/components/shared/theme-toggle.tsx) | `AuthThemeToggle` (choice, 추론), `RailThemeToggle` (choice, 추론), `ThemeToggle` (choice, 추론) | qd-class-reference |
| [components/shared/unsaved-guard.tsx](../../Q-Works/components/shared/unsaved-guard.tsx) | `UnsavedNotice` (feedback) | qd-class-reference |
| [components/shared/view-tabs.tsx](../../Q-Works/components/shared/view-tabs.tsx) | `TabButton` (tabs), `TabCount` (tabs), `ViewTabs` (tabs) | qd-class-reference |
| [components/ui/button.tsx](../../Q-Works/components/ui/button.tsx) | `Button` (action, text-action) | qd-class-reference |
| [components/ui/calendar.tsx](../../Q-Works/components/ui/calendar.tsx) | `Calendar` (date), `NavButton` (field, 추론) | qd-class-reference |
| [components/ui/card.tsx](../../Q-Works/components/ui/card.tsx) | `Card` (container), `CardContent` (container), `CardDescription` (container), `CardFooter` (container), `CardHeader` (container), `CardTitle` (container) | qd-class-reference |
| [components/ui/checkbox.tsx](../../Q-Works/components/ui/checkbox.tsx) | `Checkbox` (check-toggle) | qd-class-reference |
| [components/ui/combobox.tsx](../../Q-Works/components/ui/combobox.tsx) | `Combobox` (select) | qd-class-reference |
| [components/ui/date-picker.tsx](../../Q-Works/components/ui/date-picker.tsx) | `DatePicker` (date) | qd-class-reference |
| [components/ui/date-range-picker.tsx](../../Q-Works/components/ui/date-range-picker.tsx) | `DateRangePicker` (date) | qd-class-reference |
| [components/ui/dialog.tsx](../../Q-Works/components/ui/dialog.tsx) | `Dialog` (modal), `DialogClose` (modal), `DialogContent` (modal), `DialogDescription` (modal), `DialogFooter` (modal), `DialogHeader` (modal), `DialogOverlay` (modal), `DialogPortal` (modal), `DialogTitle` (modal), `DialogTrigger` (modal) | qd-class-reference |
| [components/ui/field.tsx](../../Q-Works/components/ui/field.tsx) | `Field` (field) | qd-class-reference |
| [components/ui/input.tsx](../../Q-Works/components/ui/input.tsx) | `Input` (text-input) | qd-class-reference |
| [components/ui/label.tsx](../../Q-Works/components/ui/label.tsx) | `Label` (field) | qd-class-reference |
| [components/ui/money-input.tsx](../../Q-Works/components/ui/money-input.tsx) | `MoneyInput` (text-input) | product-local |
| [components/ui/password-input.tsx](../../Q-Works/components/ui/password-input.tsx) | `PasswordInput` (text-input) | qd-class-reference |
| [components/ui/select.tsx](../../Q-Works/components/ui/select.tsx) | `Select` (select) | qd-class-reference |
| [components/ui/sheet.tsx](../../Q-Works/components/ui/sheet.tsx) | `Sheet` (drawer), `SheetClose` (drawer), `SheetContent` (drawer), `SheetDescription` (drawer), `SheetOverlay` (overlay, 추론), `SheetPortal` (overlay, 추론), `SheetTitle` (drawer), `SheetTrigger` (drawer) | qd-class-reference |
| [components/ui/sonner.tsx](../../Q-Works/components/ui/sonner.tsx) | `Toaster` (toast) | qd-class-reference |
| [components/ui/suggest-input.tsx](../../Q-Works/components/ui/suggest-input.tsx) | `SuggestInput` (text-input) | qd-class-reference |
| [components/ui/textarea.tsx](../../Q-Works/components/ui/textarea.tsx) | `Textarea` (textarea) | qd-class-reference |
| [lib/documents/download-file.ts](../../Q-Works/lib/documents/download-file.ts) | `downloadSignedFile` (composition, 추론) | product-local |
| [lib/export/download-csv.ts](../../Q-Works/lib/export/download-csv.ts) | `downloadCsv` (composition, 추론) | product-local |
| [lib/images/prepare-mark.ts](../../Q-Works/lib/images/prepare-mark.ts) | `prepareMarkImage` (composition, 추론) | product-local |
| [lib/inbound/compress-image.ts](../../Q-Works/lib/inbound/compress-image.ts) | `compressImage` (composition, 추론) | product-local |

## Q-Carnet

| 파일 | 컴포넌트와 규칙 분류 | 연결 근거 |
| --- | --- | --- |
| [app/(admin)/board/cost/page.tsx](../../DHR/app/(admin)/board/cost/page.tsx) | `CostPage` (screen, 추론) | qd-class-reference |
| [app/(admin)/board/page.tsx](../../DHR/app/(admin)/board/page.tsx) | `BoardPage` (screen, 추론), `Def` (composition, 추론), `Field` (field, 추론), `PeriodTable` (data-display, 추론) | qd-class-reference |
| [app/(admin)/chrome.tsx](../../DHR/app/(admin)/chrome.tsx) | `AdminChrome` (composition, 추론), `Icon` (icon, 추론) | qd-class-reference |
| [app/(admin)/equipment/equipment-forms.tsx](../../DHR/app/(admin)/equipment/equipment-forms.tsx) | `BuyFields` (composition, 추론), `EquipCard` (composition, 추론), `NewEquipment` (composition, 추론), `ValidationPanel` (composition, 추론) | qd-class-reference |
| [app/(admin)/equipment/page.tsx](../../DHR/app/(admin)/equipment/page.tsx) | `EquipmentPage` (screen, 추론) | qd-class-reference |
| [app/(admin)/layout.tsx](../../DHR/app/(admin)/layout.tsx) | `AdminLayout` (layout, 추론) | qd-class-reference |
| [app/(admin)/loading.tsx](../../DHR/app/(admin)/loading.tsx) | `Loading` (feedback, 추론) | qd-class-reference |
| [app/(admin)/material/amend-form.tsx](../../DHR/app/(admin)/material/amend-form.tsx) | `AmendLotForm` (composition, 추론) | qd-class-reference |
| [app/(admin)/material/items/page.tsx](../../DHR/app/(admin)/material/items/page.tsx) | `MovedToItems` (composition, 추론) | product-local |
| [app/(admin)/material/layout.tsx](../../DHR/app/(admin)/material/layout.tsx) | `MaterialLayout` (layout, 추론) | product-local |
| [app/(admin)/material/movement/movement-forms.tsx](../../DHR/app/(admin)/material/movement/movement-forms.tsx) | `MovementForm` (composition, 추론), `MovementTabs` (navigation, 추론), `SolutionForm` (composition, 추론) | qd-class-reference |
| [app/(admin)/material/movement/page.tsx](../../DHR/app/(admin)/material/movement/page.tsx) | `MovementPage` (screen, 추론) | qd-class-reference |
| [app/(admin)/material/orders/order-forms.tsx](../../DHR/app/(admin)/material/orders/order-forms.tsx) | `CancelOrder` (composition, 추론), `NewOrder` (composition, 추론) | qd-class-reference |
| [app/(admin)/material/orders/page.tsx](../../DHR/app/(admin)/material/orders/page.tsx) | `OrdersPage` (screen, 추론) | qd-class-reference |
| [app/(admin)/material/page.tsx](../../DHR/app/(admin)/material/page.tsx) | `MaterialLotsPage` (screen, 추론) | product-local |
| [app/(admin)/material/receive-form.tsx](../../DHR/app/(admin)/material/receive-form.tsx) | `ReceiveForm` (composition, 추론) | qd-class-reference |
| [app/(admin)/material/stock/page.tsx](../../DHR/app/(admin)/material/stock/page.tsx) | `StockPage` (screen, 추론) | qd-class-reference |
| [app/(admin)/material/stock/stock-tools.tsx](../../DHR/app/(admin)/material/stock/stock-tools.tsx) | `StockTools` (composition, 추론) | qd-class-reference |
| [app/(admin)/nav.tsx](../../DHR/app/(admin)/nav.tsx) | `SubNav` (navigation, 추론) | qd-class-reference |
| [app/(admin)/page.tsx](../../DHR/app/(admin)/page.tsx) | `Dashboard` (screen, 추론) | qd-class-reference |
| [app/(admin)/production/[id]/batch-forms.tsx](../../DHR/app/(admin)/production/%5Bid%5D/batch-forms.tsx) | `CancelForm` (composition, 추론), `CutForm` (composition, 추론), `DayPrintLink` (composition, 추론), `EndForWorkerForm` (composition, 추론), `FinishForm` (composition, 추론), `LotStatusForm` (composition, 추론), `NonconformityForm` (composition, 추론), `RetrieveForm` (composition, 추론), `WipNonconformityForm` (composition, 추론) | qd-class-reference |
| [app/(admin)/production/[id]/page.tsx](../../DHR/app/(admin)/production/%5Bid%5D/page.tsx) | `BatchPage` (screen, 추론) | qd-class-reference |
| [app/(admin)/production/deviation-forms.tsx](../../DHR/app/(admin)/production/deviation-forms.tsx) | `DeviationRow` (data-display, 추론), `OpenDeviation` (composition, 추론) | qd-class-reference |
| [app/(admin)/production/deviation/page.tsx](../../DHR/app/(admin)/production/deviation/page.tsx) | `DeviationPage` (screen, 추론) | qd-class-reference |
| [app/(admin)/production/issue-form.tsx](../../DHR/app/(admin)/production/issue-form.tsx) | `IssueForm` (composition, 추론), `IssuerOptions` (composition, 추론) | qd-class-reference |
| [app/(admin)/production/page.tsx](../../DHR/app/(admin)/production/page.tsx) | `ProductionPage` (screen, 추론) | product-local |
| [app/(admin)/production/setup/page.tsx](../../DHR/app/(admin)/production/setup/page.tsx) | `ProductionSetupPage` (screen, 추론) | qd-class-reference |
| [app/(admin)/settings/access/page.tsx](../../DHR/app/(admin)/settings/access/page.tsx) | `AccessPage` (screen, 추론), `Mark` (composition, 추론) | qd-class-reference |
| [app/(admin)/settings/audit/entry.tsx](../../DHR/app/(admin)/settings/audit/entry.tsx) | `Entry` (composition, 추론) | qd-class-reference |
| [app/(admin)/settings/audit/page.tsx](../../DHR/app/(admin)/settings/audit/page.tsx) | `AuditPage` (screen, 추론), `Filters` (composition, 추론) | qd-class-reference |
| [app/(admin)/settings/backup/download-panel.tsx](../../DHR/app/(admin)/settings/backup/download-panel.tsx) | `DownloadPanel` (composition, 추론), `run` (composition, 추론) | qd-class-reference |
| [app/(admin)/settings/backup/page.tsx](../../DHR/app/(admin)/settings/backup/page.tsx) | `BackupPage` (screen, 추론) | qd-class-reference |
| [app/(admin)/settings/backup/restore-panel.tsx](../../DHR/app/(admin)/settings/backup/restore-panel.tsx) | `Field` (field, 추론), `RestorePanel` (composition, 추론) | qd-class-reference |
| [app/(admin)/settings/brand/brand-forms.tsx](../../DHR/app/(admin)/settings/brand/brand-forms.tsx) | `BrandForm` (composition, 추론), `LogoForm` (composition, 추론), `LogoNote` (composition, 추론), `LogoSlot` (composition, 추론), `row` (data-display, 추론) | qd-class-reference |
| [app/(admin)/settings/brand/page.tsx](../../DHR/app/(admin)/settings/brand/page.tsx) | `BrandPage` (screen, 추론) | product-local |
| [app/(admin)/settings/cost/labour-rate.tsx](../../DHR/app/(admin)/settings/cost/labour-rate.tsx) | `LabourRates` (composition, 추론) | qd-class-reference |
| [app/(admin)/settings/cost/page.tsx](../../DHR/app/(admin)/settings/cost/page.tsx) | `CostBasisPage` (screen, 추론) | product-local |
| [app/(admin)/settings/dmr/dmr-forms.tsx](../../DHR/app/(admin)/settings/dmr/dmr-forms.tsx) | `AddBomForm` (composition, 추론), `AddOperationForm` (composition, 추론), `AddTierForm` (composition, 추론), `BomSetForm` (composition, 추론), `DmrBasicsForm` (composition, 추론), `EditBomForm` (composition, 추론), `EditOperationForm` (composition, 추론), `EditTierForm` (composition, 추론), `field` (field, 추론), `NewDeviceMaster` (composition, 추론), `NewProduct` (composition, 추론), `OperationCard` (composition, 추론), `OperationSetForm` (composition, 추론), `SamplePlanForm` (composition, 추론), `shown` (composition, 추론), `TypicalDayForm` (composition, 추론), `VerifyForm` (composition, 추론) | qd-class-reference |
| [app/(admin)/settings/dmr/flow-diagram.tsx](../../DHR/app/(admin)/settings/dmr/flow-diagram.tsx) | `FlowDiagram` (composition, 추론) | product-local |
| [app/(admin)/settings/dmr/page.tsx](../../DHR/app/(admin)/settings/dmr/page.tsx) | `DmrPage` (screen, 추론) | qd-class-reference |
| [app/(admin)/settings/dmr/shelf-life.tsx](../../DHR/app/(admin)/settings/dmr/shelf-life.tsx) | `ShelfLifeForm` (composition, 추론) | qd-class-reference |
| [app/(admin)/settings/dmr/workbench.tsx](../../DHR/app/(admin)/settings/dmr/workbench.tsx) | `DmrWorkbench` (composition, 추론) | product-local |
| [app/(admin)/settings/equipment/page.tsx](../../DHR/app/(admin)/settings/equipment/page.tsx) | `MovedToEquipment` (composition, 추론) | product-local |
| [app/(admin)/settings/exchange/exchange-panels.tsx](../../DHR/app/(admin)/settings/exchange/exchange-panels.tsx) | `ExchangePanels` (composition, 추론), `runExport` (composition, 추론) | qd-class-reference |
| [app/(admin)/settings/exchange/page.tsx](../../DHR/app/(admin)/settings/exchange/page.tsx) | `ExchangePage` (screen, 추론) | qd-class-reference |
| [app/(admin)/settings/items/item-forms.tsx](../../DHR/app/(admin)/settings/items/item-forms.tsx) | `BulkItemForm` (composition, 추론), `BulkUdiForm` (composition, 추론), `GenerateFinished` (composition, 추론), `ItemRowView` (composition, 추론), `NewItemForm` (composition, 추론) | qd-class-reference |
| [app/(admin)/settings/items/page.tsx](../../DHR/app/(admin)/settings/items/page.tsx) | `ItemsPage` (screen, 추론) | qd-class-reference |
| [app/(admin)/settings/layout.tsx](../../DHR/app/(admin)/settings/layout.tsx) | `SettingsLayout` (layout, 추론) | product-local |
| [app/(admin)/settings/model/forms.tsx](../../DHR/app/(admin)/settings/model/forms.tsx) | `SchemeForm` (composition, 추론), `SegmentForm` (composition, 추론) | qd-class-reference |
| [app/(admin)/settings/model/page.tsx](../../DHR/app/(admin)/settings/model/page.tsx) | `ModelSchemePage` (screen, 추론) | qd-class-reference |
| [app/(admin)/settings/numbering/page.tsx](../../DHR/app/(admin)/settings/numbering/page.tsx) | `NumberingPage` (screen, 추론) | product-local |
| [app/(admin)/settings/numbering/rule-form.tsx](../../DHR/app/(admin)/settings/numbering/rule-form.tsx) | `Alert` (feedback, 추론), `RuleForm` (composition, 추론) | qd-class-reference |
| [app/(admin)/settings/numbering/target-card.tsx](../../DHR/app/(admin)/settings/numbering/target-card.tsx) | `Field` (field, 추론), `TargetCard` (composition, 추론) | qd-class-reference |
| [app/(admin)/settings/operations/ops-form.tsx](../../DHR/app/(admin)/settings/operations/ops-form.tsx) | `OpsForm` (composition, 추론) | qd-class-reference |
| [app/(admin)/settings/operations/page.tsx](../../DHR/app/(admin)/settings/operations/page.tsx) | `OperationsPage` (screen, 추론) | product-local |
| [app/(admin)/settings/page.tsx](../../DHR/app/(admin)/settings/page.tsx) | `SettingsHome` (composition, 추론) | qd-class-reference |
| [app/(admin)/settings/setup-steps.tsx](../../DHR/app/(admin)/settings/setup-steps.tsx) | `SetupSteps` (composition, 추론) | qd-class-reference |
| [app/(admin)/settings/suppliers/page.tsx](../../DHR/app/(admin)/settings/suppliers/page.tsx) | `SuppliersPage` (screen, 추론) | qd-class-reference |
| [app/(admin)/settings/suppliers/supplier-forms.tsx](../../DHR/app/(admin)/settings/suppliers/supplier-forms.tsx) | `Fields` (composition, 추론), `NewSupplierForm` (composition, 추론), `PriceForm` (composition, 추론), `SupplierRowView` (composition, 추론) | qd-class-reference |
| [app/(admin)/settings/users/new-user-form.tsx](../../DHR/app/(admin)/settings/users/new-user-form.tsx) | `NewUserForm` (composition, 추론) | qd-class-reference |
| [app/(admin)/settings/users/page.tsx](../../DHR/app/(admin)/settings/users/page.tsx) | `UsersPage` (screen, 추론) | qd-class-reference |
| [app/(admin)/settings/users/user-row.tsx](../../DHR/app/(admin)/settings/users/user-row.tsx) | `FlagPanel` (composition, 추론), `NamePanel` (composition, 추론), `Panel` (layout, 추론), `PinPanel` (composition, 추론), `QualPanel` (composition, 추론), `RolePanel` (composition, 추론), `UserRowView` (composition, 추론) | qd-class-reference |
| [app/(admin)/shipping/layout.tsx](../../DHR/app/(admin)/shipping/layout.tsx) | `ShippingLayout` (layout, 추론) | product-local |
| [app/(admin)/shipping/page.tsx](../../DHR/app/(admin)/shipping/page.tsx) | `ReleasePage` (screen, 추론) | qd-class-reference |
| [app/(admin)/shipping/ship/page.tsx](../../DHR/app/(admin)/shipping/ship/page.tsx) | `ShipPage` (screen, 추론) | qd-class-reference |
| [app/(admin)/shipping/shipping-forms.tsx](../../DHR/app/(admin)/shipping/shipping-forms.tsx) | `ApproveForm` (composition, 추론), `RequestBuilder` (composition, 추론), `ShipList` (data-display, 추론), `ShipRowForm` (composition, 추론), `SterilForm` (composition, 추론), `SterilRow` (data-display, 추론) | qd-class-reference |
| [app/(admin)/shipping/steril/page.tsx](../../DHR/app/(admin)/shipping/steril/page.tsx) | `SterilPage` (screen, 추론) | qd-class-reference |
| [app/(admin)/tools/layout.tsx](../../DHR/app/(admin)/tools/layout.tsx) | `ToolsLayout` (layout, 추론) | product-local |
| [app/(admin)/tools/link/link-form.tsx](../../DHR/app/(admin)/tools/link/link-form.tsx) | `LinkForm` (composition, 추론) | qd-class-reference |
| [app/(admin)/tools/link/page.tsx](../../DHR/app/(admin)/tools/link/page.tsx) | `LinkPage` (screen, 추론) | qd-class-reference |
| [app/(admin)/trace/[kind]/[id]/page.tsx](../../DHR/app/(admin)/trace/%5Bkind%5D/%5Bid%5D/page.tsx) | `BatchView` (composition, 추론), `GenTable` (data-display, 추론), `MaterialView` (composition, 추론), `TraceDetail` (composition, 추론) | qd-class-reference |
| [app/(admin)/trace/page.tsx](../../DHR/app/(admin)/trace/page.tsx) | `TracePage` (screen, 추론) | qd-class-reference |
| [app/(admin)/trace/verify/page.tsx](../../DHR/app/(admin)/trace/verify/page.tsx) | `VerifyPage` (screen, 추론) | qd-class-reference |
| [app/(work)/layout.tsx](../../DHR/app/(work)/layout.tsx) | `WorkLayout` (layout, 추론) | product-local |
| [app/(work)/loading.tsx](../../DHR/app/(work)/loading.tsx) | `Loading` (feedback, 추론) | qd-class-reference |
| [app/(work)/work/[id]/page.tsx](../../DHR/app/(work)/work/%5Bid%5D/page.tsx) | `WorkBatchPage` (screen, 추론) | qd-class-reference |
| [app/(work)/work/[id]/work-panel.tsx](../../DHR/app/(work)/work/%5Bid%5D/work-panel.tsx) | `CloseDayCard` (composition, 추론), `CutPanel` (composition, 추론), `EndForm` (composition, 추론), `IssueRow` (data-display, 추론), `MaterialForm` (composition, 추론), `OperationCard` (composition, 추론), `OpTile` (composition, 추론), `PrepCard` (composition, 추론), `RunningCard` (composition, 추론), `StartCard` (composition, 추론), `WorkPanel` (composition, 추론) | qd-class-reference |
| [app/(work)/work/page.tsx](../../DHR/app/(work)/work/page.tsx) | `WorkHome` (composition, 추론) | qd-class-reference |
| [app/(work)/work/scan-box.tsx](../../DHR/app/(work)/work/scan-box.tsx) | `ScanBox` (composition, 추론) | qd-class-reference |
| [app/error.tsx](../../DHR/app/error.tsx) | `ErrorScreen` (screen, 추론) | qd-class-reference |
| [app/fonts.css](../../DHR/app/fonts.css) | 스타일 기반 규칙 | product-local |
| [app/globals.css](../../DHR/app/globals.css) | 스타일 기반 규칙 | imports-canonical-module |
| [app/layout.tsx](../../DHR/app/layout.tsx) | `RootLayout` (layout, 추론) | imports-canonical-module |
| [app/login/login-form.tsx](../../DHR/app/login/login-form.tsx) | `LoginForm` (composition, 추론), `Slot` (composition, 추론) | qd-class-reference |
| [app/login/page.tsx](../../DHR/app/login/page.tsx) | `LoginPage` (screen, 추론) | product-local |
| [app/no-role/page.tsx](../../DHR/app/no-role/page.tsx) | `NoRolePage` (screen, 추론) | qd-class-reference |
| [app/not-found.tsx](../../DHR/app/not-found.tsx) | `NotFound` (composition, 추론) | qd-class-reference |
| [app/password/page.tsx](../../DHR/app/password/page.tsx) | `PasswordPage` (screen, 추론) | product-local |
| [app/password/pin-form.tsx](../../DHR/app/password/pin-form.tsx) | `PinForm` (composition, 추론) | qd-class-reference |
| [app/print/cover/[id]/page.tsx](../../DHR/app/print/cover/%5Bid%5D/page.tsx) | `CoverSheet` (document, 추론), `matTable` (document, 추론) | product-local |
| [app/print/day-record/[id]/[day]/[worker]/page.tsx](../../DHR/app/print/day-record/%5Bid%5D/%5Bday%5D/%5Bworker%5D/page.tsx) | `DayRecordDoc` (document, 추론), `DayRecordSheet` (document, 추론), `RecordTable` (document, 추론) | product-local |
| [app/print/day-record/[id]/all/page.tsx](../../DHR/app/print/day-record/%5Bid%5D/all/page.tsx) | `DayRecordBundle` (document, 추론) | product-local |
| [app/print/equipment-log/[id]/page.tsx](../../DHR/app/print/equipment-log/%5Bid%5D/page.tsx) | `EquipmentLogSheet` (document, 추론), `UseTable` (document, 추론) | product-local |
| [app/print/label-request/[id]/page.tsx](../../DHR/app/print/label-request/%5Bid%5D/page.tsx) | `labelHeading` (document, 추론), `LabelRequestSheet` (document, 추론), `labelTable` (document, 추론) | product-local |
| [app/print/label/[id]/page.tsx](../../DHR/app/print/label/%5Bid%5D/page.tsx) | `MaterialLabel` (field, 추론) | product-local |
| [app/print/layout.tsx](../../DHR/app/print/layout.tsx) | `PrintLayout` (document, 추론) | product-local |
| [app/print/release-request/[id]/page.tsx](../../DHR/app/print/release-request/%5Bid%5D/page.tsx) | `ReleaseRequestSheet` (document, 추론) | qd-class-reference |
| [app/print/work-order/[id]/page.tsx](../../DHR/app/print/work-order/%5Bid%5D/page.tsx) | `opName` (document, 추론), `OpTable` (document, 추론), `WorkOrderSheet` (document, 추론) | product-local |
| [app/q-design.components.css](../../DHR/app/q-design.components.css) | 스타일 기반 규칙 | canonical-copy |
| [app/q-design.foundation.css](../../DHR/app/q-design.foundation.css) | 스타일 기반 규칙 | canonical-copy |
| [app/q-design.list.css](../../DHR/app/q-design.list.css) | 스타일 기반 규칙 | canonical-copy |
| [app/q-design.nav.css](../../DHR/app/q-design.nav.css) | 스타일 기반 규칙 | canonical-copy |
| [app/q-design.palette.css](../../DHR/app/q-design.palette.css) | 스타일 기반 규칙 | canonical-copy |
| [app/q-design.screen.css](../../DHR/app/q-design.screen.css) | 스타일 기반 규칙 | canonical-copy |
| [app/q-design.theme.css](../../DHR/app/q-design.theme.css) | 스타일 기반 규칙 | canonical-copy |
| [app/q-design.workspace.css](../../DHR/app/q-design.workspace.css) | 스타일 기반 규칙 | canonical-copy |
| [components/action-chip.tsx](../../DHR/components/action-chip.tsx) | `ActionChip` (badge) | qd-class-reference |
| [components/app-window-title.tsx](../../DHR/components/app-window-title.tsx) | `AppWindowTitle` (provider, 추론) | canonical-copy |
| [components/audit-table.tsx](../../DHR/components/audit-table.tsx) | `AuditTable` (data-display, 추론) | qd-class-reference |
| [components/back-fab.tsx](../../DHR/components/back-fab.tsx) | `BackFab` (composition, 추론) | product-local |
| [components/barcode.tsx](../../DHR/components/barcode.tsx) | `Barcode` (composition, 추론) | product-local |
| [components/brand-mark-client.tsx](../../DHR/components/brand-mark-client.tsx) | `BrandMarkClient` (composition, 추론) | product-local |
| [components/brand-mark.tsx](../../DHR/components/brand-mark.tsx) | `BrandCopyright` (composition, 추론), `BrandMark` (identity, 추론), `SystemName` (composition, 추론) | qd-class-reference |
| [components/clock.tsx](../../DHR/components/clock.tsx) | `Clock` (composition, 추론) | product-local |
| [components/demo-banner.tsx](../../DHR/components/demo-banner.tsx) | `DemoBanner` (feedback, 추론) | qd-class-reference |
| [components/denied.tsx](../../DHR/components/denied.tsx) | `Denied` (composition, 추론) | qd-class-reference |
| [components/dialog.tsx](../../DHR/components/dialog.tsx) | `Dialog` (modal) | qd-class-reference |
| [components/find-unit.tsx](../../DHR/components/find-unit.tsx) | `FindUnit` (composition, 추론) | qd-class-reference |
| [components/idle-lock.tsx](../../DHR/components/idle-lock.tsx) | `IdleLock` (composition, 추론), `LockScreen` (screen, 추론) | qd-class-reference |
| [components/info-tip.tsx](../../DHR/components/info-tip.tsx) | `InfoTip` (tooltip-info) | qd-class-reference |
| [components/install-app.tsx](../../DHR/components/install-app.tsx) | `InstallApp` (composition, 추론) | qd-class-reference |
| [components/issue-link.tsx](../../DHR/components/issue-link.tsx) | `IssueLink` (composition, 추론) | qd-class-reference |
| [components/lot-balance.tsx](../../DHR/components/lot-balance.tsx) | `LotAvailable` (composition, 추론) | product-local |
| [components/num-pad.tsx](../../DHR/components/num-pad.tsx) | `NumPad` (field-numpad), `PresetPicker` (field-numpad) | qd-class-reference |
| [components/print-frame.tsx](../../DHR/components/print-frame.tsx) | `PreviewNote` (composition, 추론), `PrintBar` (composition, 추론), `PrintFrame` (composition, 추론), `Sheet` (overlay, 추론), `SignRow` (data-display, 추론), `ViewNote` (composition, 추론) | qd-class-reference |
| [components/print-light.tsx](../../DHR/components/print-light.tsx) | `PrintLight` (provider, 추론) | canonical-copy |
| [components/q-design-icons/BarChart3.tsx](../../DHR/components/q-design-icons/BarChart3.tsx) | `BarChart3` (icon, 추론) | product-local |
| [components/q-design-icons/ChevronLeft.tsx](../../DHR/components/q-design-icons/ChevronLeft.tsx) | `ChevronLeft` (icon, 추론) | product-local |
| [components/q-design-icons/ClipboardList.tsx](../../DHR/components/q-design-icons/ClipboardList.tsx) | `ClipboardList` (icon, 추론) | product-local |
| [components/q-design-icons/Factory.tsx](../../DHR/components/q-design-icons/Factory.tsx) | `Factory` (icon, 추론) | product-local |
| [components/q-design-icons/FileText.tsx](../../DHR/components/q-design-icons/FileText.tsx) | `FileText` (icon, 추론) | product-local |
| [components/q-design-icons/Globe.tsx](../../DHR/components/q-design-icons/Globe.tsx) | `Globe` (icon, 추론) | product-local |
| [components/q-design-icons/Home.tsx](../../DHR/components/q-design-icons/Home.tsx) | `Home` (icon, 추론) | product-local |
| [components/q-design-icons/Link2.tsx](../../DHR/components/q-design-icons/Link2.tsx) | `Link2` (icon, 추론) | product-local |
| [components/q-design-icons/Lock.tsx](../../DHR/components/q-design-icons/Lock.tsx) | `Lock` (icon, 추론) | product-local |
| [components/q-design-icons/Menu.tsx](../../DHR/components/q-design-icons/Menu.tsx) | `Menu` (icon, 추론) | product-local |
| [components/q-design-icons/Monitor.tsx](../../DHR/components/q-design-icons/Monitor.tsx) | `Monitor` (icon, 추론) | product-local |
| [components/q-design-icons/Moon.tsx](../../DHR/components/q-design-icons/Moon.tsx) | `Moon` (icon, 추론) | product-local |
| [components/q-design-icons/Package.tsx](../../DHR/components/q-design-icons/Package.tsx) | `Package` (icon, 추론) | product-local |
| [components/q-design-icons/Search.tsx](../../DHR/components/q-design-icons/Search.tsx) | `Search` (icon, 추론) | product-local |
| [components/q-design-icons/Settings.tsx](../../DHR/components/q-design-icons/Settings.tsx) | `Settings` (icon, 추론) | product-local |
| [components/q-design-icons/Sun.tsx](../../DHR/components/q-design-icons/Sun.tsx) | `Sun` (icon, 추론) | product-local |
| [components/q-design-icons/Truck.tsx](../../DHR/components/q-design-icons/Truck.tsx) | `Truck` (icon, 추론) | product-local |
| [components/q-design-icons/Wrench.tsx](../../DHR/components/q-design-icons/Wrench.tsx) | `Wrench` (icon, 추론) | product-local |
| [components/q-design-icons/_icon.tsx](../../DHR/components/q-design-icons/_icon.tsx) | `createIcon` (icon, 추론), `Icon` (icon, 추론) | qd-class-reference |
| [components/q-mark.tsx](../../DHR/components/q-mark.tsx) | `QMark` (composition, 추론) | product-local |
| [components/release-evidence.tsx](../../DHR/components/release-evidence.tsx) | `EvidenceDetails` (composition, 추론) | product-local |
| [components/ribbon.tsx](../../DHR/components/ribbon.tsx) | `Ribbon` (composition, 추론) | product-local |
| [components/row-link.tsx](../../DHR/components/row-link.tsx) | `RowLink` (record-row) | product-local |
| [components/shell.tsx](../../DHR/components/shell.tsx) | `FilterBar` (tabs, list-toolbar), `FilterSearch` (list-toolbar), `PageHead` (layout, 추론), `PageShell` (page-head), `StatStrip` (kpi) | qd-class-reference |
| [components/social-links.tsx](../../DHR/components/social-links.tsx) | `SocialLinks` (composition, 추론) | qd-class-reference |
| [components/stat-detail.tsx](../../DHR/components/stat-detail.tsx) | `StatDetail` (kpi) | qd-class-reference |
| [components/stat-rows.tsx](../../DHR/components/stat-rows.tsx) | `mono` (composition, 추론), `statRows` (composition, 추론) | product-local |
| [components/sticky-focus-guard.tsx](../../DHR/components/sticky-focus-guard.tsx) | `StickyFocusGuard` (provider, 추론) | canonical-copy |
| [components/table.tsx](../../DHR/components/table.tsx) | `ActionTd` (data-table), `ActionTh` (data-table), `IdCell` (data-table), `Table` (data-table), `Td` (data-table), `Th` (data-table), `TwoLine` (data-table, record-row) | qd-class-reference |
| [components/theme-toggle.tsx](../../DHR/components/theme-toggle.tsx) | `ThemeToggle` (choice, 추론) | qd-class-reference |
| [components/toast.tsx](../../DHR/components/toast.tsx) | `Toasts` (toast) | qd-class-reference |
| [components/top-progress.tsx](../../DHR/components/top-progress.tsx) | `TopProgressBar` (navigation, 추론) | canonical-copy |
| [components/ui.tsx](../../DHR/components/ui.tsx) | `Caution` (feedback), `Empty` (empty), `Field` (field, form-section), `ListCount` (pagination), `LockMark` (badge), `Msg` (feedback), `Panel` (section-title, form-section, container), `Progress` (progress), `Stat` (kpi), `TableWrap` (data-table), `Tag` (badge), `Truncated` (pagination), `Warnings` (feedback) | qd-class-reference |
| [components/watermark.tsx](../../DHR/components/watermark.tsx) | `Watermark` (composition, 추론) | product-local |
| [lib/css-metrics.ts](../../DHR/lib/css-metrics.ts) | `resolvedMetric` (data-display, 추론) | product-local |


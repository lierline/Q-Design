# 인라인 스타일 색인

생성물입니다. `node tools/extract-inline-styles.mjs` 로 다시 만듭니다.

Q-Atelier 는 스타일을 인라인 객체로 쓰므로 키프레임·호버·미디어쿼리가 컴포넌트 안에 들어갑니다.
**`globals.css` 만 보면 키프레임의 절반 이상을 놓칩니다.**

| | 개수 |
|---|---:|
| 키프레임 전체 | **46종** |
| CSS 파일에 있는 것 | 20종 |
| 인라인에만 있는 것 | **26종** |
| `<style>` 을 가진 파일 | 24개 |

원본은 `source/screens/` 에 있습니다 (경로의 `/` 를 `__` 로 바꾼 이름).

## 인라인에만 있는 키프레임

`qa-assist-rise` · `qa-auth-rise` · `qa-drawer-slide-b` · `qa-drawer-slide-in` · `qa-drawer-slide-l` · `qa-drawer-slide-r` · `qa-entrance-mark` · `qa-entrance-ribbon` · `qa-entrance-shine` · `qa-entrance-shine-ink` · `qa-entrance-veil` · `qa-fab-rise` · `qa-hairline-appear` · `qa-hairline-draw` · `qa-headline-drop` · `qa-item-spin` · `qa-pulse` · `qa-ribbon-drift-1` · `qa-ribbon-drift-2` · `qa-rise-soft` · `qa-wash-in` · `qa-welcome-backdrop` · `qa-welcome-in` · `qa-widget-jiggle` · `qa-wm-breathe` · `qa-wm-fadein`

## 파일별

| 파일 | 키프레임 | 클래스 | @media |
|---|---|---|---:|
| `app/experts/farewell/page.tsx` | `qa-hairline-appear` `qa-hairline-draw` `qa-headline-drop` `qa-rise-soft` `qa-wash-in` `qa-wm-breathe` `qa-wm-fadein` | `.farewell-root` | 1 |
| `app/(auth)/login/page.tsx` | `qa-auth-rise` `qa-entrance-mark` `qa-entrance-ribbon` `qa-entrance-shine` `qa-entrance-shine-ink` `qa-entrance-veil` | `.qa-auth-brand` `.qa-auth-card` `.qa-auth-desktop-brand` `.qa-auth-desktop-brand-sub` `.qa-auth-desktop-brand-title` `.qa-auth-eyebrow` 외 15 | 3 |
| `lib/design/components.tsx` | `qa-drawer-slide-b` `qa-drawer-slide-l` `qa-drawer-slide-r` | 없음 | 11 |
| `components/RibbonBackground.tsx` | `qa-ribbon-drift-1` `qa-ribbon-drift-2` | `.qa-ribbon-layer-1` `.qa-ribbon-layer-2` | 1 |
| `components/WelcomeFlow.tsx` | `qa-welcome-backdrop` `qa-welcome-in` | `.qa-welcome-backdrop` `.qa-welcome-card` | 1 |
| `app/(app)/research/[code]/page.tsx` | `qa-pulse` | 없음 | 0 |
| `app/(app)/research/[code]/profile/page.tsx` | `qa-spin` | 없음 | 0 |
| `components/AiDraftAssist.tsx` | `qa-assist-rise` | 없음 | 0 |
| `components/AIQuickAccessFab.tsx` | `qa-fab-rise` | `.qa-ai-fab` | 1 |
| `components/dashboard/CustomizableWidgetBoard.tsx` | `qa-widget-jiggle` | `.qa-edit-item` | 1 |
| `components/ItemClassificationPreview.tsx` | `qa-item-spin` | 없음 | 0 |
| `components/Sidebar.tsx` | `qa-drawer-slide-in` | 없음 | 0 |
| `components/TodayQueue.tsx` | `qa-spin` | `.qa-spin` `.qa-today-cta` | 1 |
| `app/(app)/assessments/new/page.tsx` | 없음 | `.qa-impact-row` | 1 |
| `app/(app)/pmda/[id]/client.tsx` | 없음 | `.qa-pmda-grid-2` `.qa-pmda-grid-2fr1fr` `.qa-pmda-grid-3` | 1 |
| `app/(app)/settings/compliance/compliance-manager.tsx` | 없음 | `.qa-compliance-score-strip` | 1 |
| `app/(app)/udi/[id]/client.tsx` | 없음 | `.qa-udi-detail` | 1 |
| `app/(app)/udi/new/client.tsx` | 없음 | `.qa-udi-layout` | 1 |
| `app/(public)/layout.tsx` | 없음 | `.qa-legal-brand` `.qa-legal-footer` `.qa-legal-footer-note` `.qa-legal-header` `.qa-legal-main` `.qa-legal-nav` 외 1 | 1 |
| `app/(public)/open-source/page.tsx` | 없음 | 없음 | 1 |
| `app/experts/settings/danger-zone.tsx` | 없음 | `.expert-danger-actions` `.expert-danger-btn` `.expert-danger-card` `.expert-danger-desc` `.expert-danger-error` `.expert-danger-eyebrow` 외 3 | 0 |
| `audit-page.tsx` | 없음 | 없음 | 0 |
| `components/calendar/CalendarClient.tsx` | 없음 | `.qa-cal-body` | 0 |
| `components/calendar/MeetingComposeDialog.tsx` | 없음 | 없음 | 0 |
| `components/dashboard/widgets.tsx` | 없음 | 없음 | 0 |

# 제품 앱 아이콘

`node tools/app-icons.mjs` 가 만든 산출물입니다. 손으로 고치지 마십시오.
원본 그림은 `source/brand/logo-dark.png`, 규칙과 오너 결정은 `tools/app-icons.mjs` 머리에 있습니다.

| 제품 | 금속 | 틀 | 상단 바 |
|---|---|---|---|
| Q-Atelier | 은 | 원 | `#393939` |
| Q-Maison | 샴페인 금 | 집 | `#3d3425` |
| Q-Carnet | 구리 | 수첩 · 제본선 | `#3d281d` |
| Q-Sonar | 강철 청 | 음파 | `#222e3a` |

상단 바: 설치 앱 창의 제목 줄 색(theme_color · themeColor). 틀 선 가운데 금속 색을 먹색 바탕 `#0c0c0c` 에 26% 섞은 색이고, 밝은 테마에서도 같습니다. 받는 곳은 PRODUCTS 의 titleBarIn 입니다.

파일: `icon-192.png` `icon-512.png`(둥근 판) · `icon-192-maskable.png` `icon-512-maskable.png`(안드로이드) ·
`apple-icon.png`(180, iOS) · `favicon.ico`(16 · 32 · 48, 굵게 그린 작은 판) · `badge-96.png`(알림 표시줄, Q-Atelier)

화면용 붓 Q: `marks/q-mark-on-dark.webp`(은색 · 어두운 면 위) · `marks/q-mark-on-light.webp`(검정 · 밝은 면 위).
너비 360px · WebP 90 · 원본 비율 그대로. 받는 곳은 붓 Q 를 화면에 그리는 제품(PRODUCTS 의 marksIn)이고, 판 번호와 무관합니다.

iOS 앱 아이콘: `ios-app-icon-1024.png`(1024 · 알파 없음 · apple 그림을 줄이지 않은 것). 받는 곳은 PRODUCTS 의 native(앱 저장소의 아이콘 자리)이고, 판 번호와 무관합니다.

제품 코드는 아이콘을 `?v=4` 를 붙여 부릅니다. 그림을 바꾸면 판 번호를 올립니다(`version.json` 이 지킴).

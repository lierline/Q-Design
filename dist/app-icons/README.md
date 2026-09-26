# 제품 앱 아이콘

`node tools/app-icons.mjs` 가 만든 산출물입니다. 손으로 고치지 마십시오.
원본 그림은 `source/brand/logo-dark.png`, 규칙과 오너 결정은 `tools/app-icons.mjs` 머리에 있습니다.

| 제품 | 금속 | 틀 |
|---|---|---|
| Q-Atelier | 은 | 원 |
| Q-Maison | 샴페인 금 | 집 |
| Q-Carnet | 구리 | 수첩 · 제본선 |
| Q-Sonar | 강철 청 | 음파 |

파일: `icon-192.png` `icon-512.png`(둥근 판) · `icon-192-maskable.png` `icon-512-maskable.png`(안드로이드) ·
`apple-icon.png`(180, iOS) · `favicon.ico`(16 · 32 · 48, 굵게 그린 작은 판) · `badge-96.png`(알림 표시줄, Q-Atelier)

제품 코드는 아이콘을 `?v=2` 를 붙여 부릅니다. 그림을 바꾸면 판 번호를 올립니다(`version.json` 이 지킴).

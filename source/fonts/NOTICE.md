# 글꼴 출처와 라이선스

이 폴더의 글꼴 **세 벌 모두 SIL Open Font License 1.1** 입니다.
OFL 1.1 은 임베딩과 재배포를 허용합니다. 다만 **글꼴 자체를 판매할 수 없고**,
파생 글꼴을 만들면 같은 라이선스를 따라야 합니다.

`dist/q-design.fonts.css` 가 이 파일들을 `@font-face` 로 묶습니다.
그 파일 하나만 링크하면 **CDN 없이** 세 글꼴이 붙습니다.

---

## Pretendard Variable · 본문·헤딩 전부

- `PretendardVariable.woff2` (2.0MB · weight 45~920 가변 단일 파일)
- 저작자: 길형진 (orioncactus) · https://github.com/orioncactus/pretendard
- Q-Atelier `public/fonts/` 에서 그대로 복사했고 수정하지 않았습니다

## JetBrains Mono · 라벨·배지·코드

- `jetbrains-mono-{400,500,600,700}-{latin,latin-ext}.woff2` (8파일 · 168KB)
- 저작자: JetBrains s.r.o. · https://github.com/JetBrains/JetBrainsMono
- Google Fonts CDN 에서 받았습니다 (`tools/fetch-fonts.mjs`)

## Cormorant Garamond · 영문 디스플레이 전용

- `cormorant-garamond-{400,500,600,700}-{latin,latin-ext}.woff2` (8파일 · 279KB)
- 저작자: Christian Thalmann (Catharsis Fonts) · https://github.com/CatharsisFonts/Cormorant
- Google Fonts CDN 에서 받았습니다

> **italic 은 일부러 받지 않았습니다.** 브랜드 규칙입니다.
> 전문가 포털은 `font-style: normal !important` 로 기울임을 전면 차단하고,
> 강조는 기울임이 아니라 «금색 + weight 500» 으로 합니다.
> 파일이 없으면 폴백 경로로도 기울 수 없습니다.

---

## 원본 앱과 다른 점

> 2026-09-26 부터 Q-Atelier 는 Pretendard 를 공식 조각판 92조각으로, JetBrains Mono 를 이 폴더의 그 파일로
> 자기 서버에서 냅니다(`app/fonts.css` · `scripts/fonts/build-fonts.mjs`). 아래는 그 전의 모습이고,
> Cormorant 는 지금도 `next/font/google` 입니다.

그 전의 Q-Atelier 는 **Pretendard 만 self-host** 하고 나머지 둘은 밖에서 받았습니다.

```css
/* globals.css */
@import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:...');
```
```ts
/* lib/fonts.ts */
import { Cormorant_Garamond } from 'next/font/google';
```

참고용 저장소에서는 그러면 안 되는 이유가 셋 있습니다.

1. **사내망·오프라인에서 라벨 글꼴이 통째로 빠집니다.** mono 라벨·배지·섹션 제목이 전부 시스템 monospace 로 떨어져 「mono · 대문자 · 넓은 자간」 이라는 라벨 언어가 무너집니다
2. **Cormorant 는 `next/font/google` 방식이라** Next.js 가 아닌 프로젝트에서 그대로 못 씁니다
3. 견본(`preview/index.html`)도 인터넷 없이는 다른 얼굴로 보입니다

그래서 라틴 서브셋(latin · latin-ext)만 받아 넣었습니다.
cyrillic · greek · vietnamese 는 쓰지 않으므로 받지 않습니다. 한글은 Pretendard 담당입니다.

## 다시 받기

```bash
node tools/fetch-fonts.mjs     # 이미 있으면 건너뜁니다
node tools/verify-fonts.mjs    # CDN 을 끊고 실제로 붙는지 검증 (서버 4800 필요)
```

검증은 `document.fonts.check()` 만 보지 않고 **렌더 폭**을 재서 폴백과 다른지 확인합니다.
이름만 적혀 있고 실제로는 시스템 글꼴로 그려지는 상태를 잡기 위한 것입니다.

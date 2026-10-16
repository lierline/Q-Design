# 화면 문구 시험의 고정 자료

`maison/.prettierrc.json` 은 Q-Works(Q-Maison) 저장소 커밋 `3f058d28`(2026-10-16)의 `.prettierrc.json` 을 그대로 떠 온 것입니다.

`tools/copy-spacing.test.mjs` 가 제품 정렬기의 줄바꿈을 재현할 때 설정을 여기서 읽습니다. prettier 와 그 플러그인 모듈만 Q-Works 의 node_modules 에서 빌립니다(Q-Design 이 자기 package.json 을 갖기 전까지 남는 결합).

Q-Works 의 정렬 설정이 바뀌면 이 파일도 다시 떠 옵니다.

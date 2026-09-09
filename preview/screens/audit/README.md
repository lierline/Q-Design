# 감사용 화면

2026-09-09 정밀 감사에서 근거로 쓴 화면들입니다.

```bash
node tools/shoot-audit.mjs     # 세 제품의 대표 화면 37장
node tools/measure-ux.mjs      # 대비 · 터치 타깃 · 가로 넘침 실측
```

## PNG 는 커밋하지 않습니다

`.gitignore` 에 넣어 두었습니다. 이유가 둘입니다.

1. **11MB 이고 곧 낡습니다.** 화면은 계속 바뀌는데 사진은 안 바뀝니다.
   커밋된 사진이 지금 화면과 다르면, 그때부터 그 사진은 근거가 아니라 오해입니다.
2. **스크립트가 다시 만듭니다.** 이 저장소의 규칙은 「생성물은 손으로 두지 않는다」
   입니다. 토큰도 대비표도 그렇게 하고 있습니다.

대신 **무엇을 찍었는지의 목록**(`_index-dark.json`)과 **실측 결과**
(`_measure-dark.json`)는 커밋합니다. 그건 숫자라 낡아도 「그때는 이랬다」로 읽힙니다.

`preview/screens/` 위쪽의 화면 22장은 다릅니다. 그건 디자인 시스템 문서의 삽화라
바뀌면 함께 갱신하는 것이고, 이 폴더는 한 번의 감사 기록입니다.

## 다시 찍으려면

세 제품을 띄워 두어야 합니다. 로그인 뒤 화면은 각 저장소의 대리 서버로 들어갑니다.

```bash
npm --prefix D:/Claude/Q-Atelier run dev                                   # 3400
pnpm --dir D:/Claude/Lead-Radar dev                                        # 3403
cd D:/Claude/Lead-Radar && node --env-file=.env.local scripts/preview-as.mjs   # 3405
cd D:/Claude/DHR && node scripts/dev.mjs                                   # 3404
cd D:/Claude/DHR && node --env-file=.env.local scripts/preview-as.mjs 000000 3404 3408
```

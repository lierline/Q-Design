# 회사 문서 양식 v8 원본

오너가 2026-09-24 에 준 「MedQraft 문서 양식_rev.8.zip」 을 **손대지 않고** 푼 것입니다. 이 폴더의 파일은 고치지 않습니다.
값을 고치려면 오너가 규격서를 새로 내고, 그 판을 새 폴더(spec-v9 …)로 넣습니다.

- 받은 곳: OneDrive `MedQraft/17. 계약 서류/MedQraft 문서 양식_rev.8.zip`
- zip sha256: `2f045f534567daa1913c1ba8fc26fab8551c27b736a503219c8261369ebb1d98`
- 규격서: 회사 문서 양식 규격 v8 (SP-MQ-2026-001 rev.02). 글꼴과 그림을 품은 묶음 HTML 이라 브라우저로 그대로 열립니다.
- 예시: 같은 양식으로 만든 예시 문서
- logo/: zip 안의 Logo.zip 을 푼 것(이름 그대로)

파일 이름은 두 HTML 만 바꿨습니다(공백 없는 이름). 내용은 바이트 그대로입니다.

| 파일 | 원래 이름 | 크기 (바이트) | sha256 |
|---|---|---:|---|
| MQ-문서양식-v8-규격서.html | Medqraft 문서양식 v8 규격서.html | 6191344 | `55744759bff0c613994698a11f234b92dd6d9e4244614f636a2f6c8ff14db333` |
| MQ-문서양식-v8-예시.html | Medqraft 문서양식 v8 예시.html | 6180540 | `e2cf88b6f8918bba1dd79f0c5a3115f3b44a924074980ac8e306df41d2182375` |
| logo/ChatGPT Image 2026년 5월 29일 오후 10_42_21.png | Logo.zip / ChatGPT Image 2026년 5월 29일 오후 10_42_21.png | 1406703 | `8a003cf25f3f1d4e5619bb79f43ceebdba78f5b84c2c016abb3291a010856778` |
| logo/ChatGPT Image 2026년 5월 29일 오후 10_52_25.png | Logo.zip / ChatGPT Image 2026년 5월 29일 오후 10_52_25.png | 864458 | `6dab3a0e29291923ad18bbdec6bde50c0e51110515aba39fad5ab718ec42f722` |
| logo/Logo-Dark.png | Logo.zip / Logo-Dark.png | 286256 | `acc5ca410527173c3ad59926fba4afc23d4caca35001de25e3109a6849a87d98` |
| logo/Logo-white.png | Logo.zip / Logo-white.png | 126099 | `6189f4d7891f571f19cf49720433ad67d696b238c48c0e83b4fffad7622e9766` |
| logo/MedQraft_Symbol_Bold_B.png | Logo.zip / MedQraft_Symbol_Bold_B.png | 149778 | `30f6222b0d3331e409f438ebdb2945bed9da1821248bb9f54c6bc9823b59a73f` |
| logo/블랙.png | Logo.zip / 블랙.png | 17708 | `b824e882dc2c4b05bb101c7115e4e2a340529a322ec1461bd6e2650a231a929a` |
| logo/자산 3.png | Logo.zip / 자산 3.png | 38926 | `0ec988109c47ae52490f35b7842204591f9ad8eedc873a58fa0381f7d67c8510` |
| logo/자산 4.png | Logo.zip / 자산 4.png | 39606 | `bc80c451970d2eea4f47a5d13422545eb504c260a760d2250259150f4a19ff07` |
| logo/자산 5.png | Logo.zip / 자산 5.png | 47694 | `624c3ac958ce96615e0b7766d41010ad57be71338695132db1a61e61bacc9a7c` |
| logo/자산 6.png | Logo.zip / 자산 6.png | 49751 | `97a721618e72a0637e5685b5378605b7a7f9436c154274c775b8f6cd2bae0069` |
| logo/자산 7.png | Logo.zip / 자산 7.png | 39594 | `8eff34747ebfd99a747a90926972b502c813738bbadb33be026284ea93367e86` |
| logo/자산 9.png | Logo.zip / 자산 9.png | 56762 | `ac30e411362c91c9184e0b3a0379a3b4400fed30c687fae626b166d86e0f2e3f` |
| logo/화이트.png | Logo.zip / 화이트.png | 18987 | `56b9d68391a5726a6fb57b8d915c2addfab577e44f029ee4577cf988e3cf7416` |

쓰는 곳

- Q-Design `tools/extract-mqdoc.mjs` 가 규격서의 표를 읽어 `dist/q-design.mqdoc.*` 와 `docs/23` 을 만듭니다.
- 회사 Word 변환기 `templates/mqhtml.py` 는 아직 v8 이전 값이 남아 있습니다(본문색 · 본문 폭). Q-Design docs/23 6절 참고.

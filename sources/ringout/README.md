# 링아웃

피해율을 쌓고 상대를 무대 밖으로 밀어내는 3D 플랫폼 대전 게임입니다. **1P 대 CPU**, 서로 다른 능력의 사람 캐릭터 4명, 무대 3개, 자유 연습과 대전 모드를 지원합니다. 원본의 전투·복귀·방어·스톡 규칙을 유지했습니다.

## 실행

게임룸 루트에서:

```sh
npm install
npm test --workspace sources/ringout
npm run build --workspace sources/ringout
```

전체 모음으로 반영하려면 루트의 `npm run build`가 `sources/ringout/dist/`를 `public/ringout/`으로 복사합니다. 게임 경로는 `/ringout/`이며 카드 미리보기는 `/ringout/?preview=1`입니다.

## 조작

| 입력 | 동작 |
| --- | --- |
| ← → / A D | 이동 |
| Space | 점프, 공중에서 한 번 더 |
| Z / 방향 + Z | 기본·방향 공격 |
| X / ↑ + X | 필살기·공중 복귀 |
| C | 방어 |
| ↓ | 발판 내려가기·빠른 낙하 |
| P / Escape | 일시정지·계속 |

대전은 3스톡·150초입니다. 피해율이 높을수록 더 멀리 날아갑니다. 소리는 기본 꺼짐이며 작은 화면이나 터치 기기에는 화면 버튼이 나타납니다. 자유 연습에서는 CPU가 대기합니다. 온라인 대전, 로컬 2인·4인전, 게임패드는 포함하지 않습니다.

## 이식 변경

네이비, 요리사, 기사, 마법사의 서로 다른 사람 모델과 관절 애니메이션을 사용합니다. 단순한 색상 변경 대신 머리 모양·체격·의상·무기를 구분했습니다. 홈의 자동 미리보기는 실제 CPU 입력과 같은 게임 엔진으로 대결하며, 경기 종료나 35초마다 캐릭터·무대를 바꿉니다. 사용자 입력·소리·저장 동작이 없는 독립적인 미리보기입니다.

## 출처

[flam-ing/flamingo-ringout-64](https://github.com/flam-ing/flamingo-ringout-64)의 `626c169f2b847d75b4fae3ac27b95f0abce60f29`를 기반으로 합니다. 원본 문서는 `docs/ORIGINAL-README.md`에 남겨 두었습니다. 원본 코드의 MIT, Three.js의 MIT, Galmuri의 OFL 안내는 `public/licenses/`에 보존합니다. 새 모델은 Three.js 메시를 코드로 구성하며 외부 이미지·모델·음악을 요청하지 않습니다.

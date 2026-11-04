# 길 건너 한 판

도로, 강, 철길을 건너는 3D 복셀 아케이드 게임입니다. 네이비 재킷과 흰 티셔츠를 입은 작은 모험가를 움직여 가장 먼 줄에 도달하세요.

- 일반 플레이: `/crossroad/`
- 홈 화면의 자동 플레이 미리보기: `/crossroad/?preview=1`
- 자동 시작: `/crossroad/?autostart=1`

## 조작과 규칙

방향키 또는 WASD로 한 칸씩 움직입니다. 스페이스는 앞으로 이동합니다. 휴대폰에서는 화면을 탭하거나 스와이프하고, 화면 아래의 방향 버튼으로도 조작할 수 있습니다. 차량과 열차를 피하고, 강에서는 통나무나 연잎을 밟아야 합니다. 통나무는 플레이어를 함께 옮깁니다. 오래 멈춰 뒤처지면 새가 다가옵니다.

점수는 도달한 가장 먼 줄입니다. 최고 기록과 음소거 설정은 `crossroad-best`, `crossroad-muted`라는 키로 브라우저에 저장합니다. 게임 오버 뒤 버튼, 탭, 스페이스 또는 Enter로 다시 시작합니다.

## 홈 미리보기

`preview=1`일 때 실제 게임의 차량·통나무·열차 위치를 미리 계산해 CPU가 정상 이동 함수를 호출합니다. 사망 후 0.55초, 카메라에 2.5칸 이상 뒤처졌을 때, 또는 75초가 지나면 다시 시작합니다. 미리보기 카메라는 캐릭터가 화면 아래로 가려지지 않도록 조금 더 가까운 곳을 바라봅니다. 오디오는 생성하지 않고, 기록과 설정을 저장하지 않으며, 사용자 조작과 HUD를 숨깁니다.

첫 렌더가 끝나면 다음 메시지를 한 번 전송합니다. 부모는 `event.origin`과 `event.source`를 확인해야 합니다.

```js
window.parent.postMessage({ type: 'game-preview-ready' }, location.origin);
```

## 출처와 라이선스

게임 규칙과 기반 코드는 [flam-ing/flaming-games의 flamingo-road](https://github.com/flam-ing/flaming-games/tree/c9f97373f327b33734a6b85c58847222b7858f88/flamingo-road)에서 가져왔습니다. 원본 커밋은 `c9f97373f327b33734a6b85c58847222b7858f88`입니다. 원본의 MIT 저작권 및 허가문은 [licenses/FLAMING-GAMES-MIT.txt](licenses/FLAMING-GAMES-MIT.txt)에 보존했습니다.

이 버전은 인간 복셀 캐릭터, 게임명, 화면 구성, 색상, 통나무·연잎 외형, 터치 버튼, CPU 미리보기, 첫 렌더 알림 및 재시작 시 리소스 정리를 추가하거나 수정했습니다. 모든 캐릭터와 배경은 코드로 만든 도형이며 외부 게임 이미지나 음원을 사용하지 않습니다.

`vendor/three.module.min.js`는 **Three.js 0.160.0**의 수정하지 않은 npm 배포 파일입니다. `https://unpkg.com/three@0.160.0/build/three.module.min.js`에서 받아 로컬 제공하므로 실행 중 CDN 요청이 없습니다. 라이선스는 [licenses/THREE-MIT.txt](licenses/THREE-MIT.txt)에 있습니다.

## 검증

Three.js 0.160.0과 게임 코드를 Node VM에서 실행해 시작, 터치 이동, 점수 증가, 이동 경계, 차량·물·기차 충돌, 재시작을 확인했습니다. 미리보기는 5개 무작위 시드에서 각각 90초씩 시뮬레이션하여 진행과 자동 재시작, 음소거, 저장 기록 미변경, 한 번의 준비 메시지를 확인했습니다. 렌더러는 테스트 대역이므로 실제 WebGL 화면 확인은 별도로 필요합니다.

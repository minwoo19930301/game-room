# GitHub Pages 배포

- 저장소: [minwoo19930301/game-room](https://github.com/minwoo19930301/game-room)
- 공개 게임룸: [minwoo19930301.github.io/game-room](https://minwoo19930301.github.io/game-room/)
- 배포 브랜치: `main`
- 배포 파일: 빌드된 `public/`
- 워크플로: [pages.yml](../.github/workflows/pages.yml)

`main` 푸시 또는 수동 실행으로 시작합니다. Node.js 24에서 의존성을 설치하고 142개 워크스페이스 테스트와 40개 플랫폼 게임 테스트를 실행한 뒤 네 Vite 게임과 카탈로그를 다시 만듭니다. 정적 참조 검사를 통과한 사이트만 GitHub Pages 아티팩트로 업로드합니다.

배포에는 GitHub가 발급하는 단기 `GITHUB_TOKEN`과 Pages OIDC를 사용합니다. 별도 토큰이나 호스팅 비밀값을 저장하지 않습니다. Actions는 검토한 커밋 SHA로 고정했습니다.

배포 아티팩트의 `release.json`에는 소스 커밋 SHA가 들어갑니다. 배포 이후 [verify-pages.py](../scripts/verify-pages.py)가 공개 URL에서 해당 SHA, 13개 게임 진입 주소, 카탈로그, 썸네일과 HTML 자산 참조를 검사합니다. 전파 중에는 잠시 재시도하며 실패하면 배포 작업도 실패로 표시합니다.

이 저장소는 정적 Web Games만 배포합니다. 별도 Phone Controller Games의 Render 서버나 benchmark-games 저장소는 변경하지 않습니다.

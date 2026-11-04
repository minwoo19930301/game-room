# 수호전대 캐릭터 재설계

2026-11-05. 내장 image_gen 도구로 생성했습니다. 네이비 기존 원화를 스타일·4×3 배치 참고용으로 사용했습니다. 루비와 금강은 재색칠 대신 별도 얼굴, 헤어, 의상, 실루엣으로 생성했습니다. 각 시트 1448×1086, 투명 PNG이며 게임이 362×362 셀을 분리합니다. 생성 원본의 알파를 보존했습니다.

- 네이비: `public/art/character-actions.png`
- 루비: `public/art/ruby-actions.png`
- 금강: `public/art/geumgang-actions.png`

포즈 순서: 대기, 달리기 A, 달리기 B, 점프 / 펀치, 킥, 가드, 피격 / 앉기, 승리, 웅크리기, 가리키기. 기술 연출은 원화 동작에 캔버스 궤적과 잔상을 더하며 공격 판정에는 영향을 주지 않습니다.

## 최종 프롬프트

### ruby

Use case: stylized-concept. Production game sprite sheet, exactly 4 columns and 3 rows in a regular grid, 12 separate fullbody action poses. Reference image establishes ONLY clay 3D rendering style and grid/pose layout; create a visibly DIFFERENT original teammate, not a recolor. All poses face right in consistent 3/4 front camera. Transparent RGBA background, no backdrop, labels, text, borders, captions, weapons, ground or scenery. Keep all parts including hair/hands inside each equal cell with 7% padding and consistent character scale. Polished charming clay render, large expressive eyes, soft material highlights. ORDER EXACTLY: top row idle, running stride A, running stride B, jump; middle row forward punch, high forward kick, guarding stance, recoiling hurt; bottom row sitting relaxed, victory both arms raised, low crouch, pointing right. Feet/bottom of each pose align at 92% of cell. Character RUBY: energetic slim young woman with fiery red high ponytail, side-swept bangs, confident sharp eyes, cream lightweight cropped bomber jacket with coral shoulder stripes, black athletic leggings, coral red high-top trainers, fingerless gloves. Distinct angular and nimble silhouette, flowing ponytail readable in every pose, sporty street fighter. Jacket is cream/red, NEVER navy blazer. Kicks and run visibly athletic, ponytail follows motion.

### geumgang

Use case: stylized-concept. Production game sprite sheet, exactly 4 columns and 3 rows in a regular grid, 12 separate fullbody action poses. Reference image establishes ONLY clay 3D rendering style and grid/pose layout; create a visibly DIFFERENT original teammate, not a recolor. All poses face right in consistent 3/4 front camera. Transparent RGBA background, no backdrop, labels, text, borders, captions, weapons, ground or scenery. Keep all parts including hair/hands inside each equal cell with 7% padding and consistent character scale. Polished charming clay render, large expressive eyes, soft material highlights. ORDER EXACTLY: top row idle, running stride A, running stride B, jump; middle row forward punch, high forward kick, guarding stance, recoiling hurt; bottom row sitting relaxed, victory both arms raised, low crouch, pointing right. Feet/bottom of each pose align at 92% of cell. Character GEUMGANG: sturdy broad-shouldered young man, short dark brown buzz-cut/spiky hair, thick eyebrows, stocky heavyweight silhouette, ochre yellow armored sleeveless vest over charcoal shirt, huge metallic gold forearm bracers used as defensive shields (both bracers always attached to arms), thick utility belt, dark cargo trousers, heavy ochre armored boots. Friendly determined face. Much broader torso and arms than reference, robust defense expert; sturdy guard with massive forearm bracers crossed. NEVER suit blazer, NEVER slender.


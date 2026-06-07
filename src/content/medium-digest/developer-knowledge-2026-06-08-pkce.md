---
title: "개발자가 알아야 할 지식: PKCE, OAuth 인증 코드를 훔쳐도 토큰으로 바꾸지 못하게 하는 법"
description: "OAuth 2.0 Authorization Code Flow에서 PKCE가 어떤 공격을 막고, SPA와 모바일 앱뿐 아니라 웹 서버 앱에서도 왜 기본값이 되어야 하는지 실무 관점으로 정리합니다."
pubDate: "2026-06-08"
sourceTitle: "RFC 9700: Best Current Practice for OAuth 2.0 Security"
sourceUrl: "https://www.rfc-editor.org/rfc/rfc9700"
sourceAuthor: "IETF"
tags: ["개발자가 알아야 할 지식", "Software Engineering", "OAuth", "Security", "Authentication"]
---

## 왜 개발자가 알아야 하나

OAuth 로그인을 구현할 때 많은 팀이 "인증 코드는 짧게 살고 한 번만 쓰니까 괜찮다"고 생각한다. 이 말은 어느 정도 맞지만, 공격자가 그 짧은 시간 안에 코드를 먼저 토큰으로 교환할 수 있다면 이야기가 달라진다. 사용자는 정상적으로 로그인했다고 생각하지만, 실제 액세스 토큰은 공격자에게 발급될 수 있다. PKCE는 이 틈을 막기 위해 Authorization Code Flow의 시작과 끝을 암호학적으로 묶어 주는 장치다.

PKCE는 처음에는 네이티브 앱처럼 클라이언트 시크릿을 안전하게 보관하기 어려운 public client를 위해 제안되었다. 하지만 실무 환경은 더 복잡하다. SPA는 브라우저에 코드가 노출되고, 모바일 앱은 커스텀 URL 스킴 충돌이나 리다이렉트 가로채기 위험이 있으며, 서버 사이드 웹 앱도 프록시, 로그, 브라우저 확장, 잘못된 리다이렉트 설정 때문에 인증 코드가 새어 나갈 수 있다. 그래서 최신 OAuth 보안 권고에서는 PKCE를 특정 앱 유형의 옵션이 아니라 Authorization Code Flow의 기본 안전장치에 가깝게 다룬다.

개발자가 PKCE를 이해해야 하는 이유는 단지 "보안을 강화하자"는 추상적인 말 때문이 아니다. 로그인 장애를 디버깅할 때 `code_challenge`, `code_verifier`, `state`, `redirect_uri`가 각각 무엇을 보장하는지 알아야 원인을 빨리 좁힐 수 있다. 또 인증 서버를 직접 만들거나 SaaS IdP를 설정할 때 "PKCE 필수", "plain 비활성화", "S256만 허용" 같은 옵션이 왜 중요한지 판단할 수 있다. 모르면 체크박스를 대충 켜거나 끄게 되고, 인증은 그런 식의 감으로 다루기에는 실패 비용이 크다.

## 핵심 개념

PKCE는 Proof Key for Code Exchange의 약자다. 핵심 아이디어는 간단하다. 클라이언트가 로그인 요청을 시작할 때 비밀에 가까운 임의 문자열인 `code_verifier`를 만든다. 그리고 이 값을 그대로 보내지 않고, 보통 SHA-256으로 해시한 뒤 Base64URL 인코딩한 `code_challenge`를 인증 서버에 보낸다. 인증 서버는 이 challenge를 인증 코드와 함께 기억한다.

사용자가 인증을 마치면 클라이언트는 평소처럼 `authorization_code`를 받는다. 하지만 토큰 엔드포인트에서 이 코드를 액세스 토큰으로 교환할 때는 `code_verifier`도 함께 제출해야 한다. 인증 서버는 제출된 verifier를 같은 방식으로 변환해, 처음 저장해 둔 challenge와 맞는지 확인한다. 맞으면 "이 코드를 교환하려는 주체가 로그인 요청을 시작했던 주체와 같은 비밀을 알고 있다"고 판단할 수 있다.

이 구조가 막는 대표적인 공격은 authorization code interception이다. 공격자가 리다이렉트 URL, 로그, 브라우저 경로, 악성 앱의 URL 스킴 등을 통해 인증 코드를 훔쳤다고 해도, 처음 요청을 시작한 클라이언트가 만든 `code_verifier`를 모르면 토큰 교환에 실패한다. 인증 코드만으로는 부족하고, 코드에 묶인 증명값까지 필요해지는 것이다.

여기서 `state`와 PKCE를 혼동하면 안 된다. `state`는 주로 요청과 응답을 연결하고 CSRF나 로그인 응답 섞임을 줄이기 위한 값이다. PKCE는 인증 코드 자체가 가로채였을 때 토큰 교환을 막기 위한 값이다. 둘 다 필요할 수 있고, 하나가 다른 하나를 완전히 대체한다고 보면 위험하다.

실무에서는 `code_challenge_method=S256`을 기본으로 삼아야 한다. RFC 7636에는 `plain` 방식도 있지만, verifier를 그대로 challenge로 쓰기 때문에 방어력이 약하다. 레거시 호환이 아니라면 `plain`을 허용하지 않는 편이 낫다. verifier는 충분히 긴 난수여야 하며, 예측 가능한 UUID, 타임스탬프, 사용자 ID 조합으로 만들면 PKCE의 의미가 무너진다.

## 작은 예시 또는 체크리스트

예를 들어 SPA가 OAuth 로그인을 시작한다고 하자.

- 브라우저 앱은 `code_verifier`로 충분히 긴 랜덤 문자열을 만든다.
- 앱은 `SHA-256(code_verifier)`를 Base64URL로 인코딩해 `code_challenge`를 만든다.
- `/authorize` 요청에 `client_id`, `redirect_uri`, `scope`, `state`, `code_challenge`, `code_challenge_method=S256`을 보낸다.
- 인증 서버는 사용자를 로그인시키고, 성공하면 `redirect_uri?code=...&state=...` 형태로 돌려보낸다.
- 앱은 `state`를 검증한 뒤 `/token` 요청에 `code`, `redirect_uri`, `client_id`, `code_verifier`를 보낸다.
- 인증 서버는 verifier에서 challenge를 다시 계산하고, 처음 저장한 challenge와 일치할 때만 토큰을 발급한다.

구현 체크리스트로 바꾸면 다음을 확인하면 된다.

- `code_verifier`는 암호학적으로 안전한 난수 생성기로 만든다.
- `code_challenge_method`는 `S256`을 사용하고, 가능하면 `plain`은 거부한다.
- 인증 코드는 짧게 살고 한 번만 쓸 수 있어야 한다.
- 토큰 교환 시 `redirect_uri`와 `client_id`도 authorize 단계와 일치하는지 확인한다.
- `state` 또는 동등한 요청 상관관계 검증을 유지한다.
- 로그, APM, 에러 리포트에 `code`, `code_verifier`, 토큰이 남지 않게 필터링한다.
- 인증 라이브러리가 PKCE를 자동 처리하더라도 실제 전송 파라미터를 한 번은 네트워크 탭이나 테스트로 검증한다.

## 실무에서 자주 생기는 오해

- "클라이언트 시크릿이 있으니 PKCE는 필요 없다"는 말은 이제 조심해야 한다. 클라이언트 시크릿은 토큰 엔드포인트에서 클라이언트를 인증하는 데 도움이 되지만, 인증 코드가 다른 경로로 새었을 때 요청을 시작한 브라우저 세션과 코드를 교환하는 주체를 묶어 주지는 않는다.

- "SPA에서는 토큰이 어차피 브라우저에 있으니 PKCE도 소용없다"는 말도 절반만 맞다. PKCE는 브라우저 런타임 전체를 안전하게 만드는 기술이 아니다. XSS로 런타임이 장악되면 PKCE만으로는 부족하다. 하지만 리다이렉트 중간에서 인증 코드만 탈취되는 공격에는 분명히 효과가 있다.

- "PKCE를 쓰면 `state`는 빼도 된다"는 구현은 피해야 한다. PKCE와 `state`는 방어하는 문제가 다르다. 특히 여러 로그인 요청이 동시에 열리거나, 잘못된 콜백이 현재 세션에 붙는 문제를 생각하면 요청 상관관계 검증은 여전히 중요하다.

- "`code_verifier`를 서버 세션에 저장하면 항상 더 안전하다"는 것도 상황에 따라 다르다. 서버 사이드 앱에서는 서버 세션에 저장하는 방식이 자연스럽다. SPA나 모바일 앱에서는 메모리 또는 안전한 임시 저장소를 써야 할 수 있다. 중요한 것은 verifier를 공격자가 읽기 쉬운 장기 저장소나 로그에 남기지 않는 것이다.

- "PKCE만 켜면 OAuth 구현은 안전하다"는 착각이 가장 위험하다. PKCE는 Authorization Code Flow의 특정 약점을 줄이는 장치다. 리다이렉트 URI 검증, 토큰 저장, refresh token 회전, 스코프 최소화, HTTPS, 쿠키 보안, XSS 방어 같은 기본기는 여전히 필요하다.

- "인증 서버가 알아서 해 주겠지"도 충분하지 않다. 많은 IdP가 기본 설정으로 PKCE를 지원하지만, 앱 타입, grant type, redirect URI, token endpoint 인증 방식에 따라 동작이 달라진다. 특히 기존 앱을 마이그레이션할 때는 실제 실패 케이스를 테스트해야 한다.

## 오늘 바로 적용해보기

현재 서비스의 OAuth 로그인 설정에서 PKCE가 켜져 있는지 확인해 보자. SPA, 모바일 앱, 데스크톱 앱은 물론이고, 일반 웹 서버 앱도 Authorization Code Flow를 쓴다면 PKCE를 기본값으로 삼는 편이 좋다. IdP 콘솔에서 `Require PKCE`, `S256 only`, `Disable implicit grant` 같은 설정이 있는지 살펴보고, 문서상 권고가 아니라 실제 앱 설정에 반영되어 있는지 확인한다.

코드 리뷰에서는 로그인 시작 함수와 콜백 처리 함수를 함께 보자. `code_verifier`가 어떻게 생성되고 어디에 저장되는지, 콜백에서 `state`를 검증하는지, 토큰 교환 요청에 verifier가 빠지지 않는지 확인하면 된다. 인증 라이브러리를 쓰더라도 설정값 하나로 PKCE가 빠질 수 있으니 "라이브러리를 쓴다"와 "안전하게 설정했다"를 같은 말로 취급하지 않는 것이 좋다.

운영 관점에서는 로그 필터링을 점검하자. 인증 콜백 URL 전체를 INFO 로그에 남기거나, 토큰 교환 실패 요청 본문을 그대로 에러 리포트에 싣는 경우가 있다. PKCE는 코드 탈취를 어렵게 만들지만, verifier까지 함께 새면 방어선이 사라진다. 인증 관련 파라미터는 가능한 한 짧게 보관하고, 관측성 도구에서는 마스킹 규칙을 둔다.

마지막으로 작은 통합 테스트를 추가해 볼 수 있다. 같은 인증 코드에 잘못된 `code_verifier`를 넣으면 토큰 교환이 실패해야 한다. 같은 인증 코드를 두 번 쓰면 두 번째 요청도 실패해야 한다. 이런 테스트는 인증 서버를 직접 운영하는 팀뿐 아니라, 사내 OAuth 프록시나 BFF를 둔 팀에도 가치가 있다.

## 더 알아보기

- [RFC 9700: Best Current Practice for OAuth 2.0 Security](https://www.rfc-editor.org/rfc/rfc9700)
- [RFC 7636: Proof Key for Code Exchange by OAuth Public Clients](https://www.rfc-editor.org/rfc/rfc7636)
- [OAuth 2.0 for Browser-Based Applications](https://www.rfc-editor.org/rfc/rfc9449)
- [OAuth 2.0 for Native Apps](https://www.rfc-editor.org/rfc/rfc8252)

## 오늘의 takeaway

PKCE는 OAuth 인증 코드를 "보는 사람"이 아니라 "처음 요청을 시작한 사람"만 토큰으로 바꿀 수 있게 만드는 작고 강한 기본기다.

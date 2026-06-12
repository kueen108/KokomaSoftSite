---
title: "개발자가 알아야 할 지식: 콘텐츠 협상, 같은 URL이 다른 표현을 돌려주는 방식"
description: "HTTP Accept 헤더와 콘텐츠 협상이 API 호환성, 캐싱, 오류 처리에 주는 영향을 정리합니다."
pubDate: "2026-06-13"
sourceTitle: "RFC 9110: HTTP Semantics"
sourceUrl: "https://www.rfc-editor.org/rfc/rfc9110.html"
sourceAuthor: "IETF"
tags: ["개발자가 알아야 할 지식", "HTTP", "API Design", "Web"]
---
API가 JSON만 돌려준다고 생각하기 쉽지만, HTTP는 처음부터 같은 리소스를 여러 표현으로 주고받을 수 있게 설계되었습니다.

## 왜 개발자가 알아야 하나

웹 서비스는 브라우저, 모바일 앱, CLI, 서버 간 호출처럼 서로 다른 클라이언트를 상대합니다. 같은 데이터라도 JSON, HTML, CSV, 이미지 포맷처럼 필요한 표현이 달라질 수 있습니다.

콘텐츠 협상은 클라이언트가 원하는 표현을 헤더로 알리고 서버가 가능한 표현을 고르는 HTTP 메커니즘입니다. 가장 흔한 예는 `Accept: application/json`이고, 언어는 `Accept-Language`, 압축은 `Accept-Encoding`과 연결됩니다.

이 개념을 모르면 API 버전 관리, 캐시 키, 오류 응답 형식에서 미묘한 버그가 생깁니다. 특히 CDN이나 프록시가 끼면 `Vary` 헤더를 제대로 다루지 않은 콘텐츠 협상은 다른 사용자에게 잘못된 표현을 전달할 수 있습니다.

## 핵심 개념

HTTP에서 리소스와 표현은 다릅니다. `/reports/123`이라는 리소스는 HTML 페이지로도, JSON 문서로도, CSV 다운로드로도 표현될 수 있습니다. URL이 같다고 바이트까지 같아야 하는 것은 아닙니다.

`Accept` 헤더는 클라이언트가 처리할 수 있는 미디어 타입을 서버에 알려줍니다. 서버는 그중 가능한 것을 선택해 `Content-Type`으로 실제 응답 형식을 명시합니다.

`Vary` 헤더는 캐시에게 어떤 요청 헤더가 응답 선택에 영향을 주었는지 알려줍니다. `Accept-Language`에 따라 응답이 달라진다면 캐시는 언어별로 별도 응답을 보관해야 합니다.

## 작은 예시 또는 체크리스트

예를 들어 `/profile`이 브라우저에는 HTML을, 앱에는 JSON을 반환한다고 합시다. 서버가 `Accept`를 보고 응답을 바꾸면서 `Vary: Accept`를 주지 않으면 중간 캐시가 HTML 응답을 JSON을 기대한 앱에 전달할 수 있습니다.

- 응답 형식이 요청 헤더에 따라 달라지는가?
- 그렇다면 `Content-Type`이 항상 정확히 설정되는가?
- `Vary` 헤더가 캐시 키에 필요한 요청 헤더를 포함하는가?
- 지원하지 않는 미디어 타입에는 일관된 406 또는 fallback 정책이 있는가?
- 오류 응답도 정상 응답과 같은 협상 규칙을 따르는가?

## 실무에서 자주 생기는 오해

- “REST API는 URL을 나누면 되니 협상이 필요 없다”는 말은 상황에 따라 맞습니다. `/report.csv`처럼 명시적 URL이 더 단순할 때도 많지만, 헤더 기반 협상을 쓰는 순간 캐시와 문서화까지 같이 설계해야 합니다.

- “JSON만 쓰면 신경 쓸 필요 없다”도 완전히 맞지 않습니다. 클라이언트가 엉뚱한 `Accept`를 보내거나 서버가 오류 페이지를 HTML로 돌려주면 SDK와 앱이 깨질 수 있습니다.

- “Content-Type은 대충 application/json이면 된다”는 습관은 장기 호환성을 해칩니다. 버전이 들어간 vendor media type이나 charset 정책을 쓰는 팀이라면 더 엄격해야 합니다.

- “브라우저에서 되면 API도 된다”는 판단도 위험합니다. 브라우저는 넓은 Accept 헤더와 관대한 파싱을 갖지만 서버 간 클라이언트는 훨씬 엄격할 수 있습니다.

## 오늘 바로 적용해보기

API 하나를 골라 요청의 `Accept`와 응답의 `Content-Type`을 실제로 확인해보세요. 문서와 구현이 다르면 클라이언트 버그의 씨앗입니다.

CDN을 쓰는 엔드포인트에서 `Vary` 헤더를 점검하세요. 언어, 인코딩, 미디어 타입에 따라 응답이 달라지는데 캐시 키가 같으면 문제가 됩니다.

오류 응답도 JSON API에서는 JSON으로 내려가도록 테스트를 추가하세요. 장애 순간에 HTML 에러 페이지가 SDK를 깨뜨리는 경우가 생각보다 많습니다.

## 더 알아보기

- [RFC 9110: HTTP Semantics](https://www.rfc-editor.org/rfc/rfc9110.html)
- [MDN: Content negotiation](https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/Content_negotiation)
- [MDN: Vary header](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Vary)

## 오늘의 takeaway

같은 URL이 항상 같은 바이트를 뜻하지는 않습니다. 요청 헤더가 응답을 바꾼다면 캐시와 오류 응답까지 함께 설계해야 합니다.

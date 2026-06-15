---
title: "개발자가 알아야 할 지식: 구조화 로그, 검색 가능한 사건 기록을 남기는 법"
canonicalSlug: "developer-knowledge-2026-06-16-structured-logging"
description: "문자열 로그의 한계를 넘어서 JSON 필드, correlation ID, 로그 레벨을 운영 가능한 형태로 설계하는 방법을 정리합니다."
pubDate: "2026-06-16"
sourceTitle: "OpenTelemetry Documentation: Logs"
sourceUrl: "https://opentelemetry.io/docs/concepts/signals/logs/"
sourceAuthor: "OpenTelemetry"
tags: ["개발자가 알아야 할 지식", "Observability", "Logging", "Operations"]
---
로그는 장애가 난 뒤에 읽는 일기가 아니라, 시스템이 남기는 사건 기록입니다. 기록이 구조화되어 있으면 검색과 집계가 훨씬 쉬워집니다.

## 왜 개발자가 알아야 하나

문자열 로그는 사람이 읽기에는 편하지만, 운영 도구가 안정적으로 해석하기 어렵습니다. 같은 의미의 사용자 ID가 `user`, `userId`, `uid`로 흩어지면 장애 순간에 한 사용자의 흐름을 따라가기 힘듭니다.

구조화 로그는 메시지와 함께 key-value 필드를 남기는 방식입니다. 요청 ID, 사용자 ID, 주문 ID, 외부 API 이름, 지연 시간, 오류 코드처럼 나중에 필터링할 값을 명시적으로 남기면 로그가 검색 가능한 데이터가 됩니다.

개발자가 이 개념을 알아야 하는 이유는 로그 품질이 코드 작성 순간에 결정되기 때문입니다. 운영팀이 나중에 대시보드를 잘 만들어도 애플리케이션이 필요한 필드를 남기지 않으면 원인 분석은 계속 감에 기대게 됩니다.

## 핵심 개념

첫 번째 원칙은 안정적인 필드 이름입니다. `request_id`, `trace_id`, `user_id`, `order_id`, `error_code`처럼 팀이 합의한 이름을 반복해서 써야 도구와 사람이 같은 기준으로 찾을 수 있습니다.

두 번째는 correlation입니다. 한 요청이 여러 서비스와 큐를 지나가면 공통 ID가 있어야 흐름을 이어볼 수 있습니다. 로그, 트레이스, 메트릭이 같은 ID를 공유하면 문제의 경로가 선명해집니다.

세 번째는 민감정보 절제입니다. 구조화되어 있다고 해서 모든 값을 남기면 안 됩니다. 이메일, 토큰, 결제 정보, 개인 식별자는 마스킹하거나 남기지 않는 정책이 필요합니다.

## 작은 예시 또는 체크리스트

`console.log("payment failed", error)`만 남기면 결제 실패가 얼마나 자주, 어느 결제사에서, 어떤 오류 코드로 나는지 세기 어렵습니다. 대신 `event=payment_failed`, `provider`, `order_id`, `request_id`, `error_code`, `duration_ms`를 필드로 남기면 장애 범위와 원인을 바로 좁힐 수 있습니다.

- 서비스 전반에서 요청 ID나 trace ID가 같은 필드명으로 남는가?
- 사용자, 조직, 주문처럼 문제 범위를 좁히는 ID가 필요한 곳에 남는가?
- 오류 메시지와 오류 코드가 분리되어 검색 가능한가?
- 민감정보를 로그에 남기지 않도록 테스트나 필터가 있는가?
- 로그 레벨이 알림과 보관 비용을 고려해 정리되어 있는가?

## 실무에서 자주 생기는 오해

- “로그를 많이 남기면 된다”는 오해가 있습니다. 양이 많아도 필드가 없으면 검색 비용만 커집니다.

- “JSON이면 구조화 로그다”도 절반만 맞습니다. 필드 이름과 의미가 제각각이면 JSON 문자열 묶음일 뿐입니다.

- “나중에 파싱하면 된다”는 접근은 깨지기 쉽습니다. 사람이 쓴 문장은 조금만 바뀌어도 정규식과 대시보드를 망가뜨립니다.

## 오늘 바로 적용해보기

장애 대응에 자주 쓰는 검색어 세 개를 골라, 그 값이 별도 필드로 남는지 확인해보세요.

팀 공통 로그 필드 목록을 짧게 정하고 새 코드 리뷰 체크리스트에 넣어보세요.

민감정보가 로그에 들어가지 않는지 샘플 로그와 필터 설정을 함께 점검하세요.

## 더 알아보기

- [OpenTelemetry: Logs](https://opentelemetry.io/docs/concepts/signals/logs/)
- [Google SRE Book: Practical Alerting](https://sre.google/sre-book/practical-alerting/)
- [OWASP Logging Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Logging_Cheat_Sheet.html)

## 오늘의 takeaway

좋은 로그는 예쁜 문장이 아니라, 장애 순간에 정확히 찾을 수 있는 필드입니다.

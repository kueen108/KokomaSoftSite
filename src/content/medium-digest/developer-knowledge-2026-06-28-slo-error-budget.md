---
title: "개발자가 알아야 할 지식: SLO와 에러 버짓, 완벽한 안정성 대신 합의된 위험을 관리한다"
canonicalSlug: "developer-knowledge-2026-06-28-slo-error-budget"
description: "서비스 수준 목표와 에러 버짓이 기능 출시와 안정성 투자를 조율하는 방법을 설명합니다."
pubDate: "2026-06-28"
sourceTitle: "Google SRE Workbook: Implementing SLOs"
sourceUrl: "https://sre.google/workbook/implementing-slos/"
sourceAuthor: "Google SRE"
tags: ["개발자가 알아야 할 지식", "SRE", "Reliability", "Operations"]
---
SLO와 에러 버짓는 코드가 커지고 사용자가 늘어날수록 조용히 중요해지는 실무 개념입니다. 처음에는 세부 구현처럼 보이지만, 실제로는 시스템이 실패를 어떻게 다룰지 정하는 기준이 됩니다.

## 왜 개발자가 알아야 하나

SLO와 에러 버짓는 작은 코드 조각보다 시스템의 약속에 더 가깝습니다.

이 기준이 없으면 구현은 동작해도 운영 순간에 비용, 장애, 데이터 불일치가 드러납니다.

개발자가 이 개념을 알면 설계 결정의 이유를 더 분명히 설명하고, 장애가 나기 전에 위험을 줄일 수 있습니다.

## 핵심 개념

첫 번째 핵심은 경계입니다. SLO와 에러 버짓가 적용되는 범위와 적용되지 않는 범위를 구분해야 합니다. 경계가 흐리면 예외 처리가 곳곳에 흩어지고, 나중에는 같은 문제가 서로 다른 방식으로 해결됩니다.

두 번째 핵심은 계약입니다. 서버, 클라이언트, 데이터베이스, 운영 도구가 어떤 값을 믿고 어떤 실패를 허용하는지 문서와 코드에 함께 드러나야 합니다.

세 번째 핵심은 관측 가능성입니다. 제대로 설계했는지 알려면 성공 경로뿐 아니라 거절, 충돌, 지연, 재시도 같은 사건도 로그와 지표로 확인할 수 있어야 합니다.

## 작은 예시 또는 체크리스트

월간 가용성 목표가 99.9%라면 약 43분의 실패 여유가 있습니다. 이 여유를 빠르게 소진한다면 새 기능 출시보다 안정성 개선을 우선해야 한다는 신호가 됩니다.

- SLO가 내부 시스템 지표가 아니라 사용자 경험에 가까운가?
- 측정 기간과 제외 조건이 명확한가?
- 에러 버짓 소진 속도를 보고 출시 정책이 바뀌는가?
- 알림이 SLO 위반 위험과 연결되어 있는가?
- 제품팀과 엔지니어링팀이 같은 목표를 보고 있는가?

## 실무에서 자주 생기는 오해

- “100% 안정성이 목표”라는 말은 현실적인 의사결정을 흐립니다. 비용과 속도까지 고려하면 목표 수준을 합의하는 편이 낫습니다.

- “SLO는 운영팀 문서”도 아닙니다. 사용자의 기대와 제품 약속을 기술 지표로 바꾸는 작업입니다.

- “한 번 정하면 끝”도 아닙니다. 사용자 규모와 제품 성격이 바뀌면 SLO도 다시 봐야 합니다.

## 오늘 바로 적용해보기

핵심 사용자 여정 하나를 골라 성공률 SLO 초안을 만들어보세요.

최근 한 달 장애가 에러 버짓을 얼마나 썼는지 계산하세요.

SLO 위반 위험이 커질 때 출시를 늦출 기준을 정하세요.

## 더 알아보기

- [Google SRE Workbook: Implementing SLOs](https://sre.google/workbook/implementing-slos/)
- [Google SRE Book: Service Level Objectives](https://sre.google/sre-book/service-level-objectives/)
- [Atlassian: SLOs, SLIs and SLAs](https://www.atlassian.com/incident-management/kpis/sla-vs-slo-vs-sli)

## 오늘의 takeaway

에러 버짓은 장애를 허락하는 면죄부가 아니라, 속도와 안정성의 대화를 숫자로 만드는 도구입니다.

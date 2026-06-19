---
title: "개발자가 알아야 할 지식: 스키마 마이그레이션, 데이터 변경은 배포보다 오래 남는다"
canonicalSlug: "developer-knowledge-2026-06-20-schema-migration"
description: "DB 스키마 변경을 안전하게 배포하기 위한 expand-contract, 롤백, 호환성 원칙을 정리합니다."
pubDate: "2026-06-20"
sourceTitle: "Prisma Docs: Data migrations"
sourceUrl: "https://www.prisma.io/docs/orm/prisma-migrate/workflows/data-migration"
sourceAuthor: "Prisma"
tags: ["개발자가 알아야 할 지식", "Databases", "Deployment", "Reliability"]
---
스키마 마이그레이션는 코드가 커지고 사용자가 늘어날수록 조용히 중요해지는 실무 개념입니다. 처음에는 세부 구현처럼 보이지만, 실제로는 시스템이 실패를 어떻게 다룰지 정하는 기준이 됩니다.

## 왜 개발자가 알아야 하나

코드는 되돌리기 쉽지만 데이터 구조는 한 번 바뀌면 오래 남습니다. 컬럼 삭제, 타입 변경, 인덱스 추가, 백필 작업은 배포 버튼보다 느리게 진행되고 장애 범위도 넓습니다.

마이그레이션을 앱 배포와 한 덩어리로만 보면 새 코드와 옛 코드가 동시에 떠 있는 순간을 놓칩니다. 롤링 배포 중 일부 인스턴스가 새 컬럼을 쓰고 일부는 옛 컬럼만 읽으면 예측하기 어려운 오류가 생깁니다.

개발자가 마이그레이션 흐름을 알면 변경을 확장, 전환, 정리 단계로 나누고 데이터 손실 없이 배포할 수 있습니다.

## 핵심 개념

첫 번째는 호환성입니다. 새 스키마는 잠시 동안 옛 코드와 새 코드를 모두 받아들여야 합니다. 컬럼을 바로 지우기보다 먼저 추가하고, 양쪽 쓰기나 백필을 거친 뒤 읽기 경로를 옮기는 편이 안전합니다.

두 번째는 작업 크기입니다. 큰 테이블에 인덱스를 만들거나 값을 채우는 작업은 온라인 여부, 잠금, 배치 크기, 재시도 가능성을 확인해야 합니다.

세 번째는 검증입니다. 마이그레이션이 끝났다는 것은 명령이 성공했다는 뜻만이 아니라 데이터 개수, null 비율, 읽기 경로, 오류율이 기대와 맞는다는 뜻이어야 합니다.

## 작은 예시 또는 체크리스트

사용자 이름 컬럼을 `name`에서 `display_name`으로 바꾼다고 합시다. 안전한 흐름은 새 컬럼 추가, 기존 값 백필, 새 코드에서 양쪽 쓰기, 읽기 경로 전환, 충분한 관측 후 옛 컬럼 제거입니다. 한 번에 rename하면 롤링 배포 중 일부 서버가 컬럼을 찾지 못할 수 있습니다.

- 새 스키마가 옛 코드와 새 코드 모두에서 안전하게 동작하는가?
- 대용량 테이블 변경이 긴 잠금이나 복제를 밀리게 만들지 않는가?
- 백필은 중단 후 다시 실행해도 같은 결과를 내는가?
- 롤백할 때 코드뿐 아니라 데이터 상태도 고려했는가?
- 마이그레이션 완료를 검증할 쿼리와 지표가 준비되어 있는가?

## 실무에서 자주 생기는 오해

- “마이그레이션 파일이 있으니 안전하다”는 오해가 있습니다. 파일은 절차일 뿐이고 운영 데이터의 크기와 배포 방식이 실제 위험을 정합니다.

- “트래픽 적은 시간에 하면 된다”도 절반만 맞습니다. 잠금과 복제 지연은 적은 트래픽에서도 치명적일 수 있습니다.

- “실패하면 롤백하면 된다”는 말도 데이터 변경에서는 조심해야 합니다. 삭제되거나 합쳐진 데이터는 코드처럼 간단히 되돌릴 수 없습니다.

## 오늘 바로 적용해보기

다음 스키마 변경을 expand, migrate, contract 세 단계로 나눠 적어보세요.

백필 스크립트는 작은 배치와 재시작 가능성을 기준으로 점검하세요.

마이그레이션 PR에는 롤백 계획과 완료 검증 쿼리를 함께 남기세요.

## 더 알아보기

- [Prisma Docs: Data migrations](https://www.prisma.io/docs/orm/prisma-migrate/workflows/data-migration)
- [PlanetScale: Online schema changes](https://planetscale.com/docs/concepts/online-schema-change)
- [GitLab Docs: Database migrations style guide](https://docs.gitlab.com/development/database/migrations_for_multiple_databases/)

## 오늘의 takeaway

좋은 스키마 변경은 한 번에 바꾸는 기술이 아니라, 옛 세계와 새 세계가 잠시 공존하게 만드는 설계입니다.

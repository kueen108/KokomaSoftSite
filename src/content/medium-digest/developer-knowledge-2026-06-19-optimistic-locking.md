---
title: "개발자가 알아야 할 지식: 낙관적 잠금, 충돌은 드물지만 확인은 꼭 해야 한다"
canonicalSlug: "developer-knowledge-2026-06-19-optimistic-locking"
description: "동시 수정 문제를 버전 필드와 조건부 업데이트로 다루는 낙관적 잠금의 원리와 한계를 정리합니다."
pubDate: "2026-06-19"
sourceTitle: "Martin Fowler: Optimistic Offline Lock"
sourceUrl: "https://martinfowler.com/eaaCatalog/optimisticOfflineLock.html"
sourceAuthor: "Martin Fowler"
tags: ["개발자가 알아야 할 지식", "Databases", "Concurrency", "Architecture"]
---
여러 사용자가 같은 데이터를 수정할 때 문제는 “누가 먼저 저장했는가”보다 “내가 본 값이 아직도 최신인가”입니다.

## 왜 개발자가 알아야 하나

웹 애플리케이션에서는 같은 문서, 주문, 설정, 재고를 여러 요청이 동시에 건드릴 수 있습니다. 마지막 저장이 무조건 이기면 앞선 사용자의 변경이 조용히 사라집니다.

낙관적 잠금은 충돌이 자주 일어나지 않는다고 보고, 미리 잠그기보다 저장 순간에 버전이 바뀌었는지 확인합니다. 충돌이 있으면 저장을 거부하고 사용자나 호출자에게 다시 판단하게 합니다.

이 방식은 긴 편집 세션, 분산 시스템, REST API에서 특히 유용합니다. 데이터베이스 락을 오래 잡지 않으면서도 잃어버린 업데이트를 막을 수 있기 때문입니다.

## 핵심 개념

보통 레코드에 `version`, `updated_at`, `etag` 같은 값을 둡니다. 클라이언트는 읽은 버전을 함께 보내고, 서버는 현재 버전이 같을 때만 업데이트합니다.

SQL에서는 `UPDATE documents SET body = ?, version = version + 1 WHERE id = ? AND version = ?` 같은 조건부 업데이트가 핵심입니다. 영향받은 row가 0이면 누군가 먼저 수정한 것입니다.

HTTP에서는 `ETag`와 `If-Match` 헤더를 활용할 수 있습니다. 클라이언트가 알고 있는 ETag와 서버의 현재 ETag가 다르면 `412 Precondition Failed`로 충돌을 알려줄 수 있습니다.

## 작은 예시 또는 체크리스트

관리자 A와 B가 같은 상품 설명을 열었습니다. A가 먼저 저장하면서 version이 7에서 8이 됩니다. B가 여전히 version 7 기준으로 저장하려 하면 서버는 업데이트를 거부합니다. B는 최신 내용을 다시 보고 병합하거나 자신의 변경을 포기할 수 있습니다.

- 동시 수정될 수 있는 주요 엔티티에 버전 필드가 있는가?
- 업데이트 쿼리가 ID만이 아니라 이전 버전까지 조건으로 확인하는가?
- 충돌 시 클라이언트가 명확한 오류와 복구 경로를 받는가?
- 자동 재시도가 사용자의 변경을 무조건 덮어쓰지 않는가?
- 배치 작업과 관리자 도구도 같은 충돌 규칙을 따르는가?

## 실무에서 자주 생기는 오해

- “트랜잭션을 쓰면 필요 없다”는 오해가 있습니다. 짧은 트랜잭션은 DB 내부 일관성을 지키지만, 사용자가 화면을 열어두는 긴 시간의 충돌까지 자동으로 해결하지는 않습니다.

- “updated_at만 보면 충분하다”도 조심해야 합니다. 시간 정밀도, 시계 동기화, DB 갱신 방식에 따라 버전 숫자가 더 명확할 수 있습니다.

- “충돌은 드물다”는 말은 무시해도 된다는 뜻이 아닙니다. 드문 충돌일수록 조용히 데이터가 사라지면 찾기 어렵습니다.

## 오늘 바로 적용해보기

중요한 수정 화면 하나를 골라 두 브라우저 탭에서 동시에 저장해보세요. 앞선 변경이 사라지면 낙관적 잠금 후보입니다.

API 문서에 업데이트 요청이 어떤 버전 조건을 요구하는지 명시하세요.

충돌 메시지는 기술 오류가 아니라 사용자가 다음 선택을 할 수 있는 안내로 작성하세요.

## 더 알아보기

- [Martin Fowler: Optimistic Offline Lock](https://martinfowler.com/eaaCatalog/optimisticOfflineLock.html)
- [MDN: ETag](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/ETag)
- [MDN: If-Match](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/If-Match)

## 오늘의 takeaway

낙관적 잠금은 충돌이 없다고 믿는 기술이 아니라, 충돌이 있을 때 조용히 덮어쓰지 않게 만드는 안전장치입니다.

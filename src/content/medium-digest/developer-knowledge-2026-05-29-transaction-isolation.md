---
title: "개발자가 알아야 할 지식: 트랜잭션 격리 수준, 읽었다고 안전한 것은 아니다"
description: "Read Committed, Repeatable Read, Serializable의 차이를 실무 관점에서 설명하고, MVCC 환경에서 비즈니스 규칙 검증과 write skew를 어떻게 다뤄야 하는지 정리한다."
pubDate: "2026-05-29"
sourceTitle: "PostgreSQL Documentation: Transaction Isolation"
sourceUrl: "https://www.postgresql.org/docs/current/transaction-iso.html"
sourceAuthor: "PostgreSQL Global Development Group"
tags: ["개발자가 알아야 할 지식", "Software Engineering", "Database", "Transactions", "Reliability"]
---

## 왜 개발자가 알아야 하나

데이터베이스 트랜잭션을 쓰면 많은 문제가 자동으로 사라진다고 생각하기 쉽다. `BEGIN`으로 시작해서 몇 개의 `SELECT`와 `UPDATE`를 실행한 뒤 `COMMIT`하면, 그 사이에 읽은 조건이 끝까지 유효할 것처럼 느껴진다. 하지만 실제 운영 환경에서 트랜잭션은 “동시에 실행되는 다른 트랜잭션을 어떤 방식으로 볼 것인가”라는 격리 수준의 영향을 받는다. 트랜잭션을 썼는데도 재고가 음수가 되고, 당직자가 한 명도 남지 않고, 한도 초과 쿠폰이 발급되는 이유가 여기에 있다.

실무에서 특히 위험한 지점은 비즈니스 규칙을 “먼저 조회하고, 괜찮으면 변경한다”로 구현할 때다. 예를 들어 “팀에는 항상 최소 한 명의 온콜 담당자가 있어야 한다”는 규칙을 생각해보자. 두 명의 담당자가 동시에 휴가 신청을 한다. 각 트랜잭션은 현재 담당자가 두 명이라는 스냅샷을 읽고, 자기 자신을 담당자 목록에서 뺀다. 두 트랜잭션이 서로 다른 행을 수정한다면 충돌 없이 모두 커밋될 수 있다. 각각은 읽을 당시에는 규칙을 지킨 것처럼 보였지만, 최종 상태는 담당자 0명이다. 이것이 흔히 말하는 write skew의 전형적인 모양이다.

이 문제는 단순한 데이터베이스 이론이 아니다. 결제 한도, 예약 가능 수량, 권한 변경, 중복 가입 방지, 배치 작업의 작업 소유권, 의료 시스템의 제약 조건처럼 “전체 상태를 보고 판단한 뒤 일부를 수정하는” 코드에서 반복된다. 개발자가 격리 수준을 모르면 테스트에서는 통과하지만 트래픽이 몰린 날에만 깨지는 버그를 만들기 쉽다. 반대로 격리 수준을 이해하면 어떤 규칙은 유니크 제약으로 밀어 넣고, 어떤 규칙은 행 잠금으로 보호하고, 어떤 규칙은 Serializable과 재시도로 처리해야 하는지 판단할 수 있다.

트랜잭션 격리 수준을 알아야 하는 또 다른 이유는 데이터베이스마다 이름이 같아도 구현과 보장이 다를 수 있기 때문이다. PostgreSQL의 `Repeatable Read`는 표준이 요구하는 것보다 강하게 phantom read를 막지만, serialization anomaly는 여전히 가능하다고 문서화한다. MySQL InnoDB의 `Repeatable Read`, Oracle의 `Serializable`, SQL Server의 snapshot isolation도 세부 동작이 다르다. 그래서 “우리 DB 기본값이 Read Committed니까 괜찮다” 또는 “Repeatable Read니까 직렬 실행과 같다”라고 외우면 위험하다. 중요한 것은 이름이 아니라 어떤 동시 실행 결과가 허용되는지다.

## 핵심 개념

트랜잭션 격리 수준은 동시에 실행되는 트랜잭션들이 서로의 읽기와 쓰기를 얼마나 강하게 분리할지 정하는 규칙이다. SQL 표준은 대표적으로 `Read Uncommitted`, `Read Committed`, `Repeatable Read`, `Serializable`을 정의한다. PostgreSQL 문서는 dirty read, nonrepeatable read, phantom read, serialization anomaly 같은 현상을 기준으로 각 수준의 보장을 설명한다. 가장 강한 `Serializable`은 여러 트랜잭션을 동시에 실행했더라도 결과가 어떤 순서로든 하나씩 실행한 것과 같아야 한다.

`Read Committed`는 많은 데이터베이스의 기본값이다. 이름 그대로 커밋된 데이터만 읽게 해주므로, 아직 커밋되지 않은 다른 트랜잭션의 값을 보는 dirty read는 막는다. 하지만 PostgreSQL 기준으로 `SELECT`는 각 문장이 시작하는 순간의 스냅샷을 본다. 같은 트랜잭션 안에서도 첫 번째 `SELECT`와 두 번째 `SELECT` 사이에 다른 트랜잭션이 커밋하면, 두 조회는 서로 다른 세계를 볼 수 있다. 단순히 특정 계좌 한 행을 업데이트하는 작업에는 충분할 수 있지만, 여러 조회 결과를 조합해 비즈니스 판단을 내리는 코드에서는 조심해야 한다.

`Repeatable Read`는 한 트랜잭션 안에서 같은 데이터를 다시 읽을 때 일관된 스냅샷을 제공한다. PostgreSQL에서는 트랜잭션의 첫 실제 문장이 시작될 때 스냅샷이 고정되고, 이후 조회는 그 시점의 세계를 본다. 덕분에 같은 조건을 다시 조회했는데 결과가 바뀌는 혼란은 줄어든다. 그러나 “스냅샷이 안정적이다”와 “최종 결과가 직렬 실행과 같다”는 같은 말이 아니다. 스냅샷 격리(snapshot isolation)는 보통 같은 행을 동시에 쓰는 lost update는 잘 막지만, 서로 다른 행을 쓰면서 읽은 조건이 겹치는 write skew는 허용할 수 있다.

write skew의 핵심은 두 트랜잭션이 같은 규칙을 읽지만 서로 다른 대상을 수정한다는 점이다. 데이터베이스는 같은 행을 동시에 업데이트하면 충돌을 감지하기 쉽다. 하지만 트랜잭션 A가 `doctor_id = 1` 행을 수정하고, 트랜잭션 B가 `doctor_id = 2` 행을 수정한다면 쓰기 충돌은 없다. 둘 다 “다른 담당자가 아직 있으니 나는 빠져도 된다”고 판단할 수 있다. 각 트랜잭션의 스냅샷에서는 말이 되지만, 둘을 합친 최종 상태는 규칙을 깨뜨린다.

`Serializable`은 이런 serialization anomaly를 막기 위한 가장 강한 격리 수준이다. PostgreSQL의 Serializable은 단순히 모든 트랜잭션을 줄 세워 실행하는 방식이 아니라, 위험한 read/write 충돌 패턴을 감시하다가 직렬화할 수 없는 상황이 보이면 한쪽 트랜잭션을 serialization failure로 롤백한다. 이 말은 Serializable을 쓰면 애플리케이션이 반드시 재시도 전략을 가져야 한다는 뜻이기도 하다. 강한 격리는 “오류가 절대 안 난다”가 아니라 “이 결과는 안전하지 않으니 다시 실행하라”고 말할 수 있는 계약이다.

격리 수준만으로 모든 무결성 문제가 해결되는 것도 아니다. 유니크 인덱스, 외래 키, 체크 제약, exclusion constraint처럼 데이터베이스 제약으로 표현할 수 있는 규칙은 가능하면 DB에 맡기는 편이 좋다. 예를 들어 “같은 이메일은 하나만 존재한다”는 애플리케이션에서 먼저 조회하고 삽입하는 것보다 유니크 인덱스가 정답이다. 반면 “전체 활성 담당자가 최소 한 명이어야 한다”처럼 여러 행의 집합 조건은 제약으로 표현하기 어렵거나 DB별 기능이 필요하므로, Serializable, 명시적 잠금, 설계 변경 중 하나를 선택해야 한다.

## 작은 예시 또는 체크리스트

온콜 담당자 예시를 조금 더 구체적으로 보자. 테이블에는 두 명의 의사가 있고, 둘 다 현재 온콜 상태다.

```sql
-- doctors
-- id | name | on_call
--  1 | A    | true
--  2 | B    | true
```

두 사용자가 거의 동시에 “오늘 온콜에서 빠지기”를 누른다. 애플리케이션 로직은 다음과 비슷하다.

```sql
BEGIN;
SELECT count(*) FROM doctors WHERE on_call = true;
-- count가 2 이상이면 한 명은 빠져도 된다고 판단
UPDATE doctors SET on_call = false WHERE id = :me;
COMMIT;
```

트랜잭션 A는 `id = 1`을 false로 바꾸고, 트랜잭션 B는 `id = 2`를 false로 바꾼다. 둘은 서로 다른 행을 업데이트하므로 일반적인 행 단위 쓰기 충돌이 없다. Repeatable Read 또는 snapshot isolation 계열에서는 둘 다 자신이 시작할 때 본 스냅샷을 기준으로 안전하다고 판단하고 커밋될 수 있다. 결과적으로 `on_call = true`인 행은 0개가 된다.

이런 코드를 리뷰할 때는 다음 질문을 던지면 좋다.

- 이 로직이 읽은 조건은 커밋 시점에도 반드시 참이어야 하는가?
- 같은 규칙을 확인하는 다른 트랜잭션이 동시에 실행될 수 있는가?
- 두 트랜잭션이 같은 행을 수정하는가, 아니면 서로 다른 행을 수정해 충돌을 피하는가?
- 규칙을 유니크 인덱스, 체크 제약, 외래 키, exclusion constraint로 표현할 수 있는가?
- 표현하기 어렵다면 Serializable과 재시도를 쓸 것인가, 아니면 명시적 잠금으로 관련 범위를 보호할 것인가?
- 실패했을 때 사용자가 다시 시도해도 안전한 UX와 API 계약이 있는가?
- 읽기 전용 복제본이나 캐시에서 확인한 값을 쓰기 판단에 사용하고 있지는 않은가?

PostgreSQL에서 이 문제를 다루는 한 가지 방법은 관련 트랜잭션을 `SERIALIZABLE`로 실행하고 serialization failure를 재시도하는 것이다. 다른 방법은 규칙을 대표하는 별도 행을 두고 그 행을 `SELECT ... FOR UPDATE`로 잠그거나, 팀 단위 설정 행을 실제로 업데이트해 모든 변경이 같은 잠금 지점에서 만나게 하는 것이다. 어떤 방식이든 핵심은 “같은 규칙을 건드리는 트랜잭션들이 서로를 보게 만들기”다.

## 실무에서 자주 생기는 오해

- **“트랜잭션이면 중간 상태를 아무도 못 보니 안전하다”는 오해**: 원자성은 트랜잭션의 변경이 전부 반영되거나 전부 취소된다는 뜻이다. 격리성은 동시 트랜잭션이 서로를 어떻게 보는지의 문제다. `BEGIN`과 `COMMIT`만으로 모든 비즈니스 규칙이 자동 보호되지는 않는다.

- **“Repeatable Read는 직렬 실행과 같다”는 오해**: 반복 읽기가 안정적이라는 뜻이지, 모든 동시 실행 결과가 직렬 순서와 같다는 뜻은 아니다. PostgreSQL 문서도 Repeatable Read에서 serialization anomaly가 가능하다고 분명히 구분한다. 특히 여러 행을 읽고 서로 다른 행을 쓰는 패턴을 의심해야 한다.

- **“Serializable은 느려서 무조건 피해야 한다”는 오해**: 무조건 켜라는 뜻은 아니지만, 돈·권한·재고·한도처럼 틀리면 비싼 규칙에는 강한 격리가 오히려 단순하고 안전한 선택일 수 있다. 다만 serialization failure를 정상적인 재시도 가능한 오류로 다뤄야 하며, 긴 트랜잭션과 불필요한 읽기 범위를 줄여야 한다.

- **“잠금을 걸면 언제나 최신 상태를 본다”는 오해**: MVCC 데이터베이스에서는 잠금을 언제 획득했는지와 스냅샷이 언제 고정됐는지가 중요하다. PostgreSQL 문서는 Repeatable Read에서 명시적 잠금을 쓰려면 스냅샷이 고정되기 전에 잠금을 얻는 점을 고려하라고 설명한다. 잠금은 강력하지만 대충 붙이면 기대한 의미와 다를 수 있다.

- **“애플리케이션에서 한 번 더 조회하면 된다”는 오해**: Read Committed에서는 조회마다 다른 스냅샷을 볼 수 있고, Repeatable Read에서는 다시 조회해도 같은 오래된 스냅샷을 볼 수 있다. 중요한 것은 몇 번 조회했느냐가 아니라, 커밋 가능한 최종 상태를 DB가 어떤 규칙으로 검증하게 만들었느냐다.

- **“읽기 복제본으로 검증해도 충분하다”는 오해**: 복제 지연이 있거나 replica가 Serializable 보장을 제공하지 않는다면, 복제본에서 본 “가능하다”는 판단은 쓰기 시점의 primary 현실과 다를 수 있다. 비즈니스 무결성 판단은 가능하면 실제 쓰기가 일어나는 데이터베이스 경계 안에서 끝내야 한다.

## 오늘 바로 적용해보기

오늘 코드베이스에서 `SELECT`로 가능 여부를 확인한 뒤 `INSERT`, `UPDATE`, `DELETE`를 수행하는 로직을 하나 찾아보자. 예약 생성, 쿠폰 발급, 관리자 권한 변경, 작업 큐 claim, 구독 플랜 변경처럼 사용자가 동시에 누를 수 있는 기능이면 더 좋다. 그리고 “두 요청이 같은 조건을 읽고 서로 다른 행을 바꾸면 최종 상태가 깨질 수 있는가?”를 확인해보면 된다.

가능하면 규칙을 데이터베이스 제약으로 옮겨라. 중복 방지는 유니크 인덱스, 소유 관계는 외래 키, 단일 활성 항목은 부분 유니크 인덱스, 기간 겹침 방지는 DB가 지원한다면 exclusion constraint가 더 낫다. 제약은 애플리케이션 인스턴스 수와 관계없이 같은 위치에서 동작하고, 경쟁 상황에서도 훨씬 믿을 수 있다.

제약으로 표현하기 어려운 규칙은 트랜잭션 정책을 코드에 명확히 드러내자. `SERIALIZABLE`을 선택한다면 트랜잭션 함수를 작게 만들고, serialization failure를 잡아 짧은 지수 백오프로 재시도하라. 명시적 잠금을 선택한다면 무엇을 대표 잠금으로 삼는지 주석과 테스트로 남겨라. 어느 쪽이든 “아마 동시에 안 들어오겠지”는 설계가 아니다.

마지막으로 동시성 테스트를 하나 추가해보자. 두 개 이상의 연결에서 같은 조건을 동시에 읽고, 의도적으로 커밋 순서를 엇갈리게 만든다. 단위 테스트보다 느릴 수 있지만, 핵심 비즈니스 규칙 하나를 이런 방식으로 검증해두면 장애를 예방하는 값이 크다. 트랜잭션 격리 문제는 평범한 순차 테스트로는 잘 드러나지 않는다.

## 더 알아보기

- [PostgreSQL Documentation: Transaction Isolation](https://www.postgresql.org/docs/current/transaction-iso.html)
- [PostgreSQL Documentation: Data Consistency Checks at the Application Level](https://www.postgresql.org/docs/current/applevel-consistency.html)
- [Jepsen: Snapshot Isolation](https://jepsen.io/consistency/models/snapshot-isolation)
- [Jepsen: Serializable](https://jepsen.io/consistency/models/serializable)

## 오늘의 takeaway

트랜잭션을 믿기 전에, 내가 읽은 비즈니스 조건이 동시 커밋 뒤에도 반드시 참으로 남는지부터 의심하자.

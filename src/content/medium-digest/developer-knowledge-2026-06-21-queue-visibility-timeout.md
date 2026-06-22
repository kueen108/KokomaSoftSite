---
title: "개발자가 알아야 할 지식: 큐 visibility timeout, 작업이 사라진 것이 아니라 잠시 안 보이는 것이다"
canonicalSlug: "developer-knowledge-2026-06-21-queue-visibility-timeout"
description: "메시지 큐에서 visibility timeout이 중복 처리, 재시도, 작업 시간 설계에 주는 영향을 설명합니다."
pubDate: "2026-06-21"
sourceTitle: "AWS SQS Developer Guide: Visibility timeout"
sourceUrl: "https://docs.aws.amazon.com/AWSSimpleQueueService/latest/SQSDeveloperGuide/sqs-visibility-timeout.html"
sourceAuthor: "Amazon Web Services"
tags: ["개발자가 알아야 할 지식", "Queues", "Reliability", "Distributed Systems"]
---
큐 visibility timeout는 코드가 커지고 사용자가 늘어날수록 조용히 중요해지는 실무 개념입니다. 처음에는 세부 구현처럼 보이지만, 실제로는 시스템이 실패를 어떻게 다룰지 정하는 기준이 됩니다.

## 왜 개발자가 알아야 하나

큐에서 메시지를 가져오는 순간 메시지가 삭제된다고 생각하면 재시도와 중복 처리의 핵심을 놓칩니다. 많은 큐는 소비자가 처리하는 동안 메시지를 잠시 숨길 뿐, 성공 삭제가 오기 전까지는 다시 나타날 수 있습니다.

작업 시간이 visibility timeout보다 길면 같은 메시지가 다른 워커에게 다시 전달됩니다. 반대로 timeout을 너무 길게 잡으면 실패한 작업이 오래 묶여 복구가 늦어집니다.

이 개념을 알면 작업 처리 시간을 현실적으로 측정하고, 중복 실행을 전제로 안전한 워커를 만들 수 있습니다.

## 핵심 개념

첫 번째는 처리 시간과 timeout의 관계입니다. 평균이 아니라 느린 경우까지 보고 timeout을 정해야 합니다.

두 번째는 멱등성입니다. 메시지는 한 번만 처리된다고 가정하면 안 됩니다. 작업 ID, 이벤트 ID, 상태 전이를 기준으로 중복 실행을 막아야 합니다.

세 번째는 연장과 실패 처리입니다. 긴 작업은 heartbeat나 timeout 연장을 쓰고, 반복 실패 메시지는 dead letter queue로 보내 원인을 따로 봐야 합니다.

## 작은 예시 또는 체크리스트

이미지 변환 작업이 보통 20초지만 가끔 3분 걸린다고 합시다. visibility timeout이 60초라면 느린 작업은 아직 처리 중인데 큐에 다시 보입니다. 두 워커가 같은 이미지를 변환하고, 결과 파일을 서로 덮어쓸 수 있습니다.

- 작업 시간의 p95, p99가 visibility timeout보다 충분히 짧은가?
- 작업이 중복 실행되어도 최종 상태가 망가지지 않는가?
- 긴 작업은 timeout을 연장하거나 작은 작업으로 나뉘어 있는가?
- 반복 실패 메시지는 DLQ로 이동하고 알림이 가는가?
- 메시지 삭제는 실제 처리 성공 뒤에만 수행되는가?

## 실무에서 자주 생기는 오해

- “큐에서 받았으니 내 것이다”라는 오해가 있습니다. 처리 성공을 확정하기 전까지 메시지는 다시 나타날 수 있습니다.

- “timeout을 아주 길게 잡으면 안전하다”도 위험합니다. 워커가 죽었을 때 복구가 늦어지고 큐 지연이 커집니다.

- “중복은 큐가 막아준다”는 생각도 부족합니다. 대부분의 분산 큐는 적어도 한 번 전달을 기준으로 설계됩니다.

## 오늘 바로 적용해보기

가장 오래 걸리는 큐 작업의 처리 시간 분포를 확인하세요.

작업 결과 저장 경로에 idempotency key나 상태 전이 조건을 넣으세요.

DLQ 메시지를 운영자가 쉽게 볼 수 있는 대시보드에 올리세요.

## 더 알아보기

- [AWS SQS Developer Guide: Visibility timeout](https://docs.aws.amazon.com/AWSSimpleQueueService/latest/SQSDeveloperGuide/sqs-visibility-timeout.html)
- [Google Cloud Pub/Sub: Exactly-once delivery](https://cloud.google.com/pubsub/docs/exactly-once-delivery)
- [RabbitMQ: Consumer acknowledgements](https://www.rabbitmq.com/docs/confirms)

## 오늘의 takeaway

큐 작업은 한 번 가져오면 끝이 아닙니다. 성공을 확인할 때까지 메시지는 다시 돌아올 수 있습니다.

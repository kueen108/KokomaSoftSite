---
title: "개발자가 알아야 할 지식: AbortController, 취소 가능한 비동기 작업을 설계하는 법"
description: "AbortController와 AbortSignal을 이용해 fetch, 타임아웃, 사용자 취소, 컴포넌트 언마운트 같은 비동기 작업의 취소를 안전하게 전파하는 방법을 정리한다."
pubDate: "2026-06-06"
sourceTitle: "AbortSignal - Web APIs"
sourceUrl: "https://developer.mozilla.org/en-US/docs/Web/API/AbortSignal"
sourceAuthor: "MDN Web Docs"
tags: ["개발자가 알아야 할 지식", "Software Engineering", "JavaScript", "Web APIs", "Async"]
---

## 왜 개발자가 알아야 하나

비동기 작업은 시작보다 끝이 어렵다. 사용자가 검색어를 빠르게 바꿨는데 이전 요청이 늦게 도착해 화면을 덮어쓴다. 모달을 닫았는데 백그라운드 요청이 계속 진행된다. 페이지를 벗어난 뒤에도 콜백이 실행되어 상태 업데이트 경고가 뜬다. 타임아웃이 필요한데 요청은 계속 열려 있고, 서버는 이미 필요 없어진 작업을 처리하느라 자원을 쓴다. 이런 문제는 단순히 “느린 네트워크” 문제가 아니라 취소를 설계하지 않은 비동기 코드의 문제다.

JavaScript에서 이 문제를 다룰 때 표준적으로 쓰는 도구가 `AbortController`와 `AbortSignal`이다. 컨트롤러는 취소를 발생시키는 손잡이고, 시그널은 취소 상태를 작업에 전달하는 토큰이다. `fetch`는 `signal` 옵션을 받아 요청을 중단할 수 있고, MDN 문서처럼 `AbortSignal.timeout()`이나 `AbortSignal.any()`를 이용하면 타임아웃과 사용자 취소를 조합할 수도 있다.

개발자가 이 개념을 알아야 하는 이유는 취소가 UI 편의 기능을 넘어 시스템 안정성과 연결되기 때문이다. 취소되지 않는 요청은 대역폭을 낭비하고, 오래 살아 있는 Promise는 상태 경합을 만들며, 백엔드 작업까지 연결된 경우 불필요한 부하를 만든다. 특히 검색, 자동완성, 실시간 필터, 파일 업로드, 스트리밍, 긴 폴링, 에이전트 실행 같은 기능에서는 “시작한 작업을 어떻게 멈출 것인가”가 설계의 일부가 되어야 한다.

더 넓게 보면 `AbortSignal`은 JavaScript식 cancellation token이다. 작업을 시작한 곳과 실제 작업을 수행하는 곳이 다를 때, 취소 의도를 명시적으로 전달한다. 이 패턴을 잘 쓰면 비동기 함수가 호출자의 생명주기와 연결된다. 반대로 이 패턴이 없으면 함수는 호출자가 아직 결과를 원하는지 모른 채 끝까지 달린다. 좋은 비동기 API는 결과를 반환하는 방법만큼 취소되는 방법도 설명한다.

## 핵심 개념

`AbortController`는 `signal` 속성과 `abort()` 메서드를 가진 객체다. 작업을 시작할 때 `controller.signal`을 넘기고, 더 이상 작업이 필요 없을 때 `controller.abort()`를 호출한다. `fetch(url, { signal })`처럼 시그널을 받은 API는 취소가 발생하면 작업을 중단하고 Promise를 reject한다. 브라우저의 `fetch`에서는 보통 `AbortError`라는 이름의 `DOMException`으로 잡힌다.

중요한 규칙은 시그널이 한 번만 쓰인다는 점이다. MDN은 abort된 `AbortSignal`을 다시 사용하면 그 시그널을 받은 fetch가 즉시 reject된다고 설명한다. 따라서 요청마다 새 컨트롤러를 만들어야 한다. 검색 입력이 바뀔 때마다 이전 컨트롤러를 abort하고 새 컨트롤러를 만드는 방식이 대표적이다. 같은 컨트롤러를 재사용하면 다음 요청이 시작하자마자 취소되는 버그를 만들 수 있다.

취소는 실패와 다르게 다뤄야 한다. 사용자가 화면을 닫아서 요청을 멈춘 것은 네트워크 장애가 아니다. 타임아웃도 서버 오류와 다르다. `AbortSignal.timeout(5000)`은 일정 시간이 지나면 타임아웃 사유로 abort할 수 있고, 구현 환경에 따라 `TimeoutError`와 `AbortError`를 구분해 처리할 수 있다. 로깅과 사용자 메시지에서도 이 차이는 중요하다. 취소를 오류처럼 크게 경고하면 운영 지표가 오염되고, 실제 장애 신호를 놓치기 쉽다.

`AbortSignal.any()`는 여러 취소 원인을 하나로 묶을 때 유용하다. 예를 들어 사용자가 취소 버튼을 누르거나, 컴포넌트가 사라지거나, 10초 타임아웃이 지나면 같은 작업을 멈추고 싶을 수 있다. 이때 각각의 시그널을 합쳐 작업에 넘기면 된다. 다만 어떤 원인으로 취소됐는지 세밀하게 구분해야 한다면 별도 기록이나 reason 처리가 필요하다. 합쳐진 시그널만으로는 원인을 잃기 쉬운 경우가 있다.

직접 만든 Promise 기반 API도 취소를 받을 수 있어야 한다. 함수 인자로 `{ signal }`을 받고, 시작 전에 `signal.aborted`나 `signal.throwIfAborted()`를 확인한다. 작업 중에는 `abort` 이벤트를 구독하고, 취소 시 리소스를 정리한 뒤 reject한다. 이벤트 리스너는 `{ once: true }`를 쓰거나 finally에서 제거해 누수를 막는다. 중요한 것은 시그널을 받기만 하고 실제 작업을 멈추지 않는 가짜 취소를 만들지 않는 것이다.

## 작은 예시 또는 체크리스트

자동완성 검색을 생각해보자. 사용자가 `c`, `ca`, `cat`을 빠르게 입력하면 세 요청이 순서대로 시작될 수 있다. 네트워크 상황에 따라 `c` 요청이 가장 늦게 도착하면 화면에는 낡은 결과가 표시된다. 해결책은 새 요청을 시작하기 전에 이전 요청을 취소하는 것이다.

```js
let currentController;

async function search(query) {
  currentController?.abort();
  currentController = new AbortController();

  try {
    const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`, {
      signal: currentController.signal,
    });
    return await res.json();
  } catch (error) {
    if (error.name === "AbortError") return null;
    throw error;
  }
}
```

실무 체크리스트는 다음처럼 잡을 수 있다.

- 요청마다 새 `AbortController`를 만든다.
- 컴포넌트 언마운트, 라우트 변경, 새 입력, 취소 버튼, 타임아웃을 취소 원인으로 정의한다.
- 취소와 실제 오류를 로그에서 구분한다.
- 취소 시 열린 스트림, 타이머, 이벤트 리스너, 파일 핸들을 정리한다.
- 하위 함수에도 `{ signal }`을 전달해 취소가 깊게 전파되게 한다.
- 취소된 작업의 결과가 UI 상태를 덮어쓰지 못하게 한다.
- 백엔드도 가능하면 클라이언트 연결 종료나 작업 취소 신호를 반영하게 설계한다.

## 실무에서 자주 생기는 오해

- **Promise는 자동으로 취소되지 않는다.** `AbortController`를 만들었다고 모든 비동기 작업이 멈추는 것은 아니다. 시그널을 받은 API가 실제로 취소를 구현해야 한다.

- **취소는 catch에서 조용히 삼켜도 되는 오류가 아니다.** UI에서는 무시할 수 있지만, 작업 정리와 지표 분리는 필요하다. 특히 업로드나 결제 같은 작업에서는 취소 의미를 명확히 해야 한다.

- **타임아웃은 취소의 한 종류일 뿐이다.** 사용자가 취소한 것과 시간이 초과된 것은 제품 경험과 운영 대응이 다르다. 가능하면 구분해서 처리하자.

- **시그널 재사용은 위험하다.** 이미 abort된 signal을 다음 fetch에 넘기면 요청이 즉시 실패한다. 요청 생명주기마다 컨트롤러를 새로 만든다는 원칙을 지키는 편이 안전하다.

- **프론트엔드 취소가 백엔드 작업 취소를 보장하지는 않는다.** 브라우저가 연결을 끊어도 서버가 이미 작업을 계속할 수 있다. 긴 작업은 서버 측 취소 토큰, 작업 ID, 중단 API가 따로 필요할 수 있다.

- **취소를 너무 깊이 숨기면 디버깅이 어려워진다.** 공통 fetch wrapper가 모든 AbortError를 무조건 무시하면 실제로 잘못된 취소가 발생하는지 모른다. 최소한 개발 환경 로그나 카운터는 남기는 편이 좋다.

## 오늘 바로 적용해보기

먼저 서비스에서 “사용자가 더 이상 결과를 원하지 않는 요청”을 찾아보자. 검색, 필터, 자동 저장, 미리보기, 업로드, 채팅 스트리밍, 대시보드 새로고침이 대표적이다. 이 기능들에 취소 조건이 명시되어 있는지 확인한다. 코드에 `fetch`는 많은데 `signal`이 거의 없다면 개선 여지가 크다.

둘째, 공통 HTTP 클라이언트에 `signal` 옵션을 통과시키자. 래퍼 함수가 `fetch`나 라이브러리 호출을 감싸면서 `signal`을 버리면 상위 컴포넌트가 취소를 설계해도 효과가 없다. `api.get("/items", { signal })`처럼 호출자가 생명주기를 전달할 수 있어야 한다.

셋째, 타임아웃을 명시적으로 만들자. 무한히 기다리는 요청은 장애 상황에서 사용자 경험을 망친다. `AbortSignal.timeout()`을 지원하는 환경이라면 이를 쓰고, 아니면 컨트롤러와 `setTimeout`을 조합한다. 중요한 것은 타임아웃 후 타이머를 정리하고, 에러 메시지를 네트워크 장애와 구분하는 것이다.

넷째, 코드 리뷰 질문에 “이 비동기 작업은 어떻게 취소되는가?”를 넣자. 시작 조건만 있고 종료 조건이 없는 비동기 코드는 시간이 지나며 상태 경합과 자원 낭비를 만든다. 특히 React, Vue, Svelte 같은 UI 컴포넌트에서는 생명주기 종료와 요청 취소가 연결되어야 한다.

다섯째, 취소 지표를 운영 관점에서 보자. 자동완성처럼 취소가 정상인 기능에서는 취소율이 높아도 괜찮다. 반대로 결제 요청이나 배치 작업에서 취소가 많다면 사용자 흐름이나 성능 문제가 있을 수 있다. 취소를 장애와 분리하면 지표가 더 읽기 쉬워진다.

## 더 알아보기

- [MDN: AbortSignal](https://developer.mozilla.org/en-US/docs/Web/API/AbortSignal)
- [MDN: AbortController](https://developer.mozilla.org/en-US/docs/Web/API/AbortController)
- [MDN: Using the Fetch API](https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API/Using_Fetch)

## 오늘의 takeaway

비동기 작업은 시작할 수 있어야 할 뿐 아니라, 더 이상 필요 없을 때 정확히 멈출 수 있어야 한다.

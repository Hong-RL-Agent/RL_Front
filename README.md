# JWAS_FRONT

웹 애플리케이션 자율 탐색 및 버그 탐지를 위한 **Web GUI Fuzzing 데모 프론트엔드** 프로젝트입니다.  
사용자가 URL을 입력하면 모니터링 화면으로 이동하고, 에이전트가 실제 서비스를 탐색하는 것처럼 보이는 UI를 통해  
버그 탐지 흐름과 리포트 생성 과정을 시각적으로 보여주는 것을 목표로 합니다.

---

## 프로젝트 개요

이 프로젝트는 단순한 일반 웹사이트가 아니라,  
**AI/에이전트 기반 웹 자동 탐색 및 버그 탐지 시스템**을 시연하기 위한 프론트엔드 프로토타입입니다.

주요 목적은 다음과 같습니다.

- 실제 서비스처럼 보이는 UI 제공
- 에이전트가 탐색 중인 것처럼 보이는 모니터링 화면 구현
- 탐지된 이슈 및 상태 로그를 시각적으로 표현
- 최종적으로 레포트 화면까지 이어지는 흐름 제공
- 추후 Playwright / 백엔드 / RL 모델과 연동 가능한 구조로 확장

---

## 주요 기능

### 1. 메인 화면
- URL 입력 UI
- 탐색 시작 버튼
- 로그인 / 회원가입 페이지로 이동 가능

### 2. 로그인 / 회원가입 화면
- 사용자 인증 흐름을 위한 기본 페이지 구성
- 실제 서비스처럼 보이는 진입 흐름 제공

### 3. Live Monitor 화면
- 테스트 진행률 표시
- 현재 탐색 중인 페이지 상태 표시
- Action Logs 표시
- Live System Metrics 표시
- 버그 탐지 상태 시각화
- 레포트 생성 버튼 제공

### 4. Report 화면
- 탐지 결과 요약
- 에러/경고/로그 기반 결과 표시
- 추후 실제 분석 리포트와 연동 가능하도록 확장 가능한 구조

---

## 기술 스택

- **React**
- **TypeScript**
- **Vite**
- **CSS**
- **React Router DOM**

---

## 폴더 구조

```bash
JWAS_FRONT
├─ public
├─ src
│  ├─ assets
│  ├─ pages
│  │  ├─ Home.tsx
│  │  ├─ Login.tsx
│  │  ├─ Monitor.tsx
│  │  ├─ Report.tsx
│  │  └─ Signup.tsx
│  ├─ styles
│  │  ├─ home.css
│  │  ├─ login.css
│  │  ├─ monitor.css
│  │  ├─ report.css
│  │  └─ signup.css
│  ├─ App.css
│  ├─ App.tsx
│  ├─ index.css
│  └─ main.tsx
├─ .gitignore
├─ eslint.config.js
├─ index.html
├─ package-lock.json
└─ package.json

---

## 페이지 구성

페이지	설명
Home	URL 입력 및 서비스 시작 화면
Login	로그인 화면
Signup	회원가입 화면
Monitor	실시간 탐색/버그 탐지 모니터링 화면
Report	탐지 결과 리포트 화면
실행 방법
1. 프로젝트 클론
git clone https://github.com/사용자이름/JWAS_FRONT.git
cd JWAS_FRONT
2. 패키지 설치
npm install
3. 개발 서버 실행
npm run dev
4. 빌드
npm run build
개발 목표

이 프로젝트는 다음 방향으로 계속 확장할 예정입니다.

Playwright 기반 실제 웹 탐색 연동
AI / RL 모델과의 상호작용 연결
실시간 로그 데이터 반영
실제 콘솔 에러 / 네트워크 에러 / UI 오류 표시
자동 리포트 생성 기능 강화
더 자연스럽고 실제 서비스 같은 UX 개선
현재 상태

현재는 프론트엔드 프로토타입 단계이며,
모니터링 화면과 리포트 화면 중심으로 UI/UX를 지속적으로 개선 중입니다.

추후 백엔드 및 탐색 에이전트와 연동하여
단순 데모를 넘어 실제 웹 GUI 퍼징/버그 탐지 시나리오를 검증하는 방향으로 발전시킬 예정입니다.

향후 개선 예정
반응형 UI 개선
컴포넌트 분리 및 재사용성 향상
더 정교한 상태 관리 도입
실제 API 연동
에러 탐지 시나리오 다양화
README에 화면 예시 이미지 추가

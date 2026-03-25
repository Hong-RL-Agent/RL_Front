/*
  [추후 백엔드/API 연동 예정 영역]

  현재 Home 페이지는 사용자가 입력한 URL을 monitor 페이지로 단순 전달하는
  프론트엔드 프로토타입 단계입니다.

  추후에는 아래와 같은 흐름으로 백엔드와 연동할 예정입니다.

  1. 사용자가 테스트할 대상 URL 입력
  2. 프론트엔드에서 URL 형식 검증 및 필요한 옵션값 정리
  3. 백엔드에 테스트 시작 요청 API 호출
     - 예: POST /api/test/start
     - 요청 데이터: targetUrl, test option, user info(optional)
  4. 백엔드에서 테스트 세션 생성 후 sessionId 반환
  5. 프론트엔드는 반환받은 sessionId를 monitor 페이지로 전달
  6. monitor 페이지에서는 sessionId를 기반으로
     - 현재 진행률 조회
     - 실시간 로그 조회
     - 탐지 이슈 조회
     - 리포트 생성 요청
     등을 수행하게 됨

  즉, 현재의 navigate('/monitor') 로직은 임시 프로토타입이며,
  실제 구현 시에는 API 응답 결과를 받은 뒤 monitor 페이지로 이동하도록 변경될 예정입니다.
*/

import { Link, useNavigate } from 'react-router-dom'
import { useState } from 'react'
import type { FormEvent } from 'react'
import mainicon from '../assets/mainicon.png'
import '../styles/home.css'

function Home() {
  const [url, setUrl] = useState('')
  const navigate = useNavigate()

  /*
    [추후 백엔드/API 연동 예정]

    현재는 사용자가 입력한 URL을 monitor 페이지로 바로 전달하는
    프론트엔드 프로토타입 구조입니다.

    실제 연동 단계에서는 아래 흐름으로 확장 예정입니다.

    - URL 입력값 검증
    - 테스트 시작 API 호출
    - 백엔드에서 sessionId 또는 testId 발급
    - monitor 페이지로 세션 정보 전달
    - monitor 페이지에서 실시간 진행률, 로그, 이슈, 리포트 데이터를 조회

    즉, 현재 navigate('/monitor') 로직은 임시 흐름이며,
    이후에는 API 응답을 받은 뒤 이동하는 구조로 변경될 예정입니다.
  */
  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    // 입력값이 비어 있으면 진행하지 않음
    if (!url.trim()) return

    // TODO:
    // 1. URL 유효성 검사 추가
    // 2. 백엔드 테스트 시작 API 호출
    // 3. sessionId/testId 응답 수신
    // 4. monitor 페이지로 세션 정보와 함께 이동

    navigate('/monitor', {
      state: {
        targetUrl: url,
      },
    })
  }

  return (
    <div className="home">
      <header className="header">
        <button className="menu-button" aria-label="메뉴">
          <span />
          <span />
          <span />
        </button>

        <nav className="header-right">
          <Link to="/login" className="nav-link">
            로그인
          </Link>
          <Link to="/signup" className="nav-link nav-link-signup">
            회원가입
          </Link>
        </nav>
      </header>

      <main className="main">
        <section className="hero">
          <div className="hero-kicker">Website Testing Platform</div>

          <div className="hero-visual">
            <img src={mainicon} alt="메인 아이콘" className="main-icon" />
          </div>

          <div className="hero-copy">
            <h1 className="main-title">웹 테스트를 간결하게 시작하세요</h1>
            <p className="main-desc">
              URL 하나로 페이지 탐색부터 오류 확인, 리포트 생성까지 빠르게 진행할 수 있습니다.
            </p>
          </div>

          <form className="search-form" onSubmit={handleSubmit}>
            <div className="search-box">
              <div className="search-label">URL</div>
              <input
                type="text"
                placeholder="https://example.com"
                className="search-input"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
              />
            </div>

            <button type="submit" className="search-button">
              테스트 시작
            </button>
          </form>

          <div className="quick-links">
            <button
              type="button"
              className="quick-chip"
              onClick={() => setUrl('https://example.com')}
            >
              example.com
            </button>
            <button
              type="button"
              className="quick-chip"
              onClick={() => setUrl('https://github.com')}
            >
              github.com
            </button>
            <button
              type="button"
              className="quick-chip"
              onClick={() => setUrl('https://www.naver.com')}
            >
              naver.com
            </button>
          </div>

          <div className="feature-list">
            <div className="feature-item">
              <strong>실시간 로그 확인</strong>
              <span>탐색 과정을 바로 확인할 수 있습니다.</span>
            </div>
            <div className="feature-item">
              <strong>UI 오류 탐지</strong>
              <span>클릭, 렌더링, 콘솔 오류를 추적합니다.</span>
            </div>
            <div className="feature-item">
              <strong>리포트 자동 생성</strong>
              <span>결과를 정리해 테스트 문서로 남깁니다.</span>
            </div>
          </div>
        </section>
      </main>
    </div>
  )
}

export default Home
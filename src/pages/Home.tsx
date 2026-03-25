import { Link, useNavigate } from 'react-router-dom'
import { FormEvent, useState } from 'react'
import mainicon from '../assets/mainicon.png'
import '../styles/home.css'

function Home() {
  const [url, setUrl] = useState('')
  const navigate = useNavigate()

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    if (!url.trim()) return

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
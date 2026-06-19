import { Link, useNavigate } from 'react-router-dom'
import { useState } from 'react'
import type { FormEvent } from 'react'
import mainicon from '../assets/mainicon.png'
import { apiUrl } from '../lib/api'
import '../styles/home.css'

type StoredUser = {
  username: string
  role?: string
}

type StartTestResponse = {
  sessionId: string
  status: string
  error?: string
  message?: string
}

function getStoredUser(): StoredUser | null {
  const storedUser = localStorage.getItem('user')

  if (!storedUser) return null

  try {
    return JSON.parse(storedUser) as StoredUser
  } catch (error) {
    console.error('저장된 user 파싱 실패:', error)
    localStorage.removeItem('user')
    return null
  }
}

function isValidHttpUrl(value: string) {
  try {
    const url = new URL(value)
    return url.protocol === 'http:' || url.protocol === 'https:'
  } catch {
    return false
  }
}

function Home() {
  const [url, setUrl] = useState('')
  const [user, setUser] = useState<StoredUser | null>(() => getStoredUser())
  const [isStarting, setIsStarting] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const navigate = useNavigate()

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    const trimmedUrl = url.trim()

    if (!trimmedUrl) {
      setErrorMessage('테스트할 URL을 입력해주세요.')
      return
    }

    if (!isValidHttpUrl(trimmedUrl)) {
      setErrorMessage('http:// 또는 https:// 형식의 올바른 URL을 입력해주세요.')
      return
    }

    try {
      setIsStarting(true)
      setErrorMessage('')

      console.log('[HOME] 테스트 시작 요청')
      console.log('[HOME] targetUrl =', trimmedUrl)

      const response = await fetch(apiUrl('/api/test/start'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          targetUrl: trimmedUrl,
        }),
      })

      console.log('[HOME] /api/test/start status =', response.status)

      let data: StartTestResponse | null = null

      try {
        data = (await response.json()) as StartTestResponse
      } catch (jsonError) {
        console.error('[HOME] start 응답 JSON 파싱 실패:', jsonError)
      }

      if (!response.ok) {
        throw new Error(data?.message || data?.error || '테스트 시작에 실패했습니다.')
      }

      if (!data?.sessionId) {
        throw new Error('sessionId를 받지 못했습니다.')
      }

      console.log('[HOME] start response =', data)

      navigate('/monitor', {
        state: {
          targetUrl: trimmedUrl,
          sessionId: data.sessionId,
        },
      })
    } catch (error) {
      console.error('[HOME] 테스트 시작 오류:', error)
      setErrorMessage(
        error instanceof Error ? error.message : '테스트 시작 중 오류가 발생했습니다.'
      )
    } finally {
      setIsStarting(false)
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('user')
    setUser(null)
    navigate('/')
  }

  return (
    <div className="home">
      <header className="header">
        <button className="menu-button" aria-label="메뉴" type="button">
          <span />
          <span />
          <span />
        </button>

        <nav className="header-right">
          {user ? (
            <>
              <Link to="/mypage" className="nav-link">
                마이페이지
              </Link>
              <button type="button" className="nav-link nav-logout-button" onClick={handleLogout}>
                로그아웃
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="nav-link">
                로그인
              </Link>
              <Link to="/signup" className="nav-link nav-link-signup">
                회원가입
              </Link>
            </>
          )}
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
                placeholder="http://localhost:3000/"
                className="search-input"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                disabled={isStarting}
              />
            </div>

            <button type="submit" className="search-button" disabled={isStarting}>
              {isStarting ? '테스트 시작 중...' : '테스트 시작'}
            </button>
          </form>

          {errorMessage && (
            <p
              style={{
                marginTop: '12px',
                color: '#d93025',
                fontSize: '14px',
                fontWeight: 500,
              }}
            >
              {errorMessage}
            </p>
          )}

          <div className="quick-links">
            <button
              type="button"
              className="quick-chip"
              onClick={() => setUrl('http://localhost:3000/')}
              disabled={isStarting}
            >
              localhost:3000
            </button>
            <button
              type="button"
              className="quick-chip"
              onClick={() => setUrl('https://example.com')}
              disabled={isStarting}
            >
              example.com
            </button>
            <button
              type="button"
              className="quick-chip"
              onClick={() => setUrl('https://github.com')}
              disabled={isStarting}
            >
              github.com
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

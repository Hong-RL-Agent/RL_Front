/*
  [추후 백엔드/API 연동 예정]

  Monitor 페이지는 웹 테스트 실행 중 발생하는 상태를
  실시간으로 시각화하는 페이지입니다.

  현재는 UI 프로토타입 단계이기 때문에
  테스트 진행률, 로그, 탐지 이슈 등이 모두 mock 데이터로 구성되어 있습니다.

  실제 백엔드 연동 시 아래와 같은 흐름으로 동작할 예정입니다.

  1. Home 페이지에서 테스트 시작 요청
     POST /api/test/start

  2. 백엔드에서 테스트 세션 생성 후 sessionId 반환

  3. Monitor 페이지 진입 시 sessionId 기반으로
     테스트 상태 조회

     GET /api/test/{sessionId}/status

  4. 주기적으로 테스트 진행률 및 상태 업데이트

     GET /api/test/{sessionId}/progress

  5. 실시간 로그 스트리밍 또는 polling

     GET /api/test/{sessionId}/logs

  6. 탐지된 버그 / UI 오류 조회

     GET /api/test/{sessionId}/issues

  7. 테스트 종료 후 리포트 생성

     POST /api/test/{sessionId}/report

  현재 useEffect 내부의 setInterval 로직은
  실제 API polling 로직을 시뮬레이션하기 위한 코드입니다.
*/

import { useEffect, useMemo, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import '../styles/monitor.css'

type LogLabel = 'Navigate' | 'Action' | 'State' | 'Error' | 'Network'

type LiveLog = {
  time: string
  label: LogLabel
  message: string
}

type Issue = {
  id: number
  type: 'error' | 'warning'
  title: string
  detail: string
}

type FrameScene = 'home' | 'product' | 'cart' | 'checkout'

const sceneMeta: Record<
  FrameScene,
  {
    title: string
    subtitle: string
  }
> = {
  home: {
    title: 'Home',
    subtitle: '랜딩 페이지 요소 검사 중',
  },
  product: {
    title: 'Product Detail',
    subtitle: '상품 상세 페이지 렌더링 검사 중',
  },
  cart: {
    title: 'Cart',
    subtitle: '장바구니 상호작용 검사 중',
  },
  checkout: {
    title: 'Checkout',
    subtitle: '결제 흐름 및 CTA 클릭 검사 중',
  },
}

/*
  TODO:
  현재는 UI 테스트용 mock 로그 데이터입니다.

  실제 구현 시에는 백엔드 로그 API에서 데이터를 받아와
  탐색 로그를 표시할 예정입니다.

  API 예정:
  GET /api/test/{sessionId}/logs
*/
const stagedLogs: LiveLog[] = [
  { time: '10:23:45', label: 'Navigate', message: 'Navigated to /home' },
  { time: '10:23:47', label: 'Action', message: 'Clicked "Products" navigation link' },
  { time: '10:23:49', label: 'Navigate', message: 'Navigated to /products/wireless-headphones' },
  { time: '10:23:52', label: 'State', message: 'DOM updated - 24 new elements detected' },
  { time: '10:23:55', label: 'Action', message: 'Clicked "Add to Cart" button' },
  { time: '10:23:58', label: 'Navigate', message: 'Navigated to /cart' },
  { time: '10:24:02', label: 'Action', message: 'Clicked "Proceed to Payment" button' },
  { time: '10:24:04', label: 'Error', message: 'CTA button overlaps bottom element on mobile viewport' },
  { time: '10:24:06', label: 'Network', message: 'POST /api/report responded with 500' },
  { time: '10:24:09', label: 'State', message: 'Checkout DOM stabilized after retry' },
]

/*
  TODO:
  현재는 버그 탐지 UI를 보여주기 위한 mock 데이터입니다.

  실제 구현 시에는 백엔드 분석 결과를 기반으로
  탐지된 이슈 목록을 표시하게 됩니다.

  API 예정:
  GET /api/test/{sessionId}/issues
*/
const stagedIssues: Issue[] = [
  {
    id: 1,
    type: 'error',
    title: '결제 버튼 클릭 영역 충돌',
    detail: '모바일 뷰포트에서 하단 요소와 겹쳐 실제 클릭 좌표가 밀립니다.',
  },
  {
    id: 2,
    type: 'warning',
    title: 'price 값 undefined 감지',
    detail: '상품 가격 렌더링 중 일부 상태에서 undefined 접근이 발생합니다.',
  },
]

const frameSequence: FrameScene[] = ['home', 'product', 'cart', 'checkout', 'checkout', 'checkout']

function Monitor() {
  const location = useLocation()
  const navigate = useNavigate()

  const targetUrl =
    (location.state as { targetUrl?: string } | null)?.targetUrl || 'https://example.com'

  const [progress, setProgress] = useState(8)
  const [isStopped, setIsStopped] = useState(false)
  const [visibleLogCount, setVisibleLogCount] = useState(2)
  const [sceneIndex, setSceneIndex] = useState(0)
  const [elapsedSeconds, setElapsedSeconds] = useState(0)

  /*
    TODO:
    현재는 테스트 진행률을 시뮬레이션하기 위해
    setInterval을 사용하여 mock 데이터를 업데이트하고 있습니다.

    실제 구현 시에는 아래 방식으로 변경될 예정입니다.

    - API polling 방식
      GET /api/test/{sessionId}/progress

    또는

    - WebSocket 기반 실시간 업데이트

    이를 통해 테스트 진행률, 로그, 탐지 이슈 상태가
    실제 백엔드 데이터와 동기화됩니다.
  */
  useEffect(() => {
    if (isStopped || progress >= 100) return

    const timer = window.setInterval(() => {
      setElapsedSeconds((prev) => prev + 1)
      setProgress((prev) => Math.min(prev + Math.floor(Math.random() * 8 + 4), 100))
      setVisibleLogCount((prev) => Math.min(prev + 1, stagedLogs.length))
      setSceneIndex((prev) => Math.min(prev + 1, frameSequence.length - 1))
    }, 1800)

    return () => window.clearInterval(timer)
  }, [isStopped, progress])

  const visibleLogs = stagedLogs.slice(0, visibleLogCount)

  const visibleIssues = useMemo(() => {
    if (visibleLogCount >= 9) return stagedIssues
    if (visibleLogCount >= 8) return stagedIssues.slice(0, 1)
    return []
  }, [visibleLogCount])

  const currentScene = frameSequence[sceneIndex]
  const criticalCount = visibleIssues.filter((issue) => issue.type === 'error').length
  const warningCount = visibleIssues.filter((issue) => issue.type === 'warning').length

  const consoleErrorCount = visibleLogs.filter((log) => log.label === 'Error').length
  const failedRequestCount = visibleLogs.filter((log) => log.label === 'Network').length

  return (
    <div className="monitor-page">
      <header className="monitor-header">
        <button className="monitor-menu" aria-label="홈으로 이동" onClick={() => navigate('/')}>
          ☰
        </button>

        <strong className="monitor-brand">J.A.W.S</strong>
      </header>

      <main className="monitor-main">
        <div className="monitor-container">
          <section className="headline-row">
            <div className="headline-left">
              <h1 className="monitor-title">Live Monitor</h1>
              <p className="monitor-url">{targetUrl}</p>
            </div>

            <div className="headline-right">
              <div className="status-pill bug-pill">
                {criticalCount + warningCount > 0
                  ? `${criticalCount + warningCount} Bugs Detected`
                  : 'Scanning...'}
              </div>

              <button
                className="stop-button"
                onClick={() => setIsStopped(true)}
                disabled={isStopped}
              >
                {isStopped ? 'STOPPED' : 'X STOP'}
              </button>
            </div>
          </section>

          <section className="progress-section">
            <div className="progress-top">
              <div>
                <div className="progress-label">Test Progress</div>
                <div className="progress-sub">
                  {isStopped ? '테스트가 중지되었습니다.' : sceneMeta[currentScene].subtitle}
                </div>
              </div>
              <div className="progress-percent">{progress}%</div>
            </div>

            <div className="progress-bar">
              <div className="progress-fill" style={{ width: `${progress}%` }} />
            </div>
          </section>

          <section className="monitor-grid">
            <div className="left-column">
              <div className="preview-panel">
                <div className="preview-panel-head">
                  <div className="preview-meta">
                    <span className="preview-scene-title">{sceneMeta[currentScene].title}</span>
                    <span className={`live-badge ${isStopped ? 'paused' : ''}`}>
                      {isStopped ? 'Paused' : 'Live'}
                    </span>
                  </div>
                  <span className="preview-viewport">mobile viewport</span>
                </div>

                <div className="preview-browser-bar">
                  <div className="browser-dots">
                    <span className="dot red" />
                    <span className="dot yellow" />
                    <span className="dot green" />
                  </div>
                  <div className="browser-url">{targetUrl}</div>
                </div>

                <div className={`preview-stage scene-${currentScene}`}>
                  {!isStopped && <div className="scan-line" />}

                  <div className="preview-overlay-top">
                    <span className="frame-chip">{sceneMeta[currentScene].title}</span>
                    <span className="frame-chip subtle">{elapsedSeconds}s elapsed</span>
                  </div>

                  {currentScene === 'home' && (
                    <div className="mock-home">
                      <div className="mock-home-hero" />
                      <div className="mock-home-card-row">
                        <div className="mock-card" />
                        <div className="mock-card" />
                        <div className="mock-card" />
                      </div>
                      <div className="mock-home-footer-line" />
                    </div>
                  )}

                  {currentScene === 'product' && (
                    <div className="mock-product">
                      <div className="mock-product-gallery" />
                      <div className="mock-product-side">
                        <div className="mock-line wide" />
                        <div className="mock-line" />
                        <div className="mock-line short" />
                        <button className="mock-add-button">Add to Cart</button>
                      </div>
                    </div>
                  )}

                  {currentScene === 'cart' && (
                    <div className="mock-cart">
                      <h3>Your Cart</h3>
                      <div className="cart-demo-item">
                        <div className="thumb" />
                        <div className="cart-demo-info">
                          <strong>Wireless Headphones</strong>
                          <span>Quantity: 1</span>
                        </div>
                        <div className="cart-demo-price">$79.99</div>
                      </div>
                      <div className="cart-demo-summary" />
                    </div>
                  )}

                  {currentScene === 'checkout' && (
                    <div className="mock-checkout">
                      <div className="checkout-title-row">
                        <h3>Checkout</h3>
                        <span className="scan-chip">AI 탐색 중</span>
                      </div>

                      <div className="checkout-box">
                        <strong>Your Cart</strong>

                        <div className="checkout-item">
                          <div className="checkout-thumb" />
                          <div className="checkout-info">
                            <div className="checkout-name">Wireless Headphones</div>
                            <div className="checkout-qty">Quantity: 1</div>
                          </div>

                          <div className="checkout-badges">
                            {warningCount > 0 && (
                              <div className="inline-warning">price undefined</div>
                            )}
                            <div className="agent-pill">Analyzing</div>
                            <div className="checkout-price">$79.99</div>
                          </div>
                        </div>
                      </div>

                      <div className={`checkout-action-wrap ${criticalCount > 0 ? 'active' : ''}`}>
                        <button className="checkout-button">Proceed to Payment</button>
                        {criticalCount > 0 && <div className="issue-pin pin-critical">1</div>}
                      </div>

                      {criticalCount > 0 && (
                        <div className="checkout-error-note">
                          버튼 클릭 영역이 하단 요소와 겹쳐 오작동할 수 있습니다.
                        </div>
                      )}

                      {warningCount > 0 && <div className="issue-pin pin-warning">2</div>}
                    </div>
                  )}
                </div>
              </div>
            </div>

            <aside className="right-column">
              <div className="logs-panel">
                <h3 className="panel-heading">
                  <span className="panel-icon">🕘</span>
                  Action Logs
                </h3>

                <div className="logs-list">
                  {visibleLogs.map((log, index) => (
                    <div className="log-row" key={`${log.time}-${index}`}>
                      <div className="log-time">{log.time}</div>
                      <div className="log-main">
                        <strong className={`log-label ${log.label.toLowerCase()}`}>
                          [{log.label}]
                        </strong>
                        <div className="log-message">{log.message}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="metrics-panel">
                <h3 className="panel-heading">
                  <span className="panel-icon">📡</span>
                  Live System Metrics
                </h3>

                <div className="metric-box ok">
                  <span className="metric-icon">✓</span>
                  GET /api/products - 200 OK
                </div>

                <div className={`metric-box ${consoleErrorCount > 0 ? 'error' : 'neutral'}`}>
                  <span className="metric-icon">{consoleErrorCount > 0 ? '!' : '•'}</span>
                  {consoleErrorCount > 0
                    ? 'TypeError: Cannot read property "price"'
                    : 'Console runtime - no critical error yet'}
                </div>

                <div className={`metric-box ${failedRequestCount > 0 ? 'warn' : 'neutral'}`}>
                  <span className="metric-icon">{failedRequestCount > 0 ? '↗' : '…'}</span>
                  {failedRequestCount > 0
                    ? 'POST /api/report - 500 Internal Server Error'
                    : 'POST /api/report - pending'}
                </div>

                <button
                  className="report-button"
                  disabled={!isStopped && progress < 100}
                  onClick={() =>
                    navigate('/report', {
                      state: {
                        createdAt: '2026.03.18',
                        testId: '123456789',
                      },
                    })
                  }
                >
                  레포트 생성
                </button>
              </div>
            </aside>
          </section>
        </div>
      </main>
    </div>
  )
}

export default Monitor
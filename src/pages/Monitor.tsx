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

  3. Monitor 페이지 진입 시 sessionId 기반으로 테스트 상태 조회
     GET /api/test/{sessionId}/status

  4. 주기적으로 테스트 진행률 및 상태 업데이트
     GET /api/test/{sessionId}/progress

  5. 실시간 로그 스트리밍 또는 polling
     GET /api/test/{sessionId}/logs

  6. 탐지된 버그 / UI 오류 조회
     GET /api/test/{sessionId}/issues

  7. 테스트 종료 후 리포트 생성
     POST /api/test/{sessionId}/report

  8. 리포트 생성 완료 후 report 페이지로 이동
     또는 메일 발송 상태 표시
*/

import { useEffect, useMemo, useRef, useState } from 'react'
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
  const [showCompleteModal, setShowCompleteModal] = useState(false)
  const [hasCompleted, setHasCompleted] = useState(false)

  const progressRef = useRef(8)
  const hideModalTimerRef = useRef<number | null>(null)
  const navigateTimerRef = useRef<number | null>(null)
  const completionTriggeredRef = useRef(false)

  const isCompleted = hasCompleted || progress >= 100

  useEffect(() => {
    if (isStopped || isCompleted) return

    const timer = window.setInterval(() => {
      const nextProgress = Math.min(
        progressRef.current + Math.floor(Math.random() * 8 + 4),
        100
      )

      progressRef.current = nextProgress

      setElapsedSeconds((prev) => prev + 1)
      setProgress(nextProgress)

      if (nextProgress >= 100) {
        if (!completionTriggeredRef.current) {
          completionTriggeredRef.current = true
          setHasCompleted(true)
          setIsStopped(true)
          setVisibleLogCount(stagedLogs.length)
          setSceneIndex(frameSequence.length - 1)
          setShowCompleteModal(true)
        }
        return
      }

      setVisibleLogCount((prev) => Math.min(prev + 1, stagedLogs.length))
      setSceneIndex((prev) => Math.min(prev + 1, frameSequence.length - 1))
    }, 1800)

    return () => window.clearInterval(timer)
  }, [isStopped, isCompleted])

  useEffect(() => {
    if (!showCompleteModal) return

    hideModalTimerRef.current = window.setTimeout(() => {
      setShowCompleteModal(false)
    }, 2200)

    navigateTimerRef.current = window.setTimeout(() => {
      navigate('/report', {
        state: {
          createdAt: '2026.03.18',
          testId: '123456789',
          targetUrl,
          status: 'completed',
        },
      })
    }, 2600)

    return () => {
      if (hideModalTimerRef.current) {
        window.clearTimeout(hideModalTimerRef.current)
      }
    }
  }, [showCompleteModal, navigate, targetUrl])

  useEffect(() => {
    return () => {
      if (hideModalTimerRef.current) {
        window.clearTimeout(hideModalTimerRef.current)
      }
      if (navigateTimerRef.current) {
        window.clearTimeout(navigateTimerRef.current)
      }
    }
  }, [])

  const visibleLogs = stagedLogs.slice(0, visibleLogCount)

  const visibleIssues = useMemo(() => {
    if (visibleLogCount >= 9) return stagedIssues
    if (visibleLogCount >= 8) return stagedIssues.slice(0, 1)
    return []
  }, [visibleLogCount])

  const currentScene = frameSequence[sceneIndex]
  const criticalCount = visibleIssues.filter((issue) => issue.type === 'error').length
  const warningCount = visibleIssues.filter((issue) => issue.type === 'warning').length
  const totalIssueCount = criticalCount + warningCount

  const consoleErrorCount = visibleLogs.filter((log) => log.label === 'Error').length
  const failedRequestCount = visibleLogs.filter((log) => log.label === 'Network').length

  const handleStop = () => {
    if (isCompleted) return
    setIsStopped(true)
  }

  const handleRestart = () => {
    if (isCompleted) return
    progressRef.current = progress
    setIsStopped(false)
  }

  const handleGoReportNow = () => {
    if (hideModalTimerRef.current) {
      window.clearTimeout(hideModalTimerRef.current)
    }
    if (navigateTimerRef.current) {
      window.clearTimeout(navigateTimerRef.current)
    }

    setShowCompleteModal(false)

    navigate('/report', {
      state: {
        createdAt: '2026.03.18',
        testId: '123456789',
        targetUrl,
        status: 'completed',
      },
    })
  }

  return (
    <div className="monitor-page">
      {showCompleteModal && (
        <div className="completion-modal-backdrop">
          <div className="completion-modal">
            <div className="completion-modal-badge">Test Completed</div>
            <h2 className="completion-modal-title">웹 탐색이 완료되었습니다.</h2>
            <p className="completion-modal-desc">
              테스트가 정상적으로 종료되었습니다.
              <br />
              레포트는 등록된 메일로 전송될 예정이며, 잠시 후 결과 페이지로 이동합니다.
            </p>

            <button className="completion-modal-button" onClick={handleGoReportNow}>
              바로 레포트 보기
            </button>
          </div>
        </div>
      )}

      <header className="monitor-header">
        <button className="monitor-back" onClick={() => navigate(-1)}>
          <span className="monitor-back-arrow">←</span>
          <span>Back</span>
        </button>

        <strong className="monitor-brand">J.A.W.S</strong>
      </header>

      <main className="monitor-main">
        <div className="monitor-container">
          <section className="monitor-topbar">
            <div className="monitor-topbar-left">
              <p className="monitor-eyebrow">Live Test Session</p>
              <h1 className="monitor-title">Live Monitor</h1>
              <p className="monitor-url">{targetUrl}</p>
            </div>

            <div className="monitor-topbar-right">
              <div
                className={`top-status-chip ${
                  isCompleted ? 'completed' : totalIssueCount > 0 ? 'detected' : 'scanning'
                }`}
              >
                {isCompleted
                  ? 'Completed'
                  : totalIssueCount > 0
                    ? `${totalIssueCount} Bugs Detected`
                    : 'Scanning'}
              </div>

              {!isCompleted && !isStopped && (
                <button className="stop-button" onClick={handleStop}>
                  Stop Test
                </button>
              )}

              {!isCompleted && isStopped && (
                <button className="restart-button" onClick={handleRestart}>
                  Restart Test
                </button>
              )}

              {isCompleted && (
                <button className="restart-button done" onClick={handleGoReportNow}>
                  View Report
                </button>
              )}
            </div>
          </section>

          <section className="progress-section">
            <div className="progress-top">
              <div>
                <div className="progress-label">Test Progress</div>
                <div className="progress-sub">
                  {isCompleted
                    ? '탐색이 완료되었습니다.'
                    : isStopped
                      ? '테스트가 중지되었습니다.'
                      : sceneMeta[currentScene].subtitle}
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
              <div className="preview-shell">
                <div className="preview-shell-head">
                  <div className="preview-shell-title-wrap">
                    <div className="preview-shell-title-row">
                      <span className="preview-shell-title">Browser Session</span>
                      <span className={`live-badge ${isStopped ? 'paused' : ''}`}>
                        {isCompleted ? 'Completed' : isStopped ? 'Paused' : 'Live'}
                      </span>
                    </div>
                    <p className="preview-shell-sub">
                      추후 Playwright 실시간 탐색 화면이 이 영역에 연결됩니다.
                    </p>
                  </div>

                  <div className="preview-head-meta">
                    <span className="preview-meta-chip">{sceneMeta[currentScene].title}</span>
                    <span className="preview-meta-chip subtle">{elapsedSeconds}s elapsed</span>
                  </div>
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
                  {!isStopped && !isCompleted && <div className="scan-line" />}

                  <div className="preview-stage-inner">
                    <div className="preview-video-frame">
                      <div className="preview-video-overlay">
                        <div className="preview-video-label">Autonomous Web Exploration</div>
                        <div className="preview-video-status">
                          <span className="signal-dot" />
                          {isCompleted ? 'completed' : isStopped ? 'paused' : 'running'}
                        </div>
                      </div>

                      <div className="preview-video-body">
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
                              <span className="scan-chip">
                                {isCompleted ? '탐색 완료' : 'AI 탐색 중'}
                              </span>
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
                                  <div className="agent-pill">
                                    {isCompleted ? 'Done' : 'Analyzing'}
                                  </div>
                                  <div className="checkout-price">$79.99</div>
                                </div>
                              </div>
                            </div>

                            <div
                              className={`checkout-action-wrap ${criticalCount > 0 ? 'active' : ''}`}
                            >
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

                    <div className="preview-lower-info">
                      <div className="preview-mini-stat">
                        <span className="preview-mini-label">Viewport</span>
                        <strong>Mobile</strong>
                      </div>
                      <div className="preview-mini-stat">
                        <span className="preview-mini-label">Detected State</span>
                        <strong>{sceneMeta[currentScene].title}</strong>
                      </div>
                      <div className="preview-mini-stat">
                        <span className="preview-mini-label">Session Status</span>
                        <strong>{isCompleted ? 'Completed' : isStopped ? 'Paused' : 'Running'}</strong>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <aside className="right-column">
              <div className="side-panel">
                <section className="panel-section">
                  <div className="panel-section-head">
                    <h3 className="panel-heading">Action Logs</h3>
                    <span className="section-count">{visibleLogs.length}</span>
                  </div>

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
                </section>

                <section className="panel-section">
                  <div className="panel-section-head">
                    <h3 className="panel-heading">System Metrics</h3>
                  </div>

                  <div className="metric-list">
                    <div className="metric-box ok">
                      <span className="metric-dot" />
                      <div className="metric-content">
                        <strong>GET /api/products</strong>
                        <span>200 OK</span>
                      </div>
                    </div>

                    <div className={`metric-box ${consoleErrorCount > 0 ? 'error' : 'neutral'}`}>
                      <span className="metric-dot" />
                      <div className="metric-content">
                        <strong>Console Runtime</strong>
                        <span>
                          {consoleErrorCount > 0
                            ? 'TypeError: Cannot read property "price"'
                            : 'No critical error yet'}
                        </span>
                      </div>
                    </div>

                    <div className={`metric-box ${failedRequestCount > 0 ? 'warn' : 'neutral'}`}>
                      <span className="metric-dot" />
                      <div className="metric-content">
                        <strong>POST /api/report</strong>
                        <span>
                          {failedRequestCount > 0 ? '500 Internal Server Error' : 'Pending'}
                        </span>
                      </div>
                    </div>
                  </div>
                </section>

                <section className="panel-section issue-section">
                  <div className="panel-section-head">
                    <h3 className="panel-heading">Detected Issues</h3>
                    <span className="section-count">{visibleIssues.length}</span>
                  </div>

                  <div className="issue-list">
                    {visibleIssues.length === 0 ? (
                      <div className="empty-issue-box">아직 탐지된 이슈가 없습니다.</div>
                    ) : (
                      visibleIssues.map((issue) => (
                        <div
                          className={`issue-card ${issue.type === 'error' ? 'critical' : 'warning'}`}
                          key={issue.id}
                        >
                          <div className="issue-card-top">
                            <span className="issue-badge">
                              {issue.type === 'error' ? 'Critical' : 'Warning'}
                            </span>
                            <span className="issue-id">#{issue.id}</span>
                          </div>
                          <strong className="issue-title">{issue.title}</strong>
                          <p className="issue-detail">{issue.detail}</p>
                        </div>
                      ))
                    )}
                  </div>
                </section>
              </div>
            </aside>
          </section>
        </div>
      </main>
    </div>
  )
}

export default Monitor
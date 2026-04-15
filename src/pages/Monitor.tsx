//백엔드 프로토타입과 연결 테스트. 추후 백엔드 구축 후 백엔드와 연결 예정

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

type BackendEvent = {
  type: 'progress' | 'log' | 'issue' | 'status' | 'complete'
  label?: string
  message?: string
  progress?: number
  status?: 'running' | 'paused' | 'completed' | 'failed'
  issueType?: 'error' | 'warning'
}

type ReportState = {
  createdAt: string
  testId: string
  targetUrl: string
  status: string
  progress: number
  logs: LiveLog[]
  issues: Issue[]
  sessionStatus: 'running' | 'paused' | 'completed' | 'failed'
}

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

const frameSequence: FrameScene[] = ['home', 'product', 'cart', 'checkout']

function Monitor() {
  const location = useLocation()
  const navigate = useNavigate()

  const routeState = location.state as { targetUrl?: string; sessionId?: string } | null
  const targetUrl = routeState?.targetUrl || 'http://localhost:8080/'
  const sessionId = routeState?.sessionId || ''

  const [progress, setProgress] = useState(0)
  const [isStopped, setIsStopped] = useState(false)
  const [sceneIndex, setSceneIndex] = useState(0)
  const [elapsedSeconds, setElapsedSeconds] = useState(0)
  const [showCompleteModal, setShowCompleteModal] = useState(false)
  const [hasCompleted, setHasCompleted] = useState(false)
  const [liveLogs, setLiveLogs] = useState<LiveLog[]>([])
  const [liveIssues, setLiveIssues] = useState<Issue[]>([])
  const [sessionStatus, setSessionStatus] = useState<'running' | 'paused' | 'completed' | 'failed'>(
    'running'
  )

  const navigateTimerRef = useRef<number | null>(null)
  const elapsedTimerRef = useRef<number | null>(null)
  const eventSourceRef = useRef<EventSource | null>(null)
  const hasShownCompleteRef = useRef(false)

  const isCompleted = hasCompleted || progress >= 100 || sessionStatus === 'completed'

  useEffect(() => {
    if (isCompleted || isStopped) return

    elapsedTimerRef.current = window.setInterval(() => {
      setElapsedSeconds((prev) => prev + 1)
    }, 1000)

    return () => {
      if (elapsedTimerRef.current) {
        window.clearInterval(elapsedTimerRef.current)
      }
    }
  }, [isCompleted, isStopped])

  useEffect(() => {
    if (!sessionId) return

    const eventSource = new EventSource(`http://localhost:8081/api/test/${sessionId}/stream`)
    eventSourceRef.current = eventSource

    eventSource.onopen = () => {
      console.log('SSE connected')
    }

    eventSource.onerror = (error) => {
      console.error('SSE error:', error)
    }

    const handleIncoming = (raw: MessageEvent) => {
      try {
        const event: BackendEvent =
          typeof raw.data === 'string' ? JSON.parse(raw.data) : raw.data

        if (event.type === 'progress' && typeof event.progress === 'number') {
          const nextProgress = Math.max(0, Math.min(100, event.progress))
          setProgress(nextProgress)

          if (nextProgress >= 75) {
            setSceneIndex(3)
          } else if (nextProgress >= 50) {
            setSceneIndex(2)
          } else if (nextProgress >= 25) {
            setSceneIndex(1)
          } else {
            setSceneIndex(0)
          }
        }

        if (event.type === 'status') {
          if (event.status) {
            setSessionStatus(event.status)
          }

          if (event.status === 'completed' && !hasShownCompleteRef.current) {
            hasShownCompleteRef.current = true
            setHasCompleted(true)
            setIsStopped(true)
            setProgress(100)
            setShowCompleteModal(true)
          }

          if (event.status === 'failed') {
            setIsStopped(true)
          }
        }

        if (event.type === 'log') {
          const rawLabel = event.label || 'State'
          const mappedLabel: LogLabel =
            rawLabel === 'Action' ||
            rawLabel === 'State' ||
            rawLabel === 'Error' ||
            rawLabel === 'Network' ||
            rawLabel === 'Navigate'
              ? rawLabel
              : 'State'

          setLiveLogs((prev) => [
            ...prev,
            {
              time: new Date().toLocaleTimeString(),
              label: mappedLabel,
              message: event.message || '',
            },
          ])
        }

        if (event.type === 'issue') {
          const issueType = event.issueType === 'warning' ? 'warning' : 'error'

          setLiveIssues((prev) => [
            ...prev,
            {
              id: prev.length + 1,
              type: issueType,
              title: event.label || (issueType === 'warning' ? 'Warning' : 'Error'),
              detail: event.message || '',
            },
          ])

          if (event.label === 'Network') {
            setLiveLogs((prev) => [
              ...prev,
              {
                time: new Date().toLocaleTimeString(),
                label: 'Network',
                message: event.message || '',
              },
            ])
          } else if (event.label === 'Error') {
            setLiveLogs((prev) => [
              ...prev,
              {
                time: new Date().toLocaleTimeString(),
                label: 'Error',
                message: event.message || '',
              },
            ])
          }
        }

        if (event.type === 'complete' && !hasShownCompleteRef.current) {
          hasShownCompleteRef.current = true
          setHasCompleted(true)
          setIsStopped(true)
          setSessionStatus('completed')
          setProgress(100)
          setShowCompleteModal(true)
          eventSource.close()
        }
      } catch (error) {
        console.error('SSE parse error:', error, raw.data)
      }
    }

    eventSource.addEventListener('log', handleIncoming as EventListener)
    eventSource.addEventListener('issue', handleIncoming as EventListener)
    eventSource.addEventListener('progress', handleIncoming as EventListener)
    eventSource.addEventListener('status', handleIncoming as EventListener)
    eventSource.addEventListener('complete', handleIncoming as EventListener)

    return () => {
      eventSource.close()
    }
  }, [sessionId])

  const buildReportState = (): ReportState => ({
    createdAt: new Date().toLocaleDateString('ko-KR'),
    testId: sessionId,
    targetUrl,
    status: 'completed',
    progress,
    logs: liveLogs,
    issues: liveIssues,
    sessionStatus,
  })

  useEffect(() => {
    if (!showCompleteModal) return

    navigateTimerRef.current = window.setTimeout(() => {
      setShowCompleteModal(false)

      navigate('/report', {
        state: buildReportState(),
      })
    }, 2600)

    return () => {
      if (navigateTimerRef.current) {
        window.clearTimeout(navigateTimerRef.current)
      }
    }
  }, [showCompleteModal, navigate, progress, liveLogs, liveIssues, sessionId, sessionStatus, targetUrl])

  useEffect(() => {
    return () => {
      if (navigateTimerRef.current) {
        window.clearTimeout(navigateTimerRef.current)
      }
      if (elapsedTimerRef.current) {
        window.clearTimeout(elapsedTimerRef.current)
      }
      if (eventSourceRef.current) {
        eventSourceRef.current.close()
      }
    }
  }, [])

  const visibleLogs = liveLogs
  const visibleIssues = liveIssues

  const currentScene = frameSequence[Math.min(sceneIndex, frameSequence.length - 1)]
  const criticalCount = visibleIssues.filter((issue) => issue.type === 'error').length
  const warningCount = visibleIssues.filter((issue) => issue.type === 'warning').length
  const totalIssueCount = criticalCount + warningCount

  const consoleErrorCount = visibleLogs.filter((log) => log.label === 'Error').length
  const failedRequestCount = visibleLogs.filter((log) => log.label === 'Network').length

  const handleStop = () => {
    if (isCompleted) return
    setIsStopped(true)
    setSessionStatus('paused')
  }

  const handleRestart = () => {
    if (isCompleted) return
    setIsStopped(false)
    setSessionStatus('running')
  }

  const handleGoReportNow = () => {
    if (navigateTimerRef.current) {
      window.clearTimeout(navigateTimerRef.current)
    }

    setShowCompleteModal(false)

    navigate('/report', {
      state: buildReportState(),
    })
  }

  const progressSubtitle = useMemo(() => {
    if (isCompleted) return '탐색이 완료되었습니다.'
    if (isStopped) return '테스트가 중지되었습니다.'
    return sceneMeta[currentScene].subtitle
  }, [isCompleted, isStopped, currentScene])

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
                    : sessionStatus === 'paused'
                      ? 'Paused'
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
                <div className="progress-sub">{progressSubtitle}</div>
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
                                    <div className="inline-warning">warning detected</div>
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
                    {visibleLogs.length === 0 ? (
                      <div className="empty-issue-box">아직 수신된 로그가 없습니다.</div>
                    ) : (
                      visibleLogs.map((log, index) => (
                        <div className="log-row" key={`${log.time}-${index}`}>
                          <div className="log-time">{log.time}</div>
                          <div className="log-main">
                            <strong className={`log-label ${log.label.toLowerCase()}`}>
                              [{log.label}]
                            </strong>
                            <div className="log-message">{log.message}</div>
                          </div>
                        </div>
                      ))
                    )}
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
                        <strong>Session</strong>
                        <span>{sessionStatus}</span>
                      </div>
                    </div>

                    <div className={`metric-box ${consoleErrorCount > 0 ? 'error' : 'neutral'}`}>
                      <span className="metric-dot" />
                      <div className="metric-content">
                        <strong>Console Runtime</strong>
                        <span>
                          {consoleErrorCount > 0
                            ? `${consoleErrorCount} error event(s) detected`
                            : 'No critical error yet'}
                        </span>
                      </div>
                    </div>

                    <div className={`metric-box ${failedRequestCount > 0 ? 'warn' : 'neutral'}`}>
                      <span className="metric-dot" />
                      <div className="metric-content">
                        <strong>Network Failures</strong>
                        <span>
                          {failedRequestCount > 0
                            ? `${failedRequestCount} request failure event(s)`
                            : 'Pending'}
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
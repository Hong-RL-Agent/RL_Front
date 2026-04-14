import { useLocation, useNavigate } from 'react-router-dom'
import html2pdf from 'html2pdf.js'
import '../styles/report.css'

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

type ReportState = {
  createdAt?: string
  testId?: string
  targetUrl?: string
  status?: string
  progress?: number
  logs?: LiveLog[]
  issues?: Issue[]
  sessionStatus?: 'running' | 'paused' | 'completed' | 'failed'
}

function Report() {
  const navigate = useNavigate()
  const location = useLocation()

  const reportData: ReportState = (location.state as ReportState | null) || {
    createdAt: '2026.03.18',
    testId: '123456789',
    targetUrl: 'http://localhost:8080/',
    status: 'completed',
    progress: 100,
    logs: [],
    issues: [],
    sessionStatus: 'completed',
  }

  const logs = reportData.logs || []
  const issues = reportData.issues || []

  const criticalIssues = issues.filter((issue) => issue.type === 'error')
  const warningIssues = issues.filter((issue) => issue.type === 'warning')
  const successRequestCount = Math.max(
    logs.filter((log) => log.label === 'Navigate' || log.label === 'Action').length -
      logs.filter((log) => log.label === 'Network').length,
    0
  )

  const summaryCards = [
    { label: '총 탐색 로그', value: String(logs.length).padStart(2, '0'), tone: 'neutral' },
    {
      label: '탐지된 치명 이슈',
      value: String(criticalIssues.length).padStart(2, '0'),
      tone: 'danger',
    },
    {
      label: '경고 이슈',
      value: String(warningIssues.length).padStart(2, '0'),
      tone: 'warning',
    },
    {
      label: '성공 액션 수',
      value: String(successRequestCount).padStart(2, '0'),
      tone: 'success',
    },
  ]

  const issueList = issues.map((issue) => ({
    level: issue.type === 'error' ? 'Critical' : 'Warning',
    title: issue.title,
    description: issue.detail,
    location: reportData.targetUrl || '-',
    impact: issue.type === 'error' ? '사용자 동작 실패 가능성' : '잠재 오류 가능성',
  }))

  const actionLogs = logs.map((log) => `[${log.label}] ${log.message}`)

  const consoleErrorCount = logs.filter((log) => log.label === 'Error').length
  const networkFailureCount = logs.filter((log) => log.label === 'Network').length

  const riskScore = Math.max(
    100 - criticalIssues.length * 20 - warningIssues.length * 8 - networkFailureCount * 5,
    0
  )

  const handleExportPDF = () => {
    const element = document.querySelector<HTMLElement>('.report-main')
    if (!element) return

    const opt = {
      margin: 0.5,
      filename: `report_${reportData.testId}.pdf`,
      image: { type: 'jpeg' as const, quality: 0.98 },
      html2canvas: { scale: 2 },
      jsPDF: { unit: 'in', format: 'a4', orientation: 'portrait' as const },
    }

    html2pdf().set(opt).from(element).save()
  }

  return (
    <div className="report-page">
      <header className="report-header">
        <button
          className="report-menu-button"
          aria-label="뒤로가기"
          onClick={() => navigate('/monitor')}
        >
          ☰
        </button>

        <div className="report-brand">J.A.W.S</div>
      </header>

      <main className="report-main">
        <section className="report-title-row">
          <div className="report-title-wrap">
            <h1 className="report-title">Bug Analysis Report</h1>
            <p className="report-subtitle">
              {reportData.createdAt} 생성됨 · Test ID {reportData.testId}
            </p>
            <p className="report-subtitle">
              대상 URL: {reportData.targetUrl} · 상태: {reportData.sessionStatus}
            </p>
          </div>

          <div className="report-title-actions">
            <button className="export-button" onClick={handleExportPDF}>
              Export PDF
            </button>
          </div>
        </section>

        <section className="report-summary-grid">
          {summaryCards.map((card) => (
            <article key={card.label} className={`summary-card ${card.tone}`}>
              <span className="summary-label">{card.label}</span>
              <strong className="summary-value">{card.value}</strong>
            </article>
          ))}
        </section>

        <section className="report-overview-grid">
          <article className="report-panel overview-panel">
            <div className="panel-top">
              <div>
                <h2 className="panel-title">Executive Summary</h2>
                <p className="panel-desc">이번 테스트 세션의 핵심 결과 요약</p>
              </div>
              <span className="panel-badge">
                {reportData.sessionStatus === 'completed' ? 'Completed' : reportData.sessionStatus}
              </span>
            </div>

            <div className="overview-body">
              <p className="overview-text">
                이번 테스트 세션에서는 <strong>{reportData.targetUrl}</strong> 를 기준으로 자동 탐색을
                수행했습니다. 총 <strong>{logs.length}개의 로그</strong>가 수집되었고,
                <strong> 치명 이슈 {criticalIssues.length}건</strong>,
                <strong> 경고 이슈 {warningIssues.length}건</strong>이 탐지되었습니다.
              </p>

              <div className="overview-points">
                <div className="overview-point">
                  <span className="point-dot success" />
                  총 액션/이동 로그 {successRequestCount}건 수집
                </div>
                <div className="overview-point">
                  <span className="point-dot danger" />
                  치명 이슈 {criticalIssues.length}건 탐지
                </div>
                <div className="overview-point">
                  <span className="point-dot warning" />
                  경고 이슈 {warningIssues.length}건 탐지
                </div>
              </div>
            </div>
          </article>

          <article className="report-panel score-panel">
            <h2 className="panel-title">Risk Score</h2>
            <p className="panel-desc">현재 테스트 기준 종합 안정성 지표</p>

            <div className="score-ring-wrap">
              <div className="score-ring">
                <div className="score-ring-inner">
                  <strong>{riskScore}</strong>
                  <span>/ 100</span>
                </div>
              </div>
            </div>

            <div className="score-meta">
              <div className="score-row">
                <span>UI 안정성</span>
                <strong>{Math.max(100 - criticalIssues.length * 20, 0)}</strong>
              </div>
              <div className="score-row">
                <span>네트워크 응답성</span>
                <strong>{Math.max(100 - networkFailureCount * 10, 0)}</strong>
              </div>
              <div className="score-row">
                <span>런타임 안전성</span>
                <strong>{Math.max(100 - consoleErrorCount * 10, 0)}</strong>
              </div>
            </div>
          </article>
        </section>

        <section className="report-content-grid">
          <article className="report-panel issues-panel">
            <div className="panel-top">
              <div>
                <h2 className="panel-title">Detected Issues</h2>
                <p className="panel-desc">탐지된 주요 이슈 상세</p>
              </div>
              <span className="panel-count">{issueList.length} items</span>
            </div>

            <div className="issues-list">
              {issueList.length === 0 ? (
                <div className="issue-card">
                  <h3 className="issue-title">탐지된 이슈가 없습니다.</h3>
                  <p className="issue-description">이번 세션에서는 별도 오류가 보고되지 않았습니다.</p>
                </div>
              ) : (
                issueList.map((issue, index) => (
                  <div className="issue-card" key={`${issue.title}-${index}`}>
                    <div className="issue-card-top">
                      <span
                        className={`issue-level ${
                          issue.level === 'Critical' ? 'critical' : 'warning'
                        }`}
                      >
                        {issue.level}
                      </span>
                      <span className="issue-location">{issue.location}</span>
                    </div>

                    <h3 className="issue-title">{issue.title}</h3>
                    <p className="issue-description">{issue.description}</p>

                    <div className="issue-impact-row">
                      <span className="issue-impact-label">영향도</span>
                      <strong className="issue-impact-value">{issue.impact}</strong>
                    </div>
                  </div>
                ))
              )}
            </div>
          </article>

          <aside className="report-side-stack">
            <article className="report-panel metrics-panel">
              <h2 className="panel-title">System Metrics</h2>
              <p className="panel-desc">세션 중 수집된 핵심 상태</p>

              <div className="metric-item ok">
                <span className="metric-mark">✓</span>
                Session Status - {reportData.sessionStatus}
              </div>
              <div className="metric-item warn">
                <span className="metric-mark">!</span>
                Console Error Count - {consoleErrorCount}
              </div>
              <div className="metric-item danger">
                <span className="metric-mark">↗</span>
                Network Failure Count - {networkFailureCount}
              </div>
            </article>

            <article className="report-panel logs-panel">
              <h2 className="panel-title">Action Timeline</h2>
              <p className="panel-desc">탐색 흐름 로그 요약</p>

              <div className="timeline-list">
                {actionLogs.length === 0 ? (
                  <div className="timeline-item">
                    <span className="timeline-index">-</span>
                    <p className="timeline-text">수집된 로그가 없습니다.</p>
                  </div>
                ) : (
                  actionLogs.map((log, index) => (
                    <div className="timeline-item" key={`${log}-${index}`}>
                      <span className="timeline-index">{index + 1}</span>
                      <p className="timeline-text">{log}</p>
                    </div>
                  ))
                )}
              </div>
            </article>
          </aside>
        </section>
      </main>
    </div>
  )
}

export default Report
import { useLocation, useNavigate } from 'react-router-dom'
import html2pdf from 'html2pdf.js'
import '../styles/report.css'

type LogLabel = 'Navigate' | 'Action' | 'State' | 'Error' | 'Network' | 'DOM' | 'Console'

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

type StateCheck = {
  key: string
  label: string
  passed: boolean
  expected: string
  evidence: string
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

  startedAt?: string
  endedAt?: string
  durationMs?: number
  visitedPageCount?: number
  totalActionCount?: number
  successfulActionCount?: number
  failedActionCount?: number
  stateChecks?: StateCheck[]
  recommendations?: string[]
}

function formatDuration(durationMs?: number) {
  if (!durationMs && durationMs !== 0) return '-'
  if (durationMs < 1000) return `${durationMs}ms`

  const totalSeconds = Math.floor(durationMs / 1000)
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60

  if (minutes === 0) return `${seconds}s`
  return `${minutes}m ${seconds}s`
}

function formatShortDate(value?: string) {
  if (!value) return '-'

  if (value.includes('.')) return value

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value

  return date.toLocaleDateString('ko-KR')
}

function hasAny(logs: LiveLog[], patterns: RegExp[]) {
  return logs.some((log) => patterns.some((pattern) => pattern.test(log.message)))
}

function displayLogLabel(label: LogLabel) {
  if (label === 'Action') return '동작'
  if (label === 'Navigate') return '이동'
  if (label === 'State' || label === 'DOM') return '상태'
  if (label === 'Error' || label === 'Console') return '문제'
  if (label === 'Network') return '네트워크'
  return label
}

function Report() {
  const navigate = useNavigate()
  const location = useLocation()

  const reportData: ReportState = (location.state as ReportState | null) || {
    createdAt: '2026.03.18',
    testId: '123456789',
    targetUrl: '',
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

  const consoleErrorCount = logs.filter((log) => log.label === 'Error' || log.label === 'Console').length
  const networkFailureCount = logs.filter((log) => log.label === 'Network').length
  const stateLogCount = logs.filter((log) => log.label === 'State' || log.label === 'DOM').length

  const loadingIssueCount = logs.filter((log) =>
    /loading|timeout|stuck|infinite|무한|로딩|멈춤/i.test(log.message)
  ).length

  const actionLogCount = logs.filter((log) => log.label === 'Navigate' || log.label === 'Action').length
  const loginAttempted = hasAny(logs, [/로그인/, /login/i, /ingresar/i])
  const loginSucceeded =
    loginAttempted &&
    (hasAny(logs, [/search/i, /dashboard/i, /관리/, /메뉴/, /admin/i]) ||
      logs.some((log) => /로그인/.test(log.message) && /눈에 띄는 문제는 없었습니다/.test(log.message)))
  const signupAttempted = hasAny(logs, [/회원가입/, /sign up/i, /signup/i, /register/i])
  const signupSucceeded =
    signupAttempted &&
    logs.some((log) => /(회원가입|sign up|signup|register)/i.test(log.message) && /눈에 띄는 문제는 없었습니다/.test(log.message))

  const successRequestCount = Math.max(
    reportData.successfulActionCount ?? actionLogCount - networkFailureCount,
    0
  )

  const totalActionCount = reportData.totalActionCount ?? actionLogCount
  const failedActionCount = reportData.failedActionCount ?? criticalIssues.length + networkFailureCount

  const derivedStateChecks: StateCheck[] = [
    {
      key: 'DOM_CHANGED',
      label: 'DOM 상태 변화 감지',
      passed: stateLogCount > 0 || successRequestCount > 0,
      expected: '사용자 액션 이후 DOM 또는 상태 변화가 기록되어야 함',
      evidence:
        stateLogCount > 0
          ? `State/DOM 로그 ${stateLogCount}건 수집`
          : successRequestCount > 0
            ? `성공 액션 ${successRequestCount}건 기반 상태 변화 가능성 확인`
            : '상태 변화 로그 없음',
    },
    {
      key: 'NO_CONSOLE_ERROR',
      label: '콘솔 런타임 오류 없음',
      passed: consoleErrorCount === 0,
      expected: 'Console Error 또는 Runtime Error가 발생하지 않아야 함',
      evidence: `Console Error ${consoleErrorCount}건`,
    },
    {
      key: 'NETWORK_STABLE',
      label: '네트워크 요청 정상 종료',
      passed: networkFailureCount === 0,
      expected: '요청 실패, 4xx/5xx, 타임아웃이 없어야 함',
      evidence: `Network Failure ${networkFailureCount}건`,
    },
    {
      key: 'NO_INFINITE_LOADING',
      label: '로딩 상태 정지 없음',
      passed: loadingIssueCount === 0,
      expected: '로딩 UI가 멈추거나 무한 대기 상태로 남지 않아야 함',
      evidence: `Loading/Timeout 의심 로그 ${loadingIssueCount}건`,
    },
  ]

  const stateChecks = reportData.stateChecks?.length ? reportData.stateChecks : derivedStateChecks
  const failedStateChecks = stateChecks.filter((check) => !check.passed)

  const stateSignature = stateChecks
    .map((check) => `${check.key}:${check.passed ? 'T' : 'F'}`)
    .join(' / ')

  const stateDecision =
    criticalIssues.length > 0 || failedStateChecks.length > 0
      ? 'Fail'
      : warningIssues.length > 0
        ? 'Warning'
        : 'Pass'

  const riskScore = Math.max(
    100 -
      criticalIssues.length * 20 -
      warningIssues.length * 8 -
      networkFailureCount * 5 -
      loadingIssueCount * 7,
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
    recommendation:
      issue.type === 'error'
        ? '오류 직후 DOM 변화, 콘솔 로그, 네트워크 응답을 함께 확인해야 합니다.'
        : '동일 액션을 반복 실행해 재현 가능성과 발생 조건을 추가 확인하는 것이 좋습니다.',
  }))

  const recommendations =
    reportData.recommendations?.length
      ? reportData.recommendations
      : [
          '오류가 발생한 액션 직후의 DOM snapshot을 저장하여 상태 변화 기준을 명확히 분리합니다.',
          'Network Failure와 Console Error를 단독 로그가 아니라 직전 사용자 행동과 연결해 분석합니다.',
          'T/F 상태 조합이 F로 바뀐 항목은 재현 테스트 대상으로 우선 분류합니다.',
        ]

  const milestoneCards = [
    {
      title: '로그인 플로우',
      status: loginSucceeded ? '성공' : loginAttempted ? '확인 필요' : '미시도',
      detail: loginSucceeded
        ? '로그인 입력과 버튼 동작 후 내부 화면으로 이동한 흐름이 확인됐습니다.'
        : loginAttempted
          ? '로그인은 시도됐지만 성공 화면 전환 근거가 충분하지 않습니다.'
          : '이번 탐색에서는 로그인 플로우가 실행되지 않았습니다.',
      tone: loginSucceeded ? 'ok' : loginAttempted ? 'warn' : 'neutral',
    },
    {
      title: '회원가입 플로우',
      status: signupSucceeded ? '성공' : signupAttempted ? '확인 필요' : '미발견',
      detail: signupSucceeded
        ? '회원가입 관련 동작이 정상 완료된 흐름이 확인됐습니다.'
        : signupAttempted
          ? '회원가입은 시도됐지만 완료 여부를 추가 확인해야 합니다.'
          : '대상 사이트에서 회원가입 진입점이 탐색되지 않았습니다.',
      tone: signupSucceeded ? 'ok' : signupAttempted ? 'warn' : 'neutral',
    },
    {
      title: '핵심 화면 진입',
      status: loginSucceeded || successRequestCount > 0 ? '진행됨' : '부족',
      detail:
        loginSucceeded || successRequestCount > 0
          ? '사용자 액션 이후 다음 화면 또는 입력 가능한 화면이 이어서 탐색됐습니다.'
          : '핵심 화면으로 이어지는 성공 흐름이 부족합니다.',
      tone: loginSucceeded || successRequestCount > 0 ? 'ok' : 'warn',
    },
  ]

  const backendChecks = [
    {
      title: 'Frontend to Backend API',
      status: reportData.sessionStatus === 'completed' ? '정상' : '확인 필요',
      detail: `세션 ${reportData.testId || '-'} 상태가 ${reportData.sessionStatus || reportData.status || '-'}로 전달됐습니다.`,
      tone: reportData.sessionStatus === 'completed' ? 'ok' : 'warn',
    },
    {
      title: 'Network Requests',
      status: networkFailureCount === 0 ? '정상' : '문제 감지',
      detail:
        networkFailureCount === 0
          ? '자동 탐색 중 네트워크 실패 이벤트가 보고되지 않았습니다.'
          : `네트워크 실패로 분류된 이벤트가 ${networkFailureCount}건 있습니다.`,
      tone: networkFailureCount === 0 ? 'ok' : 'warn',
    },
    {
      title: 'Database / Evidence Storage',
      status: logs.length > 0 ? '저장됨' : '확인 필요',
      detail:
        logs.length > 0
          ? `세션 로그 ${logs.length}건이 리포트에 전달됐고, 원본 tick 데이터는 관리자 페이지에서 추적할 수 있습니다.`
          : '저장된 로그 근거가 부족합니다.',
      tone: logs.length > 0 ? 'ok' : 'warn',
    },
  ]

  const handleExportPDF = () => {
    const element = document.querySelector<HTMLElement>('.report-main')
    if (!element) return

    element.classList.add('exporting')

    const opt = {
      margin: 0.5,
      filename: `report_${reportData.testId || 'scan'}.pdf`,
      image: { type: 'jpeg' as const, quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true },
      jsPDF: { unit: 'in', format: 'a4', orientation: 'portrait' as const },
    }

    html2pdf()
      .set(opt)
      .from(element)
      .save()
      .finally(() => {
        element.classList.remove('exporting')
      })
  }

  return (
    <div className="report-page">
      <header className="report-header">
        <button
          className="report-menu-button"
          aria-label="처음으로 돌아가기"
          title="처음으로 돌아가기"
          onClick={() => navigate('/', { replace: true })}
        >
          🏠
        </button>

        <div className="report-brand">J.A.W.S</div>
      </header>

      <main className="report-main">
        <section className="report-title-row">
          <div className="report-title-wrap">
            <h1 className="report-title">Bug Analysis Report</h1>
            <p className="report-subtitle">
              {formatShortDate(reportData.createdAt)} 생성됨 · Test ID {reportData.testId || '-'}
            </p>
            <p className="report-subtitle">
              대상 URL: {reportData.targetUrl || '-'} · 상태:{' '}
              {reportData.sessionStatus || reportData.status || '-'}
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
              <span className={`panel-badge ${stateDecision === 'Fail' ? 'is-danger' : ''}`}>
                {stateDecision}
              </span>
            </div>

            <div className="overview-body">
              <p className="overview-text">
                이번 테스트 세션에서는 <strong>{reportData.targetUrl || '대상 URL'}</strong> 를
                기준으로 자동 탐색을 수행했습니다. 단순히 오류 로그만 수집하는 방식이 아니라,
                <strong> 액션 이후 DOM 상태 변화</strong>, <strong> 네트워크 응답</strong>,
                <strong> 콘솔 오류</strong>, <strong> 로딩 지속 여부</strong>를 함께 확인해 T/F
                상태 조합으로 오류 여부를 판단했습니다.
              </p>

              <div className="overview-points">
                <div className="overview-point">
                  <span className="point-dot success" />
                  총 액션/이동 로그 {successRequestCount}건 수집
                </div>
                <div className="overview-point">
                  <span className="point-dot danger" />
                  치명 이슈 {criticalIssues.length}건 · 실패 상태 조건 {failedStateChecks.length}건
                </div>
                <div className="overview-point">
                  <span className="point-dot warning" />
                  상태 조합: {stateSignature || '-'}
                </div>
              </div>
            </div>
          </article>

          <article className="report-panel score-panel">
            <h2 className="panel-title">Risk Score</h2>
            <p className="panel-desc">현재 테스트 기준 종합 안정성 지표</p>

            <div className="score-ring-wrap">
              <div
                className="score-ring"
                style={{
                  background: `conic-gradient(#243247 0 ${riskScore}%, #e9edf3 ${riskScore}% 100%)`,
                }}
              >
                <div className="score-ring-inner">
                  <strong>{riskScore}</strong>
                  <span>/ 100</span>
                </div>
              </div>
            </div>

            <div className="score-meta">
              <div className="score-row">
                <span>UI/DOM 안정성</span>
                <strong>{Math.max(100 - failedStateChecks.length * 15, 0)}</strong>
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

        <section className="report-panel scan-panel">
          <div className="panel-top">
            <div>
              <h2 className="panel-title">Scan Overview</h2>
              <p className="panel-desc">report-scan 결과를 화면 보고용으로 정리한 영역</p>
            </div>
            <span className="panel-count">DOM-based</span>
          </div>

          <div className="scan-info-grid">
            <div className="scan-info-card">
              <span>시작 시간</span>
              <strong>{formatShortDate(reportData.startedAt || reportData.createdAt)}</strong>
            </div>
            <div className="scan-info-card">
              <span>종료 시간</span>
              <strong>{formatShortDate(reportData.endedAt)}</strong>
            </div>
            <div className="scan-info-card">
              <span>소요 시간</span>
              <strong>{formatDuration(reportData.durationMs)}</strong>
            </div>
            <div className="scan-info-card">
              <span>방문 페이지</span>
              <strong>{reportData.visitedPageCount ?? '-'}</strong>
            </div>
            <div className="scan-info-card">
              <span>총 액션</span>
              <strong>{totalActionCount}</strong>
            </div>
            <div className="scan-info-card">
              <span>실패 액션</span>
              <strong>{failedActionCount}</strong>
            </div>
          </div>
        </section>

        <section className="report-content-grid report-flow-grid">
          <article className="report-panel">
            <div className="panel-top">
              <div>
                <h2 className="panel-title">User Flow Results</h2>
                <p className="panel-desc">로그인, 회원가입, 핵심 화면 진입 여부를 사용자 관점으로 요약</p>
              </div>
              <span className="panel-count">{milestoneCards.length} checks</span>
            </div>

            <div className="flow-card-list">
              {milestoneCards.map((item) => (
                <div className={`flow-card ${item.tone}`} key={item.title}>
                  <div>
                    <span>{item.title}</span>
                    <strong>{item.status}</strong>
                  </div>
                  <p>{item.detail}</p>
                </div>
              ))}
            </div>
          </article>

          <article className="report-panel">
            <div className="panel-top">
              <div>
                <h2 className="panel-title">Backend / Data Checks</h2>
                <p className="panel-desc">API, 네트워크, DB 저장 경로의 상태 요약</p>
              </div>
              <span className="panel-count">{backendChecks.length} checks</span>
            </div>

            <div className="flow-card-list">
              {backendChecks.map((item) => (
                <div className={`flow-card ${item.tone}`} key={item.title}>
                  <div>
                    <span>{item.title}</span>
                    <strong>{item.status}</strong>
                  </div>
                  <p>{item.detail}</p>
                </div>
              ))}
            </div>
          </article>
        </section>

        <section className="report-content-grid report-content-grid-wide">
          <article className="report-panel state-panel">
            <div className="panel-top">
              <div>
                <h2 className="panel-title">DOM State Decision</h2>
                <p className="panel-desc">액션 이후 화면 반응을 T/F 조건으로 판정</p>
              </div>
              <span className={`panel-count decision-${stateDecision.toLowerCase()}`}>
                {stateDecision}
              </span>
            </div>

            <div className="state-table">
              <div className="state-table-head">
                <span>Check</span>
                <span>Result</span>
                <span>Expected</span>
                <span>Evidence</span>
              </div>

              {stateChecks.map((check) => (
                <div className="state-table-row" key={check.key}>
                  <span>{check.label}</span>
                  <strong className={check.passed ? 'state-pass' : 'state-fail'}>
                    {check.passed ? 'T' : 'F'}
                  </strong>
                  <span>{check.expected}</span>
                  <span>{check.evidence}</span>
                </div>
              ))}
            </div>
          </article>

          <aside className="report-side-stack decision-side-stack">
            <article className="report-panel metrics-panel">
              <h2 className="panel-title">System Metrics</h2>
              <p className="panel-desc">세션 중 수집된 핵심 상태</p>

              <div className="metric-item ok">
                <span className="metric-mark">✓</span>
                Session Status - {reportData.sessionStatus || reportData.status || '-'}
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

            <article className="report-panel recommendation-panel">
              <h2 className="panel-title">Recommendations</h2>
              <p className="panel-desc">추가 확인 및 개선 방향</p>

              <div className="recommendation-list">
                {recommendations.map((item, index) => (
                  <div className="recommendation-item" key={`${item}-${index}`}>
                    <span>{index + 1}</span>
                    <p>{item}</p>
                  </div>
                ))}
              </div>
            </article>
          </aside>
        </section>

        <section className="report-content-grid report-bottom-grid">
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
                    <div className="issue-impact-row issue-recommendation-row">
                      <span className="issue-impact-label">대응 방향</span>
                      <strong className="issue-impact-value">{issue.recommendation}</strong>
                    </div>
                  </div>
                ))
              )}
            </div>
          </article>

          <aside className="report-side-stack">
            <article className="report-panel logs-panel">
              <div className="panel-top">
                <div>
                  <h2 className="panel-title">Action Timeline</h2>
                  <p className="panel-desc">탐색 흐름 로그 요약</p>
                </div>
                <span className="panel-count">{logs.length} logs</span>
              </div>

              <div className="timeline-list">
                {logs.length === 0 ? (
                  <div className="timeline-item">
                    <span className="timeline-index">-</span>
                    <p className="timeline-text">수집된 로그가 없습니다.</p>
                  </div>
                ) : (
                  logs.map((log, index) => (
                    <div className="timeline-item" key={`${log.time}-${log.message}-${index}`}>
                      <span className="timeline-index">{index + 1}</span>
                      <p className="timeline-text">
                        <strong>[{displayLogLabel(log.label)}]</strong> {log.message}
                        {log.time ? <em>{log.time}</em> : null}
                      </p>
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

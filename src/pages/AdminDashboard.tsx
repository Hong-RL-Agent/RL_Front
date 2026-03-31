import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import '../styles/admin.css'

type DashboardState = {
  adminName?: string
}

type SummaryCard = {
  label: string
  value: string
  change: string
  tone: 'neutral' | 'danger' | 'success' | 'warning'
}

type SessionItem = {
  targetUrl: string
  startedAt: string
  owner: string
  progress: number
  issueText: string
  status: 'running' | 'completed' | 'failed' | 'stopped'
}

type ActivityItem = {
  name: string
  message: string
  time: string
  tone: 'info' | 'danger' | 'success' | 'warning'
}

type BugItem = {
  severity: 'Critical' | 'Warning'
  title: string
  sessionId: string
  target: string
  detectedAt: string
  status: 'Open' | 'Reviewed' | 'Resolved'
}

type LogCollectorItem = {
  name: string
  source: string
  status: 'collecting' | 'idle' | 'delayed'
  count: string
  updatedAt: string
}

type UserAdminItem = {
  name: string
  role: 'USER' | 'ADMIN'
  sessionCount: string
  state: 'active' | 'admin'
}

type FilterKey = 'overview' | 'error' | 'log' | 'users'

function AdminDashboard() {
  const navigate = useNavigate()
  const location = useLocation()
  const state = (location.state as DashboardState | null) || {}
  const adminName = state.adminName || 'Administrator'
  const [activeFilter, setActiveFilter] = useState<FilterKey>('overview')

  /*
    [추후 백엔드/API 연동 예정]

    현재 관리자 대시보드는 UI 프로토타입 단계로,
    모든 수치/목록/로그는 mock 데이터로 구성되어 있습니다.

    실제 구현 시 아래 API와 연동 예정입니다.

    - 전체 요약 통계
      GET /api/admin/summary

    - 실행 중/전체 테스트 세션
      GET /api/admin/sessions

    - 최근 활동 로그
      GET /api/admin/activities

    - 최근 탐지 이슈
      GET /api/admin/issues

    - 로그 수집 상태
      GET /api/admin/log-collectors

    - 세션 중지/재실행/상세 조회
      POST /api/admin/sessions/{sessionId}/stop
      POST /api/admin/sessions/{sessionId}/restart
      GET  /api/admin/sessions/{sessionId}
  */

  const summaryCards: SummaryCard[] = [
    { label: '총 테스트 수', value: '1,247', change: '+12% vs 지난주', tone: 'neutral' },
    { label: '탐지된 버그', value: '86', change: '34건 대기 중', tone: 'danger' },
    { label: '성공률', value: '94.2%', change: '+2.1% vs 지난주', tone: 'success' },
    { label: '활성 사용자', value: '24', change: '8명 현재 온라인', tone: 'warning' },
  ]

  const sessions: SessionItem[] = [
    {
      targetUrl: 'https://example-shop.com',
      startedAt: '10:23:45',
      owner: 'Sarah Kim',
      progress: 67,
      issueText: '총 2개 버그 발견',
      status: 'running',
    },
    {
      targetUrl: 'https://beta.platform.io',
      startedAt: '10:50:11',
      owner: 'Sarah Kim',
      progress: 23,
      issueText: '진행 중',
      status: 'running',
    },
    {
      targetUrl: 'https://checkout-demo.app',
      startedAt: '09:42:03',
      owner: 'John Park',
      progress: 100,
      issueText: '리포트 생성 완료',
      status: 'completed',
    },
    {
      targetUrl: 'https://broken-payment.site',
      startedAt: '11:08:27',
      owner: 'Mike Lee',
      progress: 81,
      issueText: '버그 다수 감지',
      status: 'failed',
    },
  ]

  const activities: ActivityItem[] = [
    { name: 'Sarah Kim', message: '새 테스트 시작', time: '2분 전', tone: 'info' },
    { name: 'John Park', message: '버그 리포트 생성', time: '15분 전', tone: 'danger' },
    { name: 'Lisa Chen', message: '테스트 완료', time: '1시간 전', tone: 'success' },
    { name: 'Mike Lee', message: '버그 수정 완료', time: '2시간 전', tone: 'success' },
    { name: 'Sarah Kim', message: '테스트 중단', time: '3시간 전', tone: 'warning' },
  ]

  const bugs: BugItem[] = [
    {
      severity: 'Critical',
      title: '결제 CTA 클릭 영역 충돌',
      sessionId: 'T-10241',
      target: '/checkout',
      detectedAt: '10:24:04',
      status: 'Open',
    },
    {
      severity: 'Warning',
      title: 'price undefined 접근 가능성',
      sessionId: 'T-10239',
      target: '/products/wireless-headphones',
      detectedAt: '09:54:11',
      status: 'Reviewed',
    },
    {
      severity: 'Warning',
      title: '리포트 API 지연 응답',
      sessionId: 'T-10231',
      target: '/api/report',
      detectedAt: '09:12:48',
      status: 'Resolved',
    },
  ]

  const logCollectors: LogCollectorItem[] = [
    {
      name: 'Console Runtime Collector',
      source: 'browser console',
      status: 'collecting',
      count: '124 logs',
      updatedAt: '방금 전',
    },
    {
      name: 'Network Trace Collector',
      source: 'api / request',
      status: 'collecting',
      count: '86 requests',
      updatedAt: '1분 전',
    },
    {
      name: 'Screenshot Event Collector',
      source: 'ui capture',
      status: 'idle',
      count: '32 captures',
      updatedAt: '3분 전',
    },
    {
      name: 'DOM Mutation Collector',
      source: 'frontend state',
      status: 'delayed',
      count: '7 delayed',
      updatedAt: '5분 전',
    },
  ]

  const userAdminItems: UserAdminItem[] = [
    { name: 'Sarah Kim', role: 'USER', sessionCount: '12 sessions', state: 'active' },
    { name: 'John Park', role: 'USER', sessionCount: '8 sessions', state: 'active' },
    { name: 'Administrator', role: 'ADMIN', sessionCount: '관리자', state: 'admin' },
  ]

  const systemStatus = [
    'Crawler Agent - 정상',
    'Report Generator - 정상',
    'Session Queue - 3 tasks',
    'LLM Analyzer - 대기 중',
  ]

  const filteredSessions =
    activeFilter === 'error'
      ? sessions.filter(
          (session) =>
            session.issueText.includes('버그') || session.status === 'failed'
        )
      : sessions

  const visibleBugs =
    activeFilter === 'overview' || activeFilter === 'error' ? bugs : []

  const getStatusLabel = (status: SessionItem['status']) => {
    if (status === 'running') return '실행 중'
    if (status === 'completed') return '완료'
    if (status === 'failed') return '실패'
    return '중지됨'
  }

  const getCollectorLabel = (status: LogCollectorItem['status']) => {
    if (status === 'collecting') return '수집 중'
    if (status === 'idle') return '대기'
    return '지연'
  }

  return (
    <div className="admin-page">
      <header className="admin-header">
        <div className="admin-header-left">
          <button
            className="admin-menu-button"
            aria-label="홈으로 이동"
            onClick={() => navigate('/')}
          >
            ☰
          </button>

          <div>
            <div className="admin-page-title-row">
              <h1 className="admin-page-title">관리자 대시보드</h1>
              <span className="admin-role-badge">Admin</span>
            </div>
            <p className="admin-page-subtitle">테스트 세션 모니터링 및 운영 관리</p>
          </div>
        </div>

        <div className="admin-header-right">
          <div className="admin-avatar">{adminName.slice(0, 1)}</div>
        </div>
      </header>

      <main className="admin-main">
        <section className="admin-summary-grid">
          {summaryCards.map((card) => (
            <article key={card.label} className={`admin-summary-card ${card.tone}`}>
              <span className="admin-summary-label">{card.label}</span>
              <strong className="admin-summary-value">{card.value}</strong>
              <span className="admin-summary-change">{card.change}</span>
            </article>
          ))}
        </section>

        <section className="admin-filter-row">
          <button
            className={`admin-filter-chip ${activeFilter === 'overview' ? 'active' : ''}`}
            onClick={() => setActiveFilter('overview')}
          >
            실시간 현황
          </button>
          <button
            className={`admin-filter-chip ${activeFilter === 'error' ? 'active' : ''}`}
            onClick={() => setActiveFilter('error')}
          >
            에러 발생 세션
          </button>
          <button
            className={`admin-filter-chip ${activeFilter === 'log' ? 'active' : ''}`}
            onClick={() => setActiveFilter('log')}
          >
            로그 수집
          </button>
          <button
            className={`admin-filter-chip ${activeFilter === 'users' ? 'active' : ''}`}
            onClick={() => setActiveFilter('users')}
          >
            사용자 관리
          </button>
        </section>

        {activeFilter === 'overview' && (
          <section className="admin-grid">
            <div className="admin-left-stack">
              <article className="admin-panel">
                <div className="admin-panel-head">
                  <div>
                    <h2 className="admin-panel-title">실행 중인 테스트</h2>
                    <p className="admin-panel-desc">현재 세션 진행률 및 상태 요약</p>
                  </div>
                  <button className="admin-panel-action">전체 보기</button>
                </div>

                <div className="admin-session-list">
                  {filteredSessions.map((session, index) => (
                    <div className="admin-session-card" key={`${session.targetUrl}-${index}`}>
                      <div className="admin-session-top">
                        <div>
                          <div className="admin-session-url">{session.targetUrl}</div>
                          <div className="admin-session-meta">
                            <span>{session.startedAt}</span>
                            <span>{session.owner}</span>
                          </div>
                        </div>

                        <span className={`admin-status-badge ${session.status}`}>
                          {getStatusLabel(session.status)}
                        </span>
                      </div>

                      <div className="admin-session-progress-row">
                        <span>진행률</span>
                        <span>{session.progress}%</span>
                      </div>

                      <div className="admin-progress-bar">
                        <div
                          className="admin-progress-fill"
                          style={{ width: `${session.progress}%` }}
                        />
                      </div>

                      <div className="admin-session-bottom">
                        <span
                          className={`admin-session-issue ${
                            session.status === 'completed' ? 'success' : 'danger'
                          }`}
                        >
                          {session.issueText}
                        </span>

                        <div className="admin-session-actions">
                          <button onClick={() => navigate('/monitor')}>상세</button>
                          <button>중지</button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </article>

              <article className="admin-panel">
                <div className="admin-panel-head">
                  <div>
                    <h2 className="admin-panel-title">최근 탐지 이슈</h2>
                    <p className="admin-panel-desc">중요도 높은 이슈부터 빠르게 확인</p>
                  </div>
                  <button className="admin-panel-action">이슈 관리</button>
                </div>

                <div className="admin-bug-table">
                  <div className="admin-bug-table-head">
                    <span>Severity</span>
                    <span>Issue</span>
                    <span>Session</span>
                    <span>Status</span>
                  </div>

                  {visibleBugs.map((bug, index) => (
                    <div className="admin-bug-row" key={`${bug.title}-${index}`}>
                      <div>
                        <span
                          className={`admin-severity ${
                            bug.severity === 'Critical' ? 'critical' : 'warning'
                          }`}
                        >
                          {bug.severity}
                        </span>
                      </div>

                      <div className="admin-bug-main">
                        <strong>{bug.title}</strong>
                        <span>
                          {bug.target} · {bug.detectedAt}
                        </span>
                      </div>

                      <div className="admin-bug-session">{bug.sessionId}</div>

                      <div>
                        <span className={`admin-review-badge ${bug.status.toLowerCase()}`}>
                          {bug.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </article>
            </div>

            <aside className="admin-right-stack">
              <article className="admin-panel">
                <div className="admin-panel-head">
                  <div>
                    <h2 className="admin-panel-title">최근 활동</h2>
                    <p className="admin-panel-desc">사용자 및 세션 이벤트 로그</p>
                  </div>
                </div>

                <div className="admin-activity-list">
                  {activities.map((activity, index) => (
                    <div className="admin-activity-item" key={`${activity.name}-${index}`}>
                      <span className={`admin-activity-icon ${activity.tone}`} />
                      <div className="admin-activity-content">
                        <strong>{activity.name}</strong>
                        <span>{activity.message}</span>
                      </div>
                      <span className="admin-activity-time">{activity.time}</span>
                    </div>
                  ))}
                </div>
              </article>

              <article className="admin-panel">
                <div className="admin-panel-head">
                  <div>
                    <h2 className="admin-panel-title">로그 수집 현황</h2>
                    <p className="admin-panel-desc">세션별 수집기 상태 및 최신 동기화</p>
                  </div>
                  <button className="admin-panel-action">수집 설정</button>
                </div>

                <div className="admin-collector-list">
                  {logCollectors.map((collector, index) => (
                    <div className="admin-collector-item" key={`${collector.name}-${index}`}>
                      <div className="admin-collector-main">
                        <strong>{collector.name}</strong>
                        <span>
                          {collector.source} · {collector.count}
                        </span>
                      </div>
                      <div className="admin-collector-side">
                        <span className={`admin-collector-badge ${collector.status}`}>
                          {getCollectorLabel(collector.status)}
                        </span>
                        <span className="admin-collector-time">{collector.updatedAt}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </article>

              <article className="admin-panel">
                <div className="admin-panel-head">
                  <div>
                    <h2 className="admin-panel-title">시스템 상태</h2>
                    <p className="admin-panel-desc">현재 백엔드/에이전트 상태 요약</p>
                  </div>
                </div>

                <div className="admin-system-list">
                  {systemStatus.map((item, index) => (
                    <div className="admin-system-item" key={`${item}-${index}`}>
                      <span className="admin-system-dot" />
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              </article>
            </aside>
          </section>
        )}

        {activeFilter === 'error' && (
          <section className="admin-single-section">
            <article className="admin-panel">
              <div className="admin-panel-head">
                <div>
                  <h2 className="admin-panel-title">에러 발생 세션</h2>
                  <p className="admin-panel-desc">버그 또는 실패 이슈가 포함된 세션만 표시</p>
                </div>
                <button className="admin-panel-action">새로고침</button>
              </div>

              <div className="admin-session-list">
                {filteredSessions.map((session, index) => (
                  <div className="admin-session-card" key={`${session.targetUrl}-error-${index}`}>
                    <div className="admin-session-top">
                      <div>
                        <div className="admin-session-url">{session.targetUrl}</div>
                        <div className="admin-session-meta">
                          <span>{session.startedAt}</span>
                          <span>{session.owner}</span>
                        </div>
                      </div>

                      <span className={`admin-status-badge ${session.status}`}>
                        {getStatusLabel(session.status)}
                      </span>
                    </div>

                    <div className="admin-session-progress-row">
                      <span>진행률</span>
                      <span>{session.progress}%</span>
                    </div>

                    <div className="admin-progress-bar">
                      <div
                        className="admin-progress-fill"
                        style={{ width: `${session.progress}%` }}
                      />
                    </div>

                    <div className="admin-session-bottom">
                      <span className="admin-session-issue danger">{session.issueText}</span>

                      <div className="admin-session-actions">
                        <button onClick={() => navigate('/monitor')}>상세</button>
                        <button>담당 지정</button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </article>
          </section>
        )}

        {activeFilter === 'log' && (
          <section className="admin-single-section">
            <article className="admin-panel">
              <div className="admin-panel-head">
                <div>
                  <h2 className="admin-panel-title">로그 수집 페이지</h2>
                  <p className="admin-panel-desc">
                    브라우저, 네트워크, DOM, 캡처 로그 수집 상태 관리
                  </p>
                </div>
                <button className="admin-panel-action">수집 재시작</button>
              </div>

              <div className="admin-log-page-grid">
                <div className="admin-log-main-card">
                  <h3 className="admin-sub-card-title">수집기 상태</h3>
                  <div className="admin-collector-list">
                    {logCollectors.map((collector, index) => (
                      <div
                        className="admin-collector-item large"
                        key={`${collector.name}-log-${index}`}
                      >
                        <div className="admin-collector-main">
                          <strong>{collector.name}</strong>
                          <span>
                            {collector.source} · {collector.count}
                          </span>
                        </div>
                        <div className="admin-collector-side">
                          <span className={`admin-collector-badge ${collector.status}`}>
                            {getCollectorLabel(collector.status)}
                          </span>
                          <span className="admin-collector-time">{collector.updatedAt}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="admin-log-side-card">
                  <h3 className="admin-sub-card-title">수집 정책</h3>
                  <div className="admin-policy-list">
                    <div className="admin-policy-item">
                      <strong>Console Error Capture</strong>
                      <span>critical / warning 로그 우선 저장</span>
                    </div>
                    <div className="admin-policy-item">
                      <strong>Network Fail Trace</strong>
                      <span>4xx / 5xx 응답 자동 보관</span>
                    </div>
                    <div className="admin-policy-item">
                      <strong>Screenshot Sampling</strong>
                      <span>주요 액션 시점 기준 캡처</span>
                    </div>
                    <div className="admin-policy-item">
                      <strong>DOM Mutation Watch</strong>
                      <span>비정상 렌더링 탐지 시 기록</span>
                    </div>
                  </div>
                </div>
              </div>
            </article>
          </section>
        )}

        {activeFilter === 'users' && (
          <section className="admin-single-section">
            <article className="admin-panel">
              <div className="admin-panel-head">
                <div>
                  <h2 className="admin-panel-title">사용자 관리</h2>
                  <p className="admin-panel-desc">현재 사용자 및 역할 기반 상태 확인</p>
                </div>
                <button className="admin-panel-action">사용자 초대</button>
              </div>

              <div className="admin-user-list">
                {userAdminItems.map((user, index) => (
                  <div className="admin-user-item" key={`${user.name}-${index}`}>
                    <div className="admin-user-main">
                      <strong>{user.name}</strong>
                      <span>{user.sessionCount}</span>
                    </div>

                    <div className="admin-user-side">
                      <span className={`admin-user-role ${user.role.toLowerCase()}`}>
                        {user.role}
                      </span>
                      <span className={`admin-user-state ${user.state}`}>{user.state}</span>
                    </div>
                  </div>
                ))}
              </div>
            </article>
          </section>
        )}
      </main>
    </div>
  )
}

export default AdminDashboard
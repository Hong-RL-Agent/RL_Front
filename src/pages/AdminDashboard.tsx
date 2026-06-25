import { useEffect, useMemo, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { apiUrl } from '../lib/api'
import '../styles/admin.css'

type DashboardState = {
  adminName?: string
}

type SummaryResponse = {
  totalTests: number
  runningSessions: number
  completedSessions: number
  failedSessions: number
  stoppedSessions: number
  detectedIssues: number
  activeUsers: number
  successRate: number
}

type SessionItem = {
  sessionId: string
  targetUrl: string
  startedAt: string
  endedAt: string
  owner: string
  progress: number
  issueCount: number
  status: 'READY' | 'RUNNING' | 'STOPPED' | 'COMPLETED' | 'FAILED'
}

type ActivityItem = {
  id: number
  sessionId: string
  name: string
  message: string
  time: string
  tone: 'info' | 'danger' | 'success' | 'warning'
}

type IssueItem = {
  id: number
  severity: 'Critical' | 'Warning'
  title: string
  sessionId: string
  target: string
  detectedAt: string
  status: 'Open' | 'Reviewed' | 'Resolved' | 'Detected'
}

type LogCollectorItem = {
  name: string
  source: string
  status: 'collecting' | 'idle' | 'delayed'
  count: string
  updatedAt: string
}

type TickItem = {
  id: number
  sessionId: string
  targetUrl: string
  runId: string
  tick: number
  status: string
  capturedAt: string | null
  actionId: string | null
  actionType: string | null
  actionLabel: string | null
  candidateCount: number
  executionSuccess: boolean | null
  domChanged: boolean | null
  networkEventsAdded: number
  errorDetected: boolean
  errorReasons: string | null
  payload: string
}

type UserItem = {
  id: number
  userName: string
  email: string
  role: 'ADMIN' | 'USER'
  createdAt: string
  sessionCount: number
  issueCount: number
  tickCount: number
}

type FilterKey = 'overview' | 'error' | 'ticks' | 'log' | 'users'

const emptySummary: SummaryResponse = {
  totalTests: 0,
  runningSessions: 0,
  completedSessions: 0,
  failedSessions: 0,
  stoppedSessions: 0,
  detectedIssues: 0,
  activeUsers: 0,
  successRate: 0,
}

function authHeaders() {
  const accessToken = localStorage.getItem('accessToken')
  return accessToken ? { Authorization: `Bearer ${accessToken}` } : undefined
}

async function fetchJson<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(apiUrl(path), {
    ...init,
    headers: {
      ...(authHeaders() || {}),
      ...(init?.headers || {}),
    },
  })

  const data = await response.json().catch(() => null)

  if (!response.ok) {
    throw new Error(data?.message || 'Admin API request failed.')
  }

  return data as T
}

function AdminDashboard() {
  const navigate = useNavigate()
  const location = useLocation()
  const state = (location.state as DashboardState | null) || {}
  const adminName = state.adminName || localStorage.getItem('userName') || 'Administrator'

  const [activeFilter, setActiveFilter] = useState<FilterKey>('overview')
  const [summary, setSummary] = useState<SummaryResponse>(emptySummary)
  const [sessions, setSessions] = useState<SessionItem[]>([])
  const [activities, setActivities] = useState<ActivityItem[]>([])
  const [issues, setIssues] = useState<IssueItem[]>([])
  const [logCollectors, setLogCollectors] = useState<LogCollectorItem[]>([])
  const [ticks, setTicks] = useState<TickItem[]>([])
  const [tickTotal, setTickTotal] = useState(0)
  const [selectedTickSession, setSelectedTickSession] = useState('')
  const [users, setUsers] = useState<UserItem[]>([])
  const [errorMessage, setErrorMessage] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [pendingSessionId, setPendingSessionId] = useState<string | null>(null)

  const loadDashboard = async () => {
    try {
      setIsLoading(true)
      setErrorMessage('')

      const tickPath = selectedTickSession
        ? `/api/admin/ticks?sessionId=${encodeURIComponent(selectedTickSession)}`
        : '/api/admin/ticks'
      const [summaryResult, sessionsResult, activitiesResult, issuesResult, collectorsResult, ticksResult, usersResult] =
        await Promise.allSettled([
          fetchJson<SummaryResponse>('/api/admin/summary'),
          fetchJson<{ sessions: SessionItem[] }>('/api/admin/sessions'),
          fetchJson<{ activities: ActivityItem[] }>('/api/admin/activities'),
          fetchJson<{ issues: IssueItem[] }>('/api/admin/issues'),
          fetchJson<{ collectors: LogCollectorItem[] }>('/api/admin/log-collectors'),
          fetchJson<{ total: number; ticks: TickItem[] }>(tickPath),
          fetchJson<{ users: UserItem[] }>('/api/admin/users'),
        ])

      if (summaryResult.status === 'fulfilled') setSummary(summaryResult.value)
      if (sessionsResult.status === 'fulfilled') setSessions(sessionsResult.value.sessions)
      if (activitiesResult.status === 'fulfilled') setActivities(activitiesResult.value.activities)
      if (issuesResult.status === 'fulfilled') setIssues(issuesResult.value.issues)
      if (collectorsResult.status === 'fulfilled') setLogCollectors(collectorsResult.value.collectors)
      if (ticksResult.status === 'fulfilled') {
        setTicks(ticksResult.value.ticks)
        setTickTotal(ticksResult.value.total)
      }
      if (usersResult.status === 'fulfilled') setUsers(usersResult.value.users)

      const failedResult = [
        summaryResult,
        sessionsResult,
        activitiesResult,
        issuesResult,
        collectorsResult,
        ticksResult,
        usersResult,
      ].find((result) => result.status === 'rejected')
      if (failedResult?.status === 'rejected') {
        setErrorMessage(
          failedResult.reason instanceof Error
            ? failedResult.reason.message
            : 'Some admin data could not be loaded.'
        )
      }
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Unable to load admin data.')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadDashboard()
  }, [])

  const loadTicks = async (sessionId: string) => {
    try {
      setErrorMessage('')
      const path = sessionId
        ? `/api/admin/ticks?sessionId=${encodeURIComponent(sessionId)}`
        : '/api/admin/ticks'
      const data = await fetchJson<{ total: number; ticks: TickItem[] }>(path)
      setTicks(data.ticks)
      setTickTotal(data.total)
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Unable to load tick data.')
    }
  }

  const formatTickPayload = (payload: string) => {
    try {
      return JSON.stringify(JSON.parse(payload), null, 2)
    } catch {
      return payload
    }
  }

  const filteredSessions = useMemo(() => {
    if (activeFilter !== 'error') return sessions
    return sessions.filter((session) => session.issueCount > 0 || session.status === 'FAILED')
  }, [activeFilter, sessions])

  const visibleIssues = activeFilter === 'overview' || activeFilter === 'error' ? issues : []

  const stopSession = async (sessionId: string) => {
    try {
      setPendingSessionId(sessionId)
      const updated = await fetchJson<SessionItem>(`/api/admin/sessions/${sessionId}/stop`, {
        method: 'POST',
      })
      setSessions((prev) =>
        prev.map((session) => (session.sessionId === sessionId ? updated : session))
      )
      await loadDashboard()
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Unable to stop session.')
    } finally {
      setPendingSessionId(null)
    }
  }

  const restartSession = async (sessionId: string) => {
    try {
      setPendingSessionId(sessionId)
      const updated = await fetchJson<SessionItem>(`/api/admin/sessions/${sessionId}/restart`, {
        method: 'POST',
      })
      setSessions((prev) =>
        prev.map((session) => (session.sessionId === sessionId ? updated : session))
      )
      await loadDashboard()
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Unable to restart session.')
    } finally {
      setPendingSessionId(null)
    }
  }

  const summaryCards = [
    {
      label: 'Total tests',
      value: String(summary.totalTests),
      change: `${summary.runningSessions} running`,
      tone: 'neutral',
    },
    {
      label: 'Detected bugs',
      value: String(summary.detectedIssues),
      change: `${summary.failedSessions} failed / ${summary.stoppedSessions} stopped`,
      tone: 'danger',
    },
    {
      label: 'Success rate',
      value: `${summary.successRate}%`,
      change: `${summary.completedSessions} completed`,
      tone: 'success',
    },
    {
      label: 'Users',
      value: String(summary.activeUsers),
      change: 'registered accounts',
      tone: 'warning',
    },
  ] as const

  const getStatusLabel = (status: SessionItem['status']) => {
    if (status === 'RUNNING') return 'Running'
    if (status === 'COMPLETED') return 'Completed'
    if (status === 'FAILED') return 'Failed'
    if (status === 'STOPPED') return 'Stopped'
    return 'Ready'
  }

  const statusClass = (status: SessionItem['status']) => status.toLowerCase()

  return (
    <div className="admin-page">
      <header className="admin-header">
        <div className="admin-header-left">
          <button className="admin-menu-button" aria-label="Go home" onClick={() => navigate('/')}>
            J
          </button>

          <div>
            <div className="admin-page-title-row">
              <h1 className="admin-page-title">Admin Dashboard</h1>
              <span className="admin-role-badge">Admin</span>
            </div>
            <p className="admin-page-subtitle">Monitor test sessions, issues, and collectors.</p>
          </div>
        </div>

        <div className="admin-header-right">
          <button className="admin-panel-action" onClick={loadDashboard} disabled={isLoading}>
            Refresh
          </button>
          <div className="admin-avatar">{adminName.slice(0, 1).toUpperCase()}</div>
        </div>
      </header>

      <main className="admin-main">
        {errorMessage && <div className="admin-panel danger">{errorMessage}</div>}

        <section className="admin-summary-grid">
          {summaryCards.map((card) => (
            <article key={card.label} className={`admin-summary-card ${card.tone}`}>
              <span className="admin-summary-label">{card.label}</span>
              <strong className="admin-summary-value">{isLoading ? '-' : card.value}</strong>
              <span className="admin-summary-change">{card.change}</span>
            </article>
          ))}
        </section>

        <section className="admin-filter-row">
          <button
            className={`admin-filter-chip ${activeFilter === 'overview' ? 'active' : ''}`}
            onClick={() => setActiveFilter('overview')}
          >
            Overview
          </button>
          <button
            className={`admin-filter-chip ${activeFilter === 'error' ? 'active' : ''}`}
            onClick={() => setActiveFilter('error')}
          >
            Error sessions
          </button>
          <button
            className={`admin-filter-chip ${activeFilter === 'ticks' ? 'active' : ''}`}
            onClick={() => setActiveFilter('ticks')}
          >
            Tick data
          </button>
          <button
            className={`admin-filter-chip ${activeFilter === 'log' ? 'active' : ''}`}
            onClick={() => setActiveFilter('log')}
          >
            Log collectors
          </button>
          <button
            className={`admin-filter-chip ${activeFilter === 'users' ? 'active' : ''}`}
            onClick={() => setActiveFilter('users')}
          >
            Users
          </button>
        </section>

        {(activeFilter === 'overview' || activeFilter === 'error') && (
          <section className="admin-grid">
            <div className="admin-left-stack">
              <article className="admin-panel">
                <div className="admin-panel-head">
                  <div>
                    <h2 className="admin-panel-title">Test Sessions</h2>
                    <p className="admin-panel-desc">Latest backend sessions from the database.</p>
                  </div>
                </div>

                <div className="admin-session-list">
                  {filteredSessions.length === 0 && (
                    <div className="admin-session-card">No sessions yet.</div>
                  )}

                  {filteredSessions.map((session) => (
                    <div className="admin-session-card" key={session.sessionId}>
                      <div className="admin-session-top">
                        <div>
                          <div className="admin-session-url">{session.targetUrl}</div>
                          <div className="admin-session-meta">
                            <span>{session.startedAt}</span>
                            <span>{session.owner}</span>
                          </div>
                        </div>

                        <span className={`admin-status-badge ${statusClass(session.status)}`}>
                          {getStatusLabel(session.status)}
                        </span>
                      </div>

                      <div className="admin-session-progress-row">
                        <span>Progress</span>
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
                            session.issueCount > 0 ? 'danger' : 'success'
                          }`}
                        >
                          {session.issueCount} issue(s)
                        </span>

                        <div className="admin-session-actions">
                          <button
                            onClick={() =>
                              navigate('/monitor', {
                                state: {
                                  sessionId: session.sessionId,
                                  targetUrl: session.targetUrl,
                                },
                              })
                            }
                          >
                            Detail
                          </button>
                          {session.status === 'RUNNING' ? (
                            <button
                              disabled={pendingSessionId === session.sessionId}
                              onClick={() => stopSession(session.sessionId)}
                            >
                              Stop
                            </button>
                          ) : (
                            <button
                              disabled={pendingSessionId === session.sessionId}
                              onClick={() => restartSession(session.sessionId)}
                            >
                              Restart
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </article>

              <article className="admin-panel">
                <div className="admin-panel-head">
                  <div>
                    <h2 className="admin-panel-title">Recent Issues</h2>
                    <p className="admin-panel-desc">Latest detected backend issue records.</p>
                  </div>
                </div>

                <div className="admin-bug-table">
                  <div className="admin-bug-table-head">
                    <span>Severity</span>
                    <span>Issue</span>
                    <span>Session</span>
                    <span>Status</span>
                  </div>

                  {visibleIssues.map((issue) => (
                    <div className="admin-bug-row" key={issue.id}>
                      <div>
                        <span
                          className={`admin-severity ${
                            issue.severity === 'Critical' ? 'critical' : 'warning'
                          }`}
                        >
                          {issue.severity}
                        </span>
                      </div>

                      <div className="admin-bug-main">
                        <strong>{issue.title}</strong>
                        <span>
                          {issue.target} - {issue.detectedAt}
                        </span>
                      </div>

                      <div className="admin-bug-session">{issue.sessionId}</div>

                      <div>
                        <span className={`admin-review-badge ${issue.status.toLowerCase()}`}>
                          {issue.status}
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
                    <h2 className="admin-panel-title">Recent Activity</h2>
                    <p className="admin-panel-desc">Latest action logs written by sessions.</p>
                  </div>
                </div>

                <div className="admin-activity-list">
                  {activities.map((activity) => (
                    <div className="admin-activity-item" key={activity.id}>
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
            </aside>
          </section>
        )}

        {activeFilter === 'ticks' && (
          <section className="admin-single-section">
            <article className="admin-panel">
              <div className="admin-panel-head admin-tick-head">
                <div>
                  <h2 className="admin-panel-title">Collected tick data</h2>
                  <p className="admin-panel-desc">
                    State, selected action, DOM transition, network delta, and findings per tick.
                  </p>
                </div>
                <div className="admin-tick-controls">
                  <label htmlFor="admin-tick-session">Session</label>
                  <select
                    id="admin-tick-session"
                    value={selectedTickSession}
                    onChange={(event) => {
                      const sessionId = event.target.value
                      setSelectedTickSession(sessionId)
                      void loadTicks(sessionId)
                    }}
                  >
                    <option value="">All recent sessions</option>
                    {sessions.map((session) => (
                      <option key={session.sessionId} value={session.sessionId}>
                        {session.targetUrl} · {session.sessionId.slice(0, 8)}
                      </option>
                    ))}
                  </select>
                  <span>{tickTotal} collected</span>
                </div>
              </div>

              <div className="admin-tick-list">
                {ticks.length === 0 && (
                  <div className="admin-tick-empty">
                    No tick data yet. Run a new test session to start collecting it.
                  </div>
                )}

                {ticks.map((tick) => (
                  <details
                    className={`admin-tick-item ${tick.errorDetected ? 'has-error' : ''}`}
                    key={tick.id}
                  >
                    <summary>
                      <div className="admin-tick-identity">
                        <span className="admin-tick-number">Tick {tick.tick}</span>
                        <div>
                          <strong>{tick.actionLabel || tick.actionType || 'Initial state'}</strong>
                          <span>{tick.targetUrl}</span>
                        </div>
                      </div>
                      <div className="admin-tick-metrics">
                        <span className={`admin-tick-status ${tick.status}`}>{tick.status}</span>
                        <span>{tick.candidateCount} candidates</span>
                        <span>DOM {tick.domChanged == null ? '-' : tick.domChanged ? 'changed' : 'same'}</span>
                        <span>{tick.networkEventsAdded} network</span>
                        <span className={tick.errorDetected ? 'danger' : 'success'}>
                          {tick.errorDetected ? 'Finding' : 'Clean'}
                        </span>
                      </div>
                    </summary>

                    <div className="admin-tick-detail">
                      <div className="admin-tick-detail-grid">
                        <span><strong>Session</strong>{tick.sessionId}</span>
                        <span><strong>Run</strong>{tick.runId}</span>
                        <span><strong>Captured</strong>{tick.capturedAt || '-'}</span>
                        <span><strong>Action ID</strong>{tick.actionId || '-'}</span>
                        <span>
                          <strong>Execution</strong>
                          {tick.executionSuccess == null ? '-' : tick.executionSuccess ? 'Success' : 'Failed'}
                        </span>
                        <span><strong>Reason</strong>{tick.errorReasons || '-'}</span>
                      </div>
                      <pre>{formatTickPayload(tick.payload)}</pre>
                    </div>
                  </details>
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
                  <h2 className="admin-panel-title">Log Collectors</h2>
                  <p className="admin-panel-desc">Collector status derived from backend session data.</p>
                </div>
              </div>

              <div className="admin-collector-list">
                {logCollectors.map((collector) => (
                  <div className="admin-collector-item large" key={collector.name}>
                    <div className="admin-collector-main">
                      <strong>{collector.name}</strong>
                      <span>
                        {collector.source} - {collector.count}
                      </span>
                    </div>
                    <div className="admin-collector-side">
                      <span className={`admin-collector-badge ${collector.status}`}>
                        {collector.status}
                      </span>
                      <span className="admin-collector-time">{collector.updatedAt}</span>
                    </div>
                  </div>
                ))}
              </div>
            </article>
          </section>
        )}

        {activeFilter === 'users' && (
          <section className="admin-single-section">
            <article className="admin-panel">
              <div className="admin-panel-head">
                <div>
                  <h2 className="admin-panel-title">Users</h2>
                  <p className="admin-panel-desc">All accounts and their persisted test data.</p>
                </div>
              </div>
              <div className="admin-user-list">
                {users.length === 0 && <div className="admin-user-item">No users in the database.</div>}
                {users.map((user) => (
                  <div className="admin-user-item" key={user.id}>
                    <div className="admin-user-main">
                      <strong>{user.userName}</strong>
                      <span>{user.email} · joined {user.createdAt}</span>
                    </div>
                    <div className="admin-user-side">
                      <span className={`admin-user-role ${user.role.toLowerCase()}`}>
                        {user.role}
                      </span>
                      <span className="admin-user-state active">{user.sessionCount} sessions</span>
                      <span className="admin-user-state issues">{user.issueCount} issues</span>
                      <span className="admin-user-state ticks">{user.tickCount} ticks</span>
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

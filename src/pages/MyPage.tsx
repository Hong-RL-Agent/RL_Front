import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { apiUrl } from '../lib/api'
import '../styles/mypage.css'

type TestHistoryItem = {
  sessionId: string
  targetUrl: string
  status: 'READY' | 'RUNNING' | 'COMPLETED' | 'FAILED'
  createdAt: string
  endedAt: string
  duration: string
  issueCount: number
}

type TestHistoryResponse = {
  reports: TestHistoryItem[]
}

function MyPage() {
  const navigate = useNavigate()
  const [reports, setReports] = useState<TestHistoryItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState('')

  useEffect(() => {
    const fetchReports = async () => {
      try {
        setIsLoading(true)
        setErrorMessage('')

        const accessToken = localStorage.getItem('accessToken')
        const response = await fetch(apiUrl('/api/test/history'), {
          headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : undefined,
        })

        const data = (await response.json()) as TestHistoryResponse | { message?: string }

        if (!response.ok) {
          throw new Error('message' in data ? data.message : '테스트 기록을 불러오지 못했습니다.')
        }

        setReports('reports' in data ? data.reports : [])
      } catch (error) {
        setErrorMessage(
          error instanceof Error ? error.message : '테스트 기록을 불러오지 못했습니다.'
        )
      } finally {
        setIsLoading(false)
      }
    }

    fetchReports()
  }, [])

  const totalIssues = reports.reduce((sum, report) => sum + report.issueCount, 0)
  const latestRun = reports[0]?.createdAt || '-'

  const statusLabel = (status: TestHistoryItem['status']) => {
    if (status === 'COMPLETED') return 'Completed'
    if (status === 'FAILED') return 'Failed'
    if (status === 'RUNNING') return 'Running'
    return 'Ready'
  }

  const statusClass = (status: TestHistoryItem['status']) => status.toLowerCase()

  return (
    <div className="mypage">
      <header className="mypage-header">
        <button
          type="button"
          className="mypage-back-button"
          aria-label="뒤로가기"
          onClick={() => navigate(-1)}
        >
          <span aria-hidden="true">←</span>
        </button>

        <div>
          <p className="mypage-kicker">Account</p>
          <h1>My Page</h1>
        </div>
      </header>

      <main className="mypage-main">
        <section className="mypage-summary" aria-label="테스트 요약">
          <div className="summary-item">
            <span>총 테스트</span>
            <strong>{reports.length}</strong>
          </div>
          <div className="summary-item">
            <span>발견 이슈</span>
            <strong>{totalIssues}</strong>
          </div>
          <div className="summary-item">
            <span>최근 실행</span>
            <strong>{latestRun}</strong>
          </div>
        </section>

        <div className="mypage-section-head">
          <div>
            <h2>테스트 기록</h2>
            <p>최근 실행한 웹 테스트 결과를 확인할 수 있습니다.</p>
          </div>
        </div>

        <div className="report-list">
          {isLoading && <div className="mypage-empty">테스트 기록을 불러오는 중입니다.</div>}

          {!isLoading && errorMessage && <div className="mypage-empty error">{errorMessage}</div>}

          {!isLoading && !errorMessage && reports.length === 0 && (
            <div className="mypage-empty">아직 저장된 테스트 기록이 없습니다.</div>
          )}

          {!isLoading && !errorMessage && reports.map((report) => (
            <button
              type="button"
              key={report.sessionId}
              className="report-card"
              onClick={() =>
                navigate('/report', {
                  state: {
                    testId: report.sessionId,
                    createdAt: report.createdAt,
                    targetUrl: report.targetUrl,
                    sessionStatus: report.status.toLowerCase(),
                  },
                })
              }
            >
              <div className="report-top">
                <div>
                  <span className="report-id">#{report.sessionId}</span>
                  <div className="report-url">{report.targetUrl}</div>
                </div>
                <span className={`report-status ${statusClass(report.status)}`}>
                  {statusLabel(report.status)}
                </span>
              </div>

              <div className="report-meta">
                <span>{report.createdAt}</span>
                <span>{report.duration}</span>
                <span>{report.issueCount} issues</span>
              </div>
            </button>
          ))}
        </div>
      </main>
    </div>
  )
}

export default MyPage

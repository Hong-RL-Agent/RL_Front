import { useNavigate } from 'react-router-dom'
import '../styles/mypage.css'

function MyPage() {
  const navigate = useNavigate()

  const reports = [
    {
      id: '123456789',
      url: 'https://example.com',
      date: '2026.03.18',
      status: 'Completed',
    },
    {
      id: '987654321',
      url: 'https://naver.com',
      date: '2026.03.17',
      status: 'Completed',
    },
  ]

  return (
    <div className="mypage">
      <header className="mypage-header">
        <button onClick={() => navigate(-1)}>←</button>
        <h1>My Page</h1>
      </header>

      <main className="mypage-main">
        <h2>테스트 기록</h2>

        <div className="report-list">
          {reports.map((report) => (
            <div
              key={report.id}
              className="report-card"
              onClick={() =>
                navigate('/report', {
                  state: {
                    testId: report.id,
                    createdAt: report.date,
                  },
                })
              }
            >
              <div className="report-top">
                <span className="report-id">#{report.id}</span>
                <span className="report-status">{report.status}</span>
              </div>

              <div className="report-url">{report.url}</div>
              <div className="report-date">{report.date}</div>
            </div>
          ))}
        </div>
      </main>
    </div>
  )
}

export default MyPage
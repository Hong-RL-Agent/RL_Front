import { useLocation, useNavigate } from 'react-router-dom'
import '../styles/report.css'

function Report() {
  const navigate = useNavigate()
  const location = useLocation()

  const reportData = (location.state as {
    createdAt?: string
    testId?: string
  } | null) || {
    createdAt: '2026.03.18',
    testId: '123456789',
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
          <div>
            <h1 className="report-title">Bug Analysis Report</h1>
            <p className="report-subtitle">
              {reportData.createdAt} 생성됨. Test ID {reportData.testId}
            </p>
          </div>

          <button className="export-button">Export PDF</button>
        </section>
      </main>
    </div>
  )
}

export default Report
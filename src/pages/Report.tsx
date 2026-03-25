/*
  [추후 백엔드/API 연동 예정]

  Report 페이지는 테스트 종료 후 수집된 로그, 탐지 이슈, 시스템 상태를 기반으로
  최종 분석 결과를 시각화하는 페이지입니다.

  현재는 UI 프로토타입 단계이므로
  요약 카드, 이슈 목록, 시스템 메트릭, 액션 타임라인이 모두 mock 데이터로 구성되어 있습니다.

  실제 구현 시에는 아래와 같은 흐름으로 백엔드와 연동할 예정입니다.

  1. Monitor 페이지에서 테스트 종료 또는 리포트 생성 요청
     POST /api/test/{sessionId}/report

  2. 백엔드에서 해당 세션 기준 리포트 데이터 생성

  3. Report 페이지 진입 시 sessionId 또는 testId 기반으로
     리포트 상세 데이터 조회

     GET /api/test/{sessionId}/report

  4. 조회한 데이터를 기반으로
     - 요약 카드
     - 탐지된 이슈 목록
     - 시스템 메트릭
     - 액션 타임라인
     - 리스크 점수
     등을 실제 분석 결과로 렌더링

  5. 필요 시 PDF 내보내기 기능 추가
     GET /api/test/{sessionId}/report/export
     또는
     POST /api/test/{sessionId}/report/export
*/

import { useLocation, useNavigate } from 'react-router-dom'
import '../styles/report.css'

type ReportState = {
  createdAt?: string
  testId?: string
}

function Report() {
  const navigate = useNavigate()
  const location = useLocation()

  /*
    TODO:
    현재는 monitor 페이지에서 전달받은 createdAt, testId만 사용하고 있습니다.

    실제 구현 시에는 여기서 sessionId 또는 testId를 받아
    해당 리포트 데이터를 조회하는 기준값으로 사용할 예정입니다.
  */
  const reportData: ReportState = (location.state as ReportState | null) || {
    createdAt: '2026.03.18',
    testId: '123456789',
  }

  /*
    TODO:
    현재는 리포트 상단 요약 카드 UI를 보여주기 위한 mock 데이터입니다.

    실제 구현 시에는 백엔드 리포트 응답값을 기반으로
    총 탐색 단계 수, 치명 이슈 수, 경고 수, 성공 요청 수 등을 표시할 예정입니다.

    API 예정:
    GET /api/test/{sessionId}/report
  */
  const summaryCards = [
    { label: '총 탐색 단계', value: '27', tone: 'neutral' },
    { label: '탐지된 치명 이슈', value: '01', tone: 'danger' },
    { label: '경고 이슈', value: '02', tone: 'warning' },
    { label: '성공 요청 수', value: '18', tone: 'success' },
  ]

  /*
    TODO:
    현재는 탐지 이슈 목록 UI를 위한 mock 데이터입니다.

    실제 구현 시에는 백엔드 분석 결과를 기반으로
    이슈 심각도, 설명, 위치, 영향도를 동적으로 렌더링할 예정입니다.

    API 예정:
    GET /api/test/{sessionId}/report
    또는
    GET /api/test/{sessionId}/issues
  */
  const issueList = [
    {
      level: 'Critical',
      title: '결제 버튼 클릭 영역 충돌',
      description:
        '모바일 뷰포트에서 Proceed to Payment 버튼이 하단 요소와 겹쳐 실제 클릭 좌표가 밀리는 문제가 확인되었습니다.',
      location: '/checkout',
      impact: '결제 CTA 오작동 가능성',
    },
    {
      level: 'Warning',
      title: '상품 price 값 undefined 접근',
      description:
        '일부 상태 전환 중 상품 가격 데이터가 비어 있는 시점에 렌더링이 발생하여 undefined 접근 가능성이 탐지되었습니다.',
      location: '/products/wireless-headphones',
      impact: '런타임 에러 가능성',
    },
    {
      level: 'Warning',
      title: '리포트 API 응답 지연',
      description:
        'POST /api/report 요청이 일부 구간에서 지연되거나 실패 응답으로 전환되는 패턴이 감지되었습니다.',
      location: '/api/report',
      impact: '레포트 생성 실패 가능성',
    },
  ]

  /*
    TODO:
    현재는 탐색 흐름 요약 UI를 위한 mock 로그 데이터입니다.

    실제 구현 시에는 세션별 탐색 로그 또는 리포트에 포함된 timeline 데이터를
    백엔드에서 받아와 렌더링할 예정입니다.

    API 예정:
    GET /api/test/{sessionId}/report
    또는
    GET /api/test/{sessionId}/logs
  */
  const actionLogs = [
    '[Navigate] Navigated to /home',
    '[Action] Clicked "Products" navigation link',
    '[Navigate] Navigated to /products/wireless-headphones',
    '[Action] Clicked "Add to Cart" button',
    '[Navigate] Navigated to /cart',
    '[Action] Clicked "Proceed to Payment" button',
    '[Error] CTA button overlaps bottom element on mobile viewport',
    '[Network] POST /api/report responded with 500',
  ]

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
          </div>

          <div className="report-title-actions">
            {/* TODO:
                실제 구현 시 백엔드 PDF export API와 연동 예정
                예:
                GET /api/test/{sessionId}/report/export
            */}
            <button className="export-button">Export PDF</button>
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
              <span className="panel-badge">Completed</span>
            </div>

            <div className="overview-body">
              <p className="overview-text">
                이번 탐색에서는 상품 상세 → 장바구니 → 결제 흐름 중심으로 UI 동작을 검사했습니다.
                전체적으로 주요 페이지 이동과 일반 요청은 정상적으로 수행되었지만, 결제 단계에서
                <strong> 클릭 영역 충돌 이슈</strong>가 발견되었고 일부 상태에서는
                <strong> price 값 undefined 접근 가능성</strong>도 확인되었습니다.
              </p>

              <div className="overview-points">
                <div className="overview-point">
                  <span className="point-dot success" />
                  대부분의 일반 페이지 이동 및 상품 조회 요청은 정상 처리
                </div>
                <div className="overview-point">
                  <span className="point-dot danger" />
                  결제 CTA 버튼 UI 충돌로 실제 사용자 액션 실패 가능성 존재
                </div>
                <div className="overview-point">
                  <span className="point-dot warning" />
                  일부 상태 전환에서 런타임 에러 잠재 위험 확인
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
                  <strong>72</strong>
                  <span>/ 100</span>
                </div>
              </div>
            </div>

            <div className="score-meta">
              <div className="score-row">
                <span>UI 안정성</span>
                <strong>68</strong>
              </div>
              <div className="score-row">
                <span>네트워크 응답성</span>
                <strong>81</strong>
              </div>
              <div className="score-row">
                <span>런타임 안전성</span>
                <strong>66</strong>
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
              {issueList.map((issue, index) => (
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
              ))}
            </div>
          </article>

          <aside className="report-side-stack">
            <article className="report-panel metrics-panel">
              <h2 className="panel-title">System Metrics</h2>
              <p className="panel-desc">세션 중 수집된 핵심 상태</p>

              <div className="metric-item ok">
                <span className="metric-mark">✓</span>
                GET /api/products - 200 OK
              </div>
              <div className="metric-item warn">
                <span className="metric-mark">!</span>
                TypeError: Cannot read property "price"
              </div>
              <div className="metric-item danger">
                <span className="metric-mark">↗</span>
                POST /api/report - 500 Internal Server Error
              </div>
            </article>

            <article className="report-panel logs-panel">
              <h2 className="panel-title">Action Timeline</h2>
              <p className="panel-desc">탐색 흐름 로그 요약</p>

              <div className="timeline-list">
                {actionLogs.map((log, index) => (
                  <div className="timeline-item" key={`${log}-${index}`}>
                    <span className="timeline-index">{index + 1}</span>
                    <p className="timeline-text">{log}</p>
                  </div>
                ))}
              </div>
            </article>
          </aside>
        </section>
      </main>
    </div>
  )
}

export default Report
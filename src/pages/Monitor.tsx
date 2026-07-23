//백엔드 프로토타입과 연결 테스트. 추후 백엔드 구축 후 백엔드와 연결 예정

import { useEffect, useMemo, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { apiUrl } from '../lib/api'
import '../styles/monitor.css'

type LogLabel =
  | 'Navigate'
  | 'Action'
  | 'State'
  | 'Error'
  | 'Warning'
  | 'Automation'
  | 'Network'
  | 'AI'

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

type PreviewMeta = {
  width: number
  height: number
  viewportWidth: number
  viewportHeight: number
  mode: 'full_page' | 'viewport'
}

function readableActionName(raw: string) {
  if (raw === 'initial_state') return '첫 화면을 확인했습니다'
  return raw
    .replace(/^click_/, '')
    .replace(/^input_/, '')
    .replace(/^press_enter_/, '')
    .replace(/^viewport_/, '화면 크기 ')
    .replace(/input not type button not type submit not type hidden textarea \d+/g, '입력칸')
    .replace(/button \d+/g, '버튼')
    .replace(/a \d+ nolabel/g, '이름 없는 링크')
    .replace(/username|nombre de usuario/g, '아이디')
    .replace(/password|contraseña/g, '비밀번호')
    .replace(/login|ingresar/g, '로그인')
    .replace(/signup|register|sign up/g, '회원가입')
    .replace(/_/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function readableFinding(raw: string) {
  if (!raw) return ''
  if (raw.includes('ui_no_visible_reaction_after_click')) {
    return '눌렀지만 화면 변화가 보이지 않았습니다.'
  }
  if (raw.includes('frontend_console_error')) {
    return '브라우저 스크립트 오류가 감지됐습니다.'
  }
  if (raw.includes('backend_network_error') || raw.includes('backend_api_error')) {
    return '네트워크 또는 API 요청 문제가 감지됐습니다.'
  }
  return raw.replace(/_/g, ' ')
}

export function toUserMessage(label: LogLabel, message: string) {
  const browserGymMatch = message.match(
    /episode=(\d+), step=(\d+), action=([^,]+), success=(true|false), newState=(true|false), candidates=(\d+), anomalies=(\d+)(?:, url=(.*))?$/
  )
  if (browserGymMatch) {
    const [, episode, tick, action, success, newState, candidates, anomalies, rawUrl = ''] = browserGymMatch
    const actionNames: Record<string, string> = {
      inspect_layout: '화면 배치 점검', fill_input: '입력란 작성', change_viewport_mobile: '모바일 화면 전환',
      change_viewport_desktop: '데스크톱 화면 전환', inspect_console: '브라우저 오류 점검',
      inspect_network: '네트워크 점검', click_element: '화면 요소 클릭', submit_form: '양식 제출',
    }
    const cleanUrl = rawUrl.replace(/;jsessionid=[^?&#]*/, '')
    return [
      `에피소드 ${episode} · Tick ${tick}`,
      actionNames[action] || action.replace(/_/g, ' '),
      success === 'true' ? '성공' : '실패',
      newState === 'true' ? '새 화면/상태 발견' : '기존 상태 유지',
      `실행 후보 ${candidates}개`,
      Number(anomalies) > 0 ? `문제 ${anomalies}건` : '',
      cleanUrl,
    ].filter(Boolean).join(' · ')
  }

  const tickMatch = message.match(/\[TICK\s+(\d+)\]\s+action=([^,]+),\s+error=(true|false),\s+findings=(.*)$/)
  if (tickMatch) {
    const [, tick, action, hasError, findings] = tickMatch
    const actionText = readableActionName(action)
    if (hasError === 'true') {
      return `${tick}단계: ${actionText}을(를) 시도했습니다. ${readableFinding(findings)}`
    }
    return `${tick}단계: ${actionText}을(를) 시도했고, 눈에 띄는 문제는 없었습니다.`
  }

  const aiMatch = message.match(/tick=(\d+), selected=([^,]+), type=([^,]+), candidates=(\d+), error=(true|false)(?:, findings=([^,]+))?/)
  if (aiMatch) {
    const [, tick, selected, , candidates, hasError, findings = ''] = aiMatch
    const actionText = readableActionName(selected)
    const prefix = `${tick}단계: ${candidates}개의 후보 중 ${actionText} 동작을 선택했습니다`
    if (hasError === 'true') {
      return `${prefix}. ${readableFinding(findings || 'A possible issue was found.')}`
    }
    return `${prefix}. 계속 탐색 중입니다.`
  }

  if (label === 'Navigate') return '자동 브라우저로 대상 사이트를 열고 있습니다.'
  if (message.includes('Running Playwright')) return '실제 브라우저 탐색을 시작했습니다.'
  if (message.includes('completed')) return '자동 탐색이 완료됐습니다.'
  return message
}

function toSimpleUserMessage(label: LogLabel, message: string) {
  const text = message.toLowerCase()
  const action =
    message.match(/action=([^,\s]+)/i)?.[1] ||
    message.match(/type=([^,\s]+)/i)?.[1] ||
    ''
  const context = `${text} ${action.toLowerCase()}`

  if (/completed|complete|finished|finish_episode/.test(context)) {
    return '사이트 테스트를 완료했습니다.'
  }
  if (/failed|failure|exception|error=true/.test(context) || label === 'Error') {
    return '동작 중 문제를 발견해 원인을 확인하고 있습니다.'
  }
  if (/login|log-in|sign in|username|password|contrase|ingresar/.test(context)) {
    return '로그인 기능을 테스트하고 있습니다.'
  }
  if (/signup|sign up|register|create account/.test(context)) {
    return '회원가입 기능을 테스트하고 있습니다.'
  }
  if (/search|query/.test(context)) {
    return '검색 기능을 테스트하고 있습니다.'
  }
  if (/(?:url=|https?:\/\/)[^,\s]*(?:\/cart|\/basket|\/checkout|\/payment)/.test(context)) {
    return '현재 페이지의 구매 관련 기능을 확인하고 있습니다.'
  }
  if (/inspect_cart/.test(context)) {
    return '현재 페이지에서 사용할 수 있는 기능을 확인하고 있습니다.'
  }
  if (/fill_input|input_|textbox|textarea/.test(context)) {
    return '입력 항목이 정상적으로 동작하는지 확인하고 있습니다.'
  }
  if (/click_element|click_|button|link/.test(context)) {
    return '버튼과 링크의 동작을 테스트하고 있습니다.'
  }
  if (/inspect_console|console/.test(context)) {
    return '페이지 내부 오류가 있는지 확인하고 있습니다.'
  }
  if (/inspect_network|network|request|response|api/.test(context) || label === 'Network') {
    return '서버 통신이 정상적인지 확인하고 있습니다.'
  }
  if (/inspect_layout|layout|viewport|screen/.test(context)) {
    return '화면이 올바르게 표시되는지 확인하고 있습니다.'
  }
  if (/navigate|opening|target url|browser/.test(context) || label === 'Navigate') {
    return '테스트할 웹페이지를 열고 있습니다.'
  }
  if (/state|dom|candidate|selected|tick|episode/.test(context) || label === 'State' || label === 'AI') {
    return '페이지에서 다음 테스트 항목을 찾고 있습니다.'
  }
  return '웹페이지의 주요 기능을 테스트하고 있습니다.'
}

function findingConfidence(message: string) {
  const value = Number(message.match(/confidence=([0-9.]+)/i)?.[1] || 0)
  return Number.isFinite(value) ? value : 0
}

function humanizeFinding(message: string) {
  const confidence = findingConfidence(message)
  const confidenceText = confidence > 0 ? ` 신뢰도 ${Math.round(confidence * 100)}%.` : ''
  const evidenceText = message.match(/evidence=(\{.*\})$/i)?.[1]
  let evidence: Record<string, unknown> = {}

  if (evidenceText) {
    try {
      evidence = JSON.parse(evidenceText) as Record<string, unknown>
    } catch {
      evidence = {}
    }
  }

  if (/layout-overlap/i.test(message)) {
    const count = Number(evidence.layout_overlap_count || evidence['layout overlap count'] || 0)
    const viewportWidth = Number(evidence.viewport_width || evidence['viewport width'] || 0)
    const viewportHeight = Number(evidence.viewport_height || evidence['viewport height'] || 0)
    const viewport = viewportWidth && viewportHeight ? ` (${viewportWidth}×${viewportHeight} 화면)` : ''
    return `일부 화면 요소가 서로 겹칠 가능성이 감지됐습니다${viewport}.${count ? ` 겹침 후보 ${count}개를 찾았습니다.` : ''}${confidenceText} 자동 탐지 결과이므로 화면에서 실제 겹침 여부를 확인해야 합니다.`
  }

  if (/broken-navigation/i.test(message)) {
    const url = String(evidence.url || '')
    const title = String(evidence.title || '')
    return `링크 이동 후 오류 페이지가 표시됐습니다.${title ? ` 페이지 제목: “${title}”.` : ''}${url ? ` 확인 위치: ${url}.` : ''}${confidenceText}`
  }

  if (/duplicated-rendering/i.test(message)) {
    const duplicated = (evidence.duplicated_titles || evidence['duplicated titles'] || {}) as Record<string, unknown>
    const entries = Object.entries(duplicated)
    const example = entries[0]
    return `같은 제목이나 링크가 반복 렌더링된 정황을 발견했습니다.${example ? ` “${example[0]}” 항목이 ${example[1]}회 나타났습니다.` : ''}${confidenceText} 의도된 반복 목록인지 확인이 필요합니다.`
  }

  if (/frontend_console_error/i.test(message)) {
    return `브라우저 스크립트 오류가 발생했습니다.${confidenceText} 개발자 콘솔과 해당 동작을 함께 확인해야 합니다.`
  }
  if (/backend_network_error|backend_api_error/i.test(message)) {
    return `페이지가 서버 요청을 정상적으로 처리하지 못했습니다.${confidenceText} 실패한 API 응답을 확인해야 합니다.`
  }

  return `자동 탐색 중 확인이 필요한 동작을 발견했습니다.${confidenceText}`
}

function toDetailedUserMessage(label: LogLabel, message: string) {
  if (label === 'Error' && /confidence=|evidence=/.test(message)) {
    return humanizeFinding(message)
  }

  const step = message.match(
    /episode=(\d+), step=(\d+), action=([^,]+), success=(true|false), newState=(true|false), candidates=(\d+), anomalies=(\d+)(?:, url=(.*))?$/i
  )
  if (step) {
    const [, , , action, success, newState, , anomalies, rawUrl = ''] = step
    const url = rawUrl.replace(/;jsessionid=[^?&#]*/, '')
    const location = /login|signin|lookup/i.test(url) ? ' 해당 화면에서' : ''
    const result =
      success === 'false'
        ? ' 실행에 실패해 원인을 확인하고 있습니다.'
        : newState === 'true'
          ? ' 실행 후 새로운 화면 또는 상태로 이동했습니다.'
          : ' 실행 결과를 확인했으며 화면 상태는 유지됐습니다.'
    const issue = Number(anomalies) > 0 ? ` 확인이 필요한 징후 ${anomalies}건도 발견했습니다.` : ''

    const actionText: Record<string, string> = {
      click_element: `${location} 버튼이나 링크를 클릭했습니다.`,
      fill_input: `${location} 입력 항목에 테스트 값을 입력했습니다.`,
      press_enter: `${location} 입력 내용을 제출했습니다.`,
      inspect_layout: '화면 요소의 배치와 겹침 여부를 검사했습니다.',
      inspect_console: '브라우저 내부 오류 기록을 검사했습니다.',
      inspect_network: '페이지와 서버 사이의 요청·응답을 검사했습니다.',
      inspect_dom: '현재 페이지의 구조와 사용 가능한 요소를 검사했습니다.',
      scroll_down: '페이지 아래쪽으로 이동해 추가 내용을 확인했습니다.',
      scroll_up: '페이지 위쪽으로 이동해 이전 내용을 다시 확인했습니다.',
    }
    return `${actionText[action] || '현재 페이지에서 기능 동작을 실행했습니다.'}${result}${issue}`
  }

  const tick = message.match(/\[TICK\s+\d+\]\s+action=([^,]+),\s+error=(true|false)/i)
  if (tick) {
    const [, action, failed] = tick
    const actionName = action.replace(/_/g, ' ')
    return failed === 'true'
      ? `${actionName} 동작을 실행했지만 정상적으로 완료되지 않아 확인 중입니다.`
      : `${actionName} 동작을 실행하고 결과를 확인했습니다.`
  }

  return toSimpleUserMessage(label, message)
}

function simpleLogLabel(label: LogLabel) {
  if (label === 'Action') return '기능 테스트'
  if (label === 'Navigate') return '페이지 이동'
  if (label === 'State') return '화면 확인'
  if (label === 'Error') return '기능 오류'
  if (label === 'Warning') return '확인 필요'
  if (label === 'Automation') return '자동화 실행 실패'
  if (label === 'Network') return '통신 확인'
  return '자동 분석'
}

function automationFailureMessage(message: string) {
  const text = message.toLowerCase()
  if (/timeout|timed out/.test(text)) {
    return '정해진 시간 안에 대상 요소가 나타나지 않아 자동화 동작을 완료하지 못했습니다.'
  }
  if (/not visible|hidden|detached|no element|not found|selector/.test(text)) {
    return '대상 요소를 찾을 수 없거나 화면에서 사라져 자동화 동작을 완료하지 못했습니다.'
  }
  if (/click|pointer|intercept/.test(text)) {
    return '대상 요소를 클릭하지 못했습니다. 요소가 가려졌거나 위치가 변경됐을 수 있습니다.'
  }
  return 'Playwright가 이번 동작을 완료하지 못했습니다. 사이트 기능 오류와는 별도로 기록합니다.'
}

export function displayLogLabel(label: LogLabel) {
  if (label === 'Action') return '동작'
  if (label === 'Navigate') return '이동'
  if (label === 'State') return '상태'
  if (label === 'Error') return '문제'
  if (label === 'Network') return '네트워크'
  return '분석'
}

function isFailedActionLog(log: LiveLog) {
  return /success\s*=\s*false|action failed|execution failed|\bfailed\b|\berror\b|눌렀지만|실패|오류|문제/i.test(
    log.message
  )
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
  startedAt: string
  endedAt: string
  durationMs: number
  visitedPageCount: number
  totalActionCount: number
  successfulActionCount: number
  failedActionCount: number
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
  const targetUrl = routeState?.targetUrl || ''
  const sessionId = routeState?.sessionId || ''

  const [progress, setProgress] = useState(0)
  const [isStopped, setIsStopped] = useState(false)
  const [sceneIndex, setSceneIndex] = useState(0)
  const [elapsedSeconds, setElapsedSeconds] = useState(0)
  const [showCompleteModal, setShowCompleteModal] = useState(false)
  const [hasCompleted, setHasCompleted] = useState(false)
  const [liveLogs, setLiveLogs] = useState<LiveLog[]>([])
  const [liveIssues, setLiveIssues] = useState<Issue[]>([])
  const [screenshotUrl, setScreenshotUrl] = useState('')
  const [previewMeta, setPreviewMeta] = useState<PreviewMeta | null>(null)
  const [previewLoadFailed, setPreviewLoadFailed] = useState(false)
  const [currentSummary, setCurrentSummary] = useState('대상 사이트를 여는 중입니다.')
  const [sessionStatus, setSessionStatus] = useState<'running' | 'paused' | 'completed' | 'failed'>(
    'running'
  )

  const navigateTimerRef = useRef<number | null>(null)
  const elapsedTimerRef = useRef<number | null>(null)
  const eventSourceRef = useRef<EventSource | null>(null)
  const hasShownCompleteRef = useRef(false)
  const sessionStartedAtRef = useRef(new Date())

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

    const eventSource = new EventSource(apiUrl(`/api/test/${sessionId}/stream`))
    eventSourceRef.current = eventSource

    eventSource.onopen = () => {
      console.log('SSE connected')
    }

    eventSource.onerror = (error) => {
      if (eventSource.readyState !== EventSource.CLOSED) {
        console.warn('SSE connection interrupted; retrying:', error)
      }
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
            eventSource.close()
          }
        }

        if (event.type === 'log') {
          const rawLabel = event.label || 'State'
          if (rawLabel === 'Preview' && event.message) {
            const previewUrl = apiUrl(event.message)
            const parsed = new URL(previewUrl, window.location.origin)
            setPreviewMeta({
              width: Number(parsed.searchParams.get('width') || 0),
              height: Number(parsed.searchParams.get('height') || 0),
              viewportWidth: Number(parsed.searchParams.get('viewportWidth') || 0),
              viewportHeight: Number(parsed.searchParams.get('viewportHeight') || 0),
              mode: parsed.searchParams.get('mode') === 'full_page' ? 'full_page' : 'viewport',
            })
            setPreviewLoadFailed(false)
            setScreenshotUrl(previewUrl)
            return
          }

          const mappedLabel: LogLabel =
            rawLabel === 'Action' ||
            rawLabel === 'State' ||
            rawLabel === 'Error' ||
            rawLabel === 'Network' ||
            rawLabel === 'AI' ||
            rawLabel === 'Navigate'
              ? rawLabel
              : 'State'

          const originalMessage = event.message || ''
          const isAutomationFailure =
            mappedLabel === 'Error' &&
            !/confidence=|evidence=|broken-navigation|layout-overlap|duplicated-rendering/i.test(
              originalMessage
            )
          const displayLabel: LogLabel = isAutomationFailure ? 'Automation' : mappedLabel
          const readableMessage = isAutomationFailure
            ? automationFailureMessage(originalMessage)
            : toDetailedUserMessage(displayLabel, originalMessage)
          if (displayLabel === 'AI') {
            setCurrentSummary(readableMessage)
            return
          }
          if ((event.message || '').includes('[OUTPUT DIR]')) {
            return
          }

          setLiveLogs((prev) => {
            const previous = prev[prev.length - 1]
            if (previous?.label === displayLabel && previous.message === readableMessage) {
              return prev
            }
            return [
              ...prev.slice(-29),
              {
                time: new Date().toLocaleTimeString(),
                label: displayLabel,
                message: readableMessage,
              },
            ]
          })
        }

        if (event.type === 'issue') {
          const issueMessage = event.message || ''
          const confidence = findingConfidence(issueMessage)
          const issueType =
            event.issueType === 'warning' || (confidence > 0 && confidence < 0.6)
              ? 'warning'
              : 'error'
          const issueDetail = humanizeFinding(issueMessage)

          setLiveIssues((prev) => [
            ...prev,
            {
              id: prev.length + 1,
              type: issueType,
              title: issueType === 'warning' ? '확인 필요' : '문제 발견',
              detail: issueDetail,
            },
          ])

          if (event.label === 'Network') {
            setLiveLogs((prev) => [
              ...prev,
              {
                time: new Date().toLocaleTimeString(),
                label: 'Network',
                message: issueDetail,
              },
            ])
          } else if (event.label === 'Error') {
            setLiveLogs((prev) => [
              ...prev,
              {
                time: new Date().toLocaleTimeString(),
                label: issueType === 'warning' ? 'Warning' : 'Error',
                message: issueDetail,
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
    startedAt: sessionStartedAtRef.current.toISOString(),
    endedAt: new Date().toISOString(),
    durationMs: Date.now() - sessionStartedAtRef.current.getTime(),
    visitedPageCount: new Set(
      liveLogs
        .map((log) => log.message.match(/https?:\/\/\S+/)?.[0])
        .filter(Boolean)
    ).size || 1,
    totalActionCount: liveLogs.filter((log) => log.label === 'Action' || log.label === 'Navigate').length,
    successfulActionCount: liveLogs.filter(
      (log) =>
        (log.label === 'Action' || log.label === 'Navigate') &&
        !isFailedActionLog(log)
    ).length,
    failedActionCount: liveLogs.filter(
      (log) => (log.label === 'Action' || log.label === 'Navigate') && isFailedActionLog(log)
    ).length,
  })

  useEffect(() => {
    if (!showCompleteModal) return

    navigateTimerRef.current = window.setTimeout(() => {
      setShowCompleteModal(false)
      const reportState = buildReportState()
      window.sessionStorage.setItem(`jwas-report-${sessionId}`, JSON.stringify(reportState))
      navigate(`/report?sessionId=${encodeURIComponent(sessionId)}`, {
        state: reportState,
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
    const reportState = buildReportState()
    window.sessionStorage.setItem(`jwas-report-${sessionId}`, JSON.stringify(reportState))
    navigate(`/report?sessionId=${encodeURIComponent(sessionId)}`, {
      state: reportState,
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
                        <div className="live-inference-card">
                          <div>
                            <span className="live-inference-kicker">현재 탐색 상태</span>
                            <strong>자동 브라우저가 실제 화면을 검사 중입니다</strong>
                          </div>
                          <p>{currentSummary}</p>
                        </div>

                        {screenshotUrl && (
                          <div
                            className="live-site-screenshot-wrap"
                            style={
                              previewMeta?.width && previewMeta?.height
                                ? {
                                    aspectRatio: `${
                                      previewMeta.viewportWidth || previewMeta.width
                                    } / ${previewMeta.viewportHeight || previewMeta.height}`,
                                  }
                                : undefined
                            }
                          >
                            <img
                              className="live-site-screenshot"
                              src={screenshotUrl}
                              alt="Current page captured by Playwright"
                              onLoad={() => setPreviewLoadFailed(false)}
                              onError={() => setPreviewLoadFailed(true)}
                            />
                            {previewLoadFailed && (
                              <div className="preview-frame-error">화면을 불러오지 못했습니다. 다음 프레임을 기다리는 중입니다.</div>
                            )}
                          </div>
                        )}

                        {!screenshotUrl && currentScene === 'home' && (
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

                        {!screenshotUrl && currentScene === 'product' && (
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

                        {!screenshotUrl && currentScene === 'cart' && (
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

                        {!screenshotUrl && currentScene === 'checkout' && (
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
                        <strong>
                          {previewMeta?.viewportWidth && previewMeta?.viewportHeight
                            ? `${previewMeta.viewportWidth} × ${previewMeta.viewportHeight}`
                            : '확인 중'}
                        </strong>
                      </div>
                      <div className="preview-mini-stat">
                        <span className="preview-mini-label">Capture</span>
                        <strong>
                          {previewMeta?.width && previewMeta?.height
                            ? `${previewMeta.width} × ${previewMeta.height} · ${previewMeta.mode === 'full_page' ? 'Full page' : 'Viewport'}`
                            : sceneMeta[currentScene].title}
                        </strong>
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
                    <h3 className="panel-heading">실시간 테스트 진행</h3>
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
                              [{simpleLogLabel(log.label)}]
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
                    <h3 className="panel-heading">탐지된 문제</h3>
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
                              {issue.type === 'error' ? '중요 문제' : '확인 필요'}
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

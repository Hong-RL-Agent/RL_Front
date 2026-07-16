import { useEffect, useMemo, useState } from 'react'
import { apiUrl } from '../lib/api'

type GraphNode = {
  id: string
  title: string
  url: string
  viewport: string
  firstTick: number
  lastTick: number
  visitCount: number
  findingCount: number
  componentId: number
  depth: number
  orphan: boolean
  orphanReason: string
}

type GraphEdge = {
  id: string
  from: string
  to: string
  tick: number
  actionId: string | null
  actionType: string | null
  actionLabel: string
  executionSuccess: boolean | null
  domChanged: boolean | null
  networkEventsAdded: number
  finding: boolean
  findingReasons: string | null
  capturedAt: string | null
  selfLoop: boolean
}

type GraphResponse = {
  sessionId: string
  runId: string
  availableRuns: string[]
  nodes: GraphNode[]
  edges: GraphEdge[]
  metrics: {
    uniqueStates: number
    transitions: number
    findings: number
    revisitedStates: number
    selfLoops: number
    failedActions: number
    components: number
    orphanStates: number
    danglingEdges: number
  }
}

type Position = { x: number; y: number }
type TickPathGraphProps = { sessionId?: string }

const NODE_WIDTH = 220
const NODE_HEIGHT = 116
const COLUMN_WIDTH = 280
const LANE_HEIGHT = 160

function edgePath(from: Position, to: Position, selfLoop: boolean) {
  const startX = from.x + NODE_WIDTH
  const startY = from.y + NODE_HEIGHT / 2
  if (selfLoop) {
    const centerX = from.x + NODE_WIDTH / 2
    return `M ${centerX - 34} ${from.y} C ${centerX - 54} ${from.y - 64}, ${centerX + 54} ${from.y - 64}, ${centerX + 34} ${from.y}`
  }
  const endX = to.x
  const endY = to.y + NODE_HEIGHT / 2
  const bend = Math.max(45, Math.abs(endX - startX) * 0.45)
  const direction = endX >= startX ? 1 : -1
  return `M ${startX} ${startY} C ${startX + bend * direction} ${startY}, ${endX - bend * direction} ${endY}, ${endX} ${endY}`
}

export default function TickPathGraph({ sessionId }: TickPathGraphProps) {
  const [graph, setGraph] = useState<GraphResponse | null>(null)
  const [selectedRun, setSelectedRun] = useState('')
  const [selectedEdgeId, setSelectedEdgeId] = useState('')
  const [findingOnly, setFindingOnly] = useState(false)
  const [loading, setLoading] = useState(Boolean(sessionId))
  const [error, setError] = useState('')

  useEffect(() => {
    if (!sessionId) { setLoading(false); return }
    const controller = new AbortController()
    const query = selectedRun ? `?runId=${encodeURIComponent(selectedRun)}` : ''
    setLoading(true)
    fetch(apiUrl(`/api/test/${encodeURIComponent(sessionId)}/graph${query}`), { signal: controller.signal })
      .then(async (response) => {
        if (!response.ok) throw new Error('탐색 그래프를 불러오지 못했습니다.')
        return response.json() as Promise<GraphResponse>
      })
      .then((data) => {
        setGraph(data)
        setSelectedRun(data.runId)
        setSelectedEdgeId(data.edges[0]?.id || '')
        setError('')
      })
      .catch((reason) => {
        if (reason?.name !== 'AbortError') setError(reason instanceof Error ? reason.message : '그래프 조회 오류')
      })
      .finally(() => setLoading(false))
    return () => controller.abort()
  }, [sessionId, selectedRun])

  const sortedNodes = useMemo(
    () => [...(graph?.nodes || [])].sort((a, b) => a.firstTick - b.firstTick || a.id.localeCompare(b.id)),
    [graph]
  )
  const positions = useMemo(() => {
    const result = new Map<string, Position>()
    const lanesByDepth = new Map<number, number>()
    sortedNodes.forEach((node) => {
      const depth = node.orphan ? Math.max(0, node.componentId) : Math.max(0, node.depth)
      const lane = lanesByDepth.get(depth) || 0
      lanesByDepth.set(depth, lane + 1)
      result.set(node.id, {
        x: 36 + depth * COLUMN_WIDTH,
        y: node.orphan ? 410 + lane * LANE_HEIGHT : 70 + lane * LANE_HEIGHT,
      })
    })
    return result
  }, [sortedNodes])
  const visibleEdges = (graph?.edges || []).filter((edge) => !findingOnly || edge.finding)
  const visibleNodeIds = new Set(visibleEdges.flatMap((edge) => [edge.from, edge.to]))
  const selectedEdge = graph?.edges.find((edge) => edge.id === selectedEdgeId) || visibleEdges[0]
  const maxDepth = Math.max(0, ...sortedNodes.map((node) => node.orphan ? node.componentId : node.depth))
  const canvasWidth = Math.max(760, 116 + (maxDepth + 1) * COLUMN_WIDTH)
  const canvasHeight = Math.max(590, ...Array.from(positions.values()).map((position) => position.y + NODE_HEIGHT + 50))

  return (
    <section className="report-panel tick-path-panel">
      <div className="panel-top tick-path-head">
        <div>
          <h2 className="panel-title">Exploration Path</h2>
          <p className="panel-desc">동일 상태를 병합해 분기, 반복 방문, self-loop를 표현한 Tick 상태 전이 그래프</p>
        </div>
        <div className="tick-path-controls">
          {(graph?.availableRuns.length || 0) > 1 && (
            <select value={selectedRun} onChange={(event) => setSelectedRun(event.target.value)}>
              {graph?.availableRuns.map((run) => <option key={run} value={run}>{run}</option>)}
            </select>
          )}
          <button className={findingOnly ? 'active' : ''} onClick={() => setFindingOnly((value) => !value)}>
            Findings only
          </button>
        </div>
      </div>

      {loading && <div className="tick-path-empty">상태를 병합하고 전이 그래프를 구성하고 있습니다.</div>}
      {!loading && error && <div className="tick-path-empty error">{error}</div>}
      {!loading && !error && graph?.nodes.length === 0 && <div className="tick-path-empty">저장된 Tick 데이터가 없습니다.</div>}

      {graph && graph.nodes.length > 0 && (
        <>
          <div className="tick-path-metrics">
            <span><strong>{graph.metrics.uniqueStates}</strong> unique states</span>
            <span><strong>{graph.metrics.transitions}</strong> transitions</span>
            <span><strong>{graph.metrics.findings}</strong> findings</span>
            <span><strong>{graph.metrics.revisitedStates}</strong> revisited states</span>
            <span><strong>{graph.metrics.selfLoops}</strong> self-loops</span>
            <span><strong>{graph.metrics.failedActions}</strong> failed actions</span>
            <span><strong>{graph.metrics.components}</strong> components</span>
            <span><strong>{graph.metrics.orphanStates}</strong> orphan states</span>
          </div>

          {(graph.metrics.orphanStates > 0 || graph.metrics.danglingEdges > 0) && (
            <div className="tick-path-warning">
              시작 경로와 연결되지 않은 상태 {graph.metrics.orphanStates}개
              {graph.metrics.danglingEdges > 0 ? ` · 존재하지 않는 노드를 가리키는 전이 ${graph.metrics.danglingEdges}개` : ''}가 있습니다.
              분리된 노드의 설명에서 누락 Tick 또는 run 혼합 여부를 확인하세요.
            </div>
          )}

          <div className="tick-graph-scroll">
            <div className="tick-graph-canvas" style={{ width: canvasWidth, height: canvasHeight }}>
              <svg className="tick-graph-edges" width={canvasWidth} height={canvasHeight} aria-label="Tick transition edges">
                <defs>
                  <marker id="tick-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                    <path d="M 0 0 L 10 5 L 0 10 z" />
                  </marker>
                </defs>
                {visibleEdges.map((edge) => {
                  const from = positions.get(edge.from)
                  const to = positions.get(edge.to)
                  if (!from || !to) return null
                  const path = edgePath(from, to, edge.selfLoop)
                  const labelX = edge.selfLoop ? from.x + NODE_WIDTH / 2 : (from.x + to.x + NODE_WIDTH) / 2
                  const labelY = edge.selfLoop ? from.y - 40 : (from.y + to.y + NODE_HEIGHT) / 2 - 8
                  return (
                    <g key={edge.id} className={`tick-graph-edge ${edge.finding ? 'finding' : ''} ${selectedEdge?.id === edge.id ? 'selected' : ''}`} onClick={() => setSelectedEdgeId(edge.id)}>
                      <path d={path} markerEnd="url(#tick-arrow)" />
                      <rect x={labelX - 47} y={labelY - 12} width="94" height="24" rx="12" />
                      <text x={labelX} y={labelY + 4} textAnchor="middle">T{edge.tick} · {edge.actionLabel.slice(0, 12)}</text>
                    </g>
                  )
                })}
              </svg>

              {sortedNodes.map((node, index) => {
                const position = positions.get(node.id)!
                const dimmed = findingOnly && !visibleNodeIds.has(node.id)
                return (
                  <button
                    key={node.id}
                    className={`tick-state-node ${node.findingCount > 0 ? 'finding' : ''} ${node.visitCount > 1 ? 'revisited' : ''} ${node.orphan ? 'orphan' : ''} ${dimmed ? 'dimmed' : ''}`}
                    style={{ left: position.x, top: position.y }}
                    title={node.orphan ? node.orphanReason : `시작 상태에서 ${node.depth}단계`}
                  >
                    <span>{node.orphan ? `Orphan · component ${node.componentId}` : index === 0 ? 'Start' : node.findingCount > 0 ? 'Finding state' : `Depth ${node.depth}`}</span>
                    <strong>{node.title}</strong>
                    <small>{node.url}</small>
                    <em>{node.viewport} · visits {node.visitCount}</em>
                    {node.orphan && <small className="orphan-reason">{node.orphanReason}</small>}
                  </button>
                )
              })}
            </div>
          </div>

          {selectedEdge && (
            <div className="tick-path-detail">
              <div><span>Selected transition</span><strong>Tick {selectedEdge.tick} · {selectedEdge.actionLabel}</strong></div>
              <div><span>Action type</span><strong>{selectedEdge.actionType || '-'}</strong></div>
              <div><span>Execution</span><strong>{selectedEdge.executionSuccess == null ? '-' : selectedEdge.executionSuccess ? 'Success' : 'Failed'}</strong></div>
              <div><span>DOM</span><strong>{selectedEdge.domChanged == null ? '-' : selectedEdge.domChanged ? 'Changed' : 'Same'}</strong></div>
              <div><span>Network</span><strong>{selectedEdge.networkEventsAdded} events</strong></div>
              <div><span>Finding</span><strong className={selectedEdge.finding ? 'danger' : ''}>{selectedEdge.finding ? selectedEdge.findingReasons || 'Detected' : 'None'}</strong></div>
              <div><span>Structure</span><strong>{selectedEdge.selfLoop ? 'Self-loop' : 'State transition'}</strong></div>
              <div><span>Captured</span><strong>{selectedEdge.capturedAt || '-'}</strong></div>
            </div>
          )}
        </>
      )}
    </section>
  )
}

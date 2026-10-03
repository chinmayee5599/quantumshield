import React, { useState, useMemo } from 'react';
import {
  ZoomIn,
  ZoomOut,
  Maximize2,
  Filter,
  Shield,
  ShieldAlert,
  Server,
  AlertTriangle,
  ArrowRight,
  Info,
  X,
  Lock,
  Layers,
  CheckCircle2,
} from 'lucide-react';
import {
  ScenarioDefinition,
  SyntheticAssetRecord,
  NetworkEdgeRecord,
  ControlRecord,
} from '../data/dataTypes';
import { AttackPathResult, GraphAnalysisResult } from '../core/attackGraph/types';

interface AttackGraphViewProps {
  scenario: ScenarioDefinition;
  graphAnalysis: GraphAnalysisResult;
  selectedControlIds: string[];
}

export const AttackGraphView: React.FC<AttackGraphViewProps> = ({
  scenario,
  graphAnalysis,
  selectedControlIds,
}) => {
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [highlightedPathId, setHighlightedPathId] = useState<string | null>(null);
  const [criticalityFilter, setCriticalityFilter] = useState<'ALL' | 'CRITICAL_HIGH' | 'ENTRY_ONLY'>('ALL');
  const [riskFilter, setRiskFilter] = useState<'ALL' | 'CRITICAL_PATHS' | 'HIGH_PATHS'>('ALL');

  // Zoom & Pan state
  const [zoom, setZoom] = useState<number>(1);
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  // Map of active severed edges
  const activeSeveredEdgeIds = useMemo(() => {
    const edgeSet = new Set<string>();
    const selectedControls = scenario.controls.filter((c: ControlRecord) =>
      selectedControlIds.includes(c.control_id)
    );
    selectedControls.forEach((c: ControlRecord) => {
      c.affected_edges.forEach((eId: string) => edgeSet.add(eId));
    });
    return edgeSet;
  }, [scenario.controls, selectedControlIds]);

  // Highlighted path object
  const activeHighlightedPath = useMemo(() => {
    if (!highlightedPathId) return null;
    return graphAnalysis.paths.find((p: AttackPathResult) => p.pathId === highlightedPathId) || null;
  }, [highlightedPathId, graphAnalysis.paths]);

  // Edges on highlighted path
  const highlightedEdgeSet = useMemo(() => {
    if (!activeHighlightedPath) return new Set<string>();
    return new Set(activeHighlightedPath.edgeSequence);
  }, [activeHighlightedPath]);

  // Selected node object
  const selectedNode = useMemo(() => {
    if (!selectedNodeId) return null;
    return scenario.assets.find((a: SyntheticAssetRecord) => a.asset_id === selectedNodeId) || null;
  }, [selectedNodeId, scenario.assets]);

  // Filtered attack paths
  const filteredPaths = useMemo(() => {
    let list = graphAnalysis.paths;
    if (riskFilter === 'CRITICAL_PATHS') {
      list = list.filter((p: AttackPathResult) => p.compositeRiskScore >= 80);
    } else if (riskFilter === 'HIGH_PATHS') {
      list = list.filter((p: AttackPathResult) => p.compositeRiskScore >= 60);
    }
    return list;
  }, [graphAnalysis.paths, riskFilter]);

  // Node position layout calculation (layered layout from entry to crown jewel)
  const nodeLayout = useMemo(() => {
    const layout = new Map<string, { x: number; y: number; isEntry: boolean; isCrown: boolean }>();
    const width = 900;
    const height = 550;

    // Group assets by zone / tier
    const tiers: Record<string, SyntheticAssetRecord[]> = {
      external: [],
      dmz: [],
      internal: [],
      core: [],
    };

    scenario.assets.forEach((a: SyntheticAssetRecord) => {
      const z = a.network_zone.toLowerCase();
      if (z.includes('external') || z.includes('internet') || z.includes('perimeter')) {
        tiers.external.push(a);
      } else if (z.includes('dmz') || z.includes('edge') || z.includes('public')) {
        tiers.dmz.push(a);
      } else if (z.includes('core') || z.includes('vault') || a.criticality === 'CRITICAL') {
        tiers.core.push(a);
      } else {
        tiers.internal.push(a);
      }
    });

    const tierKeys = ['external', 'dmz', 'internal', 'core'];
    const colSpacing = (width - 160) / (tierKeys.length - 1);

    tierKeys.forEach((tier, colIdx) => {
      const assetsInTier = tiers[tier];
      const rowSpacing = height / (assetsInTier.length + 1);

      assetsInTier.forEach((asset, rowIdx) => {
        const x = 80 + colIdx * colSpacing;
        const y = (rowIdx + 1) * rowSpacing;
        const isEntry = scenario.entry_point_asset_ids.includes(asset.asset_id);
        const isCrown =
          scenario.crown_jewel_asset_ids.includes(asset.asset_id) || asset.criticality === 'CRITICAL';

        layout.set(asset.asset_id, { x, y, isEntry, isCrown });
      });
    });

    return layout;
  }, [scenario]);

  // Handle Pan Drag
  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setPan({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  return (
    <div className="space-y-4">
      {/* Top Filter & Control Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-800 bg-slate-900/70 p-3.5 backdrop-blur-md">
        <div className="flex flex-wrap items-center gap-2">
          {/* Criticality Filter */}
          <div className="flex items-center gap-1 text-xs text-slate-400">
            <Filter className="h-3.5 w-3.5 text-cyan-400" />
            <span>Asset Filter:</span>
          </div>
          <button
            onClick={() => setCriticalityFilter('ALL')}
            className={`rounded px-2.5 py-1 text-xs font-medium transition ${
              criticalityFilter === 'ALL'
                ? 'bg-slate-700 text-cyan-300 font-semibold border border-cyan-500/30'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            All ({scenario.assets.length})
          </button>
          <button
            onClick={() => setCriticalityFilter('CRITICAL_HIGH')}
            className={`rounded px-2.5 py-1 text-xs font-medium transition ${
              criticalityFilter === 'CRITICAL_HIGH'
                ? 'bg-purple-950/60 text-purple-300 font-semibold border border-purple-500/40'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Crown Jewels ({scenario.crown_jewel_asset_ids.length})
          </button>
          <button
            onClick={() => setCriticalityFilter('ENTRY_ONLY')}
            className={`rounded px-2.5 py-1 text-xs font-medium transition ${
              criticalityFilter === 'ENTRY_ONLY'
                ? 'bg-amber-950/60 text-amber-300 font-semibold border border-amber-500/40'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Entry Points ({scenario.entry_point_asset_ids.length})
          </button>

          <span className="mx-1 h-4 w-px bg-slate-800" />

          {/* Risk Level Filter */}
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-slate-400">Path Risk:</span>
            <select
              value={riskFilter}
              onChange={e => setRiskFilter(e.target.value as any)}
              className="rounded border border-slate-700 bg-slate-950 px-2 py-1 text-xs text-slate-200 focus:border-cyan-500 focus:outline-none"
            >
              <option value="ALL">All Paths ({graphAnalysis.paths.length})</option>
              <option value="CRITICAL_PATHS">Critical Risk (Score ≥ 80)</option>
              <option value="HIGH_PATHS">High Risk (Score ≥ 60)</option>
            </select>
          </div>
        </div>

        {/* Zoom & View Controls */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setZoom(z => Math.min(2.5, z + 0.2))}
            title="Zoom In"
            className="flex h-7 w-7 items-center justify-center rounded border border-slate-700 bg-slate-800 text-slate-300 hover:bg-slate-700"
          >
            <ZoomIn className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={() => setZoom(z => Math.max(0.6, z - 0.2))}
            title="Zoom Out"
            className="flex h-7 w-7 items-center justify-center rounded border border-slate-700 bg-slate-800 text-slate-300 hover:bg-slate-700"
          >
            <ZoomOut className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={() => {
              setZoom(1);
              setPan({ x: 0, y: 0 });
            }}
            title="Reset View"
            className="flex h-7 w-7 items-center justify-center rounded border border-slate-700 bg-slate-800 text-slate-300 hover:bg-slate-700"
          >
            <Maximize2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Main Graph Canvas & Side Panel Container */}
      <div className="relative flex flex-col lg:flex-row gap-4">
        {/* Interactive SVG Canvas */}
        <div
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          className={`relative h-[600px] flex-1 overflow-hidden rounded-xl border border-slate-800 bg-slate-950 shadow-inner select-none ${
            isDragging ? 'cursor-grabbing' : 'cursor-grab'
          }`}
        >
          {/* Subtle Grid Background */}
          <div
            className="absolute inset-0 opacity-15 pointer-events-none"
            style={{
              backgroundImage:
                'radial-gradient(circle at 1px 1px, rgba(6, 182, 212, 0.4) 1px, transparent 0)',
              backgroundSize: '24px 24px',
            }}
          />

          <svg
            className="h-full w-full"
            viewBox="0 0 900 550"
            style={{
              transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
              transformOrigin: 'center center',
              transition: isDragging ? 'none' : 'transform 0.1s ease-out',
            }}
          >
            {/* SVG Defs for glowing markers & gradients */}
            <defs>
              <marker
                id="arrow-default"
                viewBox="0 0 10 10"
                refX="22"
                refY="5"
                markerWidth="6"
                markerHeight="6"
                orient="auto-start-reverse"
              >
                <path d="M 0 1 L 8 5 L 0 9 z" fill="#64748b" />
              </marker>

              <marker
                id="arrow-active"
                viewBox="0 0 10 10"
                refX="22"
                refY="5"
                markerWidth="7"
                markerHeight="7"
                orient="auto-start-reverse"
              >
                <path d="M 0 1 L 8 5 L 0 9 z" fill="#f43f5e" />
              </marker>

              <marker
                id="arrow-severed"
                viewBox="0 0 10 10"
                refX="22"
                refY="5"
                markerWidth="7"
                markerHeight="7"
                orient="auto-start-reverse"
              >
                <path d="M 0 1 L 8 5 L 0 9 z" fill="#10b981" />
              </marker>

              <filter id="glow-crown" x="-30%" y="-30%" width="160%" height="160%">
                <feGaussianBlur stdDeviation="5" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
              </filter>

              <filter id="glow-active-path" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="3" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
              </filter>
            </defs>

            {/* Network Zone Backdrop Columns */}
            <g className="zones opacity-20 pointer-events-none">
              <rect x="20" y="20" width="180" height="510" rx="8" fill="#1e293b" />
              <text x="110" y="45" textAnchor="middle" fill="#94a3b8" fontSize="10" fontFamily="monospace">
                EXTERNAL / ENTRY
              </text>

              <rect x="230" y="20" width="190" height="510" rx="8" fill="#1e293b" />
              <text x="325" y="45" textAnchor="middle" fill="#94a3b8" fontSize="10" fontFamily="monospace">
                DMZ & EDGE SERVICES
              </text>

              <rect x="450" y="20" width="190" height="510" rx="8" fill="#1e293b" />
              <text x="545" y="45" textAnchor="middle" fill="#94a3b8" fontSize="10" fontFamily="monospace">
                INTERNAL APPS & DATA
              </text>

              <rect x="670" y="20" width="200" height="510" rx="8" fill="#3b0764" />
              <text x="770" y="45" textAnchor="middle" fill="#c084fc" fontSize="10" fontFamily="monospace">
                CORE VAULT / CROWN JEWELS
              </text>
            </g>

            {/* Attack Transition Edges */}
            <g className="edges">
              {scenario.network_edges.map((edge: NetworkEdgeRecord) => {
                const srcPos = nodeLayout.get(edge.source);
                const tgtPos = nodeLayout.get(edge.destination);
                if (!srcPos || !tgtPos) return null;

                const isSevered = activeSeveredEdgeIds.has(edge.edge_id);
                const isHighlighted = highlightedEdgeSet.has(edge.edge_id);

                let strokeColor = '#334155';
                let strokeWidth = 1.5;
                let strokeDash = undefined;
                let markerEnd = 'url(#arrow-default)';

                if (isSevered) {
                  strokeColor = '#10b981';
                  strokeWidth = 2.5;
                  strokeDash = '4,4';
                  markerEnd = 'url(#arrow-severed)';
                } else if (isHighlighted) {
                  strokeColor = '#f43f5e';
                  strokeWidth = 3;
                  markerEnd = 'url(#arrow-active)';
                }

                // Midpoint for protocol / CVE tag
                const midX = (srcPos.x + tgtPos.x) / 2;
                const midY = (srcPos.y + tgtPos.y) / 2;

                return (
                  <g key={edge.edge_id} className="transition-all">
                    <line
                      x1={srcPos.x}
                      y1={srcPos.y}
                      x2={tgtPos.x}
                      y2={tgtPos.y}
                      stroke={strokeColor}
                      strokeWidth={strokeWidth}
                      strokeDasharray={strokeDash}
                      markerEnd={markerEnd}
                      filter={isHighlighted ? 'url(#glow-active-path)' : undefined}
                    />

                    {/* Edge Label (Protocol or CVE) */}
                    {(isHighlighted || isSevered) && (
                      <g transform={`translate(${midX}, ${midY})`}>
                        <rect
                          x="-35"
                          y="-10"
                          width="70"
                          height="18"
                          rx="4"
                          fill={isSevered ? '#064e3b' : '#881337'}
                          stroke={isSevered ? '#10b981' : '#f43f5e'}
                          strokeWidth="1"
                        />
                        <text
                          x="0"
                          y="2"
                          textAnchor="middle"
                          fill="#ffffff"
                          fontSize="9"
                          fontFamily="monospace"
                        >
                          {isSevered ? 'BLOCKED' : edge.protocol.slice(0, 10)}
                        </text>
                      </g>
                    )}
                  </g>
                );
              })}
            </g>

            {/* Asset Nodes */}
            <g className="nodes">
              {scenario.assets.map((asset: SyntheticAssetRecord) => {
                const pos = nodeLayout.get(asset.asset_id);
                if (!pos) return null;

                // Check filter visibility
                if (criticalityFilter === 'CRITICAL_HIGH' && !pos.isCrown) {
                  return null;
                }
                if (criticalityFilter === 'ENTRY_ONLY' && !pos.isEntry) {
                  return null;
                }

                const isSelected = selectedNodeId === asset.asset_id;
                const isCrown = pos.isCrown;
                const isEntry = pos.isEntry;

                let fill = '#0f172a';
                let stroke = '#0284c7';
                let r = 16;

                if (isCrown) {
                  fill = '#581c87';
                  stroke = '#c084fc';
                  r = 20;
                } else if (isEntry) {
                  fill = '#78350f';
                  stroke = '#f59e0b';
                  r = 18;
                } else if (isSelected) {
                  stroke = '#38bdf8';
                  r = 19;
                }

                return (
                  <g
                    key={asset.asset_id}
                    transform={`translate(${pos.x}, ${pos.y})`}
                    onClick={e => {
                      e.stopPropagation();
                      setSelectedNodeId(asset.asset_id);
                    }}
                    className="cursor-pointer transition-transform hover:scale-110"
                  >
                    {/* Glowing outer ring for Crown Jewels */}
                    {isCrown && (
                      <circle
                        cx="0"
                        cy="0"
                        r={r + 8}
                        fill="none"
                        stroke="#a855f7"
                        strokeWidth="1.5"
                        opacity="0.6"
                        filter="url(#glow-crown)"
                      />
                    )}

                    {/* Outer ring on selection */}
                    {isSelected && (
                      <circle
                        cx="0"
                        cy="0"
                        r={r + 6}
                        fill="none"
                        stroke="#38bdf8"
                        strokeWidth="2"
                        strokeDasharray="3,3"
                      />
                    )}

                    {/* Main Node Circle */}
                    <circle
                      cx="0"
                      cy="0"
                      r={r}
                      fill={fill}
                      stroke={stroke}
                      strokeWidth={isSelected ? 3 : 2}
                    />

                    {/* Node Icon / Letter */}
                    <text
                      x="0"
                      y="4"
                      textAnchor="middle"
                      fill="#ffffff"
                      fontSize="10"
                      fontWeight="bold"
                      fontFamily="monospace"
                      pointerEvents="none"
                    >
                      {isCrown ? 'CJ' : isEntry ? 'IN' : 'AS'}
                    </text>

                    {/* Node Label Below */}
                    <text
                      x="0"
                      y={r + 14}
                      textAnchor="middle"
                      fill={isCrown ? '#d8b4fe' : '#94a3b8'}
                      fontSize="9"
                      fontFamily="monospace"
                      fontWeight={isCrown ? 'bold' : 'normal'}
                      pointerEvents="none"
                    >
                      {asset.asset_name.slice(0, 16)}
                    </text>
                  </g>
                );
              })}
            </g>
          </svg>

          {/* Canvas Legend */}
          <div className="absolute bottom-3 left-3 flex flex-wrap items-center gap-3 rounded-lg border border-slate-800 bg-slate-900/90 px-3 py-1.5 text-[11px] font-mono backdrop-blur-sm">
            <span className="flex items-center gap-1.5 text-amber-400">
              <span className="h-2 w-2 rounded-full bg-amber-500" /> Entry Point
            </span>
            <span className="flex items-center gap-1.5 text-cyan-400">
              <span className="h-2 w-2 rounded-full bg-cyan-500" /> Internal Node
            </span>
            <span className="flex items-center gap-1.5 text-purple-400">
              <span className="h-2 w-2 rounded-full bg-purple-500 shadow-[0_0_8px_rgba(168,85,247,0.8)]" /> Crown Jewel
            </span>
            <span className="flex items-center gap-1.5 text-rose-400">
              <span className="h-0.5 w-3 bg-rose-500" /> Active Attack Path
            </span>
            <span className="flex items-center gap-1.5 text-emerald-400">
              <span className="h-0.5 w-3 border-t border-dashed border-emerald-400" /> Severed Edge
            </span>
          </div>
        </div>

        {/* Side Panel: Attack Paths List & Node Inspector */}
        <div className="w-full lg:w-80 space-y-4">
          {/* Node Inspector Panel (when a node is clicked) */}
          {selectedNode ? (
            <div className="rounded-xl border border-cyan-500/40 bg-slate-900/90 p-4 shadow-lg">
              <div className="flex items-start justify-between border-b border-slate-800 pb-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-1.5">
                    <span className="rounded bg-cyan-500/10 px-1.5 py-0.5 text-[10px] font-mono text-cyan-400">
                      {selectedNode.asset_type}
                    </span>
                    <span
                      className={`rounded px-1.5 py-0.5 text-[10px] font-mono font-semibold ${
                        selectedNode.criticality === 'CRITICAL'
                          ? 'bg-purple-500/20 text-purple-300'
                          : selectedNode.criticality === 'HIGH'
                          ? 'bg-red-500/20 text-red-300'
                          : 'bg-slate-800 text-slate-300'
                      }`}
                    >
                      {selectedNode.criticality}
                    </span>
                  </div>
                  <h3 className="text-sm font-bold text-white">{selectedNode.asset_name}</h3>
                </div>
                <button
                  onClick={() => setSelectedNodeId(null)}
                  className="rounded p-1 text-slate-400 hover:bg-slate-800 hover:text-white"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="mt-3 space-y-2.5 text-xs text-slate-300">
                <div className="flex justify-between">
                  <span className="text-slate-400">Network Zone:</span>
                  <span className="font-mono text-cyan-400">{selectedNode.network_zone}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Trust Level:</span>
                  <span className="font-mono text-white font-bold">{selectedNode.trust_level} / 5</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Crown Jewel Status:</span>
                  <span
                    className={`font-semibold ${
                      scenario.crown_jewel_asset_ids.includes(selectedNode.asset_id) ? 'text-purple-400' : 'text-slate-500'
                    }`}
                  >
                    {scenario.crown_jewel_asset_ids.includes(selectedNode.asset_id) ? 'YES (Primary Target)' : 'No'}
                  </span>
                </div>

                {/* Assigned CVEs List */}
                <div className="pt-2 border-t border-slate-800">
                  <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    Assigned Vulnerabilities ({selectedNode.assigned_cves.length})
                  </span>
                  <div className="mt-2 space-y-2 max-h-40 overflow-y-auto pr-1">
                    {selectedNode.assigned_cves.map((cveId: string) => {
                      const vuln = scenario.vulnerabilities.find(v => v.cve_id === cveId);
                      return (
                        <div
                          key={cveId}
                          className="rounded border border-red-500/20 bg-red-950/20 p-2 text-[11px]"
                        >
                          <div className="flex items-center justify-between font-mono">
                            <span className="text-red-400 font-bold">{cveId}</span>
                            <span className="rounded bg-red-500/20 px-1 text-[10px] text-red-300">
                              CVSS {vuln?.cvss_v3_base_score || '8.5'}
                            </span>
                          </div>
                          <p className="mt-1 text-slate-400 line-clamp-2">{vuln?.description || 'Known vulnerability'}</p>
                        </div>
                      );
                    })}
                    {selectedNode.assigned_cves.length === 0 && (
                      <p className="text-slate-500 italic">No direct CVEs registered on this node.</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-4 text-center">
              <Info className="mx-auto h-6 w-6 text-slate-500" />
              <p className="mt-2 text-xs font-medium text-slate-300">Click any node on the graph</p>
              <p className="mt-1 text-[11px] text-slate-500">
                Inspect vulnerability profiles, criticality scores, and network connectivity.
              </p>
            </div>
          )}

          {/* Quick Path Illuminator */}
          <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <span className="text-xs font-semibold text-white uppercase tracking-wider">
                Attack Trajectories ({filteredPaths.length})
              </span>
              {highlightedPathId && (
                <button
                  onClick={() => setHighlightedPathId(null)}
                  className="text-[10px] text-cyan-400 hover:underline"
                >
                  Clear Path
                </button>
              )}
            </div>

            <p className="mt-2 text-[11px] text-slate-400">
              Select an attack path below to illuminate its entire trajectory on the graph:
            </p>

            <div className="mt-3 space-y-2 max-h-60 overflow-y-auto pr-1">
              {filteredPaths.map((p: AttackPathResult) => {
                const isSelected = highlightedPathId === p.pathId;
                const isSevered = p.edgeSequence.some((eId: string) => activeSeveredEdgeIds.has(eId));

                return (
                  <div
                    key={p.pathId}
                    onClick={() => setHighlightedPathId(isSelected ? null : p.pathId)}
                    className={`cursor-pointer rounded-lg border p-2.5 text-xs transition ${
                      isSelected
                        ? 'border-rose-500 bg-rose-950/30'
                        : isSevered
                        ? 'border-slate-800 bg-slate-950/40 hover:border-slate-700'
                        : 'border-slate-800/80 bg-slate-950/70 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-slate-200 truncate max-w-[170px]">
                        {p.name}
                      </span>
                      <span
                        className={`rounded px-1.5 py-0.2 text-[10px] font-mono font-bold ${
                          p.compositeRiskScore >= 80
                            ? 'text-red-400 bg-red-950/40 border border-red-500/30'
                            : 'text-amber-400 bg-amber-950/40 border border-amber-500/30'
                        }`}
                      >
                        Risk {p.compositeRiskScore}
                      </span>
                    </div>

                    <div className="mt-1 flex items-center justify-between text-[11px] text-slate-400">
                      <span>{p.length} transitions</span>
                      <span className={isSevered ? 'text-emerald-400 font-mono' : 'text-rose-400 font-mono'}>
                        {isSevered ? '✓ Severed' : '⚠ Active'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

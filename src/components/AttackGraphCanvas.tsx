import React, { useState } from 'react';
import { CyberScenario, DefensiveControl, NetworkEdge, NetworkNode } from '../types/cyber';
import { Shield, ShieldAlert, Key, Server, Database, Globe, Lock, Cpu } from 'lucide-react';

interface AttackGraphCanvasProps {
  scenario: CyberScenario;
  activeControlIds: string[];
  controls: DefensiveControl[];
  hoveredPathEdgeIds?: string[];
  selectedPathEdgeIds?: string[];
  onSelectNode?: (node: NetworkNode) => void;
  onSelectEdge?: (edge: NetworkEdge) => void;
}

export const AttackGraphCanvas: React.FC<AttackGraphCanvasProps> = ({
  scenario,
  activeControlIds,
  controls,
  hoveredPathEdgeIds = [],
  selectedPathEdgeIds = [],
  onSelectNode,
  onSelectEdge,
}) => {
  const [activeItem, setActiveItem] = useState<{ type: 'node' | 'edge'; data: any } | null>(null);

  // Compute which edges are severed by currently active controls
  const severedEdgeMap = new Map<string, string[]>();
  const activeControls = controls.filter(c => activeControlIds.includes(c.id));
  for (const ctrl of activeControls) {
    for (const edgeId of ctrl.mitigatesEdges) {
      const existing = severedEdgeMap.get(edgeId) || [];
      existing.push(ctrl.shortCode);
      severedEdgeMap.set(edgeId, existing);
    }
  }

  const getNodeIcon = (tier: string) => {
    switch (tier) {
      case 'dmz':
      case 'perimeter':
        return Globe;
      case 'identity':
        return Key;
      case 'core_server':
        return Cpu;
      case 'crown_jewel':
        return Database;
      default:
        return Server;
    }
  };

  const getNodeColor = (node: NetworkNode) => {
    if (node.status === 'compromised_entry') {
      return {
        bg: 'fill-red-950/80 stroke-red-500',
        badge: 'text-red-400 bg-red-950/50 border-red-800',
        text: 'text-red-200',
      };
    }
    if (node.status === 'crown_jewel') {
      return {
        bg: 'fill-amber-950/80 stroke-amber-400',
        badge: 'text-amber-400 bg-amber-950/50 border-amber-700',
        text: 'text-amber-200',
      };
    }
    if (node.tier === 'identity') {
      return {
        bg: 'fill-purple-950/80 stroke-purple-500',
        badge: 'text-purple-400 bg-purple-950/50 border-purple-800',
        text: 'text-purple-200',
      };
    }
    return {
      bg: 'fill-slate-900/90 stroke-cyan-500/70',
      badge: 'text-cyan-400 bg-cyan-950/50 border-cyan-800',
      text: 'text-slate-200',
    };
  };

  return (
    <div className="bg-slate-900/80 border border-slate-800 rounded-xl overflow-hidden flex flex-col">
      {/* Header bar */}
      <div className="px-5 py-3 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ShieldAlert className="w-4 h-4 text-cyan-400" />
          <span className="text-xs font-bold uppercase tracking-wider text-slate-200">
            Interactive Attack Graph Topology
          </span>
        </div>
        <div className="flex items-center gap-4 text-[11px] text-slate-400 font-mono">
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-0.5 bg-red-400 rounded-full" />
            <span>Open Attack Vector</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-0.5 border-t border-dashed border-cyan-400" />
            <span>Severed by Defense</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-amber-400" />
            <span>Crown Jewel</span>
          </span>
        </div>
      </div>

      {/* SVG Canvas Area */}
      <div className="relative w-full overflow-x-auto bg-gradient-to-b from-slate-950 via-slate-900/90 to-slate-950 p-4 min-h-[380px] flex items-center justify-center">
        <svg
          viewBox="0 0 880 400"
          className="w-full max-w-[880px] h-auto select-none"
          style={{ minWidth: '700px' }}
        >
          <defs>
            {/* Standard Open Arrow */}
            <marker
              id="arrow-open"
              viewBox="0 0 10 10"
              refX="18"
              refY="5"
              markerWidth="6"
              markerHeight="6"
              orient="auto-start-reverse"
            >
              <path d="M 0 1 L 10 5 L 0 9 z" fill="#ef4444" />
            </marker>
            {/* Highlighted Arrow */}
            <marker
              id="arrow-highlight"
              viewBox="0 0 10 10"
              refX="18"
              refY="5"
              markerWidth="7"
              markerHeight="7"
              orient="auto-start-reverse"
            >
              <path d="M 0 1 L 10 5 L 0 9 z" fill="#38bdf8" />
            </marker>
            {/* Severed Arrow */}
            <marker
              id="arrow-severed"
              viewBox="0 0 10 10"
              refX="18"
              refY="5"
              markerWidth="5"
              markerHeight="5"
              orient="auto-start-reverse"
            >
              <path d="M 0 1 L 10 5 L 0 9 z" fill="#64748b" />
            </marker>
          </defs>

          {/* Background Grid Pattern */}
          <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
            <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(51, 65, 85, 0.15)" strokeWidth="1" />
          </pattern>
          <rect width="880" height="400" fill="url(#grid)" />

          {/* Draw Edges */}
          {scenario.edges.map(edge => {
            const sourceNode = scenario.nodes.find(n => n.id === edge.source);
            const targetNode = scenario.nodes.find(n => n.id === edge.target);
            if (!sourceNode || !targetNode) return null;

            const isSevered = severedEdgeMap.has(edge.id);
            const isHovered = hoveredPathEdgeIds.includes(edge.id);
            const isSelected = selectedPathEdgeIds.includes(edge.id);

            // Compute midpoint and curve offset
            const dx = targetNode.x - sourceNode.x;
            const dy = targetNode.y - sourceNode.y;
            const mx = (sourceNode.x + targetNode.x) / 2;
            const my = (sourceNode.y + targetNode.y) / 2;

            // Subtle curve for visual appeal
            const cx = mx;
            const cy = my - (Math.abs(dx) > 150 && Math.abs(dy) < 50 ? 25 : 0);

            let strokeColor = '#ef4444'; // Red for open exploit
            let strokeWidth = 2;
            let marker = 'url(#arrow-open)';
            let strokeDasharray = 'none';

            if (isSevered) {
              strokeColor = '#64748b'; // Muted slate for cut edge
              marker = 'url(#arrow-severed)';
              strokeDasharray = '4 4';
              strokeWidth = 1.5;
            } else if (isHovered || isSelected) {
              strokeColor = '#38bdf8'; // Cyan highlight
              strokeWidth = 3.5;
              marker = 'url(#arrow-highlight)';
            }

            return (
              <g
                key={edge.id}
                className="cursor-pointer transition-all"
                onClick={() => {
                  setActiveItem({ type: 'edge', data: edge });
                  if (onSelectEdge) onSelectEdge(edge);
                }}
              >
                {/* Hit target padding */}
                <path
                  d={`M ${sourceNode.x} ${sourceNode.y} Q ${cx} ${cy} ${targetNode.x} ${targetNode.y}`}
                  fill="none"
                  stroke="transparent"
                  strokeWidth="16"
                />
                {/* Visible Path */}
                <path
                  d={`M ${sourceNode.x} ${sourceNode.y} Q ${cx} ${cy} ${targetNode.x} ${targetNode.y}`}
                  fill="none"
                  stroke={strokeColor}
                  strokeWidth={strokeWidth}
                  strokeDasharray={strokeDasharray}
                  markerEnd={marker}
                  className="transition-colors duration-200"
                />

                {/* Severed Shield Icon or Protocol Badge */}
                {isSevered ? (
                  <g transform={`translate(${cx - 9}, ${cy - 9})`}>
                    <rect
                      x="0"
                      y="0"
                      width="18"
                      height="18"
                      rx="4"
                      fill="#0284c7"
                      stroke="#38bdf8"
                      strokeWidth="1"
                    />
                    <path
                      d="M 9 3 L 15 5 L 15 9 C 15 13 9 15 9 15 C 9 15 3 13 3 9 L 3 5 Z"
                      fill="none"
                      stroke="#ffffff"
                      strokeWidth="1.2"
                    />
                  </g>
                ) : (
                  <g transform={`translate(${cx - 24}, ${cy - 8})`}>
                    <rect
                      x="0"
                      y="0"
                      width="48"
                      height="15"
                      rx="3"
                      fill="#0f172a"
                      stroke={isHovered ? '#38bdf8' : '#334155'}
                      strokeWidth="0.8"
                    />
                    <text
                      x="24"
                      y="11"
                      textAnchor="middle"
                      fill={isHovered ? '#38bdf8' : '#94a3b8'}
                      fontSize="9"
                      fontFamily="JetBrains Mono"
                    >
                      {edge.port > 0 ? `:${edge.port}` : edge.protocol}
                    </text>
                  </g>
                )}
              </g>
            );
          })}

          {/* Draw Nodes */}
          {scenario.nodes.map(node => {
            const colors = getNodeColor(node);
            const IconComponent = getNodeIcon(node.tier);

            return (
              <g
                key={node.id}
                transform={`translate(${node.x}, ${node.y})`}
                className="cursor-pointer group"
                onClick={() => {
                  setActiveItem({ type: 'node', data: node });
                  if (onSelectNode) onSelectNode(node);
                }}
              >
                {/* Outer Glow / Halo */}
                <circle
                  r="28"
                  className={`${colors.bg} transition-all duration-300 group-hover:scale-110 shadow-lg`}
                  strokeWidth="2"
                />

                {/* Inner Icon */}
                <foreignObject x="-12" y="-12" width="24" height="24">
                  <div className="w-full h-full flex items-center justify-center pointer-events-none">
                    <IconComponent className={`w-4 h-4 ${colors.text}`} />
                  </div>
                </foreignObject>

                {/* Node Label Below */}
                <text
                  y="42"
                  textAnchor="middle"
                  className="fill-slate-200 text-[11px] font-medium tracking-tight select-none"
                >
                  {node.label}
                </text>

                {/* IP address micro text */}
                <text
                  y="54"
                  textAnchor="middle"
                  className="fill-slate-500 text-[9px] font-mono select-none"
                >
                  {node.ip}
                </text>
              </g>
            );
          })}
        </svg>

        {/* Selected Detail Inspector Overlay */}
        {activeItem && (
          <div className="absolute top-4 right-4 bg-slate-950/95 border border-slate-700/80 rounded-lg p-3.5 max-w-xs shadow-xl text-xs backdrop-blur-md z-10 animate-in fade-in">
            <div className="flex items-center justify-between mb-2 pb-1.5 border-b border-slate-800">
              <span className="font-bold text-slate-200">
                {activeItem.type === 'node' ? 'Asset Inspector' : 'Attack Step Details'}
              </span>
              <button
                onClick={() => setActiveItem(null)}
                className="text-slate-400 hover:text-white px-1 font-mono"
              >
                ✕
              </button>
            </div>

            {activeItem.type === 'node' ? (
              <div className="space-y-1.5">
                <div className="font-semibold text-cyan-300">{activeItem.data.name}</div>
                <div className="text-slate-400">{activeItem.data.description}</div>
                <div className="flex items-center justify-between pt-1 border-t border-slate-800 font-mono text-[11px]">
                  <span className="text-slate-500">Tier: {activeItem.data.tier}</span>
                  <span className="text-amber-400">Value: {activeItem.data.assetValue}/100</span>
                </div>
              </div>
            ) : (
              <div className="space-y-1.5">
                <div className="font-semibold text-red-300">{activeItem.data.technique}</div>
                <div className="text-slate-400">{activeItem.data.description}</div>
                {activeItem.data.cveId && (
                  <div className="font-mono text-cyan-400">{activeItem.data.cveId} (CVSS {activeItem.data.cvssBaseScore})</div>
                )}
                <div className="flex items-center justify-between pt-1 border-t border-slate-800 font-mono text-[11px]">
                  <span className="text-slate-500">MITRE: {activeItem.data.mitreId}</span>
                  <span className="text-amber-400">Likelihood: {(activeItem.data.exploitLikelihood * 100).toFixed(0)}%</span>
                </div>
                {severedEdgeMap.has(activeItem.data.id) && (
                  <div className="mt-1.5 bg-cyan-950/50 border border-cyan-800/80 p-1.5 rounded text-[11px] text-cyan-300">
                    ✓ Severed by: {severedEdgeMap.get(activeItem.data.id)?.join(', ')}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

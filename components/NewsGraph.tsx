import React, { useEffect, useRef, useState } from 'react';
import type { GraphData, GraphNode } from '../types';

interface NewsGraphProps {
  data: GraphData;
  onNodeClick: (node: GraphNode) => void;
  isApiBusy: boolean;
}

export const NewsGraph: React.FC<NewsGraphProps> = ({ data, onNodeClick, isApiBusy }) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (!data || !svgRef.current || !containerRef.current) return;
    
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const d3 = (window as any).d3;
    if (!d3) {
      console.error("D3.js not loaded");
      return;
    }

    const { nodes, links } = data;

    // Data integrity check: Ensure links only connect existing nodes.
    const nodeIds = new Set(nodes.map(n => n.id));
    const filteredLinks = links.filter(l => nodeIds.has(l.source as string) && nodeIds.has(l.target as string));

    // Calculate node degrees for dynamic sizing
    const degrees = new Map<string, number>();
    filteredLinks.forEach(link => {
        const sourceId = (link.source as any).id || link.source;
        const targetId = (link.target as any).id || link.target;
        degrees.set(sourceId, (degrees.get(sourceId) || 0) + 1);
        degrees.set(targetId, (degrees.get(targetId) || 0) + 1);
    });
    
    const getNodeRadius = (d: any) => 5 + (degrees.get(d.id) || 0) * 2;

    const container = containerRef.current;
    const { width, height } = container.getBoundingClientRect();
    
    const svg = d3.select(svgRef.current)
        .attr('width', width)
        .attr('height', height)
        .attr('viewBox', [-width / 2, -height / 2, width, height]);

    svg.selectAll("*").remove(); // Clear previous graph
    
    // --- New Clustering and Styling Logic ---
    const clusterCenters: Record<string, {x: number, y: number}> = {
        'موضوع': { x: 0, y: -height / 3.5 },
        'شخص': { x: -width / 3.5, y: height / 4 },
        'سازمان': { x: width / 3.5, y: height / 4 },
        'مکان': { x: 0, y: height / 3.5 },
    };
    
    const getLinkStyle = (d: any) => {
        if (d.source.group === 'موضوع' || d.target.group === 'موضوع') {
            return "3,3"; // Dashed line for topic connections
        }
        return null; // Solid line for direct entity interactions
    };
    // --- End of New Logic ---

    const simulation = d3.forceSimulation(nodes)
      .force("link", d3.forceLink(filteredLinks).id((d: any) => d.id).distance(120))
      .force("charge", d3.forceManyBody().strength(-200))
      // Add clustering forces based on node group
      .force("x", d3.forceX().strength(0.15).x((d: any) => clusterCenters[d.group]?.x || 0))
      .force("y", d3.forceY().strength(0.15).y((d: any) => clusterCenters[d.group]?.y || 0))
      .force("collide", d3.forceCollide().radius((d: any) => getNodeRadius(d) + 5).iterations(2));

    const color = d3.scaleOrdinal(d3.schemeTableau10);

    const link = svg.append("g")
      .selectAll("line")
      .data(filteredLinks)
      .join("line")
        .attr("stroke", "#4A5568") // gray-600
        .attr("stroke-opacity", 0.6)
        .attr("stroke-width", (d: any) => 1.5 * Math.sqrt(d.value))
        .attr("stroke-dasharray", getLinkStyle);


    const node = svg.append("g")
      .selectAll("g")
      .data(nodes)
      .join("g")
      .attr("class", isApiBusy ? 'cursor-not-allowed' : 'cursor-pointer')
      .on("click", isApiBusy ? null : (_event: MouseEvent, d: any) => onNodeClick(d as GraphNode));

    node.append("circle")
        .attr("r", getNodeRadius)
        .attr("fill", (d: any) => color(d.group))
        .attr("stroke", (d: any) => {
            if (d.sentiment === 'Positive') return '#34D399'; // green-400
            if (d.sentiment === 'Negative') return '#F87171'; // red-400
            return '#1A202C'; // default stroke
        })
        .attr("stroke-width", (d: any) => d.sentiment && d.sentiment !== 'Neutral' ? 3 : 2);

    const text = node.append("text")
      .attr("x", (d: any) => getNodeRadius(d) + 5)
      .attr("y", "0.35em")
      .text((d: any) => d.id)
      .attr('fill', '#E2E8F0')
      .style('font-size', '12px')
      .style('pointer-events', 'none');

    const drag = (simulation: any) => {
      function dragstarted(event: any, d: any) { if (!event.active) simulation.alphaTarget(0.3).restart(); d.fx = d.x; d.fy = d.y; }
      function dragged(event: any, d: any) { d.fx = event.x; d.fy = event.y; }
      function dragended(event: any, d: any) { if (!event.active) simulation.alphaTarget(0); d.fx = null; d.fy = null; }
      return d3.drag().on("start", dragstarted).on("drag", dragged).on("end", dragended);
    }
    
    node.call(drag(simulation));

    // Search and highlight logic
    const lowerCaseSearchTerm = searchTerm.trim().toLowerCase();
    let highlightedNodes = new Set();

    if (lowerCaseSearchTerm) {
        nodes.forEach((n: any) => {
            if (n.id.toLowerCase().includes(lowerCaseSearchTerm)) {
                highlightedNodes.add(n.id);
                filteredLinks.forEach((l: any) => {
                    const sourceId = (l.source as any).id || l.source;
                    const targetId = (l.target as any).id || l.target;
                    if (sourceId === n.id) highlightedNodes.add(targetId);
                    if (targetId === n.id) highlightedNodes.add(sourceId);
                });
            }
        });
    }

    const getOpacity = (d: any, isLink = false) => {
        const isHighlighted = !lowerCaseSearchTerm || (isLink ? (highlightedNodes.has(d.source.id) && highlightedNodes.has(d.target.id)) : highlightedNodes.has(d.id));
        if (isApiBusy) {
            return isHighlighted ? 0.5 : 0.1;
        }
        return isHighlighted ? (isLink ? 0.6 : 1) : (isLink ? 0.05 : 0.1);
    };

    node.style('opacity', (d: any) => getOpacity(d));
    text.style('opacity', (d: any) => getOpacity(d));
    link.style('stroke-opacity', (l: any) => getOpacity(l, true));
    
    simulation.on("tick", () => {
      link
          .attr("x1", (d: any) => d.source.x)
          .attr("y1", (d: any) => d.source.y)
          .attr("x2", (d: any) => d.target.x)
          .attr("y2", (d: any) => d.target.y);
      node.attr("transform", (d: any) => `translate(${d.x},${d.y})`);
    });

    const zoom = d3.zoom().scaleExtent([0.1, 4]).on('zoom', (event: any) => {
        svg.selectAll('g').attr('transform', event.transform);
    });
    svg.call(zoom);

  }, [data, onNodeClick, searchTerm, isApiBusy]);

  return (
    <div className="w-full h-full flex flex-col">
       <div className="relative mb-4">
            <input
                type="text"
                placeholder="جستجو در گراف..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full bg-gray-800/80 border border-gray-700 rounded-lg py-2 pr-10 pl-4 text-white placeholder-gray-400 focus:ring-2 focus:ring-cyan-500 focus:outline-none transition-all"
            />
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                </svg>
            </div>
        </div>
        <div ref={containerRef} className="w-full h-full flex-grow min-h-0">
            <svg ref={svgRef}></svg>
        </div>
    </div>
  );
};
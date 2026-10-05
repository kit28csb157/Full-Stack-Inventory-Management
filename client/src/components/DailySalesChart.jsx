import React, { useState } from 'react';
import { DollarSign, Package, TrendingUp } from 'lucide-react';

const DailySalesChart = ({ chartData = [], periodLabel = 'Today', metricType = 'revenue', setMetricType }) => {
    const [hoveredIndex, setHoveredIndex] = useState(null);

    if (!chartData || chartData.length === 0) {
        return (
            <div style={{ padding: '30px', textAlign: 'center', color: '#95a5a6' }}>
                No sales data recorded for {periodLabel.toLowerCase()}.
            </div>
        );
    }

    const isRevenue = metricType === 'revenue';
    const values = chartData.map(d => (isRevenue ? Number(d.revenue || 0) : Number(d.units || 0)));
    const maxVal = Math.max(...values, 10);
    const totalVal = values.reduce((a, b) => a + b, 0);

    // SVG coordinate calculations
    const svgWidth = 700;
    const svgHeight = 220;
    const paddingLeft = 55;
    const paddingRight = 20;
    const paddingTop = 25;
    const paddingBottom = 40;
    const chartW = svgWidth - paddingLeft - paddingRight;
    const chartH = svgHeight - paddingTop - paddingBottom;

    const barWidth = Math.min(36, Math.max(16, (chartW / chartData.length) * 0.55));
    const stepX = chartW / chartData.length;

    return (
        <div style={{ width: '100%' }}>
            {/* Chart Control Header */}
            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '12px',
                marginBottom: '16px'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{
                        display: 'inline-flex',
                        background: '#f0f4f8',
                        padding: '3px',
                        borderRadius: '6px'
                    }}>
                        <button
                            type="button"
                            onClick={() => setMetricType && setMetricType('revenue')}
                            style={{
                                border: 'none',
                                background: isRevenue ? '#3498db' : 'transparent',
                                color: isRevenue ? '#fff' : '#555',
                                padding: '6px 12px',
                                borderRadius: '4px',
                                fontSize: '0.82rem',
                                fontWeight: '600',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '5px',
                                transition: 'all 0.2s'
                            }}
                        >
                            <DollarSign size={14} /> Revenue ($)
                        </button>
                        <button
                            type="button"
                            onClick={() => setMetricType && setMetricType('units')}
                            style={{
                                border: 'none',
                                background: !isRevenue ? '#2ecc71' : 'transparent',
                                color: !isRevenue ? '#fff' : '#555',
                                padding: '6px 12px',
                                borderRadius: '4px',
                                fontSize: '0.82rem',
                                fontWeight: '600',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '5px',
                                transition: 'all 0.2s'
                            }}
                        >
                            <Package size={14} /> Units Sold
                        </button>
                    </div>
                </div>

                <div style={{ fontSize: '0.85rem', color: '#7f8c8d' }}>
                    Total for {periodLabel}: <strong style={{ color: '#2c3e50', fontSize: '0.95rem' }}>
                        {isRevenue ? `$${totalVal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : `${totalVal} items`}
                    </strong>
                </div>
            </div>

            {/* Responsive SVG Chart */}
            <div style={{ width: '100%', overflowX: 'auto' }}>
                <svg
                    viewBox={`0 0 ${svgWidth} ${svgHeight}`}
                    style={{ width: '100%', height: 'auto', minWidth: '450px', overflow: 'visible' }}
                >
                    {/* Background grid lines */}
                    {[0, 0.25, 0.5, 0.75, 1].map((ratio, idx) => {
                        const y = paddingTop + chartH * (1 - ratio);
                        const labelVal = maxVal * ratio;
                        return (
                            <g key={idx}>
                                <line
                                    x1={paddingLeft}
                                    y1={y}
                                    x2={svgWidth - paddingRight}
                                    y2={y}
                                    stroke="#eef2f5"
                                    strokeDasharray={ratio === 0 ? '0' : '4 4'}
                                    strokeWidth="1"
                                />
                                <text
                                    x={paddingLeft - 8}
                                    y={y + 4}
                                    textAnchor="end"
                                    fontSize="11"
                                    fill="#95a5a6"
                                >
                                    {isRevenue ? `$${Math.round(labelVal)}` : Math.round(labelVal)}
                                </text>
                            </g>
                        );
                    })}

                    {/* Bars & Labels */}
                    {chartData.map((d, idx) => {
                        const val = isRevenue ? Number(d.revenue || 0) : Number(d.units || 0);
                        const height = maxVal > 0 ? (val / maxVal) * chartH : 0;
                        const xCenter = paddingLeft + (idx + 0.5) * stepX;
                        const x = xCenter - barWidth / 2;
                        const y = paddingTop + chartH - height;
                        const isHovered = hoveredIndex === idx;

                        const barColor = isRevenue
                            ? (isHovered ? '#2980b9' : '#3498db')
                            : (isHovered ? '#27ae60' : '#2ecc71');

                        return (
                            <g
                                key={idx}
                                onMouseEnter={() => setHoveredIndex(idx)}
                                onMouseLeave={() => setHoveredIndex(null)}
                                style={{ cursor: 'pointer' }}
                            >
                                {/* Invisible wider hover capture area */}
                                <rect
                                    x={xCenter - stepX / 2}
                                    y={paddingTop}
                                    width={stepX}
                                    height={chartH + paddingBottom}
                                    fill="transparent"
                                />

                                {/* Bar column */}
                                <rect
                                    x={x}
                                    y={y}
                                    width={barWidth}
                                    height={Math.max(2, height)}
                                    rx={4}
                                    ry={4}
                                    fill={barColor}
                                    style={{ transition: 'all 0.2s ease' }}
                                />

                                {/* Value label on top of bar if hovered or notable */}
                                {isHovered && (
                                    <g>
                                        <rect
                                            x={xCenter - 35}
                                            y={Math.max(2, y - 28)}
                                            width="70"
                                            height="22"
                                            rx="4"
                                            fill="#2c3e50"
                                        />
                                        <polygon
                                            points={`${xCenter - 4},${Math.max(24, y - 6)} ${xCenter + 4},${Math.max(24, y - 6)} ${xCenter},${Math.max(28, y - 2)}`}
                                            fill="#2c3e50"
                                        />
                                        <text
                                            x={xCenter}
                                            y={Math.max(17, y - 13)}
                                            textAnchor="middle"
                                            fill="#ffffff"
                                            fontSize="11"
                                            fontWeight="600"
                                        >
                                            {isRevenue ? `$${val.toFixed(2)}` : `${val} sold`}
                                        </text>
                                    </g>
                                )}

                                {/* X-axis time / date label */}
                                <text
                                    x={xCenter}
                                    y={svgHeight - 12}
                                    textAnchor="middle"
                                    fontSize="11"
                                    fill={isHovered ? '#2c3e50' : '#7f8c8d'}
                                    fontWeight={isHovered ? 'bold' : 'normal'}
                                >
                                    {d.label}
                                </text>
                            </g>
                        );
                    })}
                </svg>
            </div>
        </div>
    );
};

export default DailySalesChart;

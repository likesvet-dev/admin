/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';
import React, { useState, useEffect } from "react";
import { Bar, BarChart, LabelList, ResponsiveContainer, XAxis, YAxis } from "recharts";

interface OverviewProps {
  data: any[];
}

export const Overview: React.FC<OverviewProps> = ({ data }) => {
  const [isNarrow, setIsNarrow] = useState(false);

  useEffect(() => {
    const handleResize = () => setIsNarrow(window.innerWidth < 1150);
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // custom label renderer per ruotare il testo all'interno della barra
  const renderRotatedLabel = (props: any) => {
    const { x, y, width, height, value } = props;
    const centerX = x + width / 2;
    const centerY = y + height / 2;
    return (
      <text
        x={centerX}
        y={centerY}
        fill="#fff"
        textAnchor="middle"
        dominantBaseline="middle"
        transform={isNarrow ? `rotate(-90, ${centerX}, ${centerY})` : undefined}
        style={{ fontSize: 12, fontWeight: 500 }}
      >
        {`${value / 100}₽`}
      </text>
    );
  };

  return (
    <ResponsiveContainer width="100%" height={350}>
      <BarChart
        data={data}
        margin={{ top: 40, right: 20, left: 40, bottom: 20 }}
      >
        <XAxis
          dataKey="name"
          stroke="#888888"
          fontSize={12}
          tickLine={false}
          axisLine={false}
          interval={0}
        />
        <YAxis
          stroke="#888888"
          fontSize={12}
          tickLine={false}
          axisLine={false}
          tickFormatter={(value) => `${value / 100}₽`}
          domain={[0, (dataMax: number) => Math.ceil(dataMax * 1.10 / 1000) * 1000]}
        />
        <Bar dataKey="total" fill="#3498db" radius={[4, 4, 0, 0]}>
          <LabelList dataKey="total" content={renderRotatedLabel} />
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
};

/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';
import React, { useState, useEffect } from "react";
import { Bar, BarChart, LabelList, ResponsiveContainer, XAxis, YAxis } from "recharts";

interface OverviewProps {
  data: any[];
}

export const Overview: React.FC<OverviewProps> = ({ data }) => {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 500);
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  if (isMobile) {
    // Layout mobile: Y fisso + grafico scrollabile
    return (
      <div style={{ width: "100%", overflowX: "auto" }}>
  <div style={{ minWidth: Math.max(data.length * 50 + 40, 600) }}> 
    {/* +40 per lo spazio YAxis */}
    <ResponsiveContainer width="100%" height={350}>
      <BarChart data={data} margin={{ top: 20, right: 20, left: 40, bottom: 20 }}>
        <XAxis 
          dataKey="name" 
          stroke="#888888" 
          fontSize={10} 
          tickLine={false} 
          axisLine={false} 
          interval={0} 
        />
        <YAxis 
          stroke="#888888" 
          fontSize={10} 
          tickLine={false} 
          axisLine={true} 
          tickFormatter={(value) => `${value / 100}₽`} 
        />
        <Bar dataKey="total" fill="#3498db" radius={[4, 4, 0, 0]}>
          <LabelList dataKey="total" formatter={(value: any) => `${value / 100}₽`} position="top" />
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  </div>
</div>

    );
  }

  // Layout desktop/tablet: grafico normale
  return (
    <ResponsiveContainer width="100%" height={350}>
      <BarChart data={data}>
        <XAxis dataKey="name" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
        <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `${value / 100}₽`} />
        <Bar dataKey="total" fill="#3498db" radius={[4, 4, 0, 0]}>
          <LabelList dataKey="total" formatter={(value: any) => `${value / 100}₽`} position="top" />
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
};

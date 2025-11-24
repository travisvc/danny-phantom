"use client";

import { useEffect, useState } from "react";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

const API_URL =
  typeof window !== "undefined"
    ? process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"
    : "http://localhost:8000";

interface Tick {
  block_number: number;
  timestamp: string;
  balance: {
    total: string;
    free: string;
    root: string;
    alpha: string;
  };
}

interface Extrinsic {
  block_number: number;
  timestamp: string;
  address: string;
  call_module: string;
  call_function: string;
  hotkey: string | null;
  netuid: number | null;
  amount_staked: number | null;
  limit_price: number | null;
}

export default function Home() {
  const [ticks, setTicks] = useState<Tick[]>([]);
  const [extrinsics, setExtrinsics] = useState<Extrinsic[]>([]);
  const [ticksCount, setTicksCount] = useState<number>(0);
  const [extrinsicsCount, setExtrinsicsCount] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      // Fetch counts
      const [ticksCountRes, extrinsicsCountRes, ticksRes, extrinsicsRes] =
        await Promise.all([
          fetch(`${API_URL}/ticks/count`),
          fetch(`${API_URL}/extrinsics/count`),
          fetch(`${API_URL}/ticks?limit=50`),
          fetch(`${API_URL}/extrinsics?limit=50`),
        ]);

      const ticksCountData = await ticksCountRes.json();
      const extrinsicsCountData = await extrinsicsCountRes.json();
      const ticksData = await ticksRes.json();
      const extrinsicsData = await extrinsicsRes.json();

      setTicksCount(ticksCountData);
      setExtrinsicsCount(extrinsicsCountData);
      setTicks(ticksData);
      setExtrinsics(extrinsicsData);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching data:", error);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, []);

  // Prepare chart data
  const ticksChartData = ticks
    .slice(0, 20)
    .reverse()
    .map((tick) => ({
      time: new Date(tick.timestamp).toLocaleTimeString(),
      total: parseFloat(tick.balance.total.replace(/[τ,]/g, "")) || 0,
      free: parseFloat(tick.balance.free.replace(/[τ,]/g, "")) || 0,
      alpha: parseFloat(tick.balance.alpha.replace(/[τ,]/g, "")) || 0,
    }));

  const extrinsicsByFunction = extrinsics.reduce((acc, ext) => {
    const func = ext.call_function || "unknown";
    acc[func] = (acc[func] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const extrinsicsChartData = Object.entries(extrinsicsByFunction).map(
    ([name, value]) => ({
      name: name.replace("_", " "),
      count: value,
    })
  );

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-50 dark:bg-black">
        <div className="text-xl">Loading dashboard...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-bold mb-8 text-zinc-900 dark:text-zinc-100">
          Shadow Realm Dashboard
        </h1>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="bg-white dark:bg-zinc-900 p-6 rounded-lg shadow">
            <h2 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-100 mb-2">
              Total Ticks
            </h2>
            <p className="text-4xl font-bold text-blue-600">
              {ticksCount.toLocaleString()}
            </p>
          </div>
          <div className="bg-white dark:bg-zinc-900 p-6 rounded-lg shadow">
            <h2 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-100 mb-2">
              Total Extrinsics
            </h2>
            <p className="text-4xl font-bold text-green-600">
              {extrinsicsCount.toLocaleString()}
            </p>
          </div>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <div className="bg-white dark:bg-zinc-900 p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100 mb-4">
              Balance Over Time
            </h2>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={ticksChartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="time" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="total"
                  stroke="#3b82f6"
                  strokeWidth={2}
                />
                <Line
                  type="monotone"
                  dataKey="free"
                  stroke="#10b981"
                  strokeWidth={2}
                />
                <Line
                  type="monotone"
                  dataKey="alpha"
                  stroke="#f59e0b"
                  strokeWidth={2}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-white dark:bg-zinc-900 p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100 mb-4">
              Extrinsics by Function
            </h2>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={extrinsicsChartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="#10b981" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Tables */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white dark:bg-zinc-900 p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100 mb-4">
              Recent Ticks
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-zinc-200 dark:border-zinc-700">
                    <th className="text-left p-2 text-zinc-900 dark:text-zinc-100">
                      Block
                    </th>
                    <th className="text-left p-2 text-zinc-900 dark:text-zinc-100">
                      Time
                    </th>
                    <th className="text-left p-2 text-zinc-900 dark:text-zinc-100">
                      Total
                    </th>
                    <th className="text-left p-2 text-zinc-900 dark:text-zinc-100">
                      Alpha
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {ticks.slice(0, 10).map((tick) => (
                    <tr
                      key={tick.block_number}
                      className="border-b border-zinc-100 dark:border-zinc-800"
                    >
                      <td className="p-2 text-zinc-700 dark:text-zinc-300">
                        {tick.block_number}
                      </td>
                      <td className="p-2 text-zinc-700 dark:text-zinc-300">
                        {new Date(tick.timestamp).toLocaleString()}
                      </td>
                      <td className="p-2 text-zinc-700 dark:text-zinc-300">
                        {tick.balance.total}
                      </td>
                      <td className="p-2 text-zinc-700 dark:text-zinc-300">
                        {tick.balance.alpha}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="bg-white dark:bg-zinc-900 p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100 mb-4">
              Recent Extrinsics
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-zinc-200 dark:border-zinc-700">
                    <th className="text-left p-2 text-zinc-900 dark:text-zinc-100">
                      Block
                    </th>
                    <th className="text-left p-2 text-zinc-900 dark:text-zinc-100">
                      Function
                    </th>
                    <th className="text-left p-2 text-zinc-900 dark:text-zinc-100">
                      Netuid
                    </th>
                    <th className="text-left p-2 text-zinc-900 dark:text-zinc-100">
                      Amount
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {extrinsics.slice(0, 10).map((ext, idx) => (
                    <tr
                      key={idx}
                      className="border-b border-zinc-100 dark:border-zinc-800"
                    >
                      <td className="p-2 text-zinc-700 dark:text-zinc-300">
                        {ext.block_number}
                      </td>
                      <td className="p-2 text-zinc-700 dark:text-zinc-300">
                        {ext.call_function}
                      </td>
                      <td className="p-2 text-zinc-700 dark:text-zinc-300">
                        {ext.netuid || "-"}
                      </td>
                      <td className="p-2 text-zinc-700 dark:text-zinc-300">
                        {ext.amount_staked
                          ? (ext.amount_staked / 1e9).toFixed(2)
                          : "-"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

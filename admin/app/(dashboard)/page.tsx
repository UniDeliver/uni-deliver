'use client';

import React from 'react';
import { useAdminAuth } from '../../src/context/AdminAuthContext';

export default function AdminOverviewPage() {
  const { adminUser } = useAdminAuth();

  const stats = [
    { title: "Today's Orders", value: '42', change: '+12% from yesterday', icon: '📦' },
    { title: 'Total Revenue', value: 'LKR 84,200', change: '+8% vs last week', icon: '💰' },
    { title: 'Active Riders', value: '7 Online', change: 'All zones covered', icon: '🛵' },
    { title: 'Registered Users', value: '380 Students', change: '+15 this week', icon: '👥' },
  ];

  return (
    <div className="space-y-8">
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-800">
        <div>
          <h2 className="text-2xl font-extrabold text-white tracking-tight">Operations Overview</h2>
          <p className="text-sm text-slate-400 mt-1">
            Real-time campus order dispatch, rider telemetry, and restaurant status.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            Backend API Connected
          </div>
          <div className="px-3 py-1.5 rounded-xl bg-slate-800/80 border border-slate-700 text-slate-300 text-xs font-medium">
            Role: <span className="font-bold text-white uppercase">{adminUser?.role}</span>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, i) => (
          <div
            key={i}
            className="p-5 rounded-2xl bg-slate-900/50 border border-slate-800 backdrop-blur-sm space-y-3"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                {stat.title}
              </span>
              <span className="text-xl">{stat.icon}</span>
            </div>
            <div className="text-2xl font-extrabold text-white tracking-tight">{stat.value}</div>
            <div className="text-xs text-slate-500">{stat.change}</div>
          </div>
        ))}
      </div>

      {/* Live Orders Overview Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 p-6 rounded-2xl bg-slate-900/50 border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-white">Recent Live Orders</h3>
            <span className="text-xs font-semibold text-orange-400 cursor-pointer hover:underline">
              View All Orders →
            </span>
          </div>

          <div className="divide-y divide-slate-800/60">
            {[
              { id: 'ORD-8921', customer: 'Kasun P. (Hostel C)', outlet: 'Campus Bakehouse', status: 'OUT_FOR_DELIVERY', amount: 'LKR 1,450', rider: 'Sunil (WP-BIKE)' },
              { id: 'ORD-8920', customer: 'Amal S. (Hostel A)', outlet: 'Main Cafeteria', status: 'ACCEPTED', amount: 'LKR 950', rider: 'Saman (CP-7711)' },
              { id: 'ORD-8919', customer: 'Dilani K. (Boarding 2)', outlet: 'Pambahinna Spice', status: 'PENDING', amount: 'LKR 2,100', rider: 'Unassigned' },
            ].map((ord) => (
              <div key={ord.id} className="py-3.5 flex items-center justify-between text-xs">
                <div>
                  <div className="font-bold text-slate-200">{ord.id} • {ord.outlet}</div>
                  <div className="text-slate-400 mt-0.5">{ord.customer} • Rider: {ord.rider}</div>
                </div>
                <div className="text-right">
                  <div className="font-extrabold text-white">{ord.amount}</div>
                  <span className="inline-block mt-1 px-2 py-0.5 rounded text-[10px] font-bold bg-orange-500/10 text-orange-400 border border-orange-500/20">
                    {ord.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Admin Actions */}
        <div className="p-6 rounded-2xl bg-slate-900/50 border border-slate-800 space-y-4">
          <h3 className="text-base font-bold text-white">Quick Actions</h3>

          <div className="space-y-2.5">
            <button className="w-full py-2.5 px-4 rounded-xl bg-slate-800/80 hover:bg-slate-800 text-left text-xs font-semibold text-slate-200 border border-slate-700 flex items-center gap-3 transition-all cursor-pointer">
              <span>🛵</span> Pre-create Rider Partner
            </button>
            <button className="w-full py-2.5 px-4 rounded-xl bg-slate-800/80 hover:bg-slate-800 text-left text-xs font-semibold text-slate-200 border border-slate-700 flex items-center gap-3 transition-all cursor-pointer">
              <span>🏪</span> Add New Restaurant Outlet
            </button>
            <button className="w-full py-2.5 px-4 rounded-xl bg-slate-800/80 hover:bg-slate-800 text-left text-xs font-semibold text-slate-200 border border-slate-700 flex items-center gap-3 transition-all cursor-pointer">
              <span>⚙️</span> Update Delivery Zone Fees
            </button>
            <button className="w-full py-2.5 px-4 rounded-xl bg-slate-800/80 hover:bg-slate-800 text-left text-xs font-semibold text-slate-200 border border-slate-700 flex items-center gap-3 transition-all cursor-pointer">
              <span>📊</span> Generate Daily Settlement Report
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

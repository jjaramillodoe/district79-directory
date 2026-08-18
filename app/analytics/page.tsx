'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { BarChart3, Users, MapPin, TrendingUp, Loader2 } from 'lucide-react';

// Dynamically import charts to avoid SSR issues
const RechartsBarChart = dynamic(() => Promise.resolve((props: any) => (
  <ResponsiveContainer width="100%" height={400}>
    <BarChart data={props.data}>
      <CartesianGrid strokeDasharray="3 3" />
      <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
      <YAxis />
      <Tooltip />
      <Legend />
      <Bar dataKey="count" fill="#003F87" />
    </BarChart>
  </ResponsiveContainer>
)), { ssr: false });

const RechartsPieChart = dynamic(() => Promise.resolve((props: any) => (
  <ResponsiveContainer width="100%" height={400}>
    <PieChart>
      <Pie
        data={props.data}
        cx="50%"
        cy="50%"
        labelLine={false}
        label={({ name, percent }: any) => `${name}: ${(percent * 100).toFixed(0)}%`}
        outerRadius={120}
        fill="#8884d8"
        dataKey="value"
      >
        {props.data.map((entry: any, index: number) => (
          <Cell key={`cell-${index}`} fill={entry.color} />
        ))}
      </Pie>
      <Tooltip />
    </PieChart>
  </ResponsiveContainer>
)), { ssr: false });

interface Site {
  _id: string;
  dbn: string;
  program: string;
  siteName: string;
  status?: string;
  borough?: string;
  category: 'adult-ed' | 'youth';
  latitude?: number | null;
  longitude?: number | null;
}

export default function AnalyticsPage() {
  const [sites, setSites] = useState<Site[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const response = await fetch('/api/auth/public/verify', {
        credentials: 'include', // Important: include cookies
      });
      
      if (response.ok) {
        const data = await response.json();
        
        if (data.authenticated) {
          setIsAuthenticated(true);
          fetchSites(); // Fetch data only if authenticated
        } else {
          window.location.href = '/';
        }
      } else {
        window.location.href = '/';
      }
    } catch (error) {
      console.error('Auth check error:', error);
      window.location.href = '/';
    } finally {
      setAuthLoading(false);
    }
  };

  const fetchSites = async () => {
    try {
      const response = await fetch('/api/sites');
      const data = await response.json();
      // Filter to show only open sites
      const openSites = data.filter((site: Site) => 
        site.status === 'Open'
      );
      setSites(openSites);
    } catch (error) {
      console.error('Error fetching sites:', error);
    } finally {
      setLoading(false);
    }
  };

  // Calculate statistics
  const totalSites = sites.length;
  const adultEdSites = sites.filter(s => s.category === 'adult-ed').length;
  const youthSites = sites.filter(s => s.category === 'youth').length;
  const sitesWithCoordinates = sites.filter(s => s.latitude && s.longitude).length;
  const openSites = sites.filter(s => s.status === 'Open').length;
  const closedSites = sites.filter(s => s.status === 'Closed').length;

  // Program distribution
  const programCounts = sites.reduce((acc, site) => {
    const program = site.program || 'Unknown';
    acc[program] = (acc[program] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const programData = Object.entries(programCounts)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 20); // Top 20 programs

  // Borough distribution
  const boroughCounts = sites.reduce((acc, site) => {
    const borough = site.borough || 'Unknown';
    acc[borough] = (acc[borough] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const boroughData = Object.entries(boroughCounts)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count);

  // Category distribution
  const categoryData = [
    { name: 'Adult Education', value: adultEdSites, color: '#003F87' },
    { name: 'Youth Programs', value: youthSites, color: '#7C3AED' },
  ];

  // Status distribution
  const statusData = [
    { name: 'Open', value: openSites, color: '#10B981' },
    { name: 'Closed', value: closedSites, color: '#EF4444' },
    { name: 'Unknown', value: totalSites - openSites - closedSites, color: '#6B7280' },
  ];

  if (authLoading || !isAuthenticated) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="text-center">
          <Loader2 className="mx-auto mb-4 h-10 w-10 animate-spin text-d79-blue" />
          <p className="text-slate-600">Loading analytics...</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="text-center">
          <Loader2 className="mx-auto mb-4 h-10 w-10 animate-spin text-d79-blue" />
          <p className="text-slate-600">Loading analytics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-slate-50">
      <div className="page-shell py-8">
        <div className="mb-8">
          <h1 className="flex items-center gap-3 text-3xl font-semibold tracking-tight text-d79-navy">
            <BarChart3 className="h-8 w-8" />
            Analytics
          </h1>
          <p className="mt-1 text-slate-600">Snapshot of open District 79 sites by program, borough, and category.</p>
        </div>

        <div className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
          <div className="surface-card border-l-4 border-d79-blue p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Open sites</p>
                <p className="text-3xl font-semibold text-slate-900">{totalSites}</p>
              </div>
              <Users className="h-10 w-10 text-d79-blue/20" />
            </div>
          </div>

          <div className="surface-card border-l-4 border-violet-500 p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Adult Education</p>
                <p className="text-3xl font-semibold text-slate-900">{adultEdSites}</p>
                <p className="mt-1 text-xs text-slate-500">{totalSites > 0 ? ((adultEdSites / totalSites) * 100).toFixed(1) : 0}%</p>
              </div>
              <TrendingUp className="h-10 w-10 text-violet-500/20" />
            </div>
          </div>

          <div className="surface-card border-l-4 border-fuchsia-500 p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Youth Programs</p>
                <p className="text-3xl font-semibold text-slate-900">{youthSites}</p>
                <p className="mt-1 text-xs text-slate-500">{totalSites > 0 ? ((youthSites / totalSites) * 100).toFixed(1) : 0}%</p>
              </div>
              <TrendingUp className="h-10 w-10 text-fuchsia-500/20" />
            </div>
          </div>

          <div className="surface-card border-l-4 border-emerald-500 p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">With coordinates</p>
                <p className="text-3xl font-semibold text-slate-900">{sitesWithCoordinates}</p>
                <p className="mt-1 text-xs text-slate-500">{totalSites > 0 ? ((sitesWithCoordinates / totalSites) * 100).toFixed(1) : 0}%</p>
              </div>
              <MapPin className="h-10 w-10 text-emerald-500/20" />
            </div>
          </div>
        </div>

        <div className="mb-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div className="surface-card p-6">
            <h2 className="mb-4 text-lg font-semibold text-slate-900">Sites by program (top 20)</h2>
            {programData.length > 0 ? (
              <RechartsBarChart data={programData} />
            ) : (
              <div className="h-96 flex items-center justify-center text-gray-500">
                No data available
              </div>
            )}
          </div>

          {/* Boroughs Chart */}
          <div className="surface-card p-6">
            <h2 className="mb-4 text-lg font-semibold text-slate-900">Sites by borough</h2>
            {boroughData.length > 0 ? (
              <RechartsBarChart data={boroughData} />
            ) : (
              <div className="h-96 flex items-center justify-center text-gray-500">
                No data available
              </div>
            )}
          </div>

          {/* Category Distribution */}
          <div className="surface-card p-6">
            <h2 className="mb-4 text-lg font-semibold text-slate-900">Category distribution</h2>
            {categoryData.some(d => d.value > 0) ? (
              <RechartsPieChart data={categoryData} />
            ) : (
              <div className="h-96 flex items-center justify-center text-gray-500">
                No data available
              </div>
            )}
          </div>

          {/* Status Distribution */}
          <div className="surface-card p-6">
            <h2 className="mb-4 text-lg font-semibold text-slate-900">Status distribution</h2>
            {statusData.some(d => d.value > 0) ? (
              <RechartsPieChart data={statusData} />
            ) : (
              <div className="h-96 flex items-center justify-center text-gray-500">
                No data available
              </div>
            )}
          </div>
        </div>

        {/* Additional Statistics */}
        <div className="surface-card p-6">
          <h2 className="mb-4 text-lg font-semibold text-slate-900">Additional statistics</h2>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div className="rounded-xl bg-d79-sky p-4 text-center">
              <p className="text-2xl font-semibold text-d79-navy">{programData.length}</p>
              <p className="mt-1 text-sm text-slate-600">Unique programs</p>
            </div>
            <div className="rounded-xl bg-violet-50 p-4 text-center">
              <p className="text-2xl font-semibold text-violet-700">{boroughData.length}</p>
              <p className="mt-1 text-sm text-slate-600">Boroughs / locations</p>
            </div>
            <div className="rounded-xl bg-emerald-50 p-4 text-center">
              <p className="text-2xl font-semibold text-emerald-700">{totalSites - sitesWithCoordinates}</p>
              <p className="mt-1 text-sm text-slate-600">Sites needing geocoding</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}


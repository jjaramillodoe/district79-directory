'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import Footer from '@/components/Footer';
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
      <Bar dataKey="count" fill="#3B82F6" />
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
      console.log('🔍 Analytics page - Checking authentication...');
      const response = await fetch('/api/auth/public/verify', {
        credentials: 'include', // Important: include cookies
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log('   - Analytics page auth response:', data);
        
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
    { name: 'Adult Education', value: adultEdSites, color: '#3B82F6' },
    { name: 'Youth Programs', value: youthSites, color: '#8B5CF6' },
  ];

  // Status distribution
  const statusData = [
    { name: 'Open', value: openSites, color: '#10B981' },
    { name: 'Closed', value: closedSites, color: '#EF4444' },
    { name: 'Unknown', value: totalSites - openSites - closedSites, color: '#6B7280' },
  ];

  if (authLoading || !isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 text-blue-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 text-blue-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading analytics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                <BarChart3 className="h-8 w-8 text-blue-600" />
                Analytics Dashboard
              </h1>
              <p className="text-gray-600 mt-1">Insights and statistics about District 79 sites</p>
            </div>
            <a 
              href="/home" 
              className="text-blue-600 hover:text-blue-800 flex items-center gap-2"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
              </svg>
              Back to Directory
            </a>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-lg p-6 border-l-4 border-blue-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Total Sites</p>
                <p className="text-3xl font-bold text-gray-900">{totalSites}</p>
              </div>
              <Users className="h-12 w-12 text-blue-500 opacity-20" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-lg p-6 border-l-4 border-purple-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Adult Education</p>
                <p className="text-3xl font-bold text-gray-900">{adultEdSites}</p>
                <p className="text-xs text-gray-500 mt-1">{totalSites > 0 ? ((adultEdSites / totalSites) * 100).toFixed(1) : 0}%</p>
              </div>
              <TrendingUp className="h-12 w-12 text-purple-500 opacity-20" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-lg p-6 border-l-4 border-pink-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Youth Programs</p>
                <p className="text-3xl font-bold text-gray-900">{youthSites}</p>
                <p className="text-xs text-gray-500 mt-1">{totalSites > 0 ? ((youthSites / totalSites) * 100).toFixed(1) : 0}%</p>
              </div>
              <TrendingUp className="h-12 w-12 text-pink-500 opacity-20" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-lg p-6 border-l-4 border-green-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">With Coordinates</p>
                <p className="text-3xl font-bold text-gray-900">{sitesWithCoordinates}</p>
                <p className="text-xs text-gray-500 mt-1">{totalSites > 0 ? ((sitesWithCoordinates / totalSites) * 100).toFixed(1) : 0}%</p>
              </div>
              <MapPin className="h-12 w-12 text-green-500 opacity-20" />
            </div>
          </div>
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Programs Chart */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Sites by Program (Top 20)</h2>
            {programData.length > 0 ? (
              <RechartsBarChart data={programData} />
            ) : (
              <div className="h-96 flex items-center justify-center text-gray-500">
                No data available
              </div>
            )}
          </div>

          {/* Boroughs Chart */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Sites by Borough</h2>
            {boroughData.length > 0 ? (
              <RechartsBarChart data={boroughData} />
            ) : (
              <div className="h-96 flex items-center justify-center text-gray-500">
                No data available
              </div>
            )}
          </div>

          {/* Category Distribution */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Category Distribution</h2>
            {categoryData.some(d => d.value > 0) ? (
              <RechartsPieChart data={categoryData} />
            ) : (
              <div className="h-96 flex items-center justify-center text-gray-500">
                No data available
              </div>
            )}
          </div>

          {/* Status Distribution */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Status Distribution</h2>
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
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Additional Statistics</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <p className="text-2xl font-bold text-blue-600">{programData.length}</p>
              <p className="text-sm text-gray-600 mt-1">Unique Programs</p>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <p className="text-2xl font-bold text-purple-600">{boroughData.length}</p>
              <p className="text-sm text-gray-600 mt-1">Boroughs/Locations</p>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <p className="text-2xl font-bold text-green-600">{totalSites - sitesWithCoordinates}</p>
              <p className="text-sm text-gray-600 mt-1">Sites Needing Geocoding</p>
            </div>
          </div>
        </div>
      </div>
      
      <Footer />
    </div>
  );
}


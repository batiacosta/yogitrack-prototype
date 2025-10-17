import { useState, useEffect } from 'react';
import { authService } from '../services/authService';

interface ReportData {
  period: {
    year: number;
    month: number | null;
    startDate: string;
    endDate: string;
  };
  summary: any;
  [key: string]: any;
}

const Reports: React.FC = () => {
  const [activeReportType, setActiveReportType] = useState('performance');
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const reportTypes = [
    {
      id: 'performance',
      name: 'Performance Report',
      description: 'Package sales and new user registrations',
      icon: '📈'
    },
    {
      id: 'instructor-performance',
      name: 'Instructor Performance',
      description: 'Student scheduling and attendance by instructor',
      icon: '👨‍🏫'
    },
    {
      id: 'customer-attendance',
      name: 'Customer Attendance',
      description: 'Customer attendance vs scheduled classes',
      icon: '👥'
    },
    {
      id: 'general-attendance',
      name: 'Class Popularity',
      description: 'General attendance and class popularity analysis',
      icon: '🧘‍♀️'
    }
  ];

  const months = [
    { value: null, name: 'Full Year' },
    { value: 1, name: 'January' },
    { value: 2, name: 'February' },
    { value: 3, name: 'March' },
    { value: 4, name: 'April' },
    { value: 5, name: 'May' },
    { value: 6, name: 'June' },
    { value: 7, name: 'July' },
    { value: 8, name: 'August' },
    { value: 9, name: 'September' },
    { value: 10, name: 'October' },
    { value: 11, name: 'November' },
    { value: 12, name: 'December' }
  ];

  // Load report data when filters change
  useEffect(() => {
    loadReportData();
  }, [activeReportType, selectedYear, selectedMonth]);

  const loadReportData = async () => {
    try {
      setIsLoading(true);
      setError('');

      const token = authService.getToken();
      const params = new URLSearchParams({
        year: selectedYear.toString(),
        ...(selectedMonth && { month: selectedMonth.toString() })
      });

      const response = await fetch(`${window.location.origin}/api/reports/${activeReportType}?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to load report');
      }

      const data = await response.json();
      setReportData(data);
    } catch (err) {
      console.error('Error loading report:', err);
      setError(err instanceof Error ? err.message : 'Failed to load report');
    } finally {
      setIsLoading(false);
    }
  };

  const formatNumber = (num: number | string) => {
    const number = typeof num === 'string' ? parseFloat(num) : num;
    return isNaN(number) ? '0' : number.toLocaleString();
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount || 0);
  };

// Type definitions for report data
interface ClassTypeStats {
  classes: number;
  totalRegistrations: number;
  totalAttendance: number;
  averageAttendanceRate: string; // Backend returns string with .toFixed(1)
}

interface ClassData {
  classId: string;
  className: string;
  classType: string;
  instructorId: string;
  instructorName: string;
  capacity: number;
  totalRegistrations: number;
  totalAttendance: number;
  attendanceRate: string; // Backend returns string with .toFixed(1)
  capacityUtilization: string; // Backend returns string with .toFixed(1)
  sessionCount: number;
  averageAttendancePerSession: string;
}

interface MonthlyData {
  month: string;
  monthName: string;
  classes: number;
  attendance: number;
  registrations: number;
  newUsers: number;
  packageSales: number;
  revenue: number;
}

interface InstructorData {
  instructorId: string;
  name: string;
  email: string;
  totalClasses: number;
  totalRegistrations: number;
  totalAttendance: number;
  attendanceRate: string; // Backend returns string with .toFixed(1)
  uniqueStudents: number;
}

interface CustomerData {
  userId: string;
  name: string;
  email: string;
  totalScheduled: number;
  totalAttended: number;
  attendanceRate: string;
  classesAttended: number;
}

// Helper function to format percentage
const formatPercentage = (value: number): string => {
  return `${(value * 100).toFixed(1)}%`;
};  const renderPerformanceReport = () => {
    if (!reportData) return null;

    return (
      <div className="space-y-6">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <span className="text-2xl">👥</span>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">New Users</p>
                <p className="text-2xl font-bold text-gray-900">{formatNumber(reportData.summary.newUsers)}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <span className="text-2xl">👨‍🏫</span>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">New Instructors</p>
                <p className="text-2xl font-bold text-gray-900">{formatNumber(reportData.summary.newInstructors)}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <span className="text-2xl">🎫</span>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Package Sales</p>
                <p className="text-2xl font-bold text-gray-900">{formatNumber(reportData.summary.packageSales)}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-emerald-100 rounded-lg">
                <span className="text-2xl">💰</span>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Revenue</p>
                <p className="text-2xl font-bold text-gray-900">{formatCurrency(reportData.summary.totalRevenue)}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Monthly Breakdown */}
        {reportData.monthlyBreakdown && (
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Monthly Breakdown</h3>
            </div>
            <div className="p-6">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead>
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Month</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">New Users</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Package Sales</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Revenue</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {reportData.monthlyBreakdown && reportData.monthlyBreakdown.length > 0 ? (
                      reportData.monthlyBreakdown.map((month: MonthlyData) => (
                        <tr key={month.month}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {month.monthName}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {formatNumber(month.newUsers)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {formatNumber(month.packageSales)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {formatCurrency(month.revenue)}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={4} className="px-6 py-8 text-center">
                          <p className="text-gray-500">No monthly data available for the selected period.</p>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderInstructorPerformanceReport = () => {
    if (!reportData) return null;

    return (
      <div className="space-y-6">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <span className="text-2xl">👨‍🏫</span>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Instructors</p>
                <p className="text-2xl font-bold text-gray-900">{formatNumber(reportData.summary.totalInstructors)}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <span className="text-2xl">📝</span>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Registrations</p>
                <p className="text-2xl font-bold text-gray-900">{formatNumber(reportData.summary.totalRegistrations)}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <span className="text-2xl">✅</span>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Attendance</p>
                <p className="text-2xl font-bold text-gray-900">{formatNumber(reportData.summary.totalAttendance)}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-emerald-100 rounded-lg">
                <span className="text-2xl">📊</span>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Avg Attendance Rate</p>
                <p className="text-2xl font-bold text-gray-900">{formatPercentage(reportData.summary.averageAttendanceRate)}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Instructor Details */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Instructor Performance Details</h3>
          </div>
          <div className="p-6">
            {reportData.instructors && reportData.instructors.length > 0 ? (
              <div className="space-y-4">
                {reportData.instructors.map((instructor: InstructorData) => (
                <div key={instructor.instructorId} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h4 className="text-lg font-semibold text-gray-900">{instructor.name}</h4>
                      <p className="text-sm text-gray-600">{instructor.email}</p>
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-gray-600">Attendance Rate</div>
                      <div className="text-lg font-bold text-emerald-600">{instructor.attendanceRate}%</div>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <span className="font-medium text-gray-700">Classes:</span>
                      <span className="ml-1 text-gray-900">{instructor.totalClasses}</span>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700">Registrations:</span>
                      <span className="ml-1 text-gray-900">{instructor.totalRegistrations}</span>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700">Attendance:</span>
                      <span className="ml-1 text-gray-900">{instructor.totalAttendance}</span>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700">Unique Students:</span>
                      <span className="ml-1 text-gray-900">{instructor.uniqueStudents}</span>
                    </div>
                  </div>
                </div>
              ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-500">No instructor data available for the selected period.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  const renderCustomerAttendanceReport = () => {
    if (!reportData) return null;

    return (
      <div className="space-y-6">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <span className="text-2xl">👥</span>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Active Customers</p>
                <p className="text-2xl font-bold text-gray-900">{formatNumber(reportData.summary.totalCustomers)}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <span className="text-2xl">📅</span>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Scheduled</p>
                <p className="text-2xl font-bold text-gray-900">{formatNumber(reportData.summary.totalScheduled)}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <span className="text-2xl">✅</span>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Attended</p>
                <p className="text-2xl font-bold text-gray-900">{formatNumber(reportData.summary.totalAttended)}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-emerald-100 rounded-lg">
                <span className="text-2xl">📊</span>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Avg Attendance Rate</p>
                <p className="text-2xl font-bold text-gray-900">{formatPercentage(reportData.summary.averageAttendanceRate)}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Customer Details */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Customer Attendance Details</h3>
          </div>
          <div className="p-6">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead>
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Scheduled</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Attended</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Attendance Rate</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contact</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {reportData.customers && reportData.customers.length > 0 ? (
                    reportData.customers.map((customer: CustomerData) => (
                      <tr key={customer.userId}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{customer.name}</div>
                          <div className="text-sm text-gray-500">{customer.userId}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {customer.totalScheduled}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {customer.totalAttended}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            parseFloat(customer.attendanceRate) >= 80 ? 'bg-green-100 text-green-800' :
                            parseFloat(customer.attendanceRate) >= 60 ? 'bg-yellow-100 text-yellow-800' :
                            'bg-red-100 text-red-800'
                          }`}>
                            {customer.attendanceRate}%
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {customer.email}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} className="px-6 py-8 text-center">
                        <p className="text-gray-500">No customer data available for the selected period.</p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderGeneralAttendanceReport = () => {
    if (!reportData) return null;

    return (
      <div className="space-y-6">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <span className="text-2xl">🧘‍♀️</span>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Active Classes</p>
                <p className="text-2xl font-bold text-gray-900">{formatNumber(reportData.summary.totalClasses)}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <span className="text-2xl">📝</span>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Registrations</p>
                <p className="text-2xl font-bold text-gray-900">{formatNumber(reportData.summary.totalRegistrations)}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <span className="text-2xl">✅</span>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Attendance</p>
                <p className="text-2xl font-bold text-gray-900">{formatNumber(reportData.summary.totalAttendance)}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-emerald-100 rounded-lg">
                <span className="text-2xl">📊</span>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Capacity Utilization</p>
                <p className="text-2xl font-bold text-gray-900">{formatPercentage(reportData.summary.averageCapacityUtilization)}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Class Type Statistics */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Class Type Performance</h3>
          </div>
          <div className="p-6">
            {reportData.classTypeStats && Object.keys(reportData.classTypeStats).length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {Object.entries(reportData.classTypeStats as Record<string, ClassTypeStats>).map(([type, stats]) => (
                  <div key={type} className="border border-gray-200 rounded-lg p-4">
                    <h4 className="font-semibold text-gray-900 mb-2">{type}</h4>
                    <div className="space-y-1 text-sm">
                      <div><span className="text-gray-600">Classes:</span> <span className="font-medium">{stats.classes}</span></div>
                      <div><span className="text-gray-600">Registrations:</span> <span className="font-medium">{stats.totalRegistrations}</span></div>
                      <div><span className="text-gray-600">Attendance:</span> <span className="font-medium">{stats.totalAttendance}</span></div>
                      <div><span className="text-gray-600">Rate:</span> <span className="font-medium">{stats.averageAttendanceRate}%</span></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-500">No class type data available for the selected period.</p>
              </div>
            )}
          </div>
        </div>

        {/* Class Details */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Class Performance Details</h3>
          </div>
          <div className="p-6">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead>
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Class</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Instructor</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Registrations</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Attendance</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rate</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Capacity</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {reportData.classes && reportData.classes.length > 0 ? (
                    reportData.classes.map((classData: ClassData) => (
                      <tr key={classData.classId}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{classData.className}</div>
                          <div className="text-sm text-gray-500">{classData.classId}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {classData.classType}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {classData.instructorName}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {classData.totalRegistrations}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {classData.totalAttendance}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            parseFloat(classData.attendanceRate) >= 80 ? 'bg-green-100 text-green-800' :
                            parseFloat(classData.attendanceRate) >= 60 ? 'bg-yellow-100 text-yellow-800' :
                            'bg-red-100 text-red-800'
                          }`}>
                            {classData.attendanceRate}%
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {classData.capacityUtilization}%
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} className="px-6 py-8 text-center">
                        <p className="text-gray-500">No class data available for the selected period.</p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderReportContent = () => {
    if (isLoading) {
      return (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
        </div>
      );
    }

    if (error) {
      return (
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Error Loading Report</h3>
              <div className="mt-2 text-sm text-red-700">
                <p>{error}</p>
              </div>
            </div>
          </div>
        </div>
      );
    }

    switch (activeReportType) {
      case 'performance':
        return renderPerformanceReport();
      case 'instructor-performance':
        return renderInstructorPerformanceReport();
      case 'customer-attendance':
        return renderCustomerAttendanceReport();
      case 'general-attendance':
        return renderGeneralAttendanceReport();
      default:
        return null;
    }
  };

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Business Reports</h2>
        <p className="text-gray-600">Analytics and insights for your yoga studio</p>
      </div>

      {/* Controls */}
      <div className="bg-white rounded-lg shadow mb-6 p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Report Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Report Type</label>
            <select
              value={activeReportType}
              onChange={(e) => setActiveReportType(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            >
              {reportTypes.map((type) => (
                <option key={type.id} value={type.id}>
                  {type.icon} {type.name}
                </option>
              ))}
            </select>
          </div>

          {/* Year */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Year</label>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(parseInt(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            >
              {[2024, 2025, 2026].map((year) => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
          </div>

          {/* Month */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Month</label>
            <select
              value={selectedMonth || ''}
              onChange={(e) => setSelectedMonth(e.target.value ? parseInt(e.target.value) : null)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            >
              {months.map((month) => (
                <option key={month.value || 'null'} value={month.value || ''}>
                  {month.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Current Report Description */}
        <div className="mt-4 p-4 bg-gray-50 rounded-lg">
          <div className="flex items-center">
            <span className="text-2xl mr-3">
              {reportTypes.find(t => t.id === activeReportType)?.icon}
            </span>
            <div>
              <h3 className="font-medium text-gray-900">
                {reportTypes.find(t => t.id === activeReportType)?.name}
              </h3>
              <p className="text-sm text-gray-600">
                {reportTypes.find(t => t.id === activeReportType)?.description}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Report Content */}
      {renderReportContent()}
    </div>
  );
};

export default Reports;

"use client";

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  FiAlertCircle,
  FiCheckCircle,
  FiClock,
  FiDownload,
  FiUsers,
  FiLogOut,
  FiAlertTriangle,
} from "react-icons/fi";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";
import { API_BASE_URL } from "../../config/api";

const COLORS = ["#FBBF24", "#3B82F6", "#10B981", "#EF4444"];

const isAdminRole = (role) => {
  const value = String(role || "").toLowerCase();
  return ["admin", "mainadmin", "superadmin"].includes(value);
};

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    inProgress: 0,
    resolved: 0,
    rejected: 0,
  });

  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterCategory, setFilterCategory] = useState("");
  const [filterWard, setFilterWard] = useState("");

  useEffect(() => {
    const userData = localStorage.getItem("user");
    if (userData) {
      const parsedUser = JSON.parse(userData);
      setUser(parsedUser);
      if (isAdminRole(parsedUser.role)) {
        fetchComplaints();
      } else {
        navigate("/home");
      }
    } else {
      navigate("/login");
    }
  }, [navigate]);

  const fetchComplaints = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${API_BASE_URL}/api/complaints`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        const complaintsData = data.complaints || [];
        setComplaints(complaintsData);

        setStats({
          total: complaintsData.length,
          pending: complaintsData.filter((c) => c.status === "Pending").length,
          inProgress: complaintsData.filter((c) => c.status === "In Progress").length,
          resolved: complaintsData.filter((c) => c.status === "Resolved").length,
          rejected: complaintsData.filter((c) => c.status === "Rejected").length,
        });
      }
    } catch (error) {
      console.error("Error fetching complaints:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (id, newStatus) => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${API_BASE_URL}/api/complaints/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (response.ok) {
        fetchComplaints();
      }
    } catch {
      alert("Error updating status");
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate("/login");
  };

  const handleExport = () => {
    const exportData = complaints.map((c) => ({
      ID: c._id,
      Title: c.title,
      Category: c.category,
      Status: c.status,
      Priority: c.priority,
      Location: c.location,
      "User Name": c.user.name,
      "User Ward": c.user.ward,
      "Date Filed": new Date(c.createdAt).toLocaleDateString(),
    }));

    const headers = Object.keys(exportData[0] || {}).join(",");
    const rows = exportData.map((obj) =>
      Object.values(obj)
        .map((val) => (typeof val === "string" && val.includes(",") ? `"${val}"` : val))
        .join(",")
    );

    const csvData = [headers, ...rows].join("\n");
    const blob = new Blob([csvData], { type: "text/csv" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `complaints_report_${new Date().toISOString().split("T")[0]}.csv`;
    link.click();
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "Resolved":
        return "bg-green-100 text-green-800";
      case "In Progress":
        return "bg-blue-100 text-blue-800";
      case "Rejected":
        return "bg-red-100 text-red-800";
      default:
        return "bg-yellow-100 text-yellow-800";
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case "Critical":
        return "bg-red-100 text-red-800";
      case "High":
        return "bg-orange-100 text-orange-800";
      case "Medium":
        return "bg-yellow-100 text-yellow-800";
      case "Low":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const pieData = [
    { name: "Pending", value: stats.pending },
    { name: "In Progress", value: stats.inProgress },
    { name: "Resolved", value: stats.resolved },
    { name: "Rejected", value: stats.rejected },
  ];

  const categoryData = Object.entries(
    complaints.reduce((acc, curr) => {
      acc[curr.category] = (acc[curr.category] || 0) + 1;
      return acc;
    }, {})
  ).map(([name, value]) => ({ name, value }));

  const filteredComplaints = complaints.filter((c) => {
    const matchesSearch =
      c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.user.name.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = filterStatus ? c.status === filterStatus : true;
    const matchesCategory = filterCategory ? c.category === filterCategory : true;
    const matchesWard = filterWard ? c.user.ward === filterWard : true;

    return matchesSearch && matchesStatus && matchesCategory && matchesWard;
  });

  if (loading) return <div>Loading...</div>;
  if (!user) return <div>Loading...</div>;

  return (
    <div className="p-6 space-y-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Admin Dashboard</h1>
          <p className="text-gray-600">Welcome back, {user.name}!</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleExport}
            className="bg-green-600 text-white px-4 py-2 rounded-lg flex items-center gap-2"
          >
            <FiDownload /> Export Report
          </button>
          <button
            onClick={handleLogout}
            className="bg-red-600 text-white px-4 py-2 rounded-lg flex items-center gap-2"
          >
            <FiLogOut /> Logout
          </button>
        </div>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        {[{ label: "Total", value: stats.total, icon: <FiAlertCircle /> },
          { label: "Pending", value: stats.pending, icon: <FiClock />, color: "text-yellow-600" },
          { label: "In Progress", value: stats.inProgress, icon: <FiUsers />, color: "text-blue-600" },
          { label: "Resolved", value: stats.resolved, icon: <FiCheckCircle />, color: "text-green-600" },
          { label: "Rejected", value: stats.rejected, icon: <FiAlertTriangle />, color: "text-red-600" },
        ].map((card) => (
          <div key={card.label} className="bg-white p-4 rounded-xl shadow flex justify-between items-center">
            <div>
              <p className="text-sm text-gray-500">{card.label}</p>
              <p className={`text-2xl font-bold ${card.color || "text-gray-800"}`}>{card.value}</p>
            </div>
            <div className="p-2 bg-gray-100 rounded-full">{card.icon}</div>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="flex flex-wrap gap-4">
        {/* Pie Chart */}
        <div className="bg-white rounded-xl shadow p-4 w-full lg:w-[48%]">
          <h2 className="text-xl font-semibold text-gray-700 mb-2">Complaints by Status</h2>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie data={pieData} dataKey="value" nameKey="name" outerRadius={100} label>
                {pieData.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Bar Chart */}
        <div className="bg-white rounded-xl shadow p-4 w-full lg:w-[48%]">
          <h2 className="text-xl font-semibold text-gray-700 mb-2">Complaints by Category</h2>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={categoryData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Legend />
              <Bar dataKey="value" fill="#3B82F6" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4 mt-4">
        <input
          type="text"
          placeholder="Search by title or user"
          className="border p-2 rounded w-full max-w-xs"
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        <select className="border p-2 rounded" onChange={(e) => setFilterStatus(e.target.value)}>
          <option value="">All Status</option>
          <option value="Pending">Pending</option>
          <option value="In Progress">In Progress</option>
          <option value="Resolved">Resolved</option>
          <option value="Rejected">Rejected</option>
        </select>
        <select className="border p-2 rounded" onChange={(e) => setFilterCategory(e.target.value)}>
          <option value="">All Categories</option>
          {[...new Set(complaints.map((c) => c.category))].map((cat) => (
            <option key={cat}>{cat}</option>
          ))}
        </select>
        <select className="border p-2 rounded" onChange={(e) => setFilterWard(e.target.value)}>
          <option value="">All Wards</option>
          {[...new Set(complaints.map((c) => c.user.ward))].map((ward) => (
            <option key={ward} value={ward}>{ward}</option>
          ))}
        </select>
      </div>

      {/* Table */}
      <div className="overflow-x-auto mt-4 bg-white rounded-xl shadow">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              {["User", "Complaint", "Category", "Priority", "Location", "Status", "Date"].map((h) => (
                <th key={h} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredComplaints.map((c) => (
              <tr key={c._id}>
                <td className="px-6 py-4 text-sm text-gray-900">
                  {c.user.name}<br /><span className="text-xs text-gray-500">{c.user.ward}</span>
                </td>
                <td className="px-6 py-4 text-sm">
                  {c.title}<br /><span className="text-xs text-gray-500">{c.description}</span>
                </td>
                <td className="px-6 py-4 text-sm text-gray-500">{c.category}</td>
                <td className="px-6 py-4 text-sm">
                  <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getPriorityColor(c.priority)}`}>
                    {c.priority}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm text-gray-500">{c.location}</td>
                <td className="px-6 py-4 text-sm">
                  <select
                    value={c.status}
                    onChange={(e) => handleStatusChange(c._id, e.target.value)}
                    className={`rounded-full px-3 py-1 text-xs ${getStatusColor(c.status)}`}
                  >
                    <option value="Pending">Pending</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Resolved">Resolved</option>
                    <option value="Rejected">Rejected</option>
                  </select>
                </td>
                <td className="px-6 py-4 text-sm text-gray-500">{new Date(c.createdAt).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AdminDashboard;

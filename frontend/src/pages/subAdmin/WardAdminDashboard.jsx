// Full updated component with status update feature
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Bar, Pie } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import { API_BASE_URL } from "../../config/api";

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, Title, Tooltip, Legend);

const WardAdminDashboard = () => {
  const [user, setUser] = useState(null);
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState("All");
  const navigate = useNavigate();

  useEffect(() => {
    const userData = localStorage.getItem("user");
    if (userData) {
      const parsedUser = JSON.parse(userData);
      setUser(parsedUser);
      const wardNumber = parsedUser.ward.replace(/\D/g, "");
      fetchComplaints(wardNumber);
    } else {
      navigate("/login");
    }
  }, [navigate]);

  const fetchComplaints = async (ward) => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${API_BASE_URL}/api/complaints/ward/${ward}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await response.json();
      setComplaints(data.complaints || []);
    } catch (error) {
      console.error("Error fetching complaints:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate("/login");
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
        const updated = await response.json();
        setComplaints((prev) =>
          prev.map((c) => (c._id === id ? { ...c, status: updated.complaint.status } : c))
        );
      } else {
        console.error("Failed to update status");
      }
    } catch (error) {
      console.error("Status update error:", error);
    }
  };

  const filteredComplaints =
    filterStatus === "All"
      ? complaints
      : complaints.filter((c) => c.status === filterStatus);

  const categoryCounts = complaints.reduce((acc, c) => {
    acc[c.category] = (acc[c.category] || 0) + 1;
    return acc;
  }, {});

  const statusCounts = complaints.reduce((acc, c) => {
    acc[c.status] = (acc[c.status] || 0) + 1;
    return acc;
  }, {});

  const chartData = {
    labels: Object.keys(categoryCounts),
    datasets: [{ label: "Complaints", data: Object.values(categoryCounts), backgroundColor: ["#4F46E5", "#6366F1", "#818CF8", "#A5B4FC"] }],
  };

  const statusData = {
    labels: Object.keys(statusCounts),
    datasets: [{ data: Object.values(statusCounts), backgroundColor: ["#facc15", "#38bdf8", "#22c55e"] }],
  };

  const chartOptions = { responsive: true, plugins: { legend: { position: "bottom" }, title: { display: true, text: "Complaints by Category" } } };

  const pieOptions = { responsive: true, plugins: { legend: { position: "bottom" }, title: { display: true, text: "Status Distribution" } } };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-100 to-blue-100">
      <div className="flex justify-between items-center px-8 py-6 bg-white shadow-sm">
        <div>
          <h1 className="text-2xl font-bold text-indigo-700">Ward Admin Dashboard</h1>
          {user && (
            <p className="text-sm text-gray-600 mt-1">
              Welcome, <span className="font-semibold">{user.name}</span> | Ward:{" "}
              <span className="font-semibold">{user.ward}</span>
            </p>
          )}
        </div>
        <button onClick={handleLogout} className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-xl transition-all">
          Logout
        </button>
      </div>

      <div className="max-w-6xl mx-auto py-10 px-4">
        {loading ? (
          <div className="flex justify-center items-center py-16">
            <div className="animate-spin h-10 w-10 border-4 border-indigo-400 border-t-transparent rounded-full"></div>
            <span className="ml-4 text-gray-600 text-lg">Loading complaints...</span>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
              <div className="bg-white rounded-xl shadow-lg p-6">
                <Bar data={chartData} options={chartOptions} />
              </div>
              <div className="bg-white rounded-xl shadow-lg p-6">
                <Pie data={statusData} options={pieOptions} />
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-semibold text-gray-800">Complaints List</h2>
                <select
                  className="border border-gray-300 rounded px-3 py-1"
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                >
                  <option value="All">All</option>
                  <option value="Pending">Pending</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Resolved">Resolved</option>
                </select>
              </div>

              {filteredComplaints.length === 0 ? (
                <p className="text-gray-500">No complaints found for this ward.</p>
              ) : (
                <ul className="divide-y divide-gray-100 max-h-[400px] overflow-y-auto">
                  {filteredComplaints.map((c) => (
                    <li key={c._id} className="py-4 px-2 hover:bg-gray-50 rounded-lg">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="text-lg font-medium text-indigo-800">{c.title}</h3>
                          <p className="text-sm text-gray-700">{c.description}</p>
                          <div className="text-sm text-gray-500 mt-1">
                            Category: <span className="font-medium">{c.category}</span> | Priority:{" "}
                            <span className="font-medium">{c.priority}</span>
                          </div>
                        </div>
                        <div className="text-right">
                          <select
                            className="border border-gray-300 rounded px-2 py-1 text-sm"
                            value={c.status}
                            onChange={(e) => handleStatusChange(c._id, e.target.value)}
                          >
                            <option value="Pending">Pending</option>
                            <option value="In Progress">In Progress</option>
                            <option value="Resolved">Resolved</option>
                          </select>
                          <p className="text-xs text-gray-400 mt-1">{new Date(c.createdAt).toLocaleDateString()}</p>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default WardAdminDashboard;

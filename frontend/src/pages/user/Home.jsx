import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  FaQuoteLeft,
  FaHandsHelping,
  FaRecycle,
  FaUsers,
  FaChartLine,
  FaExclamationTriangle,
} from "react-icons/fa";
import { GiTreeGrowth } from "react-icons/gi";
import Navbar from "../../components/Navbar";
import { API_BASE_URL } from "../../config/api";

const Home = () => {
  const [user, setUser] = useState(null);
  const [stats, setStats] = useState({
    totalComplaints: 0,
    resolvedComplaints: 0,
    pendingComplaints: 0,
    recentComplaints: [],
  });
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const userData = localStorage.getItem("user");
    if (userData) {
      setUser(JSON.parse(userData));
      fetchUserStats();
    } else {
      navigate("/login");
    }
  }, [navigate]);

  const fetchUserStats = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${API_BASE_URL}/api/complaints/my`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        const complaints = data.complaints || [];

        setStats({
          totalComplaints: complaints.length,
          resolvedComplaints: complaints.filter((c) => c.status === "Resolved").length,
          pendingComplaints: complaints.filter((c) => c.status === "Pending").length,
          recentComplaints: complaints.slice(0, 3),
        });
      }
    } catch (error) {
      console.error("Error fetching stats:", error);
    } finally {
      setLoading(false);
    }
  };

  if (!user) return <div>Loading...</div>;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50">
      <Navbar />

      {/* Welcome Section */}
      <section className="py-12 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="bg-white rounded-2xl shadow-lg p-8 mb-8">
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                <span className="text-green-600 font-bold text-2xl">
                  {user.name ? user.name.charAt(0).toUpperCase() : "U"}
                </span>
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-800">
                  Welcome back, {user.name}!
                </h1>
                <p className="text-gray-600 mt-1">
                  {user.ward} • Making your community better together
                </p>
              </div>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white rounded-xl shadow-md p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500">Total Complaints</p>
                  <p className="text-2xl font-bold text-blue-600">{loading ? "..." : stats.totalComplaints}</p>
                </div>
                <FaChartLine className="h-8 w-8 text-blue-500" />
              </div>
            </div>
            <div className="bg-white rounded-xl shadow-md p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500">Resolved</p>
                  <p className="text-2xl font-bold text-green-600">{loading ? "..." : stats.resolvedComplaints}</p>
                </div>
                <FaUsers className="h-8 w-8 text-green-500" />
              </div>
            </div>
            <div className="bg-white rounded-xl shadow-md p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500">Pending</p>
                  <p className="text-2xl font-bold text-yellow-600">{loading ? "..." : stats.pendingComplaints}</p>
                </div>
                <FaExclamationTriangle className="h-8 w-8 text-yellow-500" />
              </div>
            </div>
          </div>

          {/* Recent Complaints */}
          <div className="bg-white rounded-xl shadow-md p-6 mb-8">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Recent Complaints</h3>
            {loading ? (
              <p className="text-gray-500">Loading...</p>
            ) : stats.recentComplaints.length === 0 ? (
              <p className="text-gray-500">No complaints filed yet. Start by filing your first complaint!</p>
            ) : (
              <div className="space-y-3">
                {stats.recentComplaints.map((complaint) => (
                  <div
                    key={complaint._id}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                  >
                    <div>
                      <p className="font-medium text-gray-800">{complaint.title}</p>
                      <p className="text-sm text-gray-600">
                        {complaint.category} • {complaint.location}
                      </p>
                    </div>
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${
                        complaint.status === "Resolved"
                          ? "bg-green-100 text-green-800"
                          : complaint.status === "In Progress"
                          ? "bg-blue-100 text-blue-800"
                          : complaint.status === "Pending"
                          ? "bg-yellow-100 text-yellow-800"
                          : "bg-red-100 text-red-800"
                      }`}
                    >
                      {complaint.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Hero Section */}
      <section className="relative h-96 overflow-hidden">
        <img
          src="https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=2070&q=80"
          alt="Clean neighborhood"
          className="w-full h-full object-cover brightness-75"
        />
        <div className="absolute inset-0 flex items-center justify-center text-center px-4">
          <div className="text-white max-w-4xl">
            <h1 className="text-4xl md:text-6xl font-bold mb-4 text-shadow-lg">
              Together for a better Tomorrow
            </h1>
            <p className="text-xl md:text-2xl italic font-light">
              "Turning citizen complaints into smart city solutions , one complaint at at time."
            </p>
          </div>
        </div>
      </section>

      {/* Mission & Vision */}
      <section className="py-16 px-4 max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-green-700 mb-4">Our Mission & Vision</h2>
          <div className="w-24 h-1 bg-blue-500 mx-auto"></div>
        </div>

        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div className="space-y-8">
            <div className="p-6 bg-white rounded-xl shadow-lg border-l-4 border-blue-500">
              <div className="flex items-center mb-4">
                <div className="p-3 bg-blue-100 rounded-full mr-4">
                  <FaHandsHelping className="text-blue-600 text-2xl" />
                </div>
                <h3 className="text-xl font-bold text-gray-800">Our Mission</h3>
              </div>
              <p className="text-gray-600">
                To develop an intelligent web platform that transforms civic complaint management through ML-powered priority detection, AI-driven solution recommendations, and real-time geospatial tracking.
              </p>
            </div>

            <div className="p-6 bg-white rounded-xl shadow-lg border-l-4 border-green-500">
              <div className="flex items-center mb-4">
                <div className="p-3 bg-green-100 rounded-full mr-4">
                  <GiTreeGrowth className="text-green-600 text-2xl" />
                </div>
                <h3 className="text-xl font-bold text-gray-800">Our Vision</h3>
              </div>
              <p className="text-gray-600">
               To create a future where every civic complaint is intelligently prioritized and seamlessly resolved, fostering highly responsive, transparent, and efficient urban governance.
              </p>
            </div>
          </div>

          {/* Inspirational Quotes */}
          {/* <div className="bg-white p-8 rounded-xl shadow-lg space-y-6">
            {[
              {
                quote: "We won't have a society if we destroy the environment.",
                author: "Margaret Mead",
                color: "yellow-400",
              },
              {
                quote: "Cleanliness is next to godliness.",
                author: "John Wesley",
                color: "green-400",
              },
              {
                quote: "The environment is where we all meet; where all have a mutual interest.",
                author: "Lady Bird Johnson",
                color: "blue-400",
              },
            ].map(({ quote, author, color }, i) => (
              <div className="flex items-start" key={i}>
                <FaQuoteLeft className={`text-${color} text-2xl mr-4 mt-1`} />
                <p className="text-lg italic text-gray-700">
                  "{quote}"
                  <span className="block font-medium mt-2">- {author}</span>
                </p>
              </div>
            ))}
          </div> */}
        </div>
      </section>

      {/* Values Section */}
      <section className="py-16 bg-blue-600 text-white">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">Our Core Values</h2>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: <FaRecycle className="text-4xl mb-4" />,
                title: "Citizen centric",
                desc: "Your voice, our first priority",
              },
              {
                icon: <FaUsers className="text-4xl mb-4" />,
                title: "intelligent action",
                desc: "Smart data, faster solutions.",
              },
              {
                icon: <FaHandsHelping className="text-4xl mb-4" />,
                title: "transparent",
                desc: "See your report solved, every step of the way",
              },
            ].map((val, idx) => (
              <div
                key={idx}
                className="text-center p-6 bg-blue-700 rounded-xl hover:bg-blue-800 transition-colors"
              >
                <div className="flex justify-center">{val.icon}</div>
                <h3 className="text-xl font-bold mb-2">{val.title}</h3>
                <p>{val.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="py-16 px-4 text-center">
        <div className="max-w-2xl mx-auto bg-white p-8 rounded-xl shadow-lg">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Join the Movement</h2>
          <p className="text-gray-600 mb-6">
            Be part of the solution! Report issues in your neighborhood and help us create cleaner, safer communities.
          </p>
          <button className="bg-gradient-to-r from-green-500 to-blue-500 text-white px-8 py-3 rounded-full font-bold hover:opacity-90 transition-opacity">
            Get Started Today
          </button>
        </div>
      </section>
    </div>
  );
};

export default Home;

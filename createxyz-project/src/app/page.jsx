"use client";
import React from "react";
import { useEffect, useState } from "react";
import { useUser } from "@clerk/nextjs"; // ✅ Change this line if you're using a different auth provider

function MainComponent() {
  const { data: user, isLoading: userLoading } = useUser(); // Also fixed: useUser returns `isLoading`

  const [issues, setIssues] = useState([]);
  const [userRole, setUserRole] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState({
    LOW: 0,
    MEDIUM: 0,
    HIGH: 0,
    CRITICAL: 0,
  });

  useEffect(() => {
    if (user) {
      fetchUserRole();
      fetchIssues();
      fetchStats();
    }
  }, [user]);

  const fetchUserRole = async () => {
    try {
      const response = await fetch("/api/get-user-role", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.id }),
      });
      if (!response.ok) throw new Error("Failed to fetch user role");
      const data = await response.json();
      setUserRole(data.role || "REPORTER");
    } catch (err) {
      console.error("Error fetching user role:", err);
      setUserRole("REPORTER");
    }
  };

  const fetchIssues = async () => {
    try {
      const response = await fetch("/api/list-issues", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.id }),
      });
      if (!response.ok) throw new Error("Failed to fetch issues");
      const data = await response.json();
      setIssues(data.issues || []);
    } catch (err) {
      console.error("Error fetching issues:", err);
      setError("Failed to load issues");
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await fetch("/api/get-dashboard-stats", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      if (!response.ok) throw new Error("Failed to fetch stats");
      const data = await response.json();
      setStats(data.stats || { LOW: 0, MEDIUM: 0, HIGH: 0, CRITICAL: 0 });
    } catch (err) {
      console.error("Error fetching stats:", err);
    }
  };

  const getSeverityColor = (severity) => {
    switch (severity) {
      case "CRITICAL":
        return "bg-red-100 text-red-800 border-red-200";
      case "HIGH":
        return "bg-orange-100 text-orange-800 border-orange-200";
      case "MEDIUM":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "LOW":
        return "bg-green-100 text-green-800 border-green-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "OPEN":
        return "bg-blue-100 text-blue-800";
      case "TRIAGED":
        return "bg-purple-100 text-purple-800";
      case "IN_PROGRESS":
        return "bg-yellow-100 text-yellow-800";
      case "DONE":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  if (userLoading || loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="text-center max-w-md mx-auto p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Issues & Insights Tracker
          </h1>
          <p className="text-gray-600 mb-8">
            Please sign in to access the issue tracking system.
          </p>
          <div className="space-y-4">
            <a
              href="/account/signin"
              className="block w-full bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors"
            >
              Sign In
            </a>
            <a
              href="/account/signup"
              className="block w-full bg-gray-100 text-gray-700 px-6 py-3 rounded-lg font-medium hover:bg-gray-200 transition-colors"
            >
              Create Account
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-gray-900">
                Issues & Insights Tracker
              </h1>
              <span className="ml-4 px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
                {userRole}
              </span>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">
                Welcome, {user.email}
              </span>
              <a
                href="/create-issue"
                className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors"
              >
                Create Issue
              </a>
              <a
                href="/account/logout"
                className="text-gray-600 hover:text-gray-900 transition-colors"
              >
                Sign Out
              </a>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Dashboard Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          {["CRITICAL", "HIGH", "MEDIUM", "LOW"].map((level) => (
            <div key={level} className="bg-white p-6 rounded-lg shadow-sm border">
              <div className="flex items-center">
                <div
                  className={`p-2 rounded-lg ${
                    level === "CRITICAL"
                      ? "bg-red-100"
                      : level === "HIGH"
                      ? "bg-orange-100"
                      : level === "MEDIUM"
                      ? "bg-yellow-100"
                      : "bg-green-100"
                  }`}
                >
                  <i
                    className={`fas ${
                      level === "CRITICAL"
                        ? "fa-exclamation-triangle text-red-600"
                        : level === "HIGH"
                        ? "fa-exclamation-circle text-orange-600"
                        : level === "MEDIUM"
                        ? "fa-minus-circle text-yellow-600"
                        : "fa-check-circle text-green-600"
                    }`}
                  ></i>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">
                    {level.charAt(0) + level.slice(1).toLowerCase()} Priority
                  </p>
                  <p className="text-2xl font-bold text-gray-900">
                    {stats[level]}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Issues List */}
        <div className="bg-white rounded-lg shadow-sm border">
          <div className="px-6 py-4 border-b">
            <h2 className="text-lg font-semibold text-gray-900">
              Recent Issues
            </h2>
          </div>

          {error && (
            <div className="p-4 bg-red-50 border-l-4 border-red-400">
              <p className="text-red-700">{error}</p>
            </div>
          )}

          <div className="divide-y divide-gray-200">
            {issues.length === 0 ? (
              <div className="p-8 text-center">
                <i className="fas fa-inbox text-4xl text-gray-300 mb-4"></i>
                <p className="text-gray-500">
                  No issues found. Create your first issue to get started.
                </p>
                <a
                  href="/create-issue"
                  className="mt-4 inline-block bg-blue-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors"
                >
                  Create Issue
                </a>
              </div>
            ) : (
              issues.map((issue) => (
                <div
                  key={issue.id}
                  className="p-6 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="text-lg font-medium text-gray-900">
                          <a
                            href={`/issue/${issue.id}`}
                            className="hover:text-blue-600"
                          >
                            {issue.title}
                          </a>
                        </h3>
                        <span
                          className={`px-2 py-1 text-xs font-medium rounded-full border ${getSeverityColor(
                            issue.severity
                          )}`}
                        >
                          {issue.severity}
                        </span>
                        <span
                          className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(
                            issue.status
                          )}`}
                        >
                          {issue.status}
                        </span>
                      </div>
                      <p className="text-gray-600 mb-3 line-clamp-2">
                        {issue.description}
                      </p>
                      <div className="flex items-center text-sm text-gray-500 space-x-4">
                        <span>#{issue.id}</span>
                        <span>
                          Created{" "}
                          {new Date(issue.created_at).toLocaleDateString()}
                        </span>
                        {issue.file_name && (
                          <span className="flex items-center">
                            <i className="fas fa-paperclip mr-1"></i>
                            {issue.file_name}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="ml-4">
                      <a
                        href={`/issue/${issue.id}`}
                        className="text-blue-600 hover:text-blue-800 font-medium"
                      >
                        View Details
                      </a>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default MainComponent;

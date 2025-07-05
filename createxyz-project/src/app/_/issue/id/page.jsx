"use client";
import React from "react";

function MainComponent() {
  const { data: user, loading: userLoading } = useUser();
  const [issue, setIssue] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [updating, setUpdating] = useState(false);
  const [newComment, setNewComment] = useState("");
  const [addingComment, setAddingComment] = useState(false);
  const [comments, setComments] = useState([]);
  const [issueId, setIssueId] = useState(null);

  // Extract issue ID from URL
  useEffect(() => {
    const path = window.location.pathname;
    const id = path.split("/").pop();
    if (id && !isNaN(id)) {
      setIssueId(parseInt(id));
    } else {
      setError("Invalid issue ID");
      setLoading(false);
    }
  }, []);

  // Fetch user role and issue data
  useEffect(() => {
    if (user && issueId) {
      fetchUserRole();
      fetchIssue();
      fetchComments();
    }
  }, [user, issueId]);

  // Real-time updates every 30 seconds
  useEffect(() => {
    if (user && issueId) {
      const interval = setInterval(() => {
        fetchIssue();
        fetchComments();
      }, 30000);
      return () => clearInterval(interval);
    }
  }, [user, issueId]);

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

  const fetchIssue = async () => {
    try {
      const response = await fetch("/api/get-issue", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ issueId }),
      });
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error("Issue not found");
        }
        throw new Error("Failed to fetch issue");
      }
      const data = await response.json();
      setIssue(data.issue);
    } catch (err) {
      console.error("Error fetching issue:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchComments = async () => {
    try {
      const response = await fetch("/api/get-comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ issueId }),
      });
      if (!response.ok) throw new Error("Failed to fetch comments");
      const data = await response.json();
      setComments(data.comments || []);
    } catch (err) {
      console.error("Error fetching comments:", err);
    }
  };

  const updateIssueStatus = async (newStatus) => {
    setUpdating(true);
    try {
      const response = await fetch("/api/update-issue", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          issueId,
          status: newStatus,
          updatedBy: user.id,
        }),
      });
      if (!response.ok) throw new Error("Failed to update issue status");
      const data = await response.json();
      setIssue(data.issue);
    } catch (err) {
      console.error("Error updating issue status:", err);
      setError("Failed to update issue status");
    } finally {
      setUpdating(false);
    }
  };

  const updateIssueSeverity = async (newSeverity) => {
    setUpdating(true);
    try {
      const response = await fetch("/api/update-issue", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          issueId,
          severity: newSeverity,
          updatedBy: user.id,
        }),
      });
      if (!response.ok) throw new Error("Failed to update issue severity");
      const data = await response.json();
      setIssue(data.issue);
    } catch (err) {
      console.error("Error updating issue severity:", err);
      setError("Failed to update issue severity");
    } finally {
      setUpdating(false);
    }
  };

  const addComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    setAddingComment(true);
    try {
      const response = await fetch("/api/add-comment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          issueId,
          comment: newComment.trim(),
          userId: user.id,
        }),
      });
      if (!response.ok) throw new Error("Failed to add comment");
      const data = await response.json();
      setComments([...comments, data.comment]);
      setNewComment("");
    } catch (err) {
      console.error("Error adding comment:", err);
      setError("Failed to add comment");
    } finally {
      setAddingComment(false);
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

  const renderMarkdown = (text) => {
    return text
      .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
      .replace(/\*(.*?)\*/g, "<em>$1</em>")
      .replace(
        /`(.*?)`/g,
        '<code class="bg-gray-100 px-1 py-0.5 rounded text-sm">$1</code>'
      )
      .replace(/\n/g, "<br>");
  };

  const canManageIssue = userRole === "MAINTAINER" || userRole === "ADMIN";

  if (userLoading || loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading issue...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="text-center max-w-md mx-auto p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Issue Details
          </h1>
          <p className="text-gray-600 mb-8">
            Please sign in to view issue details.
          </p>
          <div className="space-y-4">
            <a
              href={`/account/signin?callbackUrl=/issue/${issueId}`}
              className="block w-full bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors"
            >
              Sign In
            </a>
            <a
              href={`/account/signup?callbackUrl=/issue/${issueId}`}
              className="block w-full bg-gray-100 text-gray-700 px-6 py-3 rounded-lg font-medium hover:bg-gray-200 transition-colors"
            >
              Create Account
            </a>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <header className="bg-white shadow-sm border-b">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <div className="flex items-center">
                <a href="/" className="text-blue-600 hover:text-blue-800 mr-4">
                  <i className="fas fa-arrow-left"></i>
                </a>
                <h1 className="text-2xl font-bold text-gray-900">
                  Issue Details
                </h1>
              </div>
            </div>
          </div>
        </header>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
            <i className="fas fa-exclamation-triangle text-red-600 text-3xl mb-4"></i>
            <h2 className="text-xl font-semibold text-red-800 mb-2">Error</h2>
            <p className="text-red-700">{error}</p>
            <a
              href="/dashboard"
              className="mt-4 inline-block bg-blue-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors"
            >
              Back to Dashboard
            </a>
          </div>
        </div>
      </div>
    );
  }

  if (!issue) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="flex items-center justify-center h-64">
          <p className="text-gray-500">Issue not found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <a href="/" className="text-blue-600 hover:text-blue-800 mr-4">
                <i className="fas fa-arrow-left"></i>
              </a>
              <h1 className="text-2xl font-bold text-gray-900">
                Issue #{issue.id}
              </h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">{user.email}</span>
              <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
                {userRole}
              </span>
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

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Issue Header */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <div className="flex items-start justify-between mb-4">
                <h2 className="text-2xl font-bold text-gray-900 flex-1 mr-4">
                  {issue.title}
                </h2>
                <div className="flex items-center space-x-2">
                  <span
                    className={`px-3 py-1 text-sm font-medium rounded-full border ${getSeverityColor(
                      issue.severity
                    )}`}
                  >
                    {issue.severity}
                  </span>
                  <span
                    className={`px-3 py-1 text-sm font-medium rounded-full ${getStatusColor(
                      issue.status
                    )}`}
                  >
                    {issue.status}
                  </span>
                </div>
              </div>

              <div className="flex items-center text-sm text-gray-500 space-x-4 mb-6">
                <span>
                  Created {new Date(issue.created_at).toLocaleDateString()}
                </span>
                {issue.updated_at && issue.updated_at !== issue.created_at && (
                  <span>
                    Updated {new Date(issue.updated_at).toLocaleDateString()}
                  </span>
                )}
              </div>

              <div
                className="prose max-w-none text-gray-700"
                dangerouslySetInnerHTML={{
                  __html: renderMarkdown(issue.description),
                }}
              />

              {/* File Attachment */}
              {issue.file_url && issue.file_name && (
                <div className="mt-6 p-4 bg-gray-50 rounded-lg border">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <i className="fas fa-paperclip text-gray-500 mr-3"></i>
                      <span className="text-sm font-medium text-gray-900">
                        {issue.file_name}
                      </span>
                    </div>
                    <a
                      href={issue.file_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                    >
                      Download
                    </a>
                  </div>
                </div>
              )}
            </div>

            {/* Comments Section */}
            <div className="bg-white rounded-lg shadow-sm border">
              <div className="px-6 py-4 border-b">
                <h3 className="text-lg font-semibold text-gray-900">
                  Comments ({comments.length})
                </h3>
              </div>

              <div className="divide-y divide-gray-200">
                {comments.length === 0 ? (
                  <div className="p-6 text-center text-gray-500">
                    No comments yet. Be the first to comment!
                  </div>
                ) : (
                  comments.map((comment) => (
                    <div key={comment.id} className="p-6">
                      <div className="flex items-start space-x-3">
                        <div className="flex-shrink-0">
                          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                            <i className="fas fa-user text-blue-600 text-sm"></i>
                          </div>
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-2">
                            <span className="text-sm font-medium text-gray-900">
                              {comment.user_email}
                            </span>
                            <span className="text-xs text-gray-500">
                              {new Date(comment.created_at).toLocaleString()}
                            </span>
                          </div>
                          <div
                            className="text-gray-700 text-sm"
                            dangerouslySetInnerHTML={{
                              __html: renderMarkdown(comment.comment),
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Add Comment Form */}
              <div className="px-6 py-4 border-t bg-gray-50">
                <form onSubmit={addComment}>
                  <div className="flex space-x-3">
                    <div className="flex-shrink-0">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                        <i className="fas fa-user text-blue-600 text-sm"></i>
                      </div>
                    </div>
                    <div className="flex-1">
                      <textarea
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        placeholder="Add a comment... (Markdown supported)"
                        rows={3}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none resize-vertical"
                        disabled={addingComment}
                      />
                      <div className="flex justify-between items-center mt-2">
                        <span className="text-xs text-gray-500">
                          Use **bold**, *italic*, `code` for formatting
                        </span>
                        <button
                          type="submit"
                          disabled={addingComment || !newComment.trim()}
                          className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {addingComment ? (
                            <span className="flex items-center">
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                              Adding...
                            </span>
                          ) : (
                            "Add Comment"
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                </form>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Status Management */}
            {canManageIssue && (
              <div className="bg-white rounded-lg shadow-sm border p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Manage Issue
                </h3>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Status
                    </label>
                    <select
                      value={issue.status}
                      onChange={(e) => updateIssueStatus(e.target.value)}
                      disabled={updating}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                    >
                      <option value="OPEN">Open</option>
                      <option value="TRIAGED">Triaged</option>
                      <option value="IN_PROGRESS">In Progress</option>
                      <option value="DONE">Done</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Severity
                    </label>
                    <select
                      value={issue.severity}
                      onChange={(e) => updateIssueSeverity(e.target.value)}
                      disabled={updating}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                    >
                      <option value="LOW">Low</option>
                      <option value="MEDIUM">Medium</option>
                      <option value="HIGH">High</option>
                      <option value="CRITICAL">Critical</option>
                    </select>
                  </div>

                  {updating && (
                    <div className="flex items-center text-sm text-blue-600">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
                      Updating...
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Issue Info */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Issue Information
              </h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Issue ID:</span>
                  <span className="font-medium">#{issue.id}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Created:</span>
                  <span className="font-medium">
                    {new Date(issue.created_at).toLocaleDateString()}
                  </span>
                </div>
                {issue.updated_at && issue.updated_at !== issue.created_at && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Last Updated:</span>
                    <span className="font-medium">
                      {new Date(issue.updated_at).toLocaleDateString()}
                    </span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-gray-600">Reporter:</span>
                  <span className="font-medium">{issue.reporter_email}</span>
                </div>
              </div>
            </div>

            {/* Real-time Updates Indicator */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center">
                <i className="fas fa-sync-alt text-blue-600 mr-2"></i>
                <span className="text-sm text-blue-800">
                  Auto-refreshing every 30 seconds
                </span>
              </div>
            </div>
          </div>
        </div>

        {error && (
          <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center">
              <i className="fas fa-exclamation-circle text-red-600 mr-3"></i>
              <p className="text-red-800">{error}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default MainComponent;
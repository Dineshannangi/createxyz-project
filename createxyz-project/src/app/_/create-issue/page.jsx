"use client";
import React from "react";

import { useUpload } from "../utilities/runtime-helpers";

function MainComponent() {
  const { data: user, loading: userLoading } = useUser();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [severity, setSeverity] = useState("MEDIUM");
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [upload, { loading: uploading }] = useUpload();
  const [previewMode, setPreviewMode] = useState(false);

  const severityOptions = [
    {
      value: "LOW",
      label: "Low",
      color: "text-green-600",
      bgColor: "bg-green-50",
    },
    {
      value: "MEDIUM",
      label: "Medium",
      color: "text-yellow-600",
      bgColor: "bg-yellow-50",
    },
    {
      value: "HIGH",
      label: "High",
      color: "text-orange-600",
      bgColor: "bg-orange-50",
    },
    {
      value: "CRITICAL",
      label: "Critical",
      color: "text-red-600",
      bgColor: "bg-red-50",
    },
  ];

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

  const validateForm = () => {
    if (!title.trim()) {
      setError("Title is required");
      return false;
    }
    if (title.trim().length < 3) {
      setError("Title must be at least 3 characters long");
      return false;
    }
    if (!description.trim()) {
      setError("Description is required");
      return false;
    }
    if (description.trim().length < 10) {
      setError("Description must be at least 10 characters long");
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      let fileUrl = null;
      let fileName = null;

      if (file) {
        const uploadResult = await upload({ file });
        if (uploadResult.error) {
          throw new Error(uploadResult.error);
        }
        fileUrl = uploadResult.url;
        fileName = file.name;
      }

      const response = await fetch("/api/create-issue", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim(),
          severity,
          fileUrl,
          fileName,
          userId: user.id,
        }),
      });

      if (!response.ok) {
        throw new Error(
          `When creating issue, the response was [${response.status}] ${response.statusText}`
        );
      }

      const data = await response.json();

      if (data.error) {
        throw new Error(data.error);
      }

      setSuccess(true);
      setTitle("");
      setDescription("");
      setSeverity("MEDIUM");
      setFile(null);

      setTimeout(() => {
        window.location.href = "/";
      }, 2000);
    } catch (err) {
      console.error("Error creating issue:", err);
      setError(err.message || "Failed to create issue. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      if (selectedFile.size > 10 * 1024 * 1024) {
        setError("File size must be less than 10MB");
        return;
      }
      setFile(selectedFile);
      setError(null);
    }
  };

  const removeFile = () => {
    setFile(null);
    const fileInput = document.querySelector('input[type="file"]');
    if (fileInput) {
      fileInput.value = "";
    }
  };

  if (userLoading) {
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
            Create Issue
          </h1>
          <p className="text-gray-600 mb-8">
            Please sign in to create an issue.
          </p>
          <div className="space-y-4">
            <a
              href="/account/signin?callbackUrl=/create-issue"
              className="block w-full bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors"
            >
              Sign In
            </a>
            <a
              href="/account/signup?callbackUrl=/create-issue"
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
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <a
                href="/dashboard"
                className="text-blue-600 hover:text-blue-800 mr-4"
              >
                <i className="fas fa-arrow-left"></i>
              </a>
              <h1 className="text-2xl font-bold text-gray-900">
                Create New Issue
              </h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">{user.email}</span>
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
        {success && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center">
              <i className="fas fa-check-circle text-green-600 mr-3"></i>
              <div>
                <p className="text-green-800 font-medium">
                  Issue created successfully!
                </p>
                <p className="text-green-700 text-sm">
                  Redirecting to dashboard...
                </p>
              </div>
            </div>
          </div>
        )}

        <form
          onSubmit={handleSubmit}
          className="bg-white rounded-lg shadow-sm border p-6"
        >
          <div className="space-y-6">
            <div>
              <label
                htmlFor="title"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Title *
              </label>
              <input
                type="text"
                id="title"
                name="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Brief description of the issue"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
                disabled={loading}
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label
                  htmlFor="description"
                  className="block text-sm font-medium text-gray-700"
                >
                  Description *
                </label>
                <div className="flex items-center space-x-2">
                  <button
                    type="button"
                    onClick={() => setPreviewMode(!previewMode)}
                    className="text-sm text-blue-600 hover:text-blue-800 transition-colors"
                  >
                    {previewMode ? "Edit" : "Preview"}
                  </button>
                  <span className="text-xs text-gray-500">
                    Markdown supported
                  </span>
                </div>
              </div>

              {previewMode ? (
                <div
                  className="w-full min-h-[200px] px-4 py-3 border border-gray-300 rounded-lg bg-gray-50"
                  dangerouslySetInnerHTML={{
                    __html: renderMarkdown(description),
                  }}
                />
              ) : (
                <textarea
                  id="description"
                  name="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Detailed description of the issue. You can use **bold**, *italic*, and `code` formatting."
                  rows={8}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors resize-vertical"
                  disabled={loading}
                />
              )}
              <p className="mt-1 text-xs text-gray-500">
                Use **bold**, *italic*, `code` for formatting
              </p>
            </div>

            <div>
              <label
                htmlFor="severity"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Severity *
              </label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {severityOptions.map((option) => (
                  <label
                    key={option.value}
                    className={`relative flex items-center justify-center p-3 border-2 rounded-lg cursor-pointer transition-all ${
                      severity === option.value
                        ? `border-blue-500 ${option.bgColor}`
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <input
                      type="radio"
                      name="severity"
                      value={option.value}
                      checked={severity === option.value}
                      onChange={(e) => setSeverity(e.target.value)}
                      className="sr-only"
                      disabled={loading}
                    />
                    <div className="text-center">
                      <div className={`text-sm font-medium ${option.color}`}>
                        {option.label}
                      </div>
                    </div>
                    {severity === option.value && (
                      <div className="absolute top-2 right-2">
                        <i className="fas fa-check-circle text-blue-500 text-sm"></i>
                      </div>
                    )}
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Attachment (Optional)
              </label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors">
                {file ? (
                  <div className="flex items-center justify-between bg-gray-50 p-3 rounded-lg">
                    <div className="flex items-center">
                      <i className="fas fa-file text-gray-500 mr-3"></i>
                      <div className="text-left">
                        <p className="text-sm font-medium text-gray-900">
                          {file.name}
                        </p>
                        <p className="text-xs text-gray-500">
                          {(file.size / 1024 / 1024).toFixed(2)} MB
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={removeFile}
                      className="text-red-600 hover:text-red-800 transition-colors"
                      disabled={loading}
                    >
                      <i className="fas fa-times"></i>
                    </button>
                  </div>
                ) : (
                  <div>
                    <i className="fas fa-cloud-upload-alt text-3xl text-gray-400 mb-3"></i>
                    <p className="text-gray-600 mb-2">
                      Drop a file here or click to browse
                    </p>
                    <p className="text-xs text-gray-500">
                      Maximum file size: 10MB
                    </p>
                    <input
                      type="file"
                      onChange={handleFileChange}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      disabled={loading}
                    />
                  </div>
                )}
              </div>
            </div>

            {error && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-center">
                  <i className="fas fa-exclamation-circle text-red-600 mr-3"></i>
                  <p className="text-red-800">{error}</p>
                </div>
              </div>
            )}

            <div className="flex items-center justify-between pt-6 border-t">
              <a
                href="/dashboard"
                className="px-6 py-3 text-gray-700 bg-gray-100 rounded-lg font-medium hover:bg-gray-200 transition-colors"
              >
                Cancel
              </a>
              <button
                type="submit"
                disabled={loading || uploading}
                className="px-8 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <span className="flex items-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Creating...
                  </span>
                ) : uploading ? (
                  <span className="flex items-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Uploading...
                  </span>
                ) : (
                  "Create Issue"
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

export default MainComponent;
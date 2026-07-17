import { useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../../api/api";

function ForgotPassword() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      await API.post("/auth/forgot-password", { email });
      setMessage("If your email is registered, you will receive a password reset link.");
    } catch (error) {
      setMessage("Error sending reset link. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
        <h1 className="text-2xl font-bold mb-6 text-center">Forgot Password</h1>
        
        <p className="text-gray-600 mb-6 text-center">
          Enter your email address and we'll send you a link to reset your password.
        </p>

        {message && (
          <div className={`p-4 mb-4 rounded ${message.includes("Error") ? "bg-red-100 text-red-700" : "bg-green-100 text-green-700"}`}>
            {message}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email Address
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter your email"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Sending..." : "Send Reset Link"}
          </button>
        </form>

        <div className="mt-6 text-center">
          <button
            onClick={() => navigate("/login")}
            className="text-blue-600 hover:underline"
          >
            Back to Login
          </button>
        </div>
      </div>
    </div>
  );
}

export default ForgotPassword;

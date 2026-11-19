
import { useEffect, useState } from "react";

import { apiRequest } from "./services/api";

import "./App.css";

function App() {

  const [user, setUser] = useState(null);

  const [loading, setLoading] = useState(true);

  const [mode, setMode] = useState("login");

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [department, setDepartment] = useState("IT");

  const [error, setError] = useState("");
  const [users, setUsers] = useState([]);

  // Check whether user is already logged in
  useEffect(() => {

    const checkLogin = async () => {

      try {

        const data = await apiRequest("/api/auth/me");

        setUser(data.user);

      } catch {

        setUser(null);

      } finally {

        setLoading(false);

      }

    };

    checkLogin();

  }, []);

  // Register or login
  const handleSubmit = async (event) => {

    event.preventDefault();

    setError("");

    try {

      const endpoint =
        mode === "register"
          ? "/api/auth/register"
          : "/api/auth/login";

      const body =
        mode === "register"
          ? { name, email, password, department }
          : { email, password };

      const data = await apiRequest(endpoint, {
        method: "POST",
        body: JSON.stringify(body)
      });

      setUser(data.user);

      setPassword("");

    } catch (err) {

      setError(err.message);

    }

  };

  // Logout
  const handleLogout = async () => {

    try {

      await apiRequest("/api/auth/logout", {
        method: "POST"
      });

      setUser(null);
      setUsers([]);

    } catch (err) {

      setError(err.message);

    }

  };

  // Load all employees (Admin only)
  const handleLoadUsers = async () => {

    setError("");

    try {

      const data = await apiRequest("/api/users");

      setUsers(data.users);

    } catch (err) {

      setError(err.message);

    }

  };

  if (loading) {

    return <h2 className="loading">Loading...</h2>;

  }

  // Dashboard after login
  if (user) {

    return (

      <div className="app-container">

        <div className="dashboard-card">

          <h1>Enterprise AI Operations Copilot</h1>

          <h2>Welcome, {user.name}!</h2>

          <div className="profile">

            <p><strong>Email:</strong> {user.email}</p>

            <p><strong>Role:</strong> {user.role}</p>

            <p>
              <strong>Department:</strong> {user.department}
            </p>

          </div>

          {user.role === "admin" && (

            <div className="admin-section">

              <h2>Admin Panel</h2>

              <button onClick={handleLoadUsers}>
                View All Employees
              </button>

              {users.map((employee) => (

                <div className="employee" key={employee._id}>

                  <p>{employee.name}</p>

                  <p>{employee.email}</p>

                  <p>{employee.role}</p>

                </div>

              ))}

            </div>

          )}

          {error && <p className="error">{error}</p>}

          <button
            className="logout-button"
            onClick={handleLogout}
          >
            Logout
          </button>

        </div>

      </div>

    );

  }

  // Login and registration screens
  return (

    <div className="app-container">

      <div className="auth-card">

        <h1>Enterprise AI Copilot</h1>

        <h2>
          {mode === "login" ? "Login" : "Create Account"}
        </h2>

        <form onSubmit={handleSubmit}>

          {mode === "register" && (

            <>

              <input
                type="text"
                placeholder="Full Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                minLength={2}
                maxLength={60}
                required
              />

              <select
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
              >

                <option value="IT">IT</option>
                <option value="HR">HR</option>
                <option value="Finance">Finance</option>
                <option value="Operations">Operations</option>

              </select>

            </>

          )}

          <input
            type="email"
            placeholder="Email Address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            minLength={8}
            maxLength={72}
            required
          />

          {error && <p className="error">{error}</p>}

          <button type="submit">

            {mode === "login" ? "Login" : "Register"}

          </button>

        </form>

        <p className="switch-text">

          {mode === "login"
            ? "Don't have an account?"
            : "Already have an account?"}

          <button
            className="switch-button"
            onClick={() => {

              setMode(
                mode === "login" ? "register" : "login"
              );

              setError("");

            }}
          >

            {mode === "login" ? "Register" : "Login"}

          </button>

        </p>

      </div>

    </div>

  );

}

export default App;

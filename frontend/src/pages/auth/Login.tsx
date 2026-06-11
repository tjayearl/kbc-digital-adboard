import { useState } from "react";
import {
  signInWithEmailAndPassword,
  sendPasswordResetEmail
} from "firebase/auth";
import { auth } from "../../firebase";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // LOGIN
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setMessage("");
    setLoading(true);

    try {
      const userCredential = await signInWithEmailAndPassword(
        auth,
        email,
        password
      );

      const user = userCredential.user;

      // Get token + role claims
      const tokenResult = await user.getIdTokenResult(true);
      const role = tokenResult.claims.role as string | undefined;

      console.log("USER EMAIL:", user.email);
      console.log("USER UID:", user.uid);
      console.log("USER CLAIMS:", tokenResult.claims);
      console.log("ROLE:", role);

      // Save role to localStorage for dashboard to use
      if (role) {
        localStorage.setItem("role", role);
        setMessage(`Welcome back, ${user.email}. Role: ${role}`);
      } else {
        setMessage(`Welcome back, ${user.email}. No role assigned.`);
      }

      // Redirect after short delay
      setTimeout(() => {
        window.location.href = "/";
      }, 500);

    } catch (err) {
      console.error(err);
      setError("Invalid email or password");
    } finally {
      setLoading(false);
    }
  };

  // FORGOT PASSWORD
  const handleResetPassword = async () => {
    setError("");
    setMessage("");

    if (!email) {
      setError("Please enter your email first");
      return;
    }

    try {
      await sendPasswordResetEmail(auth, email);
      setMessage("Password reset email sent!");
    } catch (err) {
      setError("Failed to send reset email");
    }
  };

  return (
    <div style={styles.page}>

      <img src="/logo.png" style={styles.logo} />

      <h1 style={styles.title}>Digital AdBoard</h1>
      <p style={styles.subtitle}>
        Advertising Booking & Order Management
      </p>

      <form style={styles.card} onSubmit={handleLogin}>

        <h2 style={styles.welcome}>Welcome Back</h2>

        {/* EMAIL */}
        <div style={styles.field}>
          <label style={styles.label}>Email</label>
          <input
            style={styles.input}
            type="email"
            placeholder="Enter your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>

        {/* PASSWORD */}
        <div style={styles.field}>
          <label style={styles.label}>Password</label>
          <input
            style={styles.input}
            type="password"
            placeholder="Enter your password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>

        {error && <p style={styles.error}>{error}</p>}
        {message && <p style={styles.success}>{message}</p>}

        <button type="submit" style={styles.button} disabled={loading}>
          {loading ? "Logging in..." : "Login"}
        </button>

        <p style={styles.forgot} onClick={handleResetPassword}>
          Forgot password?
        </p>

      </form>
    </div>
  );
}

/* ================= STYLES ================= */
const styles: any = {
  page: {
    height: "100vh",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    fontFamily: "Arial, Inter, sans-serif",
    backgroundColor: "#F7F7F7",
    padding: "20px"
  },

  logo: {
    width: "160px",
    marginBottom: "5px"
  },

  title: {
    color: "#1A3E6F",
    fontSize: "26px",
    fontWeight: 700
  },

  subtitle: {
    color: "#1A3E6F",
    fontSize: "14px",
    marginBottom: "20px",
    opacity: 0.85
  },

  card: {
    width: "100%",
    maxWidth: "420px",
    backgroundColor: "#1A3E6F",
    borderRadius: "14px",
    padding: "30px",
    boxShadow: "0 12px 30px rgba(0,0,0,0.25)"
  },

  welcome: {
    color: "#fff",
    marginBottom: "20px"
  },

  field: {
    display: "flex",
    flexDirection: "column",
    marginBottom: "15px"
  },

  label: {
    color: "#fff",
    fontSize: "15px",
    marginBottom: "6px"
  },

  input: {
    padding: "12px",
    borderRadius: "8px",
    border: "none",
    fontSize: "16px",
    outline: "none"
  },

  button: {
    width: "100%",
    padding: "12px",
    backgroundColor: "#C8972B",
    border: "none",
    borderRadius: "8px",
    color: "#fff",
    fontSize: "17px",
    fontWeight: "bold",
    cursor: "pointer"
  },

  forgot: {
    color: "#C8972B",
    fontSize: "15px",
    marginTop: "10px",
    cursor: "pointer",
    textAlign: "center"
  },

  error: {
    color: "#B71C1C",
    fontSize: "15px",
    marginBottom: "10px"
  },

  success: {
    color: "#0F6E56",
    fontSize: "15px",
    marginBottom: "10px"
  }
};
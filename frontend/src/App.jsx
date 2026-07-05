import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import "./App.css";
import Home from "./Pages/Home";
import Dashboard from "./Pages/Dashboard";
import RemoveBackground from "./Pages/RemoveBackground";
import History from "./Pages/History";
import Profile from "./Pages/Profile";
import NotFound from "./Pages/NotFound";
import { useAuth } from "./AuthContext";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const PageWrapper = ({ children }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -20 }}
    transition={{ duration: 0.1, ease: "easeInOut" }}
    className="min-h-screen"
  >
    {children}
  </motion.div>
);

const PrivateRoute = ({ user, loading, children }) => {
  if (loading)
    return (
      <div className="min-h-screen font-bricereg bg-cover bg-center flex justify-center gap-3 pt-70 h-screen text-xl text-[#2F5FA8]">
        Loading
        <div className="w-7 h-7 border-4 border-gray-300 border-t-[#2F5FA8] rounded-full animate-spin"></div>
      </div>
    );
  if (!user) return <Navigate to="/" replace />;
  return children;
};

function App() {
  const { user, loading } = useAuth();
  const location = useLocation();

  return (
    <>
      <ToastContainer
        position="top-center"
        autoClose={1500}
        closeOnClick
        theme="light"
      />
      <AnimatePresence mode="wait">
        <Routes location={location} key={location.pathname}>
          <Route
            path="/"
            element={
              <PageWrapper>
                <Home />
              </PageWrapper>
            }
          />
          <Route
            path="/dashboard"
            element={
              <PrivateRoute user={user} loading={loading}>
                <PageWrapper>
                  <Dashboard />
                </PageWrapper>
              </PrivateRoute>
            }
          />
          <Route
            path="/remove-background"
            element={
              <PrivateRoute user={user} loading={loading}>
                <PageWrapper>
                  <RemoveBackground />
                </PageWrapper>
              </PrivateRoute>
            }
          />
          <Route
            path="/history"
            element={
              <PrivateRoute user={user} loading={loading}>
                <PageWrapper>
                  <History />
                </PageWrapper>
              </PrivateRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <PrivateRoute user={user} loading={loading}>
                <PageWrapper>
                  <Profile />
                </PageWrapper>
              </PrivateRoute>
            }
          />
          <Route
            path="*"
            element={
              <PageWrapper>
                <NotFound />
              </PageWrapper>
            }
          />
        </Routes>
      </AnimatePresence>
    </>
  );
}

export default App;
import React from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { signOut } from "firebase/auth";
import { auth } from "../../firebase";
import { useAuth } from "../../AuthContext";
import { toast } from "react-toastify";
import ProfileMenu from "./ProfileMenu";
import Logo from "./Logo";

const links = [
  { to: "/dashboard", label: "Dashboard", icon: "fa-solid fa-gauge" },
  { to: "/remove-background", label: "Remove Background", icon: "fa-solid fa-wand-magic-sparkles" },
  { to: "/history", label: "History", icon: "fa-solid fa-clock-rotate-left" },
];

const DashboardNav = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    const confirmLogout = window.confirm("Are you sure you want to log out?");
    if (!confirmLogout) return;
    try {
      await signOut(auth);
      toast.info("Logged out");
      navigate("/");
    } catch (error) {
      console.error("Logout error:", error);
      toast.error("Couldn't log out. Try again.");
    }
  };

  return (
    <nav className="sticky top-0 z-50 bg-gradient-to-b from-[#EEF2FB] to-white/80 backdrop-blur-md">
      <div className="container mx-auto px-6 h-20 flex items-center justify-between">
        <button onClick={() => navigate("/")} className="cursor-pointer">
          <Logo />
        </button>

        <div className="hidden md:flex items-center gap-8">
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) =>
                `flex items-center gap-2 text-sm font-semibold font-manrope transition pb-1 border-b-2 ${
                  isActive
                    ? "text-[#2F5FA8] border-[#2F5FA8]"
                    : "text-slate-500 border-transparent hover:text-[#2F5FA8]"
                }`
              }
            >
              <i className={`${link.icon} text-xs`}></i>
              {link.label}
            </NavLink>
          ))}
        </div>

        <div className="flex items-center gap-4">
          <ProfileMenu user={user} handleLogout={handleLogout} />
        </div>
      </div>

      <div className="md:hidden flex items-center justify-around border-t border-gray-100 py-2">
        {links.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            className={({ isActive }) =>
              `flex flex-col items-center gap-1 text-[10px] font-medium px-2 ${
                isActive ? "text-[#2F5FA8]" : "text-slate-400"
              }`
            }
          >
            <i className={`${link.icon} text-base`}></i>
            {link.label}
          </NavLink>
        ))}
      </div>
    </nav>
  );
};

export default DashboardNav;

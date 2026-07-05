import React, { useState, useRef, useEffect } from "react";
import { Link } from "react-router-dom";

const ProfileMenu = ({ user, handleLogout }) => {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex cursor-pointer items-center justify-center w-10 h-10 rounded-full border-2 border-white/10 overflow-hidden focus:outline-none transition-transform hover:scale-105"
      >
        {user?.photoURL ? (
          <img
            src={user.photoURL}
            alt="profile"
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-[#2F5FA8] flex items-center justify-center text-white text-lg font-bold">
            {user?.displayName?.charAt(0) || user?.email?.charAt(0) || "U"}
          </div>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-xl py-2 z-50 border border-gray-100 animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="px-4 py-2 border-b border-gray-50">
            <p className="text-sm font-semibold text-gray-800 truncate">
              {user?.displayName}
            </p>
            <p className="text-xs text-gray-500 truncate">{user?.email}</p>
          </div>

          <div className="py-1">
            <Link
              to="/dashboard"
              onClick={() => setIsOpen(false)}
              className="w-full text-left px-4 py-2 text-sm text-[#2F5FA8] hover:bg-[#F3F4F6] transition-colors flex items-center gap-2"
            >
              <i className="fa-solid fa-gauge w-4"></i>
              Dashboard
            </Link>
            <Link
              to="/history"
              onClick={() => setIsOpen(false)}
              className="w-full text-left px-4 py-2 text-sm text-[#2F5FA8] hover:bg-[#F3F4F6] transition-colors flex items-center gap-2"
            >
              <i className="fa-solid fa-clock-rotate-left w-4"></i>
              History
            </Link>
            <Link
              to="/profile"
              onClick={() => setIsOpen(false)}
              className="w-full text-left px-4 py-2 text-sm text-[#2F5FA8] hover:bg-[#F3F4F6] transition-colors flex items-center gap-2"
            >
              <i className="fa-solid fa-user w-4"></i>
              Profile
            </Link>
          </div>

          <div className="border-t border-gray-50 pt-1">
            <button
              onClick={() => {
                setIsOpen(false);
                handleLogout();
              }}
              className="w-full text-left px-4 py-2 text-sm text-red-900 hover:bg-red-50 transition-colors flex items-center gap-2"
            >
              <i className="fa-solid fa-right-from-bracket w-4"></i>
              Logout
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfileMenu;

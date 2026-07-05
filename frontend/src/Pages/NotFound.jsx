import React from "react";
import { Navigate, useNavigate } from "react-router-dom";

const NotFound = () => {
  const navigate = useNavigate();
  return (
    <div className="bg-[#C6D4EB] h-screen text-[#2F5FA8] text-6xl font-brice flex-col flex items-center justify-center">
      <span className="-mt-20">404</span>
      <span className="text-xl font-brice">Oops! Nothing here</span>
      <button
        onClick={() => navigate("/")}
        className="bg-[#2F5FA8] rounded-md w-90 h-12 mt-5 text-white font-bricereg font-medium text-sm hover:shadow-xl cursor-pointer ease-in-out"
      >
        Go to Home
      </button>
    </div>
  );
};

export default NotFound;

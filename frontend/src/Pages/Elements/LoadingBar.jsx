const LoadingBar = () => {
  return (
    <div className="w-120">
      <style>
        {`
          @keyframes smooth-slide {
            /* Start far left (hidden) */
            0% { left: -40%; }
            
            /* Go far right (fully hidden) 
               left: 100% puts the start of the bar at the end of the container 
            */
            100% { left: 100%; } 
          }
          
          .animate-smooth {
            /* 3s = Slow and smooth */
            animation: smooth-slide 3s infinite linear;
          }
        `}
      </style>

      <div className="h-1.5 w-full bg-gray-200 overflow-hidden rounded-full relative">
        <div className="absolute top-0 h-full w-1/3 bg-[#2F5FA8] rounded-full animate-smooth shadow-[0_0_10px_#2F5FA8]"></div>
      </div>
    </div>
  );
};

export default LoadingBar;

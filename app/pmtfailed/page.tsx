"use client";

export default function BookingFailed() {
  return (
    <div className="relative flex flex-col justify-center items-center min-h-screen bg-red-500 text-white">
      {/* Centered Content */}
      <div className="flex flex-col items-center space-y-4">
        <div className="flex items-center justify-center w-16 h-16 rounded-full bg-white">
          <span className="text-red-500 text-4xl font-bold">X</span>
        </div>
        <p className="text-center text-lg font-semibold">
          Your booking being unsuccessful due to payment issues.
        </p>
      </div>
      <div className="absolute bottom-4">
        <button
          className="bg-white text-red-500 font-semibold px-4 py-2 rounded"
          onClick={() => {
            window.location.href = "/";
          }}
        >
          Book Again
        </button>
      </div>
    </div>
  );
}

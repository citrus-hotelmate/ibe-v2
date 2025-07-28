// app/error/page.tsx or pages/error.tsx
"use client";

import React from "react";

export default function BookingErrorPage() {
  return (
    <main
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "100vh",
        backgroundColor: "#ffffff",
        padding: "16px",
      }}
    >
      <div
        style={{
          maxWidth: "400px",
          width: "100%",
          border: "1px solid #e0e0e0",
          borderRadius: "8px",
          boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
          padding: "24px",
          textAlign: "center",
          fontFamily: "sans-serif",
        }}
      >
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: "#f44336",
            borderRadius: "50%",
            width: "48px",
            height: "48px",
            marginBottom: "16px",
          }}
        >
          <span
            style={{
              color: "#ffffff",
              fontSize: "24px",
              fontWeight: "bold",
              lineHeight: "1",
            }}
          >
            ✕
          </span>
        </div>
        <h1
          style={{
            fontSize: "20px",
            fontWeight: "700",
            marginBottom: "12px",
            color: "#212121",
          }}
        >
          We sincerely apologize, but something went wrong with your booking
        </h1>
        <p
          style={{
            fontSize: "14px",
            color: "#555555",
            marginBottom: "24px",
          }}
        >
          We invite you to try again, or to contact the hotel help center to
          help you
        </p>
        <button
          style={{
            backgroundColor: "#ffb700",
            color: "#000000",
            fontSize: "16px",
            fontWeight: "600",
            padding: "12px 24px",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer",
            width: "100%",
          }}
          onClick={() => {
            window.location.href = "/";
          }}
        >
          Back to search
        </button>
      </div>
    </main>
  );
}

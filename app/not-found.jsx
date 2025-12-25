'use client'
import { useRouter } from "next/navigation";
import React from "react";

export default function page() {
  const router = useRouter();

  return (
    <div className="container">
      <div className="content">
        <h1>404</h1>
        <p>Oops! Page not found.</p>
        <button onClick={() => router.push("/")} className="btn">
          Go Back Homee
        </button>
      </div>

      <style jsx>{`
        .container {
          display: flex;
          justify-content: center;
          align-items: center;
          height: 100vh;
          background: linear-gradient(135deg, #0f2027, #203a43, #2c5364);
          color: #fff;
          text-align: center;
          padding: 20px;
        }
        .content h1 {
          font-size: 10rem;
          margin: 0;
          animation: float 2s ease-in-out infinite;
        }
        .content p {
          font-size: 1.5rem;
          margin: 10px 0 20px 0;
        }
        .btn {
          background-color: #22c55e;
          border: none;
          padding: 12px 25px;
          font-size: 1rem;
          font-weight: bold;
          border-radius: 25px;
          cursor: pointer;
          transition: all 0.3s ease;
        }
        .btn:hover {
          transform: scale(1.1);
          background-color: #16a34a;
        }

        @keyframes float {
          0% { transform: translateY(0); }
          50% { transform: translateY(-20px); }
          100% { transform: translateY(0); }
        }

        @media (max-width: 768px) {
          .content h1 {
            font-size: 6rem;
          }
          .content p {
            font-size: 1.2rem;
          }
        }
      `}</style>
    </div>
  );
}

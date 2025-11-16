import React, { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, MessageSquare, Video, Presentation, Network } from 'lucide-react';
import Logo from '@/components/ui/Logo';

const Landing = () => {
  const navigate = useNavigate();
  const globeRef = useRef<HTMLDivElement>(null);

  const handleGetStarted = () => {
    navigate('/auth');
  };

  // Rotate globe animation
  useEffect(() => {
    if (!globeRef.current) return;
    
    let rotation = 0;
    const animate = () => {
      rotation += 0.5;
      if (globeRef.current) {
        globeRef.current.style.transform = `rotateY(${rotation}deg)`;
      }
      requestAnimationFrame(animate);
    };
    animate();
  }, []);

  return (
    <div className="antialiased bg-slate-50 text-slate-900 min-h-screen" style={{ fontFamily: 'Inter, ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial' }}>
      {/* Navigation */}
      <header className="px-4 sm:px-6 lg:px-8 py-4">
        <div className="mx-auto max-w-7xl">
          <div className="flex items-center justify-between gap-4">
            <a href="#" className="inline-flex items-center gap-2">
              <span className="relative inline-flex h-8 w-8 items-center justify-center bg-gradient-to-r from-slate-900 to-slate-700 rounded-xl shadow-[0_2.8px_2.2px_rgba(0,_0,_0,_0.034),_0_6.7px_5.3px_rgba(0,_0,_0,_0.048),_0_12.5px_10px_rgba(0,_0,_0,_0.06),_0_22.3px_17.9px_rgba(0,_0,_0,_0.072),_0_41.8px_33.4px_rgba(0,_0,_0,_0.086),_0_100px_80px_rgba(0,_0,_0,_0.12)]">
                <Logo size="sm" />
              </span>
              <span className="text-lg font-semibold tracking-tight">SourceLens</span>
            </a>
            <div className="flex items-center">
              <button
                onClick={handleGetStarted}
                className="hidden md:inline-flex items-center gap-2 ring-1 ring-black/5 hover:bg-black text-sm font-medium text-white bg-slate-900 rounded-full pt-2 pr-4 pb-2 pl-4 shadow-[0_2.8px_2.2px_rgba(0,_0,_0,_0.034),_0_6.7px_5.3px_rgba(0,_0,_0,_0.048),_0_12.5px_10px_rgba(0,_0,_0,_0.06),_0_22.3px_17.9px_rgba(0,_0,_0,_0.072),_0_41.8px_33.4px_rgba(0,_0,_0,_0.086),_0_100px_80px_rgba(0,_0,_0,_0.12)]"
              >
                Get Started
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="px-4 sm:px-6 lg:px-8 pb-16">
        {/* Hero Section */}
        <section className="max-w-7xl sm:p-10 shadow-[0_10px_40px_rgba(15,23,42,0.08)] bg-white rounded-3xl mr-auto ml-auto pt-6 pr-6 pb-6 pl-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center">
            {/* Left Column */}
            <div className="order-2 lg:order-1">
              <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs text-slate-600 shadow-sm">
                <span className="h-2 w-2 rounded-full bg-violet-500"></span>
                Start something new
              </div>

              <h1 className="mt-4 text-4xl sm:text-5xl font-semibold tracking-tight text-slate-900">
                Chat with Documents, Generate Audio & Video, Create Presentations & Interactive Mindmaps
              </h1>

              <p className="mt-4 text-base leading-7 text-slate-600">
                Transform your documents into interactive conversations. Generate audio narrations and video summaries from your content. Create stunning presentations automatically. Visualize knowledge with interactive mindmaps. All powered by AI that understands your documents.
              </p>

              <div className="mt-6 flex flex-col sm:flex-row gap-3">
                <button
                  type="button"
                  onClick={handleGetStarted}
                  className="button shadow-[rgba(50,_50,_93,_0.25)_0px_13px_27px_-5px,_rgba(0,_0,_0,_0.3)_0px_8px_16px_-8px]"
                >
                  <div className="points_wrapper">
                    <i className="point"></i>
                    <i className="point"></i>
                    <i className="point"></i>
                    <i className="point"></i>
                    <i className="point"></i>
                    <i className="point"></i>
                    <i className="point"></i>
                    <i className="point"></i>
                    <i className="point"></i>
                    <i className="point"></i>
                  </div>
                  <span className="inner">
                    Get Started
                    <svg className="icon" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5">
                      <path d="M5 12h14"></path>
                      <path d="m12 5 7 7-7 7"></path>
                    </svg>
                  </span>
                </button>
              </div>
            </div>

            {/* Right Column - Globe */}
            <div className="order-1 lg:order-2">
              <div className="relative">
                <div className="absolute -inset-4 rounded-[28px] bg-gradient-to-br from-violet-500/10 via-fuchsia-500/10 to-amber-500/10 blur-2xl"></div>
                <div className="relative rounded-[24px] bg-slate-100/60 p-8 min-h-[500px] flex items-center justify-center overflow-hidden">
                  <div 
                    ref={globeRef}
                    className="relative"
                    style={{
                      width: '400px',
                      height: '400px',
                      transformStyle: 'preserve-3d',
                    }}
                  >
                    <svg
                      viewBox="0 0 500 500"
                      className="absolute inset-0 opacity-70"
                      style={{
                        filter: 'drop-shadow(0 0 40px rgba(59, 130, 246, 0.6))',
                      }}
                    >
                      <defs>
                        <radialGradient id="globeGradient">
                          <stop offset="0%" stopColor="rgba(59, 130, 246, 0.5)" />
                          <stop offset="100%" stopColor="rgba(30, 58, 138, 0.2)" />
                        </radialGradient>
                        <radialGradient id="africaGradient">
                          <stop offset="0%" stopColor="rgba(59, 130, 246, 1)" />
                          <stop offset="100%" stopColor="rgba(37, 99, 235, 0.8)" />
                        </radialGradient>
                      </defs>
                      
                      <circle
                        cx="250"
                        cy="250"
                        r="220"
                        fill="url(#globeGradient)"
                        stroke="rgba(59, 130, 246, 0.7)"
                        strokeWidth="3"
                      />
                      
                      {[-90, -60, -30, 0, 30, 60, 90].map((lon, i) => {
                        const x = 250 + (220 * Math.sin((lon * Math.PI) / 180));
                        return (
                          <ellipse
                            key={`lon-${i}`}
                            cx={x}
                            cy="250"
                            rx={Math.abs(220 * Math.cos((lon * Math.PI) / 180))}
                            ry="220"
                            fill="none"
                            stroke="rgba(59, 130, 246, 0.3)"
                            strokeWidth="1.5"
                          />
                        );
                      })}
                      
                      {[-60, -30, 0, 30, 60].map((lat, i) => {
                        const y = 250 + (220 * Math.sin((lat * Math.PI) / 180));
                        const radius = 220 * Math.cos((lat * Math.PI) / 180);
                        return (
                          <ellipse
                            key={`lat-${i}`}
                            cx="250"
                            cy={y}
                            rx={radius}
                            ry={radius * 0.4}
                            fill="none"
                            stroke="rgba(59, 130, 246, 0.3)"
                            strokeWidth="1.5"
                          />
                        );
                      })}
                      
                      <g transform="translate(250, 250)">
                        <path
                          d="M -80 -20 Q -60 -40 -40 -30 Q -20 -25 0 -20 Q 20 -15 40 -10 Q 50 0 45 20 Q 40 40 30 50 Q 20 55 10 50 Q 0 45 -10 40 Q -20 35 -30 30 Q -40 25 -50 20 Q -60 15 -70 10 Q -75 0 -80 -20 Z"
                          fill="url(#africaGradient)"
                          stroke="rgba(147, 197, 253, 1)"
                          strokeWidth="3"
                        />
                        <path
                          d="M 40 -10 Q 50 0 55 15 Q 50 25 40 20 Q 35 10 40 -10 Z"
                          fill="rgba(96, 165, 250, 0.9)"
                          stroke="rgba(147, 197, 253, 1)"
                          strokeWidth="2.5"
                        />
                        <path
                          d="M 10 40 Q 15 50 10 60 Q 5 55 0 50 Q 5 45 10 40 Z"
                          fill="rgba(96, 165, 250, 0.8)"
                        />
                        <path
                          d="M -70 10 Q -80 5 -85 0 Q -80 -5 -70 0 Q -65 5 -70 10 Z"
                          fill="rgba(96, 165, 250, 0.8)"
                        />
                      </g>
                    </svg>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="max-w-7xl sm:p-10 shadow-[0_10px_40px_rgba(15,23,42,0.08)] bg-white rounded-3xl mt-12 mr-auto ml-auto pt-6 pr-6 pb-6 pl-6">
          <div className="flex flex-col gap-4">
            <div className="inline-flex gap-2 text-xs text-slate-600 bg-slate-50 border-slate-200 border rounded-full pt-1.5 pr-3 pb-1.5 pl-3 shadow-sm items-center w-fit">
              <span className="h-2 w-2 rounded-full bg-indigo-500"></span>
              Features
            </div>
            <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
              <h2 className="text-3xl sm:text-4xl font-semibold tracking-tight text-slate-900">
                Build faster with everything you need
              </h2>
              <p className="text-sm text-slate-600 sm:max-w-md">
                Transform your documents into interactive conversations, generate media, and visualize knowledge with AI-powered tools.
              </p>
            </div>
          </div>
          <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Chat with Documents */}
            <div className="rounded-2xl border border-slate-200 p-5 bg-white hover:bg-slate-50 transition">
              <div className="flex items-center justify-between">
                <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600 text-white">
                  <MessageSquare className="h-5 w-5" />
                </div>
              </div>
              <h3 className="mt-4 text-lg font-semibold tracking-tight text-slate-900">Chat with Documents</h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">Upload your documents and get instant, context-aware answers with verifiable citations.</p>
            </div>

            {/* Generate Audio & Video */}
            <div className="rounded-2xl border border-slate-200 p-5 bg-white hover:bg-slate-50 transition">
              <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-violet-600 text-white">
                <Video className="h-5 w-5" />
              </div>
              <h3 className="mt-4 text-lg font-semibold tracking-tight text-slate-900">Generate Audio & Video</h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">Create audio narrations and video summaries from your content with professional quality.</p>
            </div>

            {/* Create Presentations */}
            <div className="rounded-2xl border border-slate-200 p-5 bg-white hover:bg-slate-50 transition">
              <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500 text-white">
                <Presentation className="h-5 w-5" />
              </div>
              <h3 className="mt-4 text-lg font-semibold tracking-tight text-slate-900">Create Presentations</h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">Generate stunning presentations from your documents with AI-powered design and content organization.</p>
            </div>

            {/* Interactive Mindmaps */}
            <div className="rounded-2xl border border-slate-200 p-5 bg-white hover:bg-slate-50 transition">
              <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-600 text-white">
                <Network className="h-5 w-5" />
              </div>
              <h3 className="mt-4 text-lg font-semibold tracking-tight text-slate-900">Interactive Mindmaps</h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">Transform your documents into interactive mindmaps that visualize relationships and concepts.</p>
            </div>
          </div>
        </section>

        {/* Final CTA Section */}
        <section className="relative max-w-7xl mx-auto mt-8 sm:mt-12 overflow-hidden rounded-3xl">
          <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-blue-900 to-purple-900"></div>
          <div className="absolute inset-0 bg-slate-900/70"></div>
          <div className="relative p-6 sm:p-10">
            <h2 className="mt-4 text-3xl sm:text-4xl font-semibold tracking-tight text-white">Create with SourceLens today</h2>
            <p className="mt-3 text-sm sm:text-base text-white/80">Transform your documents into interactive conversations, generate media, and visualize knowledge with AI-powered tools.</p>
            <div className="mt-6 flex flex-col sm:flex-row gap-3">
              <button
                onClick={handleGetStarted}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-white text-slate-900 px-5 py-3 text-sm font-medium hover:bg-slate-100"
              >
                Get Started
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="px-4 sm:px-6 lg:px-8 pb-10">
        <div className="mx-auto max-w-7xl">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-slate-500">
            <p>© {new Date().getFullYear()} SourceLens. All rights reserved.</p>
            <div className="flex items-center gap-4">
              <a href="#" className="hover:text-slate-700">Privacy</a>
              <a href="#" className="hover:text-slate-700">Terms</a>
            </div>
          </div>
        </div>
      </footer>

      {/* Button Animation Styles */}
      <style>{`
        .button {
          cursor: pointer;
          position: relative;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;
          transition: all 0.25s ease;
          background: radial-gradient(65.28% 65.28% at 50% 100%,
              rgba(34, 211, 238, 0.8) 0%,
              rgba(34, 211, 238, 0) 100%),
            linear-gradient(0deg, #2563eb, #2563eb);
          border-radius: 0.75rem;
          border: none;
          outline: none;
          padding: 12px 18px;
          min-height: 48px;
          min-width: 102px;
        }

        .button::before,
        .button::after {
          content: "";
          position: absolute;
          transition: all 0.5s ease-in-out;
          z-index: 0;
        }

        .button::before {
          inset: 1px;
          background: linear-gradient(177.95deg,
              rgba(255, 255, 255, 0.19) 0%,
              rgba(255, 255, 255, 0) 100%);
          border-radius: calc(0.75rem - 1px);
        }

        .button::after {
          inset: 2px;
          background: radial-gradient(65.28% 65.28% at 50% 100%,
              rgba(34, 211, 238, 0.8) 0%,
              rgba(34, 211, 238, 0) 100%),
            linear-gradient(0deg, #2563eb, #2563eb);
          border-radius: calc(0.75rem - 2px);
        }

        .button:active {
          transform: scale(0.95);
        }

        .points_wrapper {
          overflow: hidden;
          width: 100%;
          height: 100%;
          pointer-events: none;
          position: absolute;
          z-index: 1;
        }

        .points_wrapper .point {
          bottom: -10px;
          position: absolute;
          animation: floating-points infinite ease-in-out;
          pointer-events: none;
          width: 2px;
          height: 2px;
          background-color: #fff;
          border-radius: 9999px;
        }

        @keyframes floating-points {
          0% {
            transform: translateY(0);
          }
          85% {
            opacity: 0;
          }
          100% {
            transform: translateY(-55px);
            opacity: 0;
          }
        }

        .points_wrapper .point:nth-child(1) {
          left: 10%;
          opacity: 1;
          animation-duration: 2.35s;
          animation-delay: 0.2s;
        }

        .points_wrapper .point:nth-child(2) {
          left: 30%;
          opacity: 0.7;
          animation-duration: 2.5s;
          animation-delay: 0.5s;
        }

        .points_wrapper .point:nth-child(3) {
          left: 25%;
          opacity: 0.8;
          animation-duration: 2.2s;
          animation-delay: 0.1s;
        }

        .points_wrapper .point:nth-child(4) {
          left: 44%;
          opacity: 0.6;
          animation-duration: 2.05s;
        }

        .points_wrapper .point:nth-child(5) {
          left: 50%;
          opacity: 1;
          animation-duration: 1.9s;
        }

        .points_wrapper .point:nth-child(6) {
          left: 75%;
          opacity: 0.5;
          animation-duration: 1.5s;
          animation-delay: 1.5s;
        }

        .points_wrapper .point:nth-child(7) {
          left: 88%;
          opacity: 0.9;
          animation-duration: 2.2s;
          animation-delay: 0.2s;
        }

        .points_wrapper .point:nth-child(8) {
          left: 58%;
          opacity: 0.8;
          animation-duration: 2.25s;
          animation-delay: 0.2s;
        }

        .points_wrapper .point:nth-child(9) {
          left: 98%;
          opacity: 0.6;
          animation-duration: 2.6s;
          animation-delay: 0.1s;
        }

        .points_wrapper .point:nth-child(10) {
          left: 65%;
          opacity: 1;
          animation-duration: 2.5s;
          animation-delay: 0.2s;
        }

        .inner {
          z-index: 2;
          gap: 6px;
          position: relative;
          width: 100%;
          color: white;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          font-size: 16px;
          font-weight: 500;
          line-height: 1.5;
          transition: color 0.2s ease-in-out;
        }

        .inner svg.icon {
          width: 18px;
          height: 18px;
          transition: transform 0.3s ease;
          stroke: white;
          fill: none;
        }

        .button:hover svg.icon {
          transform: translateX(2px);
        }

        .button:hover svg.icon path {
          animation: dash 0.8s linear forwards;
        }

        @keyframes dash {
          0% {
            stroke-dasharray: 0, 20;
            stroke-dashoffset: 0;
          }
          50% {
            stroke-dasharray: 10, 10;
            stroke-dashoffset: -5;
          }
          100% {
            stroke-dasharray: 20, 0;
            stroke-dashoffset: -10;
          }
        }
      `}</style>
    </div>
  );
};

export default Landing;

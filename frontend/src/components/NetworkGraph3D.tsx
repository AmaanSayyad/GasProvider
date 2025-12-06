import React, { useRef, useEffect, useState } from "react";
import { useGasFountain } from "../context/GasFountainContext";
import { useIntentStatus } from "../hooks/useIntentStatus";

interface NetworkGraph3DProps {
  isDispersing: boolean;
  isCompleted?: boolean;
  intentId?: string;
}

/**
 * 3D Network Graph Visualization Component
 * 
 * This component creates a stunning 3D visualization showing:
 * - Source chain as a central glowing node
 * - Destination chains arranged in 3D space around it
 * - Animated gas flow particles traveling along connections
 * - Interactive rotation and zoom controls
 * - Real-time status updates with color-coded connections
 * 
 * Visual Design:
 * - Chains appear as 3D spheres with chain logos
 * - Connections are glowing tubes/beams in 3D space
 * - Particles flow along connections showing gas movement
 * - Colors indicate status: Blue (pending), Green (confirmed), Red (failed)
 * - Smooth animations and transitions
 * - Depth perception with shadows and lighting effects
 */
const NetworkGraph3D: React.FC<NetworkGraph3DProps> = ({
  isDispersing,
  isCompleted = false,
  intentId,
}) => {
  const { sourceChain, selectedChains } = useGasFountain();
  const containerRef = useRef<HTMLDivElement>(null);
  const [rotation, setRotation] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [zoom, setZoom] = useState(1);

  const { data: intentData } = useIntentStatus({
    intentId: intentId && isDispersing ? intentId : undefined,
    enabled: !!intentId && isDispersing,
    pollInterval: 3000,
  });

  // Calculate 3D positions for chains in a sphere around the source
  const getChainPosition = (index: number, total: number) => {
    // Arrange chains in a 3D sphere around the source
    const radius = 200;
    const theta = (2 * Math.PI * index) / total; // Horizontal angle
    const phi = Math.acos(-1 + (2 * index) / total); // Vertical angle
    
    return {
      x: radius * Math.sin(phi) * Math.cos(theta),
      y: radius * Math.sin(phi) * Math.sin(theta),
      z: radius * Math.cos(phi),
    };
  };

  // Handle mouse drag for rotation
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging && containerRef.current) {
        setRotation((prev) => ({
          x: prev.x + e.movementY * 0.5,
          y: prev.y + e.movementX * 0.5,
        }));
      }
    };

    const handleMouseUp = () => setIsDragging(false);

    if (isDragging) {
      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);
    }

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDragging]);

  // Handle zoom with mouse wheel
  useEffect(() => {
    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      setZoom((prev) => Math.max(0.5, Math.min(2, prev - e.deltaY * 0.001)));
    };

    const container = containerRef.current;
    if (container) {
      container.addEventListener("wheel", handleWheel);
      return () => container.removeEventListener("wheel", handleWheel);
    }
  }, []);

  return (
    <div className="w-full h-full relative overflow-hidden bg-gradient-to-br from-black via-gray-900 to-black">
      {/* Instructions */}
      <div className="absolute top-4 left-4 z-10 text-white/60 text-xs">
        <p>🖱️ Drag to rotate • 🔍 Scroll to zoom</p>
      </div>

      {/* 3D Container */}
      <div
        ref={containerRef}
        className="w-full h-full perspective-1000"
        onMouseDown={() => setIsDragging(true)}
        style={{
          cursor: isDragging ? "grabbing" : "grab",
        }}
      >
        <div
          className="relative w-full h-full preserve-3d"
          style={{
            transform: `
              translateZ(${zoom * 100}px)
              rotateX(${rotation.x}deg)
              rotateY(${rotation.y}deg)
            `,
            transformStyle: "preserve-3d",
            transition: isDragging ? "none" : "transform 0.1s ease-out",
          }}
        >
          {/* Source Chain - Central Node */}
          {sourceChain && (
            <div
              className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-30"
              style={{
                transform: `
                  translate(-50%, -50%)
                  translateZ(0px)
                `,
                transformStyle: "preserve-3d",
              }}
            >
              <div className="relative">
                {/* Glowing orb effect */}
                <div className="absolute inset-0 rounded-full bg-primary/30 blur-2xl animate-pulse" />
                <div className="relative w-24 h-24 rounded-full bg-gradient-to-br from-primary to-blue-600 border-4 border-white/20 flex items-center justify-center shadow-[0_0_50px_rgba(41,151,255,0.6)] backdrop-blur-md">
                  {sourceChain.logo && (
                    <img
                      src={sourceChain.logo}
                      alt={sourceChain.name}
                      className="w-16 h-16 rounded-full object-cover"
                    />
                  )}
                </div>
                {/* Label */}
                <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 whitespace-nowrap">
                  <div className="bg-black/80 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-bold text-white border border-white/20">
                    {sourceChain.name}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Destination Chains - Arranged in 3D Space - Only show if we have real intent data */}
          {intentData?.intent?.chainStatuses?.map((chainStatus, index) => {
            // Find the chain data for this status
            const chain = selectedChains.find(
              (c) => c.viemChain?.id === chainStatus.chainId
            );
            
            // Only render if we have the chain data
            if (!chain) return null;
            
            const position = getChainPosition(index, intentData.intent.chainStatuses.length);
            const status = chainStatus.status;
            
            // Color based on status
            const statusColor =
              status === "CONFIRMED"
                ? "rgba(34, 197, 94, 0.8)" // Green
                : status === "FAILED"
                ? "rgba(239, 68, 68, 0.8)" // Red
                : "rgba(41, 151, 255, 0.8)"; // Blue

            // Calculate distance for line
            const distance = Math.sqrt(position.x ** 2 + position.y ** 2 + position.z ** 2);
            
            return (
              <React.Fragment key={chainStatus.chainId}>
                {/* Connection Line in 3D - Using a div with proper 3D transforms */}
                <div
                  className="absolute top-1/2 left-1/2 origin-center pointer-events-none"
                  style={{
                    transform: `
                      translate(-50%, -50%)
                      translateX(${position.x / 2}px)
                      translateY(${position.y / 2}px)
                      translateZ(${position.z / 2}px)
                      rotateY(${Math.atan2(position.y, position.x) * (180 / Math.PI)}deg)
                      rotateX(${-Math.asin(position.z / distance) * (180 / Math.PI)}deg)
                    `,
                    transformStyle: "preserve-3d",
                    zIndex: 1,
                  }}
                >
                  {/* 3D Connection Line */}
                  <div
                    className="relative"
                    style={{
                      width: "3px",
                      height: `${distance}px`,
                      background: `linear-gradient(to bottom, ${statusColor}, ${statusColor}00)`,
                      boxShadow: `0 0 15px ${statusColor}`,
                      borderRadius: "2px",
                    }}
                  >
                    {/* Animated Particle */}
                    {isDispersing && !isCompleted && status !== "CONFIRMED" && (
                      <div
                        className="absolute w-3 h-3 rounded-full bg-white"
                        style={{
                          boxShadow: `0 0 10px rgba(255, 255, 255, 0.8)`,
                          animation: `flowParticle 2s linear infinite`,
                          top: "0%",
                          left: "50%",
                          transform: "translateX(-50%)",
                        }}
                      />
                    )}
                  </div>
                </div>

                {/* Destination Chain Node */}
                <div
                  className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2"
                  style={{
                    transform: `
                      translate(-50%, -50%)
                      translateX(${position.x}px)
                      translateY(${position.y}px)
                      translateZ(${position.z}px)
                    `,
                    transformStyle: "preserve-3d",
                  }}
                >
                  <div className="relative group">
                    {/* Glow effect */}
                    <div
                      className="absolute inset-0 rounded-full blur-xl"
                      style={{
                        backgroundColor: statusColor,
                        opacity: 0.4,
                        animation: status === "CONFIRMED" ? "pulse 2s infinite" : "none",
                      }}
                    />
                    {/* Chain node */}
                    <div
                      className="relative w-16 h-16 rounded-full bg-gradient-to-br from-white/10 to-white/5 border-2 flex items-center justify-center backdrop-blur-md transition-all duration-300 group-hover:scale-110"
                      style={{
                        borderColor: statusColor,
                        boxShadow: `0 0 30px ${statusColor}`,
                      }}
                    >
                      {chain.logo && (
                        <img
                          src={chain.logo}
                          alt={chain.name}
                          className="w-12 h-12 rounded-full object-cover"
                        />
                      )}
                      {/* Status indicator */}
                      {status === "CONFIRMED" && (
                        <div className="absolute -top-1 -right-1 w-5 h-5 bg-green-500 rounded-full border-2 border-black flex items-center justify-center">
                          <span className="text-white text-xs">✓</span>
                        </div>
                      )}
                    </div>
                    {/* Label with amount */}
                    <div className="absolute -bottom-10 left-1/2 transform -translate-x-1/2 whitespace-nowrap">
                      <div className="bg-black/80 backdrop-blur-sm px-2 py-1 rounded text-xs font-semibold text-white border border-white/20">
                        <div>{chain.name}</div>
                        <div className="text-primary font-bold">
                          ${chainStatus.amountUsd}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </React.Fragment>
            );
          }).filter(Boolean)}

          {/* Only show if we have real transaction data */}
          {!intentData?.intent && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center text-white/60">
                <p className="text-lg font-semibold mb-2">No Active Transaction</p>
                <p className="text-sm">Complete a deposit to see the 3D visualization</p>
              </div>
            </div>
          )}

          {/* Grid Background for Depth */}
          <div
            className="absolute inset-0 opacity-20"
            style={{
              backgroundImage: `
                linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
                linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)
              `,
              backgroundSize: "50px 50px",
              transform: "translateZ(-300px) rotateX(90deg)",
              transformStyle: "preserve-3d",
            }}
          />
        </div>
      </div>

      {/* CSS Animations */}
      <style>{`
        @keyframes flowParticle {
          0% {
            transform: translateX(-50%) translateY(0);
            opacity: 1;
          }
          100% {
            transform: translateX(-50%) translateY(100%);
            opacity: 0;
          }
        }
        
        @keyframes pulse {
          0%, 100% {
            opacity: 0.4;
          }
          50% {
            opacity: 0.8;
          }
        }
        
        .perspective-1000 {
          perspective: 1000px;
        }
        
        .preserve-3d {
          transform-style: preserve-3d;
        }
      `}</style>
    </div>
  );
};

export default NetworkGraph3D;


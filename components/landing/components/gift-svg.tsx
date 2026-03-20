"use client";

import React from "react";

export const Gift = ({
  className,
  style,
}: {
  className?: string;
  style?: React.CSSProperties;
}) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 200 300"
      preserveAspectRatio="xMidYMid meet"
      className={className}
      style={style}
    >
      <g id="gift-group1" style={{ zIndex: 2 }}>
        <rect
          id="box"
          x="45"
          y="67"
          width="100"
          height="80"
          fill="#1380B1"
          stroke="#1380B1"
          strokeWidth="3"
          rx="1"
        />
        <g id="tapa1">
          <rect
            id="lid"
            x="40"
            y="68"
            width="110"
            height="20"
            fill="#1380B1"
            stroke="#1380B1"
            strokeWidth="3"
            rx="1"
          />
        </g>
      </g>
      <g id="gift-group" style={{ zIndex: 3 }}>
        <rect
          id="box"
          x="50"
          y="62"
          width="100"
          height="80"
          fill="#FFAA29"
          stroke="#FFAA29"
          strokeWidth="3"
          rx="1"
        />
        <rect
          id="ribbon-vertical-box"
          x="95"
          y="60.5"
          width="10"
          height="83"
          fill="#E25380"
        />
        <g id="tapa">
          <rect
            id="lid"
            x="45"
            y="62"
            width="110"
            height="20"
            fill="#F4A100"
            stroke="#F4A100"
            strokeWidth="3"
            rx="1"
          />
          <rect
            id="ribbon-vertical-lid"
            x="95"
            y="63.5"
            width="10"
            height="20"
            fill="#F62A6A"
          />
          <path
            id="bow-left"
            d="M100,60.5 C80,40 50,40 75,60.5"
            fill="#F62A6A"
          />
          <path
            id="bow-right"
            d="M100,60.5 C115,40 150,40 125,60.5"
            fill="#F62A6A"
          />
          <circle cx="100" cy="60" r="8" fill="#F62A6A" />
        </g>
      </g>
    </svg>
  );
};

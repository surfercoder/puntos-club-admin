"use client";

import type { FC, MouseEventHandler, ReactElement } from "react";

const StyledButton: FC<{
  children: ReactElement;
  onClick?: MouseEventHandler<HTMLButtonElement>;
  ariaLabel: string;
}> = ({ children, onClick, ariaLabel }) => {
  return (
    <button
      onClick={onClick ? onClick : () => {}}
      className="p-2 rounded-full transition duration-300 bg-white text-black dark:bg-black dark:text-white border-2 dark:border-white border-black hover:scale-110 focus:outline-none"
      aria-label={ariaLabel}
    >
      {children}
    </button>
  );
};

export default StyledButton;

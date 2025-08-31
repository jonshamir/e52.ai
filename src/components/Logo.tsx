import React from "react";

interface LogoProps {
  className?: string;
  width?: number | string;
  height?: number | string;
  fill?: string;
}

const Logo: React.FC<LogoProps> = ({
  className = "logo",
  width = 92.64,
  height = 72.09,
  fill = "var(--color-accent)",
}) => {
  return (
    <svg
      className={className}
      width={width}
      height={height}
      viewBox="0 0 92.64 72.09"
      xmlns="http://www.w3.org/2000/svg"
    >
      <g id="c" data-name="Layer 1">
        <path
          d="M90.33,0H2C.9,0,0,.9,0,2v66.25c0,1.1.9,2,2,2h88.33c1.1,0,2-.9,2-2V2c0-1.1-.9-2-2-2ZM4,4h40.16v17.75H4V4ZM24.08,65.92c-11.07,0-20.08-9.01-20.08-20.08v-20.08h20.08c11.07,0,20.08,9.01,20.08,20.08s-9.01,20.08-20.08,20.08ZM88.33,66.25h-40.16v-18.08h40.16v18.08ZM68.25,44.16h-20.08v-20.08c0-11.07,9.01-20.08,20.08-20.08s20.08,9.01,20.08,20.08-9.01,20.08-20.08,20.08Z"
          style={{ fill }}
        />
      </g>
    </svg>
  );
};

export default Logo;

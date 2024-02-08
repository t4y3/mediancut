'use client';

import { ReactNode, useState } from 'react';

type Photo = {
  id: string;
  author: string;
  width: number;
  height: number;
  url: string;
  download_url: string;
};

export const CompareImage = ({ children }: { children: ReactNode }) => {
  const [pos, setPos] = useState(50);
  return (
    // @ts-ignore
    <div className="compare relative h-full w-full" style={{ '--pos': `${pos}%` }}>
      {children}
      <input
        type="range"
        id="range"
        onChange={(e) => {
          setPos(Number(e.target.value));
        }}
      />
    </div>
  );
};

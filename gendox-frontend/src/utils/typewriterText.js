import React, { useEffect, useState } from 'react';
import { Typography } from '@mui/material';

const TypewriterText = ({ text, speed = 50, ...props }) => {
  const [displayedText, setDisplayedText] = useState('');

  useEffect(() => {
    setDisplayedText('');
    let index = 0;
    const interval = setInterval(() => {
      setDisplayedText((prev) => prev + text[index]);
      index++;
      if (index >= text.length) {
        clearInterval(interval);
      }
    }, speed);
    return () => clearInterval(interval);
  }, [text, speed]);

  return (
    <Typography {...props}>
      {displayedText}
    </Typography>
  );
};

export default TypewriterText;

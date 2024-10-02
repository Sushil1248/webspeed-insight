import React, { useState } from 'react';
import HeroBanner from './components/HeroBanner';

const App = () => {
  return (
    <div className="min-h-screen overflow-auto h-64 rounded scrollbar-thin scrollbar-thumb-rounded-full scrollbar-thumb-black-100 scrollbar-track-black-300 ">
      <HeroBanner />
    </div>
  );
};

export default App;

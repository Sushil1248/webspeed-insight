module.exports = {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',  // Make sure all relevant files are included
  ],
  theme: {
    extend: {},
  },
  plugins: [
    require('tailwind-scrollbar'),
  ],
};
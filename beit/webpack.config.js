const path = require('path');

module.exports = {
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),  // Resolves '@' to the 'src' folder
    },
    extensions: ['.js', '.jsx', '.ts', '.tsx', '.json'], // Include the file extensions you use
  },
};
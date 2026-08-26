// Simple notification service wrapper for now
export const notify = {
  success: (message: string) => {
    console.log(`[SUCCESS]: ${message}`);
    // You can replace this with a real toast library like react-hot-toast later
    alert(message);
  },
  error: (message: string) => {
    console.error(`[ERROR]: ${message}`);
    alert(message);
  }
};

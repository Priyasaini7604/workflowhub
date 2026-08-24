import axios from "axios";

// Reads from frontend/.env — VITE_API_BASE_URL=http://localhost:8000/api
// Falls back to localhost if the env var isn't set, so local dev still
// works even without a .env file present.
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api";

const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("access_token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// --- Refresh-token queueing so parallel 401s don't call refresh multiple times ---
let isRefreshing = false;
let pendingQueue = [];

const processQueue = (error, newToken = null) => {
  pendingQueue.forEach(({ resolve, reject }) => {
    if (error) {
      reject(error);
    } else {
      resolve(newToken);
    }
  });
  pendingQueue = [];
};

axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Only attempt a refresh on a 401, and only once per request
    // (the _retry flag prevents an infinite loop if refresh itself
    // returns 401 or the retried request fails again).
    if (error.response?.status === 401 && !originalRequest._retry) {
      // If the failing request IS the refresh call itself, don't
      // try to refresh again — just log out.
      if (originalRequest.url?.includes("/token/refresh/")) {
        localStorage.removeItem("access_token");
        localStorage.removeItem("refresh_token");
        window.location.href = "/login";
        return Promise.reject(error);
      }

      if (isRefreshing) {
        // A refresh is already in flight — queue this request and
        // retry it once the refresh resolves.
        return new Promise((resolve, reject) => {
          pendingQueue.push({ resolve, reject });
        })
          .then((newToken) => {
            originalRequest.headers.Authorization = `Bearer ${newToken}`;
            return axiosInstance(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      const refreshToken = localStorage.getItem("refresh_token");
      if (!refreshToken) {
        localStorage.removeItem("access_token");
        window.location.href = "/login";
        return Promise.reject(error);
      }

      try {
        // Previously hardcoded to "http://localhost:8000/api/users/token/refresh/"
        // (inconsistent with the baseURL above, which pointed at a different
        // host) — now uses the same env-driven base for both.
        const { data } = await axios.post(
          `${API_BASE_URL}/users/token/refresh/`,
          { refresh: refreshToken }
        );
        const newAccessToken = data.access;
        localStorage.setItem("access_token", newAccessToken);

        processQueue(null, newAccessToken);
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        return axiosInstance(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        localStorage.removeItem("access_token");
        localStorage.removeItem("refresh_token");
        window.location.href = "/login";
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export default axiosInstance;

const API_URL = import.meta.env.VITE_API_URL;

export const apiRequest = async (endpoint, options = {}) => {

  const response = await fetch(
    `${API_URL}${endpoint}`,
    {
      ...options,

      // Important for HTTP-only authentication cookies
      credentials: "include",

      headers: {
        "Content-Type": "application/json",
        ...options.headers
      }
    }
  );

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {

    throw new Error(
      data.message || "Something went wrong"
    );

  }

  return data;

};

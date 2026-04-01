import axios from "axios";

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

export const api = axios.create({
	baseURL: API_BASE_URL,
	timeout: 15000,
});

api.interceptors.request.use((config) => {
	const token = localStorage.getItem("token");
	if (token) {
		config.headers.Authorization = `Bearer ${token}`;
	}
	return config;
});

export const complaintsApi = {
	listPublic: () => api.get("/api/complaints/public"),
	listMine: () => api.get("/api/complaints/my"),
	create: (payload) => api.post("/api/complaints", payload),
	upload: (files) => {
		const formData = new FormData();
		files.forEach((file) => formData.append("photos", file));
		return api.post("/api/complaints/upload", formData, {
			headers: { "Content-Type": "multipart/form-data" },
		});
	},
};

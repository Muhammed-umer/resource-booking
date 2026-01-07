import axios from "axios";
import { API_BASE_URL } from "../Config";

// Separate endpoints for user/admin
export const loginUser = (data) =>
    axios.post(`${API_BASE_URL}/auth/login/user`, data);

export const loginAdminSeminar = (data) =>
    axios.post(`${API_BASE_URL}/auth/login/admin-seminar`, data);

export const loginAdminResource = (data) =>
    axios.post(`${API_BASE_URL}/auth/login/admin-resource`, data);

export const signup = (data) =>
    axios.post(`${API_BASE_URL}/auth/signup`, data);
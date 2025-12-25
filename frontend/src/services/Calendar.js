import axios from "axios";
import { API_BASE_URL } from "../config"; // Ensure you import this if defined, or hardcode base url

// Fallback if config not imported
const BASE = API_BASE_URL || "http://localhost:8082";

export const fetchCalendarData = async (startDate, endDate) => {
  try {
    const response = await axios.get(`${BASE}/api/calendar`, {
      params: { startDate, endDate }
    });
    return response.data;
  } catch (error) {
    console.error("Error fetching calendar data:", error);
    return [];
  }
};
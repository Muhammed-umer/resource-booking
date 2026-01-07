import axios from "axios";

const BASE_URL = "http://localhost:8082/api";


export const fetchCalendarData = (startDate, endDate) =>
    axios.get('${BASE_URL}/Calendar', { params: { startDate,endDate}});
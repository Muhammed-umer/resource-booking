export const saveAuth = (token, role, department, email) => {
    localStorage.setItem("token", token);
    localStorage.setItem("role", role);
    localStorage.setItem("department", department);
    localStorage.setItem("email", email); // save email for requestedBy
};

export const getToken = () => localStorage.getItem("token");
export const getRole = () => localStorage.getItem("role");
export const getDepartment = () => localStorage.getItem("department");
export const getEmail = () => localStorage.getItem("email");

export const logout = () => {
    localStorage.clear();
    window.location.href = "/";
};
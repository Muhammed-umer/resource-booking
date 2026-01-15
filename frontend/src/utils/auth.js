export const saveAuth = (token, role, department, email) => {
    sessionStorage.setItem("token", token);
    sessionStorage.setItem("role", role);
    // Handle null/undefined department or email gracefully
    if (department) sessionStorage.setItem("department", department);
    if (email) sessionStorage.setItem("email", email); 
};

export const getToken = () => sessionStorage.getItem("token");
export const getRole = () => sessionStorage.getItem("role");
export const getDepartment = () => sessionStorage.getItem("department");
export const getEmail = () => sessionStorage.getItem("email");

export const logout = () => {
    sessionStorage.clear();
    window.location.href = "/";
};
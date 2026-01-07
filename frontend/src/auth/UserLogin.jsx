import React, { useState } from "react";
import { loginUser } from "../api/authApi";
import { saveAuth } from "../utils/auth";

const UserLogin = () => {
    const [data, setData] = useState({ email: "", password: "" });

    const submit = async () => {
        try {
            const res = await loginUser(data);
            saveAuth(res.data.token, res.data.role);
            window.location.href = "/user";
        } catch (err) {
            console.error(err);
            alert(err.response?.data || "Login failed");
        }
    };

    return (
        <>
            <h2 className="text-2xl font-bold text-center mb-6">User Login</h2>

            <input
                className="w-full mb-4 px-4 py-2 border rounded-full focus:outline-none"
                placeholder="Email"
                onChange={(e)=>setData({...data,email:e.target.value})}
            />

            <input
                type="password"
                className="w-full mb-6 px-4 py-2 border rounded-full focus:outline-none"
                placeholder="Password"
                onChange={(e)=>setData({...data,password:e.target.value})}
            />

            <button
                onClick={submit}
                className="w-full bg-[#676765] text-white py-2 rounded-full hover:bg-gray-700 transition"
            >
                Login
            </button>
        </>
    );
};
export default UserLogin;
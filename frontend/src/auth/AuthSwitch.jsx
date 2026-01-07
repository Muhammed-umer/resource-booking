import React, { useState } from "react";
import UserLogin from "./UserLogin";
import AdminLogin from "./AdminLogin";

const AuthSwitch = () => {
    const [mode, setMode] = useState("USER");

    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100">

            <div className="w-full flex justify-center mb-8">
                <h1 className="text-3xl font-bold text-gray-700 animate-bounce-slow"
                    style={{ fontFamily: 'Lato, sans-serif' }}>
                    Government College of Engineering, Erode - Resource Booking Portal
                </h1>
            </div>

            {/* White inner box with bounce */}
            <div className="bg-white p-8 rounded-2xl shadow-lg w-[380px] animate-float">
                {/* Switch buttons */}
                <div className="flex mb-6 rounded-full overflow-hidden border border-[#676765]">
                    <button
                        className={`w-1/2 py-2 font-semibold transition ${
                            mode === "USER"
                                ? "bg-[#676765] text-white"
                                : "text-[#676765] bg-transparent"
                        }`}
                        onClick={() => setMode("USER")}
                    >
                        USER
                    </button>
                    <button
                        className={`w-1/2 py-2 font-semibold transition ${
                            mode === "ADMIN"
                                ? "bg-[#676765] text-white"
                                : "text-[#676765] bg-transparent"
                        }`}
                        onClick={() => setMode("ADMIN")}
                    >
                        ADMIN
                    </button>
                </div>

                {mode === "USER" ? <UserLogin /> : <AdminLogin />}
            </div>
        </div>
    );
};


export default AuthSwitch;
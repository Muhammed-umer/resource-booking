import React, { useState } from "react";
import ResourceCard from "../components/home/ResourceCard";
import BookingButton from "../components/home/BookingButton";
import CalendarView from "../components/home/CalendarView";
import BookingModal from "../components/home/BookingModal";

const Home = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedResource, setSelectedResource] = useState("");

  const handleCardClick = (resourceName) => {
    setSelectedResource(resourceName);
    setIsModalOpen(true);
  };

  const handleButtonClick = () => {
    setSelectedResource("");
    setIsModalOpen(true);
  };

  return (
    <div className="w-full max-w-7xl mx-auto pb-12 px-4">
      {/* 1. Header */}
      <div className="mb-10 mt-4">
        <h2 className="text-3xl font-bold text-gray-800">Dashboard</h2>
        <p className="text-gray-500 mt-2">
          Select a facility to view details or book a slot.
        </p>
      </div>

      {/* 2. Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8 mb-20">
        <ResourceCard
          title="Auditorium"
          subtitle="Large events & gatherings"
          capacity="500"
          colorTheme="teal"
          onClick={() => handleCardClick("Auditorium")}
          icon={
            <svg
              className="w-7 h-7 md:w-8 md:h-8"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
              />
            </svg>
          }
        />

        <ResourceCard
          title="Seminar Hall"
          subtitle="Presentations & Workshops"
          capacity="100"
          colorTheme="orange"
          onClick={() => handleCardClick("Seminar Hall")}
          icon={
            <svg
              className="w-7 h-7 md:w-8 md:h-8"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
              />
            </svg>
          }
        />

        <ResourceCard
          title="Guest House"
          subtitle="VIP Stays & Accommodation"
          capacity="3 Rooms"
          colorTheme="purple"
          onClick={() => handleCardClick("Guest House")}
          icon={
            <svg
              className="w-7 h-7 md:w-8 md:h-8"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
              />
            </svg>
          }
        />
      </div>

      {/* 3. Floating Button */}
      <BookingButton onClick={handleButtonClick} />

      {/* 4. Calendar */}
      <CalendarView />

      {/* 5. Modal */}
      <BookingModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        selectedResource={selectedResource}
      />
    </div>
  );
};

export default Home;

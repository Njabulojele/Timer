"use client";
import { useCallback, useState } from "react";
import { format } from "date-fns";
import { create } from "zustand";

interface TimerState {
  workTime: number;
  breakTime: number;
  remainingTime: number;
  isRunning: boolean;
  isWorkSession: boolean;
  intervalId: NodeJS.Timeout | null;
  notificationSound: HTMLAudioElement | null;
  setWorkTime: (time: number) => void;
  setBreakTime: (time: number) => void;
  setRemainingTime: (time: number) => void;
  setIsRunning: (running: boolean) => void;
  setIsWorkSession: (isWork: boolean) => void;
  setIntervalId: (id: NodeJS.Timeout | null) => void;
  setNotificationSound: (audio: HTMLAudioElement) => void;
  startTimer: () => void;
  pauseTimer: () => void;
  resetTimer: () => void;
  skipSession: () => void;
}

const useTimerStore = create<TimerState>((set, get) => ({
  workTime: 50 * 60, // Default to 50 minutes
  breakTime: 10 * 60, // Default to 10 minutes
  remainingTime: 50 * 60,
  isRunning: false,
  isWorkSession: true,
  intervalId: null,
  notificationSound: null,

  setWorkTime: (time) => set({ workTime: time }),
  setBreakTime: (time) => set({ breakTime: time }),
  setRemainingTime: (time) => set({ remainingTime: time }),
  setIsRunning: (running) => set({ isRunning: running }),
  setIsWorkSession: (isWork) => set({ isWorkSession: isWork }),
  setIntervalId: (id) => set({ intervalId: id }),
  setNotificationSound: (audio) => set({ notificationSound: audio }),

  startTimer: () => {
    const {
      isRunning,
      intervalId,
      remainingTime,
      notificationSound,
      isWorkSession,
    } = get();
    if (isRunning) return;

    if (remainingTime === 0) {
      // If timer ended, reset to current session's full time before starting
      set({ remainingTime: isWorkSession ? get().workTime : get().breakTime });
    }

    set({ isRunning: true });
    const id = setInterval(() => {
      set((state) => {
        if (state.remainingTime <= 0) {
          clearInterval(state.intervalId!);
          notificationSound
            ?.play()
            .catch((e) => console.error("Error playing sound:", e));
          const nextIsWorkSession = !state.isWorkSession;
          const nextRemainingTime = nextIsWorkSession
            ? state.workTime
            : state.breakTime;
          return {
            isRunning: false,
            isWorkSession: nextIsWorkSession,
            remainingTime: nextRemainingTime,
            intervalId: null,
          };
        }
        return { remainingTime: state.remainingTime - 1 };
      });
    }, 1000);
    set({ intervalId: id });
  },

  pauseTimer: () => {
    const { intervalId } = get();
    if (intervalId) {
      clearInterval(intervalId);
    }
    set({ isRunning: false, intervalId: null });
  },

  resetTimer: () => {
    get().pauseTimer();
    set({
      remainingTime: get().isWorkSession ? get().workTime : get().breakTime,
      isRunning: false,
      intervalId: null,
    });
  },

  skipSession: () => {
    get().pauseTimer();
    const nextIsWorkSession = !get().isWorkSession;
    const nextRemainingTime = nextIsWorkSession
      ? get().workTime
      : get().breakTime;
    set({
      isWorkSession: nextIsWorkSession,
      remainingTime: nextRemainingTime,
      isRunning: false,
      intervalId: null,
    });
  },
}));

export default function Home() {
  const {
    workTime,
    breakTime,
    remainingTime,
    isRunning,
    isWorkSession,
    setWorkTime,
    setBreakTime,
    setRemainingTime,
    setIsWorkSession,
    setNotificationSound,
    startTimer,
    pauseTimer,
    resetTimer,
    skipSession,
  } = useTimerStore();

  const [inputWorkMinutes, setInputWorkMinutes] = useState(workTime / 60);
  const [inputBreakMinutes, setInputBreakMinutes] = useState(breakTime / 60);

  const handleSetWorkTime = useCallback(() => {
    const newWorkTime = Math.max(1, Math.min(inputWorkMinutes, 120)) * 60; // Cap at 120 min
    setWorkTime(newWorkTime);
    if (isWorkSession && !isRunning) {
      setRemainingTime(newWorkTime);
    }
  }, [
    inputWorkMinutes,
    setWorkTime,
    setRemainingTime,
    isWorkSession,
    isRunning,
  ]);

  const handleSetBreakTime = useCallback(() => {
    const newBreakTime = Math.max(1, Math.min(inputBreakMinutes, 60)) * 60; // Cap at 60 min
    setBreakTime(newBreakTime);
    if (!isWorkSession && !isRunning) {
      setRemainingTime(newBreakTime);
    }
  }, [
    inputBreakMinutes,
    setBreakTime,
    setRemainingTime,
    isWorkSession,
    isRunning,
  ]);

  return (
    <div className="bg-white flex items-center justify-center min-h-screen text-gray-800 font-sans font-semibold p-4">
      <div className="rounded-md p-6 sm:p-8 flex flex-col justify-between min-h-[500px] w-full max-w-md sm:max-w-lg md:max-w-xl lg:max-w-2xl bg-white shadow-xl border border-gray-100">
        <div className="text-center mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold mb-2">Timer</h1>
          <h2 className="text-lg sm:text-xl font-semibold text-center">
            {isWorkSession ? "WORK SESSION" : "BREAK SESSION"}
          </h2>
        </div>

        <div className="flex justify-center mb-8">
          <div className="text-center text-4xl sm:text-5xl md:text-6xl font-extrabold text-gray-800">
            {format(new Date(remainingTime * 1000), "mm:ss")}
          </div>
        </div>

        <div className="flex flex-col gap-4 justify-center items-center">
          <div className="flex gap-3 justify-center">
            <button
              className="rounded-md py-3 px-6 text-center text-white bg-blue-500 hover:bg-blue-600 transition-colors"
              onClick={isRunning ? pauseTimer : startTimer}
            >
              {isRunning ? "Pause" : "Start"}
            </button>
            <button
              className="rounded-md py-3 px-6 text-center bg-red-800 hover:bg-red-900 text-white transition-colors"
              onClick={resetTimer}
            >
              Reset
            </button>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 sm:gap-8 justify-center items-center w-full mt-6">
            <div className="flex flex-col space-y-2 w-full sm:w-auto">
              <p className="text-sm text-center font-medium">Work Time (min)</p>
              <div className="flex gap-2">
                <input
                  id="work-input"
                  type="number"
                  value={inputWorkMinutes}
                  onChange={(e) =>
                    setInputWorkMinutes(parseInt(e.target.value) || 0)
                  }
                  onBlur={handleSetWorkTime}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      handleSetWorkTime();
                    }
                  }}
                  min="1"
                  max="120"
                  className="flex-1 bg-blue-500 text-white p-2 px-3 rounded-md text-center min-w-0"
                />
                <button
                  onClick={handleSetWorkTime}
                  className="bg-green-500 hover:bg-green-600 text-white py-2 px-4 rounded-md transition-colors"
                >
                  Set
                </button>
              </div>
            </div>

            <div className="flex flex-col space-y-2 w-full sm:w-auto">
              <p className="text-sm text-center font-medium">
                Break Time (min)
              </p>
              <div className="flex gap-2">
                <input
                  id="break-input"
                  type="number"
                  value={inputBreakMinutes}
                  onChange={(e) =>
                    setInputBreakMinutes(parseInt(e.target.value) || 0)
                  }
                  onBlur={handleSetBreakTime}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      handleSetBreakTime();
                    }
                  }}
                  min="1"
                  max="60"
                  className="flex-1 bg-blue-500 text-white p-2 px-3 rounded-md text-center min-w-0"
                />
                <button
                  onClick={handleSetBreakTime}
                  className="bg-green-500 hover:bg-green-600 text-white py-2 px-4 rounded-md transition-colors"
                >
                  Set
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

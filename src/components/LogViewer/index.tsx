import React, { useState, useEffect, useRef } from "react";

const LogViewer: React.FC = () => {
    const [logs, setLogs] = useState<string[]>([]);
    const [autoScroll, setAutoScroll] = useState(true);
    const logEndRef = useRef<HTMLDivElement | null>(null);
    const socketRef = useRef<WebSocket | null>(null);

    // Використання WebSocket для підключення до бекенду
    useEffect(() => {

        const protocol = window.location.protocol === "https:" ? "wss" : "ws";
        const wsUrl = `${protocol}://localhost:4000/view-log-ws`;

        socketRef.current = new WebSocket(wsUrl);

        socketRef.current.onmessage = (event) => {
            setLogs((prevLogs) => [...prevLogs, event.data]);
        };

        socketRef.current.onopen = () => {
            console.log("WebSocket підключено");
            socketRef.current?.send("Hello Server!");
        };

        socketRef.current.onclose = () => {
            console.log("WebSocket закрито");
        };

        socketRef.current.onerror = (error) => {
            console.error("WebSocket помилка:", error);
        };

        return () => {
            socketRef.current?.close();
        };
    }, []);

    useEffect(() => {
        if (autoScroll && logEndRef.current) {
            logEndRef.current.scrollIntoView({ behavior: "smooth" });
        }
    }, [logs, autoScroll]);

    return (
        <div>
            <div style={{ height: "500px", overflow: "auto", backgroundColor: "#f4f4f4" }}>
                {logs.map((log, index) => (
                    <div key={index}>{log}</div>
                ))}
                <div ref={logEndRef}></div>
            </div>
            <button onClick={() => setAutoScroll(!autoScroll)}>
                {autoScroll ? "Off autoscroll" : "On autoscroll"}
            </button>
        </div>
    );
};

export default LogViewer;
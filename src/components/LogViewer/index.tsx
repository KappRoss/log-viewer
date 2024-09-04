import React, { useState, useEffect, useRef } from "react";
import { FixedSizeList as List } from 'react-window';
import { throttle } from "../../helpers/functions";

const MAX_LOGS = 1000;

const LogViewer: React.FC = () => {
    const [logs, setLogs] = useState<string[]>([]);
    const [autoScroll, setAutoScroll] = useState(true);
    const logEndRef = useRef<HTMLDivElement | null>(null);
    const socketRef = useRef<WebSocket | null>(null);
    const listRef = useRef<any>(null);

    useEffect(() => {
        const protocol = window.location.protocol === "https:" ? "wss" : "ws";
        const wsUrl = `${protocol}://localhost:4000/view-log-ws`;

        socketRef.current = new WebSocket(wsUrl);

        // Throttling to exchange interface refresh rates
        const handleLog = throttle((message: string) => {
            setLogs((prevLogs) => {
                const newLogs = [...prevLogs, message];
                if (newLogs.length > MAX_LOGS) {
                    return newLogs.slice(-MAX_LOGS);
                }
                return newLogs;
            });
        }, 500);  // logs updates timer

        socketRef.current.onmessage = (event) => {
            handleLog(event.data);
        };

        socketRef.current.onopen = () => {
            console.log("WebSocket connected");
            socketRef.current?.send("Hello Server!");
        };

        socketRef.current.onclose = () => {
            console.log("WebSocket closed");
        };

        socketRef.current.onerror = (error) => {
            console.error("WebSocket error:", error);
        };

        return () => {
            socketRef.current?.close();
        };
    }, []);

    useEffect(() => {
        if (autoScroll && listRef.current) {
            listRef.current.scrollToItem(logs.length - 1, "auto");
        }
    }, [logs, autoScroll]);

    return (
        <div>
            <div style={{ height: "500px", overflow: "auto", backgroundColor: "#f4f4f4" }}>
                <List
                    height={500}
                    itemCount={logs.length}
                    itemSize={35}
                    width={800}
                    ref={listRef}
                >
                    {({ index, style }) => (
                        <div style={style} key={index}>
                            {logs[index]}
                        </div>
                    )}
                </List>
            </div>
            <button onClick={() => setAutoScroll(!autoScroll)}>
                {autoScroll ? "Off autoscroll" : "On autoscroll"}
            </button>
        </div>
    );
};

export default LogViewer;
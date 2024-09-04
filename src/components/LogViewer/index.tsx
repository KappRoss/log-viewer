import React, {useState, useEffect, useRef, useCallback, CSSProperties} from "react";
import { FixedSizeList as List } from 'react-window';
import { throttle } from "../../helpers/functions";

const MAX_LOGS = 1000;
const SCROLL_THRESHOLD = 100;
const LOG_ITEM_HEIGHT = 35;
const VIEWER_HEIGHT = 500;
const VIEWER_WIDTH = 800;

const BACKEND_HOST = process.env.REACT_APP_BACKEND_HOST || 'localhost:4000';

const LogViewer: React.FC = () => {
    const [logs, setLogs] = useState<string[]>([]);
    const [autoScroll, setAutoScroll] = useState(true);
    const socketRef = useRef<WebSocket | null>(null);
    const listRef = useRef<any>(null);

    const handleLog = useCallback(
        throttle((message: string) => {
            setLogs((prevLogs) => {
                const newLogs = [...prevLogs, message];
                if (newLogs.length > MAX_LOGS) {
                    return newLogs.slice(-MAX_LOGS);
                }
                return newLogs;
            });
        }, SCROLL_THRESHOLD), []
    );

    useEffect(() => {
        const protocol = window.location.protocol === "https:" ? "wss" : "ws";
        const wsUrl = `${protocol}://${BACKEND_HOST}/view-log-ws`;

        socketRef.current = new WebSocket(wsUrl);

        socketRef.current.onmessage = (event) => {
            handleLog(event.data);
            // or without throttling
            // setLogs((prevLogs) => [...prevLogs, event.data]);
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
    }, [handleLog]);

    useEffect(() => {
        if (autoScroll && listRef.current) {
            listRef.current.scrollToItem(logs.length - 1, "auto");
        }
    }, [logs, autoScroll]);

    return (
        <div style={containerStyle}>
            <div style={viewerStyle}>
                <List
                    height={VIEWER_HEIGHT}
                    itemCount={logs.length}
                    itemSize={LOG_ITEM_HEIGHT}
                    width={VIEWER_WIDTH}
                    ref={listRef}
                    style={listStyle}
                >
                    {({index, style}) => (
                        <div
                            style={{
                                ...style,
                                ...logStyle
                            }}
                            key={`${logs[index]}-${index}`}
                        >
                            {logs[index]}
                        </div>
                    )}
                </List>
            </div>
            <div style={buttonContainerStyle}>
                <button onClick={() => setAutoScroll(!autoScroll)} style={buttonStyle}>
                    {`${autoScroll ? 'Off' : 'On'} autoscroll`}
                </button>
            </div>
        </div>
    );
};

const containerStyle: CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100vh',
};

const viewerStyle: CSSProperties = {
    height: VIEWER_HEIGHT,
    overflow: "auto",
    backgroundColor: "#f4f4f4",
    display: 'flex',
    justifyContent: 'center',
    marginBottom: '20px',
};

const listStyle: CSSProperties = {
    position: "relative",
    overflowX: "auto",
};

const logStyle: CSSProperties = {
    whiteSpace: "nowrap",
    overflowX: "auto",
    textOverflow: "ellipsis",
};

const buttonContainerStyle: CSSProperties = {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
};

const buttonStyle: CSSProperties = {
    padding: '10px 20px',
    fontSize: '16px',
};

export default LogViewer;
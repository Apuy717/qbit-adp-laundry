// src/context/MqttContext.tsx
import React, { createContext, useContext, useEffect, useState } from "react";
import mqtt, { MqttClient } from "mqtt";


interface DeviceStatus {
    [deviceId: string]: {
        lwt?: string;    // Online / Offline
        power?: string;  // ON / OFF
    };
}

interface MqttContextType {
    client: MqttClient | null;
    status: DeviceStatus;
}

const MqttContext = createContext<MqttContextType>({
    client: null,
    status: {},
});

export const useMqtt = () => useContext(MqttContext);

export const MqttProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [client, setClient] = useState<MqttClient | null>(null);
    const [status, setStatus] = useState<DeviceStatus>(() => {
        // Ambil status terakhir dari localStorage
        if (typeof window !== "undefined") {
            const cached = localStorage.getItem("deviceStatus");
            return cached ? JSON.parse(cached) : {};
        }
        return {};
    });
    const url_broker = `${process.env.NEXT_PUBLIC_MQTT_BROKER_URL}`;

    useEffect(() => {
        // Simpan status setiap kali ada update
        localStorage.setItem("deviceStatus", JSON.stringify(status));
    }, [status]);

    useEffect(() => {
        const mqttClient = mqtt.connect(url_broker, {
            username: "admin",
            password: "@Quantum2022",
            clientId: `WEB-${Math.random().toString(16).slice(2, 10)}`,
        });

        mqttClient.on("connect", () => {
            console.log("✅ Connected ke broker MQTT");
            mqttClient.subscribe("tele/+/LWT");
            mqttClient.subscribe("stat/+/POWER");
        });

        mqttClient.on("message", (topic, message) => {
            const [prefix, deviceId, type] = topic.split("/");
            const value = message.toString();

            setStatus((prev) => ({
                ...prev,
                [deviceId]: {
                    ...prev[deviceId],
                    ...(type === "LWT" ? { lwt: value } : { power: value }),
                },
            }));
        });

        setClient(mqttClient);

        return () => {
            mqttClient.end();
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return (
        <MqttContext.Provider value={{ client, status }}>
            {children}
        </MqttContext.Provider>
    );
};


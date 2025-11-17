type TApi<T = unknown> = (
    endpoint: string,
    metodo: string,
    data?: T
) => Promise<Response>

const api: TApi = (endpoint: string, metodo: string, data) => {
    const token = localStorage.getItem("accessToken");

    return fetch(`http://localhost:5235/${endpoint}`, {
        method: metodo,
        headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: data ? JSON.stringify(data) : undefined
    });
};

export default api;

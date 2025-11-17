type TApi<T = unknown> = (
    endpoint: string,
    metodo: string,
    data?: T
) => Promise<Response>

const api: TApi = (endpoint:string, metodo:string, data) => {
    return fetch(`http://localhost:5235/${endpoint}`, {
        method: metodo,
        headers: { 'Content-Type': 'application/json',"Access-Control-Allow-Credentials": "true" },
        credentials:"include",
        body: JSON.stringify(data)
    }
    )
}

export default api
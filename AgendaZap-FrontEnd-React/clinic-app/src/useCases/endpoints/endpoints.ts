export const endpoints = {
    usuario: {
        create: (idEmpresa: string) => `${idEmpresa}/usuario`,
        getAll: (idEmpresa: string) => `${idEmpresa}/usuario`,
        delete: (idEmpresa: string, id: number) => `${idEmpresa}/usuario/${id}`,
        getById: (idEmpresa: string, id: number) => `${idEmpresa}/usuario/${id}`
    },
    clientes: {
        getAll: (idEmpresa: string) => `${idEmpresa}/cliente`,
        delete: (idEmpresa: string, id: number) => `${idEmpresa}/cliente/${id}`,
        getById: (idEmpresa: string, id: number) => `${idEmpresa}/cliente/${id}`,
        create: (idEmpresa: string) => `${idEmpresa}/cliente`,
        update: (idEmpresa: string, id: number) => `${idEmpresa}/cliente/${id}`
    },
    servico: {
        getAll: (idEmpresa: string) => `${idEmpresa}/servico`,
        delete: (idEmpresa: string, id: number) => `${idEmpresa}/servico/${id}`,
        create: (idEmpresa: string) => `${idEmpresa}/servico`,
        update: (idEmpresa: string, id: number) => `${idEmpresa}/servico/${id}`,
        getById: (idEmpresa: string, id: number) => `${idEmpresa}/servico/${id}`
    },
    agendamento: {
        getAll: (idEmpresa: string) => `${idEmpresa}/agendamento`,
        create: (idEmpresa: string) => `${idEmpresa}/agendamento`,
        update: (idEmpresa: string, id: number) => `${idEmpresa}/agendamento/${id}`
    },
    empresa: {
        getById: (idEmpresa:string) => `empresa/${idEmpresa}`
    }
}
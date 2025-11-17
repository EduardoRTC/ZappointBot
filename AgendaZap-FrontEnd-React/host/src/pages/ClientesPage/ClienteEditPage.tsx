import { useEffect, useState } from "react";
import ClienteForm from "../../components/Forms/ClienteForm/ClienteForm";
import ClientesPresenter from "../../presenters/ClientesPresenter";
import { useParams } from "react-router-dom";
import ClientesGetById from "../../useCases/clientes/ClientesGetById";
import { toast } from "sonner";

export default function ClienteEditPage() {
    const [cliente, setCliente] = useState<ClientesPresenter>()
    const { idEmpresa, id } = useParams<{ idEmpresa: string; id: string }>()

    useEffect(() => {
        const fetchCliente = async () => {
            const getClienteById = new ClientesGetById()
            getClienteById.execute(idEmpresa as string, Number(id))
                .then((response) => {
                    setCliente(response)
                })
                .catch((err) => {
                    toast.error(err)
                })
        }
        fetchCliente()
    }, [idEmpresa, id])

    return (
        <ClienteForm cliente={cliente} />
    )
}

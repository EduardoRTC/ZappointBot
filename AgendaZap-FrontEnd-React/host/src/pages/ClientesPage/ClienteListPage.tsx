import { useCallback, useEffect, useState } from "react";
import { Column, GenericTable } from "../../components/GenericTable/GenericTable";
import ClientesPresenter from "../../presenters/ClientesPresenter";
import ClientesGetAll from "../../useCases/clientes/ClientesGetAll";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import { paths } from "../../paths";
import ClientesDelete from "../../useCases/clientes/ClientesDelete";
import { Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, Button } from "@mui/material";

export default function ClienteListPage() {
    const [clientes, setClientes] = useState<ClientesPresenter[]>([]);
    const { idEmpresa } = useParams<{ idEmpresa: string }>();
    const navigate = useNavigate();

    const [clienteToDelete, setClienteToDelete] = useState<ClientesPresenter | null>(null);
    const [openDialog, setOpenDialog] = useState(false);

    const columns: Column<ClientesPresenter>[] = [
        { field: "id", headerName: "ID" },
        { field: "nome", headerName: "Nome" },
        { field: "telefone", headerName: "Telefone" },
        { field: "email", headerName: "E-mail" },
    ];

    useEffect(() => {
        const fetchClientes = async () => {
            try {
                const clientesGetAll = new ClientesGetAll();
                const data = await clientesGetAll.execute(idEmpresa as string);
                setClientes(data);
            } catch (err) {
                toast.error(`${err}`);
            }
        };
        fetchClientes();
    }, [idEmpresa]);

    const onCreate = useCallback(() => {
        navigate(paths.cliente.create(idEmpresa as string));
    }, [navigate, idEmpresa]);

    const onConfirmDelete = useCallback(async () => {
        if (!clienteToDelete) return;
        try {
            const clientesDelete = new ClientesDelete();
            await clientesDelete.execute(idEmpresa as string, clienteToDelete.id as number);
            toast.success(`Cliente "${clienteToDelete.nome}" excluído com sucesso.`);

            const clientesGetAll = new ClientesGetAll();
            const data = await clientesGetAll.execute(idEmpresa as string);
            setClientes(data);
        } catch (err) {
            toast.error(`${err}`);
        } finally {
            setOpenDialog(false);
            setClienteToDelete(null);
        }
    }, [clienteToDelete, idEmpresa]);

    const onDelete = useCallback((cliente: ClientesPresenter) => {
        setClienteToDelete(cliente);
        setOpenDialog(true);
    }, []);

    const onEdit = useCallback((cliente: ClientesPresenter) => {
        navigate(paths.cliente.edit(idEmpresa as string, cliente.id as number))
    }, [navigate, idEmpresa]);

    return (
        <>
            <GenericTable
                title="Clientes"
                columns={columns}
                data={clientes}
                onCreate={onCreate}
                onDelete={onDelete}
                onEdit={onEdit}
                searchPlaceholder="Pesquisar Clientes..."
            />

            <Dialog open={openDialog} onClose={() => setOpenDialog(false)}>
                <DialogTitle>Confirmar exclusão</DialogTitle>
                <DialogContent>
                    <DialogContentText>
                        Tem certeza que deseja excluir o cliente{" "}
                        <strong>{clienteToDelete?.nome}</strong>?
                    </DialogContentText>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setOpenDialog(false)} color="inherit">
                        Cancelar
                    </Button>
                    <Button onClick={onConfirmDelete} color="error" variant="contained">
                        Excluir
                    </Button>
                </DialogActions>
            </Dialog>
        </>
    );
}

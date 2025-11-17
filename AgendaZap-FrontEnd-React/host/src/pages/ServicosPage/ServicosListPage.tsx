import { useCallback, useEffect, useState } from "react";
import { Column, GenericTable } from "../../components/GenericTable/GenericTable";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import { Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, Button } from "@mui/material";
import { paths } from "../../paths";
import { ServicosPresenter } from "../../presenters/ServicosPresenter";
import ServicoDelete from "../../useCases/servico/ServicoDelete";
import ServicoGetAll from "../../useCases/servico/ServicoGetAll";

export default function ServicosListPage() {
    const [servicos, setServicos] = useState<ServicosPresenter[]>([]);
    const { idEmpresa } = useParams<{ idEmpresa: string }>();
    const navigate = useNavigate();

    const [servicoToDelete, setServicoToDelete] = useState<ServicosPresenter | null>(null);
    const [openDialog, setOpenDialog] = useState(false);

    const columns: Column<ServicosPresenter>[] = [
        { field: "id", headerName: "ID" },
        { field: "descricao", headerName: "Descrição" },
        { field: "valor", headerName: "Valor" },
        { field: "tempoDuracao", headerName: "Tempo de Duração" },
    ];

    useEffect(() => {
        const fetchServicos = async () => {
            try {
                const servicosGetAll = new ServicoGetAll();
                const data = await servicosGetAll.execute(idEmpresa as string);
                setServicos(data);
            } catch (err) {
                toast.error(`${err}`);
            }
        };
        fetchServicos();
    }, [idEmpresa]);

    const onCreate = useCallback(() => {
        navigate(paths.servico.create(idEmpresa as string));
    }, [navigate, idEmpresa]);

    const onEdit = useCallback((servico: ServicosPresenter) => {
        navigate(paths.servico.edit(idEmpresa as string, servico.id as number));
    }, [navigate, idEmpresa]);

    const onDelete = useCallback((servico: ServicosPresenter) => {
        setServicoToDelete(servico);
        setOpenDialog(true);
    }, []);

    const onConfirmDelete = useCallback(async () => {
        if (!servicoToDelete) return;

        try {
            const servicosDelete = new ServicoDelete();
            await servicosDelete.execute(idEmpresa as string, servicoToDelete.id as number);
            toast.success(`Serviço "${servicoToDelete.descricao}" excluído com sucesso.`);

            const servicosGetAll = new ServicoGetAll();
            const data = await servicosGetAll.execute(idEmpresa as string);
            setServicos(data);
        } catch (err) {
            toast.error(`${err}`);
        } finally {
            setOpenDialog(false);
            setServicoToDelete(null);
        }
    }, [servicoToDelete, idEmpresa]);

    return (
        <>
            <GenericTable
                title="Serviços"
                columns={columns}
                data={servicos}
                onCreate={onCreate}
                onEdit={onEdit}
                onDelete={onDelete}
                searchPlaceholder="Pesquisar Serviços..."
            />

            <Dialog open={openDialog} onClose={() => setOpenDialog(false)}>
                <DialogTitle>Confirmar exclusão</DialogTitle>
                <DialogContent>
                    <DialogContentText>
                        Tem certeza que deseja excluir o serviço <strong>{servicoToDelete?.descricao}</strong>?
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

import { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { GenericTable, Column } from "../../components/GenericTable/GenericTable";
import { TFuncionario } from "../../types/TFuncionario";
import UsuarioGetAll from "../../useCases/usuario/usuarioGetAll";
import UsuarioDelete from "../../useCases/usuario/UsuarioDelete";
import { paths } from "../../paths";
import {
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Button,
} from "@mui/material";
import { toast } from "sonner";

export default function FuncionariosListPage() {
  const { idEmpresa } = useParams<{ idEmpresa: string }>();
  const [funcionarios, setFuncionarios] = useState<TFuncionario[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [funcionarioToDelete, setFuncionarioToDelete] = useState<TFuncionario | null>(null);
  const [openDialog, setOpenDialog] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchFuncionarios = async () => {
      if (!idEmpresa) {
        setError("ID da empresa não encontrado na URL.");
        setLoading(false);
        return;
      }

      try {
        const useCase = new UsuarioGetAll();
        const data = await useCase.execute(idEmpresa);
        setFuncionarios(data);
      } catch (err: any) {
        console.error(err);
        setError("Erro ao carregar funcionários.");
      } finally {
        setLoading(false);
      }
    };

    fetchFuncionarios();
  }, [idEmpresa]);

  const columns: Column<TFuncionario>[] = [
    { field: "id", headerName: "ID" },
    { field: "nomeInteiro", headerName: "Nome Completo" },
    { field: "nomeUsuario", headerName: "Nome de usuário" },
    { field: "cpf", headerName: "CPF" },
    { field: "email", headerName: "E-mail" },
  ];

  const handleEdit = useCallback(
    (funcionario: TFuncionario) => {
      navigate(paths.funcionarios.edit(idEmpresa as string, funcionario.id));
    },
    [navigate, idEmpresa]
  );

  const handleDelete = useCallback((funcionario: TFuncionario) => {
    setFuncionarioToDelete(funcionario);
    setOpenDialog(true);
  }, []);

  const handleConfirmDelete = useCallback(async () => {
    if (!funcionarioToDelete || !idEmpresa) return;

    try {
      const usuarioDelete = new UsuarioDelete();
      await usuarioDelete.execute(idEmpresa, funcionarioToDelete.id);

      toast.success(`Funcionário "${funcionarioToDelete.nomeInteiro}" excluído com sucesso.`);

      const useCase = new UsuarioGetAll();
      const data = await useCase.execute(idEmpresa);
      setFuncionarios(data);
    } catch (error) {
      console.error("Erro ao excluir funcionário:", error);
      toast.error("Erro ao excluir funcionário.");
    } finally {
      setOpenDialog(false);
      setFuncionarioToDelete(null);
    }
  }, [funcionarioToDelete, idEmpresa]);

  const handleCreate = useCallback(() => {
    navigate(paths.funcionarios.create(idEmpresa as string));
  }, [navigate, idEmpresa]);

  if (loading) return <p>Carregando funcionários...</p>;
  if (error) return <p>{error}</p>;

  return (
    <>
      <GenericTable
        title="Funcionários"
        columns={columns}
        data={funcionarios}
        onEdit={handleEdit}
        onDelete={handleDelete}
        searchPlaceholder="Buscar funcionário..."
        onCreate={handleCreate}
      />

      <Dialog open={openDialog} onClose={() => setOpenDialog(false)}>
        <DialogTitle>Confirmar exclusão</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Tem certeza que deseja excluir o funcionário{" "}
            <strong>{funcionarioToDelete?.nomeInteiro}</strong>?
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)} color="inherit">
            Cancelar
          </Button>
          <Button onClick={handleConfirmDelete} color="error" variant="contained">
            Excluir
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}

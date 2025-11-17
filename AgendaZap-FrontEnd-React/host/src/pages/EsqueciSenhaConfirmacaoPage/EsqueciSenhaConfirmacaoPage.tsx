import { useParams, useNavigate } from "react-router-dom";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Logo } from "../../components/Logo/Logo";
import "./EsqueciSenhaConfirmacaoPage.css";
import { UseVerificaEmpresa } from "../../hooks/UseVerificaEmpresa";
import { toast } from "sonner";
import * as z from "zod";
import { TextField, Button, Stack } from "@mui/material";
import UsuarioUpdateSenhaPorNome from "../../useCases/usuario/UsuarioUpdateSenhaPorNome";
import { paths } from "../../paths";

// === Schema de validação ===
const UpdateSenhaSchema = z.object({
  nomeUsuario: z.string().min(3, "Informe o nome de usuário"),
  senha: z.string().min(6, "A senha deve ter no mínimo 6 caracteres"),
});

type UpdateSenhaFormType = z.infer<typeof UpdateSenhaSchema>;

export const EsqueciSenhaConfirmacaoPage = () => {
  const { idEmpresa } = useParams<{ idEmpresa: string }>();
  const navigate = useNavigate();

  if (idEmpresa) {
    UseVerificaEmpresa(idEmpresa);
  }

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<UpdateSenhaFormType>({
    resolver: zodResolver(UpdateSenhaSchema),
  });

  const onSubmit = async (data: UpdateSenhaFormType) => {
    if (!idEmpresa) return;

    const useCase = new UsuarioUpdateSenhaPorNome();
    try {
      await useCase.execute(idEmpresa, data);
      toast.success("Senha atualizada com sucesso!");
      navigate(paths.home.login(idEmpresa as string));
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Erro ao atualizar senha");
    }
  };

  const onCancel = () => {
    navigate(paths.home.login(idEmpresa as string));
  };

  return (
    <div className="confirmacao-senha">
      <form className="container confirmacao-senha__form" onSubmit={handleSubmit(onSubmit)}>
        <Logo />
        <div className="balao-texto">
          Insira o nome do usuário a ser redefinido.
        </div>
        <div className="confirmacao-senha__inputs">
          <Stack spacing={2}>
            <Controller
              name="nomeUsuario"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  label="Usuário"
                  variant="outlined"
                  fullWidth
                  error={!!errors.nomeUsuario}
                  helperText={errors.nomeUsuario?.message}
                  sx={{
                    backgroundColor: "#424D6F",
                    borderRadius: 2,
                    "& .MuiInputBase-input": {
                      color: "#FFFF", // Cor do texto digitado
                    },
                  }}
                  InputProps={{
                    sx: {
                      borderRadius: 2,
                    },
                  }}
                />
              )}
            />

            <Controller
              name="senha"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  type="password"
                  label="Nova Senha"
                  variant="outlined"
                  fullWidth
                  error={!!errors.senha}
                  helperText={errors.senha?.message}
                  sx={{
                    backgroundColor: "#424D6F",
                    borderRadius: 2,
                    "& .MuiInputBase-input": {
                      color: "#FFFF", // Cor do texto digitado
                    },
                  }}
                  InputProps={{
                    sx: {
                      borderRadius: 2,
                    },
                  }}
                />
              )}
            />


            <Stack direction="row" spacing={2} justifyContent="flex-end">
              <Button
                variant="contained"
                color="error"
                size="medium"
                sx={{ minWidth: 120 }}
                onClick={onCancel}
              >
                Cancelar
              </Button>

              <Button
                type="submit"
                variant="contained"
                color="primary"
                size="medium"
                sx={{ minWidth: 120 }}
                disabled={isSubmitting}
              >
                Enviar
              </Button>
            </Stack>
          </Stack>
        </div>
      </form>
    </div>
  );
};

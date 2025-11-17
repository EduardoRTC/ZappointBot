import { useCallback, useEffect } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
    Button,
    Stack,
    TextField,
    FormControlLabel,
    Typography,
    MenuItem,
    Select,
    FormControl,
    InputLabel,
    Checkbox,
    Card,
} from "@mui/material";
import { toast } from "sonner";
import { IMaskInput } from "react-imask";
import { FuncionarioSchema, type FuncionarioSchemaType } from "../../../schema/FuncionarioSchema";
import { Cargo } from "../../../enum/Cargo";
import { FuncionariosPresenter } from "../../../Presenters/FuncionariosPresenter";
import UsuarioCreate from "../../../usuario/UsuarioCreate";

type TFuncionarioFormProps = {
    idEmpresa: string;
    funcionario?: FuncionariosPresenter;
    cancel: () => void;
};

export default function FuncionarioForm({ idEmpresa, funcionario, cancel }: TFuncionarioFormProps) {
    const {
        register,
        handleSubmit,
        formState: { errors },
        reset,
        control,
    } = useForm<FuncionariosPresenter>({
        resolver: zodResolver(FuncionarioSchema),
        defaultValues: new FuncionariosPresenter(),
    });

    useEffect(() => {
        if (funcionario) {
            reset({
                ...funcionario,
                idEmpresa: idEmpresa ?? funcionario.idEmpresa,
            });
        } else {
            reset({
                ...new FuncionariosPresenter(),
                idEmpresa: idEmpresa ?? "",
                profissionalSaude: {
                    tipoConselho: "",
                    registroConselho: "",
                    especialidade: "",
                },
            });
        }
    }, [funcionario, idEmpresa, reset]);

    const onSubmit = async (data: FuncionarioSchemaType) => {
        try {
            const cleanedData = {
                ...data,
                cpf: data.cpf?.replace(/\D/g, ""),
            };

            if (funcionario) {
                console.log("Atualizando funcionário:", cleanedData);
            } else {
                const usuarioCreate = new UsuarioCreate();
                await usuarioCreate.execute(idEmpresa as string, cleanedData);
            }

            toast.success("Funcionário salvo com sucesso!");
            cancel()
        } catch (err: any) {
            console.error("Erro ao salvar funcionário:", err);
            toast.error(err || "Erro ao salvar funcionário. Tente novamente.");
        }
    };

    const onCancel = useCallback(() => {
        cancel()
    }, [idEmpresa]);

    return (
        <Card
            sx={{
                maxWidth: 600,
                mx: "auto",
                p: 4,
                borderRadius: 2,
                boxShadow: 3,
            }}
        >
            <Typography variant="h5" mb={3} textAlign="center">
                {funcionario ? "Editar Funcionário" : "Adicionar Funcionário Clinica"}
            </Typography>

            <form onSubmit={handleSubmit(onSubmit)}>
                <Stack spacing={3}>
                    <TextField
                        label="Nome de Usuário"
                        {...register("nomeUsuario")}
                        error={!!errors.nomeUsuario}
                        helperText={errors.nomeUsuario?.message}
                        InputLabelProps={{ shrink: true }}
                        inputProps={{ maxLength: 50 }}
                        fullWidth
                    />

                    <TextField
                        label="Nome Completo"
                        {...register("nomeInteiro")}
                        error={!!errors.nomeInteiro}
                        helperText={errors.nomeInteiro?.message}
                        InputLabelProps={{ shrink: true }}
                        inputProps={{ maxLength: 255 }}
                        fullWidth
                    />

                    <Controller
                        name="cpf"
                        control={control}
                        render={({ field }) => (
                            <TextField
                                label="CPF"
                                {...field}
                                InputProps={{
                                    inputComponent: IMaskInput as any,
                                    inputProps: {
                                        mask: "000.000.000-00",
                                        value: field.value,
                                        onAccept: (value: string) => field.onChange(value),
                                    },
                                }}
                                error={!!errors.cpf}
                                helperText={errors.cpf?.message}
                                InputLabelProps={{ shrink: true }}
                                fullWidth
                            />
                        )}
                    />

                    <TextField
                        label="Senha"
                        type="password"
                        {...register("senha")}
                        error={!!errors.senha}
                        helperText={errors.senha?.message}
                        InputLabelProps={{ shrink: true }}
                        fullWidth
                    />

                    <TextField
                        label="Email"
                        {...register("email")}
                        error={!!errors.email}
                        helperText={errors.email?.message}
                        InputLabelProps={{ shrink: true }}
                        inputProps={{ maxLength: 255 }}
                        fullWidth
                    />

                    <FormControl fullWidth>
                        <InputLabel id="idCargo-label">Cargo</InputLabel>
                        <Select
                            labelId="idCargo-label"
                            defaultValue={funcionario?.idCargo ?? Cargo.USER}
                            {...register("idCargo", { valueAsNumber: true })}
                        >
                            {Object.entries(Cargo)
                                .filter(([_, v]) => typeof v === "number")
                                .map(([key, value]) => (
                                    <MenuItem key={value} value={value}>
                                        {key}
                                    </MenuItem>
                                ))}
                        </Select>
                    </FormControl>

                    <Controller
                        name="statusUsuario"
                        control={control}
                        render={({ field }) => (
                            <FormControlLabel
                                control={
                                    <Checkbox
                                        {...field}
                                        checked={field.value}
                                        onChange={(e) => field.onChange(e.target.checked)}
                                    />
                                }
                                label="Ativo"
                            />
                        )}
                    />

                    <Card variant="outlined" sx={{ p: 2 }}>
                        <Typography variant="subtitle1" mb={2}>
                            Dados do Profissional de Saúde
                        </Typography>

                        <TextField
                            label="Tipo de Conselho"
                            {...register("profissionalSaude.tipoConselho")}
                            error={!!errors.profissionalSaude?.tipoConselho}
                            helperText={errors.profissionalSaude?.tipoConselho?.message}
                            fullWidth
                        />

                        <TextField
                            label="Registro no Conselho"
                            {...register("profissionalSaude.registroConselho")}
                            error={!!errors.profissionalSaude?.registroConselho}
                            helperText={errors.profissionalSaude?.registroConselho?.message}
                            fullWidth
                        />

                        <TextField
                            label="Especialidade"
                            {...register("profissionalSaude.especialidade")}
                            error={!!errors.profissionalSaude?.especialidade}
                            helperText={errors.profissionalSaude?.especialidade?.message}
                            fullWidth
                        />
                    </Card>

                    <Stack direction="row" spacing={2} justifyContent="flex-end" mt={2}>
                        <Button
                            variant="contained"
                            sx={{ backgroundColor: "#0F1938" }}
                            type="submit"
                        >
                            Salvar
                        </Button>
                        <Button
                            variant="outlined"
                            color="inherit"
                            onClick={onCancel}
                        >
                            Cancelar
                        </Button>
                    </Stack>
                </Stack>
            </form>
        </Card>
    );
}

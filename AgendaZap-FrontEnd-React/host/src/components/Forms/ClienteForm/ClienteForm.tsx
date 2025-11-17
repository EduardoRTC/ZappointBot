import { useCallback, useEffect } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
    Button,
    Stack,
    TextField,
    FormControlLabel,
    Typography,
    Checkbox,
    Card,
} from "@mui/material";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import { IMaskInput } from "react-imask";
import ClientesPresenter from "../../../presenters/ClientesPresenter";
import { paths } from "../../../paths";
import { ClienteSchema, ClienteSchemaType } from "../../../schema/ClienteSchema";
import ClientesCreate from "../../../useCases/clientes/ClientesCreate";
import ClientesUpdate from "../../../useCases/clientes/ClientesUpdate";


type TClienteFormProps = {
    cliente?: ClientesPresenter;
};

export default function ClienteForm({ cliente }: TClienteFormProps) {
    const navigate = useNavigate();
    const { idEmpresa } = useParams<{ idEmpresa: string }>();

    const {
        register,
        handleSubmit,
        control,
        formState: { errors },
        reset,
    } = useForm<ClientesPresenter>({
        resolver: zodResolver(ClienteSchema),
        defaultValues: new ClientesPresenter(),
    });

    useEffect(() => {
        if (cliente) {
            reset({
                ...cliente,
            });
        } else {
            reset(new ClientesPresenter());
        }
    }, [cliente, reset]);

    const onSubmit = async (data: ClienteSchemaType) => {
        try {
            const cleanedData: ClientesPresenter = {
                ...data,
                cpf: data.cpf?.replace(/\D/g, ""),
                telefone: data.telefone?.replace(/\D/g, ""),
            };

            if (cliente) {
                const clienteUpdate = new ClientesUpdate()
                await clienteUpdate.execute(idEmpresa as string, cliente.id as number, cleanedData)
            } else {
                const clienteCreate = new ClientesCreate();
                await clienteCreate.execute(idEmpresa as string, cleanedData);
            }

            toast.success("Cliente salvo com sucesso!");
            navigate(paths.cliente.list(idEmpresa as string));
        } catch (err: any) {
            console.error("Erro ao salvar cliente:", err);
            toast.error(err || "Erro ao salvar cliente. Tente novamente.");
        }
    };

    const onCancel = useCallback(() => {
        navigate(paths.cliente.list(idEmpresa as string));
    }, [navigate, idEmpresa]);

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
                {cliente ? "Editar Cliente" : "Adicionar Cliente"}
            </Typography>

            <form onSubmit={handleSubmit(onSubmit)}>
                <Stack spacing={3}>
                    <TextField
                        label="Nome"
                        {...register("nome")}
                        error={!!errors.nome}
                        helperText={errors.nome?.message}
                        fullWidth
                        InputLabelProps={{ shrink: true }}
                    />

                    <Controller
                        name="telefone"
                        control={control}
                        render={({ field }) => (
                            <TextField
                                label="Telefone"
                                {...field}
                                InputProps={{
                                    inputComponent: IMaskInput as any,
                                    inputProps: {
                                        mask: "(00) 00000-0000",
                                        value: field.value,
                                        onAccept: (value: string) => field.onChange(value),
                                    },
                                }}
                                error={!!errors.telefone}
                                helperText={errors.telefone?.message}
                                InputLabelProps={{ shrink: true }}
                                fullWidth
                            />
                        )}
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
                        label="E-mail"
                        {...register("email")}
                        error={!!errors.email}
                        helperText={errors.email?.message}
                        fullWidth
                        InputLabelProps={{ shrink: true }}
                    />

                    <TextField
                        label="Data de Nascimento"
                        type="date"
                        {...register("dataNascimento")}
                        error={!!errors.dataNascimento}
                        helperText={errors.dataNascimento?.message}
                        InputLabelProps={{ shrink: true }}
                        fullWidth
                    />

                    <TextField
                        label="Observação"
                        {...register("observacao")}
                        multiline
                        rows={3}
                        fullWidth
                        InputLabelProps={{ shrink: true }}
                    />

                    <Controller
                        name="statusCliente"
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

                    <Stack direction="row" spacing={2} justifyContent="flex-end" mt={2}>
                        <Button
                            variant="contained"
                            sx={{ backgroundColor: "#0F1938" }}
                            type="submit"
                        >
                            Salvar
                        </Button>
                        <Button variant="outlined" color="inherit" onClick={onCancel}>
                            Cancelar
                        </Button>
                    </Stack>
                </Stack>
            </form>
        </Card>
    );
}

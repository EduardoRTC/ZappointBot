import { useCallback, useEffect } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
    Box,
    Button,
    Stack,
    TextField,
    Typography,
    Card,
    FormControlLabel,
    Checkbox,
} from "@mui/material";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import { IMaskInput } from "react-imask";
import { paths } from "../../../paths";
import { ServicosPresenter } from "../../../presenters/ServicosPresenter";
import { ServicoSchema, ServicoSchemaType } from "../../../schema/ServicoSchema";
import ServicoCreate from "../../../useCases/servico/ServicoCreate";
import ServicoUpdate from "../../../useCases/servico/ServicoUpdate";

type TServicoFormProps = {
    servico?: ServicosPresenter;
};

export default function ServicoForm({ servico }: TServicoFormProps) {
    const navigate = useNavigate();
    const { idEmpresa } = useParams<{ idEmpresa: string }>();

    const {
        register,
        handleSubmit,
        formState: { errors },
        reset,
        control,
    } = useForm<ServicosPresenter>({
        resolver: zodResolver(ServicoSchema),
        defaultValues: new ServicosPresenter(),
    });

    useEffect(() => {
        if (servico) {
            reset({ ...servico });
        } else {
            reset(new ServicosPresenter());
        }
    }, [servico, reset]);

    const onSubmit = async (data: ServicoSchemaType) => {
        try {
            if (servico) {
                const servicoUpdate = new ServicoUpdate();
                await servicoUpdate.execute(idEmpresa as string, servico.id as number, data);
            } else {
                const servicoCreate = new ServicoCreate();
                await servicoCreate.execute(idEmpresa as string, data);
            }

            toast.success("Serviço salvo com sucesso!");
            navigate(paths.servico.list(idEmpresa as string));
        } catch (err: any) {
            console.error("Erro ao salvar serviço:", err);
            toast.error(err || "Erro ao salvar serviço. Tente novamente.");
        }
    };



    const onCancel = useCallback(() => {
        navigate(paths.servico.list(idEmpresa as string));
    }, [navigate, idEmpresa]);

    return (
        <Card
            sx={{
                maxWidth: 600,
                mx: "auto",
                mt: 6,
                p: 4,
                borderRadius: 2,
                boxShadow: 3,
            }}
        >
            <Typography variant="h5" mb={3} textAlign="center">
                {servico ? "Editar Serviço" : "Adicionar Serviço"}
            </Typography>

            <form onSubmit={handleSubmit(onSubmit)}>
                <Stack spacing={3}>
                    <TextField
                        label="Descrição"
                        {...register("descricao")}
                        error={!!errors.descricao}
                        helperText={errors.descricao?.message}
                        InputLabelProps={{ shrink: true }}
                        fullWidth
                    />

                    <Controller
                        name="valor"
                        control={control}
                        render={({ field }) => (
                            <TextField
                                label="Valor"
                                type="number"
                                {...field}
                                onChange={(e) => field.onChange(Number(e.target.value))}
                                error={!!errors.valor}
                                helperText={errors.valor?.message}
                                InputLabelProps={{ shrink: true }}
                                fullWidth
                            />
                        )}
                    />

                    <Controller
                        name="tempoDuracao"
                        control={control}
                        render={({ field }) => (
                            <TextField
                                label="Tempo de Duração"
                                {...field}
                                InputProps={{
                                    inputComponent: IMaskInput as any,
                                    inputProps: {
                                        mask: "00:00",
                                        value: field.value?.slice(0, 5) ?? "",
                                        onAccept: (value: string) => field.onChange(value),
                                        onKeyDown: (e: KeyboardEvent) => {
                                            const input = e.target as HTMLInputElement;
                                            const cursor = input.selectionStart ?? 0;

                                            // impede apagar o ':' com Backspace ou Delete
                                            if (
                                                (e.key === "Backspace" && input.value[cursor - 1] === ":") ||
                                                (e.key === "Delete" && input.value[cursor] === ":")
                                            ) {
                                                e.preventDefault();
                                            }
                                        },
                                    },
                                }}
                                error={!!errors.tempoDuracao}
                                helperText={errors.tempoDuracao?.message}
                                InputLabelProps={{ shrink: true }}
                                fullWidth
                            />
                        )}
                    />


                    <Controller
                        name="status"
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
                        <Button variant="contained" sx={{ backgroundColor: "#0F1938" }} type="submit">
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
